import os,re,glob,shutil,json
D='dist/';O='gh/';shutil.rmtree(O,ignore_errors=True);shutil.copytree(D,O)
os.remove(O+'_headers');open(O+'.nojekyll','w').write('')
for f in glob.glob(O+'*.dc.html'):
    s=open(f).read()
    s=s.replace("location.replace('/?next='+encodeURIComponent(location.pathname))","location.replace('./?next='+encodeURIComponent(location.pathname.split('/').pop()))")
    s=s.replace('src="/support.js"','src="support.js"').replace('href="/manifest.webmanifest"','href="manifest.webmanifest"').replace('href="/icon-192.png"','href="icon-192.png"')
    s=s.replace('/_blob/','_blob/')
    s=s.replace('<meta name="viewport" content="width=390, viewport-fit=cover">',open('tpl/head.html').read().strip(),1)
    s=s.replace('width:390px;height:844px;','width:390px;height:var(--app-h,844px);',1)
    s=s.replace('html,body{background:#C3DFD8}body{display:flex;justify-content:center}','html,body{background:#C3DFD8;margin:0;overflow:hidden;height:100%}body{display:flex;justify-content:center;align-items:flex-start}',1)
    s=s.replace('<meta charset="utf-8">','<meta charset="utf-8"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><style>:root{color-scheme:only light!important}html,body{forced-color-adjust:none;background-color:#C3DFD8!important}button,input,select,textarea{color-scheme:only light}*{-webkit-tap-highlight-color:rgba(0,0,0,0)!important;tap-highlight-color:transparent}*:focus,*:focus-visible{outline:none!important}</style>',1)
    s=s.replace('<script src="support.js"></script>','<script src="support.js"></script><script src="install.js" defer></script>',1)
    open(f,'w').write(s)
s=open(O+'index.html').read()
s=s.replace("const safe=/^\\/[A-Za-z]+\\.dc\\.html$/.test(next)?next:'/Main.dc.html';","const nm=next.replace(/^\\//,'');const safe=/^[A-Za-z]+\\.dc\\.html$/.test(nm)?'./'+nm:'./Main.dc.html';")
s=s.replace("get('next')||'/Main.dc.html'","get('next')||'Main.dc.html'").replace("register('/sw.js')","register('sw.js')")
s=s.replace('href="/manifest.webmanifest"','href="manifest.webmanifest"').replace('"/icon-192.png"','"icon-192.png"')
assert "'./'+nm" in s and "register('sw.js')" in s
s=s.replace('<meta charset="utf-8">','<meta charset="utf-8"><meta name="color-scheme" content="light dark"><meta name="darkreader-lock"><style>:root{color-scheme:only light!important}</style>',1)
open(O+'index.html','w').write(s)
w=open(O+'sw.js').read()
w=w.replace("const SHELL=['/','/index.html','/support.js','/manifest.webmanifest','/icon-192.png','/icon-512.png','/Main.dc.html','/Mapa.dc.html','/Quiz.dc.html','/Clases.dc.html','/Carta.dc.html','/Nivel.dc.html'];",
 "const B=new URL(self.registration.scope).pathname;const SHELL=['','index.html','support.js','manifest.webmanifest','icon-192.png','icon-512.png','Main.dc.html','Mapa.dc.html','Quiz.dc.html','Clases.dc.html','Carta.dc.html','Nivel.dc.html','install.js'].map(x=>B+x);")
w=w.replace("fetch('/packs/index.json?v='","fetch(B+'packs/index.json?v='").replace("fetch('/packs/'+pk.file","fetch(B+'packs/'+pk.file")
w=w.replace("c.put('/_blob/'+e.id","c.put(B+'_blob/'+e.id")
w=w.replace("if(u.pathname.startsWith('/_blob/'))","if(u.pathname.startsWith(B+'_blob/'))")
w=w.replace("p.put(u.pathname==='/'?'/':u.pathname,r.clone())","p.put(u.pathname,r.clone())").replace("(await p.match('/Main.dc.html'))","(await p.match(B+'Main.dc.html'))")
assert w.count('B+')>=6
open(O+'sw.js','w').write(w)
m=json.load(open(O+'manifest.webmanifest'));m.update(start_url='./Main.dc.html',scope='./');m['icons']=[dict(i,src=i['src'].lstrip('/')) for i in m['icons']]
json.dump(m,open(O+'manifest.webmanifest','w'),ensure_ascii=False)
shutil.copy('tpl/install.js',O+'install.js')
if os.path.isdir('media'): shutil.copytree('media',O+'media',dirs_exist_ok=True)
import re as _re
for _f in os.listdir(O):
    if not _f.endswith('.dc.html'):continue
    _s=open(O+_f).read()
    _urls=list(dict.fromkeys(_re.findall(r"@font-face\{[^}]*?url\('(_blob/[0-9a-f]+)'\)",_s)))
    _pl=''.join(f'<link rel="preload" href="{u}" as="font" type="font/ttf" crossorigin>' for u in _urls)
    if 'id="hl-end"' not in _s and '</body>' in _s:
        _s=_s.replace('<script src="support.js"></script>','<link rel="expect" href="#hl-end" blocking="render"><script src="support.js"></script>',1)
        _i=_s.rindex('</body>');_s=_s[:_i]+'<i id="hl-end" hidden></i>'+_s[_i:]
    if _pl and 'rel="preload"' not in _s:
        _s=_s.replace('<script src="support.js"></script>',_pl+'<script src="support.js"></script>',1)
    open(O+_f,'w').write(_s)


# ---- persistent shell (index.html hosts every screen in one frame so BGM never restarts)
s=open(O+'index.html').read()
s=s.replace('<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">','<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">',1)
a="const go=()=>location.replace(safe);"
assert a in s
s=s.replace(a,"const sp=new URLSearchParams(location.search);sp.delete('next');const rest=(sp.toString()?'?'+sp.toString():'')+location.hash;const go=()=>setTimeout(()=>window.__hlShow(safe+rest),2300);")
s=s.replace('</body>','<iframe id="hl-f" title="한글 나라" allow="autoplay; clipboard-write; web-share; fullscreen" style="position:fixed;inset:0;width:100%;height:100%;border:0;display:none;background:#C3DFD8"></iframe><script src="shell.js"></script><script src="install.js" defer></script></body>',1)
# shell script must exist before the boot script calls __hlShow
i=s.find('<script>\n(async()=>{'); assert i>0
j=s.find('</script>',i)+len('</script>')
boot=s[i:j]; s=s[:i]+s[j:]
s=s.replace('<script src="install.js" defer></script></body>','<script src="install.js" defer></script>'+boot+'</body>',1)
open(O+'index.html','w').write(s)
shutil.copy('tpl/shell.js',O+'shell.js')
ij=open(O+'install.js').read(); assert ij.count('(function(){')>=1
ij=ij.replace('(function(){','(function(){\n  if (window.top !== window) return;',1); open(O+'install.js','w').write(ij)
w=open(O+'sw.js').read(); w=w.replace("'install.js'].map(x=>B+x)","'install.js','shell.js'].map(x=>B+x)"); assert "'shell.js'" in w; open(O+'sw.js','w').write(w)
SHD="const __SH = this.bgmShell(); "
for _f in os.listdir(O):
    if not _f.endswith('.dc.html'):continue
    _s=open(O+_f).read()
    if 'bgmStart() {\n' not in _s: continue
    R=[('bgmStart() {\n',"bgmShell() { try { const p = window.parent; if (p && p !== window && p.__hlBgm) return p.__hlBgm; } catch (e) {} return null; }\nbgmStart() {\n"+SHD+"if (__SH) { __SH.start(); return; }\n"),
       ('bgmStop() {\n','bgmStop() {\n'+SHD+'if (__SH) { __SH.stop(); return; }\n'),
       ('bgmInit() {\n','bgmInit() {\n'+SHD+"if (__SH) { this._dead = false; this._bgmGesture = () => __SH.gesture(); try { document.addEventListener('pointerdown', this._bgmGesture); } catch (e) {} if (this.bgmIsOn()) __SH.start(); return; }\n"),
       ('bgmDestroy() {\n','bgmDestroy() {\n'+SHD+"if (__SH) { this._dead = true; try { document.removeEventListener('pointerdown', this._bgmGesture); } catch (e) {} return; }\n"),
       ('bgmSave(on) { const W = window','bgmSave(on) { if (this.bgmShell()) return; const W = window')]
    for a,b in R:
        assert _s.count(a)==1,(_f,a); _s=_s.replace(a,b)
    open(O+_f,'w').write(_s)

# ---- inert template: keep the browser from fetching "{{ x }}" image URLs before the runtime renders, and skip the runtime's self-refetch
for _f in os.listdir(O):
    if not _f.endswith('.dc.html'):continue
    _s=open(O+_f).read()
    if 'id="hl-tpl"' in _s: continue
    _i=_s.find('<x-dc>');_j=_s.rfind('</x-dc>')
    if _i<0 or _j<0: continue
    _inner=_s[_i+6:_j]
    assert '</script' not in _inner.lower() and '<!--' not in _inner, _f
    _boot='<script>(function(){var s=document.getElementById("hl-tpl"),x=document.querySelector("x-dc");if(!s||!x)return;var t=s.textContent;Object.defineProperty(x,"innerHTML",{get:function(){return t},configurable:true});window.__resources=window.__resources||{};})();</script>'
    _s=_s[:_i]+'<script type="text/plain" id="hl-tpl">'+_inner+'</script><x-dc></x-dc>'+_boot+_s[_j+7:]
    open(O+_f,'w').write(_s)
print('ok', len(os.listdir(O)))
