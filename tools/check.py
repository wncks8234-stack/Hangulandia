#!/usr/bin/env python3
"""Static release gate. Usage: python3 tools/check.py --channel test|prod  (checks .build/out)"""
import argparse, json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, '.build', 'out')
SCREENS = ['Main', 'Mapa', 'Quiz', 'Clases', 'Carta', 'Nivel']
BUDGET_KB = 2500
ap = argparse.ArgumentParser(); ap.add_argument('--channel', default='test'); a = ap.parse_args()
bad = []
def need(ok, msg):
    if not ok: bad.append(msg)
ver = json.load(open(os.path.join(OUT, 'version.json')))
need(ver['channel'] == a.channel, 'version.json channel %s != %s' % (ver['channel'], a.channel))
idx = open(os.path.join(OUT, 'index.html')).read()
need('<meta name="hl-ver" content="%s">' % ver['version'] in idx, 'index.html missing version stamp')
need('hl-core.js' in idx, 'index.html does not load hl-core.js')
for n in SCREENS:
    p = os.path.join(OUT, n + '.dc.html'); s = open(p).read()
    need('<meta name="hl-ver" content="%s">' % ver['version'] in s, n + ': version stamp missing or different')
    need('window.__comp' not in s, n + ': test hook window.__comp left in build')
    need(s.count('id="hl-tpl"') == 1, n + ': inert template wrapper missing')
    need(os.path.getsize(p) // 1024 < BUDGET_KB, n + ': over size budget %d KB' % BUDGET_KB)
    need("ls.getItem('yoolmi-data-v') !== '6'" not in s, n + ': legacy data wipe would delete data on version bump')
    need(not re.search(r'service_role|sb_secret_', s), n + ': server secret in client file')
for f in os.listdir(OUT):
    if f.endswith(('.html', '.js', '.json')):
        t = open(os.path.join(OUT, f), errors='ignore').read()
        need(not re.search(r'service_role|sb_secret_', t), f + ': server secret in client file')
if a.channel == 'prod':
    need('hl-reset-ep' not in idx and 'reset=1' not in idx, 'prod: remote reset code still in index.html')
cfg = json.load(open(os.path.join(ROOT, 'tools', 'config.json')))[a.channel]
need(not cfg.get('authEnabled') or (cfg.get('supabaseUrl') and cfg.get('anonKey')), 'config: auth enabled without url/key')
if bad:
    print('CHECK FAILED'); [print(' -', b) for b in bad]; sys.exit(1)
print('check ok', a.channel, ver['version'])
