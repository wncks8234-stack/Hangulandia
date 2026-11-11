/* Hangulandia: "install as app" guide for browser visitors */
(function(){
  if (window.top !== window) return;
  /* never inside the Android app itself */
  try { var __ua = navigator.userAgent || ''; if (/YoolmiApp/i.test(__ua) || (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())) return; } catch(e){}
  /* Samsung Internet ignores every page-side dark-mode opt-out, so guide the user instead */
  try {
    var sua = navigator.userAgent || '';
    if (/SamsungBrowser/i.test(sua) && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches && !sessionStorage.getItem('hl-sdark')) {
      var sko = false; try { sko = (localStorage.getItem('yoolmi-lang') || '') === 'ko'; } catch(e){}
      var ST = sko ? { t: '색이 어둡게 보이나요?', s: '삼성 인터넷의 다크 모드가 앱 색을 바꾸고 있어요. 오른쪽 아래 ≡ 메뉴에서 ‘라이트 모드’를 누르거나, 크롬으로 열어 주세요.', a: '크롬으로 열기', b: '닫기' }
                   : { t: '¿Ves los colores oscuros?', s: 'El modo oscuro de Samsung Internet cambia los colores de la app. Toca el menú ≡ abajo a la derecha y elige “Modo claro”, o ábrela en Chrome.', a: 'Abrir en Chrome', b: 'Cerrar' };
      var showS = function(){
        if (document.getElementById('hl-sp')) { setTimeout(showS, 400); return; }
        if (!document.body || document.getElementById('hl-sdark')) return;
        var w = document.createElement('div'); w.id = 'hl-sdark';
        w.innerHTML = '<style>#hl-sdark{position:fixed;left:0;right:0;top:0;z-index:2147483001;display:flex;justify-content:center;padding:calc(10px + env(safe-area-inset-top)) 10px 0;font-family:"Yoolmi Hand","Fredoka","Noto Sans KR",sans-serif;color:#4A3A32}#hl-sdark .c{width:100%;max-width:380px;box-sizing:border-box;background:#FFFBF3;border:1.8px solid #8A766B;border-radius:22px;padding:14px 16px 12px;box-shadow:0 10px 30px rgba(60,40,25,.25)}#hl-sdark .t{font-weight:700;font-size:16px}#hl-sdark .s{font-size:13px;font-weight:700;opacity:.75;line-height:1.45;margin-top:4px}#hl-sdark .bt{display:flex;gap:8px;margin-top:10px}#hl-sdark a,#hl-sdark button{font:inherit;font-weight:700;font-size:14px;color:#4A3A32;border-radius:999px;border:1.5px solid #8A766B;min-height:42px;display:flex;align-items:center;justify-content:center;text-decoration:none;cursor:pointer}#hl-sdark a{flex:1.6;background:#9CD3A6}#hl-sdark button{flex:1;background:#fff}</style>'+
          '<div class="c"><div class="t">'+ST.t+'</div><div class="s">'+ST.s+'</div><div class="bt"><a href="intent://'+location.host+location.pathname+location.search+'#Intent;scheme=https;package=com.android.chrome;end">'+ST.a+'</a><button type="button">'+ST.b+'</button></div></div>';
        document.body.appendChild(w);
        w.querySelector('button').onclick = function(){ try { sessionStorage.setItem('hl-sdark','1'); } catch(e){} w.remove(); };
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(showS, 800); }); else setTimeout(showS, 800);
    }
  } catch(e){}
  var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  if (standalone) return;
  var ls = function(k, v){ try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch(e){ return null; } };
  var until = +(ls('hl-inst-hide') || 0);
  if (Date.now() < until) return;
  var ko = (ls('yoolmi-lang') || '') === 'ko';
  var ua = navigator.userAgent || '';
  var ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var iosSafari = ios && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|KAKAOTALK|Instagram|FBAN|FBAV|Line/i.test(ua);
  var inApp = /KAKAOTALK|Instagram|FBAN|FBAV|Line|WhatsApp/i.test(ua);
  var deferred = null;
  var T = ko ? {
    title: '한글 나라를 앱으로 설치해요',
    sub: '홈 화면에 토순이 아이콘이 생기고, 앱처럼 전체 화면으로 열려요.',
    btn: '앱 설치하기', later: '나중에',
    ios1: '아래쪽 공유 버튼을 눌러요', ios2: '‘홈 화면에 추가’를 눌러요', ios3: '오른쪽 위 ‘추가’를 누르면 끝!',
    iosOther: '사파리(Safari)로 이 주소를 열어 주세요. 아이폰은 사파리에서만 설치할 수 있어요.',
    inapp: '오른쪽 위 메뉴에서 ‘다른 브라우저로 열기’(크롬/사파리)를 누른 뒤 설치해 주세요.',
    and1: '오른쪽 위 ⋮ 메뉴를 눌러요', and2: '‘앱 설치’ 또는 ‘홈 화면에 추가’를 눌러요',
    done: '설치가 시작됐어요! 홈 화면의 토순이 아이콘으로 열어 주세요.'
  } : {
    title: 'Instala 한글 나라 como app',
    sub: 'Tendrás el ícono de Tosuni en tu pantalla de inicio y se abrirá a pantalla completa.',
    btn: 'Instalar app', later: 'Ahora no',
    ios1: 'Toca el botón Compartir abajo', ios2: 'Toca “Agregar a inicio”', ios3: 'Toca “Agregar” arriba a la derecha. ¡Listo!',
    iosOther: 'Abre esta dirección en Safari. En iPhone solo se puede instalar desde Safari.',
    inapp: 'Toca el menú arriba a la derecha y elige “Abrir en el navegador” (Chrome/Safari) para instalar.',
    and1: 'Toca el menú ⋮ arriba a la derecha', and2: 'Toca “Instalar app” o “Agregar a inicio”',
    done: '¡Instalación iniciada! Abre la app con el ícono de Tosuni.'
  };
  var css = '#hl-inst{color-scheme:only light;position:fixed;left:0;right:0;bottom:0;z-index:2147483000;display:flex;justify-content:center;padding:0 10px calc(10px + env(safe-area-inset-bottom));pointer-events:none;font-family:"Yoolmi Hand","Fredoka","Noto Sans KR",sans-serif;color:#4A3A32}'+
  '#hl-inst .c{pointer-events:auto;width:100%;max-width:380px;box-sizing:border-box;background:#FFFBF3;border:1.8px solid #8A766B;border-radius:24px;padding:16px 16px 14px;box-shadow:0 10px 30px rgba(60,40,25,.25);transform:translateY(130%);transition:transform .45s cubic-bezier(.2,1.2,.4,1)}'+
  '#hl-inst.on .c{transform:none}'+
  '#hl-inst .h{display:flex;gap:12px;align-items:center}#hl-inst .h img{width:56px;height:56px;border-radius:16px;border:1.4px solid #8A766B;flex:none}'+
  '#hl-inst .t{font-weight:700;font-size:17px;line-height:1.3}#hl-inst .s{font-size:12.5px;font-weight:700;opacity:.7;line-height:1.4;margin-top:2px}'+
  '#hl-inst ol{margin:12px 0 0;padding:0;list-style:none;display:grid;gap:7px}#hl-inst li{display:flex;align-items:center;gap:9px;font-size:14px;font-weight:700;line-height:1.35}'+
  '#hl-inst li b{flex:none;width:24px;height:24px;border-radius:50%;background:#FADB7A;border:1.3px solid #8A766B;display:flex;align-items:center;justify-content:center;font-size:13px}'+
  '#hl-inst li svg{flex:none}#hl-inst .note{margin-top:10px;font-size:13px;font-weight:700;background:#FFF1C4;border-radius:12px;padding:8px 10px;line-height:1.4}'+
  '#hl-inst .bt{display:flex;gap:8px;margin-top:12px}#hl-inst button{font:inherit;font-weight:700;font-size:15px;color:#4A3A32;border-radius:999px;border:1.5px solid #8A766B;min-height:46px;cursor:pointer}'+
  '#hl-inst .go{flex:1.6;background:#9CD3A6}#hl-inst .no{flex:1;background:#fff}'+
  '#hl-inst .arrow{position:fixed;left:50%;bottom:calc(4px + env(safe-area-inset-bottom));transform:translateX(-50%);width:0;height:0;border-left:12px solid transparent;border-right:12px solid transparent;border-top:14px solid #8A766B;display:none}';
  var shareIc = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3E6FB0" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
  var plusIc = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A3A32" stroke-width="2.2" stroke-linecap="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';
  var el, shown = false;
  function hide(days){ if (el) el.classList.remove('on'); ls('hl-inst-hide', String(Date.now() + days*86400000)); setTimeout(function(){ if (el) el.remove(); }, 500); }
  function build(){
    if (document.getElementById('hl-sp')) { setTimeout(build, 400); return; }
    if (shown || !document.body) return; shown = true;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    el = document.createElement('div'); el.id = 'hl-inst'; el.setAttribute('role','dialog'); el.setAttribute('aria-label', T.title);
    var body = '';
    if (deferred) body = '';
    else if (inApp) body = '<div class="note">'+T.inapp+'</div>';
    else if (iosSafari) body = '<ol><li><b>1</b>'+shareIc+T.ios1+'</li><li><b>2</b>'+plusIc+T.ios2+'</li><li><b>3</b>'+T.ios3+'</li></ol>';
    else if (ios) body = '<div class="note">'+T.iosOther+'</div>';
    else body = '<ol><li><b>1</b>'+T.and1+'</li><li><b>2</b>'+T.and2+'</li></ol>';
    el.innerHTML = '<div class="c"><div class="h"><img src="icon-192.png" alt=""><div><div class="t">'+T.title+'</div><div class="s">'+T.sub+'</div></div></div>'+body+
      '<div class="bt">'+(deferred?'<button type="button" class="go">'+T.btn+'</button>':'')+'<button type="button" class="no">'+T.later+'</button></div></div>'+(iosSafari?'<i class="arrow"></i>':'');
    document.body.appendChild(el);
    if (iosSafari) el.querySelector('.arrow').style.display = 'block';
    el.querySelector('.no').onclick = function(){ hide(3); };
    var go = el.querySelector('.go');
    if (go) go.onclick = function(){ if (!deferred) return; deferred.prompt(); deferred.userChoice.then(function(r){ if (r && r.outcome === 'accepted'){ el.querySelector('.s').textContent = T.done; setTimeout(function(){ hide(30); }, 2500); } else hide(1); }); deferred = null; };
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ el.classList.add('on'); }); });
  }
  window.addEventListener('beforeinstallprompt', function(e){ e.preventDefault(); deferred = e; if (shown && el){ el.remove(); shown = false; } setTimeout(build, 600); });
  window.addEventListener('appinstalled', function(){ hide(365); });
  window.addEventListener('load', function(){ setTimeout(function(){ if (!shown) build(); }, 2500); });
})();
