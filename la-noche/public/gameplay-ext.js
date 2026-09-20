function playing(r){
  const x=r.round;if(!x)return;
  const locked=x.locked||r.roundPhase==="locked";
  let interaction="";

  if(locked){
    const reveal=x.reveal||{},pts=Number(reveal.ownPoints||0);
    const labels={quien_fue:"ERA",lee_al_grupo:"LA MAYORÍA ELIGIÓ",mentiroso:"RESULTADO",silla_caliente:"RESPUESTA REAL",todos_contra_uno:"RESPUESTA REAL",duo:"EL DÚO",ordena_al_grupo:"RANKING DEL GRUPO"};
    const resultLabel=labels[x.mode]||"RESULTADO";
    const scoreLine=pts>0?'<div class="round-own-score positive">+'+pts+' <span>puntos para vos</span></div>':'<div class="round-own-score"><span>Esta ronda no sumaste puntos</span></div>';
    interaction='<div class="round-reveal">'+
      '<div class="reveal-burst" aria-hidden="true">'+Array.from({length:10},(_,i)=>'<i style="--i:'+i+'"></i>').join("")+'</div>'+
      '<div class="reveal-check">✦</div>'+
      '<small>'+resultLabel+'</small>'+
      '<strong>'+esc(reveal.answer||"Resuelto")+'</strong>'+
      scoreLine+
      '<div class="reveal-secrecy">El puntaje total sigue sellado hasta el final.</div>'+
      '<div class="next-round-line"><i></i><span>Siguiente ronda…</span></div>'+
    '</div>';
  }else if(x.mode==="ordena_al_grupo"){
    interaction='<div class="rank-help">Tocá los nombres en el orden que creés correcto. El #1 va primero.</div><div class="rank-chosen" id="rankChosen"></div><div class="rank-pool" id="rankPool"></div><div class="actions" style="margin-top:12px"><button class="ghost" id="rankReset">Reiniciar</button><button class="primary" id="rankSubmit">Enviar ranking</button></div><div class="vote-count">'+(x.ownRank?"Tu ranking está guardado. Podés cambiarlo hasta que cierre la ronda.":"El ranking colectivo se calcula cuando votan todos.")+'</div>';
  }else if(x.skipVote){
    interaction='<div class="example-box"><strong>Esta ronda habla de vos.</strong><small>No votás. El resto está intentando adivinarte.</small></div>';
  }else{
    const duoNote=x.mode==="duo"?(x.duoPlayer
      ?'<div class="example-box"><strong>Estás en el dúo.</strong><small>Elegí lo que vos preferís. El otro integrante responde por su cuenta y el resto apuesta si van a coincidir.</small></div>'
      :'<div class="example-box"><strong>'+esc((x.duoNames||[]).join(" + "))+'</strong><small>Predecí si los dos van a elegir lo mismo o respuestas distintas.</small></div>'):"";
    interaction=duoNote+'<div class="options">'+(x.options||[]).map(o=>'<button class="option '+(x.ownVote===o.id?"selected":"")+'" data-choice="'+esc(o.id)+'">'+esc(o.label)+'</button>').join("")+'</div><div class="vote-count">'+(x.ownVote?"Tu voto quedó guardado. Podés cambiarlo hasta que cierre la ronda.":"Tocá una opción para votar.")+'</div>';
  }

  const mission=r.mission?'<section class="card soft mission-card" style="margin-top:14px"><div class="kicker">💣 TU MISIÓN SECRETA</div><div class="section-title">'+esc(r.mission.text)+'</div>'+(r.mission.status==="completed"?'<div class="mission-done">✓ Misión cumplida · puntos guardados</div>':'<button class="secondary wide" id="missionDone">Marcar como cumplida · +'+r.mission.points+' puntos</button>')+'</section>':"";

  const votePct=Math.round((x.voteCount/Math.max(1,x.eligibleVoters))*100),voteDeg=(votePct*3.6).toFixed(1);
  app.innerHTML='<div class="room-page live-game-page">'+brand()+
  '<div class="game-theme-atmosphere">'+assetImg("theme",r.themeId,"game-theme-bg")+'</div>'+
  '<div class="game-topbar"><div class="mode-live">'+assetImg("mode",x.mode,"mode-live-icon")+'<div><div class="kicker">'+esc(x.modeTitle)+'</div><small>'+esc(r.theme.title)+' · Ronda '+(r.currentRound+1)+' de '+r.totalRounds+'</small></div></div><div class="vote-orb" style="--vote:'+voteDeg+'deg"><span>'+x.voteCount+'/'+x.eligibleVoters+'</span><small>VOTOS</small></div></div>'+
  '<section class="card prompt-card live-prompt '+(locked?'is-reveal':'')+'"><div class="prompt-shimmer"></div><div class="tiny muted prompt-label">'+esc(x.prompt)+'</div><div class="statement">“'+esc(x.statement)+'”</div>'+interaction+'</section>'+
  (locked?"":mission)+
  '<section class="card soft hidden-score live-hidden-score"><div class="score-seal">✦</div><div><div class="kicker">PUNTAJE SELLADO</div><div class="section-title">Nadie sabe quién va ganando.</div><div class="muted">Dúos, rankings, misiones y aciertos se suman automáticamente. Todo se abre al final.</div></div></section>'+
  hostRoster(r)+'</div>';

  if(!locked&&x.mode==="ordena_al_grupo"){
    let selected=Array.isArray(x.ownRank)?[...x.ownRank]:[];
    const targets=x.rankTargets||[];
    const paint=()=>{
      const byId=new Map(targets.map(t=>[t.id,t]));
      document.querySelector("#rankChosen").innerHTML=selected.length
        ?selected.map((pid,i)=>'<button class="rank-slot" data-remove="'+pid+'"><span>#'+(i+1)+'</span><strong>'+esc(byId.get(pid)?.label||"")+'</strong></button>').join("")
        :'<div class="rank-empty">Todavía no elegiste a nadie.</div>';
      document.querySelector("#rankPool").innerHTML=targets.filter(t=>!selected.includes(t.id)).map(t=>'<button class="rank-pick" data-add="'+t.id+'">'+esc(t.label)+'</button>').join("");
      const submit=document.querySelector("#rankSubmit");submit.disabled=selected.length!==targets.length;
      document.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>{selected.push(b.dataset.add);paint()});
      document.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{selected=selected.filter(v=>v!==b.dataset.remove);paint()});
    };
    paint();
    document.querySelector("#rankReset").onclick=()=>{selected=[];paint()};
    document.querySelector("#rankSubmit").onclick=async()=>{try{await api("/api/rooms/"+r.code+"/rank-vote",{method:"POST",body:JSON.stringify({order:selected})});refresh()}catch(e){toast(e.message)}};
  }else if(!locked&&!x.skipVote){
    document.querySelectorAll(".option").forEach(b=>b.onclick=async()=>{try{await api("/api/rooms/"+r.code+"/vote",{method:"POST",body:JSON.stringify({choice:b.dataset.choice})});refresh()}catch(e){toast(e.message)}});
  }

  const missionBtn=document.querySelector("#missionDone");
  if(missionBtn)missionBtn.onclick=async()=>{try{await api("/api/rooms/"+r.code+"/mission/complete",{method:"POST"});toast("Misión cumplida. Los puntos quedaron ocultos.");refresh()}catch(e){toast(e.message)}};

  bindHostRoster(r);
}

function answersArchive(r){
  if(!r.answers)return "";
  const people=r.answers.map((a,i)=>`<details class="answer-person" ${i===0?"open":""}>
    <summary>
      <span class="answer-avatar">${esc(a.name).slice(0,1).toUpperCase()}</span>
      <div><strong>${esc(a.name)}</strong><small>Ver todo lo que respondió</small></div>
      <i>+</i>
    </summary>
    <div class="answer-body">
      <div class="answer-group-title">HISTORIAS</div>
      ${a.stories.map(s=>`<div class="answer-item"><small>${esc(s.prompt)}</small><strong>${esc(s.answer)}</strong></div>`).join("")}
      <div class="answer-split">
        <div class="answer-item truth-item"><small>SU VERDAD</small><strong>${esc(a.truth)}</strong></div>
        <div class="answer-item lie-item"><small>SU MENTIRA</small><strong>${esc(a.lie)}</strong></div>
      </div>
      <div class="answer-group-title">RESPUESTAS PERSONALES</div>
      <div class="answer-item"><small>${esc(a.hotSeat.prompt)}</small><strong>${esc(a.hotSeat.answer)}</strong></div>
      <div class="answer-item"><small>${esc(a.oneVsAll.prompt)}</small><strong>${esc(a.oneVsAll.answer)}</strong></div>
      <div class="answer-group-title">VOTOS SECRETOS</div>
      ${a.majority.map(m=>`<div class="answer-item"><small>${esc(m.prompt)}</small><strong>${esc(m.answer)}</strong></div>`).join("")}
      ${a.mission?`<div class="answer-group-title">MISIÓN</div><div class="answer-item mission-answer"><small>${a.mission.status==="completed"?"✓ CUMPLIDA":"NO CUMPLIDA"}</small><strong>${esc(a.mission.text)}</strong><b>${a.mission.status==="completed"?"+"+a.mission.points+" puntos":""}</b></div>`:""}
    </div>
  </details>`).join("");

  const rounds=(r.roundAnswers||[]).map((x,i)=>`<div class="round-archive-row">
    <span>${String(i+1).padStart(2,"0")}</span>
    <div>
      <small>${esc(x.modeTitle||x.mode)}</small>
      <strong>${esc(x.statement||x.prompt||"")}</strong>
      <em>${esc(x.answer||"")}</em>
    </div>
  </div>`).join("");

  return `<section class="answers-vault">
    <div class="final-section-head">
      <div><div class="kicker">🔓 ARCHIVO DESBLOQUEADO</div><h2>Ahora sí, pueden ver todo.</h2></div>
      <span>Durante la partida esto estuvo sellado</span>
    </div>
    <div class="archive-tabs">
      <button class="archive-tab active" data-archive-tab="people">Lo que respondió cada uno</button>
      <button class="archive-tab" data-archive-tab="rounds">Cómo se resolvió la partida</button>
    </div>
    <div class="archive-panel active" data-archive-panel="people">${people}</div>
    <div class="archive-panel" data-archive-panel="rounds"><div class="round-archive-list">${rounds}</div></div>
  </section>`;
}

document.addEventListener("click",e=>{
  const tab=e.target.closest("[data-archive-tab]");if(!tab)return;
  const root=tab.closest(".answers-vault");if(!root)return;
  root.querySelectorAll("[data-archive-tab]").forEach(x=>x.classList.toggle("active",x===tab));
  root.querySelectorAll("[data-archive-panel]").forEach(x=>x.classList.toggle("active",x.dataset.archivePanel===tab.dataset.archiveTab));
});
