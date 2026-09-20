function playing(r){
  const x=r.round;if(!x)return;
  const locked=x.locked||r.roundPhase==="locked";
  let interaction="";

  if(locked){
    interaction='<div class="locked-round"><div class="big-num">✓</div><strong>Ronda cerrada</strong><span>Los puntos ya fueron calculados en secreto. El resultado aparece recién al final.</span></div>';
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
  '<section class="card prompt-card live-prompt"><div class="prompt-shimmer"></div><div class="tiny muted prompt-label">'+esc(x.prompt)+'</div><div class="statement">“'+esc(x.statement)+'”</div>'+interaction+'</section>'+
  mission+
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
  return '<section class="card answers-archive" style="margin-top:14px"><div class="kicker">🔓 RESPUESTAS DESBLOQUEADAS</div><div class="section-title">Ahora sí: todo lo que escribió el grupo</div><p class="muted">Hasta este momento estas respuestas nunca estuvieron disponibles para nadie.</p>'+
  r.answers.map(a=>'<details><summary>'+esc(a.name)+'</summary><div class="answer-body">'+
    a.stories.map(s=>'<div class="answer-item"><small>'+esc(s.prompt)+'</small><strong>'+esc(s.answer)+'</strong></div>').join("")+
    '<div class="answer-item"><small>Verdad</small><strong>'+esc(a.truth)+'</strong></div>'+
    '<div class="answer-item"><small>Mentira</small><strong>'+esc(a.lie)+'</strong></div>'+
    '<div class="answer-item"><small>'+esc(a.hotSeat.prompt)+'</small><strong>'+esc(a.hotSeat.answer)+'</strong></div>'+
    '<div class="answer-item"><small>'+esc(a.oneVsAll.prompt)+'</small><strong>'+esc(a.oneVsAll.answer)+'</strong></div>'+
    a.majority.map(m=>'<div class="answer-item"><small>'+esc(m.prompt)+'</small><strong>'+esc(m.answer)+'</strong></div>').join("")+
    (a.mission?'<div class="answer-item"><small>Misión secreta</small><strong>'+esc(a.mission.text)+' · '+(a.mission.status==="completed"?"Cumplida (+"+a.mission.points+")":"No cumplida")+'</strong></div>':"")+
  '</div></details>').join("")+'</section>';
}
