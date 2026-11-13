class Component extends DCLogic {
chatData() { return __DATA__; }
getLang() { const s = this.state || {}; if (s.lang) return s.lang; try { const v = window.localStorage.getItem('yoolmi-lang'); if (v === 'ko' || v === 'es') return v; } catch (e) {} return this.props.lang ?? 'ko'; }
__HELPERS__
ctLoad() { if (this._st) return this._st; let o = {}; try { window.localStorage.removeItem('yoolmi-chat-v1'); window.localStorage.removeItem('yoolmi-chat-v2'); } catch (e) {} ['ym', 'da', 'so', 'to'].forEach((b) => { const x = o[b] && typeof o[b] === 'object' ? o[b] : {}; o[b] = { m: Array.isArray(x.m) ? x.m : [], seen: x.seen | 0, chips: Array.isArray(x.chips) ? x.chips : null, qh: Array.isArray(x.qh) ? x.qh : [] }; }); this._st = o; return o; }
ctSave() { const o = this.ctLoad(); Object.keys(o).forEach((b) => { if (o[b].m.length > 80) { const cut = o[b].m.length - 80; o[b].m = o[b].m.slice(cut); o[b].seen = Math.max(0, o[b].seen - cut); } }); }
ctScroll() { [30, 160, 420].forEach((d) => setTimeout(() => { try { const b = document.getElementById('ct-scroll'); if (b) b.scrollTop = b.scrollHeight; } catch (e) {} }, d)); }
ctBump() { this.setState({ v: ((this.state || {}).v || 0) + 1 }); }
ctPush(b, msg) { const o = this.ctLoad(); msg.ts = Date.now(); o[b].m.push(msg); if (this._room === b) o[b].seen = o[b].m.length; this.ctSave(); this.ctBump(); this.ctScroll(); }
ctSay(b, parts, chips) {
  const q = this._q || (this._q = []); q.push({ b: b, parts: parts.slice(), chips: chips });
  if (!this._qRun) this.ctRun();
}
ctRun() {
  const q = this._q || []; const job = q[0]; if (!job) { this._qRun = false; this.setState({ typing: null }); return; }
  this._qRun = true;
  if (!job.parts.length) { q.shift(); if (job.chips) { const o = this.ctLoad(); o[job.b].chips = job.chips; this.ctSave(); } this.ctBump(); this.ctRun(); return; }
  const p = job.parts[0]; const txt = String(p.ko || p.kr || '') + (p.rows ? p.rows.length * 18 : 0);
  const fast = this._room !== job.b; const dl = fast ? 0 : Math.min(1100, 420 + String(txt).length * 8);
  this.setState({ typing: job.b }); this.ctScroll();
  this._qt = setTimeout(() => { job.parts.shift(); this.ctPush(job.b, { r: 'b', p: p }); this.ctRun(); }, dl);
}
ctFlush() { clearTimeout(this._qt); const q = this._q || []; const o = this.ctLoad(); while (q.length) { const j = q.shift(); j.parts.forEach((p) => o[j.b].m.push({ r: 'b', p: p, ts: Date.now() })); if (j.chips) o[j.b].chips = j.chips; } this._qRun = false; this.ctSave(); }
ctBusy() { return !!this._qRun; }
ctOpen(b, noHist) {
  const o = this.ctLoad(); const D = this.chatData()[b];
  this._room = b; this.setState({ room: b, inVal: '', clrOn: false, typing: null, ctLim: false });
  if (!noHist) { try { window.history.pushState({ ct: b }, '', '#' + b); this._pushed = true; } catch (e) {} }
  this._q = (this._q || []).filter((j) => j.b !== b); o[b] = { m: [], seen: 0, chips: null, qh: [] }; this.ctSay(b, D.greet, D.start);
  this.ctScroll();
  setTimeout(() => { try { const b2 = document.getElementById('ct-scroll'); if (b2) b2.scrollTop = b2.scrollHeight; } catch (e) {} }, 0);
}
ctBack() { this.ctFlush(); const S = this.state || {}; const o = this.ctLoad(); if (S.room) { o[S.room].seen = o[S.room].m.length; this.ctSave(); } if (this._pushed) { this._pushed = false; try { window.history.back(); } catch (e) {} } this._room = null; this.setState({ room: null, clrOn: false, typing: null, inVal: '' }); }
ctAsk(b, id) {
  if (this.ctBusy()) return; if ((this.state || {}).ctLim) this.setState({ ctLim: false }); const D = this.chatData()[b]; const o = this.ctLoad();
  if (id === '__all') { this.ctPush(b, { r: 'u', ko: '다른 질문 보기', es: 'Ver otras preguntas' }); this.ctSay(b, [{ k: 't', ko: '아래에서 골라 주세요.', es: 'Elige una pregunta abajo.' }], D.order.slice()); return; }
  if (id === '__quiz') { this.ctPush(b, { r: 'u', ko: '한 문제 더!', es: '¡Otra pregunta!' }); this.ctQuiz(b); return; }
  const tp = D.topics[id]; if (!tp) return;
  this.ctPush(b, { r: 'u', ko: tp.q[0], es: tp.q[1] });
  this.ctAnswer(b, id);
}
ctAnswer(b, id) {
  const D = this.chatData()[b]; const tp = D.topics[id];
  if (tp.quiz) { this.ctQuiz(b); return; }
  if (tp.phrase) { const ph = D.phrases[Math.floor(Math.random() * D.phrases.length)]; this.ctSay(b, [{ k: 't', ko: '오늘의 한마디! 스피커를 눌러서 따라 해 봐.', es: '¡La frase de hoy! Toca el altavoz y repítela.' }, { k: 'ex', kr: ph.kr, rom: ph.rom, es: ph.es }], tp.next.concat(['__all'])); return; }
  if (tp.cheer) { const c = D.cheers[Math.floor(Math.random() * D.cheers.length)]; this.ctSay(b, [{ k: 't', ko: c[0], es: c[1] }], tp.next.concat(['__all'])); return; }
  const nx = (tp.next || []).filter((x) => x !== id); this.ctSay(b, tp.a, nx.concat(['__all']));
}
ctQuiz(b) {
  const D = this.chatData()[b]; const o = this.ctLoad(); const Q = D.quiz || []; if (!Q.length) return;
  const qh = o[b].qh || []; let pool = Q.map((x, i) => i).filter((i) => qh.indexOf(i) < 0); if (!pool.length) pool = Q.map((x, i) => i);
  const i = pool[Math.floor(Math.random() * pool.length)]; o[b].qh = qh.concat([i]).slice(-Math.min(6, Q.length - 1)); o[b].chips = [];
  this.ctSave(); this.ctSay(b, [{ k: 'quiz', i: i, pick: -1 }], []);
}
ctPick(b, mi, oi) {
  const o = this.ctLoad(); const m = o[b].m[mi]; if (!m || !m.p || m.p.k !== 'quiz' || m.p.pick >= 0 || this.ctBusy()) return;
  const qz = this.chatData()[b].quiz[m.p.i]; m.p.pick = oi; this.ctSave();
  this.ctPush(b, { r: 'u', ko: qz.opts[oi], es: qz.opts[oi] });
  const ok = oi === qz.ans;
  const good = [['정답이에요!', '¡Correcto!'], ['맞았어요! 잘했어요.', '¡Bien! Lo has hecho genial.'], ['완벽해요!', '¡Perfecto!']];
  const g = good[Math.floor(Math.random() * good.length)];
  const head = ok ? { k: 't', ko: g[0], es: g[1] } : { k: 't', ko: '아쉬워요! 정답은 「' + qz.opts[qz.ans] + '」이에요.', es: '¡Casi! La respuesta es «' + qz.opts[qz.ans] + '».' };
  try { const k = 'yoolmi-chat-score'; const sc = JSON.parse(window.localStorage.getItem(k) || '{}') || {}; const r = sc[b] || [0, 0]; r[0] += ok ? 1 : 0; r[1] += 1; sc[b] = r; window.localStorage.setItem(k, JSON.stringify(sc)); } catch (e) {}
  this.ctSay(b, [head, { k: 'tip', ko: qz.ex[0], es: qz.ex[1] }], ['__quiz', '__all']);
}
ctClear(b) { this.ctFlush(); const o = this.ctLoad(); o[b] = { m: [], seen: 0, chips: null, qh: [] }; this.ctSave(); this.setState({ clrOn: false }); const D = this.chatData()[b]; this.ctSay(b, D.greet, D.start); }
ctHgN(s) { return (String(s || '').match(/[가-힣ㄱ-ㅣ]/g) || []).length; }
ctHgCap(s, n) { let k = 0, o = ''; for (const ch of String(s || '')) { if (/[가-힣ㄱ-ㅣ]/.test(ch)) { if (k >= n) continue; k++; } o += ch; } return o; }
ctBad(s) {
  const raw = String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');
  const sq = raw.replace(/[\s.,!?¡¿~*_\-+=|/\\'"`^0-9]/g, '');
  const KO = ['시발', '씨발', '씨바', '씨빨', '시빨', '쉬발', '슈발', 'ㅅㅂ', 'ㅆㅂ', 'ㅅㅃ', '씹새', '씹년', '씹할', '씹창', '좆', 'ㅈ같', '존나', 'ㅈㄴ', '병신', '븅신', '빙신', 'ㅂㅅ', '개새', '개색', '개세', '개쉐', '개년', '새끼야', 'ㅅㄲ', '미친놈', '미친년', '미친새', 'ㅁㅊ', '닥쳐', '꺼져', '엿먹', '지랄', 'ㅈㄹ', '염병', '니애미', '느금', '애미', '애비', '섹스', '쎅스', '섹시', '야동', '강간', '창녀', '걸레년', '딸딸', '자위', '변태', '꼴려', '젖꼭', '성기', '보짓', '자짓', '보지털', '좇', '죶', '썅', '쌍년', '쌍놈', '호로', '후장', '고자'];
  const ES = ['culo', 'puta', 'puto', 'mierda', 'joder', 'jodete', 'pendej', 'cabron', 'verga', 'cono', 'culero', 'chinga', 'marica', 'maricon', 'zorra', 'sexo', 'porno', 'pene', 'vagina', 'tetas', 'follar', 'idiota', 'estupid', 'imbecil', 'malparid', 'hijueputa', 'hdp', 'fuck', 'shit', 'bitch', 'porn', 'dick', 'pussy', 'asshole', 'nigg'];
  if (KO.some((w) => sq.indexOf(w) >= 0)) return true;
  if (/(^|[^가-힣])(보지|자지)(?!\s*(마|말|않|못|도|는|를))($|[^가-힣])/.test(raw)) return true;
  const words = raw.split(/[^a-zñ]+/).filter(Boolean);
  if (ES.some((w) => w.length >= 5 ? sq.indexOf(w) >= 0 : words.some((x) => x === w || x === w + 's' || x === w + 'es'))) return true;
  return false;
}
ctLockLeft() { let t = 0; try { t = parseInt(window.localStorage.getItem('yoolmi-chat-lock') || '0', 10) || 0; } catch (e) {} return Math.max(0, Math.ceil((t - Date.now()) / 1000)); }
ctStrike() { let n = 0; try { const o = JSON.parse(window.localStorage.getItem('yoolmi-chat-strike') || '{}') || {}; n = (Date.now() - (o.t || 0) < 3600000 ? (o.n || 0) : 0) + 1; window.localStorage.setItem('yoolmi-chat-strike', JSON.stringify({ n: n, t: Date.now() })); if (n >= 3) { window.localStorage.setItem('yoolmi-chat-lock', String(Date.now() + 60000)); window.localStorage.setItem('yoolmi-chat-strike', JSON.stringify({ n: 0, t: Date.now() })); } } catch (e) {} return n; }
ctLockTick() { clearInterval(this._lkI); this._lkI = setInterval(() => { const s = this.ctLockLeft(); this.setState({ lk: s }); if (!s) clearInterval(this._lkI); }, 1000); }
ctPaid() { try { return window.localStorage.getItem('yoolmi-paid') === '1'; } catch (e) { return false; } }
ctDay() { return new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10); }
ctQuota(b) { if (this.ctPaid()) return 99; let o = {}; try { o = JSON.parse(window.localStorage.getItem('yoolmi-chat-quota') || '{}') || {}; } catch (e) {} if (o.d !== this.ctDay()) o = {}; return Math.max(0, 3 - (o[b] || 0)); }
ctUse(b) { if (this.ctPaid()) return; let o = {}; try { o = JSON.parse(window.localStorage.getItem('yoolmi-chat-quota') || '{}') || {}; } catch (e) {} if (o.d !== this.ctDay()) o = { d: this.ctDay() }; o[b] = (o[b] || 0) + 1; try { window.localStorage.setItem('yoolmi-chat-quota', JSON.stringify(o)); } catch (e) {} }
ctNorm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC').replace(/[¿?¡!.,;:~()"'«»]/g, ' ').replace(/\s+/g, ' ').trim(); }
ctMatch(b, txt) { const D = this.chatData()[b]; const t1 = this.ctNorm(txt); const t2 = t1.replace(/ /g, ''); const tw = ' ' + t1 + ' '; let best = null, bs = 0; D.order.forEach((id) => { const tp = D.topics[id]; let s = 0; (tp.kw || []).forEach((k) => { const k1 = this.ctNorm(k); if (!k1) return; if (/^[a-z0-9 ]+$/.test(k1)) { if (tw.indexOf(' ' + k1) >= 0) s += k1.length + 1; } else if (t1.indexOf(k1) >= 0 || t2.indexOf(k1.replace(/ /g, '')) >= 0) s += k1.length; }); if (s > bs) { bs = s; best = id; } }); return bs >= 2 ? best : null; }
ctSend() {
  const S = this.state || {}; const b = S.room; if (!b) return; let v = '';
  try { const el = document.getElementById('ct-in'); if (el) v = el.value; } catch (e) {}
  v = String(v || S.inVal || '').trim(); if (!v || this.ctBusy()) return; if (!this.ctLockLeft() && !this.ctQuota(b)) { this.setState({ ctLim: 'quota' }); return; } v = [...v].slice(0, { ym: 50, da: 30, so: 30, to: 30 }[b] || 50).join(''); if (b === 'so' && this.ctHgN(v) > 9) { this.setState({ ctLim: true }); return; }
  try { const el = document.getElementById('ct-in'); if (el) el.value = ''; } catch (e) {}
  this.setState({ inVal: '', ctLim: false });
  if (this.ctLockLeft()) { this.ctLockTick(); return; }
  this.ctUse(b);
  if (this.ctBad(v)) { const n = this.ctStrike(); this.ctPush(b, { r: 'u', ko: '(가려진 메시지)', es: '(mensaje oculto)', hid: true }); const W = { to: ['그런 말은 싫어… 예쁜 말로 다시 말해 줄래?', 'No me gustan esas palabras… ¿Me lo dices bonito?'], ym: ['그런 말은 듣기 속상해요. 고운 말로 다시 이야기해 줄래요?', 'Esas palabras me ponen triste. ¿Me lo dices con palabras amables?'], da: ['그런 말은 대답할 수 없어요. 고운 말로 다시 물어봐 줄래요?', 'No puedo responder a eso. ¿Me preguntas con palabras amables?'], so: ['그런 말은 대답할 수 없어요. 예쁜 한국어로 연습해 봐요!', 'No puedo responder a eso. ¡Practiquemos con palabras bonitas!'] }[b]; const parts = [{ k: 't', ko: W[0], es: W[1] }]; if (n >= 3) { parts.push({ k: 'tip', ko: '나쁜 말이 반복돼서 1분 동안 채팅을 쉬어요.', es: 'Se repitieron malas palabras: el chat se pausa 1 minuto.' }); this.ctLockTick(); this.setState({ lk: this.ctLockLeft() }); } else if (n === 2) parts.push({ k: 'tip', ko: '한 번 더 나쁜 말을 쓰면 1분 동안 채팅을 쉬어야 해요.', es: 'Si vuelves a usar malas palabras, el chat se pausará 1 minuto.' }); this.ctSay(b, parts, this.chatData()[b].start); return; }
  this.ctPush(b, { r: 'u', txt: v.slice(0, 200) });
  const D = this.chatData()[b];
  if (b === 'da') { const w = v.replace(/\s+/g, ''); if (/^[가-힣]{1,6}다$/.test(w) && w !== '바다') { this.ctSay(b, this.ctConj(w), ['present', 'past', 'future', '__all']); return; } }
  const hit = this.ctMatch(b, v);
  if (hit) { this.ctAnswer(b, hit); return; }
  if (b === 'so') { const h = v.replace(/\s+/g, ''); if (/^[가-힣ㄱ-ㅣ]{1,9}$/.test(h)) { this.ctSay(b, this.ctDecomp(h), ['batchim', 'link', 'comp', '__all']); return; } }
  if (b === 'da' && /[가-힣]/.test(v)) { const w = v.match(/[가-힣]{1,6}다(?![가-힣])/); if (w && w[0] !== '바다') { this.ctSay(b, this.ctConj(w[0]), ['present', 'past', 'future', '__all']); return; } }
  const nm = { ym: ['율미쌤', 'la profe Yoolmi'], da: ['다니엘', 'Daniel'], so: ['소피아', 'Sofía'], to: ['토순이', 'Tosuni'] };
  for (const ob of ['ym', 'da', 'so', 'to']) { if (ob === b) continue; const h2 = this.ctMatch(ob, v); if (h2) { this.ctSay(b, [{ k: 't', ko: '그건 ' + nm[ob][0] + '에게 물어보면 더 잘 알려 줄 거예요.', es: nm[ob][1] + ' te lo puede explicar mejor.' }, { k: 'link', to: 'bot:' + ob + ':' + h2, ko: nm[ob][0] + '와 대화하기', es: 'Hablar con ' + nm[ob][1] }], D.fallnext.concat(['__all'])); return; } }
  this.ctSay(b, D.fallback, D.fallnext.concat(['__all']));
}
ctVoice() { try { const vs = window.speechSynthesis.getVoices() || []; return vs.find((v) => /ko[-_]KR/i.test(v.lang)) || vs.find((v) => /^ko/i.test(v.lang)) || null; } catch (e) { return null; } }
ctSpeak(text) { try { const ss = window.speechSynthesis; if (!ss) return; ss.cancel(); const u = new SpeechSynthesisUtterance(String(text)); u.lang = 'ko-KR'; u.rate = 0.82; const v = this.ctVoice(); if (v) u.voice = v; ss.speak(u); } catch (e) {} }
componentDidMount() {
  this._pop = () => { const S = this.state || {}; if (S.room) { this._pushed = false; this.ctFlush(); const o = this.ctLoad(); o[S.room].seen = o[S.room].m.length; this.ctSave(); this._room = null; this.setState({ room: null, clrOn: false, typing: null }); } };
  try { window.addEventListener('popstate', this._pop); } catch (e) {}
  try { const sp = new URLSearchParams(window.location.search); const c = sp.get('c') || (window.location.hash || '').replace('#', ''); if (['ym', 'da', 'so', 'to'].indexOf(c) >= 0) { try { window.history.replaceState(null, '', window.location.pathname + window.location.search.replace(/[?&]c=[a-z]+/, '')); } catch (e) {} setTimeout(() => this.ctOpen(c), 0); } } catch (e) {}
  try { window.speechSynthesis && window.speechSynthesis.getVoices(); } catch (e) {}
  if (this.ctLockLeft()) this.ctLockTick();
}
componentWillUnmount() { try { window.removeEventListener('popstate', this._pop); } catch (e) {} clearTimeout(this._qt); clearInterval(this._lkI); }
renderVals() { this.resetOnce(); this.thApply(); this.fontApply();
const lang = this.getLang(); const ko = lang === 'ko'; const S = this.state || {};
const L = (a) => (ko ? a[0] : a[1]); const L2 = (a) => (ko ? a[1] : a[0]);
const D = this.chatData(); const st = this.ctLoad();
const t = { back: ko ? '홈으로' : 'Volver a Inicio', homeS: ko ? '홈' : 'Inicio', title: ko ? '채팅' : 'Chat', title2: ko ? 'Chat' : '채팅', hint: ko ? '누구와 이야기할까요?' : '¿Con quién quieres hablar?', hint2: ko ? '¿Con quién quieres hablar?' : '누구와 이야기할까요?', chT: ko ? '율미쌤 채널' : 'Canales de Yoolmi', hpBtn: ko ? '홈페이지' : 'Página web', backList: ko ? '채팅 목록으로' : 'Volver a la lista', clr: ko ? '대화 지우기' : 'Borrar chat', clrQ: ko ? '대화를 지울까요?' : '¿Borrar este chat?', clrS: ko ? '이 친구와 나눈 대화가 모두 사라져요.' : 'Se borrarán todos los mensajes con esta persona.', cancel: ko ? '취소' : 'Cancelar', clrBtn: ko ? '지우기' : 'Borrar', today: ko ? '오늘 · Hoy' : 'Hoy · 오늘', listen: ko ? '듣기' : 'Escuchar', typing: ko ? '입력 중' : 'Escribiendo', chipsL: ko ? '추천 질문' : 'Preguntas sugeridas', sendL: ko ? '보내기' : 'Enviar' };
const AV = { ym: { img: true, src: '/_blob/1afbbd2c2d668fe335e3bd137c0151e0', imgW: '84%', imgMb: '-2%', mt: '' }, to: { img: true, src: '/_blob/2edc7da400f67364cabb2f330021b520', imgW: '108%', imgMb: '-50%', mt: '' }, da: { img: true, src: '/_blob/5455d3f070fd6ede3ddb1df17d39a792', imgW: '98%', imgMb: '-24%', mt: '' }, so: { img: true, src: '/_blob/cf7c447fe4c825157774c6ad53791159', imgW: '104%', imgMb: '-14%', mt: '' } };
const IDS = ['ym', 'to', 'da', 'so']; const LC = { da: '#BFD9F2', so: '#FBD3BF', ym: '#F9D3DE', to: '#D6EEDC' };
const fmtT = (ts) => { if (!ts) return ''; const d = new Date(ts); const n = new Date(); const p = (x) => String(x).padStart(2, '0'); return d.toDateString() === n.toDateString() ? p(d.getHours()) + ':' + p(d.getMinutes()) : (d.getMonth() + 1) + '/' + d.getDate(); };
const partTxt = (p) => { if (!p) return ''; if (p.k === 'ex') return p.kr; if (p.k === 'quiz') { const B = this._pvB; const qz = (D[B].quiz || [])[p.i]; return 'QUIZ · ' + (qz ? L(qz.q) : ''); } return L([p.ko || '', p.es || '']); };
const bots = IDS.map((id) => { const x = D[id]; const s = st[id]; const last = null; this._pvB = id; let prev = ''; if (last) { prev = last.r === 'u' ? (ko ? '나: ' : 'Tú: ') + (last.txt || L([last.ko, last.es])) : partTxt(last.p); } else { prev = L([x.greet[x.greet.length - 1].ko, x.greet[x.greet.length - 1].es]); } const un = last ? Math.max(0, s.m.slice(s.seen).filter((m) => m.r === 'b').length) : 1; const av = AV[id]; return { id: id, open: () => this.ctOpen(id), name: L(x.name), role: L(x.role), color: x.color || LC[id], img: !!av.img, mono: !av.img, src: av.src || '', imgW: av.imgW || '', imgMb: av.imgMb || '', mt: av.mt, time: '', prev: prev.replace(/\s+/g, ' '), unread: false, unreadN: un > 9 ? '9+' : String(un), aria: L(x.name) + ', ' + L(x.role) + (un ? (ko ? ', 새 메시지 ' + un + '개' : ', ' + un + ' mensajes nuevos') : '') }; });
const SN = [['YouTube', 'https://www.youtube.com/@coreano.con.yoolmi', '#F8C9C4', 'yt'], ['Instagram', String(this.props.instaUrl ?? ''), '#F6CFE2', 'ig'], ['TikTok', String(this.props.tiktokUrl ?? ''), '#D9D3EC', 'tt']];
const sns = SN.map((x) => { const on = /^https:\/\//.test(x[1]); return { name: x[0], href: on ? x[1] : '#', bg: x[2], isYt: x[3] === 'yt', isIg: x[3] === 'ig', isTt: x[3] === 'tt', off: on ? 'false' : 'true', op: on ? 1 : 0.5, aria: x[0] + (on ? '' : (ko ? ' (준비 중)' : ' (pronto)')), go: (e) => { if (!on && e && e.preventDefault) e.preventDefault(); } }; });
const hp = String(this.props.homeUrl ?? '').trim(); const hpOn = /^https:\/\//.test(hp);
const rid = S.room && D[S.room] ? S.room : null; const R0 = rid || 'ym'; const RD = D[R0]; const rav = AV[R0];
const r = { name: L(RD.name), role: L(RD.role), color: RD.color || LC[R0], tint: RD.tint || '#FFF8F0', img: !!rav.img, mono: !rav.img, src: rav.src || '', imgW: rav.imgW || '', imgMb: rav.imgMb || '', imgMbS: rav.imgMb || '', mt: rav.mt, ph: L(RD.ph), mx: String({ ym: 50, da: 30, so: 30, to: 30 }[R0] || 50) };
const MXN = { ym: 50, da: 30, so: 30, to: 30 }[R0] || 50; const LIMM = S.ctLim === 'quota' ? ['무료 이용은 친구마다 하루 3번까지 직접 질문할 수 있어요. 아래 질문 버튼은 계속 쓸 수 있고, 유료 수강생은 무제한이에요.', 'En la versión gratis puedes escribir 3 preguntas al día a cada personaje. Los botones de abajo siguen disponibles y con clases pagadas no hay límite.'] : S.ctLim === 'len' ? ['최대 ' + MXN + '글자까지 쓸 수 있어요. 짧게 물어봐 주세요.', 'Máximo ' + MXN + ' caracteres. Pregunta en pocas palabras.'] : ['한글은 9글자까지만 쓸 수 있어요.', 'Puedes escribir hasta 9 letras en coreano.'];
let msgs = [], chips = [];
if (rid) {
  const ms = st[rid].m; const now = Date.now();
  msgs = ms.map((m, i) => {
    const nx = ms[i + 1]; const pv = ms[i - 1]; const fresh = now - (m.ts || 0) < 900;
    const base = { cls: fresh ? 'ct-in' : '', gap: pv && pv.r !== m.r ? '6px' : '0px', bot: m.r === 'b', user: m.r === 'u', av: (!nx || nx.r !== 'b') && !(S.typing === rid && i === ms.length - 1) ? 'visible' : 'hidden', mw: '262px', bg: '#FFFFFF', isT: false, isTip: false, isEx: false, isRows: false, isLink: false, isQuiz: false, p1: '', p2: '', has2: false, rows: [], opts: [], kr: '', rom: '', mean: '', stem: '', hasStem: false, href: '#', tgt: '_self', go: null, off: 'false', op: 1, arrow: '→', say: null };
    if (m.r === 'u') { if (m.txt) { base.p1 = m.txt; } else { base.p1 = L([m.ko, m.es]); base.p2 = L2([m.ko, m.es]); base.has2 = !!base.p2 && base.p2 !== base.p1; } return base; }
    const p = m.p || {};
    if (p.k === 't') { base.isT = true; base.p1 = L([p.ko, p.es]); base.p2 = L2([p.ko, p.es]); }
    else if (p.k === 'tip') { base.isTip = true; base.bg = '#FFF8DC'; base.p1 = L([p.ko, p.es]); base.p2 = L2([p.ko, p.es]); }
    else if (p.k === 'ex') { base.isEx = true; base.kr = p.kr; base.rom = p.rom; base.mean = p.es; base.say = () => this.ctSpeak(p.kr); }
    else if (p.k === 'rows') {
      base.isRows = true; base.mw = '304px'; base.p1 = L([p.ko, p.es]); base.p2 = L2([p.ko, p.es]);
      const mx = Math.max.apply(null, (p.rows || []).map((x) => Math.max(String(x.a || '').length * 13, String(x.b && x.b !== x.a ? x.b : '').length * 6.3)).concat([10]));
      const lw = Math.round(Math.min(96, Math.max(20, mx + 4))) + 'px';
      base.rows = (p.rows || []).map((x) => { const hk = !!x.kr; return { lab: x.a, lab2: x.b && x.b !== x.a ? x.b : '', lw: lw, hasKr: hk, noKr: !hk, kr: x.kr, rom: x.rom, mean: x.es, d1: L([x.ko, x.es]), d2: L2([x.ko, x.es]), say: () => this.ctSpeak(x.kr) }; });
    }
    else if (p.k === 'link') {
      base.isLink = true; base.p1 = L([p.ko, p.es]); base.p2 = L2([p.ko, p.es]); const to = String(p.to || '');
      if (to === 'home') { base.href = hpOn ? hp : '#'; base.tgt = '_blank'; base.arrow = '↗'; if (!hpOn) { base.off = 'true'; base.op = 0.55; base.p1 += ko ? ' (준비 중)' : ' (pronto)'; base.go = (e) => { if (e && e.preventDefault) e.preventDefault(); }; } }
      else if (to === 'insta') { const iu = String(this.props.instaUrl ?? ''); const on = /^https:\/\//.test(iu); base.href = on ? iu : '#'; base.tgt = '_blank'; base.arrow = '↗'; if (!on) { base.off = 'true'; base.op = 0.55; base.go = (e) => { if (e && e.preventDefault) e.preventDefault(); }; } }
      else if (to.indexOf('tab:') === 0) { base.href = to.slice(4); }
      else if (to.indexOf('topic:') === 0) { const tid = to.slice(6); base.go = (e) => { if (e && e.preventDefault) e.preventDefault(); this.ctAsk(rid, tid); }; }
      else if (to.indexOf('bot:') === 0) { const pr = to.split(':'); base.go = (e) => { if (e && e.preventDefault) e.preventDefault(); this.ctFlush(); const o = this.ctLoad(); o[rid].seen = o[rid].m.length; this.ctSave(); this._room = null; this.setState({ room: null }); setTimeout(() => { this.ctOpen(pr[1], true); if (pr[2] && D[pr[1]].topics[pr[2]]) setTimeout(() => { if (this.ctBusy()) { const w = () => { if (this.ctBusy()) setTimeout(w, 300); else this.ctAsk(pr[1], pr[2]); }; w(); } else this.ctAsk(pr[1], pr[2]); }, 50); }, 0); }; }
    }
    else if (p.k === 'quiz') {
      base.isQuiz = true; base.mw = '290px'; const qz = (RD.quiz || [])[p.i] || { q: ['', ''], opts: [], ans: 0, stem: '' };
      base.p1 = L(qz.q); base.p2 = L2(qz.q); base.stem = qz.stem || ''; base.hasStem = !!qz.stem; const done = p.pick >= 0;
      base.opts = qz.opts.map((o2, k) => { let bg = '#FFFFFF', bd = '1.4px solid #8A766B'; if (done && k === qz.ans) { bg = '#CDEFD6'; bd = '2px solid #3E8E5A'; } else if (done && k === p.pick) { bg = '#F9D4CF'; bd = '2px solid #C0574A'; } return { t: o2, bg: bg, bd: bd, cur: done ? 'default' : 'pointer', pr: done && k === p.pick ? 'true' : 'false', go: () => this.ctPick(rid, i, k) }; });
    }
    return base;
  });
  const busy = this.ctBusy() && S.typing === rid; const cl = busy ? [] : (st[rid].chips || []);
  const SP = { __all: ['다른 질문', 'Más preguntas'] };
  chips = cl.filter((c) => SP[c] || RD.topics[c]).map((c) => ({ t: SP[c] ? L(SP[c]) : L(RD.topics[c].q), bg: c === '__quiz' || (RD.topics[c] && RD.topics[c].quiz) ? r.color : (c === '__all' ? '#F3EEE7' : '#FFFFFF'), go: () => this.ctAsk(rid, c) }));
}
return { lang: lang, t: t, listOn: !rid, roomOn: !!rid, rootBg: 'radial-gradient(rgba(255,255,255,.6) 1.2px, transparent 1.6px) 0 0/20px 20px, linear-gradient(170deg,#C7E2EF 0%,#DDEFE0 50%,#F4E8D8 100%) #DDEEF0', bots: bots, sns: sns, hpHref: hpOn ? hp : '#', hpOff: hpOn ? 'false' : 'true', hpOp: hpOn ? 1 : 0.55, hpGo: (e) => { if (!hpOn && e && e.preventDefault) e.preventDefault(); }, r: r, msgs: msgs, chips: chips, typingOn: !!rid && S.typing === rid, back: () => this.ctBack(), clrAsk: () => this.setState({ clrOn: !S.clrOn }), clrNo: () => this.setState({ clrOn: false }), clrGo: () => this.ctClear(rid), inVal: S.inVal || '', inChange: (e) => { let v = e && e.target ? e.target.value : ''; let lim = false; const MX = { ym: 50, da: 30, so: 30, to: 30 }[rid] || 50; if (rid && !this.ctQuota(rid)) { this.setState({ inVal: v, ctLim: 'quota' }); return; } if ([...v].length > MX) { v = [...v].slice(0, MX).join(''); lim = 'len'; try { if (e.target && !e.isComposing) e.target.value = v; } catch (x) {} } else if ([...v].length >= MX) lim = 'len'; if (!lim && rid === 'so') { const r2 = this.ctHgCap(v, 9); if (r2 !== v) { lim = true; v = r2; try { if (e.target && !e.isComposing) e.target.value = v; } catch (x) {} } else if (this.ctHgN(v) >= 9) lim = true; } this.setState({ inVal: v, ctLim: lim }); }, inKey: (e) => { if (!e) return; if (e.isComposing || e.keyCode === 229) return; if (e.key === 'Enter') { if (e.preventDefault) e.preventDefault(); this.ctSend(); } }, send: () => this.ctSend(), phNow: this.ctLockLeft() ? L(['잠시 쉬어요 · ' + this.ctLockLeft() + '초', 'Pausa · ' + this.ctLockLeft() + ' s']) : (rid && !this.ctPaid() ? (this.ctQuota(rid) ? L(['오늘 ' + this.ctQuota(rid) + '번 더 물어볼 수 있어요', 'Hoy te quedan ' + this.ctQuota(rid) + ' preguntas']) : L(['오늘 질문을 다 썼어요 · 버튼은 계속 돼요', 'Sin preguntas hoy · usa los botones'])) : r.ph), inOp: this.ctLockLeft() || (rid && !this.ctQuota(rid)) ? 0.6 : 1, limOn: !!rid && !!S.ctLim, limT: L(LIMM), limT2: L2(LIMM), sendOp: (S.inVal || '').trim() ? 1 : 0.6 };
}
}
