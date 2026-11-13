import os,json,glob,shutil,hashlib,re
S='site/';O='dist/';shutil.rmtree(O,ignore_errors=True);os.makedirs(O+'packs')
meta=json.load(open('meta.json'))
items=sorted(((f,os.path.getsize('opt/'+f)) for f in os.listdir('opt')),key=lambda x:-x[1])
N=4;packs=[[] for _ in range(N)];sz=[0]*N
for f,s in items:
    i=sz.index(min(sz));packs[i].append(f);sz[i]+=s
idx={'packs':[]};h=hashlib.sha1()
for i,pk in enumerate(packs):
    buf=bytearray();ent=[]
    for f in sorted(pk):
        d=open('opt/'+f,'rb').read();ent.append({'id':f,'o':len(buf),'n':len(d),'t':meta[f]});buf+=d
    h.update(buf);name=f'assets-{i+1}.bin';open(O+'packs/'+name,'wb').write(buf);idx['packs'].append({'file':name,'items':ent})
ver=h.hexdigest()[:10]
json.dump(idx,open(O+'packs/index.json','w'),separators=(',',':'))
guard='<script>if(\'serviceWorker\' in navigator&&!navigator.serviceWorker.controller){location.replace(\'/?next=\'+encodeURIComponent(location.pathname));}</script>'
for f in glob.glob(S+'*.dc.html'):
    s=open(f).read();s=s.replace('<script src="/support.js"></script>',guard+'<script src="/support.js"></script>',1)
    s=re.sub(r'\n\s*\n+','\n',s)
    open(O+os.path.basename(f),'w').write(s)
for f in ['support.js','manifest.webmanifest','icon-192.png','icon-512.png']: shutil.copy(S+f,O+f)
shutil.copy('tpl/index.html',O+'index.html')
open(O+'sw.js','w').write(open('tpl/sw.js').read().replace('__VER__',ver).replace('__PACKS__',json.dumps([p['file'] for p in idx['packs']])))
open(O+'_headers','w').write('''/packs/*
  Cache-Control: public, max-age=31536000, immutable
/packs/index.json
  Cache-Control: no-cache
/sw.js
  Cache-Control: no-cache
/*.dc.html
  Content-Type: text/html; charset=utf-8
  Cache-Control: no-cache
''')
tot=sum(os.path.getsize(p) for p in glob.glob(O+'**',recursive=True) if os.path.isfile(p))
print('files',len([p for p in glob.glob(O+'**',recursive=True) if os.path.isfile(p)]),'total KB',tot//1024,'packs',[s//1024 for s in sz],'ver',ver)
