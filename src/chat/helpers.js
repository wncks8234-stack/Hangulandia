hgDec(c) { const o = c.charCodeAt(0) - 0xAC00; return [Math.floor(o / 588), Math.floor((o % 588) / 28), o % 28]; }
hgCmp(ch, ju, jo) { return String.fromCharCode(0xAC00 + ch * 588 + ju * 28 + (jo || 0)); }
hgIs(c) { const o = c.charCodeAt(0); return o >= 0xAC00 && o <= 0xD7A3; }
ctRom(s) {
  const CHO = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'ch', 'cch', 'ch', 'k', 't', 'p', 'j'];
  const JUNG = ['a', 'e', 'ya', 'ye', 'o', 'e', 'yo', 'ye', 'o', 'wa', 'we', 'we', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'u', 'ui', 'i'];
  const JONG = [null, 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't'];
  const LINK = { 1: 0, 2: 1, 3: [1, 9], 4: 2, 5: [2, 12], 6: [2, null], 7: 3, 8: 5, 9: [8, 0], 10: [8, 6], 11: [8, 7], 12: [8, 9], 13: [8, 16], 14: [8, 17], 15: [8, null], 16: 6, 17: 7, 18: [17, 9], 19: 9, 20: 10, 21: null, 22: 12, 23: 14, 24: 15, 25: 16, 26: 17, 27: null };
  const KM = { 1: 1, 2: 4, 8: 8, 17: 17 };
  const NAS = { 1: 21, 2: 21, 24: 21, 3: 21, 9: 21, 7: 4, 19: 4, 20: 4, 22: 4, 23: 4, 25: 4, 27: 4, 17: 16, 26: 16, 18: 16 };
  return String(s).split(/\s+/).map((tok) => {
    const cs = tok.split('').filter((c) => this.hgIs(c)); if (!cs.length) return '';
    const sy = cs.map((c) => this.hgDec(c));
    for (let i = 0; i < sy.length - 1; i++) { const jo = sy[i][2], n = sy[i + 1][0]; if ((n === 2 || n === 6) && NAS[jo] !== undefined) sy[i][2] = NAS[jo]; }
    for (let i = 0; i < sy.length - 1; i++) { const jo = sy[i][2]; if (jo && sy[i + 1][0] === 11) { const Lk = LINK[jo]; if (Lk === null || Lk === undefined) { if (jo !== 21) sy[i][2] = 0; continue; } if (Array.isArray(Lk)) { sy[i][2] = KM[Lk[0]] || 0; if (Lk[1] !== null) sy[i + 1][0] = Lk[1]; } else { sy[i][2] = 0; sy[i + 1][0] = Lk; } } }
    return sy.map(([ch, ju, jo]) => { let c = CHO[ch]; const v = JUNG[ju]; if (c === 'g' && (v[0] === 'e' || v[0] === 'i')) c = 'gu'; return c + v + (jo ? JONG[jo] : ''); }).join('');
  }).filter(Boolean).join(' ');
}
ctDecomp(w) {
  const CN = { 'ㄱ': ['기역', 'g/k'], 'ㄲ': ['쌍기역', 'kk'], 'ㄴ': ['니은', 'n'], 'ㄷ': ['디귿', 'd/t'], 'ㄸ': ['쌍디귿', 'tt'], 'ㄹ': ['리을', 'r/l'], 'ㅁ': ['미음', 'm'], 'ㅂ': ['비읍', 'b/p'], 'ㅃ': ['쌍비읍', 'pp'], 'ㅅ': ['시옷', 's'], 'ㅆ': ['쌍시옷', 'ss'], 'ㅇ': ['이응', '-/ng'], 'ㅈ': ['지읒', 'ch (suave)'], 'ㅉ': ['쌍지읒', 'cch'], 'ㅊ': ['치읓', 'ch (fuerte)'], 'ㅋ': ['키읔', 'k'], 'ㅌ': ['티읕', 't'], 'ㅍ': ['피읖', 'p'], 'ㅎ': ['히읗', 'j'] };
  const CHOJ = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'; const JUJ = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'; const JOJ = ' ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ';
  const CHO = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'ch', 'cch', 'ch', 'k', 't', 'p', 'j'];
  const JUNG = ['a', 'e', 'ya', 'ye', 'o', 'e', 'yo', 'ye', 'o', 'wa', 'we', 'we', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'u', 'ui', 'i'];
  const JONG = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't'];
  const VN = { 'ㅏ': 'a', 'ㅐ': 'e', 'ㅑ': 'ya', 'ㅒ': 'ye', 'ㅓ': 'o (abierta)', 'ㅔ': 'e', 'ㅕ': 'yo (abierta)', 'ㅖ': 'ye', 'ㅗ': 'o', 'ㅘ': 'wa', 'ㅙ': 'we', 'ㅚ': 'we', 'ㅛ': 'yo', 'ㅜ': 'u', 'ㅝ': 'wo', 'ㅞ': 'we', 'ㅟ': 'wi', 'ㅠ': 'yu', 'ㅡ': 'u (sin redondear)', 'ㅢ': 'ui', 'ㅣ': 'i' };
  const parts = []; const cs = w.split('');
  if (cs.every((c) => !this.hgIs(c))) {
    parts.push({ k: 't', ko: '자모 하나하나를 알려 줄게요.', es: 'Te explico cada letra.' });
    parts.push({ k: 'rows', ko: '글자 정보', es: 'Datos de la letra', rows: cs.slice(0, 9).map((c) => { if (CN[c]) return { a: c, b: c, kr: CN[c][0], rom: this.ctRom(CN[c][0]), es: 'Consonante · sonido ' + CN[c][1], ko: '' }; if (VN[c]) return { a: c, b: c, kr: '', rom: '', ko: '모음 · 소리 ' + VN[c].split(' ')[0], es: 'Vocal · sonido ' + VN[c] }; return { a: c, b: c, kr: '', rom: '', ko: '받침에서만 쓰는 겹받침이에요.', es: 'Batchim doble: solo va abajo.' }; }) });
    const v0 = cs.find((c) => VN[c]); const c0 = cs.find((c) => CHOJ.indexOf(c) >= 0);
    if (c0 && v0) { const s = this.hgCmp(CHOJ.indexOf(c0), JUJ.indexOf(v0), 0); parts.push({ k: 't', ko: c0 + ' + ' + v0 + ' = ' + s, es: c0 + ' + ' + v0 + ' = ' + s }); parts.push({ k: 'ex', kr: s, rom: this.ctRom(s), es: 'Sílaba que se forma' }); }
    else parts.push({ k: 'tip', ko: '자음은 모음과 만나야 소리가 나요. 예를 들어 ㄱ + ㅏ = 가.', es: 'Una consonante necesita una vocal para sonar: ㄱ + ㅏ = 가.' });
    return parts;
  }
  const sy = cs.filter((c) => this.hgIs(c)).slice(0, 9);
  parts.push({ k: 't', ko: '「' + sy.join('') + '」' + (this.hgDec(sy[sy.length - 1])[2] ? '을' : '를') + ' 자음과 모음으로 나눠 볼게요.', es: 'Vamos a separar «' + sy.join('') + '» en consonantes y vocales.' });
  let hasB = false, hasLink = false;
  const rows = sy.map((c, i) => {
    const [ch, ju, jo] = this.hgDec(c); const C = CHOJ[ch], V = JUJ[ju], B = jo ? JOJ[jo] : '';
    if (jo) hasB = true; if (jo && sy[i + 1] && this.hgDec(sy[i + 1])[0] === 11 && jo !== 21) hasLink = true;
    const cn = CN[C] ? CN[C][0] : C; const bn = B && CN[B] ? CN[B][0] : B;
    const ko = C + '(' + cn + ') + ' + V + (B ? ' + 받침 ' + B + (bn !== B ? '(' + bn + ')' : '') : '');
    const es = C + ' «' + (CHO[ch] || 'muda') + '» + ' + V + ' «' + JUNG[ju] + '»' + (B ? ' + batchim ' + B + ' «' + JONG[jo] + '»' : '');
    return { a: c, b: this.ctRom(c), kr: '', rom: '', ko: ko, es: es };
  });
  parts.push({ k: 'rows', ko: '한 글자씩', es: 'Sílaba por sílaba', rows: rows });
  const word = sy.join('');
  parts.push({ k: 'ex', kr: word, rom: this.ctRom(word), es: sy.length > 1 ? 'Léelo seguido, como suena junto.' : 'Escucha y repite.' });
  if (sy.some((c) => this.hgDec(c)[0] === 11)) parts.push({ k: 'tip', ko: '첫소리 ㅇ은 소리가 없어요. 모음 소리만 내면 돼요.', es: 'La ㅇ al inicio no suena: solo se lee la vocal.' });
  if (hasLink) parts.push({ k: 'tip', ko: '받침 뒤에 ㅇ이 오면 받침이 다음 글자로 넘어가서 읽혀요 (연음).', es: 'Si después del batchim viene ㅇ, el batchim pasa a la siguiente sílaba (enlace).' });
  else if (hasB) parts.push({ k: 'tip', ko: '받침 소리는 7개뿐이에요: ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅇ.', es: 'El batchim solo tiene 7 sonidos: ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅇ.' });
  return parts;
}
ctConj(v) {
  const stem = v.slice(0, -1); const last = stem.slice(-1); const pre = stem.slice(0, -1); const [ch, ju, jo] = this.hgDec(last);
  const B_IRR = ['춥', '덥', '쉽', '어렵', '가깝', '무겁', '가볍', '맵', '귀엽', '고맙', '반갑', '즐겁', '아름답', '눕', '돕', '곱', '더럽', '시끄럽', '차갑', '뜨겁', '부럽', '무섭', '싱겁', '외롭', '새롭', '두렵', '아깝', '밉', '괴롭', '놀랍', '부드럽', '어둡', '그립', '굽', '줍', '깁', '사랑스럽', '자연스럽', '부끄럽', '간지럽', '가렵'];
  const isB = jo === 17 && B_IRR.some((x) => stem === x || stem.endsWith(x) && x.length >= 2);
  const isD = jo === 7 && ['듣', '걷', '묻', '싣', '깨닫', '일컫'].some((x) => stem.endsWith(x));
  const isS = jo === 19 && ['낫', '짓', '붓', '긋', '잇', '젓'].some((x) => stem === x || stem.endsWith(x) && stem.length <= 2);
  const isH = jo === 27 && !['좋', '놓', '넣', '낳', '쌓', '닿'].some((x) => stem.endsWith(x));
  const isReu = last === '르' && pre.length >= 1 && !['따르', '치르', '들르'].some((x) => stem.endsWith(x));
  const bright = (j) => j === 0 || j === 2 || j === 8;
  const prevJu = pre ? this.hgDec(pre.slice(-1))[1] : -1;
  const addJo = (syl, j) => { const d = this.hgDec(syl); return this.hgCmp(d[0], d[1], j); };
  let A;
  if (last === '하') A = pre + '해';
  else if (isReu) { const p = pre.slice(-1); const pd = this.hgDec(p); A = pre.slice(0, -1) + addJo(p, 8) + (bright(pd[1]) ? '라' : '러'); }
  else if (isB) A = pre + addJo(last, 0) + (['돕', '곱'].indexOf(stem.slice(-1)) >= 0 && stem.length === 1 ? '와' : '워');
  else if (isD) A = pre + addJo(last, 8) + '어';
  else if (isS) A = pre + addJo(last, 0) + (bright(ju) ? '아' : '어');
  else if (isH) { const nj = ju === 2 ? 3 : (ju === 6 ? 7 : 1); A = pre + this.hgCmp(ch, nj, 0); }
  else if (jo) A = stem + (bright(ju) ? '아' : '어');
  else {
    const M = { 0: 0, 4: 4, 8: 9, 13: 14, 20: 6, 1: 1, 5: 5, 6: 6, 11: 10 };
    if (ju === 18) { const nj = pre ? (bright(prevJu) ? 0 : 4) : 4; A = pre + this.hgCmp(ch, nj, 0); }
    else if (ju === 20 && ch === 11) A = pre + '여';
    else if (M[ju] !== undefined) A = pre + this.hgCmp(ch, M[ju], 0);
    else A = stem + (bright(ju) ? '아' : '어');
  }
  let present = A + '요';
  let past = A.slice(0, -1) + addJo(A.slice(-1), 20) + '어요';
  if (stem === '이') { present = '이에요'; past = '이었어요'; }
  let fut;
  if (last === '하') fut = pre + '할 거예요';
  else if (jo === 8) fut = stem + ' 거예요';
  else if (isB) fut = pre + addJo(last, 0) + '울 거예요';
  else if (isD) fut = pre + addJo(last, 8) + '을 거예요';
  else if (isS) fut = pre + addJo(last, 0) + '을 거예요';
  else if (isH) fut = pre + addJo(last, 8) + ' 거예요';
  else if (jo) fut = stem + '을 거예요';
  else fut = pre + addJo(last, 8) + ' 거예요';
  const NEG = { '있': '없어요', '알': '몰라요' };
  const neg = NEG[stem] ? NEG[stem] : (last === '하' && stem.length >= 3) ? stem + '지 않아요' : '안 ' + present;
  const SPH = { '먹': '드세요', '자': '주무세요', '있': '계세요', '말하': '말씀하세요', '마시': '드세요' };
  let hon;
  if (SPH[stem]) hon = SPH[stem];
  else if (jo === 8) hon = pre + addJo(last, 0) + '세요';
  else if (isB) hon = pre + addJo(last, 0) + '우세요';
  else if (isD) hon = pre + addJo(last, 8) + '으세요';
  else if (isS) hon = pre + addJo(last, 0) + '으세요';
  else if (isH) hon = pre + addJo(last, 0) + '세요';
  else if (jo) hon = stem + '으세요';
  else hon = stem + '세요';
  const ADJ = ['좋', '싫', '많', '적', '크', '작', '길', '짧', '높', '낮', '넓', '좁', '바쁘', '예쁘', '아프', '나쁘', '기쁘', '슬프', '고프', '빠르', '느리', '같', '다르', '비싸', '싸', '멀', '괜찮', '재미있', '재미없', '맛있', '맛없', '따뜻하', '시원하', '피곤하', '깨끗하', '조용하', '행복하', '건강하', '유명하', '친절하', '중요하', '어리', '젊', '착하', '있', '없', '이', '아니', '귀찮', '똑같', '심심하', '편하', '불편하', '필요하', '어떻', '그렇', '이렇', '저렇'];
  const isAdj = isH || (isB && !['돕', '눕', '굽', '줍', '깁'].some((x) => stem.endsWith(x))) || /스럽$/.test(stem) || ADJ.some((x) => stem === x || (x.length >= 2 && stem.endsWith(x)));
  const prog = stem + '고 있어요';
  const irr = isB ? ['ㅂ 불규칙', 'irregular de ㅂ'] : isD ? ['ㄷ 불규칙', 'irregular de ㄷ'] : isS ? ['ㅅ 불규칙', 'irregular de ㅅ'] : isH ? ['ㅎ 불규칙', 'irregular de ㅎ'] : isReu ? ['르 불규칙', 'irregular de 르'] : (ju === 18 && !jo) ? ['ㅡ 탈락', 'cae la ㅡ'] : (jo === 8) ? ['ㄹ 받침', 'raíz en ㄹ'] : null;
  const row = (a, b, kr, es) => ({ a: a, b: b, kr: kr, rom: this.ctRom(kr), es: es, ko: '' });
  const parts = [{ k: 't', ko: '「' + v + '」를 바꿔 볼게요. 어간은 「' + stem + '」' + (jo ? '이에요.' : '예요.'), es: 'Vamos a conjugar «' + v + '». La raíz es «' + stem + '».' }];
  parts.push({ k: 'rows', ko: '시제별로', es: 'Por tiempos', rows: [row('현재', 'presente', present, 'Presente cortés (-아/어요)'), row('과거', 'pasado', past, 'Pasado (-았/었어요)'), row('미래', 'futuro', fut, 'Futuro (-(으)ㄹ 거예요)')].concat(isAdj ? [] : [row('진행', 'progresivo', prog, 'Ahora mismo (-고 있어요)')]).concat([row('부정', 'negativo', neg, neg.indexOf('않') >= 0 ? 'Negativo (-지 않아요)' : 'Negativo (안 + verbo)'), row('높임', 'honorífico', hon, 'Honorífico (-(으)세요)')]) });
  if (isAdj && !NEG[stem]) parts.push({ k: 'tip', ko: '형용사는 「-고 있어요」를 쓰지 않아요.', es: 'Los adjetivos no usan «-고 있어요».' });
  if (irr) parts.push({ k: 'tip', ko: '이 동사는 「' + irr[0] + '」이에요. 모양이 조금 바뀌니까 주의해요.', es: 'Este verbo es «' + irr[1] + '»: la forma cambia un poco.' });
  else parts.push({ k: 'tip', ko: '어간 마지막 모음이 ㅏ·ㅗ이면 -아요, 나머지는 -어요예요. 하다는 해요!', es: 'Si la última vocal de la raíz es ㅏ u ㅗ → -아요; si no → -어요. 하다 → 해요.' });
  parts.push({ k: 't', ko: '동사나 형용사가 아니면 결과가 이상할 수 있어요. 다른 동사도 써 보세요!', es: 'Si no es un verbo o adjetivo, el resultado puede salir raro. ¡Prueba con otro verbo!' });
  return parts;
}
