const app=document.querySelector("#app"),toastEl=document.querySelector("#toast");
const state={code:null,token:null,room:null,poll:null,lastKey:"",config:null,access:null};
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
function accessToken(){return localStorage.getItem("lj_access_token")||""}
function saveAccessToken(t){if(t)localStorage.setItem("lj_access_token",t);else localStorage.removeItem("lj_access_token")}
function hasReusableAccess(){return !!state.access?.active&&(state.access.role==="admin"||["day","monthly","annual","lifetime"].includes(state.access.plan))}
function accessLabel(){
  if(!state.access?.active)return "Mi acceso";
  if(state.access.role==="admin")return "ADMIN · Todo desbloqueado";
  return state.access.plan==="lifetime"?"Premium activo":(state.access.title||"Premium activo");
}
async function api(url,o={}){
  const h={"Content-Type":"application/json",...(o.headers||{})};
  if(state.token)h.Authorization="Bearer "+state.token;
  const pass=accessToken();if(pass)h["X-La-Juntada-Access"]=pass;
  const r=await fetch(url,{...o,headers:h,cache:"no-store"});const d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(d.error||"Algo salió mal");return d
}
async function loadAccess(){
  const pass=accessToken();
  if(!pass){state.access={active:false};return state.access}
  try{state.access=await api("/api/access/me");if(!state.access.active&&state.access.expired)saveAccessToken("")}
  catch{state.access={active:false}}
  return state.access;
}

function customPackStorageKey(){
  const owner=state.access?.accessId||"device";
  return "lj_custom_packs_"+owner;
}
function getCustomPacks(){
  if(!hasReusableAccess())return [];
  try{
    const v=JSON.parse(localStorage.getItem(customPackStorageKey())||"[]");
    return Array.isArray(v)?v:[];
  }catch{return []}
}
function saveCustomPacks(packs){
  localStorage.setItem(customPackStorageKey(),JSON.stringify(packs));
}

async function syncCustomPacks(){
  if(!hasReusableAccess())return getCustomPacks();
  const local=getCustomPacks();
  try{
    const d=await api("/api/custom-packs/sync",{method:"POST",body:JSON.stringify({packs:local})});
    const remote=Array.isArray(d.packs)?d.packs:[];
    const merged=new Map();
    [...local,...remote].forEach(p=>{
      const prev=merged.get(p.id);
      if(!prev||(p.updatedAt||0)>=(prev.updatedAt||0))merged.set(p.id,p);
    });
    const packs=[...merged.values()].sort((x,y)=>(y.updatedAt||0)-(x.updatedAt||0));
    saveCustomPacks(packs);
    return packs;
  }catch{return local}
}
function selectedCustomPack(){
  const id=localStorage.getItem("lj_selected_pack_id")||"";
  return getCustomPacks().find(p=>p.id===id)||null;
}
function linesToList(v,max=40){
  return String(v||"").split(/\n+/).map(x=>x.trim()).filter(Boolean).slice(0,max);
}
function listToLines(v){return Array.isArray(v)?v.join("\n"):""}
function parseDuoLines(v){
  return linesToList(v,30).map(line=>{
    const [question,a,b]=line.split("|").map(x=>x?.trim());
    return {question,a,b};
  }).filter(x=>x.question&&x.a&&x.b);
}
function duoToLines(v){
  return Array.isArray(v)?v.map(x=>[x.question,x.a,x.b].filter(Boolean).join(" | ")).join("\n"):"";
}
function customPackSelectorHtml(){
  if(!hasReusableAccess()){
    return `<div class="custom-pack-locked">
      <div><small>PERSONALIZACIÓN PREMIUM</small><strong>Usá tus propias consignas.</strong><span>Disponible con Premium para siempre o ADMIN.</span></div>
      <button type="button" class="ghost" id="unlockCustomStudio">Desbloquear Premium · ${esc(formatArs(premiumPrice()))}</button>
    </div>`;
  }
  const packs=getCustomPacks(),selected=selectedCustomPack();
  return `<div class="custom-pack-select">
    <div class="custom-pack-select-head">
      <div><small>PACK PERSONALIZADO</small><strong>${selected?esc(selected.name):"Contenido oficial"}</strong></div>
      <button type="button" class="ghost small-btn" id="newCustomPack">+ Crear pack</button>
    </div>
    <select id="customPackSelect">
      <option value="">Sin pack · usar contenido oficial</option>
      ${packs.map(p=>`<option value="${esc(p.id)}" ${selected?.id===p.id?"selected":""}>${esc(p.name)} · ${p.mixMode==="custom_first"?"prioriza lo tuyo":"mezcla"}</option>`).join("")}
    </select>
    <div class="custom-pack-select-actions">
      <span>${selected?"Se usará junto con la temática elegida.":"Podés crear uno para cumpleaños, viajes, grupos de amigos, trabajo, etc."}</span>
      ${selected?'<button type="button" class="theme-details" id="editSelectedPack">Editar pack →</button>':""}
    </div>
  </div>`;
}
function closeCustomStudio(){
  document.querySelector(".custom-studio-overlay")?.remove();
  document.body.classList.remove("rules-open");
}
function openCustomStudio(packId=null){
  if(!hasReusableAccess()){openAccessPanel();return}
  const packs=getCustomPacks();
  const existing=packs.find(p=>p.id===packId)||null;
  const p=existing||{
    id:(crypto?.randomUUID?.()||("pack_"+Date.now())),
    name:"",
    description:"",
    mixMode:"mixed",
    content:{prep_story:[],majority:[],hot_seat:[],one_vs_all:[],rank:[],missions:[],duo:[]}
  };
  const c=p.content||{};
  document.querySelector(".custom-studio-overlay")?.remove();
  document.body.insertAdjacentHTML("beforeend",`
    <div class="custom-studio-overlay" role="dialog" aria-modal="true" aria-label="Personalizar La Juntada">
      <button class="custom-studio-backdrop" data-close-studio aria-label="Cerrar"></button>
      <article class="custom-studio-sheet">
        <button class="rules-close" data-close-studio aria-label="Cerrar">×</button>
        <header class="custom-studio-head">
          <div class="studio-mark">✎</div>
          <div>
            <div class="kicker">ESTUDIO PREMIUM</div>
            <h2>${existing?"Editá tu pack":"Creá tu propia Juntada"}</h2>
            <p>Escribí cosas que solo tienen sentido para tu grupo. La Juntada las mezcla con las respuestas secretas y los modos del juego.</p>
          </div>
        </header>

        <div class="studio-basics">
          <div><label>Nombre del pack</label><input id="packName" maxlength="70" value="${esc(p.name)}" placeholder="Cumple de Sofi"></div>
          <div><label>Cómo usarlo</label><select id="packMixMode">
            <option value="mixed" ${p.mixMode==="mixed"?"selected":""}>Mezclar con La Juntada</option>
            <option value="custom_first" ${p.mixMode==="custom_first"?"selected":""}>Priorizar mis consignas</option>
          </select></div>
        </div>
        <label>Descripción opcional</label>
        <input id="packDescription" maxlength="180" value="${esc(p.description||"")}" placeholder="Para el grupo del viaje a Córdoba">

        <div class="studio-grid">
          <section class="studio-field">
            <div><span>¿QUIÉN FUE?</span><small>Una línea = una pregunta que después todos responden con una historia.</small></div>
            <textarea id="packStories" placeholder="Contá algo que hiciste y nunca confesaste al grupo.\n¿Cuál fue tu peor excusa para cancelar un plan?">${esc(listToLines(c.prep_story))}</textarea>
          </section>
          <section class="studio-field">
            <div><span>LEÉ AL GRUPO</span><small>Preguntas para votar a una persona del grupo.</small></div>
            <textarea id="packMajority" placeholder="¿Quién llegaría tarde a su propio casamiento?\n¿Quién sobreviviría mejor sin celular?">${esc(listToLines(c.majority))}</textarea>
          </section>
          <section class="studio-field">
            <div><span>SILLA CALIENTE</span><small>Preguntas personales cuya respuesta luego intentarán adivinar.</small></div>
            <textarea id="packHot" placeholder="¿Qué persona famosa invitarías a cenar?">${esc(listToLines(c.hot_seat))}</textarea>
          </section>
          <section class="studio-field">
            <div><span>TODOS CONTRA UNO</span><small>Consignas para intentar descifrar a una persona.</small></div>
            <textarea id="packOne" placeholder="Si pudieras desaparecer una semana, ¿a dónde irías?">${esc(listToLines(c.one_vs_all))}</textarea>
          </section>
          <section class="studio-field">
            <div><span>ORDENÁ AL GRUPO</span><small>Una consigna de ranking por línea.</small></div>
            <textarea id="packRank" placeholder="De más a menos probable que se pierda en un aeropuerto.">${esc(listToLines(c.rank))}</textarea>
          </section>
          <section class="studio-field">
            <div><span>MISIONES SECRETAS</span><small>Objetivos para cumplir durante la juntada.</small></div>
            <textarea id="packMissions" placeholder="Lográ que alguien diga “esto ya lo hablamos”.\nConseguí que alguien proponga pedir helado.">${esc(listToLines(c.missions))}</textarea>
          </section>
          <section class="studio-field studio-duo">
            <div><span>DÚO IMPOSIBLE</span><small>Formato: pregunta | opción A | opción B</small></div>
            <textarea id="packDuo" placeholder="¿Qué elegirían para un viaje? | Improvisar todo | Planear todo\n¿Noche ideal? | Salir | Quedarse en casa">${esc(duoToLines(c.duo))}</textarea>
          </section>
        </div>

        <div class="studio-preview-note"><span>✦</span><p>Si dejás un modo vacío, ese modo sigue usando el contenido oficial. Tus consignas nunca se muestran completas antes de jugar.</p></div>
        <footer class="studio-footer">
          ${existing?'<button type="button" class="danger-btn studio-delete" id="deletePack">Eliminar pack</button>':"<span></span>"}
          <div>
            <button type="button" class="ghost" data-close-studio>Cancelar</button>
            <button type="button" class="primary" id="savePack">Guardar pack</button>
          </div>
        </footer>
      </article>
    </div>`);
  document.body.classList.add("rules-open");
  document.querySelectorAll("[data-close-studio]").forEach(b=>b.onclick=closeCustomStudio);
  document.querySelector("#savePack").onclick=()=>{
    const name=document.querySelector("#packName").value.trim();
    if(!name){toast("Poné un nombre al pack");return}
    const pack={
      id:p.id,name,description:document.querySelector("#packDescription").value.trim(),
      mixMode:document.querySelector("#packMixMode").value==="custom_first"?"custom_first":"mixed",
      content:{
        prep_story:linesToList(document.querySelector("#packStories").value),
        majority:linesToList(document.querySelector("#packMajority").value),
        hot_seat:linesToList(document.querySelector("#packHot").value),
        one_vs_all:linesToList(document.querySelector("#packOne").value),
        rank:linesToList(document.querySelector("#packRank").value),
        missions:linesToList(document.querySelector("#packMissions").value),
        duo:parseDuoLines(document.querySelector("#packDuo").value)
      },
      updatedAt:Date.now()
    };
    const next=getCustomPacks().filter(x=>x.id!==pack.id);next.unshift(pack);saveCustomPacks(next);
    syncCustomPacks();
    localStorage.setItem("lj_selected_pack_id",pack.id);
    closeCustomStudio();
    const holder=document.querySelector("#customPackHolder");if(holder)holder.innerHTML=customPackSelectorHtml();
    bindCustomPackControls();
    const shelf=document.querySelector("#customPackShelf");if(shelf)paintCustomPackShelf();
    toast("Pack guardado");
  };
  document.querySelector("#deletePack")?.addEventListener("click",()=>{
    if(!confirm("Eliminar este pack personalizado?"))return;
    saveCustomPacks(getCustomPacks().filter(x=>x.id!==p.id));
    api("/api/custom-packs/"+encodeURIComponent(p.id),{method:"DELETE"}).catch(()=>{});
    if(localStorage.getItem("lj_selected_pack_id")===p.id)localStorage.removeItem("lj_selected_pack_id");
    closeCustomStudio();
    const holder=document.querySelector("#customPackHolder");if(holder)holder.innerHTML=customPackSelectorHtml();
    bindCustomPackControls();paintCustomPackShelf();toast("Pack eliminado");
  });
}
function customPackShelfHtml(){
  if(!hasReusableAccess())return `
    <div class="custom-studio-locked">
      <div class="studio-lock-mark">◇</div>
      <div><strong>Personalización Premium</strong><p>Creá preguntas, rankings y misiones propias. Los invitados siguen entrando sin cuenta.</p></div>
      <button class="primary" id="studioAccessBtn">Desbloquear Premium</button>
    </div>`;
  const packs=getCustomPacks();
  return `
    <div class="custom-studio-toolbar">
      <div><strong>${packs.length?"Tus packs":"Todavía no creaste ningún pack"}</strong><span>${packs.length?"Elegí uno o armá otro.":"Empezá con preguntas que solo entiende tu grupo."}</span></div>
      <button class="primary" id="createCustomPack">+ Nuevo pack</button>
    </div>
    ${packs.length?`<div class="custom-pack-shelf">${packs.slice(0,6).map(p=>{
      const count=Object.values(p.content||{}).reduce((n,v)=>n+(Array.isArray(v)?v.length:0),0);
      return `<button type="button" class="saved-pack-card" data-pack-id="${esc(p.id)}">
        <span class="saved-pack-icon">✎</span>
        <small>${p.mixMode==="custom_first"?"PRIORIZA LO TUYO":"MEZCLA"}</small>
        <strong>${esc(p.name)}</strong>
        <p>${esc(p.description||"Pack personalizado")}</p>
        <b>${count} elementos propios</b>
        <em>Editar →</em>
      </button>`;
    }).join("")}</div>`:""}
  `;
}
function paintCustomPackShelf(){
  const el=document.querySelector("#customPackShelf");if(!el)return;
  el.innerHTML=customPackShelfHtml();
  document.querySelector("#studioAccessBtn")?.addEventListener("click",startPremiumCheckout);
  document.querySelector("#createCustomPack")?.addEventListener("click",()=>openCustomStudio());
  document.querySelectorAll("[data-pack-id]").forEach(b=>b.onclick=()=>openCustomStudio(b.dataset.packId));
}
function bindCustomPackControls(){
  document.querySelector("#unlockCustomStudio")?.addEventListener("click",startPremiumCheckout);
  document.querySelector("#newCustomPack")?.addEventListener("click",()=>openCustomStudio());
  document.querySelector("#editSelectedPack")?.addEventListener("click",()=>openCustomStudio(selectedCustomPack()?.id));
  document.querySelector("#customPackSelect")?.addEventListener("change",e=>{
    if(e.target.value)localStorage.setItem("lj_selected_pack_id",e.target.value);
    else localStorage.removeItem("lj_selected_pack_id");
    const holder=document.querySelector("#customPackHolder");if(holder)holder.innerHTML=customPackSelectorHtml();
    bindCustomPackControls();
  });
}

function gameSettingsHtml(){
  const themeId=document.querySelector('input[name="theme"]:checked')?.value||"clasico";
  const modeIds=state.config.themeModes?.[themeId]||[];
  const modeCards=modeIds.map(mid=>{
    const m=state.config.modes.find(x=>x.id===mid);if(!m)return "";
    return `<label class="game-mode-toggle">
      <input type="checkbox" data-mode-toggle="${mid}" checked>
      <span class="mode-toggle-box">${assetImg("mode",mid,"setting-mode-icon")}</span>
      <div><strong>${esc(m.title)}</strong><small>${mid==="mision_secreta"?"Puede durar toda la juntada.":"Incluido en la mezcla de rondas."}</small></div>
      <i></i>
    </label>`;
  }).join("");
  return `
    <details class="game-settings">
      <summary>
        <div><small>CONFIGURACIÓN DE PARTIDA</small><strong>15 rondas · todos los modos</strong></div>
        <span>Ajustar</span>
      </summary>
      <div class="game-settings-body">
        <div class="setting-block">
          <div class="setting-head"><strong>Duración</strong><span>Podés cambiarla sin afectar las respuestas.</span></div>
          <div class="length-options">
            <label><input type="radio" name="roundLimit" value="8"><div><b>Corta</b><small>8 rondas</small></div></label>
            <label><input type="radio" name="roundLimit" value="15" checked><div><b>Normal</b><small>15 rondas</small></div></label>
            <label><input type="radio" name="roundLimit" value="25"><div><b>Larga</b><small>Hasta 25 rondas</small></div></label>
          </div>
        </div>
        <div class="setting-block">
          <div class="setting-head"><strong>Modos incluidos</strong><span>Desactivá los que no quieran jugar hoy.</span></div>
          <div class="settings-mode-grid">${modeCards}</div>
        </div>
      </div>
    </details>`;
}
function paintGameSettings(){
  const holder=document.querySelector("#gameSettingsHolder");if(!holder)return;
  holder.innerHTML=gameSettingsHtml();bindGameSettings();
}
function bindGameSettings(){
  const details=document.querySelector(".game-settings");if(!details)return;
  const refresh=()=>{
    const limit=document.querySelector('input[name="roundLimit"]:checked')?.value||"15";
    const total=document.querySelectorAll("[data-mode-toggle]").length;
    const enabled=[...document.querySelectorAll("[data-mode-toggle]")].filter(x=>x.checked).length;
    const label=details.querySelector("summary strong");
    if(label)label.textContent=limit+" rondas · "+enabled+"/"+total+" modos";
  };
  document.querySelectorAll('input[name="roundLimit"],[data-mode-toggle]').forEach(x=>x.addEventListener("change",refresh));
  refresh();
}

function surpriseSetupHtml(){
  return `<div class="surprise-setup">
    <div class="surprise-choice-head">
      <div><small>TIPO DE JUNTADA</small><strong>¿Es una juntada normal o gira alrededor de alguien?</strong></div>
      <span class="free-mini">INCLUIDO</span>
    </div>
    <div class="surprise-choice-grid">
      <label class="surprise-choice">
        <input type="radio" name="partyKind" value="normal" checked>
        <span class="surprise-choice-icon">●</span>
        <div><strong>Juntada normal</strong><small>Todos preparan y juegan de la misma manera.</small></div>
      </label>
      <label class="surprise-choice">
        <input type="radio" name="partyKind" value="surprise">
        <span class="surprise-choice-icon">✦</span>
        <div><strong>Armala para alguien</strong><small>El grupo prepara una sorpresa y esa persona entra al final.</small></div>
      </label>
    </div>
    <div class="honoree-wrap" id="honoreeWrap">
      <label class="field-label">¿Para quién es?</label>
      <input id="honoreeName" maxlength="40" placeholder="Sofi">
      <div class="honoree-explainer">
        <span>1</span><p>Al grupo le mandás el link normal.</p>
        <span>2</span><p>Preparan recuerdos y respuestas sin que ${'<b id="honoreePreview">esa persona</b>'} vea nada.</p>
        <span>3</span><p>Cuando llegue el momento, le mandás un link sorpresa exclusivo.</p>
      </div>
    </div>
  </div>`;
}
function bindSurpriseSetup(){
  document.querySelector("#surpriseAccess")?.addEventListener("click",openAccessPanel);
  const wrap=document.querySelector("#honoreeWrap"),name=document.querySelector("#honoreeName"),preview=document.querySelector("#honoreePreview");
  const refresh=()=>{
    const on=document.querySelector('input[name="partyKind"]:checked')?.value==="surprise";
    wrap?.classList.toggle("show",on);
  };
  document.querySelectorAll('input[name="partyKind"]').forEach(x=>x.addEventListener("change",refresh));
  name?.addEventListener("input",()=>{if(preview)preview.textContent=name.value.trim()||"esa persona"});
  refresh();
}
function honoreeInviteUrl(r){
  if(!r?.surprise?.inviteKey)return "";
  return location.origin+"?code="+encodeURIComponent(r.code)+"&honoree="+encodeURIComponent(r.surprise.inviteKey);
}
function prepareHonoreeInviteUI(code,key){
  if(!code||!key)return;
  const card=document.querySelector(".improved-join");if(!card)return;
  const title=card.querySelector("h3"),p=card.querySelector("p"),name=document.querySelector("#joinName");
  if(title)title.textContent="Te prepararon algo.";
  if(p)p.textContent="Entrá desde este enlace. No vas a ver nada de lo que el grupo preparó antes de jugar.";
  if(name){name.value="";name.closest("label")?.classList.add("hidden");name.style.display="none";}
  const labels=[...card.querySelectorAll(".field-label")];if(labels[1])labels[1].style.display="none";
  const codeInput=document.querySelector("#joinCode");if(codeInput){codeInput.value=code;codeInput.readOnly=true}
  const btn=document.querySelector("#joinBtn");if(btn)btn.innerHTML='Entrar a mi sorpresa <span>✦</span>';
  card.classList.add("honoree-invite-card");
}
function formatAccessDate(ms){
  if(!ms)return "Sin vencimiento";
  try{return new Intl.DateTimeFormat("es-AR",{dateStyle:"medium",timeStyle:"short"}).format(new Date(ms))}catch{return new Date(ms).toLocaleString()}
}
function closeAccessPanel(){document.querySelector(".access-overlay")?.remove();document.body.classList.remove("rules-open")}
async function openAccessPanel(){
  await loadAccess();
  document.querySelector(".access-overlay")?.remove();
  const active=state.access?.active;
  const role=state.access?.role;
  const exp=state.access?.expiresAt;
  document.body.insertAdjacentHTML("beforeend",`
    <div class="access-overlay" role="dialog" aria-modal="true" aria-label="Mi acceso">
      <button class="access-backdrop" data-close-access aria-label="Cerrar"></button>
      <article class="access-sheet">
        <button class="rules-close" data-close-access aria-label="Cerrar">×</button>
        <div class="access-sheet-head">
          <div class="access-key-icon">${role==="admin"?"✦":"◇"}</div>
          <div><div class="kicker">MI ACCESO</div><h2>${active?esc(accessLabel()):"Jugá sin registrarte."}</h2>
          <p>${active
            ?(role==="admin"?"Acceso de propietario: todas las funciones quedan desbloqueadas.":"Premium queda guardado en este dispositivo y también podés recuperarlo en otro con tu clave.")
            :"La Juntada se juega gratis. Premium solo agrega Canceladísimos, Picante 18+ y la creación de partidas personalizadas."}</p></div>
        </div>

        ${active?`
          <div class="access-current ${role==="admin"?"is-admin":""}">
            <div><small>ESTADO</small><strong>Activo</strong></div>
            <div><small>TIPO</small><strong>${esc(state.access.title||state.access.plan)}</strong></div>
            <div><small>VENCE</small><strong>${esc(formatAccessDate(exp))}</strong></div>
          </div>
          <div class="access-actions">
            <button class="secondary" id="copyRecovery">Copiar clave de recuperación</button>
            <button class="ghost" id="forgetAccess">Quitar de este dispositivo</button>
          </div>
          <div class="access-security-note">La clave de recuperación funciona como una llave. Guardala en un lugar privado si querés usar el pase en otro dispositivo.</div>
          ${role==="admin"?`<div class="admin-payment-tools">
            <div><small>COBROS REALES</small><strong>Mercado Pago</strong><span>Precios, credenciales y webhook.</span></div>
            <button class="primary" id="openPaymentAdmin">Configurar cobros</button>
          </div>`:""}
        `:`
          <div class="access-restore">
            <div class="kicker">YA TENÉS PREMIUM</div>
            <label>Clave de recuperación</label>
            <textarea id="restoreAccessKey" placeholder="Pegá acá tu clave LJ1…"></textarea>
            <button class="secondary wide" id="restoreAccessBtn">Recuperar mi acceso</button>
          </div>
          <details class="owner-access">
            <summary>Acceso de propietario</summary>
            <div>
              <label>Código privado de administrador</label>
              <input id="adminAccessCode" type="password" autocomplete="off" placeholder="Código ADMIN">
              <button class="ghost wide" id="activateAdmin">Activar acceso ADMIN</button>
            </div>
          </details>
        `}
      </article>
    </div>`);
  document.body.classList.add("rules-open");
  document.querySelectorAll("[data-close-access]").forEach(b=>b.onclick=closeAccessPanel);
  document.querySelector("#copyRecovery")?.addEventListener("click",async()=>{
    try{await navigator.clipboard.writeText(accessToken());toast("Clave de recuperación copiada")}catch{prompt("Copiá tu clave:",accessToken())}
  });
  document.querySelector("#forgetAccess")?.addEventListener("click",async()=>{
    if(!confirm("Quitar Premium de este dispositivo? Si no guardaste la clave, después no vas a poder recuperarlo."))return;
    saveAccessToken("");state.access={active:false};closeAccessPanel();if(!state.code)await home();toast("Acceso quitado de este dispositivo");
  });
  document.querySelector("#restoreAccessBtn")?.addEventListener("click",async()=>{
    try{
      const key=document.querySelector("#restoreAccessKey").value.trim();
      const d=await api("/api/access/restore",{method:"POST",body:JSON.stringify({accessToken:key}),headers:{"X-La-Juntada-Access":""}});
      saveAccessToken(d.accessToken);state.access=d.access;closeAccessPanel();if(state.code&&state.room?.state==="paywall"&&state.room?.isHost){try{await api("/api/rooms/"+state.code+"/use-access",{method:"POST"});refresh()}catch{}}else if(!state.code)await home();
      toast("Premium recuperado");
    }catch(e){toast(e.message)}
  });
  document.querySelector("#activateAdmin")?.addEventListener("click",async()=>{
    try{
      const code=document.querySelector("#adminAccessCode").value;
      const d=await api("/api/access/admin",{method:"POST",body:JSON.stringify({code}),headers:{"X-La-Juntada-Access":""}});
      saveAccessToken(d.accessToken);state.access=d.access;closeAccessPanel();if(!state.code)await home();toast("ADMIN activado · todo desbloqueado")
    }catch(e){toast(e.message)}
  });
  document.querySelector("#openPaymentAdmin")?.addEventListener("click",()=>{closeAccessPanel();openPaymentAdmin()});
}

function formatArs(value){
  const n=Number(value);if(!Number.isFinite(n)||n<=0)return "Sin precio";
  try{return new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(n)}
  catch{return "$ "+Math.round(n).toLocaleString("es-AR")}
}

function premiumPrice(){
  return Number(state.config?.payments?.prices?.lifetime||5000);
}
async function startPremiumCheckout(){
  if(state.access?.active&&(state.access.role==="admin"||hasReusableAccess())){toast("Ya tenés Premium activo.");return}
  if(!state.config?.payments?.configured){toast("Mercado Pago todavía no está habilitado.");return}
  try{
    const body={plan:"lifetime"};
    if(state.room?.isHost&&state.code)body.roomCode=state.code;
    const d=await api("/api/payments/checkout",{method:"POST",body:JSON.stringify(body)});
    if(!d.checkoutUrl)throw new Error("Mercado Pago no devolvió un checkout.");
    location.href=d.checkoutUrl;
  }catch(e){toast(e.message)}
}
function closeDonationModal(){
  document.querySelector(".donation-overlay")?.remove();
  document.body.classList.remove("rules-open");
}
function openDonationModal(){
  if(!state.config?.payments?.configured){toast("Mercado Pago todavía no está habilitado.");return}
  document.querySelector(".donation-overlay")?.remove();
  document.body.insertAdjacentHTML("beforeend",`
    <div class="donation-overlay" role="dialog" aria-modal="true" aria-label="Apoyar La Juntada">
      <button class="donation-backdrop" data-close-donation aria-label="Cerrar"></button>
      <article class="donation-sheet">
        <button class="rules-close" data-close-donation aria-label="Cerrar">×</button>
        <div class="donation-heart">♥</div>
        <div class="kicker">APOYÁ LA JUNTADA</div>
        <h2>¿La pasaron bien?</h2>
        <p>La mayor parte de La Juntada es gratis. Si te gustó y querés ayudar a que siga creciendo, podés aportar el monto que quieras.</p>
        <div class="donation-options">
          <button type="button" data-donation="1000">$1.000</button>
          <button type="button" data-donation="2500">$2.500</button>
          <button type="button" data-donation="5000">$5.000</button>
        </div>
        <label class="donation-custom-label">Otro monto</label>
        <div class="donation-custom"><span>$</span><input id="donationCustom" type="number" min="500" max="500000" step="100" placeholder="3000"></div>
        <button class="primary wide" id="donationContinue">Aportar con Mercado Pago <span>→</span></button>
        <small class="donation-note">Es totalmente opcional y no desbloquea funciones.</small>
      </article>
    </div>`);
  document.body.classList.add("rules-open");
  let amount=2500;
  const custom=document.querySelector("#donationCustom");
  const setAmount=n=>{
    amount=Number(n)||0;
    document.querySelectorAll("[data-donation]").forEach(b=>b.classList.toggle("selected",Number(b.dataset.donation)===amount));
  };
  document.querySelectorAll("[data-close-donation]").forEach(b=>b.onclick=closeDonationModal);
  document.querySelectorAll("[data-donation]").forEach(b=>b.onclick=()=>{custom.value="";setAmount(b.dataset.donation)});
  custom?.addEventListener("input",()=>setAmount(custom.value));
  setAmount(amount);
  document.querySelector("#donationContinue").onclick=async()=>{
    const btn=document.querySelector("#donationContinue");
    try{
      if(!Number.isFinite(amount)||amount<500){toast("El aporte mínimo es $500.");return}
      btn.disabled=true;btn.innerHTML='Abriendo Mercado Pago… <span>✦</span>';
      const d=await api("/api/payments/donate",{method:"POST",body:JSON.stringify({amount})});
      if(!d.checkoutUrl)throw new Error("Mercado Pago no devolvió un checkout.");
      location.href=d.checkoutUrl;
    }catch(e){toast(e.message);btn.disabled=false;btn.innerHTML='Aportar con Mercado Pago <span>→</span>'}
  };
}
function closePaymentAdmin(){document.querySelector(".payment-admin-overlay")?.remove();document.body.classList.remove("rules-open")}
async function openPaymentAdmin(){
  if(state.access?.role!=="admin"){toast("Necesitás acceso ADMIN.");return}
  let cfg;
  try{cfg=await api("/api/admin/payments")}catch(e){toast(e.message);return}
  const plans=state.config?.accessPlans||[];
  document.querySelector(".payment-admin-overlay")?.remove();
  document.body.insertAdjacentHTML("beforeend",`
    <div class="payment-admin-overlay" role="dialog" aria-modal="true" aria-label="Cobros con Mercado Pago">
      <button class="payment-admin-backdrop" data-close-payment-admin aria-label="Cerrar"></button>
      <article class="payment-admin-sheet">
        <button class="rules-close" data-close-payment-admin aria-label="Cerrar">×</button>
        <header class="payment-admin-head">
          <div class="payment-admin-mark">MP</div>
          <div><div class="kicker">COBROS REALES</div><h2>Mercado Pago</h2><p>Las credenciales se guardan cifradas en el servidor. Nunca vuelven al navegador después de guardarlas.</p></div>
        </header>

        <div class="payment-status-card ${cfg.configured?"ready":"not-ready"}">
          <span></span><div><small>ESTADO</small><strong>${cfg.configured?"Access Token conectado":"Falta conectar Mercado Pago"}</strong><p>${cfg.webhookSecretConfigured?"Webhook firmado configurado.":"Falta la firma secreta del webhook para notificaciones automáticas."}</p></div>
        </div>

        <section class="payment-admin-section">
          <div class="payment-admin-section-head"><div><small>01</small><strong>Precios en pesos argentinos</strong></div><span>Solo se cobran los que tengan precio.</span></div>
          <div class="payment-price-grid">
            ${plans.map(p=>`<label><span>${esc(p.title)}</span><div class="money-input"><b>$</b><input type="number" min="1" step="1" data-payment-price="${p.id}" value="${cfg.prices?.[p.id]||""}" placeholder="0"></div></label>`).join("")}
          </div>
        </section>

        <section class="payment-admin-section">
          <div class="payment-admin-section-head"><div><small>02</small><strong>Credenciales productivas</strong></div><span>No se muestran una vez guardadas.</span></div>
          <label>Access Token de producción</label>
          <input id="mpAccessToken" type="password" autocomplete="off" placeholder="${cfg.accessTokenConfigured?"Ya configurado · dejá vacío para conservarlo":"APP_USR-…"}">
          <label>Secret signature de Webhooks</label>
          <input id="mpWebhookSecret" type="password" autocomplete="off" placeholder="${cfg.webhookSecretConfigured?"Ya configurado · dejá vacío para conservarlo":"Firma secreta del webhook"}">
          <div class="webhook-box">
            <div><small>URL DE WEBHOOK</small><strong>${esc(cfg.webhookUrl||"")}</strong></div>
            <button class="ghost" id="copyWebhookUrl">Copiar</button>
          </div>
        </section>

        <div class="payment-admin-note"><span>◉</span><p>La compra real queda habilitada solo cuando hay Access Token válido y un precio para el pase elegido. La simulación sigue disponible únicamente para tu ADMIN.</p></div>

        <footer class="payment-admin-footer">
          <button class="ghost" data-close-payment-admin>Cancelar</button>
          <button class="primary" id="savePaymentAdmin">Guardar configuración</button>
        </footer>
      </article>
    </div>`);
  document.body.classList.add("rules-open");
  document.querySelectorAll("[data-close-payment-admin]").forEach(b=>b.onclick=closePaymentAdmin);
  document.querySelector("#copyWebhookUrl").onclick=async()=>{
    try{await navigator.clipboard.writeText(cfg.webhookUrl);toast("URL de webhook copiada")}catch{}
  };
  document.querySelector("#savePaymentAdmin").onclick=async()=>{
    const btn=document.querySelector("#savePaymentAdmin");
    try{
      const prices={};document.querySelectorAll("[data-payment-price]").forEach(i=>prices[i.dataset.paymentPrice]=i.value?Number(i.value):null);
      btn.disabled=true;btn.textContent="Verificando y guardando…";
      const saved=await api("/api/admin/payments",{method:"POST",body:JSON.stringify({
        accessToken:document.querySelector("#mpAccessToken").value.trim(),
        webhookSecret:document.querySelector("#mpWebhookSecret").value.trim(),
        prices
      })});
      state.config=null;await loadConfig();closePaymentAdmin();toast(saved.configured?"Mercado Pago configurado":"Precios guardados");
      if(state.room?.state==="paywall")renderRoom();
    }catch(e){toast(e.message);btn.disabled=false;btn.textContent="Guardar configuración"}
  };
}
function paymentReturnView(kind,message){
  document.querySelector(".payment-return-overlay")?.remove();
  document.body.insertAdjacentHTML("beforeend",`<div class="payment-return-overlay">
    <div class="payment-return-card ${kind}">
      <div class="payment-return-spinner"><i></i></div>
      <div class="kicker">MERCADO PAGO</div>
      <h2>${kind==="success"?"Pago confirmado":kind==="failure"?"No se completó el pago":"Verificando tu pago…"}</h2>
      <p>${esc(message)}</p>
      <button class="ghost" id="closePaymentReturn" style="${kind==="checking"?"display:none":""}">Volver a La Juntada</button>
    </div>
  </div>`);
  document.querySelector("#closePaymentReturn")?.addEventListener("click",()=>{document.querySelector(".payment-return-overlay")?.remove();history.replaceState(null,"",location.pathname)});
}
async function handlePaymentReturn(orderId,returnState){
  if(!orderId)return;
  paymentReturnView("checking",returnState==="pending"?"El pago figura pendiente. Lo verificamos automáticamente.":"Estamos confirmando el pago directamente con Mercado Pago.");
  let last=null;
  for(let i=0;i<18;i++){
    try{
      const d=i===0
        ?await api("/api/payments/orders/"+encodeURIComponent(orderId)+"/reconcile",{method:"POST"})
        :await api("/api/payments/orders/"+encodeURIComponent(orderId));
      last=d.payment;
      if(last?.status==="approved"){
        if(last.accessToken){saveAccessToken(last.accessToken);await loadAccess()}
        history.replaceState(null,"",location.pathname);
        paymentReturnView("success",last.isDonation?"Gracias por apoyar La Juntada ♥":"Premium ya está activo para siempre.");
        if(state.code)await refresh();else await home();
        setTimeout(()=>document.querySelector(".payment-return-overlay")?.remove(),2200);
        return;
      }
      if(last?.status==="failed"){
        history.replaceState(null,"",location.pathname);
        paymentReturnView("failure","Mercado Pago no aprobó esta operación. Podés intentarlo nuevamente.");
        return;
      }
    }catch(e){
      if(i===0)console.warn("payment return",e.message);
    }
    await new Promise(r=>setTimeout(r,2500));
  }
  paymentReturnView("pending",last?.isDonation?"Todavía no recibimos la confirmación final del aporte.":"Todavía no recibimos la confirmación final. Premium se activará apenas Mercado Pago acredite el pago.");
}
function stopPoll(){if(state.poll)clearInterval(state.poll);state.poll=null;if(window.__homeDemoTimer){clearInterval(window.__homeDemoTimer);window.__homeDemoTimer=null}if(window.__launchTimer){clearInterval(window.__launchTimer);window.__launchTimer=null;document.body.classList.remove("launch-hit")}}
function startPoll(){stopPoll();refresh();state.poll=setInterval(refresh,850)}
async function loadConfig(){if(!state.config)state.config=await api("/api/config")}
function themeCards(){
  return state.config.themes.map(t=>{
    const stats=state.config.themeStats?.[t.id]||{},modes=state.config.themeModes?.[t.id]||[];
    const locked=t.premiumOnly&&!hasReusableAccess();
    return `
    <label class="theme-card ${locked?"premium-locked":t.premiumOnly?"premium-owned":""}" data-theme="${t.id}">
      <input type="radio" name="theme" value="${t.id}" ${t.id==="clasico"?"checked":""} ${locked?"disabled":""}>
      <div class="theme-art-wrap">
        ${assetImg("theme",t.id,"theme-asset")}
        ${t.premiumOnly?'<span class="theme-lock">'+(locked?"PREMIUM +18":"INCLUIDO +18")+'</span>':""}
      </div>
      <div class="theme-copy">
        <strong>${esc(t.title)}</strong>
        <small>${esc(t.tagline||t.description)}</small>
        <div class="theme-facts">
          <span>${stats.maxRounds||"—"} rondas máx.</span>
          <span>${stats.modeCount||modes.length} modos</span>
          <span>${stats.promptCount||"—"} consignas base</span>
        </div>
        <button class="theme-details" type="button" data-theme-info="${t.id}">Qué incluye →</button>
      </div>
    </label>`;
  }).join("");
}

function selectedThemeSummary(){
  const id=document.querySelector('input[name="theme"]:checked')?.value||"clasico";
  const t=state.config.themes.find(x=>x.id===id)||state.config.themes[0];
  const stats=state.config.themeStats?.[id]||{},modeIds=state.config.themeModes?.[id]||[];
  const modes=modeIds.slice(0,4).map(mid=>{
    const m=state.config.modes.find(x=>x.id===mid);
    return m?`<span>${assetImg("mode",mid,"selected-mode-icon")}<b>${esc(m.title)}</b></span>`:"";
  }).join("");
  return `
    <div class="selected-theme-art">${assetImg("theme",id,"selected-theme-image")}</div>
    <div class="selected-theme-copy">
      <small>TEMÁTICA ELEGIDA</small>
      <strong>${esc(t.title)}</strong>
      <p>${esc(t.tagline||t.description)}</p>
      <div class="selected-theme-stats">
        <span><b>${stats.maxRounds||"—"}</b> rondas máx.</span>
        <span><b>${stats.modeCount||modeIds.length}</b> modos</span>
      </div>
      <div class="selected-theme-modes">${modes}</div>
    </div>
    <button type="button" class="change-theme" id="wizardChangeTheme">Cambiar</button>`;
}

function paintSelectedTheme(){
  const el=document.querySelector("#selectedThemeSummary");
  if(el)el.innerHTML=selectedThemeSummary();
  document.querySelector("#selectedThemeSummary [data-scroll]")?.addEventListener("click",e=>{
    const target=document.querySelector(e.currentTarget.dataset.scroll);target?.scrollIntoView({behavior:"smooth",block:"start"});
  });
}

function openThemeInfo(id){
  const t=state.config.themes.find(x=>x.id===id);if(!t)return;
  const stats=state.config.themeStats?.[id]||{},modeIds=state.config.themeModes?.[id]||[];
  const modes=modeIds.map(mid=>{
    const m=state.config.modes.find(x=>x.id===mid),r=GAME_RULES[mid];
    if(!m)return "";
    return `<button type="button" class="theme-mode-row" data-theme-rule="${mid}">
      ${assetImg("mode",mid,"theme-mode-icon")}
      <div><strong>${esc(m.title)}</strong><small>${esc(r?.rounds||m.description)}</small></div>
      <span>→</span>
    </button>`;
  }).join("");
  document.querySelector(".theme-overlay")?.remove();
  document.body.insertAdjacentHTML("beforeend",`
    <div class="theme-overlay" role="dialog" aria-modal="true" aria-label="Temática ${esc(t.title)}">
      <button class="theme-backdrop" data-close-theme aria-label="Cerrar"></button>
      <article class="theme-sheet">
        <button class="rules-close" data-close-theme aria-label="Cerrar">×</button>
        <header class="theme-sheet-hero">
          <div class="theme-sheet-art">${assetImg("theme",id,"theme-sheet-image")}</div>
          <div class="theme-sheet-copy">
            <div class="kicker">TEMÁTICA</div>
            <h2>${esc(t.title)}</h2>
            <p class="theme-tagline">${esc(t.tagline||"")}</p>
            <p>${esc(t.description)}</p>
          </div>
        </header>
        <div class="theme-sheet-stats">
          <div><small>PARTIDA</small><strong>Hasta ${stats.maxRounds||"—"} rondas</strong></div>
          <div><small>FORMATOS</small><strong>${stats.modeCount||modeIds.length} modos</strong></div>
          <div><small>BANCO BASE</small><strong>${stats.promptCount||"—"} consignas</strong></div>
          <div><small>MISIONES</small><strong>${stats.hasMissions?(stats.missionCount+" disponibles"):"No incluye"}</strong></div>
        </div>
        <section class="theme-modes-section">
          <div class="kicker">MODOS QUE PUEDE MEZCLAR</div>
          <div class="theme-mode-list">${modes}</div>
        </section>
        <div class="theme-content-note"><span>✦</span><p>Estas consignas son la base. La partida además usa lo que responde tu propio grupo.</p></div>
        ${t.premiumOnly?'<div class="premium-theme-note"><strong>Premium</strong><span>'+(hasReusableAccess()?"Ya está incluida en tu Premium.":"Esta temática es uno de los extras Premium.")+'</span></div>':""}
        <footer class="theme-sheet-footer">
          ${t.premiumOnly&&!hasReusableAccess()?'<button class="primary" type="button" data-theme-premium>Desbloquear Premium · '+esc(formatArs(premiumPrice()))+'</button>':`<button class="primary" type="button" data-choose-theme="${id}">Crear con ${esc(t.title)}</button>`}
        </footer>
      </article>
    </div>`);
  document.body.classList.add("rules-open");
  document.querySelectorAll("[data-close-theme]").forEach(b=>b.onclick=closeThemeInfo);
  document.querySelectorAll("[data-theme-rule]").forEach(b=>b.onclick=()=>{closeThemeInfo();setTimeout(()=>openRules(b.dataset.themeRule),230)});
  document.querySelector("[data-choose-theme]")?.addEventListener("click",e=>{
    const chosen=e.currentTarget.dataset.chooseTheme;
    const existing=document.querySelector('.create-wizard-overlay input[name="theme"][value="'+chosen+'"]');
    if(existing&&!existing.disabled){
      existing.checked=true;existing.dispatchEvent(new Event("change",{bubbles:true}));
      closeThemeInfo();setCreateWizardStep(3);
    }else{
      closeThemeInfo();setTimeout(()=>openCreateWizard(chosen),180);
    }
  });
  document.querySelector("[data-theme-premium]")?.addEventListener("click",()=>{
    closeThemeInfo();setTimeout(openPremiumModal,180);
  });
}
function closeThemeInfo(){
  const o=document.querySelector(".theme-overlay");if(!o)return;
  o.classList.add("closing");setTimeout(()=>o.remove(),220);document.body.classList.remove("rules-open");
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


function closeLauncherOverlay(selector=".launcher-overlay"){
  document.querySelectorAll(selector).forEach(x=>x.remove());
  if(!document.querySelector(".rules-overlay,.theme-overlay,.access-overlay,.custom-studio-overlay,.payment-admin-overlay,.donation-overlay"))document.body.classList.remove("rules-open");
}
function compactThemePreview(limit=4){
  const order=["clasico","caos","profundo","cumple","parejas","rompehielo","canceladisimos","picante18"];
  return order.map(id=>state.config.themes.find(t=>t.id===id)).filter(Boolean).slice(0,limit).map(t=>{
    const locked=t.premiumOnly&&!hasReusableAccess();
    return `<button type="button" class="home-theme-chip ${locked?"is-premium":""}" data-home-theme="${t.id}">
      <span class="home-theme-thumb">${assetImg("theme",t.id,"home-theme-image")}</span>
      <span><strong>${esc(t.title)}</strong><small>${locked?"Premium":esc(t.tagline||"")}</small></span>
      ${locked?'<em>◇</em>':'<i>→</i>'}
    </button>`;
  }).join("");
}
function compactModePreview(limit=4){
  return state.config.modes.filter(m=>state.config.implementedModes.includes(m.id)||m.id==="mision_secreta").slice(0,limit).map(m=>{
    const r=GAME_RULES[m.id];
    return `<button type="button" class="home-mode-chip" data-home-rule="${m.id}">
      ${assetImg("mode",m.id,"home-mode-image")}
      <span><strong>${esc(m.title)}</strong><small>${esc(r?.summary||m.description)}</small></span>
      <i>→</i>
    </button>`;
  }).join("");
}
function openHowItWorks(){
  closeLauncherOverlay();
  document.body.insertAdjacentHTML("beforeend",`
    <div class="launcher-overlay how-overlay" role="dialog" aria-modal="true" aria-label="Cómo funciona La Juntada">
      <button class="launcher-backdrop" data-close-launcher aria-label="Cerrar"></button>
      <article class="launcher-sheet compact-info-sheet">
        <button class="rules-close" data-close-launcher aria-label="Cerrar">×</button>
        <div class="kicker">ASÍ SE JUEGA</div>
        <h2>En tres minutos ya están adentro.</h2>
        <div class="simple-how-list">
          <div><span>01</span><p><strong>Creás una sala.</strong><small>Elegís temática y compartís link, QR o código.</small></p></div>
          <div><span>02</span><p><strong>Todos responden en secreto.</strong><small>Historias, mentiras, votos y respuestas personales.</small></p></div>
          <div><span>03</span><p><strong>La Juntada arma el juego.</strong><small>Convierte lo que cargaron en rondas sobre ese grupo.</small></p></div>
          <div><span>04</span><p><strong>Juegan desde los celulares.</strong><small>Votan, suman puntos y el ranking se revela al final.</small></p></div>
        </div>
        <button class="primary wide" id="howCreate">Crear una Juntada <span>→</span></button>
      </article>
    </div>`);
  document.body.classList.add("rules-open");
  document.querySelectorAll("[data-close-launcher]").forEach(b=>b.onclick=()=>closeLauncherOverlay());
  document.querySelector("#howCreate").onclick=()=>{closeLauncherOverlay();openCreateWizard()};
}
function openThemesBrowser(){
  closeLauncherOverlay();
  const cards=state.config.themes.map(t=>{
    const locked=t.premiumOnly&&!hasReusableAccess();
    return `<button type="button" class="browse-theme-card ${locked?"locked":""}" data-browse-theme="${t.id}">
      <div class="browse-theme-art">${assetImg("theme",t.id,"browse-theme-image")}${locked?'<em>PREMIUM</em>':""}</div>
      <span><strong>${esc(t.title)}</strong><small>${esc(t.tagline||t.description)}</small></span>
      <i>Ver →</i>
    </button>`;
  }).join("");
  document.body.insertAdjacentHTML("beforeend",`
    <div class="launcher-overlay" role="dialog" aria-modal="true" aria-label="Temáticas">
      <button class="launcher-backdrop" data-close-launcher aria-label="Cerrar"></button>
      <article class="launcher-sheet browse-sheet">
        <button class="rules-close" data-close-launcher aria-label="Cerrar">×</button>
        <div class="launcher-title"><div><div class="kicker">TEMÁTICAS</div><h2>Elegí el tono de la noche.</h2></div><p>La mayoría son gratis. Canceladísimos y Picante 18+ son extras Premium.</p></div>
        <div class="browse-theme-grid">${cards}</div>
      </article>
    </div>`);
  document.body.classList.add("rules-open");
  document.querySelectorAll("[data-close-launcher]").forEach(b=>b.onclick=()=>closeLauncherOverlay());
  document.querySelectorAll("[data-browse-theme]").forEach(b=>b.onclick=()=>{const id=b.dataset.browseTheme;closeLauncherOverlay();setTimeout(()=>openThemeInfo(id),120)});
}
function openModesBrowser(){
  closeLauncherOverlay();
  document.body.insertAdjacentHTML("beforeend",`
    <div class="launcher-overlay" role="dialog" aria-modal="true" aria-label="Modos de juego">
      <button class="launcher-backdrop" data-close-launcher aria-label="Cerrar"></button>
      <article class="launcher-sheet browse-sheet">
        <button class="rules-close" data-close-launcher aria-label="Cerrar">×</button>
        <div class="launcher-title"><div><div class="kicker">MODOS DE JUEGO</div><h2>Cada ronda cambia la dinámica.</h2></div><p>Adiviná, engañá, leé al grupo, formá dúos y cumplí misiones.</p></div>
        <div class="browse-mode-grid">${modeShowcase()}</div>
      </article>
    </div>`);
  document.body.classList.add("rules-open");
  document.querySelectorAll("[data-close-launcher]").forEach(b=>b.onclick=()=>closeLauncherOverlay());
  document.querySelectorAll("[data-rule]").forEach(b=>b.onclick=()=>{const id=b.dataset.rule;closeLauncherOverlay();setTimeout(()=>openRules(id),120)});
}
function openPremiumModal(){
  closeLauncherOverlay();
  const active=hasReusableAccess();
  document.body.insertAdjacentHTML("beforeend",`
    <div class="launcher-overlay" role="dialog" aria-modal="true" aria-label="Premium">
      <button class="launcher-backdrop" data-close-launcher aria-label="Cerrar"></button>
      <article class="launcher-sheet premium-mini-sheet">
        <button class="rules-close" data-close-launcher aria-label="Cerrar">×</button>
        <div class="premium-mini-mark">◇</div>
        <div class="kicker">PREMIUM PARA SIEMPRE</div>
        <h2>${active?"Ya lo tenés desbloqueado.":"Tres extras. Un solo pago."}</h2>
        <p>La Juntada normal sigue siendo gratis. Premium agrega solamente estas funciones.</p>
        <div class="premium-mini-benefits">
          <div><b>🔥</b><span><strong>Canceladísimos</strong><small>La temática más incómoda.</small></span></div>
          <div><b>🔞</b><span><strong>Picante 18+</strong><small>Solo para adultos.</small></span></div>
          <div><b>✎</b><span><strong>Partidas personalizadas</strong><small>Creá tus propias consignas y packs.</small></span></div>
        </div>
        ${active?'<button class="secondary wide" id="premiumAccess">Ver mi acceso</button>':`<button class="primary wide big-action" id="premiumBuy">Desbloquear Premium · ${esc(formatArs(premiumPrice()))}</button><button class="ghost wide" id="premiumRestore">Ya tengo Premium</button>`}
      </article>
    </div>`);
  document.body.classList.add("rules-open");
  document.querySelectorAll("[data-close-launcher]").forEach(b=>b.onclick=()=>closeLauncherOverlay());
  document.querySelector("#premiumBuy")?.addEventListener("click",()=>{closeLauncherOverlay();startPremiumCheckout()});
  document.querySelector("#premiumRestore")?.addEventListener("click",()=>{closeLauncherOverlay();openAccessPanel()});
  document.querySelector("#premiumAccess")?.addEventListener("click",()=>{closeLauncherOverlay();openAccessPanel()});
}
function openJoinFlow(prefill=""){
  closeLauncherOverlay();
  document.body.insertAdjacentHTML("beforeend",`
    <div class="launcher-overlay" role="dialog" aria-modal="true" aria-label="Entrar a una Juntada">
      <button class="launcher-backdrop" data-close-launcher aria-label="Cerrar"></button>
      <article class="launcher-sheet join-launcher improved-join">
        <button class="rules-close" data-close-launcher aria-label="Cerrar">×</button>
        <div class="join-icon">↗</div>
        <div class="kicker">ENTRAR A UNA JUNTADA</div>
        <h2>Ya te invitaron.</h2>
        <p>Escribí el código que te mandaron y tu nombre. No necesitás cuenta ni instalar nada.</p>
        <label class="field-label">Código de 6 caracteres</label>
        <input id="joinCode" maxlength="6" placeholder="ABC123" value="${esc(prefill||"")}" style="text-transform:uppercase">
        <label class="field-label">Tu nombre</label>
        <input id="joinName" maxlength="40" placeholder="Tu nombre">
        <button class="primary wide big-action" id="joinBtn">Entrar a la Juntada <span>→</span></button>
        <small class="launcher-note">Sin descarga · Sin registro</small>
      </article>
    </div>`);
  document.body.classList.add("rules-open");
  document.querySelectorAll("[data-close-launcher]").forEach(b=>b.onclick=()=>closeLauncherOverlay());
  document.querySelector("#joinBtn").onclick=joinRoom;
  document.querySelector("#joinCode")?.focus();
}
function closeCreateWizard(){
  document.querySelector(".create-wizard-overlay")?.remove();
  if(!document.querySelector(".rules-overlay,.theme-overlay,.access-overlay,.custom-studio-overlay,.payment-admin-overlay,.donation-overlay,.launcher-overlay"))document.body.classList.remove("rules-open");
}
function setCreateWizardStep(step){
  const root=document.querySelector(".create-wizard-overlay");if(!root)return;
  const n=Math.max(1,Math.min(3,Number(step)||1));
  root.dataset.step=String(n);
  root.querySelectorAll("[data-wizard-step]").forEach(x=>x.classList.toggle("active",Number(x.dataset.wizardStep)===n));
  root.querySelectorAll("[data-wizard-dot]").forEach(x=>x.classList.toggle("active",Number(x.dataset.wizardDot)<=n));
  const label=root.querySelector("#wizardStepLabel");if(label)label.textContent="Paso "+n+" de 3";
  root.querySelector(".wizard-sheet")?.scrollTo({top:0,behavior:"smooth"});
}
function openCreateWizard(initialTheme="clasico"){
  closeLauncherOverlay();
  closeCreateWizard();
  document.body.insertAdjacentHTML("beforeend",`
    <div class="create-wizard-overlay" data-step="1" role="dialog" aria-modal="true" aria-label="Crear La Juntada">
      <button class="wizard-backdrop" data-close-wizard aria-label="Cerrar"></button>
      <article class="wizard-sheet">
        <header class="wizard-header">
          <div>${brand()}</div>
          <div class="wizard-progress"><small id="wizardStepLabel">Paso 1 de 3</small><div><i data-wizard-dot="1" class="active"></i><i data-wizard-dot="2"></i><i data-wizard-dot="3"></i></div></div>
          <button class="rules-close" data-close-wizard aria-label="Cerrar">×</button>
        </header>

        <section class="wizard-step active" data-wizard-step="1">
          <div class="wizard-copy"><div class="kicker">PRIMERO LO BÁSICO</div><h2>¿Cómo va a ser esta Juntada?</h2><p>Dos decisiones y seguimos.</p></div>
          <div class="wizard-block">
            <label class="wizard-label">¿Cuándo juegan?</label>
            <div class="choice-grid">
              <label class="choice-card"><input type="radio" name="when" value="now" checked><strong>⚡ Ahora</strong><span>Están juntos y quieren arrancar.</span></label>
              <label class="choice-card"><input type="radio" name="when" value="later"><strong>📅 Preparar antes</strong><span>Mandás el link y responden antes.</span></label>
            </div>
            <div id="dateWrap" class="date-wrap"><label>Fecha de la juntada</label><input id="eventDate" type="date"></div>
          </div>
          <div class="wizard-block">${surpriseSetupHtml()}</div>
          <div class="wizard-actions"><span></span><button class="primary" id="wizardNext1">Elegir temática <span>→</span></button></div>
        </section>

        <section class="wizard-step" data-wizard-step="2">
          <div class="wizard-copy"><div class="kicker">ELEGÍ EL MOOD</div><h2>¿Qué tono quieren?</h2><p>Podés ver el detalle de cualquier temática antes de elegir.</p></div>
          <div class="wizard-theme-grid">${themeCards()}</div>
          <div class="wizard-actions"><button class="ghost" id="wizardBack2">← Atrás</button><button class="primary" id="wizardNext2">Continuar <span>→</span></button></div>
        </section>

        <section class="wizard-step" data-wizard-step="3">
          <div class="wizard-copy"><div class="kicker">ÚLTIMO PASO</div><h2>Poné los nombres y listo.</h2><p>Después recibís el link, QR y código para invitar.</p></div>
          <div class="selected-theme-summary wizard-selected-theme" id="selectedThemeSummary"></div>
          <div class="form-two wizard-names">
            <div><label class="field-label">Nombre de la juntada</label><input id="roomName" placeholder="Cumple de Sofi" maxlength="80"></div>
            <div><label class="field-label">Tu nombre</label><input id="hostName" placeholder="Diego" maxlength="40"></div>
          </div>
          <label class="age-check wizard-age" id="ageWrap"><input id="ageConfirmed" type="checkbox"> Confirmo que los participantes son mayores de 18 años.</label>
          <details class="wizard-advanced">
            <summary><div><strong>Opciones avanzadas</strong><small>Duración, modos y partida personalizada.</small></div><span>Ajustar</span></summary>
            <div class="wizard-advanced-body">
              <div id="customPackHolder" class="custom-pack-holder">${customPackSelectorHtml()}</div>
              <div id="gameSettingsHolder" class="game-settings-holder">${gameSettingsHtml()}</div>
            </div>
          </details>
          <div class="wizard-actions"><button class="ghost" id="wizardBack3">← Atrás</button><button class="primary big-action" id="createBtn">Crear La Juntada <span>→</span></button></div>
          <div class="wizard-after"><span>✓ Sin descarga</span><span>✓ Invitados sin cuenta</span><span>✓ Partida completa gratis</span></div>
        </section>
      </article>
    </div>`);
  document.body.classList.add("rules-open");
  document.querySelectorAll("[data-close-wizard]").forEach(b=>b.onclick=closeCreateWizard);

  const themeInput=document.querySelector('input[name="theme"][value="'+initialTheme+'"]');
  const fallback=document.querySelector('input[name="theme"][value="clasico"]');
  if(themeInput&&!themeInput.disabled)themeInput.checked=true;else if(fallback)fallback.checked=true;

  const refreshBasics=()=>{
    const when=document.querySelector('input[name="when"]:checked')?.value||"now";
    document.querySelector("#dateWrap")?.classList.toggle("show",when==="later");
  };
  const refreshTheme=()=>{
    const themeId=document.querySelector('input[name="theme"]:checked')?.value||"clasico";
    const theme=state.config.themes.find(t=>t.id===themeId);
    const age=document.querySelector("#ageWrap");if(age)age.classList.toggle("show",!!theme?.age18);
    paintSelectedTheme();paintGameSettings();
    document.querySelector("#wizardChangeTheme")?.addEventListener("click",()=>setCreateWizardStep(2));
  };
  document.querySelectorAll('input[name="when"]').forEach(x=>x.addEventListener("change",refreshBasics));
  document.querySelectorAll('input[name="theme"]').forEach(x=>x.addEventListener("change",refreshTheme));
  document.querySelectorAll("[data-theme-info]").forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();openThemeInfo(b.dataset.themeInfo)});
  document.querySelectorAll(".theme-card.premium-locked").forEach(card=>card.addEventListener("click",e=>{e.preventDefault();openPremiumModal()}));
  refreshBasics();refreshTheme();bindSurpriseSetup();bindCustomPackControls();bindGameSettings();

  document.querySelector("#wizardNext1").onclick=()=>{
    const when=document.querySelector('input[name="when"]:checked')?.value||"now";
    if(when==="later"&&!document.querySelector("#eventDate")?.value){toast("Elegí la fecha.");return}
    const surprise=document.querySelector('input[name="partyKind"]:checked')?.value==="surprise";
    if(surprise&&!document.querySelector("#honoreeName")?.value.trim()){toast("Decinos para quién es la sorpresa.");return}
    setCreateWizardStep(2);
  };
  document.querySelector("#wizardBack2").onclick=()=>setCreateWizardStep(1);
  document.querySelector("#wizardNext2").onclick=()=>setCreateWizardStep(3);
  document.querySelector("#wizardBack3").onclick=()=>setCreateWizardStep(2);
  document.querySelector("#createBtn")?.removeAttribute("disabled");
}
function homeAtmosphere(){
  return '<div class="ambient-layer" aria-hidden="true"><span class="orb orb-a"></span><span class="orb orb-b"></span><span class="orb orb-c"></span><i class="spark s1"></i><i class="spark s2"></i><i class="spark s3"></i><i class="spark s4"></i><i class="spark s5"></i></div>';
}

async function home(){
  stopPoll();clearSession();await loadConfig();await loadAccess();await syncCustomPacks();
  app.innerHTML=homeAtmosphere()+`
  <header class="site-header home-v2-header">
    ${brand()}
    <nav class="desktop-nav">
      <button type="button" id="navHow">Cómo funciona</button>
      <button type="button" id="navThemes">Temáticas</button>
      <button type="button" id="navModes">Modos</button>
    </nav>
    <div class="header-actions">
      <button class="header-access ${state.access?.active?"active":""}" id="openAccess">${esc(accessLabel())}</button>
      <button class="header-cta" id="headerCreate">Crear</button>
    </div>
  </header>

  <main class="home-page home-v2">
    <section class="hero hero-premium hero-v2">
      <div class="hero-copy reveal-up">
        <div class="eyebrow">EL GRUPO SE CONVIERTE EN EL JUEGO</div>
        <h1>Tus amigos<br><span class="grad">son el juego.</span></h1>
        <p class="lead">Todos entran desde el celular, responden en secreto y La Juntada transforma sus historias en una partida sobre ustedes.</p>
        <div class="hero-actions hero-actions-v2">
          <button class="primary hero-cta" id="heroCreate">Crear una Juntada <span>→</span></button>
          <button class="secondary hero-join" id="heroJoin">Entrar con código</button>
        </div>
        <div class="hero-trust hero-trust-v2">
          <span>✓ Gratis para jugar</span><span>✓ Sin instalar nada</span><span>✓ Invitados sin cuenta</span>
        </div>
      </div>
      <div class="hero-visual hero-visual-v2 reveal-scale" aria-hidden="true">
        <div class="hero-halo"></div>
        <img class="hero-people hero-scene" src="/assets/hero-juntada-premium.webp?v=20260920-exact" alt="">
      </div>
    </section>

    <section class="home-v2-how reveal-section">
      <button class="how-summary" id="homeHow">
        <span>01</span><div><strong>Creá</strong><small>una sala</small></div><i>→</i>
        <span>02</span><div><strong>Respondan</strong><small>en secreto</small></div><i>→</i>
        <span>03</span><div><strong>Jueguen</strong><small>sobre ustedes</small></div>
        <em>Cómo funciona</em>
      </button>
    </section>

    <section class="home-v2-discover reveal-section">
      <div class="home-v2-panel">
        <div class="home-v2-panel-head"><div><div class="kicker">TEMÁTICAS</div><h2>Elegí el mood.</h2></div><button class="text-link" id="allThemes">Ver todas →</button></div>
        <div class="home-theme-list">${compactThemePreview(4)}</div>
      </div>
      <div class="home-v2-panel">
        <div class="home-v2-panel-head"><div><div class="kicker">MODOS</div><h2>La dinámica cambia.</h2></div><button class="text-link" id="allModes">Ver todos →</button></div>
        <div class="home-mode-list">${compactModePreview(4)}</div>
      </div>
    </section>

    <section class="home-v2-bottom reveal-section">
      <div class="bottom-message">
        <div class="kicker">LA IDEA ES SIMPLE</div>
        <h2>Entrar, responder y jugar.</h2>
        <p>Las opciones avanzadas existen, pero no tenés que tocarlas para empezar.</p>
        <button class="primary" id="bottomCreate">Crear una Juntada <span>→</span></button>
      </div>
      <div class="home-v2-extras">
        <button class="extra-row" id="homePremium"><span>◇</span><div><strong>Premium · ${esc(formatArs(premiumPrice()))}</strong><small>Canceladísimos · 18+ · partidas personalizadas</small></div><i>→</i></button>
        <button class="extra-row support" id="homeDonate"><span>♥</span><div><strong>Apoyar La Juntada</strong><small>Donación totalmente opcional</small></div><i>→</i></button>
      </div>
    </section>
  </main>`;

  const create=()=>openCreateWizard();
  document.querySelector("#heroCreate").onclick=create;
  document.querySelector("#headerCreate").onclick=create;
  document.querySelector("#bottomCreate").onclick=create;
  document.querySelector("#heroJoin").onclick=()=>openJoinFlow();
  document.querySelector("#navHow").onclick=openHowItWorks;
  document.querySelector("#homeHow").onclick=openHowItWorks;
  document.querySelector("#navThemes").onclick=openThemesBrowser;
  document.querySelector("#allThemes").onclick=openThemesBrowser;
  document.querySelector("#navModes").onclick=openModesBrowser;
  document.querySelector("#allModes").onclick=openModesBrowser;
  document.querySelector("#openAccess")?.addEventListener("click",openAccessPanel);
  document.querySelector("#homePremium").onclick=openPremiumModal;
  document.querySelector("#homeDonate").onclick=openDonationModal;
  document.querySelectorAll("[data-home-theme]").forEach(b=>b.onclick=()=>openThemeInfo(b.dataset.homeTheme));
  document.querySelectorAll("[data-home-rule]").forEach(b=>b.onclick=()=>openRules(b.dataset.homeRule));
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
async function createRoom(){
  const btn=document.querySelector("#createBtn");
  const fail=message=>{
    let box=document.querySelector("#createRoomError");
    if(!box&&btn){
      box=document.createElement("div");
      box.id="createRoomError";
      box.className="create-room-error";
      btn.closest(".wizard-actions")?.insertAdjacentElement("beforebegin",box);
    }
    if(box){box.textContent=message;box.scrollIntoView({behavior:"smooth",block:"center"})}
    toast(message);
  };
  try{
    if(btn?.dataset.busy==="1")return;
    const name=document.querySelector("#roomName")?.value.trim()||"";
    const hostName=document.querySelector("#hostName")?.value.trim()||"";
    const themeInput=document.querySelector('input[name="theme"]:checked');
    if(!name){fail("Poné un nombre para la Juntada.");document.querySelector("#roomName")?.focus();return}
    if(!hostName){fail("Escribí tu nombre.");document.querySelector("#hostName")?.focus();return}
    if(!themeInput){fail("Elegí una temática.");return}
    const when=document.querySelector('input[name="when"]:checked')?.value||"now";
    const eventDate=document.querySelector("#eventDate")?.value||"";
    if(when==="later"&&!eventDate){fail("Elegí la fecha de la Juntada.");setCreateWizardStep(1);return}
    const surpriseMode=document.querySelector('input[name="partyKind"]:checked')?.value==="surprise";
    const honoreeName=document.querySelector("#honoreeName")?.value.trim()||"";
    if(surpriseMode&&!honoreeName){fail("Decinos para quién es la sorpresa.");setCreateWizardStep(1);return}

    document.querySelector("#createRoomError")?.remove();
    if(btn){btn.dataset.busy="1";btn.disabled=true;btn.innerHTML='Creando sala… <span>✦</span>'}

    const pack=selectedCustomPack();
    const d=await api("/api/rooms",{method:"POST",body:JSON.stringify({
      name,hostName,themeId:themeInput.value,playWhen:when,eventDate,
      ageConfirmed:!!document.querySelector("#ageConfirmed")?.checked,
      customPack:pack||null,
      surpriseMode,honoreeName,
      roundLimit:Number(document.querySelector('input[name="roundLimit"]:checked')?.value||15),
      disabledModes:[...document.querySelectorAll("[data-mode-toggle]")].filter(x=>!x.checked).map(x=>x.dataset.modeToggle)
    })});
    closeCreateWizard();
    saveSession(d.code,d.sessionToken);
    startPoll();
  }catch(e){
    if(btn){btn.dataset.busy="0";btn.disabled=false;btn.innerHTML='Crear La Juntada <span>→</span>'}
    fail(e?.message||"No pude crear la sala. Probá de nuevo.");
  }
}
async function joinRoom(){try{
  const code=document.querySelector("#joinCode")?.value.trim().toUpperCase()||"";
  const params=new URLSearchParams(location.search),honoreeKey=params.get("honoree")||"";
  state.code=code;
  const body=honoreeKey?{honoreeKey}:{name:document.querySelector("#joinName")?.value||""};
  const d=await api("/api/rooms/"+code+"/join",{method:"POST",body:JSON.stringify(body)});
  closeLauncherOverlay();
  saveSession(d.code,d.sessionToken);
  history.replaceState(null,"",location.pathname);
  if(d.isHonoree)toast("Entraste a tu Juntada sorpresa");
  else if(d.lateJoin)toast("Entraste a una partida en curso");
  startPoll()
}catch(e){toast(e.message)}}
async function refresh(){if(!state.code)return;try{const r=await api("/api/rooms/"+state.code);state.room=r;const k=JSON.stringify(r);if(k!==state.lastKey){state.lastKey=k;renderRoom()}}catch(e){if(/inexistente|Sesión/.test(e.message)){home();toast(e.message)}}}

function chips(r){return r.players.map(p=>`<span class="chip ${p.ready?"ready":""} ${p.isHonoree?"honoree-chip":""}"><span class="dot"></span>${esc(p.name)}${p.id===r.me?.id?" · vos":""}${p.isHost?" · host":""}${p.isHonoree?" · sorpresa":""}</span>`).join("")}
function roomHeader(r){return `<div class="room-header"><div class="room-title-wrap">${assetImg("theme",r.themeId,"room-theme-art")}<div><div class="kicker">${esc(r.theme.title)}</div><div class="room-title">${esc(r.name)}</div></div></div><div class="room-meta"><button class="leave-room room-exit-btn" type="button">${r.isHost?"Terminar partida":"Salir del grupo"}</button>${r.surprise?.enabled?'<span class="pill surprise-pill">✦ Para '+esc(r.surprise.honoreeName)+'</span>':""}<span class="pill">${r.players.length} jugadores</span><span class="room-code-mini">${r.code}</span></div></div>`}
function hostRoster(r){
  if(!r.isHost)return "";
  const ready=r.players.filter(p=>p.ready).length,pending=r.players.length-ready;
  return `<section class="card soft host-roster host-control-room">
    <div class="host-control-head">
      <div><div class="kicker">CONTROL DEL HOST</div><div class="section-title">Tu grupo</div></div>
      <button class="ghost small-btn" id="copyInvite">+ Invitar</button>
    </div>
    <div class="host-control-stats">
      <span><b>${r.players.length}</b> jugadores</span>
      <span><b>${ready}</b> listos</span>
      <span><b>${pending}</b> pendientes</span>
    </div>
    <div class="roster-list">${r.players.map(p=>`<div class="roster-row ${p.ready?"is-ready":"is-pending"}"><div class="roster-avatar">${esc(p.name).slice(0,1).toUpperCase()}</div><div class="roster-name"><strong>${esc(p.name)}</strong><small>${p.isHost?"Host":p.isHonoree?"Persona sorpresa":p.ready?"Listo para jugar":"Todavía no terminó"}</small></div><span class="roster-state">${p.isHost?"HOST":p.isHonoree?"✦":p.ready?"✓":"…"}</span>${p.isHost?"":`<button class="danger-btn remove-player" data-id="${p.id}" data-name="${esc(p.name)}">Quitar</button>`}</div>`).join("")}</div>
    <div class="host-control-foot">
      <p>${r.surprise?.enabled?"Compartí el link normal con el grupo. El link especial de "+esc(r.surprise.honoreeName)+" se manda recién cuando quieras que entre.":"Podés sumar gente con el mismo link en cualquier momento. Si quitás a alguien, sus respuestas y votos salen del juego."}</p>
      ${r.surprise?.enabled&&r.surprise?.inviteKey?`<button class="secondary wide surprise-invite-btn" id="copyHonoreeInvite">✦ Copiar link exclusivo para ${esc(r.surprise.honoreeName)}</button>`:""}
      <button class="ghost wide" id="toggleHostQr">Mostrar QR para sumar gente</button>
      <div class="qr-panel" id="hostQr"><img class="qr-image" src="/api/qr/${r.code}"><div class="qr-code-label">${r.code}</div></div>
    </div>
  </section>`;
}
function bindHostRoster(r){
  if(!r.isHost)return;
  const copy=document.querySelector("#copyInvite");if(copy)copy.onclick=async()=>{const u=location.origin+"?code="+r.code;try{await navigator.clipboard.writeText(u);toast("Link de invitación copiado")}catch{prompt("Copiá:",u)}};
  const special=document.querySelector("#copyHonoreeInvite");if(special)special.onclick=async()=>{const u=honoreeInviteUrl(r);try{await navigator.clipboard.writeText(u);toast("Link sorpresa copiado")}catch{prompt("Copiá el link sorpresa:",u)}};
  const qr=document.querySelector("#toggleHostQr");if(qr)qr.onclick=()=>{document.querySelector("#hostQr").classList.toggle("open")};
  document.querySelectorAll(".remove-player").forEach(b=>b.onclick=async()=>{if(!confirm("Quitar a "+b.dataset.name+"? También se eliminan sus respuestas y votos."))return;try{await api("/api/rooms/"+r.code+"/players/"+b.dataset.id,{method:"DELETE"});toast("Jugador eliminado");refresh()}catch(e){toast(e.message)}})
}

function lobby(r){
  const ready=r.players.filter(p=>p.ready).length;
  const stats=state.config?.themeStats?.[r.themeId]||{};
  const need=Math.max(0,2-r.players.length);
  const modeChips=(r.availableModes||[]).slice(0,6).map(m=>`<span>${assetImg("mode",m.id,"lobby-mode-icon")}<b>${esc(m.title)}</b></span>`).join("");
  const surprise=r.surprise?.enabled;
  app.innerHTML=`<div class="room-page lobby-page">
    ${brand()}
    <div class="room-atmosphere">${assetImg("theme",r.themeId,"room-watermark")}</div>
    <section class="card lobby-main game-lobby">
      ${roomHeader(r)}
      ${surprise?`<div class="surprise-room-banner">
        <div class="surprise-room-star">✦</div>
        <div><small>JUNTADA SORPRESA</small><strong>Todo gira alrededor de ${esc(r.surprise.honoreeName)}.</strong><p>El grupo prepara primero. No compartan este link normal con ${esc(r.surprise.honoreeName)}.</p></div>
        <span class="${r.surprise.honoreeJoined?"joined":"waiting"}">${r.surprise.honoreeJoined?"Ya entró":"Todavía no entra"}</span>
      </div>`:""}
      <div class="lobby-stage">
        <div class="lobby-invite-panel">
          <div class="kicker">${surprise?"INVITÁ AL GRUPO":"SALA ABIERTA"}</div>
          <h2>${surprise?"Primero, todos menos "+esc(r.surprise.honoreeName)+".":"Que entren todos."}</h2>
          <p>${surprise?"Este código es para quienes van a preparar la sorpresa. Después el host manda un link distinto a "+esc(r.surprise.honoreeName)+".":"Usen el código, el link o el QR. Con 2 personas se activa Modo Dúo automáticamente; con 3 o más se juega la experiencia grupal."}</p>
          <div class="code-orbit"><i></i><i></i><i></i><div class="code">${r.code}</div></div>
          <div class="actions invite-actions">
            <button class="secondary" id="copyLink">Copiar link del grupo</button>
            <button class="ghost" id="copyCode">Copiar código</button>
            <button class="ghost" id="showQr">Mostrar QR</button>
          </div>
          <div class="qr-panel" id="qrPanel"><img class="qr-image" src="/api/qr/${r.code}"><div class="qr-code-label">${r.code}</div></div>
        </div>
        <div class="lobby-preview">
          <div class="lobby-theme-card">
            ${assetImg("theme",r.themeId,"lobby-theme-img")}
            <div class="lobby-theme-overlay">
              <small>${surprise?"SORPRESA PARA "+esc(r.surprise.honoreeName).toUpperCase():"ESTÁN ARMANDO"}</small>
              <strong>${esc(r.theme.title)}</strong>
              <span>${r.roundLimit||15} rondas elegidas · ${stats.modeCount||r.availableModes?.length||"—"} modos disponibles</span>
            </div>
          </div>
          <div class="lobby-mode-strip">${modeChips}</div>
        </div>
      </div>

      <div class="lobby-people-head">
        <div><span class="live-dot"></span><strong>${r.players.length} ${r.players.length===1?"persona":"personas"} en la sala</strong></div>
        <small>${need?("Falta "+need+" persona para poder empezar"):(r.players.length===2?"Modo Dúo listo para empezar":"Ya pueden empezar la preparación")}</small>
      </div>
      <div class="lobby-player-grid">${r.players.map((p,i)=>`
        <div class="lobby-player-card ${p.isHonoree?"is-honoree":""}" style="--delay:${i*45}ms">
          <div class="player-bubble">${p.isHonoree?"✦":esc(p.name).slice(0,1).toUpperCase()}</div>
          <strong>${esc(p.name)}</strong>
          <small>${p.isHost?"HOST":p.isHonoree?"PERSONA SORPRESA":"CONECTADO"}</small>
          <i></i>
        </div>`).join("")}
        <button class="lobby-add-card" id="inviteCard"><span>+</span><strong>Sumar a alguien</strong><small>Copiar invitación del grupo</small></button>
      </div>

      <div class="lobby-bottom">
        <div class="lobby-next">
          <span>PRÓXIMO PASO</span>
          <strong>${surprise?"El grupo responde y deja recuerdos sobre "+esc(r.surprise.honoreeName)+".":(r.players.length===2?"Sin votaciones grupales: juegan Coincidimos, ¿Qué elegirías?, Duelo y 5 segundos.":"Cada persona responde 10 cosas en secreto.")}</strong>
          <small>${surprise?"Después invitás a "+esc(r.surprise.honoreeName)+" con su link exclusivo.":(r.players.length===2?"Los dos responden en simultáneo y el resultado se revela cuando ambos eligieron.":"Eso construye las rondas personalizadas de esta juntada.")}</small>
        </div>
        ${r.isHost?`<button class="primary lobby-start" id="startCollect">Empezar preparación <span>→</span></button>`:'<div class="waiting-host"><span class="waiting-pulse"></span>El host inicia la preparación.</div>'}
      </div>
    </section>
    ${hostRoster(r)}
  </div>`;
  if(r.isHost)document.querySelector("#startCollect").onclick=async()=>{try{const btn=document.querySelector("#startCollect");btn.disabled=true;btn.textContent="Abriendo preguntas…";await api("/api/rooms/"+r.code+"/start-collecting",{method:"POST"});await refresh()}catch(e){toast(e.message);const btn=document.querySelector("#startCollect");if(btn){btn.disabled=false;btn.innerHTML='Empezar preparación <span>→</span>'}}};
  const copyInvite=async()=>{const u=location.origin+"?code="+r.code;try{await navigator.clipboard.writeText(u);toast("Link del grupo copiado")}catch{prompt("Copiá:",u)}};
  document.querySelector("#copyLink").onclick=copyInvite;
  document.querySelector("#inviteCard").onclick=copyInvite;
  document.querySelector("#copyCode").onclick=async()=>{try{await navigator.clipboard.writeText(r.code);toast("Código copiado")}catch{}};
  document.querySelector("#showQr").onclick=()=>document.querySelector("#qrPanel").classList.toggle("open");
  bindHostRoster(r);
}

function starting(r){
  const end=r.startAt||Date.now()+3500;
  app.innerHTML=`<div class="launch-page">
    <div class="launch-bg">${assetImg("theme",r.themeId,"launch-theme")}</div>
    <div class="launch-vignette"></div>
    <div class="launch-content">
      ${brand()}
      <div class="kicker">TODO LISTO</div>
      <div class="launch-count" id="launchCount">3</div>
      <h1 id="launchTitle">Prepárense.</h1>
      <p>${r.players.length} jugadores · ${r.totalRounds} rondas armadas · ${esc(r.theme.title)}</p>
      <div class="launch-player-row">${r.players.map((p,i)=>`<span style="--i:${i}">${esc(p.name).slice(0,1).toUpperCase()}</span>`).join("")}</div>
    </div>
  </div>`;
  if(window.__launchTimer)clearInterval(window.__launchTimer);
  const paint=()=>{
    const ms=end-Date.now(),n=Math.max(0,Math.ceil(ms/1000));
    const count=document.querySelector("#launchCount"),title=document.querySelector("#launchTitle");
    if(!count)return;
    if(ms<=700){count.textContent="✦";title.textContent="LA JUNTADA";document.body.classList.add("launch-hit")}
    else{count.textContent=String(Math.min(3,n));title.textContent=n<=1?"Ahora sí.":n===2?"Todos con el celular.":"Prepárense."}
  };
  paint();window.__launchTimer=setInterval(paint,120);
}
function collecting(r){
  const readyCount=r.players.filter(p=>p.ready).length;
  const pct=Math.round((readyCount/Math.max(1,r.players.length))*100);
  const themeStats=state.config?.themeStats?.[r.themeId]||{};
  const surprise=r.surprise?.enabled;

  if(r.me?.isHonoree&&!r.me?.ready){
    const qs=r.surprise?.quickQuestions||[];
    app.innerHTML=`<div class="room-page honoree-prep-page">
      ${brand()}
      <section class="card honoree-prep-card">
        ${roomHeader(r)}
        <div class="honoree-surprise-hero">
          <div class="honoree-star">✦</div>
          <div class="kicker">ESTO ES PARA VOS</div>
          <h2>${esc(r.me.name)}, el grupo ya preparó algo.</h2>
          <p>No vas a ver nada de lo que escribieron. Respondé solo estas tres cosas en privado y entrás a jugar.</p>
        </div>
        <div class="honoree-questions">
          ${qs.map((q,i)=>`<section class="honoree-question">
            <small>0${i+1}</small><strong>${esc(q.question)}</strong>
            <div class="honoree-options">${q.options.map(o=>`<label><input type="radio" name="hq${i}" value="${esc(o.id)}"><span>${esc(o.label)}</span></label>`).join("")}</div>
          </section>`).join("")}
        </div>
        <div class="honoree-privacy"><span>◉</span><p>Tus respuestas quedan selladas igual que las del resto. Algunas rondas van a intentar adivinar qué elegiste.</p></div>
        <button class="primary wide big-action" id="submitHonoree" disabled>Guardar y entrar a la sorpresa <span>✦</span></button>
      </section>
    </div>`;
    const update=()=>{
      const complete=qs.every((_,i)=>document.querySelector('input[name="hq'+i+'"]:checked'));
      document.querySelector("#submitHonoree").disabled=!complete;
    };
    qs.forEach((_,i)=>document.querySelectorAll('input[name="hq'+i+'"]').forEach(x=>x.addEventListener("change",update)));
    update();
    document.querySelector("#submitHonoree").onclick=async()=>{try{
      const answers=qs.map((_,i)=>document.querySelector('input[name="hq'+i+'"]:checked')?.value||"");
      await api("/api/rooms/"+r.code+"/surprise-honoree",{method:"POST",body:JSON.stringify({answers})});
      toast("Listo. Ahora sí: a jugar.");refresh()
    }catch(e){toast(e.message)}};
    return;
  }

  if(r.me?.ready){
    const waitingHonoree=surprise&&!r.surprise.honoreeJoined;
    app.innerHTML=`<div class="room-page prep-ready-page">
      ${brand()}
      <section class="card prep-ready-card">
        ${roomHeader(r)}
        <div class="sealed-visual"><img src="/assets/premium-lock.svg" alt=""><span></span></div>
        <div class="kicker">${r.me?.isHonoree?"TU PERFIL QUEDÓ SELLADO":"RESPUESTAS SELLADAS"}</div>
        <h2>${r.me?.isHonoree?"No viste nada. Perfecto.":"Tus respuestas ya están adentro."}</h2>
        <p class="muted">${r.me?.isHonoree?"El grupo preparó el resto antes de que entraras. Ahora solo falta que todos estén listos.":r.playWhen==="later"?"Podés cerrar la página y volver el día de la juntada. Nadie puede leerlas antes de jugar.":"Esperando al resto. Nadie puede leer las respuestas antes del final."}</p>
        ${waitingHonoree&&r.isHost?`<div class="waiting-honoree-card"><span>✦</span><div><strong>Falta ${esc(r.surprise.honoreeName)}</strong><small>Mandale su link exclusivo cuando llegue el momento.</small></div><button class="secondary" id="readyCopyHonoree">Copiar link sorpresa</button></div>`:""}
        <div class="ready-build-stats">
          <span><b>${r.roundLimit||15}</b> rondas elegidas</span>
          <span><b>${r.availableModes?.length||"—"}</b> modos posibles</span>
          <span><b>100%</b> respuestas privadas</span>
        </div>
        <div class="ready-meter"><div><i style="width:${pct}%"></i></div><span>${readyCount}/${r.players.length} listos</span></div>
        <div class="players animated-players">${chips(r)}</div>
        ${r.isHost?'<button class="primary wide lobby-start" id="startGame" '+(r.players.length<2||r.players.some(p=>!p.ready)||waitingHonoree?"disabled":"")+'>Armar y empezar la partida <span>→</span></button>':""}
        ${r.isHost&&(r.players.some(p=>!p.ready)||waitingHonoree)?'<div class="host-wait-note">'+(waitingHonoree?"La sorpresa se habilita cuando entre "+esc(r.surprise.honoreeName)+" y responda sus 3 preguntas rápidas.":"La partida se habilita cuando todos hayan sellado sus respuestas.")+'</div>':""}
      </section>
      ${hostRoster(r)}
    </div>`;
    document.querySelector("#readyCopyHonoree")?.addEventListener("click",async()=>{const u=honoreeInviteUrl(r);try{await navigator.clipboard.writeText(u);toast("Link sorpresa copiado")}catch{prompt("Copiá:",u)}});
    if(r.isHost&&document.querySelector("#startGame"))document.querySelector("#startGame").onclick=async()=>{try{const btn=document.querySelector("#startGame");btn.disabled=true;btn.innerHTML='Armando la partida… <span>✦</span>';await api("/api/rooms/"+r.code+"/start-game",{method:"POST"});refresh()}catch(e){toast(e.message);refresh()}};
    bindHostRoster(r);return;
  }

  const prepTotal=surprise?11:10;
  const opts=r.players.filter(p=>!p.isHonoree).map(p=>`<option value="${p.id}">${esc(p.name)}${p.id===r.me?.id?" (vos)":""}</option>`).join("");
  app.innerHTML=`<div class="room-page prep-page">
    ${brand()}
    <section class="card prep-card">
      ${roomHeader(r)}
      ${surprise?`<div class="surprise-prep-callout"><span>✦</span><div><small>SORPRESA PARA ${esc(r.surprise.honoreeName).toUpperCase()}</small><strong>Todo esto queda oculto para ${esc(r.surprise.honoreeName)}.</strong><p>Al final te pedimos un recuerdo extra que puede aparecer durante la partida.</p></div></div>`:""}
      <div class="prep-hero">
        <div>
          <div class="kicker">PREPARACIÓN SECRETA</div>
          <h2>${prepTotal} respuestas. Después juega el sistema.</h2>
          <p>Te lleva unos minutos. Tus respuestas alimentan distintos modos y nadie —ni siquiera el host— puede abrirlas antes del final.</p>
          <div class="prep-quick-facts">
            <span><b>${prepTotal}</b> respuestas</span>
            <span><b>3–5 min</b> aprox.</span>
            <span><b>${r.roundLimit||15}</b> rondas elegidas</span>
          </div>
        </div>
        <div class="secret-orb"><span>SECRETO</span><i></i></div>
      </div>

      <div class="prep-progress-card">
        <div class="prep-progress-copy"><strong id="prepProgressLabel">0 de ${prepTotal} listas</strong><span id="prepProgressHint">Completá todo para sellar tus respuestas.</span></div>
        <div class="prep-progress-track"><i id="prepProgressBar"></i></div>
        <b id="prepProgressPct">0%</b>
      </div>

      <div class="prep-block">
        <div class="prep-block-head"><span>01</span><div><strong>Tus historias</strong><small>3 respuestas · alimentan ¿Quién fue?</small></div><em>3</em></div>
        ${r.prepPrompts.storyPrompts.map((q,i)=>`<label>${esc(q)}</label><textarea id="story${i}" data-prep-field placeholder="Algo concreto, corto y reconocible…"></textarea>`).join("")}
      </div>

      <div class="prep-block">
        <div class="prep-block-head"><span>02</span><div><strong>Verdad o mentira</strong><small>2 respuestas · alimentan El Mentiroso</small></div><em>2</em></div>
        <label>Una verdad sorprendente sobre vos</label><textarea id="truth" data-prep-field placeholder="Algo real que pueda generar dudas…"></textarea>
        <label>Una mentira creíble sobre vos</label><textarea id="lie" data-prep-field placeholder="Tiene que sonar perfectamente posible…"></textarea>
      </div>

      <div class="prep-block">
        <div class="prep-block-head"><span>03</span><div><strong>Leé al grupo</strong><small>3 votos secretos · construyen la mayoría real</small></div><em>3</em></div>
        ${r.prepPrompts.majorityPrompts.map((q,i)=>`<label>${esc(q)}</label><select id="maj${i}" data-prep-field><option value="">Elegí a alguien…</option>${opts}</select>`).join("")}
      </div>

      <div class="prep-two">
        <div class="prep-block compact"><div class="prep-block-head"><span>04</span><div><strong>Silla Caliente</strong><small>1 respuesta personal</small></div><em>1</em></div><label>${esc(r.prepPrompts.hotSeatPrompt)}</label><input id="hotSeat" data-prep-field placeholder="Tu respuesta corta"></div>
        <div class="prep-block compact"><div class="prep-block-head"><span>05</span><div><strong>Todos contra uno</strong><small>1 respuesta para que intenten leerte</small></div><em>1</em></div><label>${esc(r.prepPrompts.oneVsAllPrompt)}</label><input id="oneVsAll" data-prep-field placeholder="Tu respuesta corta"></div>
      </div>

      ${surprise?`<div class="prep-block surprise-memory-block">
        <div class="prep-block-head"><span>✦</span><div><strong>Un recuerdo con ${esc(r.surprise.honoreeName)}</strong><small>Solo el grupo ve esta consigna. Puede aparecer como ronda sorpresa.</small></div><em>1</em></div>
        <label>Contá algo concreto que hayan vivido con ${esc(r.surprise.honoreeName)}.</label>
        <textarea id="surpriseMemory" data-prep-field placeholder="Ej: En Bariloche perdió el micro porque se quedó comprando chocolate…"></textarea>
      </div>`:""}

      <div class="privacy-promise"><span>◉</span><div><strong>Queda sellado.</strong><p>Durante la partida nadie ve tus respuestas completas ni el ranking acumulado. Todo se revela recién al terminar.</p></div></div>
      <button class="primary wide big-action seal-button" id="submitPrep" disabled>Completar las ${prepTotal} respuestas <span>✦</span></button>
      <div class="draft-note" id="draftNote">Tus respuestas se guardan en este dispositivo mientras completás el formulario.</div>
    </section>
    ${hostRoster(r)}
  </div>`;

  const fields=[...document.querySelectorAll("[data-prep-field]")];
  const draftKey="lj_prep_"+r.code+"_"+(r.me?.id||"me");
  try{
    const draft=JSON.parse(localStorage.getItem(draftKey)||"{}");
    fields.forEach(el=>{if(Object.prototype.hasOwnProperty.call(draft,el.id))el.value=draft[el.id]||""});
  }catch{}
  const updatePrepProgress=()=>{
    const done=fields.filter(el=>String(el.value||"").trim()).length,total=fields.length,p=Math.round(done/Math.max(1,total)*100);
    const bar=document.querySelector("#prepProgressBar"),pctEl=document.querySelector("#prepProgressPct"),label=document.querySelector("#prepProgressLabel"),hint=document.querySelector("#prepProgressHint"),btn=document.querySelector("#submitPrep");
    if(bar)bar.style.width=p+"%";if(pctEl)pctEl.textContent=p+"%";if(label)label.textContent=done+" de "+total+" listas";
    if(hint)hint.textContent=done===total?"Listo. Ya podés sellarlas.":"Te faltan "+(total-done)+" respuestas.";
    if(btn){btn.disabled=done!==total;btn.innerHTML=done===total?'Sellar mis respuestas <span>✦</span>':'Completar las '+total+' respuestas <span>✦</span>'}
    const draft={};fields.forEach(el=>draft[el.id]=el.value);try{localStorage.setItem(draftKey,JSON.stringify(draft))}catch{}
  };
  fields.forEach(el=>{el.addEventListener("input",updatePrepProgress);el.addEventListener("change",updatePrepProgress)});
  updatePrepProgress();

  document.querySelector("#submitPrep").onclick=async()=>{try{
    const body={
      stories:[document.querySelector("#story0").value,document.querySelector("#story1").value,document.querySelector("#story2").value],
      truth:document.querySelector("#truth").value,lie:document.querySelector("#lie").value,
      majority:[document.querySelector("#maj0").value,document.querySelector("#maj1").value,document.querySelector("#maj2").value],
      hotSeatAnswer:document.querySelector("#hotSeat").value,oneVsAllAnswer:document.querySelector("#oneVsAll").value,
      surpriseMemory:document.querySelector("#surpriseMemory")?.value||""
    };
    await api("/api/rooms/"+r.code+"/submissions",{method:"POST",body:JSON.stringify(body)});try{localStorage.removeItem(draftKey)}catch{}refresh()
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
  app.innerHTML=`<div class="room-page"><section class="card center"><div class="kicker">CONTINUANDO</div><h2>La partida ahora es gratis completa.</h2><p>Actualizando esta sala…</p></section></div>`;
  setTimeout(refresh,600);
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
  const ranking=[...r.players].sort((a,b)=>(b.score||0)-(a.score||0));
  const first=ranking[0],second=ranking[1],third=ranking[2],f=r.finale||{};
  const podium=[
    second?{p:second,place:2,medal:"II"}:null,
    first?{p:first,place:1,medal:"✦"}:null,
    third?{p:third,place:3,medal:"III"}:null
  ].filter(Boolean);

  const awards=(f.awards||[]).map((aw,i)=>`<article class="final-award" style="--award-i:${i}">
    <div class="award-symbol">${esc(aw.icon)}</div>
    <small>${esc(aw.title)}</small>
    <strong>${esc((aw.players||[]).join(" + "))}</strong>
    <b>${esc(aw.label||"")}</b>
    <p>${esc(aw.description||"")}</p>
  </article>`).join("");

  const stats=[
    {n:f.roundsPlayed??r.totalRounds,label:"rondas jugadas"},
    {n:f.modesPlayed??"—",label:"modos distintos"},
    {n:f.totalVotes??"—",label:"votos enviados"},
    {n:(f.accuracy??0)+"%",label:"aciertos directos"},
    {n:f.missionsCompleted??0,label:"misiones cumplidas"},
    {n:f.totalPoints??ranking.reduce((n,p)=>n+(p.score||0),0),label:"puntos repartidos"}
  ].map(x=>`<div class="final-stat"><strong>${x.n}</strong><span>${x.label}</span></div>`).join("");

  const winnerLine=ranking.length>1&&f.winnerMargin===0
    ?`Empate en la cima con ${first?.score||0} puntos.`
    :`${esc(first?.name||"")} terminó ${f.winnerMargin||0} puntos arriba del segundo puesto.`;

  app.innerHTML=`<div class="room-page finished-page">
    ${brand()}
    <section class="finish-hero finish-show">
      <div class="final-glow"></div>
      <div class="confetti-field final-confetti" aria-hidden="true">${Array.from({length:32},(_,i)=>`<i style="--i:${i}"></i>`).join("")}</div>
      <div class="kicker">SE TERMINÓ ESTA JUNTADA</div>
      <div class="champion-crown">✦</div>
      <h1><span class="grad">${esc(first?.name||"")}</span><br><small>CAMPEÓN DE LA JUNTADA</small></h1>
      <div class="champion-score"><strong>${first?.score||0}</strong><span>puntos</span></div>
      <p>${winnerLine}</p>
      <div class="final-share-row">
        <button class="secondary" id="shareFinal">Compartir resultado</button>
        <button class="ghost" id="jumpAnswers">Ver todas las respuestas ↓</button>
      </div>
    </section>

    <section class="podium final-podium">
      ${podium.map(x=>`<div class="podium-person place-${x.place}">
        <span class="podium-medal">${x.medal}</span>
        <div class="podium-avatar">${esc(x.p.name).slice(0,1).toUpperCase()}</div>
        <small>#${x.place}</small>
        <strong>${esc(x.p.name)}</strong>
        <b>${x.p.score||0}</b>
        <em>puntos</em><i></i>
      </div>`).join("")}
    </section>

    <section class="final-numbers">
      <div class="final-section-head"><div><div class="kicker">LA PARTIDA EN NÚMEROS</div><h2>Todo lo que pasó.</h2></div><span>${esc(r.theme.title)}</span></div>
      <div class="final-stats-grid">${stats}</div>
    </section>

    ${awards?`<section class="final-awards-section">
      <div class="final-section-head"><div><div class="kicker">PREMIOS DE LA JUNTADA</div><h2>No todo era salir primero.</h2></div><span>Basados en lo que pasó de verdad</span></div>
      <div class="final-awards-grid">${awards}</div>
    </section>`:""}

    <section class="card final-ranking upgraded-ranking">
      <div class="final-section-head compact"><div><div class="kicker">RANKING COMPLETO</div><h2>Así terminó.</h2></div><span>Puntaje final desbloqueado</span></div>
      <div class="score-list">${scoreRows(r.players)}</div>
    </section>

    <div id="finalAnswers">${answersArchive(r)}</div>

    <section class="final-again card">
      <div>
        <div class="kicker">¿OTRA?</div>
        <h2>Esta ya quedó en el archivo.</h2>
        <p>Podés jugar una revancha con el mismo grupo y consignas nuevas, o arrancar una juntada completamente distinta.</p>
      </div>
      <div class="final-actions">
        ${r.isHost?'<button class="primary" id="restart">Revancha con este grupo <span>→</span></button>':""}
        <button class="ghost" id="newJuntada">Crear otra Juntada</button>
      </div>
    </section>
    <section class="final-support">
      <div><span>♥</span><p><strong>¿La pasaron bien?</strong><small>La Juntada es gratis. Si querés ayudar a que siga creciendo, podés aportar de forma opcional.</small></p></div>
      <button class="ghost" id="donateFinal">Apoyar La Juntada</button>
    </section>
  </div>`;

  document.querySelector("#shareFinal").onclick=async()=>{
    const top3=ranking.slice(0,3).map((p,i)=>`${i+1}. ${p.name} — ${p.score||0} pts`).join("\n");
    const text=`🏆 La Juntada · ${r.name}\nGanó ${first?.name||""} con ${first?.score||0} puntos.\n\n${top3}\n\n${f.roundsPlayed||r.totalRounds} rondas · ${f.totalVotes||0} votos · ${f.missionsCompleted||0} misiones cumplidas`;
    try{
      if(navigator.share)await navigator.share({title:"La Juntada",text});
      else{await navigator.clipboard.writeText(text);toast("Resultado copiado")}
    }catch(e){if(e?.name!=="AbortError")try{await navigator.clipboard.writeText(text);toast("Resultado copiado")}catch{}}
  };
  document.querySelector("#jumpAnswers").onclick=()=>document.querySelector("#finalAnswers")?.scrollIntoView({behavior:"smooth",block:"start"});
  document.querySelector("#newJuntada").onclick=async()=>{stopPoll();clearSession();history.replaceState(null,"",location.pathname);await home();window.scrollTo({top:0,behavior:"smooth"})};
  document.querySelector("#donateFinal")?.addEventListener("click",openDonationModal);
  if(r.isHost)document.querySelector("#restart").onclick=async()=>{try{
    const b=document.querySelector("#restart");b.disabled=true;b.innerHTML='Preparando revancha… <span>✦</span>';
    await api("/api/rooms/"+r.code+"/restart",{method:"POST"});refresh()
  }catch(e){toast(e.message);refresh()}};
}
async function leaveCurrentRoom(){
  const r=state.room;if(!r){stopPoll();clearSession();await home();return}
  const msg=r.isHost?"¿Terminar esta partida? La sala se cerrará para todos.":"¿Salir de este grupo y volver al inicio?";
  if(!confirm(msg))return;
  try{await api("/api/rooms/"+r.code+"/leave",{method:"POST"})}catch(e){if(!/inexistente|Sesión/i.test(e.message||""))toast(e.message)}
  stopPoll();clearSession();history.replaceState(null,"",location.pathname);await home();window.scrollTo({top:0,behavior:"smooth"});toast(r.isHost?"Partida terminada":"Saliste del grupo");
}
function renderRoom(){const r=state.room;if(!r)return;if(r.state!=="starting"&&window.__launchTimer){clearInterval(window.__launchTimer);window.__launchTimer=null;document.body.classList.remove("launch-hit")}if(r.state==="lobby")lobby(r);else if(r.state==="collecting")collecting(r);else if(r.state==="starting")starting(r);else if(r.state==="playing")playing(r);else if(r.state==="paywall")paywall(r);else finished(r);document.querySelectorAll(".leave-room").forEach(b=>b.onclick=leaveCurrentRoom)}
document.addEventListener("click",e=>{
  const create=e.target.closest?.("#createBtn");
  if(create){
    e.preventDefault();
    e.stopPropagation();
    createRoom();
  }
});

(async()=>{
  await loadConfig();await loadAccess();
  const params=new URLSearchParams(location.search),q=params.get("code"),honoree=params.get("honoree"),
    paymentOrder=params.get("payment_order"),paymentReturn=params.get("payment_return"),
    c=localStorage.getItem("ln_code"),t=localStorage.getItem("ln_token");
  if(q&&honoree){
    clearSession();
    await home();
    openJoinFlow(q);
    prepareHonoreeInviteUI(q,honoree);
  }else if(c&&t){
    state.code=c;state.token=t;startPoll();
    if(paymentOrder)setTimeout(()=>handlePaymentReturn(paymentOrder,paymentReturn||"checking"),350);
  }else{
    await home();
    if(q)openJoinFlow(q);
    if(paymentOrder)setTimeout(()=>handlePaymentReturn(paymentOrder,paymentReturn||"checking"),350);
  }
})();
