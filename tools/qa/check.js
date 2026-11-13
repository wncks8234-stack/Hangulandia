// generic layout checker run inside the app frame
module.exports=function(){const root=document.querySelector('div[lang]');if(!root)return {noroot:true};const rr=root.getBoundingClientRect();const out={over:[],trunc:[],wrapnw:[],tpl:[],small:[],imgs:[]};
 const vis=(e)=>{const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden'||parseFloat(cs.opacity)===0)return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0;};
 const inClip=(e)=>{let o=e.parentElement;while(o&&o!==document.body){const s=getComputedStyle(o);if(/hidden|auto|scroll|clip/.test(s.overflow+s.overflowX+s.overflowY))return o;o=o.parentElement;}return null;};
 document.querySelectorAll('body *').forEach(e=>{if(e.tagName==='SCRIPT'||e.tagName==='STYLE')return;if(!vis(e))return;if(e.closest('[aria-hidden="true"]'))return;const cs=getComputedStyle(e);const r=e.getBoundingClientRect();const txt=(e.textContent||'').trim();
  // horizontal overflow outside root not clipped
  if((r.right>rr.right+1||r.left<rr.left-1)&&e.children.length===0){const c=inClip(e);const cr=c?c.getBoundingClientRect():null;if(!c||cr.right>rr.right+1||cr.left<rr.left-1){out.over.push(e.tagName+' "'+txt.slice(0,28)+'" '+Math.round(r.left)+'-'+Math.round(r.right));}}
  if(e.children.length===0&&txt){
   if(cs.whiteSpace==='nowrap'&&e.scrollWidth>e.clientWidth+1){const c=inClip(e);const p=e.parentElement;const pc=getComputedStyle(p);const pell=(pc.textOverflow==='ellipsis'||cs.textOverflow==='ellipsis');out.trunc.push((pell?'EL "':'NW "')+txt.slice(0,34)+'" sw='+e.scrollWidth+' cw='+e.clientWidth);}
   else if(cs.overflow==='hidden'&&e.scrollWidth>e.clientWidth+1&&cs.textOverflow!=='ellipsis')out.trunc.push('OH "'+txt.slice(0,34)+'"');
   // text clipped vertically by parent with overflow hidden and fixed height
   const c=inClip(e);if(c&&!/auto|scroll/.test(getComputedStyle(c).overflowY)){const cr=c.getBoundingClientRect();if(r.bottom>cr.bottom+2&&r.top<cr.bottom&&!/webkit-box/.test(getComputedStyle(e.parentElement).display))out.trunc.push('VC "'+txt.slice(0,34)+'" by '+(c.className||c.tagName).toString().slice(0,16));}
   if(/\{\{\s*[\w.]+\s*\}\}/.test(txt))out.tpl.push(txt.slice(0,40));
   if(/^(undefined|null|NaN|\[object Object\])$|undefined|NaN/.test(txt))out.tpl.push('BADVAL '+txt.slice(0,40));
  }
  if(/^(BUTTON|A)$/.test(e.tagName)&&cs.pointerEvents!=='none'){if((r.width<30||r.height<30)&&!e.closest('[role=tablist]'))out.small.push((e.getAttribute('aria-label')||txt).slice(0,20)+' '+Math.round(r.width)+'x'+Math.round(r.height));}
 });
 document.querySelectorAll('img').forEach(i=>{if(i.complete&&i.naturalWidth===0&&i.getAttribute('src')&&!/^data:/.test(i.getAttribute('src')))out.imgs.push(i.getAttribute('src').slice(-24));});
 out.docScroll=document.documentElement.scrollHeight>innerHeight+2||document.documentElement.scrollWidth>innerWidth+2;
 for(const k of Object.keys(out))if(Array.isArray(out[k])){out[k]=[...new Set(out[k])].slice(0,10);if(!out[k].length)delete out[k];}
 if(!out.docScroll)delete out.docScroll;return out;};
