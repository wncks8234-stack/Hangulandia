const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const L=process.argv[2]||'es';
const c=await b.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,locale:L==='es'?'es-MX':'ko-KR'});const p=await c.newPage();
const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/TUNNEL|Failed to load/.test(m.text()))errs.push('CON '+m.text().slice(0,200))});
const F=()=>p.frameLocator('#hl-f');let n=0;const shot=async(t)=>{n++;await p.screenshot({path:`qa/f${L}_${String(n).padStart(2,'0')}_${t}.png`});};
const dump=async()=>{try{return await F().locator('body').evaluate(b=>[...b.querySelectorAll('button,a,input,[role=button]')].filter(e=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return r.width>0&&cs.visibility!=='hidden'&&cs.pointerEvents!=='none'}).map(e=>(e.tagName+':'+(e.getAttribute('aria-label')||e.placeholder||e.textContent||'').trim().replace(/\s+/g,' ').slice(0,30))).join(' | '))}catch(e){return 'nodump '+e.message}};
await p.goto('http://localhost:8778/Hangulandia/');await p.waitForTimeout(6000);
await p.evaluate(()=>{localStorage.setItem('hl-inst-hide',String(Date.now()+9e9))});
await p.goto('http://localhost:8778/Hangulandia/');await p.waitForTimeout(4000);
console.log('url',p.url());await shot('first');console.log(await dump());
// try to progress through whatever appears, up to 14 steps, preferring primary buttons
for(let i=0;i<14;i++){
 const list=await dump();
 const prefer=['Siguiente','Continuar','다음','계속','Entendido','알겠어','Empezar','시작','Google','Guardar','저장','Listo','완료','Saltar','건너뛰기'];
 let clicked=false;
 for(const w of prefer){const l=F().locator(`button:has-text("${w}"), a:has-text("${w}")`).first();if(await l.count()&&await l.isVisible().catch(()=>false)){
   // fill inputs if any first
   const inp=F().locator('input[type=text],input:not([type])').first();if(await inp.count()&&await inp.isVisible().catch(()=>false)){const v=await inp.inputValue();if(!v){await inp.fill('Ana');await p.waitForTimeout(300);}}
   const sel=F().locator('select').first();if(await sel.count()&&await sel.isVisible().catch(()=>false)){await sel.selectOption({index:1}).catch(()=>{});}
   await l.click({force:true}).catch(e=>console.log('clickfail',w,e.message.slice(0,80)));clicked=true;await p.waitForTimeout(2200);await shot(w.replace(/\s/g,''));console.log(i,'clicked',w,'->',(await dump()).slice(0,300));break;}}
 if(!clicked){console.log(i,'no primary; buttons:',list.slice(0,400));break;}
}
console.log('ERRS',errs.join('\n'));await b.close();})();
