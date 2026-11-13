// Browser release gate: every screen must load and run with no script errors.
// usage: node tools/qa/smoke.js            (serves .build/out at http://localhost:8790/Hangulandia/)
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const OUT = path.join(__dirname, '..', '..', '.build', 'out');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.mp4': 'video/mp4', '.m4a': 'audio/mp4', '.jpg': 'image/jpeg' };
const SCREENS = ['Main', 'Mapa', 'Quiz', 'Clases', 'Carta', 'Nivel'];
const BASE = { 'hl-reset-ep': '20261111a', 'yoolmi-data-v': '6', 'yoolmi-lang': 'es', 'yoolmi-lang-set': '1', 'yoolmi-intro': 'seen', 'yoolmi-story': 'done', 'yoolmi-onb': 'done', 'yoolmi-nick': 'Ana', 'yoolmi-auth': JSON.stringify({ prov: 'google', done: true }), 'yoolmi-tour': 'done', 'yoolmi-tour-main': 'done', 'yoolmi-tour-map': 'done', 'hl-inst-hide': '9999999999999', 'yoolmi-beta1': '1', 'yoolmi-free1': '1', 'yoolmi-level': '{"level":0}' };
const IGNORE = /fonts\.googleapis|fonts\.gstatic|ERR_TUNNEL|ERR_NAME_NOT_RESOLVED|net::ERR_|Failed to load resource|favicon|play\(\) failed|NotAllowedError/i;

const srv = http.createServer((q, r) => {
  let u = decodeURIComponent(q.url.split('?')[0]);
  if (!u.startsWith('/Hangulandia/')) { r.writeHead(404); return r.end(); }
  u = u.slice(13) || 'index.html';
  const f = path.join(OUT, u);
  if (!f.startsWith(OUT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(r);
}).listen(8790);

(async () => {
  const b = await chromium.launch();
  const fails = [];
  const run = async (label, url, ls, waitMs) => {
    const c = await b.newContext({ viewport: { width: 390, height: 844 } });
    await c.addInitScript((o) => { if (sessionStorage.getItem('qa')) return; sessionStorage.setItem('qa', '1'); localStorage.clear(); for (const k in o) localStorage.setItem(k, o[k]); }, ls || {});
    await c.route(/fonts\.googleapis|fonts\.gstatic/, (rt) => rt.abort());
    const p = await c.newPage(); const errs = [];
    p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
    p.on('console', (m) => { const t = m.text(); if ((m.type() === 'error' || /FAILED/.test(t)) && !IGNORE.test(t)) errs.push('console: ' + t.slice(0, 300)); });
    p.on('response', (r) => { if (r.status() >= 400 && r.url().includes('/Hangulandia/') && !/favicon/.test(r.url())) errs.push('http ' + r.status() + ' ' + r.url()); });
    await p.goto(url, { waitUntil: 'commit' }); await p.waitForTimeout(waitMs);
    const shown = await p.evaluate(() => { const f = document.getElementById('hl-f'); return f ? f.getAttribute('src') || '' : location.pathname; });
    await c.close();
    if (errs.length) fails.push(label + '\n   ' + errs.slice(0, 8).join('\n   '));
    console.log((errs.length ? 'FAIL ' : 'ok   ') + label + (shown ? '  [' + shown + ']' : ''));
  };
  await run('fresh install (shell + language screen)', 'http://localhost:8790/Hangulandia/', {}, 9000);
  for (const n of SCREENS) await run('screen ' + n + ' (es)', 'http://localhost:8790/Hangulandia/?next=' + n + '.dc.html', BASE, 9000);
  await run('screen Main (ko)', 'http://localhost:8790/Hangulandia/?next=Main.dc.html', Object.assign({}, BASE, { 'yoolmi-lang': 'ko' }), 9000);
  await b.close(); srv.close();
  if (fails.length) { console.log('\nSMOKE FAILED\n' + fails.join('\n')); process.exit(1); }
  console.log('smoke ok');
})().catch((e) => { console.error(e); process.exit(1); });
