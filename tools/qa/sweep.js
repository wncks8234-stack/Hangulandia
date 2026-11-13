const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const out=[];
for(const L of ['ko','es'])for(const H of [727,915]){
 const c=await b.newContext({viewport:{width:412,height:H},isMobile:true,hasTouch:true,deviceScaleFactor:1});const p=await c.newPage();
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CON '+m.text().slice(0,160))});p.on('response',r=>{if(r.status()>=400)errs.push('HTTP '+r.status()+' '+r.url().split('/').slice(-2).join('/'))});
 await p.goto('http://localhost:8778/Hangulandia/');await p.waitForTimeout(4000);
 await p.evaluate((L)=>{const s=(k,v)=>localStorage.setItem(k,v);s('hl-inst-hide',String(Date.now()+9e9));s('yoolmi-lang',L);s('yoolmi-nick','Ana');s('yoolmi-auth',JSON.stringify({prov:'google',done:true}));s('yoolmi-story','done');s('yoolmi-paid','1');s('yoolmi-country','"MX"');s('yoolmi-age','25');s('yoolmi-reason','0');},L);
 for(const pg of ['Main','Mapa','Quiz','Clases','Carta','Nivel']){
  errs.length=0;
  await p.goto('http://localhost:8778/Hangulandia/'+pg+'.dc.html?noshell=1');await p.waitForTimeout(3500);
  const r=await p.evaluate(()=>{const root=document.querySelector('div[lang]');const rr=root.getBoundingClientRect();const bad=[];const trunc=[];
   document.querySelectorAll('body *').forEach(e=>{const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden'||cs.opacity==='0')return;const r=e.getBoundingClientRect();if(!r.width||!r.height)return;
    if(e.closest('[aria-hidden="true"]'))return;
    if(r.right>rr.right+2||r.left<rr.left-2){let o=e;let clipped=false;while(o&&o!==document.body){const s=getComputedStyle(o);if(/hidden|auto|scroll|clip/.test(s.overflow+s.overflowX)){const or=o.getBoundingClientRect();if(or.right<=rr.right+2&&or.left>=rr.left-2){clipped=true;break;}}o=o.parentElement;}
     if(!clipped&&e.children.length===0)bad.push((e.tagName+'.'+String(e.className).slice(0,20)+' "'+(e.textContent||'').trim().slice(0,30)+'" r='+Math.round(r.right)));}
    if(e.children.length===0&&(e.textContent||'').trim()&&(cs.overflow==='hidden'||cs.textOverflow==='ellipsis')&&e.scrollWidth>e.clientWidth+1)trunc.push(((e.textContent||'').trim().slice(0,40)));
    if(e.children.length===0&&(e.textContent||'').trim()&&cs.whiteSpace==='nowrap'&&e.scrollWidth>e.clientWidth+1)trunc.push('NW '+((e.textContent||'').trim().slice(0,40)));
   });
   const imgs=[...document.images].filter(i=>i.complete&&i.naturalWidth===0&&i.getAttribute('src')).map(i=>i.getAttribute('src').slice(-30));
   const docScroll=document.documentElement.scrollHeight>innerHeight+2||document.documentElement.scrollWidth>innerWidth+2;
   const tpl=[...document.querySelectorAll('body *')].filter(e=>e.tagName!=='SCRIPT'&&e.children.length===0&&/\{\{\s*[\w.]+\s*\}\}/.test(e.textContent||'')).map(e=>(e.textContent||'').trim().slice(0,40));
   const empty=[...document.querySelectorAll('button,a')].filter(e=>{const cs=getComputedStyle(e);if(cs.display==='none')return false;const r=e.getBoundingClientRect();return r.width>0&&!(e.textContent||'').trim()&&!e.getAttribute('aria-label')&&!e.querySelector('img[alt]:not([alt=""])')}).length;
   const small=[...document.querySelectorAll('button,a,[role=button]')].filter(e=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return r.width>0&&cs.visibility!=='hidden'&&(r.width<28||r.height<28)}).map(e=>(e.getAttribute('aria-label')||e.textContent||'').trim().slice(0,20)+' '+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height));
   return {bad:bad.slice(0,12),trunc:[...new Set(trunc)].slice(0,12),imgs,docScroll,tpl:tpl.slice(0,8),emptyBtn:empty,small:small.slice(0,10),h:rr.height,ih:innerHeight,zoom:getComputedStyle(document.documentElement).zoom};});
  await p.screenshot({path:`qa/s_${pg}_${L}${H}.png`});
  out.push({pg,L,H,errs:[...new Set(errs)],...r});
 }
 await c.close();}
fs.writeFileSync('qa/sweep.json',JSON.stringify(out,null,1));
for(const o of out){const k=Object.entries(o).filter(([k,v])=>!['pg','L','H','h','ih','zoom'].includes(k)&&(Array.isArray(v)?v.length:v));if(k.length)console.log(o.pg,o.L,o.H,JSON.stringify(Object.fromEntries(k)).slice(0,900));}
await b.close();})();
