/* hl-core.js — runs once in the shell (index.html) before any screen.
   1) data migrations  2) release version guard  3) error reporting  4) login + server sync
   Screens keep reading/writing localStorage; this file is the only place that talks to the server. */
(function () {
  'use strict';
  var W = window, LS, SS;
  try { LS = W.localStorage; SS = W.sessionStorage; } catch (e) { return; }
  var HL = W.HL = { ver: '20261113.0613-3c673bf', channel: 'test', cfg: {"supabaseUrl": "https://ycjnjjcmnxwsgclllzch.supabase.co", "anonKey": "sb_publishable_e3pnBpIximPrgJNMuiTjOg_QTMkgUlM", "authEnabled": false} };

  /* ---------- 1) data migrations ----------
     Baseline is yoolmi-data-v=6. Add a step here whenever a stored value changes shape.
     Never delete user data in a step; rename/convert instead. Each step must be idempotent. */
  var LATEST = 6;
  var STEPS = {
    // 7: function (ls) { /* example: ls.setItem('new-key', convert(ls.getItem('old-key'))); */ },
  };
  function migrate() {
    var hasData = false;
    for (var i = 0; i < LS.length; i++) { if ((LS.key(i) || '').indexOf('yoolmi-') === 0) { hasData = true; break; } }
    var cur = Number(LS.getItem('yoolmi-data-v')) || 0;
    if (!hasData) return;                    // fresh install: screens set up their own defaults
    if (cur < 6) return;                     // pre-6 data is reset by the screens' legacy guard
    for (var v = cur + 1; v <= LATEST; v++) {
      if (STEPS[v]) { try { STEPS[v](LS); } catch (e) { report('migrate ' + v + ': ' + e.message, 'core'); return; } }
      LS.setItem('yoolmi-data-v', String(v));
    }
  }

  /* ---------- 3) error reporting (only for signed-in users, max 10 per session) ---------- */
  var errQ = [], errN = 0;
  function report(msg, page) {
    msg = String(msg || '').slice(0, 500);
    if (!msg || errN >= 10) return;
    errN++; errQ.push({ msg: msg, page: page || '' });
    flushErr();
  }
  function flushErr() {
    if (!sb || !user || !errQ.length) return;
    var q = errQ.splice(0);
    q.forEach(function (x) { sb.rpc('log_client_error', { p_ver: HL.ver, p_page: x.page, p_msg: x.msg }).then(function () {}, function () {}); });
  }
  W.addEventListener('error', function (e) { report((e && e.message) || 'error', 'shell'); });
  W.addEventListener('unhandledrejection', function (e) { report('rejection: ' + ((e && e.reason && e.reason.message) || e.reason), 'shell'); });
  HL.report = report;

  /* ---------- 2) release version guard: shell and screens must come from the same build ---------- */
  function watchFrame() {
    var f = document.getElementById('hl-f');
    if (!f) { setTimeout(watchFrame, 200); return; }
    f.addEventListener('load', function () {
      var d, cw, name = '';
      try { d = f.contentDocument; cw = f.contentWindow; name = cw.location.pathname.split('/').pop(); } catch (e) { return; }
      if (!/\.dc\.html$/.test(name)) return;
      var m = d && d.querySelector('meta[name="hl-ver"]'), v = m ? m.getAttribute('content') : '';
      if (v && v !== HL.ver) {
        var k = 'hl-vfix-' + HL.ver + '-' + v;
        if (!SS.getItem(k)) {
          SS.setItem(k, '1');
          var done = function () { location.reload(); };
          try { navigator.serviceWorker.getRegistration().then(function (r) { return r && r.update(); }).then(done, done); } catch (e) { done(); }
          return;
        }
        report('version mismatch shell ' + HL.ver + ' screen ' + v, name);
      }
      try {
        cw.addEventListener('error', function (e) { report((e && e.message) || 'error', name); });
        var ce = cw.console.error;
        cw.console.error = function () {
          try { var s = Array.prototype.join.call(arguments, ' '); if (/FAILED|TypeError|ReferenceError|SyntaxError/.test(s)) report(s, name); } catch (x) {}
          return ce.apply(this, arguments);
        };
      } catch (e) {}
      if (AUTH.enabled) {
        try {
          cw.YM = {
            deleteAccount: function () { return AUTH.deleteAccount().then(function () { return { ok: true }; }, function (e) { report('delete: ' + (e && e.message), name); return { ok: false }; }); },
            logout: function () { AUTH.signOut(); },
            memberCode: function () { return AUTH.memberCode(); }
          };
        } catch (e) {}
      }
      if (pendingReload) { pendingReload = false; }
    });
  }

  /* ---------- 4) login + server sync ---------- */
  var sb = null, user = null, pendingReload = false, lastSent = '', pushing = false, timer = 0;
  var DEVICE = /^(yoolmi-(bgm|sfx|plant-anim|open-|platform|intro-try|rm-last|data-v))/;
  function snapshot() {
    var o = {};
    for (var i = 0; i < LS.length; i++) {
      var k = LS.key(i) || '';
      if (k.indexOf('yoolmi-') !== 0 || DEVICE.test(k)) continue;
      o[k] = LS.getItem(k);
    }
    return o;
  }
  function applyState(state) {
    var keep = {};
    for (var i = 0; i < LS.length; i++) { var k = LS.key(i) || ''; if (k.indexOf('yoolmi-') === 0 && !DEVICE.test(k)) keep[k] = 1; }
    Object.keys(keep).forEach(function (k) { LS.removeItem(k); });
    Object.keys(state || {}).forEach(function (k) { if (k.indexOf('yoolmi-') === 0 && !DEVICE.test(k) && typeof state[k] === 'string') LS.setItem(k, state[k]); });
    LS.setItem('yoolmi-data-v', String(LATEST));
  }
  function applyAuthority(r) {
    if (typeof r.carrots === 'number') LS.setItem('yoolmi-coins', String(r.carrots));
    if (typeof r.paid === 'boolean') LS.setItem('yoolmi-paid', r.paid ? '1' : '0');
  }
  function frameShown() { var f = document.getElementById('hl-f'); return !!(f && f.getAttribute('src')); }
  function reloadFrame() { var f = document.getElementById('hl-f'); try { if (f && f.contentWindow) f.contentWindow.location.reload(); } catch (e) {} }

  function pull() {
    return sb.rpc('get_my_state').then(function (res) {
      if (res.error) throw res.error;
      var r = res.data || {};
      var mine = LS.getItem('hl-sync-uid') === user.id;
      var localAt = Number(LS.getItem('hl-sync-at')) || 0;
      var serverAt = r.state_at ? Date.parse(r.state_at) : 0;
      var changed = false;
      if (r.state && (!mine || serverAt > localAt)) { applyState(r.state); changed = true; }
      if (!r.state && !LS.getItem('yoolmi-auth')) {
        LS.setItem('yoolmi-auth', JSON.stringify({ prov: (user.app_metadata && user.app_metadata.provider) || 'google', at: Date.now(), done: false }));
        changed = true;
      }
      if (r.state) applyAuthority(r);
      else if (typeof r.paid === 'boolean') LS.setItem('yoolmi-paid', r.paid ? '1' : '0');  // first sync: upload this device's carrots, server decides
      LS.setItem('hl-sync-uid', user.id);
      if (serverAt) LS.setItem('hl-sync-at', String(serverAt));
      lastSent = r.state ? JSON.stringify(snapshot()) : '';
      if (changed && frameShown()) reloadFrame();
      flushErr();
    });
  }
  function push(force) {
    if (!sb || !user || pushing) return;
    if (LS.getItem('hl-sync-uid') !== user.id) return;
    var snap = snapshot(), js = JSON.stringify(snap);
    if (!force && js === lastSent) return;
    pushing = true;
    sb.rpc('save_state', { p_data: snap, p_client_ver: HL.ver }).then(function (res) {
      pushing = false;
      if (res.error) { report('save_state: ' + res.error.message, 'core'); return; }
      var r = res.data || {};
      lastSent = js;
      if (r.state_at) LS.setItem('hl-sync-at', String(Date.parse(r.state_at)));
      var before = LS.getItem('yoolmi-coins');
      applyAuthority(r);
      if (before !== LS.getItem('yoolmi-coins')) lastSent = '';
    }, function (e) { pushing = false; });
  }
  function startSync() {
    clearInterval(timer);
    timer = setInterval(function () { push(false); }, 15000);
    document.addEventListener('visibilitychange', function () { if (document.hidden) push(false); else if (user) pull().catch(function () {}); });
    W.addEventListener('pagehide', function () { push(false); });
  }

  var AUTH = W.__hlAuth = {
    enabled: false,
    user: function () { return user; },
    memberCode: function () { return user ? user.id.slice(0, 8).toUpperCase() : ''; },
    signIn: function (provider) {
      if (!sb) return Promise.reject(new Error('auth off'));
      var back = location.origin + location.pathname;
      return sb.auth.signInWithOAuth({ provider: provider === 'facebook' ? 'facebook' : 'google', options: { redirectTo: back } });
    },
    signOut: function () {
      var fin = function () { applyState({}); LS.removeItem('hl-sync-uid'); LS.removeItem('hl-sync-at'); location.replace(location.pathname); };
      if (!sb) { fin(); return Promise.resolve(); }
      push(true);
      return sb.auth.signOut().then(fin, fin);
    },
    deleteAccount: function () {
      if (!sb || !user) return Promise.reject(new Error('not signed in'));
      return sb.rpc('delete_my_account').then(function (res) {
        if (res.error) throw res.error;
        return sb.auth.signOut().catch(function () {}).then(function () {
          applyState({}); LS.removeItem('hl-sync-uid'); LS.removeItem('hl-sync-at'); LS.removeItem('yoolmi-auth');
          location.replace(location.pathname);
        });
      });
    }
  };

  function loadSdk(cb) {
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
    s.integrity = HL.cfg.sdkIntegrity || '';
    if (!s.integrity) s.removeAttribute('integrity');
    s.crossOrigin = 'anonymous';
    s.onload = cb; s.onerror = function () { report('supabase sdk load failed', 'core'); };
    document.head.appendChild(s);
  }
  function initAuth() {
    var c = HL.cfg;
    if (!c || !c.supabaseUrl || !c.anonKey || !c.authEnabled) return;
    AUTH.enabled = true;
    var qs = new URLSearchParams(location.search), code = qs.get('code');
    if (code) { qs.delete('code'); history.replaceState(null, '', location.pathname + (qs.toString() ? '?' + qs : '') + location.hash); }
    loadSdk(function () {
      sb = W.supabase.createClient(c.supabaseUrl, c.anonKey, { auth: { flowType: 'pkce', detectSessionInUrl: false, persistSession: true, storageKey: 'hl-auth' } });
      var go = function () {
        sb.auth.getSession().then(function (r) {
          var s = r.data && r.data.session;
          if (!s) return;
          user = s.user;
          pull().then(startSync, function (e) { report('pull: ' + (e && e.message), 'core'); startSync(); });
        });
      };
      if (code) sb.auth.exchangeCodeForSession(code).then(go, function (e) { report('oauth: ' + e.message, 'core'); go(); });
      else go();
    });
  }

  try { migrate(); } catch (e) {}
  watchFrame();
  try { initAuth(); } catch (e) { report('init: ' + e.message, 'core'); }
})();
