// Hangulandia asset service worker: unpacks asset packs into Cache Storage and serves /_blob/<id>
const V='__VER__';const CACHE='hl-assets-'+V;const PAGES='hl-pages-'+V;
const PACKS=__PACKS__;
const SHELL=['/','/index.html','/support.js','/manifest.webmanifest','/icon-192.png','/icon-512.png','/Main.dc.html','/Mapa.dc.html','/Quiz.dc.html','/Clases.dc.html','/Carta.dc.html','/Nivel.dc.html'];
async function unpack(){const c=await caches.open(CACHE);const idx=await (await fetch('/packs/index.json?v='+V,{cache:'no-store'})).json();
 let done=0;const total=idx.packs.length;
 await Promise.all(idx.packs.map(async(pk)=>{const buf=await (await fetch('/packs/'+pk.file+'?v='+V,{cache:'no-store'})).arrayBuffer();
  for(const e of pk.items){const body=buf.slice(e.o,e.o+e.n);await c.put('/_blob/'+e.id,new Response(body,{headers:{'content-type':e.t,'content-length':String(e.n),'cache-control':'public, max-age=31536000'}}));}
  done++;const cl=await self.clients.matchAll({includeUncontrolled:true});cl.forEach(x=>x.postMessage({hl:'progress',done,total}));}));}
self.addEventListener('install',e=>{e.waitUntil((async()=>{await unpack();const p=await caches.open(PAGES);await p.addAll(SHELL.map(u=>new Request(u,{cache:'no-store'})));self.skipWaiting();})());});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==CACHE&&k!==PAGES)await caches.delete(k);await self.clients.claim();})());});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin!==location.origin)return;
 if(u.pathname.startsWith('/_blob/')){e.respondWith((async()=>{const c=await caches.open(CACHE);const r=await c.match(u.pathname);if(r){const rg=e.request.headers.get('range');if(rg&&/^video\//.test(r.headers.get('content-type')||'')){const b=await r.arrayBuffer();const m=/bytes=(\d+)-(\d*)/.exec(rg);const s=+m[1],en=m[2]?+m[2]:b.byteLength-1;return new Response(b.slice(s,en+1),{status:206,headers:{'content-type':r.headers.get('content-type'),'content-range':`bytes ${s}-${en}/${b.byteLength}`,'accept-ranges':'bytes','content-length':String(en-s+1)}});}return r;}return new Response('',{status:404});})());return;}
 if(e.request.mode==='navigate'||/\.(dc\.html|js|webmanifest|png)$/.test(u.pathname)){e.respondWith((async()=>{const p=await caches.open(PAGES);const key=u.pathname;const hit=await p.match(key);
  const net=fetch(e.request,{cache:'no-cache'}).then(r=>{if(r.ok&&!r.redirected){p.put(u.pathname==='/'?'/':u.pathname,r.clone());}return r;}).catch(()=>null);
  if(hit){e.waitUntil(net);const quick=await Promise.race([net,new Promise(r=>setTimeout(()=>r(null),1800))]);return quick||hit;}
  const r=await net;return r||(await p.match('/Main.dc.html'))||new Response('',{status:504});})());}
});

self.addEventListener('notificationclick',function(e){e.notification.close();e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(cs){for(var i=0;i<cs.length;i++){if('focus' in cs[i])return cs[i].focus();}if(self.clients.openWindow)return self.clients.openWindow('./');}));});
