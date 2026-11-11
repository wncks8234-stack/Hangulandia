
/* no pinch / double-tap / ctrl-wheel zoom anywhere in the app */
function noZoom(doc){
  try {
    var pv = function(e){ e.preventDefault(); };
    doc.addEventListener('gesturestart', pv, {passive:false});
    doc.addEventListener('gesturechange', pv, {passive:false});
    doc.addEventListener('gestureend', pv, {passive:false});
    doc.addEventListener('touchmove', function(e){ if (e.touches && e.touches.length > 1) e.preventDefault(); }, {passive:false});
    doc.addEventListener('wheel', function(e){ if (e.ctrlKey) e.preventDefault(); }, {passive:false});
    var st = doc.createElement('style'); st.textContent = 'html,body{touch-action:manipulation;-webkit-text-size-adjust:100%;text-size-adjust:100%}';
    (doc.head || doc.documentElement).appendChild(st);
  } catch(e){}
}
noZoom(document);
/* Hangulandia shell: keeps one persistent document so background music never restarts between screens */
(function(){
  var W = window, LS = W.localStorage;
  var isOn = function(){ try { return LS.getItem('yoolmi-bgm') !== '0'; } catch(e){ return true; } };
  var ac = null, buf = null, P = null, loading = null;
  function ctx(){ if (!ac) { var AC = W.AudioContext || W.webkitAudioContext; if (!AC) return null; ac = new AC(); } return ac; }
  function load(){
    if (buf) return Promise.resolve(buf);
    if (loading) return loading;
    var c = ctx(); if (!c) return Promise.reject(new Error('noac'));
    var dec = function(u){ return fetch(u).then(function(r){ if (!r.ok) throw new Error('bgm ' + r.status); return r.arrayBuffer(); }).then(function(ab){ return new Promise(function(res, rej){ try { var pp = c.decodeAudioData(ab, res, rej); if (pp && pp.catch) pp.catch(function(){}); } catch(e){ rej(e); } }); }); };
    loading = dec('_blob/9643e4b47ae01f47f7c319f90a132140').catch(function(){ return dec('_blob/ede1f2e7ee57eb032bc4442f70d0a180'); }).then(function(b){
      var d = b.getChannelData(0), a = 0, e = d.length - 1;
      while (a < e && Math.abs(d[a]) < 2e-4) a++;
      while (e > a && Math.abs(d[e]) < 2e-4) e--;
      buf = { buf: b, ls: a / b.sampleRate, le: (e + 1) / b.sampleRate }; return buf;
    });
    loading.catch(function(){ loading = null; });
    return loading;
  }
  function savedPos(){ try { var v = JSON.parse(LS.getItem('yoolmi-bgm-pos') || 'null'); if (!v) return 0; return v.p + (v.on ? (Date.now() - v.t) / 1000 : 0); } catch(e){ return 0; } }
  function save(on){ if (!P || !buf) return; var L = buf.le - buf.ls; var p = ((ac.currentTime - P.t0) + P.off) % L; try { LS.setItem('yoolmi-bgm-pos', JSON.stringify({ p: p, t: Date.now(), on: !!on })); } catch(e){} }
  var saveT = null;
  function start(){
    if (!isOn()) return;
    if (ari && !ari.paused) return;
    var c = ctx(); if (!c) return;
    try { if (c.state === 'suspended') c.resume(); } catch(e){}
    if (P || start._busy) return;
    start._busy = true;
    load().then(function(lp){
      start._busy = false;
      if (P || !isOn()) return;
      var L = lp.le - lp.ls; var off = ((savedPos() % L) + L) % L;
      var g = c.createGain(); g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(0.35, c.currentTime + 1.2); g.connect(c.destination);
      var s = c.createBufferSource(); s.buffer = lp.buf; s.loop = true; s.loopStart = lp.ls; s.loopEnd = lp.le; s.connect(g);
      s.start(0, lp.ls + off);
      P = { src: s, g: g, t0: c.currentTime, off: off };
      clearInterval(saveT); saveT = setInterval(function(){ save(true); }, 1000);
    }).catch(function(){ start._busy = false; });
  }
  function stop(){
    ariStop();
    if (!P) return;
    save(false); clearInterval(saveT); saveT = null;
    var s = P.src, g = P.g; P = null;
    try { g.gain.cancelScheduledValues(ac.currentTime); g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), ac.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.5); s.stop(ac.currentTime + 0.55); } catch(e){ try { s.stop(); } catch(e2){} }
  }
  function gesture(){ var c = ctx(); try { if (c && c.state === 'suspended') c.resume(); } catch(e){} if (isOn() && !P && !(ari && !ari.paused) && !ov) start(); }

  /* ---- intro video (full screen) + Arirang that keeps going after the video ---- */
  var ari = null, ariG = null, ariSrc = null;
  function ariStop(){ if (!ari) return; try { if (ariG && ac) { ariG.gain.cancelScheduledValues(ac.currentTime); ariG.gain.setValueAtTime(ariG.gain.value, ac.currentTime); ariG.gain.linearRampToValueAtTime(0, ac.currentTime + 0.6); } } catch(e){} var a = ari; setTimeout(function(){ try { a.pause(); } catch(e){} }, 650); }
  function ariPlay(at){
    var c = ctx();
    if (!ari) {
      ari = new Audio('media/arirang.m4a'); ari.preload = 'auto'; ari.crossOrigin = 'anonymous';
      try { if (c) { ariSrc = c.createMediaElementSource(ari); ariG = c.createGain(); ariSrc.connect(ariG); ariG.connect(c.destination); } } catch(e){ ariSrc = null; ariG = null; }
      ari.addEventListener('ended', function(){ if (isOn()) start(); });
    }
    try { if (c && c.state === 'suspended') c.resume(); } catch(e){}
    if (ariG && c) { ariG.gain.cancelScheduledValues(c.currentTime); ariG.gain.setValueAtTime(0.9, c.currentTime); } else { ari.volume = 0.9; }
    try { ari.currentTime = at || 0; } catch(e){}
    var pr = ari.play(); if (pr && pr.catch) pr.catch(function(){});
  }
  var ov = null, vid = null;
  var onDone = null;
  function introClose(){ if (!ov) return; var sft = ov.getAttribute('data-soft') === '1'; if (sft) { ov.style.transition = 'opacity .7s ease'; } ov.style.opacity = '0'; var o = ov; ov = null; setTimeout(function(){ try { vid.pause(); } catch(e){} o.remove(); }, sft ? 760 : 260); var cb = onDone; onDone = null; if (cb) { try { cb(); } catch(e){} } if (ari && !ari.paused) { ariStop(); setTimeout(function(){ if (isOn()) start(); }, 700); } }
  function introPlay(lang, opt){
    opt = opt || {};
    if (ov) return;
    var es = lang === 'es';
    var music = isOn();
    if (music) { if (P) { var s0 = P.src, g0 = P.g; save(false); clearInterval(saveT); saveT = null; P = null; try { g0.gain.cancelScheduledValues(ac.currentTime); g0.gain.setValueAtTime(Math.max(0.0001, g0.gain.value), ac.currentTime); g0.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.4); s0.stop(ac.currentTime + 0.45); } catch(e){} } }
    ov = document.createElement('div');
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', es ? 'Historia de 한글 나라' : '한글 나라 이야기');
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:#000;opacity:0;transition:opacity .25s ease;display:flex;align-items:center;justify-content:center';
    vid = document.createElement('video');
    vid.src = music ? 'media/intro2-sfx.mp4' : 'media/intro2.mp4'; vid.poster = 'media/intro2-poster.jpg';
    vid.playsInline = true; vid.setAttribute('playsinline', ''); vid.setAttribute('webkit-playsinline', ''); vid.autoplay = true; vid.preload = 'auto';
    vid.style.cssText = 'width:100%;height:100%;object-fit:contain;background:#000';
    if (opt.soft) { ov.setAttribute('data-soft', '1'); ov.style.background = '#FCF6E8'; ov.style.transition = 'opacity .8s ease, background-color 1.6s ease'; vid.removeAttribute('poster'); vid.style.background = 'transparent'; vid.style.opacity = '0'; vid.style.transition = 'opacity .7s ease'; var shown = false; vid.addEventListener('playing', function(){ if (shown) return; shown = true; vid.style.opacity = '1'; setTimeout(function(){ if (ov) ov.style.background = '#000'; }, 1800); }); }
    var x = document.createElement('button');
    x.type = 'button'; x.setAttribute('aria-label', es ? 'Cerrar' : '닫기');
    x.style.cssText = 'position:absolute;top:calc(14px + env(safe-area-inset-top));right:14px;width:44px;height:44px;border-radius:50%;border:1.6px solid rgba(255,255,255,.85);background:rgba(30,20,14,.45);display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)';
    x.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    x.addEventListener('click', function(e){ e.stopPropagation(); introClose(); });
    if (opt.closable === false) x.style.display = 'none';
    onDone = opt.onDone || null;
    var snd = document.createElement('button'); snd.type = 'button';
    snd.style.cssText = 'position:absolute;left:50%;bottom:calc(28px + env(safe-area-inset-bottom));transform:translateX(-50%);display:none;align-items:center;gap:8px;min-height:44px;padding:0 18px;border-radius:999px;border:1.6px solid rgba(255,255,255,.85);background:rgba(30,20,14,.55);color:#fff;font:700 15px system-ui,sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent';
    snd.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>' + (es ? 'Activar sonido' : '소리 켜기');
    snd.addEventListener('click', function(e){ e.stopPropagation(); vid.muted = false; snd.style.display = 'none'; if (music) { started = true; } if (music) ariPlay(vid.currentTime || 0); else { var q = vid.play(); if (q && q.catch) q.catch(function(){}); } });
    vid.addEventListener('ended', introClose);
    var started = false, held = false, firstChk = false, t0 = Date.now();
    /* start only once a few seconds are buffered, so the first seconds never stutter */
    var buf = function(){ try { if (vid.readyState >= 4) return true; var r = vid.buffered; if (!r.length) return false; var need = Math.min(8, (vid.duration || 8) - 0.1); return r.end(r.length - 1) - (vid.currentTime || 0) >= need; } catch(e){ return true; } };
    var hold = function(){ held = true; try { vid.pause(); vid.currentTime = 0; } catch(e){} var iv = setInterval(function(){ if (!ov) { clearInterval(iv); return; } if (buf() || Date.now() - t0 > 8000) { clearInterval(iv); held = false; var q = vid.play(); if (q && q.catch) q.catch(function(){}); } }, 150); };
    vid.addEventListener('playing', function(){
      if (!firstChk) { firstChk = true; if (!buf()) { hold(); return; } }
      if (held) return;
      if (!music || vid.muted) return;
      if (!started) { started = true; ariPlay(vid.currentTime || 0); return; }
      if (ari && ari.paused) ariPlay(vid.currentTime || 0);
    });
    /* if the video ever has to wait for data, the music waits with it */
    vid.addEventListener('waiting', function(){ if (started && ari && !ari.paused) { try { ari.pause(); } catch(e){} } });
    ov.appendChild(vid); ov.appendChild(x); ov.appendChild(snd); document.body.appendChild(ov);
    requestAnimationFrame(function(){ if (ov) ov.style.opacity = '1'; });
    var muteStart = function(){ vid.muted = true; snd.style.display = 'flex'; var q = vid.play(); if (q && q.catch) q.catch(function(){}); };
    var unlocked = false; try { unlocked = !!(navigator.userActivation && navigator.userActivation.hasBeenActive); } catch(e){}
    if (!unlocked && opt.auto) { muteStart(); }
    else { var pr = vid.play(); if (pr && pr.catch) pr.catch(muteStart); }
    ov.addEventListener('click', function(){ if (vid.paused && !held) { var q = vid.play(); if (q && q.catch) q.catch(function(){}); } });
  }
  W.__hlIntro = { play: introPlay, close: introClose, playing: function(){ return !!(ari && !ari.paused); } };
  /* first launch as an installed app: show the intro video once */
  try {
    var standalone = (W.matchMedia && W.matchMedia('(display-mode: standalone)').matches) || W.navigator.standalone === true;
    if (standalone && !localStorage.getItem('hl-inst-intro')) {
      localStorage.setItem('hl-inst-intro', '1');
      /* brand-new users get the intro from the first-run story anyway; here we cover people who already saw it in the browser */
      if (localStorage.getItem('yoolmi-intro') === 'seen' || localStorage.getItem('yoolmi-story') === 'done') {
        setTimeout(function(){ try { introPlay(localStorage.getItem('yoolmi-lang') === 'es' ? 'es' : 'ko', { auto: true }); } catch(e){} }, 900);
      }
    }
  } catch(e){}
  W.__hlBgm = { start: start, stop: stop, gesture: gesture, isOn: isOn, playing: function(){ return !!P || !!(ari && !ari.paused); } };
  W.addEventListener('pagehide', function(){ save(!!P); });
  document.addEventListener('visibilitychange', function(){ if (!ac) return; try { if (document.hidden) { save(!!P); ac.suspend(); if (ari && !ari.paused) { ari.pause(); ari._resume = true; } } else if (isOn()) { ac.resume(); if (ari && ari._resume) { ari._resume = false; var q = ari.play(); if (q && q.catch) q.catch(function(){}); } } } catch(e){} });
  W.addEventListener('storage', function(e){ if (e && e.key === 'yoolmi-bgm') { if (e.newValue === '0') stop(); else start(); } });
  document.addEventListener('pointerdown', gesture);
  /* tap sound (synthesised "tok" droplet), follows the music switch */
  var sfxOn = function(){ try { return LS.getItem('yoolmi-sfx') !== '0'; } catch(e){ return true; } };
  var tapBuf = null, tapLast = 0;
  function tapMake(c){ var sr = c.sampleRate, d = 0.09, n = Math.floor(sr * (d + 0.03)), b = c.createBuffer(1, n, sr), x = b.getChannelData(0), ph = 0, pk = 0;
    for (var i = 0; i < n; i++) { var t = i / sr; if (t < d) { var f = 1100 + (520 - 1100) * Math.pow(t / d, 0.6); ph += 2 * Math.PI * f / sr; x[i] = Math.sin(ph) * Math.min(1, t / 0.002) * Math.exp(-t / 0.022); } else x[i] = 0; if (Math.abs(x[i]) > pk) pk = Math.abs(x[i]); }
    for (var j = 0; j < n; j++) x[j] = x[j] / pk * 0.45; return b; }
  function tap(ev){
    try {
      if (!sfxOn()) return; var el = ev.target && ev.target.closest ? ev.target.closest('button,a[href],[role=button],[role=tab],[role=radio],[role=switch],summary') : null;
      if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true' || el.closest('[data-nosfx]')) return;
      var now = Date.now(); if (now - tapLast < 45) return; tapLast = now;
      var c = ctx(); if (!c) return; if (c.state === 'suspended') { try { c.resume(); } catch(e){} }
      if (!tapBuf) tapBuf = tapMake(c); var s = c.createBufferSource(); s.buffer = tapBuf; s.connect(c.destination); s.start();
    } catch(e){}
  }
  W.__hlTap = tap;
  /* answer sounds: correct = "ding-dong-daeng" marimba (G5 C6 E6), wrong = soft "ppuing" drop */
  var fxBuf = {};
  function fxMake(c, k){ var sr = c.sampleRate, d = k === 'ok' ? 0.95 : 0.4, n = Math.floor(sr * d), b = c.createBuffer(1, n, sr), x = b.getChannelData(0), pk = 0, i, t;
    if (k === 'ok') { var NT = [[0, 783.99, .12], [.1, 1046.5, .12], [.2, 1318.5, .25]];
      for (i = 0; i < n; i++) { t = i / sr; var v = 0; for (var q = 0; q < 3; q++) { var u = t - NT[q][0]; if (u < 0) continue; var f = NT[q][1], e = Math.min(1, u / 0.003) * Math.exp(-u / NT[q][2]); v += e * (Math.sin(2 * Math.PI * f * u) + 0.3 * Math.sin(2 * Math.PI * f * 4 * u) + 0.12 * Math.sin(2 * Math.PI * f * 2.76 * u)); } x[i] = v; }
    } else { var ph = 0; for (i = 0; i < n; i++) { t = i / sr; var f2 = 420 - 170 * Math.min(1, t / 0.32); ph += 2 * Math.PI * f2 / sr; x[i] = t < 0.32 ? Math.sin(ph) * Math.min(1, t / 0.01) * Math.exp(-t / 0.14) * (1 + 0.25 * Math.sin(2 * Math.PI * 14 * t)) : 0; } }
    for (i = 0; i < n; i++) if (Math.abs(x[i]) > pk) pk = Math.abs(x[i]); for (i = 0; i < n; i++) x[i] = x[i] / pk * 0.5; return b; }
  W.__hlSfx = function(k){ try { if (!sfxOn()) return; var c = ctx(); if (!c) return; if (c.state === 'suspended') { try { c.resume(); } catch(e){} } k = k === 'ok' ? 'ok' : 'no'; if (!fxBuf[k]) fxBuf[k] = fxMake(c, k); var s = c.createBufferSource(); s.buffer = fxBuf[k]; s.connect(c.destination); s.start(c.currentTime + 0.03); } catch(e){} };
  document.addEventListener('pointerdown', tap, true);
  /* warm up the decode early so the first screen starts quickly */
  var warm = function(){ if (isOn()) { try { load(); } catch(e){} } };
  try { if (navigator.serviceWorker && !navigator.serviceWorker.controller) navigator.serviceWorker.addEventListener('controllerchange', warm, { once: true }); else warm(); } catch(e){ warm(); }


  /* study reminder while the app is open or in the background (needs notification permission) */
  (function(){ function due(){ try { if (LS.getItem('yoolmi-rm-on') !== '1') return; if (!W.Notification || Notification.permission !== 'granted') return; var t = String(LS.getItem('yoolmi-rm-t') || '19').split(':'); var h = +t[0], m = +(t[1] || 0); var d = new Date(); var day = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); if (LS.getItem('yoolmi-rm-last') === day) return; var now = d.getHours() * 60 + d.getMinutes(), at = h * 60 + m; if (now < at || now > at + 30) return; LS.setItem('yoolmi-rm-last', day); var es = LS.getItem('yoolmi-lang') === 'es'; var ti = es ? '¡Hora de estudiar coreano!' : '한국어 공부할 시간이에요!', bo = es ? 'Tosuni te espera en 한글 나라.' : '토순이가 한글 나라에서 기다리고 있어요.'; navigator.serviceWorker && navigator.serviceWorker.getRegistration ? navigator.serviceWorker.getRegistration().then(function(r){ if (r && r.showNotification) r.showNotification(ti, { body: bo, icon: 'icon-192.png', badge: 'icon-192.png', tag: 'hl-study' }); else new Notification(ti, { body: bo }); }) : new Notification(ti, { body: bo }); } catch(e){} } setInterval(due, 30000); setTimeout(due, 4000); })();
  /* frame management */
  var f = document.getElementById('hl-f');
  W.__hlShow = function(src){
    f.src = src;
    f.style.display = 'block';
  };
  f.addEventListener('load', function(){
    try {
      var l = f.contentWindow.location, d = f.contentDocument;
      var name = l.pathname.split('/').pop();
      if (/\.dc\.html$/.test(name)) {
        var q = l.search.replace(/^\?/, '');
        history.replaceState(null, '', './?next=' + encodeURIComponent(name) + (q ? '&' + q : '') + l.hash);
      }
      if (d && d.title) document.title = d.title;
      var w = document.querySelector('.w'); if (w) w.style.display = 'none';
      /* links that leave the site open at the top level instead of inside the frame */
      d.addEventListener('pointerdown', tap, true);
      d.addEventListener('pointerdown', gesture, true);
      noZoom(d);
      d.addEventListener('click', function(ev){
        var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null; if (!a) return;
        var t = (a.getAttribute('target') || '').toLowerCase(); if (t && t !== '_self') return;
        var u; try { u = new URL(a.href, l.href); } catch(e){ return; }
        if (u.origin !== location.origin) { ev.preventDefault(); location.href = u.href; }
      }, true);
    } catch(e){}
  });
})();
