// End-to-end test of hl-core.js (login, pull/push sync, server-owned carrots and paid status, account deletion,
// version guard) against an in-memory mock of the Supabase functions with the same rules as the SQL migration.
// usage: HL_FORCE_AUTH=1 python3 tools/build.py --channel test && node tools/qa/sync-e2e.js
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const OUT = path.join(__dirname, '..', '..', '.build', 'out');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
const CAP = 60, IMPORT_CAP = 500, UID = 'aaaaaaaa-1111-4111-8111-111111111111';
const DB = { state: null, at: null, carrots: 0, earned: 0, paid: false, deleted: false, errors: [] };
let verOverride = null;

function rpc(name, a) {
  if (DB.deleted) return { error: { message: 'not signed in' } };
  if (name === 'get_my_state') return { data: { state: DB.state, state_at: DB.at, carrots: DB.carrots, paid: DB.paid, enrollments: [], config: {}, member_code: UID.slice(0, 8).toUpperCase() } };
  if (name === 'save_state') {
    const d = a.p_data || {}; const want = Math.max(0, parseInt(d['yoolmi-coins'] || '0', 10) || 0);
    const first = DB.state === null;
    if (want < DB.carrots) DB.carrots = want; else if (first) DB.carrots += Math.min(want - DB.carrots, IMPORT_CAP); else { const give = Math.min(want - DB.carrots, Math.max(0, CAP - DB.earned)); DB.carrots += give; DB.earned += give; }
    const clean = Object.assign({}, d); ['yoolmi-coins', 'yoolmi-paid', 'yoolmi-pay', 'yoolmi-chat-ban', 'yoolmi-chat-strike'].forEach((k) => delete clean[k]);
    DB.state = clean; DB.at = new Date(Date.now()).toISOString();
    return { data: { carrots: DB.carrots, state_at: DB.at, paid: DB.paid } };
  }
  if (name === 'delete_my_account') { DB.deleted = true; DB.state = null; DB.carrots = 0; return { data: null }; }
  if (name === 'log_client_error') { DB.errors.push(a.p_msg); return { data: null }; }
  return { error: { message: 'unknown rpc ' + name } };
}
const MOCK = `window.supabase={createClient:function(){var S=function(){return localStorage.getItem('mock-session')==='1'};return{
 auth:{getSession:function(){return Promise.resolve({data:{session:S()?{user:{id:'${UID}',app_metadata:{provider:'google'}}}:null}})},
  signInWithOAuth:function(){localStorage.setItem('mock-session','1');location.reload();return Promise.resolve({})},
  exchangeCodeForSession:function(){return Promise.resolve({})},
  signOut:function(){localStorage.removeItem('mock-session');return Promise.resolve({})}},
 rpc:function(n,a){return fetch('/mock-rpc/'+n,{method:'POST',body:JSON.stringify(a||{})}).then(function(r){return r.json()})}}}};`;

const srv = http.createServer((q, r) => {
  if (q.url.startsWith('/mock-rpc/')) { let b = ''; q.on('data', (c) => b += c); q.on('end', () => { r.writeHead(200, { 'content-type': 'application/json' }); r.end(JSON.stringify(rpc(q.url.slice(10), JSON.parse(b || '{}')))); }); return; }
  let u = decodeURIComponent(q.url.split('?')[0]);
  if (!u.startsWith('/Hangulandia/')) { r.writeHead(404); return r.end(); }
  u = u.slice(13) || 'index.html'; const f = path.join(OUT, u);
  if (!f.startsWith(OUT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  let body = fs.readFileSync(f);
  if (verOverride && u === 'Main.dc.html') body = Buffer.from(body.toString().replace(/<meta name="hl-ver" content="[^"]*">/, '<meta name="hl-ver" content="' + verOverride + '">'));
  r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(body);
}).listen(8791);

const BASE = { 'hl-reset-ep': '20261111a', 'yoolmi-data-v': '6', 'yoolmi-lang': 'es', 'yoolmi-lang-set': '1', 'yoolmi-intro': 'seen', 'yoolmi-story': 'done', 'yoolmi-onb': 'done', 'yoolmi-nick': 'Ana', 'yoolmi-auth': JSON.stringify({ prov: 'google', done: true }), 'yoolmi-tour': 'done', 'yoolmi-tour-main': 'done', 'yoolmi-tour-map': 'done', 'hl-inst-hide': '9999999999999', 'yoolmi-beta1': '1', 'yoolmi-free1': '1', 'yoolmi-level': '{"level":0}' };
const results = []; const ok = (name, cond, info) => { results.push([cond ? 'PASS' : 'FAIL', name, info || '']); };

(async () => {
  const b = await chromium.launch();
  const device = async (ls) => {
    const c = await b.newContext({ viewport: { width: 390, height: 844 } });
    await c.route(/fonts\.googleapis|fonts\.gstatic/, (rt) => rt.abort());
    await c.route(/cdn\.jsdelivr\.net\/npm\/@supabase/, (rt) => rt.fulfill({ status: 200, contentType: 'text/javascript', body: MOCK }));
    await c.addInitScript((o) => { if (sessionStorage.getItem('qa')) return; sessionStorage.setItem('qa', '1'); localStorage.clear(); for (const k in o) localStorage.setItem(k, o[k]); }, ls);
    const p = await c.newPage(); p.__errs = []; p.on('pageerror', (e) => p.__errs.push(e.message));
    return { c, p };
  };
  const LS = (p, k) => p.evaluate((k) => localStorage.getItem(k), k);
  const hide = (p) => p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });

  // A: signed-in device with local progress -> first sync uploads it
  const A = await device(Object.assign({}, BASE, { 'mock-session': '1', 'yoolmi-coins': '5', 'yoolmi-wr-jaeum': '[0,1,2]' }));
  await A.p.goto('http://localhost:8791/Hangulandia/?next=Main.dc.html', { waitUntil: 'commit' }); await A.p.waitForTimeout(7000);
  await hide(A.p); await A.p.waitForTimeout(800);
  ok('first login uploads local progress', DB.state && DB.state['yoolmi-wr-jaeum'] === '[0,1,2]');
  ok('carrots accepted within daily cap', DB.carrots === 5, 'server=' + DB.carrots);
  // A: tampered carrots are clamped by the server and written back
  await A.p.evaluate(() => { localStorage.setItem('yoolmi-coins', '500'); localStorage.setItem('yoolmi-paid', '1'); localStorage.setItem('yoolmi-wr-moeum', '[0]'); });
  await A.p.evaluate(() => { document.dispatchEvent(new Event('visibilitychange')); }); await A.p.waitForTimeout(900);
  ok('tampered carrots clamped to daily cap', DB.carrots === 5 + CAP, 'server=' + DB.carrots);
  ok('device corrected to server carrots', (await LS(A.p, 'yoolmi-coins')) === String(5 + CAP), 'local=' + (await LS(A.p, 'yoolmi-coins')));
  ok('paid flag from device ignored', DB.paid === false && !('yoolmi-paid' in DB.state));
  ok('no script errors on device A', A.p.__errs.length === 0, A.p.__errs.join(' | '));
  await A.c.close();

  // B: new phone, same account -> progress restored and kept after screens load
  DB.paid = true;
  const B = await device({ 'hl-reset-ep': '20261111a', 'mock-session': '1', 'yoolmi-lang': 'es', 'yoolmi-lang-set': '1' });
  await B.p.goto('http://localhost:8791/Hangulandia/?next=Main.dc.html', { waitUntil: 'commit' }); await B.p.waitForTimeout(9000);
  ok('new device restores progress', (await LS(B.p, 'yoolmi-wr-moeum')) === '[0]');
  ok('restored data survives screen start (no legacy wipe)', (await LS(B.p, 'yoolmi-wr-jaeum')) === '[0,1,2]');
  ok('new device gets server carrots', (await LS(B.p, 'yoolmi-coins')) === String(5 + CAP));
  ok('paid status comes from server enrollment', (await LS(B.p, 'yoolmi-paid')) === '1');
  ok('onboarding not repeated on new device', JSON.parse((await LS(B.p, 'yoolmi-auth')) || '{}').done === true);
  // B: delete account from the settings hook
  const del = await B.p.evaluate(async () => { const f = document.getElementById('hl-f'); const r = await f.contentWindow.YM.deleteAccount(); return r; });
  await B.p.waitForTimeout(2500);
  ok('delete account succeeds', del && del.ok === true);
  ok('server data gone after delete', DB.deleted && DB.state === null);
  ok('device data cleared after delete', (await LS(B.p, 'yoolmi-wr-jaeum')) === null);
  ok('no script errors on device B', B.p.__errs.length === 0, B.p.__errs.join(' | '));
  await B.c.close();

  // C: shell and screen from different releases -> one reload, then reported
  DB.deleted = false; DB.errors = []; verOverride = 'OLD-RELEASE';
  const C = await device(Object.assign({}, BASE, { 'mock-session': '1' }));
  let navs = 0; C.p.on('load', () => { navs++; });
  await C.p.goto('http://localhost:8791/Hangulandia/?next=Main.dc.html', { waitUntil: 'commit' }); await C.p.waitForTimeout(14000);
  ok('version mismatch triggers exactly one reload', navs === 2, 'page loads=' + navs);
  ok('persisting mismatch is reported to server', DB.errors.some((m) => /version mismatch/.test(m)), DB.errors.join(' | '));
  await C.c.close();

  await b.close(); srv.close();
  results.forEach((r) => console.log(r[0] + '  ' + r[1] + (r[2] ? '  (' + r[2] + ')' : '')));
  const bad = results.filter((r) => r[0] === 'FAIL').length;
  console.log(bad ? '\nSYNC E2E FAILED: ' + bad : '\nsync e2e ok: ' + results.length + ' checks');
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
