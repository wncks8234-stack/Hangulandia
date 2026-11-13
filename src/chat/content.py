# -*- coding: utf-8 -*-
"""Q&A content for the Hangulandia chat (Yoolmi, Daniel, Sofia, Tosuni).
Message parts:
  ('t', ko, es)                      plain text bubble (both languages)
  ('ex', ko_sentence, es_meaning)    example card (romanization added automatically, speaker button)
  ('rows', title_ko, title_es, [(label_ko, label_es, korean, es_meaning), ...])  table with speakers
  ('tip', ko, es)                    tip box
  ('link', kind, ko_label, es_label) button: kind = home | insta | tab:<Page.dc.html>
"""
import json, re, sys
sys.path.insert(0, '/tmp/claude-0/-home-claude/32e06676-27dc-5c32-86c6-435bfae3cbbe/scratchpad/rom')
from rom import rom as _rom

def _nasal(w):
    cs = list(w)
    for i in range(len(cs) - 1):
        a, b = cs[i], cs[i + 1]
        if not ('가' <= a <= '힣' and '가' <= b <= '힣'): continue
        oa = ord(a) - 0xAC00; ob = ord(b) - 0xAC00
        jo = oa % 28; ch2 = ob // 588
        if ch2 in (2, 6):  # next initial ㄴ or ㅁ
            m = {1: 21, 2: 21, 24: 21, 3: 21, 9: 21, 7: 4, 19: 4, 20: 4, 22: 4, 23: 4, 25: 4, 27: 4, 17: 16, 26: 16, 18: 16}
            if jo in m:
                cs[i] = chr(0xAC00 + oa - jo + m[jo])
    return ''.join(cs)

def R(s):
    s = ' '.join(_nasal(w) for w in s.split(' '))
    out = []
    for tok in s.split(' '):
        h = re.sub(r'[^가-힣]', '', tok)
        if h:
            out.append(_rom(h))
    return ' '.join(out)

T = lambda ko, es: ('t', ko, es)
EX = lambda ko, es: ('ex', ko, es)
TIP = lambda ko, es: ('tip', ko, es)
ROWS = lambda tk, te, rows: ('rows', tk, te, rows)
LINK = lambda kind, ko, es: ('link', kind, ko, es)

BOTS = {}

# ---------------------------------------------------------------- Yoolmi
BOTS['ym'] = dict(
  name=('율미쌤', 'Profe Yoolmi'), role=('앱·수업 문의', 'App y clases'), color='#F9D3DE', tint='#FDF1F4',
  ph=('궁금한 점을 적어 주세요', 'Escribe tu pregunta'),
  greet=[T('안녕하세요! 율미쌤이에요.', '¡Hola! Soy la profe Yoolmi.'),
         T('앱이 이상하게 움직이거나 수업이 궁금하면 여기서 물어보세요. 아래 버튼을 눌러도 되고, 직접 적어도 돼요.', 'Si algo falla en la app o tienes dudas sobre las clases, pregúntame aquí. Toca un botón de abajo o escríbeme.')],
  start=['open', 'sound', 'carrot', 'how', 'join', 'contact'],
  topics=[
    dict(id='open', q=('앱이 안 열려요', 'La app no abre'), kw=['안열','안 열','하얀','흰','멈','로딩','느려','버퍼','no abre','blanco','carga','lento','se queda','pantalla'],
      a=[T('불편을 드려 죄송해요. 이렇게 해 보세요.', 'Perdona las molestias. Prueba esto:'),
         ROWS('순서대로 해 보기', 'Paso a paso', [('1', '1', '', 'Revisa tu conexión a internet (wifi o datos).'), ('2', '2', '', 'Cierra la app por completo y vuelve a abrirla.'), ('3', '3', '', 'La primera vez descarga imágenes y sonidos: espera a que la barra llegue al final.')]),
         TIP('브라우저 설정에서 사이트 데이터를 지우면 진도도 같이 지워져요. 지우기 전에 먼저 저에게 알려 주세요.', 'Si borras los datos del sitio en el navegador, también se borra tu progreso. Avísame antes de hacerlo.')],
      next=['update', 'dark', 'contact']),
    dict(id='dark', q=('색이 어둡게 보여요', 'Los colores se ven oscuros'), kw=['어둡','다크','색이','검게','oscuro','modo oscuro','colores','negro'],
      a=[T('휴대폰의 다크 모드가 앱 색을 바꾸고 있어서 그래요.', 'Es el modo oscuro del teléfono, que cambia los colores de la app.'),
         ROWS('브라우저별 해결 방법', 'Cómo arreglarlo', [('삼성 인터넷', 'Samsung Internet', '', 'Toca el menú ≡ abajo a la derecha y elige «Modo claro».'), ('크롬', 'Chrome', '', 'La app ya ignora el modo oscuro en Chrome. Ciérrala y vuelve a abrirla.')]),
         TIP('가장 확실한 방법은 크롬으로 열고, 크롬에서 앱을 설치하는 거예요.', 'Lo más seguro es abrir la app en Chrome e instalarla desde Chrome.')],
      next=['install', 'open']),
    dict(id='install', q=('홈 화면에 설치하기', 'Instalar en el inicio'), kw=['설치','홈 화면','바로가기','아이콘','instalar','icono','inicio','pantalla de inicio','descargar'],
      a=[T('홈 화면에 앱처럼 설치할 수 있어요.', 'Puedes instalarla como una app en tu pantalla de inicio.'),
         ROWS('휴대폰별 방법', 'Según tu teléfono', [('안드로이드 크롬', 'Android · Chrome', '', 'Menú ⋮ arriba a la derecha → «Instalar app» o «Agregar a inicio».'), ('아이폰 사파리', 'iPhone · Safari', '', 'Botón Compartir abajo → «Agregar a inicio» → «Agregar».')]),
         T('안드로이드용 앱은 Google Play 출시를 준비하고 있어요.', 'La app para Android en Google Play está en preparación.')],
      next=['update', 'dark']),
    dict(id='update', q=('새 기능이 안 보여요', 'No veo lo nuevo'), kw=['업데이트','새 기능','새기능','안 바뀌','반영','actualiz','nuevo','version','versión'],
      a=[T('앱은 열 때마다 새 버전을 받아요. 앱을 완전히 닫고 다시 열어 주세요.', 'La app se actualiza sola al abrirla. Ciérrala por completo y vuelve a abrirla.'),
         TIP('새 버전은 뒤에서 받아 두었다가 다음에 열 때 보여요. 그래서 두 번 열어야 보일 때도 있어요.', 'La versión nueva se descarga en segundo plano y aparece la siguiente vez. A veces hay que abrirla dos veces.')],
      next=['open', 'save']),
    dict(id='sound', q=('소리가 안 나요', 'No se oye el sonido'), kw=['소리','발음','음성','안 들','안들','볼륨','sonido','audio','voz','no se oye','pronuncia','volumen'],
      a=[T('먼저 휴대폰 무음 모드와 볼륨을 확인해 주세요.', 'Primero revisa el modo silencio y el volumen.'),
         T('발음 듣기는 휴대폰에 있는 한국어 음성을 써요. 한국어 음성이 없으면 소리가 안 나요.', 'La pronunciación usa la voz coreana de tu teléfono. Si no la tienes instalada, no suena.'),
         ROWS('한국어 음성 설치', 'Instalar la voz coreana', [('안드로이드', 'Android', '', 'Ajustes → Texto a voz → Motor de Google → Instalar datos de voz → Coreano.'), ('아이폰', 'iPhone', '', 'Ajustes → Accesibilidad → Contenido leído → Voces → Coreano.')])],
      next=['open', 'contact']),
    dict(id='carrot', q=('당근이 안 들어와요', 'No recibo zanahorias'), kw=['당근','zanahoria','안 들어','안들어','안 받','monedas','carrot'],
      a=[T('게임마다 당근 받는 방법이 달라요.', 'Cada juego da zanahorias de forma distinta.'),
         ROWS('당근 규칙', 'Reglas de zanahorias', [('토순이 퀴즈', 'Quiz de Tosuni', '', 'Domina un huerto (50 aciertos): 30 zanahorias.'), ('한국어 만들기', 'Arma en coreano', '', 'Por reto: Semilla 1, Brote 2, Pétalo 3, +1 por cada etapa abierta. Todas bien: +1. Si fallas, repasa y cobra.'), ('단어장', 'Vocabulario', '', 'Cada página de 10 palabras: 1 zanahoria.'), ('한글 쓰기', 'Escribir hangul', '', 'Cada capítulo terminado: 2 zanahorias.'), ('마스터한 단계', 'Etapa dominada', '', 'Se repasa sin zanahorias.'), ('광고', 'Anuncios', '', 'Solo en la app de Android: hasta 20 más.')]),
         TIP('하루는 한국 시간 자정에 새로 시작돼요.', 'El día se reinicia a medianoche, hora de Corea.')],
      next=['save', 'contact']),
    dict(id='save', q=('진도가 사라졌어요', 'Perdí mi progreso'), kw=['진도','기록','사라','초기화','없어졌','기기','폰 바','progreso','perdí','borró','otro teléfono','celular nuevo'],
      a=[T('지금은 진도가 이 휴대폰, 이 브라우저에 저장돼요.', 'Por ahora tu progreso se guarda en este teléfono y en este navegador.'),
         ROWS('기록이 이어지지 않는 경우', 'Cuándo no se conserva', [('다른 브라우저', 'Otro navegador', '', 'Chrome y Samsung Internet guardan datos por separado.'), ('다른 기기', 'Otro dispositivo', '', 'El progreso no pasa a otro teléfono.'), ('30일 미접속', '30 días sin entrar', '', 'Después de 30 días sin entrar, el registro se reinicia.')]),
         T('계정에 진도를 저장하는 기능을 준비하고 있어요.', 'Estamos preparando la opción de guardar el progreso en tu cuenta.')],
      next=['contact', 'update']),
    dict(id='lang', q=('언어를 바꾸고 싶어요', 'Cambiar el idioma'), kw=['언어','한국어로','스페인어','idioma','español','coreano','cambiar idioma'],
      a=[T('홈 위쪽의 레벨 카드에서 화살표를 누르면 \'나의 레벨\' 화면이 열려요. 거기 설정에서 한국어 / Español을 바꿀 수 있어요.', 'En Inicio, toca la flecha de la tarjeta de tu nivel para abrir «Mi nivel». En Ajustes puedes elegir 한국어 / Español.')],
      next=['open', 'contact']),
    dict(id='how', q=('수업은 어떻게 해요?', '¿Cómo son las clases?'), kw=['수업 방식','어떻게 수업','수업은','화상','온라인','clase','clases','cómo son','online','zoom','meet'],
      a=[T('수업은 구글 미트(Google Meet)로 저와 실시간으로 해요.', 'Las clases son en vivo conmigo por Google Meet.'),
         ROWS('레벨별 수업', 'Clases por nivel', [('씨앗 레벨', 'Semilla', '', '4 clases · leer y escribir hangul'), ('새싹 레벨', 'Brote', '', '4 clases · frases y conversación básica'), ('꽃잎 레벨', 'Pétalo', '', '8 clases · gramática')]),
         T('수업 탭에서 다음 수업 시간과 수업 과정을 볼 수 있어요.', 'En la pestaña Clases ves tu próxima clase y el plan.'),
         LINK('tab:Clases.dc.html', '수업 탭 열기', 'Abrir Clases')],
      next=['join', 'level', 'time']),
    dict(id='join', q=('수업 링크는 어디서?', '¿Dónde está el enlace?'), kw=['링크','들어가','입장','참여','enlace','link','entrar','unirme'],
      a=[T('수업 탭의 다음 수업 칠판에서 \'수업 링크 받기\'를 눌러 주세요.', 'En Clases, toca «Recibir enlace de clase» en la pizarra de tu próxima clase.'),
         ROWS('들어가는 방법', 'Cómo entrar', [('컴퓨터', 'Computadora', '', 'Abre el enlace en Chrome.'), ('휴대폰·태블릿', 'Móvil o tableta', '', 'Instala antes la app Google Meet.'), ('들어갈 때', 'Al entrar', '', 'Pulsa «Pedir unirse» y espera a que te acepte.')]),
         TIP('수업 10분 전에 미리 들어와 카메라와 마이크를 확인해 주세요.', 'Entra 10 minutos antes para probar cámara y micrófono.'),
         LINK('tab:Clases.dc.html', '수업 탭 열기', 'Abrir Clases')],
      next=['time', 'miss', 'mat']),
    dict(id='time', q=('수업 시간이 헷갈려요', 'Dudas con el horario'), kw=['시간','몇 시','몇시','시차','현지','알람','알림','hora','horario','zona','alarma','recordatorio'],
      a=[T('수업 탭에서는 한국 시간과 내 나라 시간을 같이 보여 줘요. 가입할 때 고른 나라가 맞는지 확인해 주세요.', 'En Clases verás la hora de Corea y la de tu país. Revisa que el país que elegiste al registrarte sea el correcto.'),
         T('수업 탭의 \'알람 설정\'에서 수업 10분·30분·60분 전에 알림을 받을 수 있어요.', 'En «Alarmas» (pestaña Clases) puedes recibir un aviso 10, 30 o 60 minutos antes.')],
      next=['join', 'miss']),
    dict(id='miss', q=('수업에 못 가요', 'No puedo ir a clase'), kw=['못 가','못가','결석','빠져','변경','바꾸','보강','no puedo','faltar','cambiar la clase','reprogramar'],
      a=[T('미리 알려 주시면 고마워요. 일정 변경과 보강은 수강 안내에 따라 달라서, 저에게 직접 연락해 주세요.', 'Gracias por avisar con tiempo. Los cambios y clases de reposición dependen de tu inscripción, así que escríbeme directamente.'),
         LINK('home', '홈페이지에서 문의하기', 'Escribir en la página web'), LINK('insta', '인스타그램 DM', 'Mensaje por Instagram')],
      next=['contact', 'time']),
    dict(id='mat', q=('수업 자료(PDF)', 'Material (PDF)'), kw=['자료','pdf','교재','책','material','libro','apuntes'],
      a=[T('수업 탭의 \'수업 교재\'를 열면 차시별 PDF가 있어요. 자료는 수업 전에 올라와요.', 'En Clases, abre «Libro de clase»: ahí está el PDF de cada clase. Se publica antes de la clase.'),
         LINK('tab:Clases.dc.html', '수업 탭 열기', 'Abrir Clases')],
      next=['join', 'level']),
    dict(id='level', q=('레벨 차이가 뭐예요?', '¿Qué nivel me toca?'), kw=['레벨','씨앗','새싹','꽃잎','nivel','básico','conversación','gramática'],
      a=[ROWS('세 가지 레벨', 'Los tres niveles', [('씨앗 레벨', 'Semilla', '', 'Leer y escribir hangul: consonantes, vocales y batchim.'), ('새싹 레벨', 'Brote', '', 'Yo y tú, preguntar y responder, palabras de cada día.'), ('꽃잎 레벨', 'Pétalo', '', 'Categorías gramaticales, partes de la oración, tiempos, honoríficos.')]),
         T('어느 레벨이 맞을지 모르겠으면 홈페이지에서 레벨 테스트를 해 보세요.', 'Si no sabes cuál te toca, haz la prueba de nivel en la página web.'),
         LINK('home', '홈페이지 가기', 'Ir a la página web')],
      next=['pay', 'how']),
    dict(id='pay', q=('수강 신청·결제', 'Inscripción y pago'), kw=['신청','결제','가격','얼마','돈','paypal','pago','precio','cuánto','inscrib','pagar'],
      a=[T('수강 신청과 결제는 홈페이지에서만 해요 (PayPal). 가격과 일정도 홈페이지에서 확인할 수 있어요.', 'La inscripción y el pago se hacen solo en la página web (PayPal). Allí ves también precios y horarios.'),
         T('결제가 확인되면 앱에서 수업 링크와 자료가 열려요.', 'Cuando confirmo tu pago, se abren en la app el enlace y el material de clase.'),
         LINK('home', '홈페이지 가기', 'Ir a la página web')],
      next=['how', 'contact']),
    dict(id='contact', q=('율미쌤에게 직접 문의', 'Escribir a la profe'), kw=['문의','연락','직접','상담','도와','contacto','ayuda','escribir','hablar con','asesoría'],
      a=[T('여기서 해결이 안 되면 아래로 연락 주세요. 어떤 화면에서 어떤 문제가 생겼는지 적어 주면 더 빨리 도와드릴 수 있어요.', 'Si no se resolvió aquí, escríbeme. Cuéntame en qué pantalla y qué pasó para ayudarte más rápido.'),
         LINK('home', '홈페이지에서 문의하기', 'Escribir en la página web'), LINK('insta', '인스타그램 DM', 'Mensaje por Instagram')],
      next=['open', 'how']),
  ],
  fallback=[T('제가 바로 답하기 어려운 질문이에요. 아래에서 비슷한 질문을 골라 보거나, 율미쌤에게 직접 문의해 주세요.', 'No tengo una respuesta para eso. Elige una pregunta parecida abajo o escríbeme directamente.')],
  fallnext=['contact', 'open', 'how'],
)

# ---------------------------------------------------------------- Daniel
BOTS['da'] = dict(
  name=('다니엘', 'Daniel'), role=('문법 친구', 'Gramática'), color='#BFD9F2', tint='#EEF5FC',
  ph=('질문이나 동사를 써 보세요 (예: 먹다)', 'Pregunta o escribe un verbo (ej.: 먹다)'),
  greet=[T('안녕하세요! 저는 다니엘이에요.', '¡Hola! Soy Daniel.'),
         T('새싹·꽃잎 레벨 문법을 같이 정리해요. 궁금한 문법을 고르거나, \'먹다\'처럼 동사를 쓰면 시제별로 바꿔 줄게요.', 'Repasamos juntos la gramática de Brote y Pétalo. Elige un tema o escribe un verbo como «먹다» y te lo conjugo.')],
  start=['ieyo', 'particles', 'present', 'past', 'future', 'quiz'],
  topics=[
    dict(id='ieyo', q=('이에요 / 예요', '이에요 / 예요 (ser)'), kw=['이에요','예요','아니에요','ser','soy','es '],
      a=[T('\'이에요/예요\'는 스페인어 \'ser\'처럼 "~이다"를 말할 때 써요.', '«이에요/예요» funciona como «ser»: «soy…», «es…».'),
         ROWS('받침에 따라', 'Según el batchim', [('받침 O', 'Con batchim', '학생이에요', 'Soy estudiante.'), ('받침 X', 'Sin batchim', '의사예요', 'Soy médico/a.'), ('아니다', 'Negación', '학생이 아니에요', 'No soy estudiante.')]),
         TIP('이름도 똑같아요: 마리아예요 / 민준이에요.', 'Con nombres igual: 마리아예요 / 민준이에요.')],
      next=['particles', 'eunneun', 'quiz']),
    dict(id='particles', q=('조사 한눈에 보기', 'Partículas: resumen'), kw=['조사','partícula','particula'],
      a=[T('조사는 단어 뒤에 붙어서 문장 속 역할을 알려 줘요.', 'Las partículas van después de la palabra y marcan su función.'),
         ROWS('기본 조사', 'Partículas básicas', [('은/는', 'tema', '저는 마리아예요', 'Yo soy María.'), ('이/가', 'sujeto', '민수가 왔어요', 'Llegó Minsu.'), ('을/를', 'objeto', '사과를 먹어요', 'Como una manzana.'), ('에', 'a / en', '학교에 가요', 'Voy a la escuela.'), ('에서', 'lugar de acción', '학교에서 공부해요', 'Estudio en la escuela.')]),
         TIP('받침 O → 은·이·을, 받침 X → 는·가·를', 'Con batchim → 은·이·을 · sin batchim → 는·가·를')],
      next=['eunneun', 'eulreul', 'place']),
    dict(id='eunneun', q=('은/는 vs 이/가', '은/는 vs 이/가'), kw=['은/는','이/가','은는','이가','주어','tema','sujeto'],
      a=[T('\'은/는\'은 이야기의 주제를, \'이/가\'는 새로운 정보인 주어를 표시해요.', '«은/는» marca el tema; «이/가» marca el sujeto como información nueva.'),
         EX('누가 왔어요? — 민수가 왔어요.', '¿Quién vino? — Vino Minsu.'),
         EX('저는 커피를 좋아해요. 동생은 차를 좋아해요.', 'A mí me gusta el café. A mi hermano, el té.'),
         TIP('비교할 때는 은/는: "저는… 동생은…"', 'Para contrastar se usa 은/는.')],
      next=['eulreul', 'quiz']),
    dict(id='eulreul', q=('을/를 (목적어)', '을/를 (objeto)'), kw=['을/를','을를','목적어','objeto'],
      a=[T('\'을/를\'은 동작을 받는 대상(목적어)에 붙여요.', '«을/를» marca el objeto directo.'),
         ROWS('받침에 따라', 'Según el batchim', [('받침 O', 'Con batchim', '빵을 먹어요', 'Como pan.'), ('받침 X', 'Sin batchim', '사과를 먹어요', 'Como una manzana.')]),
         TIP('\'사과을\'은 틀린 말이에요. 한글 나라에 틈이 생긴 바로 그 실수예요!', '«사과을» es un error: ¡es justo la grieta de 한글 나라!')],
      next=['place', 'present']),
    dict(id='place', q=('에 vs 에서', '에 vs 에서'), kw=['에서','장소','lugar','에 ','dónde'],
      a=[ROWS('뜻 비교', 'Comparación', [('에 (가다·오다)', 'destino', '학교에 가요', 'Voy a la escuela.'), ('에 (있다·없다)', 'estar en', '집에 있어요', 'Estoy en casa.'), ('에 (시간)', 'tiempo', '세 시에 만나요', 'Nos vemos a las tres.'), ('에서 (행동)', 'donde ocurre la acción', '카페에서 공부해요', 'Estudio en la cafetería.')]),
         TIP('동작을 하는 곳이면 에서, 가는 곳·있는 곳이면 에.', 'Si allí haces algo → 에서; si vas o estás → 에.')],
      next=['present', 'quiz']),
    dict(id='present', q=('현재 시제 -아요/어요', 'Presente -아요/어요'), kw=['현재','아요','어요','해요','presente'],
      a=[T('동사 끝의 \'-다\'를 빼고 마지막 모음을 봐요.', 'Quita «-다» y mira la última vocal de la raíz.'),
         ROWS('규칙', 'Reglas', [('ㅏ·ㅗ → 아요', 'ㅏ·ㅗ → 아요', '살아요', 'Vivo.'), ('그 밖 → 어요', 'otras → 어요', '먹어요', 'Como.'), ('하다 → 해요', 'hacer', '공부해요', 'Estudio.'), ('줄여요', 'contracción', '가요 · 봐요 · 마셔요', 'Voy · Veo · Bebo')]),
         TIP('동사를 써 주면 바로 바꿔 줄게요. 예: 마시다', 'Escríbeme un verbo y lo conjugo. Ej.: 마시다')],
      next=['past', 'future', 'neg']),
    dict(id='past', q=('과거 시제 -았/었어요', 'Pasado -았/었어요'), kw=['과거','었어요','았어요','했어요','pasado','ayer'],
      a=[T('현재형 \'-아요/어요\'에서 \'요\'를 빼고 \'-ㅆ어요\'를 붙여요.', 'Del presente quita «요» y agrega «-ㅆ어요».'),
         ROWS('예시', 'Ejemplos', [('가다', 'ir', '갔어요', 'Fui.'), ('먹다', 'comer', '먹었어요', 'Comí.'), ('하다', 'hacer', '했어요', 'Hice.'), ('보다', 'ver', '봤어요', 'Vi.')]),
         EX('어제 친구를 만났어요.', 'Ayer vi a un amigo.')],
      next=['future', 'quiz']),
    dict(id='future', q=('미래 -(으)ㄹ 거예요', 'Futuro -(으)ㄹ 거예요'), kw=['미래','거예요','할 거','futuro','mañana','voy a'],
      a=[T('받침이 없으면 \'-ㄹ 거예요\', 받침이 있으면 \'-을 거예요\'.', 'Sin batchim «-ㄹ 거예요»; con batchim «-을 거예요».'),
         ROWS('예시', 'Ejemplos', [('가다', 'ir', '갈 거예요', 'Voy a ir.'), ('먹다', 'comer', '먹을 거예요', 'Voy a comer.'), ('살다 (ㄹ)', 'vivir', '살 거예요', 'Voy a vivir.')]),
         EX('내일 한국어를 공부할 거예요.', 'Mañana voy a estudiar coreano.')],
      next=['prog', 'quiz']),
    dict(id='prog', q=('진행 -고 있어요', 'Progresivo -고 있어요'), kw=['진행','고 있','고있','progresivo','estoy','ando'],
      a=[T('지금 하고 있는 일은 \'-고 있어요\'.', 'Para lo que estás haciendo ahora: «-고 있어요».'),
         EX('지금 숙제하고 있어요.', 'Ahora estoy haciendo la tarea.'),
         EX('비가 오고 있어요.', 'Está lloviendo.')],
      next=['neg', 'connect']),
    dict(id='neg', q=('부정: 안 / 못', 'Negación: 안 / 못'), kw=['부정','안 ','못','지 않','negación','no puedo','negativo'],
      a=[ROWS('두 가지 부정', 'Dos negaciones', [('안 + 동사', 'no (voluntad)', '안 가요', 'No voy.'), ('-지 않아요', 'no (formal)', '가지 않아요', 'No voy.'), ('못 + 동사', 'no puedo', '못 가요', 'No puedo ir.')]),
         TIP('하다 동사는 가운데에: 공부 안 해요 / 공부 못 해요', 'Con 하다 va en medio: 공부 안 해요.')],
      next=['honor', 'quiz']),
    dict(id='honor', q=('높임말·존댓말', 'Honoríficos'), kw=['높임','존댓말','반말','시다','세요','honor','formal','usted','respeto'],
      a=[T('윗사람에게는 \'-(으)세요\', 친한 친구에게는 반말을 써요.', 'Con mayores se usa «-(으)세요»; con amigos cercanos, 반말.'),
         ROWS('예시', 'Ejemplos', [('가다', 'ir', '가세요', '(usted) va / vaya'), ('읽다', 'leer', '읽으세요', 'lea'), ('먹다 → 드시다', 'comer (honor.)', '드세요', 'coma, por favor'), ('있다 → 계시다', 'estar (honor.)', '계세요', 'está (usted)')]),
         EX('선생님, 안녕히 계세요.', 'Adiós, profesora (quédese bien).')],
      next=['connect', 'quiz']),
    dict(id='connect', q=('문장 잇기 -고/-지만/-아서', 'Conectores'), kw=['연결','고 ','지만','아서','어서','면','conectar','pero','porque','si '],
      a=[ROWS('자주 쓰는 연결', 'Conectores frecuentes', [('-고', 'y', '밥을 먹고 공부해요', 'Como y estudio.'), ('-지만', 'pero', '어렵지만 재미있어요', 'Es difícil pero divertido.'), ('-아서/어서', 'porque / y luego', '배가 고파서 먹어요', 'Como porque tengo hambre.'), ('-(으)면', 'si', '시간이 있으면 만나요', 'Si tienes tiempo, nos vemos.')])],
      next=['adnom', 'quiz']),
    dict(id='adnom', q=('꾸미는 말 -(으)ㄴ/는/(으)ㄹ', 'Modificadores'), kw=['관형','꾸미','는 ','ㄴ ','modificador','adjetivo antes'],
      a=[T('명사 앞에서 꾸며 줄 때 시제에 따라 모양이 바뀌어요.', 'Antes de un sustantivo, la forma cambia según el tiempo.'),
         ROWS('먹다 + 사과', 'comer + manzana', [('현재', 'presente', '먹는 사과', 'la manzana que como'), ('과거', 'pasado', '먹은 사과', 'la manzana que comí'), ('미래', 'futuro', '먹을 사과', 'la manzana que comeré'), ('형용사', 'adjetivo', '좋은 사람', 'una buena persona')])],
      next=['pos', 'comp']),
    dict(id='pos', q=('9품사', 'Categorías gramaticales'), kw=['품사','명사','동사','형용사','부사','categoría','sustantivo','verbo','adverbio'],
      a=[T('한국어 단어는 9가지 품사로 나눠요.', 'En coreano las palabras se dividen en 9 categorías.'),
         ROWS('9품사', '9 categorías', [('명사', 'sustantivo', '학교', 'escuela'), ('대명사', 'pronombre', '저', 'yo'), ('수사', 'numeral', '하나', 'uno'), ('조사', 'partícula', '을', '(objeto)'), ('동사', 'verbo', '먹다', 'comer'), ('형용사', 'adjetivo', '예쁘다', 'ser bonito'), ('관형사', 'determinante', '새', 'nuevo'), ('부사', 'adverbio', '빨리', 'rápido'), ('감탄사', 'interjección', '와', '¡guau!')]),
         TIP('한국어 형용사는 동사처럼 바뀌어요: 예뻐요, 예뻤어요.', 'Los adjetivos se conjugan como verbos: 예뻐요, 예뻤어요.')],
      next=['comp', 'quiz']),
    dict(id='comp', q=('문장 성분', 'Partes de la oración'), kw=['문장 성분','성분','주어','서술어','목적어','partes','oración'],
      a=[EX('민수가 맛있는 사과를 빨리 먹었어요.', 'Minsu comió rápido una manzana rica.'),
         ROWS('나눠 보기', 'Análisis', [('주어', 'sujeto', '민수가', 'Minsu'), ('관형어', 'modificador', '맛있는', 'rica'), ('목적어', 'objeto', '사과를', 'manzana'), ('부사어', 'adverbial', '빨리', 'rápido'), ('서술어', 'predicado', '먹었어요', 'comió')]),
         TIP('한국어는 서술어가 문장 맨 끝에 와요.', 'En coreano el predicado va al final.')],
      next=['pos', 'quiz']),
    dict(id='num', q=('숫자 두 가지', 'Dos tipos de números'), kw=['숫자','하나','일 이','시간','몇','número','numeros','hora','edad'],
      a=[ROWS('언제 무엇을?', '¿Cuál uso?', [('고유어: 하나, 둘, 셋', 'nativos', '세 시', 'las tres (horas)'), ('고유어 + 개', 'contar cosas', '사과 두 개', 'dos manzanas'), ('한자어: 일, 이, 삼', 'sino-coreanos', '삼십 분', 'treinta minutos'), ('한자어 + 날짜·돈', 'fechas y dinero', '십일월 구일', '9 de noviembre')]),
         TIP('시간은 "시 = 고유어, 분 = 한자어": 세 시 삼십 분.', 'Hora con nativos, minutos con sino-coreanos.')],
      next=['quiz']),
    dict(id='causpass', q=('사동·피동', 'Causativo y pasivo'), kw=['사동','피동','이다','히다','causativ','pasiv'],
      a=[ROWS('기본 모양', 'Formas básicas', [('사동 (시키기)', 'causativo', '아기에게 밥을 먹여요', 'Le doy de comer al bebé.'), ('피동 (당하기)', 'pasivo', '산이 보여요', 'Se ve la montaña.'), ('사동', 'causativo', '옷을 입혀요', 'Le pongo la ropa.')]),
         TIP('-이-, -히-, -리-, -기-가 붙어요: 먹다→먹이다, 보다→보이다, 열다→열리다.', 'Se agregan -이-, -히-, -리-, -기-.')],
      next=['quiz']),
    dict(id='conj', q=('동사 바꿔 줘', 'Conjugar un verbo'), kw=['바꿔','활용','conjug'],
      a=[T('동사를 \'-다\' 모양으로 써 주세요. 예: 가다, 먹다, 공부하다, 듣다', 'Escribe un verbo en forma «-다». Ej.: 가다, 먹다, 공부하다, 듣다')],
      next=['present', 'past']),
    dict(id='quiz', q=('퀴즈 풀래요', 'Hacer un quiz'), kw=['퀴즈','문제','quiz','pregunta','examen','prueba'], quiz=True, a=[], next=[]),
  ],
  fallback=[T('음, 그건 제가 잘 모르겠어요. 아래 문법 중에서 골라 보거나 \'먹다\'처럼 동사를 써 주세요.', 'Mmm, no sé responder eso. Elige un tema de abajo o escribe un verbo como «먹다».')],
  fallnext=['particles', 'present', 'quiz'],
  quiz=[
    dict(q=('빈칸에 알맞은 것은?', '¿Qué va en el espacio?'), stem='저는 학생___.', opts=['이에요', '예요', '는'], ans=0, ex=('학생은 받침이 있어서 \'이에요\'.', '학생 tiene batchim → 이에요.')),
    dict(q=('빈칸에 알맞은 것은?', '¿Qué va en el espacio?'), stem='사과___ 먹어요.', opts=['을', '를', '가'], ans=1, ex=('사과는 받침이 없어서 \'를\'.', '사과 no tiene batchim → 를.')),
    dict(q=('빈칸에 알맞은 것은?', '¿Qué va en el espacio?'), stem='도서관___ 책을 읽어요.', opts=['에', '에서', '를'], ans=1, ex=('책을 읽는 동작을 하는 곳이라서 \'에서\'.', 'Es donde ocurre la acción → 에서.')),
    dict(q=('어제 일이에요. 알맞은 것은?', 'Pasó ayer. ¿Cuál es correcta?'), stem='어제 영화를 ___.', opts=['봐요', '봤어요', '볼 거예요'], ans=1, ex=('어제 → 과거: 봤어요.', 'Ayer → pasado: 봤어요.')),
    dict(q=('내일 일이에요. 알맞은 것은?', 'Será mañana. ¿Cuál es correcta?'), stem='내일 친구를 ___.', opts=['만났어요', '만나요', '만날 거예요'], ans=2, ex=('내일 → 미래: 만날 거예요.', 'Mañana → futuro: 만날 거예요.')),
    dict(q=('"No puedo ir"는?', '¿Cómo se dice «No puedo ir»?'), stem='', opts=['안 가요', '못 가요', '가지 않아요'], ans=1, ex=('할 수 없을 때는 \'못\'.', 'Cuando no puedes → 못.')),
    dict(q=('선생님께 공손하게: "앉다"', 'Con respeto a la profe: «sentarse»'), stem='여기 ___.', opts=['앉아', '앉으세요', '앉았어요'], ans=1, ex=('받침이 있으면 \'-으세요\'.', 'Con batchim → -으세요.')),
    dict(q=('"세 시"의 뜻은?', '¿Qué significa «세 시»?'), stem='', opts=['3 horas', 'las tres', 'tres minutos'], ans=1, ex=('시간을 말할 때 고유어 \'세\' + 시.', 'Para la hora se usan números nativos.')),
    dict(q=('빈칸에 알맞은 것은?', '¿Qué va en el espacio?'), stem='어렵___ 재미있어요.', opts=['고', '지만', '아서'], ans=1, ex=('반대 내용을 이을 때 \'-지만\'.', 'Para contrastar → -지만.')),
    dict(q=('\'예쁘다\'의 품사는?', '¿Qué categoría es «예쁘다»?'), stem='', opts=['동사', '형용사', '부사'], ans=1, ex=('상태를 나타내는 형용사예요.', 'Describe un estado: adjetivo.')),
  ],
)

# ---------------------------------------------------------------- Sofia
BOTS['so'] = dict(
  name=('소피아', 'Sofía'), role=('읽기·쓰기 친구', 'Leer y escribir'), color='#FBD3BF', tint='#FFF4EE',
  ph=('글자나 단어를 써 보세요 (예: 한)', 'Escribe una letra o palabra (ej.: 한)'),
  greet=[T('안녕하세요! 저는 소피아예요.', '¡Hola! Soy Sofía.'),
         T('한글 읽기와 쓰기를 같이 연습해요. 궁금한 글자나 단어를 쓰면 자음과 모음으로 나눠서 읽는 법을 알려 줄게요.', 'Practicamos juntos a leer y escribir hangul. Escribe una letra o palabra y la separo en consonantes y vocales para que sepas leerla.')],
  start=['struct', 'vowels', 'cons', 'double', 'batchim', 'quiz'],
  topics=[
    dict(id='struct', q=('한글은 어떻게 생겼어요?', '¿Cómo funciona el hangul?'), kw=['구조','블록','어떻게 생','처음','기본','estructura','bloque','cómo funciona','empezar'],
      a=[T('한글은 자음 14개와 모음 10개가 기본이에요. 자음과 모음을 모아서 한 글자(블록)를 만들어요.', 'El hangul tiene 14 consonantes y 10 vocales básicas. Se juntan en bloques: cada bloque es una sílaba.'),
         ROWS('글자 모양', 'Formas del bloque', [('자음 + 세로 모음', 'vocal vertical a la derecha', '가', 'ga'), ('자음 + 가로 모음', 'vocal horizontal abajo', '고', 'go'), ('+ 받침', 'consonante final abajo', '각', 'gak')]),
         TIP('모음만 쓸 때는 앞에 소리 없는 ㅇ을 붙여요: 아, 오', 'Una vocal sola lleva ㅇ muda delante: 아, 오.')],
      next=['vowels', 'cons', 'order']),
    dict(id='vowels', q=('기본 모음 10개', 'Las 10 vocales'), kw=['모음','vocal','vocales','ㅏ','ㅓ','ㅗ','ㅜ','ㅡ','ㅣ'],
      a=[ROWS('기본 모음', 'Vocales básicas', [('ㅏ', 'a', '아', 'a'), ('ㅑ', 'ya', '야', 'ya'), ('ㅓ', 'o abierta', '어', 'o (boca abierta)'), ('ㅕ', 'yo abierta', '여', 'yo (boca abierta)'), ('ㅗ', 'o', '오', 'o (labios redondos)'), ('ㅛ', 'yo', '요', 'yo'), ('ㅜ', 'u', '우', 'u'), ('ㅠ', 'yu', '유', 'yu'), ('ㅡ', 'u plana', '으', 'u sin redondear'), ('ㅣ', 'i', '이', 'i')]),
         TIP('ㅓ는 입을 크게 벌리고, ㅗ는 입술을 동그랗게 해요.', 'ㅓ: boca bien abierta. ㅗ: labios redondos.')],
      next=['comp', 'cons', 'quiz']),
    dict(id='cons', q=('기본 자음 14개', 'Las 14 consonantes'), kw=['자음','consonante','ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅎ'],
      a=[ROWS('기본 자음', 'Consonantes básicas', [('ㄱ 기역', 'g / k', '가', 'ga'), ('ㄴ 니은', 'n', '나', 'na'), ('ㄷ 디귿', 'd / t', '다', 'da'), ('ㄹ 리을', 'r / l', '라', 'ra'), ('ㅁ 미음', 'm', '마', 'ma'), ('ㅂ 비읍', 'b / p', '바', 'ba'), ('ㅅ 시옷', 's', '사', 'sa'), ('ㅇ 이응', 'muda / ng', '아', 'a'), ('ㅈ 지읒', 'ch suave', '자', 'cha'), ('ㅎ 히읗', 'j suave', '하', 'ja')]),
         T('ㅊ, ㅋ, ㅌ, ㅍ는 숨을 세게 내는 소리예요.', 'ㅊ, ㅋ, ㅌ, ㅍ se dicen con aire fuerte.'),
         LINK('topic:aspir', '거센소리 보기', 'Ver consonantes aspiradas')],
      next=['aspir', 'double', 'order']),
    dict(id='aspir', q=('거센소리 ㅋㅌㅍㅊ', 'Aspiradas ㅋㅌㅍㅊ'), kw=['거센','ㅋ','ㅌ','ㅍ','ㅊ','aspirad','aire'],
      a=[T('입 앞에 손을 대고 말해 보세요. 바람이 세게 느껴지면 맞아요.', 'Pon la mano frente a la boca: debes sentir mucho aire.'),
         ROWS('비교해서 듣기', 'Escucha y compara', [('ㄱ → ㅋ', 'g → k fuerte', '가 · 카', ''), ('ㄷ → ㅌ', 'd → t fuerte', '다 · 타', ''), ('ㅂ → ㅍ', 'b → p fuerte', '바 · 파', ''), ('ㅈ → ㅊ', 'ch → ch fuerte', '자 · 차', '')])],
      next=['double', 'quiz']),
    dict(id='double', q=('쌍자음 ㄲㄸㅃㅆㅉ', 'Dobles ㄲㄸㅃㅆㅉ'), kw=['쌍자음','된소리','ㄲ','ㄸ','ㅃ','ㅆ','ㅉ','doble','dobles','tensa'],
      a=[T('쌍자음은 목에 힘을 주고 바람 없이 짧고 세게 내요.', 'Las dobles se dicen tensas: cortas, fuertes y sin aire.'),
         ROWS('세 소리 비교', 'Compara los tres sonidos', [('ㄱ ㅋ ㄲ', 'suave · aire · tensa', '가 카 까', ''), ('ㄷ ㅌ ㄸ', '', '다 타 따', ''), ('ㅂ ㅍ ㅃ', '', '바 파 빠', ''), ('ㅈ ㅊ ㅉ', '', '자 차 짜', ''), ('ㅅ ㅆ', '', '사 싸', '')]),
         TIP('스페인어 \'p\' in "papá"가 ㅃ에 가까워요.', 'La «p» de «papá» se parece más a ㅃ que a ㅍ.')],
      next=['comp', 'quiz']),
    dict(id='comp', q=('복합 모음', 'Vocales compuestas'), kw=['복합','이중','ㅐ','ㅔ','ㅘ','ㅝ','ㅚ','ㅟ','ㅢ','compuesta','diptongo'],
      a=[ROWS('만드는 법', 'Cómo se forman', [('ㅗ + ㅏ = ㅘ', 'wa', '와', 'wa'), ('ㅜ + ㅓ = ㅝ', 'wo', '워', 'wo'), ('ㅗ + ㅣ = ㅚ', 'we', '외', 'we'), ('ㅜ + ㅣ = ㅟ', 'wi', '위', 'wi'), ('ㅡ + ㅣ = ㅢ', 'ui', '의', 'ui'), ('ㅐ · ㅔ', 'e (igual)', '애 · 에', 'e')]),
         T('\'ㅢ\'는 자리에 따라 세 가지로 읽어요.', '«ㅢ» se lee de tres formas según el lugar.'),
         ROWS('ㅢ 읽기', 'Cómo leer ㅢ', [('첫 글자', 'al inicio', '의사', '[의사] médico'), ('자음 뒤', 'tras consonante', '희망', '[히망] esperanza'), ('~의 (소유)', 'partícula «de»', '우리의', '[우리에] nuestro')])],
      next=['batchim', 'quiz']),
    dict(id='batchim', q=('받침 읽기', 'Leer el batchim'), kw=['받침','끝소리','batchim','final'],
      a=[T('받침은 7가지 소리로만 나요.', 'El batchim solo suena de 7 maneras.'),
         ROWS('받침 7소리', '7 sonidos finales', [('ㄱ ㅋ ㄲ → k', 'k', '밖', '[박] afuera'), ('ㄴ → n', 'n', '산', '[산] montaña'), ('ㄷ ㅅ ㅈ ㅊ ㅌ ㅎ → t', 't', '꽃', '[꼳] flor'), ('ㄹ → l', 'l', '물', '[물] agua'), ('ㅁ → m', 'm', '밤', '[밤] noche'), ('ㅂ ㅍ → p', 'p', '앞', '[압] adelante'), ('ㅇ → ng', 'ng', '방', '[방] cuarto')])],
      next=['link', 'quiz']),
    dict(id='link', q=('연음 (이어 읽기)', 'Enlace de sonidos'), kw=['연음','이어','넘어','enlace','unir','liaison'],
      a=[T('받침 뒤에 ㅇ으로 시작하는 글자가 오면, 받침 소리가 다음 글자로 넘어가요.', 'Si después del batchim viene una sílaba con ㅇ, el batchim pasa a la sílaba siguiente.'),
         ROWS('이렇게 읽어요', 'Se lee así', [('음악', '→ [으막]', '음악', 'música'), ('한국어', '→ [한구거]', '한국어', 'coreano'), ('옷이', '→ [오시]', '옷이', 'la ropa')])],
      next=['batchim', 'quiz']),
    dict(id='order', q=('쓰는 순서', 'Orden de trazos'), kw=['순서','획','쓰는 법','쓰기','trazo','orden','escribir'],
      a=[ROWS('기본 규칙', 'Reglas básicas', [('1', '1', '', 'De arriba hacia abajo.'), ('2', '2', '', 'De izquierda a derecha.'), ('3', '3', '', 'ㅇ empieza arriba y gira hacia la izquierda.'), ('4', '4', '', 'En un bloque: consonante → vocal → batchim.')]),
         T('훈련의 \'한글 쓰기\'에서 손가락으로 따라 써 볼 수 있어요.', 'En Entrenar → «Escribir hangul» puedes trazar con el dedo.'),
         LINK('tab:Quiz.dc.html', '훈련 열기', 'Abrir Entrenar')],
      next=['keyboard', 'quiz']),
    dict(id='keyboard', q=('한글 자판 설치', 'Teclado coreano'), kw=['자판','키보드','타자','teclado','escribir en coreano'],
      a=[ROWS('설치 방법', 'Cómo instalarlo', [('안드로이드 (Gboard)', 'Android', '', 'Ajustes de Gboard → Idiomas → Agregar teclado → Coreano → Estándar (2 grupos).'), ('아이폰', 'iPhone', '', 'Ajustes → General → Teclado → Teclados → Agregar → Coreano → Estándar.')]),
         TIP('왼쪽은 자음, 오른쪽은 모음이에요. 차례대로 누르면 글자가 모여요.', 'A la izquierda las consonantes, a la derecha las vocales. Al escribir en orden, se arman los bloques.')],
      next=['order', 'quiz']),
    dict(id='confuse', q=('헷갈리는 글자', 'Letras confusas'), kw=['헷갈','비슷','confus','parecid','diferencia'],
      a=[ROWS('비교', 'Compara', [('ㅓ / ㅗ', 'o abierta / o redonda', '어 · 오', ''), ('ㅐ / ㅔ', 'hoy suenan igual', '개 · 게', ''), ('ㄹ', 'r entre vocales, l al final', '나라 · 물', ''), ('ㅡ / ㅜ', 'u plana / u redonda', '으 · 우', '')])],
      next=['vowels', 'quiz']),
    dict(id='quiz', q=('퀴즈 풀래요', 'Hacer un quiz'), kw=['퀴즈','문제','quiz','pregunta','examen'], quiz=True, a=[], next=[]),
  ],
  fallback=[T('글자나 짧은 단어를 써 주면 나눠서 읽어 줄게요. 아니면 아래에서 골라 보세요.', 'Escríbeme una letra o palabra corta y te la explico. O elige un tema abajo.')],
  fallnext=['vowels', 'cons', 'quiz'],
  quiz=[
    dict(q=('합치면 어떤 글자?', '¿Qué sílaba se forma?'), stem='ㄱ + ㅏ', opts=['거', '가', '고'], ans=1, ex=('ㄱ + ㅏ = 가 (ga)', 'ㄱ + ㅏ = 가 (ga)')),
    dict(q=('이 중에서 모음은?', '¿Cuál es una vocal?'), stem='', opts=['ㅁ', 'ㅓ', 'ㅅ'], ans=1, ex=('ㅓ는 모음이에요.', 'ㅓ es vocal.')),
    dict(q=('\'한\'의 받침은?', '¿Cuál es el batchim de «한»?'), stem='한', opts=['ㅎ', 'ㅏ', 'ㄴ'], ans=2, ex=('한 = ㅎ + ㅏ + ㄴ(받침)', '한 = ㅎ + ㅏ + ㄴ (final)')),
    dict(q=('쌍자음은 어느 것?', '¿Cuál es consonante doble?'), stem='', opts=['ㄲ', 'ㅋ', 'ㄱ'], ans=0, ex=('ㄲ는 ㄱ를 두 번 쓴 쌍자음이에요.', 'ㄲ es la doble de ㄱ.')),
    dict(q=('\'음악\'은 어떻게 읽어요?', '¿Cómo se lee «음악»?'), stem='음악', opts=['[음악]', '[으막]', '[응악]'], ans=1, ex=('받침 ㅁ이 다음 글자로 넘어가요.', 'La ㅁ pasa a la sílaba siguiente.')),
    dict(q=('\'꽃\'의 받침 소리는?', '¿Cómo suena el final de «꽃»?'), stem='꽃', opts=['ch', 't', 's'], ans=1, ex=('ㅊ 받침은 [ㄷ] 소리: [꼳]', 'ㅊ final suena [t]: [꼳].')),
    dict(q=('ㅗ + ㅏ = ?', 'ㅗ + ㅏ = ?'), stem='', opts=['ㅘ', 'ㅝ', 'ㅚ'], ans=0, ex=('ㅗ + ㅏ = ㅘ (wa)', 'ㅗ + ㅏ = ㅘ (wa)')),
    dict(q=('아래에 쓰는 가로 모음은?', '¿Qué vocal va debajo de la consonante?'), stem='', opts=['ㅏ', 'ㅜ', 'ㅣ'], ans=1, ex=('ㅗ ㅛ ㅜ ㅠ ㅡ는 자음 아래에 써요.', 'ㅗ ㅛ ㅜ ㅠ ㅡ van debajo.')),
    dict(q=('숨을 세게 내는 소리는?', '¿Cuál se dice con aire fuerte?'), stem='', opts=['ㄷ', 'ㅌ', 'ㄸ'], ans=1, ex=('ㅌ는 거센소리예요.', 'ㅌ es aspirada.')),
    dict(q=('\'물\'을 읽으면?', '¿Cómo se lee «물»?'), stem='물', opts=['mur', 'mul', 'mol'], ans=1, ex=('ㅜ = u, 받침 ㄹ = l', 'ㅜ = u, ㄹ final = l')),
  ],
)

# ---------------------------------------------------------------- Tosuni
BOTS['to'] = dict(
  name=('토순이', 'Tosuni'), role=('앱 도우미', 'Guía de la app'), color='#D6EEDC', tint='#F1FAF3',
  ph=('토순이한테 말 걸기', 'Háblale a Tosuni'),
  greet=[T('안녕! 나 토순이야.', '¡Hola! Soy Tosuni.'),
         T('한글 나라에서 뭘 할지 모르겠으면 나한테 물어봐. 같이 나라를 되살리자!', 'Si no sabes qué hacer en 한글 나라, pregúntame. ¡Vamos a revivir el reino juntos!')],
  start=['start', 'carrot', 'plant', 'train', 'phrase', 'cheer'],
  topics=[
    dict(id='start', q=('뭐부터 하면 돼?', '¿Por dónde empiezo?'), kw=['처음','뭐부터','시작','뭐 해','empiezo','empezar','qué hago','inicio'],
      a=[ROWS('토순이 추천 순서', 'Mi orden recomendado', [('1', '1', '', 'Mapa: mira el libro y el video de tu nivel.'), ('2', '2', '', 'Entrenar: gana zanahorias con el Quiz de Tosuni.'), ('3', '3', '', 'Inicio: termina la misión de riego y riega tu planta.'), ('4', '4', '', 'Tienda de Tosuni: decora con tus zanahorias.')]),
         LINK('tab:Mapa.dc.html', '맵 열기', 'Abrir Mapa')],
      next=['train', 'plant']),
    dict(id='carrot', q=('당근은 어디에 써?', '¿Para qué son las zanahorias?'), kw=['당근','zanahoria','가게','상점','tienda','comprar'],
      a=[T('당근으로 토순이 가게에서 꾸미기 아이템을 살 수 있어. 식물에게 영양제를 줄 때도 써!', 'Con zanahorias compras cosas en la Tienda de Tosuni. ¡También sirven para darle abono a tu planta!'),
         TIP('토순이 퀴즈에서 텃밭을 마스터하면 30개를 한 번에 받아!', '¡Si dominas un huerto en el Quiz de Tosuni, ganas 30 de una vez!'),
         LINK('tab:Main.dc.html', '홈 열기', 'Abrir Inicio')],
      next=['plant', 'train']),
    dict(id='plant', q=('식물은 어떻게 키워?', '¿Cómo crece mi planta?'), kw=['식물','물','영양제','씨앗','키우','planta','regar','abono','crecer'],
      a=[T('이번 주 미션을 끝내면 식물에 물을 줄 수 있어. 물을 줄수록 식물이 자라!', 'Al terminar la misión de la semana puedes regar tu planta. ¡Cada riego la hace crecer!'),
         T('홈에서 물뿌리개를 누르면 해야 할 미션이 보여. 레벨을 다 마치면 맵에 식물을 심을 수 있어.', 'En Inicio toca la regadera para ver tus misiones. Al terminar el nivel, la plantas en el Mapa.'),
         LINK('tab:Main.dc.html', '홈 열기', 'Abrir Inicio')],
      next=['carrot', 'map']),
    dict(id='map', q=('맵에서는 뭘 해?', '¿Qué hay en el Mapa?'), kw=['맵','지도','그림책','영상','mapa','libro','video'],
      a=[T('맵에는 레벨마다 그림책과 정리 영상이 있어. 수업 전에 보고 오면 훨씬 쉬워!', 'En el Mapa cada nivel tiene un libro ilustrado y un video resumen. ¡Velos antes de clase y todo será más fácil!'),
         LINK('tab:Mapa.dc.html', '맵 열기', 'Abrir Mapa')],
      next=['train', 'start']),
    dict(id='train', q=('훈련은 뭐가 있어?', '¿Qué hay en Entrenar?'), kw=['훈련','퀴즈','단어장','쓰기','만들기','entrenar','quiz','vocabulario'],
      a=[ROWS('훈련 4가지', '4 entrenamientos', [('토순이 퀴즈', 'Quiz', '', 'Cada etapa se domina con 50 aciertos.'), ('한국어 만들기', 'Arma en coreano', '', '3 retos al día con sellos de premio.'), ('토순이 단어장', 'Vocabulario', '', 'Tarjetas: lo que aprendes queda en tu libro.'), ('한글 쓰기', 'Escribir hangul', '', 'Traza las letras con el dedo.')]),
         LINK('tab:Quiz.dc.html', '훈련 열기', 'Abrir Entrenar')],
      next=['carrot', 'friends']),
    dict(id='friends', q=('다른 친구들은 누구야?', '¿Quiénes son los demás?'), kw=['친구','다니엘','소피아','누구','amigos','daniel','sofía','sofia'],
      a=[ROWS('채팅 친구들', 'Amigos del chat', [('율미쌤', 'Profe Yoolmi', '', 'Problemas de la app y dudas de clase.'), ('다니엘', 'Daniel', '', 'Gramática: tiempos, partículas, honoríficos.'), ('소피아', 'Sofía', '', 'Leer y escribir: consonantes y vocales.')])],
      next=['start', 'cheer']),
    dict(id='phrase', q=('오늘의 한마디', 'Frase del día'), kw=['한마디','표현','오늘','frase','expresión'], phrase=True, a=[], next=['phrase', 'cheer']),
    dict(id='cheer', q=('힘들어, 응원해 줘', 'Ánimo, por favor'), kw=['힘들','어려워','포기','응원','지쳐','cansad','difícil','ánimo','animo','triste'], cheer=True, a=[], next=['phrase', 'start']),
  ],
  fallback=[T('헤헤, 그건 잘 모르겠어! 아래에서 골라 줄래?', '¡Jeje, eso no lo sé! ¿Eliges algo de abajo?')],
  fallnext=['start', 'train', 'friends'],
  phrases=[('안녕하세요!', '¡Hola!'), ('감사합니다.', 'Muchas gracias.'), ('괜찮아요.', 'Está bien. / No pasa nada.'), ('잘 먹겠습니다.', 'Buen provecho (antes de comer).'), ('화이팅!', '¡Ánimo! / ¡Tú puedes!'), ('보고 싶어요.', 'Te extraño.'), ('천천히 말해 주세요.', 'Hable más despacio, por favor.'), ('다시 한번 말해 주세요.', '¿Puede repetirlo, por favor?'), ('이거 얼마예요?', '¿Cuánto cuesta esto?'), ('맛있어요!', '¡Está rico!'), ('수고하셨습니다.', 'Buen trabajo (al terminar).'), ('또 만나요!', '¡Nos vemos otra vez!')],
  cheers=[('천천히 해도 괜찮아. 매일 조금씩이면 충분해!', 'Puedes ir despacio. ¡Un poquito cada día es suficiente!'), ('틀려도 괜찮아! 틀린 문제가 제일 많이 가르쳐 줘.', '¡Equivocarse está bien! Los errores son los que más enseñan.'), ('어제의 너보다 오늘의 네가 한 글자 더 알아. 대단해!', 'Hoy sabes una letra más que ayer. ¡Eres genial!'), ('힘들면 쉬었다 와. 나는 여기서 기다릴게!', 'Si estás cansado, descansa. ¡Aquí te espero!')],
)

# ---------------------------------------------------------------- build
ROWKO = json.load(open('/tmp/claude-0/-home-claude/32e06676-27dc-5c32-86c6-435bfae3cbbe/scratchpad/chat/rowko.json'))
def part(p):
    k = p[0]
    if k == 't': return {'k': 't', 'ko': p[1], 'es': p[2]}
    if k == 'tip': return {'k': 'tip', 'ko': p[1], 'es': p[2]}
    if k == 'ex': return {'k': 'ex', 'kr': p[1], 'rom': R(p[1]), 'es': p[2]}
    if k == 'rows':
        rows = []
        for r in p[3]:
            rows.append({'a': r[0], 'b': r[1], 'kr': r[2], 'rom': R(r[2]) if r[2] else '', 'es': r[3], 'ko': ROWKO.get(r[3], '') if not r[2] else ''})
        return {'k': 'rows', 'ko': p[1], 'es': p[2], 'rows': rows}
    if k == 'link': return {'k': 'link', 'to': p[1], 'ko': p[2], 'es': p[3]}
    raise ValueError(k)

out = {}
for bid, b in BOTS.items():
    o = {'name': b['name'], 'role': b['role'], 'color': b['color'], 'tint': b['tint'], 'ph': b['ph'],
         'greet': [part(p) for p in b['greet']], 'start': b['start'], 'fallback': [part(p) for p in b['fallback']], 'fallnext': b['fallnext'], 'topics': {}}
    order = []
    for t in b['topics']:
        o['topics'][t['id']] = {'q': t['q'], 'kw': t['kw'], 'a': [part(p) for p in t['a']], 'next': t['next'], 'quiz': bool(t.get('quiz')), 'phrase': bool(t.get('phrase')), 'cheer': bool(t.get('cheer'))}
        order.append(t['id'])
    o['order'] = order
    if 'quiz' in b:
        o['quiz'] = [{'q': x['q'], 'stem': x['stem'], 'rom': R(x['stem']) if re.search('[가-힣]', x['stem']) and not re.search('[ㄱ-ㅣ]', x['stem']) else '', 'opts': x['opts'], 'ans': x['ans'], 'ex': x['ex']} for x in b['quiz']]
    if 'phrases' in b:
        o['phrases'] = [{'kr': k, 'rom': R(k), 'es': e} for k, e in b['phrases']]
        o['cheers'] = b['cheers']
    # sanity: next ids exist
    for t in b['topics']:
        for n in t['next'] + b['start'] + b['fallnext']:
            assert n in o['topics'], (bid, n)
    out[bid] = o

json.dump(out, open('/tmp/claude-0/-home-claude/32e06676-27dc-5c32-86c6-435bfae3cbbe/scratchpad/chat/content.json', 'w'), ensure_ascii=False)
print('ok', {k: len(v['topics']) for k, v in out.items()}, len(json.dumps(out, ensure_ascii=False)))
