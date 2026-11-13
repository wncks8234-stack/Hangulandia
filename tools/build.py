#!/usr/bin/env python3
"""Build the app from source.

    python3 tools/build.py --channel test   # GitHub Pages test harness (default)
    python3 tools/build.py --channel prod   # store/production build: no test hooks, no remote reset

Output goes to .build/out/. Nothing outside .build/ is written.
"""
import argparse, json, os, re, shutil, subprocess, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = os.path.join(ROOT, 'tools')
W = os.path.join(ROOT, '.build')
SCREENS = ['Main', 'Mapa', 'Quiz', 'Clases', 'Carta', 'Nivel']
BLOCK = ('<meta name="viewport" content="width=390, viewport-fit=cover"><meta name="theme-color" content="#C3DFD8">'
         '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">'
         '<meta name="apple-mobile-web-app-title" content="한글 나라"><link rel="manifest" href="/manifest.webmanifest">'
         '<link rel="icon" href="/icon-192.png"><link rel="apple-touch-icon" href="/icon-192.png">'
         '<style>html,body{background:#C3DFD8}body{display:flex;justify-content:center}</style>')


def git_rev():
    try:
        return subprocess.check_output(['git', 'rev-parse', '--short=7', 'HEAD'], cwd=ROOT, text=True, stderr=subprocess.DEVNULL).strip()
    except Exception:
        return 'local'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--channel', choices=['test', 'prod'], default='test')
    ap.add_argument('--version', default=None, help='override APP_VERSION')
    a = ap.parse_args()
    ver = a.version or (datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d.%H%M') + '-' + git_rev())
    cfg = json.load(open(os.path.join(T, 'config.json')))[a.channel]
    if os.environ.get('HL_FORCE_AUTH') == '1':
        cfg = dict(cfg, authEnabled=True)  # QA only: exercise the sync code against the mock server

    shutil.rmtree(W, ignore_errors=True)
    os.makedirs(os.path.join(W, 'site'))
    for f in os.listdir(os.path.join(T, 'static')):
        shutil.copy(os.path.join(T, 'static', f), os.path.join(W, 'site', f))
    for n in SCREENS:
        s = open(os.path.join(ROOT, 'src', 'screens', n + '.dc.html')).read()
        if s.count('<script src="./support.js"></script>') != 1:
            sys.exit('screen %s: expected exactly one support.js tag' % n)
        s = s.replace('<script src="./support.js"></script>', '<script src="/support.js"></script>' + BLOCK, 1)
        open(os.path.join(W, 'site', n + '.dc.html'), 'w').write(s)
    os.symlink(os.path.join(ROOT, 'assets', 'opt'), os.path.join(W, 'opt'))
    os.symlink(os.path.join(ROOT, 'assets', 'media'), os.path.join(W, 'media'))
    os.symlink(os.path.join(ROOT, 'assets', 'meta.json'), os.path.join(W, 'meta.json'))
    os.symlink(os.path.join(T, 'tpl'), os.path.join(W, 'tpl'))
    for step in ('pack.py', 'rel.py'):
        subprocess.check_call([sys.executable, os.path.join(T, step)], cwd=W)
    out = os.path.join(W, 'out')
    os.rename(os.path.join(W, 'gh'), out)

    # ---- release stamping: every file carries the same APP_VERSION
    stamp = '<meta name="hl-ver" content="%s">' % ver
    for n in SCREENS:
        p = os.path.join(out, n + '.dc.html')
        s = open(p).read()
        s = s.replace('<meta charset="utf-8">', '<meta charset="utf-8">' + stamp, 1)
        open(p, 'w').write(s)
    core = open(os.path.join(T, 'tpl', 'hl-core.js')).read()
    core = core.replace('__HL_VER__', ver).replace('__HL_CHANNEL__', a.channel).replace('__HL_CFG__', json.dumps(cfg))
    open(os.path.join(out, 'hl-core.js'), 'w').write(core)
    p = os.path.join(out, 'index.html')
    s = open(p).read()
    s = s.replace('<meta charset="utf-8">', '<meta charset="utf-8">' + stamp + '<script src="hl-core.js"></script>', 1)
    if a.channel == 'prod':
        s, k = re.subn(r'<!--TEST-ONLY-->.*?<!--/TEST-ONLY-->', '', s, flags=re.S)
        if k < 1:
            sys.exit('prod build: TEST-ONLY block not found in index.html')
    open(p, 'w').write(s)
    sw = os.path.join(out, 'sw.js')
    w = open(sw).read().replace("'install.js','shell.js'].map", "'install.js','shell.js','hl-core.js'].map")
    w = w.replace("const B=new URL", "/* app " + ver + " */const B=new URL", 1)
    open(sw, 'w').write(w)
    for f in ['delete-account.html'] + (['demo.html'] if a.channel == 'test' else []):
        src = os.path.join(T, 'static-pages', f)
        if os.path.exists(src):
            open(os.path.join(out, f), 'w').write(open(src).read().replace('__HL_CFG__', json.dumps(cfg)))
    open(os.path.join(out, 'version.json'), 'w').write(json.dumps({'version': ver, 'channel': a.channel}))
    print('built', a.channel, ver, '->', os.path.relpath(out, ROOT))


if __name__ == '__main__':
    main()
