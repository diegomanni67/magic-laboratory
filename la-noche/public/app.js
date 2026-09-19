const app=document.querySelector("#app"),toastEl=document.querySelector("#toast");
const state={code:null,token:null,room:null,poll:null,lastKey:"",config:null};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(m){toastEl.textContent=m;toastEl.classList.add("show");setTimeout(()=>toastEl.classList.remove("show"),2500)}
function brand(){return '<div class="brand"><div class="logo">LA <span>NOCHE</span></div><div class="tag">Tus amigos son el juego</div></div>'}
function saveSession(c,t){localStorage.setItem("ln_code",c);localStorage.setItem("ln_token",t);state.code=c;state.token=t}
function clearSession(){localStorage.removeItem("ln_code");localStorage.removeItem("ln_token");state.code=null;state.token=null;state.room=null}
async function api(url,o={}){const h={"Content-Type":"application/json",...(o.headers||{})};if(state.token)h.Authorization="Bearer "+state.token;const r=await fetch(url,{...o,headers:h});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"Algo salió mal");return d}
function stopPoll(){if(state.poll)clearInterval(state.poll);state.poll=null}
function startPoll(){stopPoll();refresh();state.poll=setInterval(refresh,850)}
async function loadConfig(){if(!state.config)state.config=await api("/api/config")}
function themeCards(){return state.config.themes.map(t=>`<label class="theme-card ${t.premiumOnly?"premium-locked":""}"><input type="radio" name="theme" value="${t.id}" ${t.id==="clasico"?"checked":""} ${t.premiumOnly?"disabled":""}><span class="theme-emoji">${t.emoji}</span><strong>${esc(t.title)}</strong><small>${esc(t.description)}</small>${t.premiumOnly?'<em>🔒 PREMIUM +18</em>':t.age18?'<em>18+</em>':""}${t.premiumOnly?'<span class="premium-note">Sin ronda gratis · requiere compra o pase activo</span>':""}</label>`).join("")}

async function home(){
  stopPoll();clearSession();await loadConfig();
  app.innerHTML=brand()+`
  <section class="hero"><div class="eyebrow">🎮 UNA NOCHE HECHA SOBRE TU GRUPO</div><h1>Elegí el mood.<br><span class="grad">El grupo crea el juego.</span></h1><p class="lead">Todos aportan historias y respuestas en secreto. Nadie puede verlas antes. El sistema arma minijuegos, calcula los puntos automáticamente y revela todo recién al final.</p></section>
  <section class="card"><div class="kicker">1 · CUÁNDO</div><div class="section-title">¿Cuándo van a jugar?</div>
    <div class="choice-grid">
      <label class="choice-card"><input type="radio" name="when" value="now" checked><strong>⚡ Jugar ahora</strong><span>Están juntos. Entran, responden y arrancan.</span></label>
      <label class="choice-card"><input type="radio" name="when" value="later"><strong>📅 Preparar para una fecha</strong><span>Mandás el link durante la semana. Se suma gente hasta último momento.</span></label>
    </div>
    <div id="dateWrap" class="date-wrap"><label>Fecha de la juntada</label><input id="eventDate" type="date"></div>
  </section>
  <section class="card" style="margin-top:14px"><div class="kicker">2 · TEMÁTICA</div><div class="section-title">¿Qué tipo de noche querés?</div><div class="themes">${themeCards()}</div><label class="age-check" id="ageWrap"><input id="ageConfirmed" type="checkbox"> Confirmo que todos los participantes son mayores de 18 años.</label></section>
  <section class="card accent" style="margin-top:14px"><div class="kicker">3 · CREAR</div><label>Nombre de la juntada</label><input id="roomName" placeholder="Cumple de Sofi" maxlength="80"><label>Tu nombre</label><input id="hostName" placeholder="Diego" maxlength="40"><button class="primary wide" id="createBtn">Crear La Noche →</button></section>
  <section class="card" style="margin-top:14px"><div class="kicker">YA TENÉS CÓDIGO</div><div class="section-title">Entrar a una noche</div><label>Código</label><input id="joinCode" maxlength="6" placeholder="ABC123" style="text-transform:uppercase"><label>Tu nombre</label><input id="joinName" maxlength="40"><button class="secondary wide" id="joinBtn">Entrar</button></section>`;
  const refreshExtras=()=>{const when=document.querySelector('input[name="when"]:checked').value;document.querySelector("#dateWrap").classList.toggle("show",when==="later");const themeId=document.querySelector('input[name="theme"]:checked').value;const theme=state.config.themes.find(t=>t.id===themeId);document.querySelector("#ageWrap").classList.toggle("show",!!theme?.age18)};
  document.querySelectorAll('input[name="when"],input[name="theme"]').forEach(x=>x.onchange=refreshExtras);refreshExtras();
  document.querySelector("#createBtn").onclick=createRoom;document.querySelector("#joinBtn").onclick=joinRoom;
}
async function createRoom(){try{const d=await api("/api/rooms",{method:"POST",body:JSON.stringify({name:document.querySelector("#roomName").value,hostName:document.querySelector("#hostName").value,themeId:document.querySelector('input[name="theme"]:checked').value,playWhen:document.querySelector('input[name="when"]:checked').value,eventDate:document.querySelector("#eventDate").value,ageConfirmed:document.querySelector("#ageConfirmed").checked})});saveSession(d.code,d.sessionToken);startPoll()}catch(e){toast(e.message)}}
async function joinRoom(){try{const c=document.querySelector("#joinCode").value.trim().toUpperCase();state.code=c;const d=await api("/api/rooms/"+c+"/join",{method:"POST",body:JSON.stringify({name:document.querySelector("#joinName").value})});saveSession(d.code,d.sessionToken);if(d.lateJoin)toast("Entraste a una partida en curso");startPoll()}catch(e){toast(e.message)}}
async function refresh(){if(!state.code)return;try{const r=await api("/api/rooms/"+state.code);state.room=r;const k=JSON.stringify(r);if(k!==state.lastKey){state.lastKey=k;renderRoom()}}catch(e){if(/inexistente|Sesión/.test(e.message)){home();toast(e.message)}}}

function chips(r){return r.players.map(p=>`<span class="chip ${p.ready?"ready":""}"><span class="dot"></span>${esc(p.name)}${p.id===r.me?.id?" · vos":""}${p.isHost?" · host":""}</span>`).join("")}
function roomHeader(r){return `<div class="statusbar"><div><div class="kicker">${r.theme.emoji} ${esc(r.theme.title)}</div><div class="section-title">${esc(r.name)}</div></div><span class="pill">${r.players.length} jugadores</span></div>`}
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
  app.innerHTML=brand()+`<section class="card accent">${roomHeader(r)}<div class="code">${r.code}</div><div class="share">Compartí este link o QR. La sala sigue aceptando gente.</div><div class="actions invite-actions"><button class="secondary" id="copyLink">🔗 Link</button><button class="ghost" id="copyCode">Código</button><button class="ghost" id="showQr">▦ QR</button></div><div class="qr-panel" id="qrPanel"><img class="qr-image" src="/api/qr/${r.code}"><div class="qr-code-label">${r.code}</div></div><div class="divider"></div><div class="players">${chips(r)}</div>${r.isHost?'<div class="divider"></div><button class="primary wide" id="startCollect">Empezar preparación →</button>':'<div class="divider"></div><div class="center muted">Esperando al host…</div>'}</section>${hostRoster(r)}`;
  if(r.isHost)document.querySelector("#startCollect").onclick=async()=>{try{await api("/api/rooms/"+r.code+"/start-collecting",{method:"POST"});refresh()}catch(e){toast(e.message)}};
  document.querySelector("#copyLink").onclick=async()=>{const u=location.origin+"?code="+r.code;try{await navigator.clipboard.writeText(u);toast("Link copiado")}catch{prompt("Copiá:",u)}};
  document.querySelector("#copyCode").onclick=async()=>{try{await navigator.clipboard.writeText(r.code);toast("Código copiado")}catch{}};
  document.querySelector("#showQr").onclick=()=>document.querySelector("#qrPanel").classList.toggle("open");
  bindHostRoster(r);
}
function collecting(r){
  if(r.me?.ready){
    app.innerHTML=brand()+`<section class="card center">${roomHeader(r)}<div class="big-num">✓</div><div class="section-title">Tus respuestas quedaron selladas.</div><p class="muted">${r.playWhen==="later"?"Podés cerrar la página y volver el día de la juntada. Nadie puede leer tus respuestas.":"Esperando al resto. Nadie puede leer tus respuestas."}</p><div class="players">${chips(r)}</div>${r.isHost?'<div class="divider"></div><button class="primary wide" id="startGame" '+(r.players.length<3||r.players.some(p=>!p.ready)?"disabled":"")+'>Armar y empezar la partida</button>':""}</section>${hostRoster(r)}`;
    if(r.isHost&&document.querySelector("#startGame"))document.querySelector("#startGame").onclick=async()=>{try{await api("/api/rooms/"+r.code+"/start-game",{method:"POST"});refresh()}catch(e){toast(e.message)}};
    bindHostRoster(r);return;
  }
  const opts=r.players.map(p=>`<option value="${p.id}">${esc(p.name)}${p.id===r.me?.id?" (vos)":""}</option>`).join("");
  app.innerHTML=brand()+`<section class="card">${roomHeader(r)}<div class="kicker">PREPARACIÓN SECRETA</div><p class="muted">Ni siquiera el host puede leer esto. Tus respuestas quedan selladas hasta que termine toda la partida.</p>
  ${r.prepPrompts.storyPrompts.map((q,i)=>`<label>${esc(q)}</label><textarea id="story${i}" placeholder="Escribí algo concreto y reconocible…"></textarea>`).join("")}
  <div class="divider"></div><label>Una verdad sorprendente sobre vos</label><textarea id="truth"></textarea><label>Una mentira creíble sobre vos</label><textarea id="lie"></textarea>
  <div class="divider"></div><div class="section-title">Leé al grupo</div>${r.prepPrompts.majorityPrompts.map((q,i)=>`<label>${esc(q)}</label><select id="maj${i}"><option value="">Elegí a alguien…</option>${opts}</select>`).join("")}
  <div class="divider"></div><div class="section-title">Silla Caliente</div><label>${esc(r.prepPrompts.hotSeatPrompt)}</label><input id="hotSeat" placeholder="Tu respuesta corta">
  <div class="divider"></div><div class="section-title">Todos contra uno</div><label>${esc(r.prepPrompts.oneVsAllPrompt)}</label><input id="oneVsAll" placeholder="Tu respuesta corta">
  <button class="primary wide" id="submitPrep" style="margin-top:18px">Sellar mis respuestas</button></section>${hostRoster(r)}`;
  document.querySelector("#submitPrep").onclick=async()=>{try{const body={stories:[document.querySelector("#story0").value,document.querySelector("#story1").value,document.querySelector("#story2").value],truth:document.querySelector("#truth").value,lie:document.querySelector("#lie").value,majority:[document.querySelector("#maj0").value,document.querySelector("#maj1").value,document.querySelector("#maj2").value],hotSeatAnswer:document.querySelector("#hotSeat").value,oneVsAllAnswer:document.querySelector("#oneVsAll").value};await api("/api/rooms/"+r.code+"/submissions",{method:"POST",body:JSON.stringify(body)});refresh()}catch(e){toast(e.message)}};
  bindHostRoster(r);
}
function playing(r){
  const x=r.round;if(!x)return;
  const locked=x.locked||r.roundPhase==="locked";
  app.innerHTML=brand()+`<div class="statusbar"><div><div class="kicker">${x.modeEmoji} ${esc(x.modeTitle)}</div><div class="tiny muted">${esc(r.theme.title)} · Ronda ${r.currentRound+1}/${r.totalRounds}</div></div><span class="pill">${x.voteCount}/${x.eligibleVoters} votos</span></div>
  <section class="card prompt-card"><div class="tiny muted">${esc(x.prompt)}</div><div class="statement">“${esc(x.statement)}”</div>
  ${locked?'<div class="locked-round"><div class="big-num">✓</div><strong>Votos cerrados</strong><span>Los puntos ya fueron calculados en secreto. La respuesta se revela al terminar La Noche.</span></div>':x.skipVote?'<div class="example-box"><strong>Esta ronda habla de vos.</strong><small>No votás. El resto está intentando adivinarte.</small></div>':`<div class="options">${(x.options||[]).map(o=>`<button class="option ${x.ownVote===o.id?"selected":""}" data-choice="${esc(o.id)}">${esc(o.label)}</button>`).join("")}</div><div class="vote-count">${x.ownVote?"Tu voto quedó guardado. Podés cambiarlo hasta que cierre la ronda.":"Tocá una opción para votar."}</div>`}
  </section>
  ${r.mission?`<section class="card soft" style="margin-top:14px"><div class="kicker">💣 TU MISIÓN SECRETA</div><div class="section-title">${esc(r.mission.text)}</div></section>`:""}
  <section class="card soft hidden-score" style="margin-top:14px"><div class="kicker">🏆 PUNTAJE SELLADO</div><div class="section-title">Nadie sabe quién va ganando.</div><div class="muted">El ranking y todas las respuestas se revelan juntos al final.</div></section>
  ${hostRoster(r)}`;
  if(!locked&&!x.skipVote)document.querySelectorAll(".option").forEach(b=>b.onclick=async()=>{try{await api("/api/rooms/"+r.code+"/vote",{method:"POST",body:JSON.stringify({choice:b.dataset.choice})});refresh()}catch(e){toast(e.message)}});
  bindHostRoster(r);
}
function paywall(r){
  const plans=state.config.accessPlans||[];
  app.innerHTML=brand()+`<section class="card center paywall"><div class="big-num">🔥</div><div class="section-title">La primera ronda terminó.</div><p class="lead" style="margin-left:auto;margin-right:auto">Los puntos quedaron guardados. Tu grupo generó <strong>${Math.max(0,r.totalRounds-1)} rondas más</strong>.</p>
  <div class="access-plans">${plans.map((p,i)=>`<label class="access-plan"><input type="radio" name="accessPlan" value="${p.id}" ${i===1?"checked":""}><div><strong>${esc(p.title)}</strong><span>${esc(p.description)}</span></div>${p.unlimited?'<em>ILIMITADO</em>':""}</label>`).join("")}</div>
  <div class="group-note"><strong>💸 También sirve para comprar entre amigos</strong><span>Una sola cuenta compra el pase. Esa persona puede crear las partidas y todos los invitados juegan gratis.</span></div>
  <div class="divider"></div>${r.isHost?'<button class="primary wide" id="unlockTest">Probar el plan seleccionado →</button><div class="tiny muted" style="margin-top:10px">Todavía no cobra: estamos probando la lógica antes de conectar Mercado Pago y cuentas.</div>':'<div class="muted">Esperando que el host desbloquee La Noche…</div>'}</section>${hostRoster(r)}`;
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
  app.innerHTML=brand()+`<section class="hero center"><div class="eyebrow">🏆 FIN DE LA NOCHE</div><h1><span class="grad">${esc(s[0]?.name||"")}</span><br>ganó.</h1><p class="lead" style="margin-left:auto;margin-right:auto">Ahora sí se abren el ranking y todas las respuestas.</p></section><section class="card"><div class="section-title">Ranking final</div><div class="score-list">${scoreRows(r.players)}</div>${r.isHost?'<div class="divider"></div><button class="primary wide" id="restart">Preparar otra partida</button>':""}</section>${answersArchive(r)}`;
  if(r.isHost)document.querySelector("#restart").onclick=async()=>{try{await api("/api/rooms/"+r.code+"/restart",{method:"POST"});refresh()}catch(e){toast(e.message)}}
}
function renderRoom(){const r=state.room;if(!r)return;if(r.state==="lobby")lobby(r);else if(r.state==="collecting")collecting(r);else if(r.state==="playing")playing(r);else if(r.state==="paywall")paywall(r);else finished(r)}
(async()=>{await loadConfig();const q=new URLSearchParams(location.search).get("code"),c=localStorage.getItem("ln_code"),t=localStorage.getItem("ln_token");if(c&&t){state.code=c;state.token=t;startPoll()}else{await home();if(q)document.querySelector("#joinCode").value=q}})();
