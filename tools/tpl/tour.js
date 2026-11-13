/* tour.js — Tosuni guide shared by every screen.
   HLTour.run(steps, opt)
     step: { t: () => element | null, p: pose, h: [ko, es], k: koText, e: esText, pre: fn (runs before the step), wait: ms, go: true (click target at the end) }
     opt:  { single: true (only the chosen language), skip: true, base, total, onEnd(el, skipped) }
   Layout: Tosuni stands on top of the speech bubble (tail points to Tosuni), the pair sits above or below the highlighted
   element and never covers it; both always stay fully on screen. */
(function () {
  'use strict';
  var W = window, D = document;
  var POSE = { hi: '431c72b70c97c0534e4d129ebd538b1c', tilt: 'ed45c70fdfe4f16a87eb99d7737af96d', oops: 'd76bf5e5ab5c1bb09de68a53da41e858', hug: '551c524f37d5547f8778880f28cd5ff1', cheer: 'b2120ee51f64496edcbaa33ed046e39d', wave: '2edc7da400f67364cabb2f330021b520' };
  var BLOB = '_blob/';
  Object.keys(POSE).forEach(function (k) { var im = new Image(); im.src = BLOB + POSE[k]; });
  var TH = 92, GAP = 8;
  var CSS = '#hl-tour{position:fixed;inset:0;z-index:2147483000;touch-action:none;font-family:"Yoolmi Hand",Fredoka,"Noto Sans KR",sans-serif;color:#4A3A32;opacity:0;transition:opacity .3s ease;cursor:pointer;-webkit-tap-highlight-color:transparent}'
    + '#hl-tour .hole{position:absolute;border-radius:20px;box-shadow:0 0 0 200vmax rgba(40,28,22,.6);transition:left .35s ease,top .35s ease,width .35s ease,height .35s ease,border-radius .35s ease;pointer-events:none}'
    + '#hl-tour .ring{position:absolute;inset:-5px;border-radius:inherit;border:3px dashed #FFE7A6;animation:hlTr 1.6s ease-in-out infinite}@keyframes hlTr{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}'
    + '#hl-tour .tw{position:absolute;left:16px;right:16px;max-width:372px;margin:0 auto;transition:top .35s ease,opacity .2s ease}'
    + '#hl-tour .ts{display:block;height:' + TH + 'px;width:auto;margin:0 0 ' + GAP + 'px 18px;filter:drop-shadow(0 3px 2px rgba(74,58,50,.22))}'
    + '#hl-tour .tw.r .ts{margin:0 18px ' + GAP + 'px auto}'
    + '#hl-tour .ts.pop{animation:hlTp .45s cubic-bezier(.3,1.4,.5,1) both}@keyframes hlTp{0%{transform:scale(.6) translateY(10px);opacity:0}70%{transform:scale(1.06)}100%{transform:none;opacity:1}}'
    + '#hl-tour .tb{position:relative;background:#FFFBF3;border:1.8px solid #8A766B;border-radius:22px;padding:14px 16px 12px;box-sizing:border-box}'
    + '#hl-tour .tail{position:absolute;top:-8px;left:52px;width:14px;height:14px;background:#FFFBF3;border-left:1.8px solid #8A766B;border-top:1.8px solid #8A766B;transform:rotate(45deg);border-top-left-radius:3px}'
    + '#hl-tour .tw.r .tail{left:auto;right:52px}'
    + '#hl-tour .tt{display:flex;align-items:center;justify-content:space-between;gap:8px}'
    + '#hl-tour .th{font-weight:700;font-size:19px;line-height:1.3}#hl-tour .tn{font-size:12px;font-weight:800;opacity:.5;margin-left:7px;font-family:Fredoka,sans-serif}'
    + '#hl-tour .tx{flex:none;border:0;background:transparent;font:inherit;font-size:12.5px;font-weight:800;color:#8A7A70;text-decoration:underline;text-underline-offset:3px;padding:4px 0 4px 8px;cursor:pointer}'
    + '#hl-tour .tk{font-size:16px;font-weight:700;line-height:1.6;margin-top:8px;word-break:keep-all;white-space:pre-line;text-wrap:pretty}'
    + '#hl-tour .te{font-size:13.5px;font-weight:700;line-height:1.5;color:#6B58B8;margin-top:8px;padding-top:8px;border-top:1.4px dashed #E3D6C8;white-space:pre-line;text-wrap:pretty}'
    + '#hl-tour .te:empty{display:none}'
    + '#hl-tour b.hl{font-weight:800;background:linear-gradient(transparent 58%,#FFE39A 58%);padding:0 1px}'
    + '#hl-tour .tf{display:flex;align-items:center;justify-content:space-between;margin-top:14px;gap:12px}'
    + '#hl-tour .tp{flex:1;height:6px;border-radius:9px;background:#EDE5DA;overflow:hidden}#hl-tour .tp i{display:block;height:100%;border-radius:9px;background:#8A766B;transition:width .3s ease}'
    + '#hl-tour .tg{flex:none;font-weight:800;font-size:15px;line-height:1.2;background:#9BD3A8;border:1.6px solid #8A766B;border-radius:999px;padding:8px 18px;color:#2F4A36}';

  function esc(x) { return String(x || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function md(x) { return esc(x).replace(/\[\[(.+?)\]\]/g, '<b class="hl">$1</b>'); }
  function lang() { try { return (W.localStorage.getItem('yoolmi-lang') || 'ko') === 'es' ? 'es' : 'ko'; } catch (e) { return 'ko'; } }
  function vis(el) { if (!el) return false; var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }

  function run(ST, opt, host) {
    opt = opt || {};
    if (D.getElementById('hl-tour')) return;
    var ko = lang() === 'ko';
    var steps = ST.filter(function (s) { return !s.t || s.pre || vis(s.t()); });
    if (!steps.length) { if (opt.onEnd) opt.onEnd(null, false); return; }
    var ov = D.createElement('div'); ov.id = 'hl-tour'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', ko ? '토순이 안내' : 'Guía de Tosuni');
    ov.innerHTML = '<style>' + CSS + '</style><div class="hole"><span class="ring"></span></div><div class="tw"><img class="ts" alt=""><div class="tb"><i class="tail"></i><div class="tt"><div><span class="th"></span><span class="tn"></span></div><button type="button" class="tx" hidden></button></div><div class="tk"></div><div class="te"></div><div class="tf"><span class="tp"><i></i></span><span class="tg"></span></div></div></div>';
    D.body.appendChild(ov);
    var hole = ov.querySelector('.hole'), tw = ov.querySelector('.tw'), ts = ov.querySelector('.ts'), tb = ov.querySelector('.tb'), hint = ov.querySelector('.tg'), tx = ov.querySelector('.tx');
    ['pointerdown', 'pointerup', 'touchstart', 'touchmove', 'wheel'].forEach(function (ev) { ov.addEventListener(ev, function (e) { e.stopPropagation(); if (ev === 'touchmove' || ev === 'wheel') e.preventDefault(); }, { passive: false }); });
    var i = 0, busy = false;
    function rectOf(el) {
      if (!el) return null;
      var r = el.getBoundingClientRect(), vh = ov.offsetHeight || W.innerHeight;
      if (r.top < 60 || r.bottom > vh - 10) { try { el.scrollIntoView({ block: 'center', behavior: 'auto' }); } catch (e) {} r = el.getBoundingClientRect(); }
      var o = ov.getBoundingClientRect(), z = (o.width / (ov.offsetWidth || o.width)) || 1;
      return { left: (r.left - o.left) / z, top: (r.top - o.top) / z, width: r.width / z, height: r.height / z, bottom: (r.bottom - o.top) / z, cx: (r.left + r.width / 2 - o.left) / z };
    }
    function place() {
      var s = steps[i], vw = ov.offsetWidth || W.innerWidth, vh = ov.offsetHeight || W.innerHeight;
      var r = rectOf(s.t ? s.t() : null), pad = 6;
      if (r) {
        var hw = r.width + pad * 2, hh = r.height + pad * 2;
        hole.style.left = (r.left - pad) + 'px'; hole.style.top = (r.top - pad) + 'px'; hole.style.width = hw + 'px'; hole.style.height = hh + 'px';
        hole.style.borderRadius = (Math.abs(hw - hh) < 14 && hw < 120 ? '50%' : Math.min(28, hh / 2) + 'px'); hole.firstChild.style.display = '';
      } else {
        hole.style.left = (vw / 2) + 'px'; hole.style.top = (vh * 0.3) + 'px'; hole.style.width = '0px'; hole.style.height = '0px'; hole.firstChild.style.display = 'none';
      }
      /* Tosuni on the side away from the target, so the pair reads target -> Tosuni -> words */
      tw.classList.toggle('r', !!r && r.cx < vw / 2);
      var gh = tw.offsetHeight, top;
      if (!r) top = Math.max(8, Math.round((vh - gh) * 0.45));
      else {
        var below = r.bottom + 14, above = r.top - 14 - gh;
        if (below + gh <= vh - 8) top = below;
        else if (above >= 8) top = above;
        else top = (vh - r.bottom > r.top) ? Math.min(below, vh - 8 - gh) : Math.max(8, above);
      }
      tw.style.top = Math.round(Math.max(8, Math.min(top, vh - 8 - gh))) + 'px';
    }
    if (opt.skip) {
      tx.hidden = false; tx.textContent = ko ? '건너뛰기' : 'Saltar';
      if (!opt.single) tx.textContent = ko ? '건너뛰기 · Saltar' : 'Saltar · 건너뛰기';
      tx.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); fin(true); });
    }
    function show() {
      var s = steps[i], tot = opt.total || steps.length, cur = (opt.base || 0) + i;
      ov.querySelector('.th').textContent = ko ? s.h[0] : s.h[1];
      ov.querySelector('.tn').textContent = tot > 1 ? (cur + 1) + ' / ' + tot : '';
      ov.querySelector('.tk').innerHTML = md(ko ? s.k : s.e);
      ov.querySelector('.te').innerHTML = opt.single ? '' : md(ko ? s.e : s.k);
      ov.querySelector('.tp i').style.width = Math.round((cur + 1) / tot * 100) + '%';
      ov.querySelector('.tp').style.visibility = tot > 1 ? '' : 'hidden';
      var last = i === steps.length - 1, nk = last ? (s.btn ? s.btn[0] : '알겠어요') : '다음 ›', ne = last ? (s.btn ? s.btn[1] : 'Entendido') : 'Siguiente ›';
      hint.textContent = ko ? nk : ne;
      ts.classList.remove('pop'); ts.src = BLOB + (POSE[s.p] || POSE.hi); void ts.offsetWidth; ts.classList.add('pop');
      place(); requestAnimationFrame(place);
    }
    function enter(k) {
      var s = steps[k]; busy = true; tw.style.opacity = '0';
      var go = function () { setTimeout(function () { i = k; show(); tw.style.opacity = '1'; busy = false; }, s.wait || 0); };
      if (s.pre) { try { var r = s.pre(); if (r && r.then) { r.then(go, go); return; } } catch (e) {} }
      go();
    }
    function fin(skipped) {
      W.removeEventListener('resize', place);
      var s = steps[i], el = !skipped && s.go && s.t ? s.t() : null;
      if (opt.onEnd) { try { opt.onEnd(el, !!skipped); } catch (e) {} }
      ov.style.opacity = '0';
      setTimeout(function () { try { ov.remove(); } catch (e) {} if (el) { try { el.click(); } catch (x) {} } }, el ? 120 : 320);
    }
    var lock = Date.now() + 500;
    ov.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      var now = Date.now(); if (busy || now < lock) return; lock = now + 450;
      try { if (host && host.hlSfx) host.hlSfx('tap'); } catch (x) {}
      if (i >= steps.length - 1) { fin(false); return; }
      enter(i + 1);
    });
    W.addEventListener('resize', place);
    enter(0);
    requestAnimationFrame(function () { ov.style.opacity = '1'; });
  }
  var FK = 'yoolmi-onb-flow';
  var flow = {
    get: function () { try { return W.localStorage.getItem(FK) || ''; } catch (e) { return ''; } },
    set: function (v) { try { W.localStorage.setItem(FK, v); } catch (e) {} },
    /* onboarding finished or skipped: everything it covered counts as seen */
    done: function () { try { var ls = W.localStorage; ['main', 'map', 'quiz', 'tip-water', 'chat-to'].forEach(function (k) { ls.setItem('yoolmi-tour-' + k, 'done'); }); ls.removeItem(FK); } catch (e) {} },
    TOTAL: 13
  };
  W.HLTour = { run: run, lang: lang, flow: flow };
})();
