const app=document.querySelector("#app"),toastEl=document.querySelector("#toast");
const state={code:null,token:null,room:null,poll:null,lastKey:"",config:null};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(m){toastEl.textContent=m;toastEl.classList.add("show");setTimeout(()=>toastEl.classList.remove("show"),2500)}
function brand(){return '<div class="brand"><div class="logo">LA <span>NOCHE</span></div><div class="tag">Tus amigos son el juego</div></div>'}
function saveSession(c,t){localStorage.setItem("ln_code",c);localStorage.setItem("ln_token",t);state.code=c;state.token=t}
function clearSession(){localStorage.removeItem("ln_code");localStorage.removeItem("ln_token");state.code=null;state.token=null;state.room=null}
async function api(url,o={}){const h={"Content-Type":"application/json",...(o.headers||{})};if(state.token)h.Authorization="Bearer "+state.token;const r=await fetch(url,{...o,headers:h});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"Algo salió mal");return d}
function stopPoll(){if(state.poll)clearInterval(state.poll);state.poll=null}
function startPoll(){stopPoll();refresh();state.poll=setInterval(refresh,1000)}
async function loadConfig(){if(!state.config)state.config=await api("/api/config")}
function themeCards(){return state.config.themes.map(t=>`<label class="theme-card"><input type="radio" name="theme" value="${t.id}" ${t.id==="clasico"?"checked":""}><span class="theme-emoji">${t.emoji}</span><strong>${esc(t.title)}</strong><small>${esc(t.description)}</small>${t.age18?'<em>18+</em>':""}</label>`).join("")}

async function home(){
  stopPoll();clearSession();await loadConfig();
  app.innerHTML=brand()+`
  <section class="hero"><div class="eyebrow">🎮 UNA NOCHE HECHA SOBRE TU GRUPO</div><h1>Elegí el mood.<br><span class="grad">El grupo crea el juego.</span></h1><p class="lead">Una persona crea la sala. Todos aportan historias y respuestas en secreto. Después La Noche mezcla distintos minijuegos y suma puntos.</p></section>
  <section class="card">
    <div class="kicker">1 · CUÁNDO</div><div class="section-title">¿Cuándo van a jugar?</div>
    <div class="choice-grid">
      <label class="choice-card"><input type="radio" name="when" value="now" checked><strong>⚡ Jugar ahora</strong><span>Están juntos. Entran, responden y arrancan.</span></label>
      <label class="choice-card"><input type="radio" name="when" value="later"><strong>📅 Preparar para una fecha</strong><span>Mandás el link antes. Cada uno responde cuando puede.</span></label>
    </div>
    <div id="dateWrap" class="date-wrap"><label>Fecha de la juntada</label><input id="eventDate" type="date"></div>
  </section>
  <section class="card" style="margin-top:14px"><div class="kicker">2 · TEMÁTICA</div><div class="section-title">¿Qué tipo de noche querés?</div><div class="themes">${themeCards()}</div><label class="age-check" id="ageWrap"><input id="ageConfirmed" type="checkbox"> Confirmo que todos los participantes son mayores de 18 años.</label></section>
  <section class="card accent" style="margin-top:14px">
    <div class="kicker">3 · CREAR</div>
    <label>Nombre de la juntada</label><input id="roomName" placeholder="Cumple de Sofi" maxlength="80">
    <label>Tu nombre</label><input id="hostName" placeholder="Diego" maxlength="40">
    <button class="primary wide" id="createBtn">Crear La Noche →</button>
  </section>
  <section class="card" style="margin-top:14px"><div class="kicker">YA TENÉS CÓDIGO</div><div class="section-title">Entrar a una noche</div><label>Código</label><input id="joinCode" maxlength="6" placeholder="ABC123" style="text-transform:uppercase"><label>Tu nombre</label><input id="joinName" maxlength="40"><button class="secondary wide" id="joinBtn">Entrar</button></section>`;
  const refreshExtras=()=>{const when=document.querySelector('input[name="when"]:checked').value;dateWrap.classList.toggle("show",when==="later");const theme=document.querySelector('input[name="theme"]:checked').value;ageWrap.classList.toggle("show",theme==="picante18")};
  document.querySelectorAll('input[name="when"],input[name="theme"]').forEach(x=>x.onchange=refreshExtras);refreshExtras();
  createBtn.onclick=createRoom;joinBtn.onclick=joinRoom;
}
async function createRoom(){try{const themeId=document.querySelector('input[name="theme"]:checked').value,playWhen=document.querySelector('input[name="when"]:checked').value;const d=await api("/api/rooms",{method:"POST",body:JSON.stringify({name:roomName.value,hostName:hostName.value,themeId,playWhen,eventDate:eventDate.value,ageConfirmed:ageConfirmed.checked})});saveSession(d.code,d.sessionToken);startPoll()}catch(e){toast(e.message)}}
async function joinRoom(){try{const c=joinCode.value.trim().toUpperCase();state.code=c;const d=await api("/api/rooms/"+c+"/join",{method:"POST",body:JSON.stringify({name:joinName.value})});saveSession(d.code,d.sessionToken);startPoll()}catch(e){toast(e.message)}}
async function refresh(){if(!state.code)return;try{const r=await api("/api/rooms/"+state.code);state.room=r;const k=JSON.stringify([r.state,r.roundPhase,r.currentRound,r.players,r.round,r.unlocked]);if(k!==state.lastKey){state.lastKey=k;renderRoom()}}catch(e){if(/inexistente|Sesión/.test(e.message)){home();toast(e.message)}}}
function chips(r){return r.players.map(p=>`<span class="chip ${p.ready?"ready":""}"><span class="dot"></span>${esc(p.name)}${p.id===r.me?.id?" · vos":""}</span>`).join("")}
function roomHeader(r){return `<div class="statusbar"><div><div class="kicker">${r.theme.emoji} ${esc(r.theme.title)}</div><div class="section-title">${esc(r.name)}</div></div><span class="pill">${r.players.length} jugadores</span></div>`}
function lobby(r){
  app.innerHTML=brand()+`<section class="card accent">${roomHeader(r)}<div class="code">${r.code}</div><div class="share">Compartí el link, código o QR.</div><div class="actions invite-actions"><button class="secondary" id="copyLink">🔗 Link</button><button class="ghost" id="copyCode">Código</button><button class="ghost" id="showQr">▦ QR</button></div><div class="qr-panel" id="qrPanel"><img class="qr-image" src="/api/qr/${r.code}"><div class="qr-code-label">${r.code}</div></div><div class="divider"></div><div class="players">${chips(r)}</div>${r.isHost?'<div class="divider"></div><button class="primary wide" id="startCollect">Empezar preparación →</button>':'<div class="divider"></div><div class="center muted">Esperando al host…</div>'}</section>`;
  if(r.isHost)startCollect.onclick=async()=>{try{await api("/api/rooms/"+r.code+"/start-collecting",{method:"POST"});refresh()}catch(e){toast(e.message)}};
  copyLink.onclick=async()=>{const u=location.origin+"?code="+r.code;try{await navigator.clipboard.writeText(u);toast("Link copiado")}catch{prompt("Copiá:",u)}};
  copyCode.onclick=async()=>{try{await navigator.clipboard.writeText(r.code);toast("Código copiado")}catch{}};
  showQr.onclick=()=>qrPanel.classList.toggle("open");
}
function collecting(r){
  if(r.me?.ready){
    const later=r.playWhen==="later";
    app.innerHTML=brand()+`<section class="card center">${roomHeader(r)}<div class="big-num">✓</div><div class="section-title">Tus respuestas quedaron guardadas.</div><p class="muted">${later?"Podés cerrar la página. El día de la juntada volvés con el mismo link.":"Esperando al resto…"}</p><div class="players">${chips(r)}</div>${r.isHost?'<div class="divider"></div><button class="primary wide" id="startGame" '+(r.players.length<3||r.players.some(p=>!p.ready)?"disabled":"")+'>Armar y empezar la partida</button>':""}</section>`;
    if(r.isHost&&document.querySelector("#startGame"))startGame.onclick=async()=>{try{await api("/api/rooms/"+r.code+"/start-game",{method:"POST"});refresh()}catch(e){toast(e.message)}};return;
  }
  const opts=r.players.map(p=>`<option value="${p.id}">${esc(p.name)}${p.id===r.me?.id?" (vos)":""}</option>`).join("");
  app.innerHTML=brand()+`<section class="card">${roomHeader(r)}<div class="kicker">PREPARACIÓN SECRETA</div><p class="muted">El host solo ve quién terminó. Nunca ve qué respondiste.</p>
  ${r.prepPrompts.storyPrompts.map((q,i)=>`<label>${esc(q)}</label><textarea id="story${i}" placeholder="Escribí algo concreto y reconocible…"></textarea>`).join("")}
  <div class="divider"></div><label>Una verdad sorprendente sobre vos</label><textarea id="truth"></textarea><label>Una mentira creíble sobre vos</label><textarea id="lie"></textarea>
  <div class="divider"></div><div class="section-title">Leé al grupo</div>${r.prepPrompts.majorityPrompts.map((q,i)=>`<label>${esc(q)}</label><select id="maj${i}"><option value="">Elegí a alguien…</option>${opts}</select>`).join("")}
  <div class="divider"></div><div class="section-title">Silla Caliente</div><label>${esc(r.prepPrompts.hotSeatPrompt)}</label><input id="hotSeat" placeholder="Tu respuesta corta">
  <div class="divider"></div><div class="section-title">Todos contra uno</div><label>${esc(r.prepPrompts.oneVsAllPrompt)}</label><input id="oneVsAll" placeholder="Tu respuesta corta">
  <button class="primary wide" id="submitPrep" style="margin-top:18px">Guardar mis respuestas</button></section>`;
  submitPrep.onclick=async()=>{try{const body={stories:[story0.value,story1.value,story2.value],truth:truth.value,lie:lie.value,majority:[maj0.value,maj1.value,maj2.value],hotSeatAnswer:hotSeat.value,oneVsAllAnswer:oneVsAll.value};await api("/api/rooms/"+r.code+"/submissions",{method:"POST",body:JSON.stringify(body)});refresh()}catch(e){toast(e.message)}}
}
function playing(r){
  const x=r.round;if(!x)return;
  const opts=x.options||[];
  app.innerHTML=brand()+`<div class="statusbar"><div><div class="kicker">${x.modeEmoji} ${esc(x.modeTitle)}</div><div class="tiny muted">${esc(r.theme.title)} · Ronda ${r.currentRound+1}/${r.totalRounds}</div></div><span class="pill">${x.voteCount}/${x.eligibleVoters} votos</span></div>
  <section class="card prompt-card"><div class="tiny muted">${esc(x.prompt)}</div><div class="statement">“${esc(x.statement)}”</div>
  ${x.skipVote?'<div class="example-box"><strong>Esta ronda habla de vos.</strong><small>No votás. Mirá cómo intenta adivinarte el resto.</small></div>':`<div class="options">${opts.map(o=>`<button class="option ${x.ownVote===o.id?"selected":""} ${r.roundPhase==="reveal"&&x.correctAnswer===o.id?"correct":""}" data-choice="${esc(o.id)}" ${r.roundPhase==="reveal"?"disabled":""}>${esc(o.label)}</button>`).join("")}</div>`}
  ${r.roundPhase==="reveal"?`<div class="reveal"><div class="kicker">RESPUESTA</div><div class="section-title">${esc(x.correctLabel)}</div></div>`:""}
  ${r.isHost?'<div class="divider"></div>'+(r.roundPhase==="reveal"?'<button class="primary wide" id="next">Siguiente →</button>':'<button class="secondary wide" id="reveal">Revelar</button>'):""}</section>
  ${r.mission?`<section class="card soft" style="margin-top:14px"><div class="kicker">💣 TU MISIÓN SECRETA</div><div class="section-title">${esc(r.mission.text)}</div><div class="muted tiny">Vale ${r.mission.points} puntos en una versión completa del sistema de misiones.</div></section>`:""}
  <section class="card soft" style="margin-top:14px"><div class="kicker">PUNTAJES</div><div class="score-list">${scoreRows(r.players)}</div></section>`;
  document.querySelectorAll(".option").forEach(b=>b.onclick=async()=>{try{await api("/api/rooms/"+r.code+"/vote",{method:"POST",body:JSON.stringify({choice:b.dataset.choice})});refresh()}catch(e){toast(e.message)}});
  if(r.isHost){if(document.querySelector("#reveal"))reveal.onclick=async()=>{try{await api("/api/rooms/"+r.code+"/reveal",{method:"POST"});refresh()}catch(e){toast(e.message)}};if(document.querySelector("#next"))next.onclick=async()=>{try{await api("/api/rooms/"+r.code+"/next",{method:"POST"});refresh()}catch(e){toast(e.message)}}}
}
function paywall(r){
  app.innerHTML=brand()+`<section class="card center paywall"><div class="big-num">🔥</div><div class="section-title">La primera ronda fue gratis.</div><p class="lead" style="margin-left:auto;margin-right:auto">Tu grupo generó <strong>${Math.max(0,r.totalRounds-1)} rondas más</strong> mezclando varios modos de juego.</p><div class="paywall-grid">${r.availableModes.filter(m=>["quien_fue","lee_al_grupo","mentiroso","silla_caliente","todos_contra_uno"].includes(m.id)).map(m=>`<div><span>${m.emoji}</span><strong>${esc(m.title)}</strong></div>`).join("")}</div><div class="divider"></div>${r.isHost?'<button class="primary wide" id="unlockTest">Desbloquear en modo prueba →</button><div class="tiny muted" style="margin-top:10px">Después este botón será Mercado Pago.</div>':'<div class="muted">Esperando que el host desbloquee la noche…</div>'}</section>`;
  if(r.isHost)unlockTest.onclick=async()=>{try{await api("/api/rooms/"+r.code+"/unlock-test",{method:"POST"});refresh()}catch(e){toast(e.message)}}
}
function scoreRows(ps){return[...ps].sort((a,b)=>b.score-a.score).map((p,i)=>`<div class="score-row"><div class="rank">#${i+1}</div><div class="score-name">${esc(p.name)}</div><div class="score">${p.score}</div></div>`).join("")}
function finished(r){const s=[...r.players].sort((a,b)=>b.score-a.score);app.innerHTML=brand()+`<section class="hero center"><div class="eyebrow">🏆 FIN DE LA NOCHE</div><h1><span class="grad">${esc(s[0]?.name||"")}</span><br>ganó.</h1><p class="lead" style="margin-left:auto;margin-right:auto">Fue quien mejor leyó, conoció y engañó al grupo.</p></section><section class="card"><div class="score-list">${scoreRows(r.players)}</div>${r.isHost?'<div class="divider"></div><button class="primary wide" id="restart">Preparar otra partida</button>':""}</section>`;if(r.isHost)restart.onclick=async()=>{await api("/api/rooms/"+r.code+"/restart",{method:"POST"});refresh()}}
function renderRoom(){const r=state.room;if(!r)return;if(r.state==="lobby")lobby(r);else if(r.state==="collecting")collecting(r);else if(r.state==="playing")playing(r);else if(r.state==="paywall")paywall(r);else finished(r)}
(async()=>{await loadConfig();const q=new URLSearchParams(location.search).get("code"),c=localStorage.getItem("ln_code"),t=localStorage.getItem("ln_token");if(c&&t){state.code=c;state.token=t;startPoll()}else{await home();if(q)joinCode.value=q}})();
