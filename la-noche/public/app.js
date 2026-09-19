const app = document.querySelector("#app");
const toastEl = document.querySelector("#toast");
const state = { code: null, token: null, room: null, poll: null, lastKey: "" };

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(msg){ toastEl.textContent=msg;toastEl.classList.add("show");setTimeout(()=>toastEl.classList.remove("show"),2500); }
function brand(){ return '<div class="brand"><div class="logo">LA <span>NOCHE</span></div><div class="tag">Tus amigos son el juego</div></div>'; }
function saveSession(code, token){ localStorage.setItem("ln_code", code);localStorage.setItem("ln_token", token);state.code=code;state.token=token; }
function clearSession(){ localStorage.removeItem("ln_code");localStorage.removeItem("ln_token");state.code=null;state.token=null;state.room=null; }
async function api(url, options={}){
  const headers = { "Content-Type":"application/json", ...(options.headers||{}) };
  if(state.token) headers.Authorization = "Bearer "+state.token;
  const r=await fetch(url,{...options,headers});
  const data=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data.error||"Algo salió mal");
  return data;
}
function stopPoll(){ if(state.poll) clearInterval(state.poll);state.poll=null; }
function startPoll(){ stopPoll();refresh();state.poll=setInterval(refresh,1200); }
function home(){
  stopPoll();clearSession();
  app.innerHTML = brand()+`
    <section class="hero">
      <div class="eyebrow">⚡ Cero preguntas genéricas</div>
      <h1>Esta vez, <span class="grad">ustedes son el juego.</span></h1>
      <p class="lead">Creá una sala. Tus amigos cargan secretos, verdades y votos. Después nadie sabe qué dijo quién.</p>
      <div class="actions hero-actions"><button class="ghost" id="howBtn">▶ Cómo se juega</button><button class="secondary" id="demoBtn">Probar una ronda</button></div>
    </section>
    <section class="demo-card" id="demoCard">
      <div class="kicker">RONDA DE EJEMPLO</div>
      <div class="section-title">¿Quién escribió esto?</div>
      <div class="statement demo-statement">“Una vez me bajé del colectivo en la ciudad equivocada y no se lo conté a nadie.”</div>
      <div class="vote-help">Imaginá que estás jugando con tus amigos. Tocá a quien creés que lo escribió.</div>
      <div class="options demo-options">
        <button class="option demo-opt" data-name="Sofi">Sofi</button>
        <button class="option demo-opt" data-name="Nico">Nico</button>
        <button class="option demo-opt" data-name="Diego">Diego</button>
        <button class="option demo-opt" data-name="Mica">Mica</button>
      </div>
      <div id="demoResult" class="demo-result"></div>
    </section>
    <section class="howto" id="howto">
      <div class="how-step"><div class="how-num">1</div><div><strong>Uno crea la sala</strong><span>Comparte un link o código. Nadie instala nada.</span></div></div>
      <div class="how-step"><div class="how-num">2</div><div><strong>Cada uno entra desde su celular</strong><span>Abren la web en Chrome o Safari, ponen su nombre y responden en secreto.</span></div></div>
      <div class="how-step"><div class="how-num">3</div><div><strong>La web arma el juego</strong><span>Ejemplo: “Una vez me quedé dormido en un colectivo y terminé en otra ciudad”.</span></div></div>
      <div class="how-step"><div class="how-num">4</div><div><strong>Todos votan tocando la pantalla</strong><span>¿Quién lo dijo? Tocás “Sofi”, “Nico”, “Diego”… y la respuesta queda registrada al instante.</span></div></div>
      <div class="how-step"><div class="how-num">5</div><div><strong>Se revela y suma puntos</strong><span>Todos ven quién era, quién acertó y el ranking.</span></div></div>
    </section>
    <div class="grid two">
      <section class="card accent">
        <div class="kicker">HOST</div><div class="section-title">Crear una noche</div>
        <label>Nombre de la juntada</label><input id="roomName" placeholder="Cumple de Sofi" maxlength="80">
        <label>Tu nombre</label><input id="hostName" placeholder="Diego" maxlength="40">
        <button class="primary wide" id="createBtn">Crear sala →</button>
      </section>
      <section class="card">
        <div class="kicker">INVITADO</div><div class="section-title">Entrar con código</div>
        <label>Código de 6 caracteres</label><input id="joinCode" placeholder="ABC123" maxlength="6" style="text-transform:uppercase">
        <label>Tu nombre</label><input id="joinName" placeholder="Tu nombre" maxlength="40">
        <button class="secondary wide" id="joinBtn">Entrar</button>
      </section>
    </div>
    <div class="footer-note">MVP privado · sin cuentas · sin instalar nada</div>`;
  document.querySelector("#createBtn").onclick=createRoom;
  document.querySelector("#joinBtn").onclick=joinRoom;
  document.querySelector("#howBtn").onclick=()=>document.querySelector("#howto").classList.toggle("open");
  document.querySelector("#demoBtn").onclick=()=>document.querySelector("#demoCard").classList.toggle("open");
  document.querySelectorAll(".demo-opt").forEach(btn=>btn.onclick=()=>{
    document.querySelectorAll(".demo-opt").forEach(b=>b.classList.remove("selected","correct"));
    btn.classList.add("selected");
    const result=document.querySelector("#demoResult");
    if(btn.dataset.name==="Nico"){
      btn.classList.add("correct");
      result.innerHTML='<strong>✅ Era Nico.</strong><span>Acertaste. En la partida real sumarías puntos.</span>';
    }else{
      result.innerHTML='<strong>❌ No era '+esc(btn.dataset.name)+'. Era Nico.</strong><span>Eso mismo pasa en vivo con las respuestas reales del grupo.</span>';
    }
    result.classList.add("show");
  });
}
async function createRoom(){
  try{
    const name=document.querySelector("#roomName").value,hostName=document.querySelector("#hostName").value;
    const d=await api("/api/rooms",{method:"POST",body:JSON.stringify({name,hostName})});
    saveSession(d.code,d.sessionToken);startPoll();
  }catch(e){toast(e.message)}
}
async function joinRoom(){
  try{
    const code=document.querySelector("#joinCode").value.trim().toUpperCase(),name=document.querySelector("#joinName").value;
    state.code=code;
    const d=await api("/api/rooms/"+code+"/join",{method:"POST",body:JSON.stringify({name})});
    saveSession(d.code,d.sessionToken);startPoll();
  }catch(e){toast(e.message)}
}
async function refresh(){
  if(!state.code) return;
  try{
    const room=await api("/api/rooms/"+state.code);
    state.room=room;
    const key=JSON.stringify([room.state,room.roundPhase,room.currentRound,room.players.map(p=>[p.id,p.ready,p.score]),room.round?.id,room.round?.voteCount,room.round?.ownVote,room.round?.correctAnswer]);
    if(key!==state.lastKey){state.lastKey=key;renderRoom();}
  }catch(e){
    if(/inexistente|Sesión/.test(e.message)){home();toast(e.message)}
  }
}
function playerChips(room){
  return room.players.map(p=>`<span class="chip ${p.ready?'ready':''}"><span class="dot"></span>${esc(p.name)}${p.id===room.me?.id?' · vos':''}</span>`).join("");
}
function lobby(room){
  app.innerHTML=brand()+`
    <section class="card accent">
      <div class="statusbar"><div><div class="kicker">SALA</div><div class="section-title">${esc(room.name)}</div></div><span class="pill">${room.players.length} jugadores</span></div>
      <div class="code">${room.code}</div>
      <div class="share">Compartí el link o este código. Cada persona juega desde su propio celular.</div>
      <div class="actions invite-actions">
        <button class="secondary" id="copyLink">🔗 Copiar link</button>
        <button class="ghost" id="copyCode">Copiar código</button>
        <button class="ghost" id="showQr">▦ Mostrar QR</button>
      </div>
      <div class="qr-panel" id="qrPanel">
        <div class="kicker">ESCANEÁ Y ENTRÁ</div>
        <img class="qr-image" src="/api/qr/${room.code}" alt="QR para entrar a la sala">
        <div class="qr-code-label">${room.code}</div>
        <div class="muted tiny">Abrí la cámara del celular, escaneá el QR y entrás directo a esta sala.</div>
      </div>
      <div class="mini-demo"><strong>¿Cómo votan?</strong><span>Cuando empieza una ronda, a cada jugador le aparecen botones con los nombres. Toca uno y listo.</span></div>
      <div class="divider"></div>
      <div class="players">${playerChips(room)}</div>
      ${room.isHost?'<div class="divider"></div><button class="primary wide" id="startCollect">Cerrar sala y cargar secretos →</button>':'<div class="divider"></div><div class="center muted">Esperando que el host empiece…</div>'}
    </section>
    <button class="ghost wide" id="leave" style="margin-top:14px">Salir de la sala</button>`;
  if(room.isHost) document.querySelector("#startCollect").onclick=async()=>{try{await api("/api/rooms/"+room.code+"/start-collecting",{method:"POST"});refresh()}catch(e){toast(e.message)}};
  document.querySelector("#copyLink").onclick=async()=>{const url=location.origin+"?code="+room.code;try{await navigator.clipboard.writeText(url);toast("Link copiado");}catch{prompt("Copiá este link:",url)}};
  document.querySelector("#copyCode").onclick=async()=>{try{await navigator.clipboard.writeText(room.code);toast("Código copiado");}catch{prompt("Copiá este código:",room.code)}};
  document.querySelector("#showQr").onclick=()=>{
    const panel=document.querySelector("#qrPanel");
    panel.classList.toggle("open");
    document.querySelector("#showQr").textContent=panel.classList.contains("open")?"Ocultar QR":"▦ Mostrar QR";
  };
  document.querySelector("#leave").onclick=home;
}
function collecting(room){
  if(room.me?.ready){
    app.innerHTML=brand()+`
      <section class="card center">
        <div class="big-num">✓</div><div class="section-title">Ya está. Nadie vio tus respuestas.</div>
        <p class="muted">Faltan ${room.players.filter(p=>!p.ready).length} por terminar.</p>
        <div class="players">${playerChips(room)}</div>
        ${room.isHost?'<div class="divider"></div><button class="primary wide" id="startGame" '+(room.players.some(p=>!p.ready)?'disabled':'')+'>Empezar la partida</button>':'<div class="divider"></div><div class="muted">Esperando al host…</div>'}
      </section>`;
    if(room.isHost) document.querySelector("#startGame").onclick=async()=>{try{await api("/api/rooms/"+room.code+"/start-game",{method:"POST"});refresh()}catch(e){toast(e.message)}};
    return;
  }
  const playerOpts=room.players.map(p=>`<option value="${p.id}">${esc(p.name)}${p.id===room.me?.id?' (vos)':''}</option>`).join("");
  app.innerHTML=brand()+`
    <section class="card">
      <div class="kicker">TODO ES SECRETO</div><div class="section-title">Dales material 😈</div>
      <p class="muted">No pongas tu nombre. Después todos van a intentar descubrir quién escribió cada cosa.</p>
      <div class="example-box"><span>EJEMPLO</span><strong>“Una vez fingí estar enfermo para no ir a un cumpleaños.”</strong><small>Más tarde esa frase puede aparecer y todos tendrán que adivinar quién la escribió.</small></div>
      <label>Algo vergonzoso que te haya pasado</label><textarea id="s1" placeholder="Ej: una vez..."></textarea>
      <label>Algo que hiciste y casi nadie sabe</label><textarea id="s2"></textarea>
      <label>Una anécdota que pueda delatarte</label><textarea id="s3"></textarea>
      <div class="divider"></div>
      <label>Una verdad sorprendente sobre vos</label><textarea id="truth"></textarea>
      <label>Una mentira creíble sobre vos</label><textarea id="lie"></textarea>
      <div class="divider"></div>
      <div class="section-title">Votá en secreto</div>
      ${room.majorityPrompts.map((q,i)=>`<label>${esc(q)}</label><select id="m${i}"><option value="">Elegí a alguien…</option>${playerOpts}</select>`).join("")}
      <button class="primary wide" id="submit" style="margin-top:18px">Guardar mis respuestas</button>
    </section>`;
  document.querySelector("#submit").onclick=async()=>{
    try{
      const payload={secrets:[s1.value,s2.value,s3.value],truth:truth.value,lie:lie.value,majority:room.majorityPrompts.map((_,i)=>document.querySelector("#m"+i).value)};
      await api("/api/rooms/"+room.code+"/submissions",{method:"POST",body:JSON.stringify(payload)});refresh();
    }catch(e){toast(e.message)}
  };
}
function optionButtons(room, round){
  if(round.mode==="truth"){
    return [{id:"true",name:"Es verdad"},{id:"false",name:"Es mentira"}];
  }
  return room.players.map(p=>({id:p.id,name:p.name}));
}
function playing(room){
  const r=room.round;
  if(!r){app.innerHTML=brand()+'<div class="card center">Preparando ronda…</div>';return;}
  const opts=optionButtons(room,r);
  const revealed=room.roundPhase==="reveal";
  const correctName = r.mode==="truth" ? (r.correctAnswer==="true"?"Era VERDAD":"Era MENTIRA") : room.players.find(p=>p.id===r.correctAnswer)?.name || "";
  app.innerHTML=brand()+`
    <div class="statusbar"><div class="tiny muted">${esc(room.name)}</div><div class="pill">Ronda ${room.currentRound+1}</div></div>
    <section class="card prompt-card">
      <div class="mode">${r.mode==="who"?"¿QUIÉN FUE?":r.mode==="truth"?"VERDAD O MENTIRA":"MAYORÍA SECRETA"}</div>
      <div class="tiny muted" style="margin-top:8px">${esc(r.prompt)}</div>
      <div class="statement">“${esc(r.statement)}”</div>
      <div class="vote-help">👇 Tocá una opción para votar. No necesitás instalar nada.</div>
      <div class="options">
        ${opts.map(o=>`<button class="option ${r.ownVote===o.id?'selected':''} ${revealed&&r.correctAnswer===o.id?'correct':''}" data-choice="${o.id}" ${revealed?'disabled':''}>${esc(o.name)}</button>`).join("")}
      </div>
      <div class="vote-count">${r.voteCount}/${room.players.length} ya votaron</div>
      ${revealed?`<div class="reveal"><div class="kicker">RESPUESTA</div><div class="section-title" style="margin-bottom:0">${esc(correctName)}</div></div>`:''}
      ${room.isHost?'<div class="divider"></div>'+(revealed?'<button class="primary wide" id="next">Siguiente ronda →</button>':'<button class="secondary wide" id="reveal">Revelar respuesta</button>'):''}
    </section>
    <section class="card soft" style="margin-top:14px"><div class="kicker">PUNTAJES</div><div class="score-list">${scoreRows(room.players)}</div></section>`;
  document.querySelectorAll(".option").forEach(b=>b.onclick=async()=>{try{await api("/api/rooms/"+room.code+"/vote",{method:"POST",body:JSON.stringify({choice:b.dataset.choice})});refresh()}catch(e){toast(e.message)}});
  if(room.isHost){
    const rev=document.querySelector("#reveal"); if(rev) rev.onclick=async()=>{try{await api("/api/rooms/"+room.code+"/reveal",{method:"POST"});refresh()}catch(e){toast(e.message)}};
    const next=document.querySelector("#next"); if(next) next.onclick=async()=>{try{await api("/api/rooms/"+room.code+"/next",{method:"POST"});refresh()}catch(e){toast(e.message)}};
  }
}
function scoreRows(players){
  return [...players].sort((a,b)=>b.score-a.score).map((p,i)=>`<div class="score-row"><div class="rank">#${i+1}</div><div class="score-name">${esc(p.name)}</div><div class="score">${p.score}</div></div>`).join("");
}
function finished(room){
  const sorted=[...room.players].sort((a,b)=>b.score-a.score);
  app.innerHTML=brand()+`
    <section class="hero center"><div class="eyebrow">🏆 PARTIDA TERMINADA</div><h1><span class="grad">${esc(sorted[0]?.name||"")}</span><br>ganó la noche.</h1></section>
    <section class="card"><div class="section-title">Ranking final</div><div class="score-list">${scoreRows(room.players)}</div>
      ${room.isHost?'<div class="divider"></div><button class="primary wide" id="restart">Jugar otra con el mismo grupo</button>':''}
    </section>
    <button class="ghost wide" id="home" style="margin-top:14px">Volver al inicio</button>`;
  if(room.isHost) document.querySelector("#restart").onclick=async()=>{try{await api("/api/rooms/"+room.code+"/restart",{method:"POST"});refresh()}catch(e){toast(e.message)}};
  document.querySelector("#home").onclick=home;
}
function renderRoom(){
  const room=state.room;if(!room)return;
  if(room.state==="lobby") lobby(room);
  else if(room.state==="collecting") collecting(room);
  else if(room.state==="playing") playing(room);
  else finished(room);
}

const codeFromUrl=new URLSearchParams(location.search).get("code");
const savedCode=localStorage.getItem("ln_code"),savedToken=localStorage.getItem("ln_token");
if(savedCode&&savedToken){state.code=savedCode;state.token=savedToken;startPoll();}
else if(codeFromUrl){home();document.querySelector("#joinCode").value=codeFromUrl;}
else home();
