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
    if (!P) return;
    save(false); clearInterval(saveT); saveT = null;
    var s = P.src, g = P.g; P = null;
    try { g.gain.cancelScheduledValues(ac.currentTime); g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), ac.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.5); s.stop(ac.currentTime + 0.55); } catch(e){ try { s.stop(); } catch(e2){} }
  }
  function gesture(){ var c = ctx(); try { if (c && c.state === 'suspended') c.resume(); } catch(e){} if (isOn() && !P) start(); }
  W.__hlBgm = { start: start, stop: stop, gesture: gesture, isOn: isOn, playing: function(){ return !!P; } };
  W.addEventListener('pagehide', function(){ save(!!P); });
  document.addEventListener('visibilitychange', function(){ if (!ac) return; try { if (document.hidden) { save(!!P); ac.suspend(); } else if (isOn()) ac.resume(); } catch(e){} });
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
