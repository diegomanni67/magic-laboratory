const app=document.querySelector("#app"),toastEl=document.querySelector("#toast");
const state={code:null,token:null,room:null,poll:null,lastKey:"",config:null};
const themeAsset={clasico:"clasico",profundo:"profundo",parejas:"parejas",cumple:"cumple",caos:"caos",rompehielo:"rompehielo",picante18:"picante18",canceladisimos:"canceladisimos"};
const modeAsset={quien_fue:"who",lee_al_grupo:"group",mentiroso:"liar",silla_caliente:"hot",duo:"duo",ordena_al_grupo:"rank",todos_contra_uno:"versus",mision_secreta:"mission"};
function assetImg(type,key,cls="ui-icon"){const file=(type==="theme"?themeAsset[key]:modeAsset[key]);if(!file)return "";const ext=type==="theme"?"webp":"svg";return '<img class="'+cls+'" src="/assets/'+type+'-'+file+'.'+ext+'?v=20260920-icons8" alt="">'}

const GAME_RULES={
  quien_fue:{
    title:"¿Quién fue?",eyebrow:"DETECTIVE SOCIAL",
    summary:"Aparece una historia real escrita por alguien del grupo. Todos tienen que descubrir quién la contó.",
    objective:"Reconocer a tus amigos por sus anécdotas y leer qué historia pertenece a quién.",
    players:"3+ jugadores. El autor de la historia no vota en esa ronda.",
    rounds:"Hasta 6 rondas por partida",duration:"≈ 1–2 min por ronda",winner:"Suma más quien más adivina y quien mejor consigue despistar.",
    scoring:["Acierto: +100 puntos.","Autor: +25 por cada persona que se equivoca, hasta +100."],
    steps:[
      "Antes de jugar, cada persona deja 3 historias reales en secreto.",
      "La Juntada elige una historia y la muestra sin nombre.",
      "Todos, menos su autor, votan desde el celular quién creen que la escribió.",
      "El sistema resuelve la ronda, suma los puntos y los mantiene ocultos hasta el final."
    ],
    example:{
      prompt:"CONSIGNA PREVIA · Contá una excusa ridícula que hayas usado.",
      answer:"“Dije que estaba enfermo y en realidad me fui a un asado.”",
      action:"En pantalla aparecen Sofi, Nico, Mica y Diego. Todos votan quién creen que contó esa historia.",
      result:"Era Nico. Quien votó Nico suma +100. Nico suma +25 por cada persona que cayó."
    },
    tip:"Las mejores historias son concretas: algo que realmente podría delatarte, pero no de inmediato."
  },
  lee_al_grupo:{
    title:"Leé al grupo",eyebrow:"MAYORÍA SECRETA",
    summary:"Acá no importa qué elegirías vos: tenés que anticipar qué eligió la mayoría del grupo.",
    objective:"Entender la cabeza colectiva de la juntada.",
    players:"3+ jugadores. Todos participan.",
    rounds:"3 rondas por partida",duration:"≈ 1 min por ronda",winner:"Gana terreno quien mejor anticipa el consenso del grupo.",
    scoring:["Acierto sobre la mayoría: +100 puntos."],
    steps:[
      "Durante la preparación todos responden 3 consignas de mayoría sin ver las respuestas ajenas.",
      "La Juntada cuenta los votos y determina cuál fue la opción más elegida.",
      "En vivo aparece esa misma consigna y cada jugador intenta predecir qué eligió la mayoría.",
      "El sistema compara la predicción con el resultado real y suma automáticamente."
    ],
    example:{
      prompt:"¿Quién sobreviviría mejor a un apocalipsis?",
      answer:"En la preparación, la mayoría eligió a Sofi.",
      action:"Durante la partida todos tienen que adivinar quién creen que ganó esa votación secreta.",
      result:"Si elegís Sofi, sumás +100."
    },
    tip:"Pensá como grupo, no como individuo. Si hay empate en la votación previa, La Juntada lo resuelve automáticamente."
  },
  mentiroso:{
    title:"El Mentiroso",eyebrow:"VERDAD O BLUFF",
    summary:"Aparece una afirmación sobre alguien del grupo. Puede ser una verdad sorprendente o una mentira preparada por esa misma persona.",
    objective:"Detectar el engaño y, cuando te toca mentir, conseguir que el resto te crea.",
    players:"3+ jugadores. La persona protagonista no vota su propia afirmación.",
    rounds:"Hasta 6 rondas por partida",duration:"≈ 1 min por ronda",winner:"Suman tanto los buenos detectores como quienes mienten mejor.",
    scoring:["Detectar correctamente verdad o mentira: +100.","Si era mentira, el autor gana +30 por cada persona engañada, hasta +120."],
    steps:[
      "Cada persona deja una verdad sorprendente y una mentira creíble.",
      "La Juntada muestra una afirmación y dice de quién habla.",
      "El resto vota “Es verdad” o “Es mentira”.",
      "El sistema resuelve y suma puntos por detectar o por engañar."
    ],
    example:{
      prompt:"¿Verdad o mentira sobre Mica?",
      answer:"“Una vez me subí a un avión equivocado.”",
      action:"Todos votan ES VERDAD o ES MENTIRA.",
      result:"Era mentira. Quien marcó mentira suma +100. Mica suma +30 por cada persona que creyó la historia."
    },
    tip:"La mentira ideal no es absurda: es esa historia que todos podrían imaginar perfectamente de vos."
  },
  silla_caliente:{
    title:"Silla Caliente",eyebrow:"¿CUÁNTO LO CONOCÉS?",
    summary:"Una persona ya respondió algo personal en secreto. Los demás tienen que encontrar cuál fue su respuesta real.",
    objective:"Demostrar quién conoce de verdad a la persona protagonista.",
    players:"3+ jugadores. La persona en la silla no vota.",
    rounds:"Hasta 4 rondas por partida",duration:"≈ 1–2 min por ronda",winner:"Suma más quien mejor conoce las respuestas de los demás.",
    scoring:["Respuesta correcta: +100 puntos."],
    steps:[
      "Durante la preparación cada jugador contesta una pregunta personal.",
      "La Juntada elige a una persona para la Silla Caliente.",
      "Su respuesta real se mezcla con respuestas de otros jugadores.",
      "El resto vota cuál cree que fue la respuesta del protagonista."
    ],
    example:{
      prompt:"¿Qué pesa más para vos: tener razón o mantener la paz?",
      answer:"La respuesta real de Diego fue: “Mantener la paz”.",
      action:"La Juntada mezcla esa respuesta con otras y todos intentan encontrar la de Diego.",
      result:"Quien elige “Mantener la paz” suma +100."
    },
    tip:"No alcanza con conocer gustos: muchas veces gana quien entiende cómo decide la otra persona."
  },
  todos_contra_uno:{
    title:"Todos contra uno",eyebrow:"DESCIFRÁ AL PROTAGONISTA",
    summary:"Una persona queda sola contra el resto. Su respuesta está escondida y todo el grupo intenta descubrirla.",
    objective:"Que el grupo descifre al protagonista… o que el protagonista consiga que todos fallen.",
    players:"3+ jugadores. Un protagonista queda fuera de la votación.",
    rounds:"Hasta 3 rondas por partida",duration:"≈ 1–2 min por ronda",winner:"Puntúan los que descifran al protagonista y también el protagonista si logra despistar.",
    scoring:["Jugador que acierta: +100.","Protagonista: +30 por cada persona que falla, hasta +120."],
    steps:[
      "La Juntada elige a un protagonista y toma una de sus respuestas secretas.",
      "La respuesta real se mezcla con respuestas de otras personas.",
      "Todo el grupo intenta descubrir cuál pertenece al protagonista.",
      "Cada error también puede darle puntos a quien está jugando solo."
    ],
    example:{
      prompt:"Todos contra Sofi · ¿Qué harías primero si ganaras la lotería?",
      answer:"La respuesta real de Sofi fue: “Me iría de viaje sin avisar a nadie”.",
      action:"El grupo ve varias respuestas y vota cuál creen que es la suya.",
      result:"Cada acierto vale +100. Sofi gana +30 por cada jugador que elija otra opción."
    },
    tip:"Es parecido a una emboscada social: el protagonista quiere ser difícil de leer."
  },
  duo:{
    title:"Dúo imposible",eyebrow:"¿PIENSAN IGUAL?",
    summary:"La Juntada arma una pareja. Ambos responden la misma elección sin ver al otro y el resto apuesta si van a coincidir.",
    objective:"Descubrir qué dúos están realmente sincronizados.",
    players:"4+ jugadores. Dos forman el dúo y el resto predice.",
    rounds:"Hasta 2 rondas por partida",duration:"≈ 1–2 min por ronda",winner:"El dúo suma si coincide; el resto suma por anticipar si habrá coincidencia.",
    scoring:["Si el dúo responde lo mismo: +100 para cada integrante.","Quien predice correctamente “coinciden/no coinciden”: +75."],
    steps:[
      "La Juntada elige dos personas al azar.",
      "Ambas reciben la misma pregunta de dos opciones y responden en secreto.",
      "El resto predice si van a elegir lo mismo o distinto.",
      "Se comparan las dos respuestas y se puntúan tanto el dúo como las predicciones."
    ],
    example:{
      prompt:"¿Qué elegirían: viaje improvisado o viaje totalmente planeado?",
      answer:"Sofi elige IMPROVISADO. Nico elige IMPROVISADO.",
      action:"Antes de verlo, los demás habían votado si coincidían o no.",
      result:"Sofi y Nico suman +100 cada uno. Quienes predijeron COINCIDEN suman +75."
    },
    tip:"Funciona mejor cuando el dúo parece obvio… o cuando nadie entiende por qué esas dos personas terminaron juntas."
  },
  ordena_al_grupo:{
    title:"Ordená al grupo",eyebrow:"RANKING COLECTIVO",
    summary:"Todos ordenan a cuatro personas según una consigna. Después se compara tu ranking con el ranking colectivo.",
    objective:"Acercarte lo máximo posible al orden que construye el grupo entero.",
    players:"4+ jugadores. Todos arman su ranking.",
    rounds:"Hasta 2 rondas por partida",duration:"≈ 2 min por ronda",winner:"Puntúa más quien queda más cerca del consenso.",
    scoring:["Entre 0 y +150 según la distancia entre tu orden y el ranking colectivo."],
    steps:[
      "Aparece una consigna y cuatro personas del grupo.",
      "Cada jugador las ordena del #1 al #4 desde su celular.",
      "La Juntada combina todos los rankings y obtiene el orden colectivo.",
      "Tu puntaje depende de cuánto se parezca tu orden al consenso."
    ],
    example:{
      prompt:"Ordenalos de más a menos probable que pierdan un vuelo por llegar tarde.",
      answer:"Consenso final: Nico → Mica → Diego → Sofi.",
      action:"Vos habías puesto Nico → Diego → Mica → Sofi.",
      result:"Como quedaste muy cerca del consenso, recibís gran parte de los +150 posibles."
    },
    tip:"No armes tu ranking ideal: intentá adivinar cómo los ordenaría el grupo entero."
  },
  mision_secreta:{
    title:"Misión secreta",eyebrow:"EL JUEGO SALE DE LA PANTALLA",
    summary:"Cada jugador recibe un objetivo privado para cumplir durante la juntada sin que el resto se dé cuenta.",
    objective:"Hacer que el juego siga ocurriendo mientras todos hablan, comen o hacen cualquier otra cosa.",
    players:"Una misión por jugador en las temáticas que incluyen este modo.",
    rounds:"1 misión por jugador",duration:"Puede durar toda la juntada",winner:"La misión vale un premio grande y se suma al puntaje general.",
    scoring:["Misión completada: +250 puntos."],
    steps:[
      "Tu celular te muestra una misión que solo vos podés ver.",
      "Intentás provocar esa situación naturalmente durante la juntada.",
      "Cuando la cumplís, la marcás como completada.",
      "La misión y su resultado se revelan recién al final junto con el resto de las respuestas."
    ],
    example:{
      prompt:"TU MISIÓN",
      answer:"“Conseguí que alguien proponga pedir pizza sin pedir pizza vos primero.”",
      action:"Seguís jugando y charlando normalmente mientras intentás llevar la conversación hacia ahí.",
      result:"Si lo conseguís y la marcás como cumplida, sumás +250."
    },
    tip:"Es el modo más distinto: no vive solamente en la pantalla, se mete dentro de la juntada real."
  }
};

function openRules(id){
  const rule=GAME_RULES[id];
  if(!rule)return;
  document.querySelector(".rules-overlay")?.remove();
  const steps=rule.steps.map((x,i)=>`<li><span>${String(i+1).padStart(2,"0")}</span><p>${esc(x)}</p></li>`).join("");
  const scoring=rule.scoring.map(x=>`<li>${esc(x)}</li>`).join("");
  const ex=rule.example||{};
  document.body.insertAdjacentHTML("beforeend",`
    <div class="rules-overlay" role="dialog" aria-modal="true" aria-label="Reglamento de ${esc(rule.title)}">
      <button class="rules-backdrop" data-close-rules aria-label="Cerrar reglamento"></button>
      <article class="rules-sheet">
        <button class="rules-close" data-close-rules aria-label="Cerrar">×</button>
        <header class="rules-hero">
          <div class="rules-icon">${assetImg("mode",id,"rules-mode-icon")}</div>
          <div><div class="kicker">${esc(rule.eyebrow)}</div><h2>${esc(rule.title)}</h2><p>${esc(rule.summary)}</p></div>
        </header>

        <div class="rules-facts">
          <div><small>RONDAS</small><strong>${esc(rule.rounds)}</strong></div>
          <div><small>DURACIÓN</small><strong>${esc(rule.duration)}</strong></div>
          <div><small>JUGADORES</small><strong>${esc(rule.players)}</strong></div>
        </div>

        <div class="rules-meta">
          <div><small>OBJETIVO</small><strong>${esc(rule.objective)}</strong></div>
          <div><small>QUIÉN TERMINA ARRIBA</small><strong>${esc(rule.winner)}</strong></div>
        </div>

        <section class="rules-section"><div class="kicker">CÓMO SE JUEGA</div><ol class="rules-steps">${steps}</ol></section>

        <section class="rules-example">
          <div class="kicker">EJEMPLO REAL DE UNA RONDA</div>
          <div class="example-prompt">${esc(ex.prompt||"")}</div>
          <blockquote>${esc(ex.answer||"")}</blockquote>
          <div class="example-flow"><span>QUÉ HACEN</span><p>${esc(ex.action||"")}</p></div>
          <div class="example-result"><span>RESULTADO</span><p>${esc(ex.result||"")}</p></div>
        </section>

        <section class="rules-section scoring"><div class="kicker">SISTEMA DE PUNTOS</div><ul>${scoring}</ul><div class="auto-score-note">✦ La Juntada calcula y guarda estos puntos automáticamente. El ranking permanece oculto hasta el final.</div></section>
        <aside class="rules-tip"><span>✦</span><div><small>CLAVE</small><strong>${esc(rule.tip)}</strong></div></aside>
        <footer class="rules-footer"><button class="primary" data-close-rules>Entendido</button></footer>
      </article>
    </div>`);
  document.body.classList.add("rules-open");
  document.querySelectorAll("[data-close-rules]").forEach(b=>b.onclick=closeRules);
  history.replaceState(null,"","#reglas="+id);
}
function closeRules(){
  document.querySelector(".rules-overlay")?.classList.add("closing");
  setTimeout(()=>document.querySelector(".rules-overlay")?.remove(),220);
  document.body.classList.remove("rules-open");
  if(location.hash.startsWith("#reglas="))history.replaceState(null,"","#modos");
}

const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(m){toastEl.textContent=m;toastEl.classList.add("show");setTimeout(()=>toastEl.classList.remove("show"),2500)}
function brand(){return '<div class="brand brand-real"><img src="/assets/logo-la-juntada.svg" alt="La Juntada"></div>'}
function saveSession(c,t){localStorage.setItem("ln_code",c);localStorage.setItem("ln_token",t);state.code=c;state.token=t}
function clearSession(){localStorage.removeItem("ln_code");localStorage.removeItem("ln_token");state.code=null;state.token=null;state.room=null}
async function api(url,o={}){const h={"Content-Type":"application/json",...(o.headers||{})};if(state.token)h.Authorization="Bearer "+state.token;const r=await fetch(url,{...o,headers:h});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"Algo salió mal");return d}
function stopPoll(){if(state.poll)clearInterval(state.poll);state.poll=null;if(window.__homeDemoTimer){clearInterval(window.__homeDemoTimer);window.__homeDemoTimer=null}}
function startPoll(){stopPoll();refresh();state.poll=setInterval(refresh,850)}
async function loadConfig(){if(!state.config)state.config=await api("/api/config")}
function themeCards(){
  return state.config.themes.map(t=>`
    <label class="theme-card ${t.premiumOnly?"premium-locked":""}" data-theme="${t.id}">
      <input type="radio" name="theme" value="${t.id}" ${t.id==="clasico"?"checked":""} ${t.premiumOnly?"disabled":""}>
      <div class="theme-art-wrap">
        ${assetImg("theme",t.id,"theme-asset")}
        ${t.premiumOnly?'<span class="theme-lock">PREMIUM +18</span>':""}
      </div>
      <div class="theme-copy">
        <strong>${esc(t.title)}</strong>
        <small>${esc(t.tagline||t.description)}</small>
      </div>
    </label>`).join("");
}

function modeShowcase(){
  return state.config.modes
    .filter(m=>state.config.implementedModes.includes(m.id)||m.id==="mision_secreta")
    .map(m=>{
      const r=GAME_RULES[m.id];
      return `<button class="mode-mini rule-card" type="button" data-rule="${m.id}">
        ${assetImg("mode",m.id,"mode-show-icon")}
        <div class="mode-card-copy">
          <strong>${esc(m.title)}</strong>
          <small>${esc(r?.summary||m.description)}</small>
          <div class="mode-card-meta"><span>${esc(r?.rounds||"")}</span><span>${esc(r?.duration||"")}</span></div>
          <em>Ver ejemplo y reglamento →</em>
        </div>
      </button>`;
    }).join("");
}

function homeAtmosphere(){
  return '<div class="ambient-layer" aria-hidden="true"><span class="orb orb-a"></span><span class="orb orb-b"></span><span class="orb orb-c"></span><i class="spark s1"></i><i class="spark s2"></i><i class="spark s3"></i><i class="spark s4"></i><i class="spark s5"></i></div>';
}

async function home(){
  stopPoll();clearSession();await loadConfig();
  app.innerHTML=homeAtmosphere()+`
  <header class="site-header">
    ${brand()}
    <nav class="desktop-nav">
      <a href="#tematicas">Temáticas</a>
      <a href="#modos">Modos</a>
      <a href="#como">Cómo funciona</a>
      <a href="#premium">Premium</a>
    </nav>
    <button class="header-cta" data-scroll="#crear">Empezar</button>
  </header>

  <main class="home-page">
    <section class="hero hero-premium">
      <div class="hero-copy reveal-up">
        <div class="eyebrow">CONVERSÁS · JUGÁS · DESCUBRÍS</div>
        <h1>Tus amigos<br><span class="grad">son el juego.</span></h1>
        <p class="lead">Cada grupo crea una experiencia distinta con sus propias historias, secretos, votaciones, desafíos y misiones.</p>
        <div class="hero-actions">
          <button class="primary hero-cta" data-scroll="#crear">Empezar a jugar <span>→</span></button>
          <button class="ghost hero-demo" data-scroll="#como">Ver cómo funciona</button>
        </div>
        <div class="hero-trust">
          <div class="avatar-stack"><span>D</span><span>S</span><span>M</span><span>N</span></div>
          <div><strong>Sin descargas ni cuentas para invitados</strong><small>Entrás desde cualquier celular con un código.</small></div>
        </div>
      </div>
      <div class="hero-visual reveal-scale" aria-hidden="true">
        <div class="hero-halo"></div>
        <img class="hero-people hero-scene" src="/assets/hero-juntada-premium.webp?v=20260920-exact" alt="">
        <img class="hero-sparks" src="/assets/gold-sparks.svg?v=20260920-restored" alt="">
        <div class="floating-question fq-one"><span>¿QUIÉN FUE?</span><strong>“Me bajé en la ciudad equivocada.”</strong></div>
        <div class="floating-phone fp-one"><span class="phone-notch"></span><small>TU VOTO</small><strong>SOFI</strong><i>✓</i></div>
        <div class="floating-phone fp-two"><span class="phone-notch"></span><small>7/9</small><strong>VOTARON</strong><i>●</i></div>
      </div>
    </section>

    <section id="tematicas" class="home-section themes-section reveal-section">
      <div class="section-head">
        <div><div class="kicker">ELEGÍ EL MOOD</div><h2>Una juntada distinta cada vez.</h2></div>
        <p>Cada temática cambia el tono, las consignas y la energía del juego.</p>
      </div>
      <div class="themes compact-themes">${themeCards()}</div>
    </section>

    <section id="modos" class="home-section modes-section reveal-section">
      <div class="section-head">
        <div><div class="kicker">MODOS DE JUEGO</div><h2>No es un quiz. Son juegos distintos.</h2></div>
        <p>Adiviná, engañá, leé al grupo, cumplí misiones y acumulá puntos de formas diferentes.</p>
      </div>
      <div class="mode-showcase">${modeShowcase()}</div>
      <div class="game-size-strip">
        <div><strong>Hasta 25</strong><span>rondas personalizadas</span></div>
        <i></i>
        <div><strong>7 modos + misiones</strong><span>se mezclan según la temática</span></div>
        <i></i>
        <div><strong>1 ronda gratis</strong><span>probás antes de desbloquear</span></div>
        <i></i>
        <div><strong>Puntos automáticos</strong><span>nadie ve el ranking hasta el final</span></div>
      </div>
    </section>

    <section id="como" class="home-section how-section reveal-section">
      <div class="how-copy">
        <div class="kicker">ASÍ SE JUEGA</div>
        <h2>La pantalla muestra.<br>Los celulares deciden.</h2>
        <p>Podés usar una notebook o TV como centro de la juntada y cada persona vota desde su teléfono. Si no hay pantalla compartida, funciona igual desde todos los celulares.</p>
        <div class="how-steps">
          <div class="how-step active" data-step="1"><span>01</span><div><strong>Creás la sala</strong><small>Compartís QR, link o código.</small></div></div>
          <div class="how-step" data-step="2"><span>02</span><div><strong>Todos responden en secreto</strong><small>Ni el host ve las respuestas.</small></div></div>
          <div class="how-step" data-step="3"><span>03</span><div><strong>La Juntada arma el juego</strong><small>Genera rondas sobre ese grupo.</small></div></div>
          <div class="how-step" data-step="4"><span>04</span><div><strong>Votan y suman</strong><small>Los puntos se calculan solos.</small></div></div>
        </div>
      </div>
      <div class="party-demo" id="partyDemo" aria-hidden="true">
        <div class="demo-screen">
          <div class="demo-top"><span>LA JUNTADA</span><small id="demoCount">1 / 4</small></div>
          <div class="demo-badge" id="demoBadge">¿QUIÉN FUE?</div>
          <div class="demo-question" id="demoQuestion">Creá la sala y compartí el código.</div>
          <div class="demo-progress"><i id="demoProgress"></i></div>
        </div>
        <div class="demo-phones">
          <div class="demo-phone p1"><span></span><strong>SOFI</strong><small>LISTA</small></div>
          <div class="demo-phone p2"><span></span><strong>NICO</strong><small>LISTO</small></div>
          <div class="demo-phone p3"><span></span><strong>MICA</strong><small>LISTA</small></div>
        </div>
      </div>
    </section>

    <section id="crear" class="home-section create-section reveal-section">
      <div class="create-intro">
        <div class="kicker">CREÁ TU JUNTADA</div>
        <h2>¿Juegan ahora o la preparan antes?</h2>
        <p>Podés armarla en el momento o mandar el link durante la semana para llegar con todo listo.</p>
      </div>
      <div class="create-grid">
        <div class="create-main card premium-panel">
          <div class="choice-grid">
            <label class="choice-card"><input type="radio" name="when" value="now" checked><strong>⚡ Jugar ahora</strong><span>Están juntos. Entran, responden y arrancan.</span></label>
            <label class="choice-card"><input type="radio" name="when" value="later"><strong>📅 Preparar antes</strong><span>Mandás el link y cada uno responde cuando puede.</span></label>
          </div>
          <div id="dateWrap" class="date-wrap"><label>Fecha de la juntada</label><input id="eventDate" type="date"></div>
          <label class="field-label">Nombre de la juntada</label><input id="roomName" placeholder="Cumple de Sofi" maxlength="80">
          <label class="field-label">Tu nombre</label><input id="hostName" placeholder="Diego" maxlength="40">
          <button class="primary wide big-action" id="createBtn">Crear La Juntada <span>→</span></button>
        </div>
        <aside class="join-card card">
          <div class="join-icon">↗</div>
          <div class="kicker">YA TE INVITARON</div>
          <h3>Entrá con tu código</h3>
          <label class="field-label">Código</label><input id="joinCode" maxlength="6" placeholder="ABC123" style="text-transform:uppercase">
          <label class="field-label">Tu nombre</label><input id="joinName" maxlength="40" placeholder="Tu nombre">
          <button class="secondary wide" id="joinBtn">Entrar</button>
        </aside>
      </div>
    </section>

    <section id="premium" class="home-section premium-home premium-value reveal-section">
      <div class="premium-value-head">
        <div>
          <div class="kicker">QUÉ PAGÁS Y QUÉ RECIBÍS</div>
          <h2>Probala gratis. Pagá solo si quieren seguir.</h2>
          <p>La primera ronda personalizada es gratis. Después elegís desbloquear esa juntada o tener acceso ilimitado. No hace falta que cada invitado compre nada.</p>
        </div>
        <div class="premium-big-number"><strong>25</strong><span>rondas máximas<br>por partida completa</span></div>
      </div>

      <div class="value-compare">
        <article class="value-plan free-plan">
          <div class="plan-label">GRATIS</div>
          <h3>Probá La Juntada</h3>
          <strong class="plan-main">1 ronda personalizada</strong>
          <ul>
            <li>El grupo responde de verdad</li>
            <li>Todos votan desde el celular</li>
            <li>Se calculan puntos reales</li>
            <li>Ves cómo funciona antes de pagar</li>
          </ul>
          <button class="ghost" data-scroll="#crear">Probar gratis</button>
        </article>

        <article class="value-plan paid-plan">
          <div class="plan-label">PARTIDA COMPLETA</div>
          <h3>Una Juntada</h3>
          <strong class="plan-main">Hasta 25 rondas</strong>
          <ul>
            <li>Todos los modos disponibles para esa temática</li>
            <li>Ranking final y respuestas desbloqueadas</li>
            <li>Misiones secretas cuando el pack las incluye</li>
            <li>Ideal si quieren pagar entre todo el grupo una sola vez</li>
          </ul>
          <button class="secondary" data-scroll="#crear">Crear partida</button>
        </article>

        <article class="value-plan unlimited-plan">
          <div class="plan-label">ILIMITADO</div>
          <h3>Mensual · Anual · De por vida</h3>
          <strong class="plan-main">Todas las partidas que quieras</strong>
          <ul>
            <li>Creás nuevas juntadas sin pagar cada juego</li>
            <li>Acceso a packs y temáticas Premium</li>
            <li>Las temáticas +18 quedan dentro de Premium</li>
            <li>Una sola cuenta puede organizar para todo el grupo</li>
          </ul>
          <button class="primary" data-scroll="#crear">Empezar</button>
        </article>
      </div>

      <div class="premium-clarity">
        <span>✦</span>
        <p><strong>¿De dónde salen las rondas?</strong> Del contenido que cargan ustedes y de las consignas del pack elegido. La cantidad final depende de la temática, los modos disponibles y cuántos jugadores haya.</p>
      </div>
    </section>
  </main>

  <label class="age-check" id="ageWrap"><input id="ageConfirmed" type="checkbox"> Confirmo que todos los participantes son mayores de 18 años.</label>
  `;

  const refreshExtras=()=>{
    const when=document.querySelector('input[name="when"]:checked')?.value||"now";
    document.querySelector("#dateWrap")?.classList.toggle("show",when==="later");
    const themeId=document.querySelector('input[name="theme"]:checked')?.value||"clasico";
    const theme=state.config.themes.find(t=>t.id===themeId);
    document.querySelector("#ageWrap")?.classList.toggle("show",!!theme?.age18);
  };
  document.querySelectorAll('input[name="when"],input[name="theme"]').forEach(x=>x.onchange=refreshExtras);
  refreshExtras();
  document.querySelector("#createBtn").onclick=createRoom;
  document.querySelector("#joinBtn").onclick=joinRoom;
  document.querySelectorAll("[data-scroll]").forEach(b=>b.onclick=()=>document.querySelector(b.dataset.scroll)?.scrollIntoView({behavior:"smooth",block:"start"}));
  document.querySelectorAll("[data-rule]").forEach(b=>b.onclick=()=>openRules(b.dataset.rule));
  initHomeMotion();
  if(location.hash.startsWith("#reglas="))openRules(location.hash.split("=")[1]);
}

function initHomeMotion(){
  const sections=[...document.querySelectorAll(".reveal-section")];
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add("in-view")}),{threshold:.12});
  sections.forEach(s=>io.observe(s));

  const steps=[...document.querySelectorAll(".how-step")];
  const badge=document.querySelector("#demoBadge"),q=document.querySelector("#demoQuestion"),count=document.querySelector("#demoCount"),bar=document.querySelector("#demoProgress");
  const demo=[
    ["CREÁ LA SALA","Compartí QR, link o código con el grupo."],
    ["RESPUESTAS SECRETAS","Todos aportan historias sin mostrárselas a nadie."],
    ["JUEGO PERSONALIZADO","El sistema mezcla el contenido y crea las rondas."],
    ["VOTEN DESDE EL CELULAR","Los puntos se calculan solos y el resultado queda sellado."]
  ];
  let i=0;
  const paint=()=>{steps.forEach((s,n)=>s.classList.toggle("active",n===i));if(badge)badge.textContent=demo[i][0];if(q)q.textContent=demo[i][1];if(count)count.textContent=(i+1)+" / 4";if(bar){bar.style.transition="none";bar.style.width="0";requestAnimationFrame(()=>{bar.style.transition="width 3.5s linear";bar.style.width="100%"})}};
  paint();
  window.__homeDemoTimer=setInterval(()=>{i=(i+1)%demo.length;paint()},3800);

  const hero=document.querySelector(".hero-visual");
  if(hero&&matchMedia("(pointer:fine)").matches){
    hero.addEventListener("pointermove",e=>{
      const r=hero.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
      hero.style.setProperty("--mx",x.toFixed(3));hero.style.setProperty("--my",y.toFixed(3));
    });
    hero.addEventListener("pointerleave",()=>{hero.style.setProperty("--mx",0);hero.style.setProperty("--my",0)});
  }
}
async function createRoom(){try{const d=await api("/api/rooms",{method:"POST",body:JSON.stringify({name:document.querySelector("#roomName").value,hostName:document.querySelector("#hostName").value,themeId:document.querySelector('input[name="theme"]:checked').value,playWhen:document.querySelector('input[name="when"]:checked').value,eventDate:document.querySelector("#eventDate").value,ageConfirmed:document.querySelector("#ageConfirmed").checked})});saveSession(d.code,d.sessionToken);startPoll()}catch(e){toast(e.message)}}
async function joinRoom(){try{const c=document.querySelector("#joinCode").value.trim().toUpperCase();state.code=c;const d=await api("/api/rooms/"+c+"/join",{method:"POST",body:JSON.stringify({name:document.querySelector("#joinName").value})});saveSession(d.code,d.sessionToken);if(d.lateJoin)toast("Entraste a una partida en curso");startPoll()}catch(e){toast(e.message)}}
async function refresh(){if(!state.code)return;try{const r=await api("/api/rooms/"+state.code);state.room=r;const k=JSON.stringify(r);if(k!==state.lastKey){state.lastKey=k;renderRoom()}}catch(e){if(/inexistente|Sesión/.test(e.message)){home();toast(e.message)}}}

function chips(r){return r.players.map(p=>`<span class="chip ${p.ready?"ready":""}"><span class="dot"></span>${esc(p.name)}${p.id===r.me?.id?" · vos":""}${p.isHost?" · host":""}</span>`).join("")}
function roomHeader(r){return `<div class="room-header"><div class="room-title-wrap">${assetImg("theme",r.themeId,"room-theme-art")}<div><div class="kicker">${esc(r.theme.title)}</div><div class="room-title">${esc(r.name)}</div></div></div><div class="room-meta"><span class="pill">${r.players.length} jugadores</span><span class="room-code-mini">${r.code}</span></div></div>`}
function hostRoster(r){
  if(!r.isHost)return "";
  return `<section class="card soft host-roster" style="margin-top:14px"><div class="statusbar"><div><div class="kicker">ADMINISTRAR GRUPO</div><div class="section-title">Jugadores</div></div><button class="ghost small-btn" id="copyInvite">+ Invitar</button></div>
  <p class="muted tiny">Podés sumar gente con el mismo link en cualquier momento. Si eliminás a alguien, sus respuestas y votos desaparecen del juego.</p>
  <div class="roster-list">${r.players.map(p=>`<div class="roster-row"><div><strong>${esc(p.name)}</strong><small>${p.isHost?"Host":p.ready?"Listo":"Falta responder"}</small></div>${p.isHost?"":`<button class="danger-btn remove-player" data-id="${p.id}" data-name="${esc(p.name)}">Quitar</button>`}</div>`).join("")}</div>
  <div class="qr-panel" id="hostQr"><img class="qr-image" src="/api/qr/${r.code}"><div class="qr-code-label">${r.code}</div></div><button class="ghost wide" id="toggleHostQr" style="margin-top:10px">Mostrar QR para sumar gente</button></section>`;
}
function bindHostRoster(r){
  if(!r.isHost)return;
  const copy=document.querySelector("#copyInvite");if(copy)copy.onclick=async()=>{const u=location.origin+"?code="+r.code;try{await navigator.clipboard.writeText(u);toast("Link de invitación copiado")}catch{prompt("Copiá:",u)}};
  const qr=document.querySelector("#toggleHostQr");if(qr)qr.onclick=()=>{document.querySelector("#hostQr").classList.toggle("open")};
  document.querySelectorAll(".remove-player").forEach(b=>b.onclick=async()=>{if(!confirm("Quitar a "+b.dataset.name+"? También se eliminan sus respuestas y votos."))return;try{await api("/api/rooms/"+r.code+"/players/"+b.dataset.id,{method:"DELETE"});toast("Jugador eliminado");refresh()}catch(e){toast(e.message)}})
}

function lobby(r){
  const ready=r.players.filter(p=>p.ready).length;
  app.innerHTML=`<div class="room-page lobby-page">
    ${brand()}
    <div class="room-atmosphere">${assetImg("theme",r.themeId,"room-watermark")}</div>
    <section class="card lobby-main">
      ${roomHeader(r)}
      <div class="lobby-code-zone">
        <div class="code-orbit"><i></i><i></i><i></i><div class="code">${r.code}</div></div>
        <div class="share">Que entren con este código, link o QR. Podés sumar gente incluso después.</div>
        <div class="actions invite-actions">
          <button class="secondary" id="copyLink">Copiar link</button>
          <button class="ghost" id="copyCode">Copiar código</button>
          <button class="ghost" id="showQr">Mostrar QR</button>
        </div>
        <div class="qr-panel" id="qrPanel"><img class="qr-image" src="/api/qr/${r.code}"><div class="qr-code-label">${r.code}</div></div>
      </div>
      <div class="lobby-status">
        <div><span class="live-dot"></span><strong>${r.players.length} conectados</strong></div>
        <small>${ready} ya prepararon respuestas</small>
      </div>
      <div class="players animated-players">${chips(r)}</div>
      ${r.isHost?'<button class="primary wide lobby-start" id="startCollect">Empezar preparación <span>→</span></button>':'<div class="waiting-host"><span class="waiting-pulse"></span>Esperando al host…</div>'}
    </section>
    ${hostRoster(r)}
  </div>`;
  if(r.isHost)document.querySelector("#startCollect").onclick=async()=>{try{await api("/api/rooms/"+r.code+"/start-collecting",{method:"POST"});refresh()}catch(e){toast(e.message)}};
  document.querySelector("#copyLink").onclick=async()=>{const u=location.origin+"?code="+r.code;try{await navigator.clipboard.writeText(u);toast("Link copiado")}catch{prompt("Copiá:",u)}};
  document.querySelector("#copyCode").onclick=async()=>{try{await navigator.clipboard.writeText(r.code);toast("Código copiado")}catch{}};
  document.querySelector("#showQr").onclick=()=>document.querySelector("#qrPanel").classList.toggle("open");
  bindHostRoster(r);
}
function collecting(r){
  const readyCount=r.players.filter(p=>p.ready).length;
  const pct=Math.round((readyCount/Math.max(1,r.players.length))*100);
  if(r.me?.ready){
    app.innerHTML=`<div class="room-page prep-ready-page">
      ${brand()}
      <section class="card prep-ready-card">
        ${roomHeader(r)}
        <div class="sealed-visual"><img src="/assets/premium-lock.svg" alt=""><span></span></div>
        <div class="kicker">RESPUESTAS SELLADAS</div>
        <h2>Tus respuestas ya están adentro.</h2>
        <p class="muted">${r.playWhen==="later"?"Podés cerrar la página y volver el día de la juntada. Nadie puede leerlas antes de jugar.":"Esperando al resto. Nadie puede leer las respuestas antes del final."}</p>
        <div class="ready-meter"><div><i style="width:${pct}%"></i></div><span>${readyCount}/${r.players.length} listos</span></div>
        <div class="players animated-players">${chips(r)}</div>
        ${r.isHost?'<button class="primary wide lobby-start" id="startGame" '+(r.players.length<3||r.players.some(p=>!p.ready)?"disabled":"")+'>Armar y empezar la partida <span>→</span></button>':""}
      </section>
      ${hostRoster(r)}
    </div>`;
    if(r.isHost&&document.querySelector("#startGame"))document.querySelector("#startGame").onclick=async()=>{try{await api("/api/rooms/"+r.code+"/start-game",{method:"POST"});refresh()}catch(e){toast(e.message)}};
    bindHostRoster(r);return;
  }

  const opts=r.players.map(p=>`<option value="${p.id}">${esc(p.name)}${p.id===r.me?.id?" (vos)":""}</option>`).join("");
  app.innerHTML=`<div class="room-page prep-page">
    ${brand()}
    <section class="card prep-card">
      ${roomHeader(r)}
      <div class="prep-hero">
        <div><div class="kicker">PREPARACIÓN SECRETA</div><h2>Esto después se convierte en el juego.</h2><p>Respondé sin pensar demasiado. Ni el host puede abrir tus respuestas.</p></div>
        <div class="secret-orb"><span>SECRETO</span><i></i></div>
      </div>

      <div class="prep-block">
        <div class="prep-block-head"><span>01</span><div><strong>Tus historias</strong><small>Material para ¿Quién fue?</small></div></div>
        ${r.prepPrompts.storyPrompts.map((q,i)=>`<label>${esc(q)}</label><textarea id="story${i}" placeholder="Algo concreto, corto y reconocible…"></textarea>`).join("")}
      </div>

      <div class="prep-block">
        <div class="prep-block-head"><span>02</span><div><strong>Verdad o mentira</strong><small>Una real, una inventada.</small></div></div>
        <label>Una verdad sorprendente sobre vos</label><textarea id="truth"></textarea>
        <label>Una mentira creíble sobre vos</label><textarea id="lie"></textarea>
      </div>

      <div class="prep-block">
        <div class="prep-block-head"><span>03</span><div><strong>Leé al grupo</strong><small>Votá sin que nadie vea.</small></div></div>
        ${r.prepPrompts.majorityPrompts.map((q,i)=>`<label>${esc(q)}</label><select id="maj${i}"><option value="">Elegí a alguien…</option>${opts}</select>`).join("")}
      </div>

      <div class="prep-two">
        <div class="prep-block compact"><div class="prep-block-head"><span>04</span><div><strong>Silla Caliente</strong></div></div><label>${esc(r.prepPrompts.hotSeatPrompt)}</label><input id="hotSeat" placeholder="Tu respuesta corta"></div>
        <div class="prep-block compact"><div class="prep-block-head"><span>05</span><div><strong>Todos contra uno</strong></div></div><label>${esc(r.prepPrompts.oneVsAllPrompt)}</label><input id="oneVsAll" placeholder="Tu respuesta corta"></div>
      </div>
      <button class="primary wide big-action seal-button" id="submitPrep">Sellar mis respuestas <span>✦</span></button>
    </section>
    ${hostRoster(r)}
  </div>`;

  document.querySelector("#submitPrep").onclick=async()=>{try{
    const body={stories:[document.querySelector("#story0").value,document.querySelector("#story1").value,document.querySelector("#story2").value],truth:document.querySelector("#truth").value,lie:document.querySelector("#lie").value,majority:[document.querySelector("#maj0").value,document.querySelector("#maj1").value,document.querySelector("#maj2").value],hotSeatAnswer:document.querySelector("#hotSeat").value,oneVsAllAnswer:document.querySelector("#oneVsAll").value};
    await api("/api/rooms/"+r.code+"/submissions",{method:"POST",body:JSON.stringify(body)});refresh()
  }catch(e){toast(e.message)}};
  bindHostRoster(r);
}
function playing(r){
  const x=r.round;if(!x)return;
  const locked=x.locked||r.roundPhase==="locked";
  app.innerHTML=brand()+`<div class="statusbar"><div><div class="kicker">${x.modeEmoji} ${esc(x.modeTitle)}</div><div class="tiny muted">${esc(r.theme.title)} · Ronda ${r.currentRound+1}/${r.totalRounds}</div></div><span class="pill">${x.voteCount}/${x.eligibleVoters} votos</span></div>
  <section class="card prompt-card"><div class="tiny muted">${esc(x.prompt)}</div><div class="statement">“${esc(x.statement)}”</div>
  ${locked?'<div class="locked-round"><div class="big-num">✓</div><strong>Votos cerrados</strong><span>Los puntos ya fueron calculados en secreto. La respuesta se revela al terminar La Juntada.</span></div>':x.skipVote?'<div class="example-box"><strong>Esta ronda habla de vos.</strong><small>No votás. El resto está intentando adivinarte.</small></div>':`<div class="options">${(x.options||[]).map(o=>`<button class="option ${x.ownVote===o.id?"selected":""}" data-choice="${esc(o.id)}">${esc(o.label)}</button>`).join("")}</div><div class="vote-count">${x.ownVote?"Tu voto quedó guardado. Podés cambiarlo hasta que cierre la ronda.":"Tocá una opción para votar."}</div>`}
  </section>
  ${r.mission?`<section class="card soft" style="margin-top:14px"><div class="kicker">💣 TU MISIÓN SECRETA</div><div class="section-title">${esc(r.mission.text)}</div></section>`:""}
  <section class="card soft hidden-score" style="margin-top:14px"><div class="kicker">🏆 PUNTAJE SELLADO</div><div class="section-title">Nadie sabe quién va ganando.</div><div class="muted">El ranking y todas las respuestas se revelan juntos al final.</div></section>
  ${hostRoster(r)}`;
  if(!locked&&!x.skipVote)document.querySelectorAll(".option").forEach(b=>b.onclick=async()=>{try{await api("/api/rooms/"+r.code+"/vote",{method:"POST",body:JSON.stringify({choice:b.dataset.choice})});refresh()}catch(e){toast(e.message)}});
  bindHostRoster(r);
}
function paywall(r){
  const plans=state.config.accessPlans||[];
  app.innerHTML=`<div class="room-page paywall-page">
    ${brand()}
    <section class="card center paywall premium-paywall">
      <div class="paywall-visual"><span class="paywall-halo"></span><img src="/assets/premium-lock.svg" alt=""></div>
      <div class="kicker">PRIMERA RONDA COMPLETA</div>
      <h2>Esto recién empieza.</h2>
      <p class="lead">Los puntos quedaron sellados. Tu grupo creó <strong>${Math.max(0,r.totalRounds-1)} rondas más</strong> sobre ustedes.</p>
      <div class="paywall-modes">${r.availableModes.slice(0,6).map(m=>`<span>${assetImg("mode",m.id,"paywall-mode-icon")}<b>${esc(m.title)}</b></span>`).join("")}</div>
      <div class="access-plans">${plans.map((p,i)=>`<label class="access-plan"><input type="radio" name="accessPlan" value="${p.id}" ${i===1?"checked":""}><div><strong>${esc(p.title)}</strong><span>${esc(p.description)}</span></div>${p.unlimited?'<em>ILIMITADO</em>':""}</label>`).join("")}</div>
      <div class="group-note"><strong>Compren entre amigos si quieren</strong><span>Una cuenta compra el pase y desde esa cuenta pueden crear todas las partidas incluidas en el plan. Los invitados nunca pagan.</span></div>
      ${r.isHost?'<button class="primary wide big-action" id="unlockTest">Probar el plan seleccionado <span>→</span></button><div class="tiny muted paywall-dev">Modo desarrollo: todavía no realiza cobros reales.</div>':'<div class="waiting-host"><span class="waiting-pulse"></span>Esperando que el host desbloquee La Juntada…</div>'}
    </section>
    ${hostRoster(r)}
  </div>`;
  if(r.isHost)document.querySelector("#unlockTest").onclick=async()=>{try{const accessPlan=document.querySelector('input[name="accessPlan"]:checked')?.value||"single";await api("/api/rooms/"+r.code+"/unlock-test",{method:"POST",body:JSON.stringify({accessPlan})});refresh()}catch(e){toast(e.message)}};
  bindHostRoster(r);
}
function scoreRows(ps){return[...ps].sort((a,b)=>(b.score||0)-(a.score||0)).map((p,i)=>`<div class="score-row"><div class="rank">#${i+1}</div><div class="score-name">${esc(p.name)}</div><div class="score">${p.score||0}</div></div>`).join("")}
function answersArchive(r){
  if(!r.answers)return "";
  return `<section class="card answers-archive" style="margin-top:14px"><div class="kicker">🔓 RESPUESTAS DESBLOQUEADAS</div><div class="section-title">Ahora sí: todo lo que escribió el grupo</div><p class="muted">Hasta este momento estas respuestas nunca estuvieron disponibles para nadie.</p>
  ${r.answers.map(a=>`<details><summary>${esc(a.name)}</summary><div class="answer-body">
    ${a.stories.map(s=>`<div class="answer-item"><small>${esc(s.prompt)}</small><strong>${esc(s.answer)}</strong></div>`).join("")}
    <div class="answer-item"><small>Verdad</small><strong>${esc(a.truth)}</strong></div>
    <div class="answer-item"><small>Mentira</small><strong>${esc(a.lie)}</strong></div>
    <div class="answer-item"><small>${esc(a.hotSeat.prompt)}</small><strong>${esc(a.hotSeat.answer)}</strong></div>
    <div class="answer-item"><small>${esc(a.oneVsAll.prompt)}</small><strong>${esc(a.oneVsAll.answer)}</strong></div>
    ${a.majority.map(m=>`<div class="answer-item"><small>${esc(m.prompt)}</small><strong>${esc(m.answer)}</strong></div>`).join("")}
  </div></details>`).join("")}</section>`;
}
function finished(r){
  const s=[...r.players].sort((a,b)=>(b.score||0)-(a.score||0));
  const top=s.slice(0,3);
  app.innerHTML=`<div class="room-page finished-page">
    ${brand()}
    <section class="finish-hero">
      <div class="confetti-field" aria-hidden="true">${Array.from({length:18},(_,i)=>`<i style="--i:${i}"></i>`).join("")}</div>
      <div class="kicker">FIN DE LA JUNTADA</div>
      <h1><span class="grad">${esc(s[0]?.name||"")}</span><br>se la llevó.</h1>
      <p>Ahora sí: ranking, puntos y respuestas desbloqueadas.</p>
    </section>
    <section class="podium">
      ${top.map((p,i)=>`<div class="podium-person place-${i+1}"><span class="podium-medal">${i===0?"✦":i===1?"II":"III"}</span><strong>${esc(p.name)}</strong><b>${p.score||0}</b><small>puntos</small><i></i></div>`).join("")}
    </section>
    <section class="card final-ranking"><div class="kicker">RANKING COMPLETO</div><div class="score-list">${scoreRows(r.players)}</div>${r.isHost?'<button class="primary wide big-action" id="restart">Preparar otra partida <span>→</span></button>':""}</section>
    ${answersArchive(r)}
  </div>`;
  if(r.isHost)document.querySelector("#restart").onclick=async()=>{try{await api("/api/rooms/"+r.code+"/restart",{method:"POST"});refresh()}catch(e){toast(e.message)}}
}
function renderRoom(){const r=state.room;if(!r)return;if(r.state==="lobby")lobby(r);else if(r.state==="collecting")collecting(r);else if(r.state==="playing")playing(r);else if(r.state==="paywall")paywall(r);else finished(r)}
(async()=>{await loadConfig();const q=new URLSearchParams(location.search).get("code"),c=localStorage.getItem("ln_code"),t=localStorage.getItem("ln_token");if(c&&t){state.code=c;state.token=t;startPoll()}else{await home();if(q)document.querySelector("#joinCode").value=q}})();
