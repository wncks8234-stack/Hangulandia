const mk=require('./lib');const fs=require('fs');const CHECK=fs.readFileSync(__dirname+'/check.js','utf8').replace('module.exports=function','(function').trim().replace(/;$/,'')+')()';
(async()=>{const L=process.argv[2]||'es';const H=Number(process.argv[3]||915);const q=await mk(L,H,{tag:'dp',ls:{'yoolmi-tut-quiz':'1','yoolmi-tut-sent':'1','yoolmi-tut-vocab':'1','yoolmi-tut-write':'1','yoolmi-plant-name':'Rosita'}});const {p,F,shot,go,C,T,text,dump}=q;
const body=()=>F().locator('body');const res={};
const chk=async(name)=>{const r=await body().evaluate(CHECK).catch(e=>({err:e.message}));if(Object.keys(r).length){res[name]=r;console.log('##',name,JSON.stringify(r).slice(0,700));}await shot(name);};
const allBtns=async()=>body().evaluate(b=>[...b.querySelectorAll('button,a')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'&&!e.disabled}).map((e)=>({t:(e.getAttribute('aria-label')||e.textContent||'').trim().replace(/\s+/g,' ').slice(0,40),x:Math.round(e.getBoundingClientRect().x),y:Math.round(e.getBoundingClientRect().y),w:Math.round(e.getBoundingClientRect().width),h:Math.round(e.getBoundingClientRect().height)})));
const click=async(re,wait=1300)=>{const bs=await allBtns();const b=bs.find(x=>re.test(x.t));if(!b){console.log('NOBTN',re,bs.map(x=>x.t).join(' | ').slice(0,200));return false;}const loc=body().locator('button:visible, a:visible').filter({hasText:b.t.slice(0,20)}).first();try{await loc.click({force:true,timeout:3000});}catch(e){await p.mouse.click(b.x+b.w/2,b.y+b.h/2);}await p.waitForTimeout(wait);return true;};
const es=L==='es';
// MAIN
await go('Main');await chk('main');
await click(es?/nombre/:/이름/);await chk('main_name');await click(es?/Cerrar/:/닫기/);
await click(es?/misión/i:/미션/);await chk('main_mission');await click(es?/Misión 3/:/미션 3/);await chk('main_mission3');await click(es?/Cerrar/:/닫기/);
await click(es?/abono/:/영양제/);await chk('main_abono');await click(es?/Dar abono/:/영양제 주기|주기/);await chk('main_abono2');await click(es?/Cerrar/:/닫기/,600);
await click(es?/progreso/:/진행|리포트/);await chk('main_report');await click(es?/empezar/i:/시작|닫기/);
await click(es?/vocabulario/i:/단어장/);await chk('main_vocab');await click(es?/Gramática/:/꽃잎/);await chk('main_vocab_ge');await click(es?/Cerrar/:/닫기/);
await click(es?/Tienda/:/가게/);await chk('shop');for(const t of (es?[/Adornos/,/Tosuni/,/Inicio/]:[/장식/,/토순이/,/^홈/])){await click(t);await chk('shop_'+t.source.replace(/\W/g,''));}
await click(es?/Siguiente/:/다음/);await chk('shop_next');await click(es?/Colección/:/컬렉션|모음/);await chk('shop_coll');
// QUIZ
await go('Quiz');await chk('quiz');await click(es?/Ver tareas/:/과제/);await chk('quiz_tasks');
await go('Quiz');await click(es?/Quiz de Tosuni/:/토순이 퀴즈/,3500);await chk('quiz_menu');await click(es?/Brote/:/새싹/);await chk('quiz_menu_ss');await click(es?/etapa 1/i:/1단계/);await chk('quiz_play');
await click(/instrucciones|설명/);await chk('quiz_help');await click(/Cerrar|닫기|Entendido|알겠/);
await go('Quiz');await click(es?/Arma en coreano/:/한국어 만들기/,3500);await chk('sent_menu');await click(es?/Pétalo/:/꽃잎/);await chk('sent_menu_ge');await click(es?/usa 1 reto/:/도전/);await chk('sent_confirm');await click(/^Empezar$|^시작$/,1500);await chk('sent_play');
await go('Quiz');await click(es?/Vocabulario/:/단어장/,3500);await chk('voc_menu');await click(es?/Ver tarjetas/:/카드 보기|카드/);await chk('voc_card');
const cardB=(await allBtns()).find(b=>b.w>150&&b.h>150);if(cardB){await p.mouse.click(cardB.x+cardB.w/2,cardB.y+cardB.h/2);await p.waitForTimeout(1200);}await chk('voc_flip');await click(es?/Me la sé/:/알아요|외웠/);await chk('voc_known');await click(es?/Mis tarjetas/:/내 카드/);await chk('voc_mine');
await go('Quiz');await click(es?/Escribir hangul/:/한글 쓰기/,3500);await chk('wr_menu');await click(es?/vocales compuestas/i:/복합 모음/);await chk('wr_zone');await click(/Orden de trazos|획순/);await chk('wr_order');
// MAPA
await go('Mapa');await chk('mapa');const nodes=(await allBtns()).filter(b=>/Abierta|En curso|진행|열림/.test(b.t));if(nodes.length){await p.mouse.click(nodes[0].x+nodes[0].w/2,nodes[0].y+nodes[0].h/2);await p.waitForTimeout(1500);}await chk('mapa_node');
await go('Mapa');await click(es?/historia/i:/이야기/,2500);await chk('mapa_story');await click(/Siguiente|다음|→/,1200);await chk('mapa_story2');
await go('Mapa');await click(es?/Básico|Semilla/:/씨앗|기초/,1500);await chk('mapa_badge');
// CLASES
await go('Clases');await chk('clases');for(const t of (es?[/Alarmas/,/Preparar/,/Mi horario/,/Libro de clase/,/Objetivos/]:[/알람/,/수업 준비/,/내 수업 일정/,/수업 교재/,/수업 목표/])){await go('Clases');await click(t,1500);await chk('cls_'+t.source.replace(/\W/g,''));}
await go('Clases');await click(es?/enlace/i:/링크/,1500);await chk('cls_link');
await go('Clases');const av=(await allBtns()).find(b=>b.y<90&&b.x<90);if(av){await p.mouse.click(av.x+av.w/2,av.y+av.h/2);await p.waitForTimeout(1200);}await chk('cls_profile');
// NIVEL
await go('Nivel');await chk('nivel');await click(es?/Conversación/:/새싹/);await chk('nivel_ss');await click(es?/Personajes/:/등장인물/,1500);await chk('nivel_chars');
await go('Nivel');await click(es?/Historia/:/한글 나라 이야기/,2500);await chk('nivel_story');
await go('Nivel');await body().evaluate(b=>{const s=[...b.querySelectorAll('*')].find(e=>{const cs=getComputedStyle(e);return /auto|scroll/.test(cs.overflowY)&&e.scrollHeight>e.clientHeight+50});if(s)s.scrollTop=s.scrollHeight;});await p.waitForTimeout(600);await chk('nivel_bottom');
// CARTA
await go('Carta');await chk('carta');await click(es?/Sofía/:/소피아/,3500);await chk('carta_so');
fs.writeFileSync(`qa/deep_${L}${H}.json`,JSON.stringify(res,null,1));
await q.done();})();
