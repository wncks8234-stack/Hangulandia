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
  function introClose(){ if (!ov) return; ov.style.opacity = '0'; var o = ov; ov = null; setTimeout(function(){ try { vid.pause(); } catch(e){} o.remove(); }, 260); var cb = onDone; onDone = null; if (cb) { try { cb(); } catch(e){} } }
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
    vid.src = music ? 'media/intro-sfx.mp4' : 'media/intro.mp4'; vid.poster = 'media/intro-poster.jpg';
    vid.playsInline = true; vid.setAttribute('playsinline', ''); vid.setAttribute('webkit-playsinline', ''); vid.autoplay = true; vid.preload = 'auto';
    vid.style.cssText = 'width:100%;height:100%;object-fit:contain;background:#000';
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
    var started = false;
    vid.addEventListener('playing', function(){ if (started || !music || vid.muted) return; started = true; ariPlay(vid.currentTime || 0); });
    ov.appendChild(vid); ov.appendChild(x); ov.appendChild(snd); document.body.appendChild(ov);
    requestAnimationFrame(function(){ if (ov) ov.style.opacity = '1'; });
    var muteStart = function(){ vid.muted = true; snd.style.display = 'flex'; var q = vid.play(); if (q && q.catch) q.catch(function(){}); };
    var unlocked = false; try { unlocked = !!(navigator.userActivation && navigator.userActivation.hasBeenActive); } catch(e){}
    if (!unlocked && opt.auto) { muteStart(); }
    else { var pr = vid.play(); if (pr && pr.catch) pr.catch(muteStart); }
    ov.addEventListener('click', function(){ if (vid.paused) { var q = vid.play(); if (q && q.catch) q.catch(function(){}); } });
  }
  W.__hlIntro = { play: introPlay, close: introClose, playing: function(){ return !!(ari && !ari.paused); } };
  W.__hlBgm = { start: start, stop: stop, gesture: gesture, isOn: isOn, playing: function(){ return !!P || !!(ari && !ari.paused); } };
  W.addEventListener('pagehide', function(){ save(!!P); });
  document.addEventListener('visibilitychange', function(){ if (!ac) return; try { if (document.hidden) { save(!!P); ac.suspend(); if (ari && !ari.paused) { ari.pause(); ari._resume = true; } } else if (isOn()) { ac.resume(); if (ari && ari._resume) { ari._resume = false; var q = ari.play(); if (q && q.catch) q.catch(function(){}); } } } catch(e){} });
  W.addEventListener('storage', function(e){ if (e && e.key === 'yoolmi-bgm') { if (e.newValue === '0') stop(); else start(); } });
  document.addEventListener('pointerdown', gesture);
  /* warm up the decode early so the first screen starts quickly */
  var warm = function(){ if (isOn()) { try { load(); } catch(e){} } };
  try { if (navigator.serviceWorker && !navigator.serviceWorker.controller) navigator.serviceWorker.addEventListener('controllerchange', warm, { once: true }); else warm(); } catch(e){ warm(); }

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
      d.addEventListener('click', function(ev){
        var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null; if (!a) return;
        var t = (a.getAttribute('target') || '').toLowerCase(); if (t && t !== '_self') return;
        var u; try { u = new URL(a.href, l.href); } catch(e){ return; }
        if (u.origin !== location.origin) { ev.preventDefault(); location.href = u.href; }
      }, true);
    } catch(e){}
  });
})();
