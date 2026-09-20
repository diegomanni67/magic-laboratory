import express from "express";
import crypto from "crypto";
import path from "path";
import QRCode from "qrcode";
import { fileURLToPath } from "url";
import { THEMES, MODES, THEME_MODES, PROMPTS, DUO_CHOICES } from "./content.js";

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const app=express();
const PORT=process.env.PORT||3000;
app.use(express.json({limit:"250kb"}));
app.use(express.static(path.join(__dirname,"public")));

const rooms=new Map();
const sessions=new Map();
const IMPLEMENTED_MODES=["quien_fue","lee_al_grupo","mentiroso","silla_caliente","todos_contra_uno","duo","ordena_al_grupo"];
const AUTO_ADVANCE_MS=2800;
const MODE_ROUND_CAPS={quien_fue:6,lee_al_grupo:3,mentiroso:6,silla_caliente:4,todos_contra_uno:3,duo:2,ordena_al_grupo:2};
const ACCESS_PLANS=[
  {id:"single",title:"Una noche",billing:"one_time",unlimited:false,description:"Desbloquea esta partida completa."},
  {id:"monthly",title:"Pase mensual",billing:"monthly",unlimited:true,description:"Partidas ilimitadas mientras el pase esté activo."},
  {id:"annual",title:"Pase anual",billing:"annual",unlimited:true,description:"Partidas ilimitadas durante un año."},
  {id:"lifetime",title:"De por vida",billing:"lifetime",unlimited:true,description:"Partidas ilimitadas para siempre desde la cuenta que lo compra."}
];

function id(){return crypto.randomUUID()}
function token(){return crypto.randomBytes(24).toString("hex")}
function clean(v,max=180){return String(v??"").trim().replace(/\s+/g," ").slice(0,max)}
function shuffle(a){const x=[...(a||[])];for(let i=x.length-1;i>0;i--){const j=crypto.randomInt(i+1);[x[i],x[j]]=[x[j],x[i]]}return x}
function pick(a,n=1){return shuffle(a).slice(0,n)}
function roomCode(){const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let s="";for(let i=0;i<6;i++)s+=c[crypto.randomInt(c.length)];return s}
function bearer(req){const h=req.headers.authorization||"";return h.startsWith("Bearer ")?h.slice(7):""}
function getRoom(code){return rooms.get(String(code||"").toUpperCase())}
function auth(room,req){const pid=sessions.get(bearer(req));return room?.players.find(p=>p.id===pid)||null}
function requireHost(room,req){const me=auth(room,req);return me&&me.id===room.hostPlayerId?me:null}
function themePrompts(themeId){return PROMPTS[themeId]||PROMPTS.clasico}
function modeInfo(modeId){return MODES[modeId]||{id:modeId,title:modeId,emoji:"🎮",description:""}}
function themeStats(themeId){
  const modeIds=THEME_MODES[themeId]||[];
  const playable=modeIds.filter(x=>IMPLEMENTED_MODES.includes(x));
  const maxRounds=Math.min(25,playable.reduce((n,id)=>n+(MODE_ROUND_CAPS[id]||0),0));
  const tp=PROMPTS[themeId]||{};
  const promptCount=Object.values(tp).reduce((n,val)=>n+(Array.isArray(val)?val.length:0),0)+(DUO_CHOICES[themeId]?.length||0);
  return {
    modeCount:modeIds.length,
    playableModeCount:playable.length,
    maxRounds,
    promptCount,
    hasMissions:modeIds.includes("mision_secreta"),
    missionCount:Array.isArray(tp.missions)?tp.missions.length:0
  };
}
function playerName(room,pid){return room.players.find(p=>p.id===pid)?.name||"Jugador eliminado"}
function hasPremiumAccess(req){
  return process.env.ALLOW_TEST_PREMIUM==="true"&&req.headers["x-test-premium"]==="1";
}

function uniqueAnswerOptions(room,key,correct,ownerId,max=4){
  const pool=shuffle(room.players.map(p=>({value:room.submissions[p.id]?.[key],sourcePlayerId:p.id})).filter(x=>x.value));
  const out=[{id:correct,label:correct,sourcePlayerId:ownerId}];
  for(const item of pool){
    if(!out.some(x=>x.id.toLowerCase()===item.value.toLowerCase())) out.push({id:item.value,label:item.value,sourcePlayerId:item.sourcePlayerId});
    if(out.length>=max)break;
  }
  return shuffle(out);
}
function assignMissions(room){
  room.missions={};
  if(!(THEME_MODES[room.themeId]||[]).includes("mision_secreta"))return;
  const bank=themePrompts(room.themeId).missions||[];
  if(!bank.length)return;
  const shuffled=shuffle(bank);
  room.players.forEach((p,i)=>{room.missions[p.id]={text:shuffled[i%shuffled.length],status:"active",points:250}});
}
function buildRounds(room){
  const allowed=(THEME_MODES[room.themeId]||THEME_MODES.clasico).filter(x=>IMPLEMENTED_MODES.includes(x));
  const rounds=[];
  const add=r=>rounds.push({id:id(),votes:{},scored:false,...r});

  if(allowed.includes("quien_fue")){
    const pool=[];
    for(const p of room.players){
      const s=room.submissions[p.id];
      (s?.stories||[]).forEach((text,i)=>pool.push({p,text,prompt:room.prepPrompts.storyPrompts[i]||"¿Quién contó esto?"}));
    }
    pick(pool,6).forEach(x=>add({
      mode:"quien_fue",prompt:"¿Quién fue?",statement:x.text,correct:x.p.id,authorId:x.p.id,skipVoteFor:x.p.id,
      options:room.players.map(p=>({id:p.id,label:p.name,sourcePlayerId:p.id}))
    }));
  }

  if(allowed.includes("mentiroso")){
    const pool=[];
    for(const p of room.players){
      const s=room.submissions[p.id];if(!s)continue;
      pool.push({p,text:s.truth,correct:"true"});pool.push({p,text:s.lie,correct:"false"});
    }
    pick(pool,6).forEach(x=>add({
      mode:"mentiroso",prompt:`¿Verdad o mentira sobre ${x.p.name}?`,statement:x.text,correct:x.correct,authorId:x.p.id,skipVoteFor:x.p.id,
      options:[{id:"true",label:"Es verdad"},{id:"false",label:"Es mentira"}]
    }));
  }

  if(allowed.includes("lee_al_grupo")){
    room.prepPrompts.majorityPrompts.forEach((q,idx)=>{
      const tally=new Map();
      for(const s of Object.values(room.submissions)){
        const v=s.majority?.[idx];
        if(v&&room.players.some(p=>p.id===v))tally.set(v,(tally.get(v)||0)+1);
      }
      if(!tally.size)return;
      const max=Math.max(...tally.values());
      const winners=[...tally.entries()].filter(([,n])=>n===max).map(([pid])=>pid);
      const correct=winners[crypto.randomInt(winners.length)];
      add({
        mode:"lee_al_grupo",prompt:"¿Qué decidió la mayoría?",statement:q,correct,
        options:room.players.map(p=>({id:p.id,label:p.name,sourcePlayerId:p.id}))
      });
    });
  }

  if(allowed.includes("silla_caliente")){
    for(const p of shuffle(room.players).slice(0,Math.min(4,room.players.length))){
      const correct=room.submissions[p.id]?.hotSeatAnswer;if(!correct)continue;
      const opts=uniqueAnswerOptions(room,"hotSeatAnswer",correct,p.id);
      if(opts.length<2)continue;
      add({mode:"silla_caliente",prompt:`¿Qué respondió ${p.name}?`,statement:room.prepPrompts.hotSeatPrompt,correct,protagonistId:p.id,skipVoteFor:p.id,options:opts});
    }
  }

  if(allowed.includes("todos_contra_uno")){
    for(const p of shuffle(room.players).slice(0,Math.min(3,room.players.length))){
      const correct=room.submissions[p.id]?.oneVsAllAnswer;if(!correct)continue;
      const opts=uniqueAnswerOptions(room,"oneVsAllAnswer",correct,p.id);
      if(opts.length<2)continue;
      add({mode:"todos_contra_uno",prompt:`Todos contra ${p.name}`,statement:room.prepPrompts.oneVsAllPrompt,correct,protagonistId:p.id,skipVoteFor:p.id,options:opts});
    }
  }

  if(allowed.includes("duo")&&room.players.length>=4){
    const bank=DUO_CHOICES[room.themeId]||[];
    const qs=pick(bank,Math.min(2,bank.length));
    for(const q of qs){
      const pair=pick(room.players,2);
      if(pair.length<2)continue;
      add({
        mode:"duo",
        prompt:`${pair[0].name} + ${pair[1].name} · ¿Piensan igual?`,
        statement:q.question,
        duoIds:pair.map(p=>p.id),
        duoQuestion:q
      });
    }
  }

  if(allowed.includes("ordena_al_grupo")&&room.players.length>=4){
    const rankBank=themePrompts(room.themeId).rank||[];
    for(const prompt of pick(rankBank,Math.min(2,rankBank.length))){
      const targets=pick(room.players,Math.min(4,room.players.length));
      add({
        mode:"ordena_al_grupo",
        prompt:"Ordená al grupo",
        statement:prompt,
        rankTargets:targets.map(p=>({id:p.id,label:p.name,sourcePlayerId:p.id}))
      });
    }
  }

  const mixed=shuffle(rounds);
  const firstWho=mixed.findIndex(r=>r.mode==="quien_fue");
  if(firstWho>0){const [r]=mixed.splice(firstWho,1);mixed.unshift(r)}
  return mixed.slice(0,25).map((r,i)=>({...r,position:i}));
}
function eligibleVoters(room,round){
  if(round.mode==="duo"||round.mode==="ordena_al_grupo")return [...room.players];
  return room.players.filter(p=>p.id!==round.skipVoteFor);
}
function duoActual(room,round){
  const [a,b]=round.duoIds||[];
  const va=round.votes[a],vb=round.votes[b];
  if(!va||!vb)return null;
  return va===vb?"same":"different";
}
function rankConsensus(round){
  const targets=round.rankTargets||[];
  const orders=Object.values(round.votes).filter(v=>Array.isArray(v)&&v.length===targets.length);
  if(!orders.length)return [];
  const score=new Map(targets.map(t=>[t.id,0]));
  for(const order of orders)order.forEach((pid,i)=>score.set(pid,(score.get(pid)||0)+i));
  return [...targets].sort((a,b)=>(score.get(a.id)||0)-(score.get(b.id)||0)).map(t=>t.id);
}
function rankDistance(order,consensus){
  if(!Array.isArray(order)||order.length!==consensus.length)return Infinity;
  const pos=new Map(consensus.map((pid,i)=>[pid,i]));
  return order.reduce((sum,pid,i)=>sum+Math.abs(i-(pos.get(pid)??i)),0);
}
function scoreRound(room,round){
  if(round.scored)return;

  if(round.mode==="duo"){
    const actual=duoActual(room,round);if(!actual)return;
    round.correct=actual;
    const pair=new Set(round.duoIds||[]);
    for(const p of room.players){
      const vote=round.votes[p.id];if(vote===undefined)continue;
      if(pair.has(p.id)){if(actual==="same")p.score+=100}
      else if(vote===actual)p.score+=75;
    }
    round.scored=true;return;
  }

  if(round.mode==="ordena_al_grupo"){
    const consensus=rankConsensus(round);if(!consensus.length)return;
    round.consensus=consensus;
    const n=consensus.length,maxDistance=Math.max(1,Math.floor((n*n)/2));
    for(const p of room.players){
      const order=round.votes[p.id];if(!Array.isArray(order))continue;
      const dist=rankDistance(order,consensus);
      const pts=Math.max(0,Math.round(150*(1-Math.min(dist,maxDistance)/maxDistance)));
      p.score+=pts;
    }
    round.scored=true;return;
  }

  let wrong=0;
  for(const p of eligibleVoters(room,round)){
    const vote=round.votes[p.id];
    if(vote===undefined)continue;
    if(vote===round.correct)p.score+=100;else wrong++;
  }
  if(round.mode==="quien_fue"&&round.authorId){
    const author=room.players.find(p=>p.id===round.authorId);if(author)author.score+=Math.min(100,wrong*25);
  }
  if(round.mode==="mentiroso"&&round.correct==="false"&&round.authorId){
    const author=room.players.find(p=>p.id===round.authorId);if(author)author.score+=Math.min(120,wrong*30);
  }
  if(round.mode==="todos_contra_uno"&&round.protagonistId){
    const pro=room.players.find(p=>p.id===round.protagonistId);if(pro)pro.score+=Math.min(120,wrong*30);
  }
  round.scored=true;
}
function allVotesIn(room,round){
  const eligible=eligibleVoters(room,round);
  return eligible.length>0&&eligible.every(p=>Object.prototype.hasOwnProperty.call(round.votes,p.id));
}
function finalizeRound(room){
  if(room.state!=="playing"||room.roundPhase!=="guess")return;
  const round=room.rounds[room.currentRound];
  if(!round||!allVotesIn(room,round))return;
  scoreRound(room,round);
  room.roundPhase="locked";
  room.advanceAt=Date.now()+AUTO_ADVANCE_MS;
}
function maybeAdvance(room){
  if(room.state!=="playing"||room.roundPhase!=="locked"||!room.advanceAt||Date.now()<room.advanceAt)return;
  room.advanceAt=null;
  if(room.currentRound===0&&!room.unlocked&&room.rounds.length>1){room.state="paywall";return}
  if(room.currentRound+1>=room.rounds.length){room.state="finished";room.roundPhase="done";room.finishedAt=Date.now();return}
  room.currentRound++;
  room.roundPhase="guess";
}
function recalculateScores(room){
  room.players.forEach(p=>p.score=0);
  for(const round of room.rounds){
    if(!round.scored)continue;
    round.scored=false;
    scoreRound(room,round);
  }
  for(const p of room.players){
    const m=room.missions[p.id];
    if(m?.status==="completed")p.score+=m.points||0;
  }
}
function removePlayerFromRoom(room,pid){
  if(pid===room.hostPlayerId)return false;
  room.players=room.players.filter(p=>p.id!==pid);
  delete room.submissions[pid];
  delete room.missions[pid];
  for(const s of Object.values(room.submissions)){
    if(Array.isArray(s.majority))s.majority=s.majority.map(v=>v===pid?null:v);
  }

  const oldCurrent=room.currentRound;
  const currentId=room.rounds[oldCurrent]?.id;
  room.rounds=room.rounds.filter(r=>{
    if(r.authorId===pid||r.protagonistId===pid||r.correct===pid)return false;
    if((r.duoIds||[]).includes(pid))return false;
    if((r.rankTargets||[]).some(t=>t.id===pid))return false;
    if((r.options||[]).some(o=>o.sourcePlayerId===pid&&o.id===r.correct))return false;
    return true;
  });
  for(const r of room.rounds){
    delete r.votes[pid];
    if(r.options)r.options=r.options.filter(o=>o.sourcePlayerId!==pid&&o.id!==pid);
  }
  room.rounds.forEach((r,i)=>r.position=i);
  if(room.rounds.length){
    const idx=currentId?room.rounds.findIndex(r=>r.id===currentId):-1;
    room.currentRound=idx>=0?idx:Math.min(oldCurrent,room.rounds.length-1);
  }else room.currentRound=0;
  recalculateScores(room);
  if(room.state==="playing"&&room.rounds.length){
    room.roundPhase="guess";room.advanceAt=null;finalizeRound(room);
  }
  return true;
}
function endArchive(room){
  return room.players.map(p=>{
    const s=room.submissions[p.id]||{},mission=room.missions[p.id]||null;
    return {
      playerId:p.id,name:p.name,
      stories:(s.stories||[]).map((answer,i)=>({prompt:room.prepPrompts.storyPrompts[i]||"Historia",answer})),
      truth:s.truth||"",lie:s.lie||"",
      hotSeat:{prompt:room.prepPrompts.hotSeatPrompt,answer:s.hotSeatAnswer||""},
      oneVsAll:{prompt:room.prepPrompts.oneVsAllPrompt,answer:s.oneVsAllAnswer||""},
      majority:(room.prepPrompts.majorityPrompts||[]).map((prompt,i)=>({prompt,answer:s.majority?.[i]?playerName(room,s.majority[i]):"Sin voto"})),
      mission:mission?{text:mission.text,status:mission.status,points:mission.points}:null
    };
  });
}
function answerForRound(room,r){
  if(r.mode==="quien_fue"||r.mode==="lee_al_grupo")return playerName(room,r.correct);
  if(r.mode==="mentiroso")return r.correct==="true"?"Era verdad":"Era mentira";
  if(r.mode==="duo")return r.correct==="same"?"Coincidieron":"No coincidieron";
  if(r.mode==="ordena_al_grupo")return (r.consensus||[]).map(pid=>playerName(room,pid)).join(" → ");
  return r.correct||"";
}
function roundArchive(room){
  return room.rounds.map(r=>({mode:r.mode,modeTitle:modeInfo(r.mode).title,prompt:r.prompt,statement:r.statement,answer:answerForRound(room,r)}));
}
function roundSnapshot(room,raw,viewer){
  const base={
    id:raw.id,position:raw.position,mode:raw.mode,modeTitle:modeInfo(raw.mode).title,modeEmoji:modeInfo(raw.mode).emoji,
    prompt:raw.prompt,statement:raw.statement,
    voteCount:Object.keys(raw.votes).length,eligibleVoters:eligibleVoters(room,raw).length,
    locked:room.roundPhase==="locked"
  };

  if(raw.mode==="duo"){
    const pair=new Set(raw.duoIds||[]);
    const inPair=viewer?pair.has(viewer.id):false;
    return {
      ...base,
      duoNames:(raw.duoIds||[]).map(pid=>playerName(room,pid)),
      options:inPair
        ?[{id:"left",label:raw.duoQuestion.left},{id:"right",label:raw.duoQuestion.right}]
        :[{id:"same",label:"Van a coincidir"},{id:"different",label:"Van a elegir distinto"}],
      ownVote:viewer?raw.votes[viewer.id]||null:null,
      duoPlayer:inPair
    };
  }

  if(raw.mode==="ordena_al_grupo"){
    return {
      ...base,
      options:[],
      rankTargets:raw.rankTargets||[],
      ownRank:viewer&&Array.isArray(raw.votes[viewer.id])?raw.votes[viewer.id]:null
    };
  }

  return {
    ...base,
    options:raw.options||[],
    ownVote:viewer?raw.votes[viewer.id]||null:null,
    skipVote:viewer?.id===raw.skipVoteFor
  };
}
function snapshot(room,viewer){
  maybeAdvance(room);
  const raw=room.rounds[room.currentRound]||null;
  const finished=room.state==="finished";
  return {
    code:room.code,name:room.name,state:room.state,roundPhase:room.roundPhase,currentRound:room.currentRound,totalRounds:room.rounds.length,
    unlocked:room.unlocked,freeRounds:1,accessPlan:room.accessPlan||null,theme:THEMES[room.themeId],themeId:room.themeId,playWhen:room.playWhen,eventDate:room.eventDate,
    prepPrompts:room.prepPrompts,availableModes:(THEME_MODES[room.themeId]||[]).map(modeInfo),
    isHost:viewer?.id===room.hostPlayerId,
    me:viewer?{id:viewer.id,name:viewer.name,ready:viewer.ready,score:finished?viewer.score:null}:null,
    players:room.players.map(p=>({id:p.id,name:p.name,ready:p.ready,score:finished?p.score:null,isHost:p.id===room.hostPlayerId})),
    round:raw&&room.state==="playing"?roundSnapshot(room,raw,viewer):null,
    mission:viewer?room.missions[viewer.id]||null:null,
    answers:finished?endArchive(room):null,
    roundAnswers:finished?roundArchive(room):null
  };
}

app.get("/api/health",(_req,res)=>res.json({ok:true,rooms:rooms.size}));
app.get("/api/config",(_req,res)=>res.json({
  themes:Object.values(THEMES),modes:Object.values(MODES),themeModes:THEME_MODES,
  implementedModes:IMPLEMENTED_MODES,accessPlans:ACCESS_PLANS,
  themeStats:Object.fromEntries(Object.keys(THEMES).map(id=>[id,themeStats(id)]))
}));
app.get("/api/qr/:code",async(req,res)=>{
  const room=getRoom(req.params.code);if(!room)return res.status(404).send("Sala inexistente");
  try{
    const url=`${req.protocol}://${req.get("host")}/?code=${room.code}`;
    const png=await QRCode.toBuffer(url,{type:"png",width:640,margin:2,errorCorrectionLevel:"M"});
    res.setHeader("Content-Type","image/png");res.setHeader("Cache-Control","no-store");res.send(png);
  }catch(e){console.error(e);res.status(500).send("No pude generar el QR")}
});

app.post("/api/rooms",(req,res)=>{
  const name=clean(req.body.name,80),hostName=clean(req.body.hostName,40);
  const themeId=THEMES[req.body.themeId]?req.body.themeId:"clasico";
  const playWhen=req.body.playWhen==="later"?"later":"now",eventDate=playWhen==="later"?clean(req.body.eventDate,40):"";
  if(!name||!hostName)return res.status(400).json({error:"Faltan datos."});
  if(THEMES[themeId].premiumOnly&&!hasPremiumAccess(req))return res.status(402).json({error:"Esta temática es Premium +18. Necesitás comprar una partida o tener un pase activo para crearla."});
  if(THEMES[themeId].age18&&req.body.ageConfirmed!==true)return res.status(400).json({error:"La versión 18+ requiere confirmar mayoría de edad."});
  if(playWhen==="later"&&!eventDate)return res.status(400).json({error:"Elegí la fecha de la juntada."});
  let code=roomCode();while(rooms.has(code))code=roomCode();
  const hostId=id(),sessionToken=token(),tp=themePrompts(themeId);
  const room={
    code,name,themeId,playWhen,eventDate,state:playWhen==="later"?"collecting":"lobby",
    hostPlayerId:hostId,currentRound:0,roundPhase:"guess",advanceAt:null,unlocked:false,accessPlan:null,
    players:[{id:hostId,name:hostName,ready:false,score:0}],submissions:{},missions:{},rounds:[],
    prepPrompts:{
      storyPrompts:pick(tp.prep_story,3),
      majorityPrompts:pick(tp.majority,3),
      hotSeatPrompt:pick(tp.hot_seat,1)[0]||"",
      oneVsAllPrompt:pick(tp.one_vs_all,1)[0]||""
    },
    createdAt:Date.now()
  };
  rooms.set(code,room);sessions.set(sessionToken,hostId);res.json({code,sessionToken});
});

app.post("/api/rooms/:code/join",(req,res)=>{
  const room=getRoom(req.params.code);if(!room)return res.status(404).json({error:"Sala inexistente."});
  if(room.state==="finished")return res.status(409).json({error:"Esta partida ya terminó."});
  const name=clean(req.body.name,40);if(!name)return res.status(400).json({error:"Escribí tu nombre."});
  if(room.players.some(p=>p.name.toLowerCase()===name.toLowerCase()))return res.status(409).json({error:"Ese nombre ya está en la sala."});
  const alreadyPlaying=["playing","paywall"].includes(room.state);
  const p={id:id(),name,ready:alreadyPlaying,score:0},t=token();
  room.players.push(p);sessions.set(t,p.id);
  if(alreadyPlaying&&room.state==="playing"&&room.roundPhase==="guess")finalizeRound(room);
  res.json({code:room.code,sessionToken:t,lateJoin:alreadyPlaying});
});

app.get("/api/rooms/:code",(req,res)=>{
  const room=getRoom(req.params.code);if(!room)return res.status(404).json({error:"Sala inexistente."});
  res.json(snapshot(room,auth(room,req)));
});

app.post("/api/rooms/:code/start-collecting",(req,res)=>{
  const room=getRoom(req.params.code);if(!room)return res.status(404).json({error:"Sala inexistente."});
  if(!requireHost(room,req))return res.status(403).json({error:"Solo el host."});
  if(room.players.length<3)return res.status(409).json({error:"Necesitan ser al menos 3."});
  room.state="collecting";res.json({ok:true});
});

app.post("/api/rooms/:code/submissions",(req,res)=>{
  const room=getRoom(req.params.code),me=auth(room,req);
  if(!room)return res.status(404).json({error:"Sala inexistente."});
  if(!me)return res.status(401).json({error:"Volvé a entrar a la sala."});
  if(room.state!=="collecting")return res.status(409).json({error:"La preparación ya cerró."});
  const stories=Array.isArray(req.body.stories)?req.body.stories.map(x=>clean(x,280)):[],
        truth=clean(req.body.truth,280),lie=clean(req.body.lie,280),
        majority=Array.isArray(req.body.majority)?req.body.majority:[],
        hotSeatAnswer=clean(req.body.hotSeatAnswer,160),oneVsAllAnswer=clean(req.body.oneVsAllAnswer,160);
  const valid=new Set(room.players.map(p=>p.id));
  if(stories.length!==3||stories.some(x=>!x)||!truth||!lie||majority.length!==3||majority.some(x=>!valid.has(x))||!hotSeatAnswer||!oneVsAllAnswer){
    return res.status(400).json({error:"Completá todo antes de enviar."});
  }
  room.submissions[me.id]={stories,truth,lie,majority,hotSeatAnswer,oneVsAllAnswer};
  me.ready=true;res.json({ok:true});
});

app.delete("/api/rooms/:code/players/:playerId",(req,res)=>{
  const room=getRoom(req.params.code);if(!room)return res.status(404).json({error:"Sala inexistente."});
  if(!requireHost(room,req))return res.status(403).json({error:"Solo el host."});
  if(req.params.playerId===room.hostPlayerId)return res.status(400).json({error:"No podés eliminar al host."});
  if(!room.players.some(p=>p.id===req.params.playerId))return res.status(404).json({error:"Jugador inexistente."});
  removePlayerFromRoom(room,req.params.playerId);res.json({ok:true});
});

app.post("/api/rooms/:code/start-game",(req,res)=>{
  const room=getRoom(req.params.code);if(!room)return res.status(404).json({error:"Sala inexistente."});
  if(!requireHost(room,req))return res.status(403).json({error:"Solo el host."});
  if(room.players.length<3)return res.status(409).json({error:"Necesitan ser al menos 3."});
  if(room.players.some(p=>!p.ready))return res.status(409).json({error:"Todavía falta gente por responder."});
  room.players.forEach(p=>p.score=0);
  room.rounds=buildRounds(room);assignMissions(room);
  if(!room.rounds.length)return res.status(409).json({error:"No pude generar rondas con estas respuestas."});
  room.state="playing";room.currentRound=0;room.roundPhase="guess";room.advanceAt=null;room.unlocked=false;
  res.json({ok:true,rounds:room.rounds.length});
});

app.post("/api/rooms/:code/vote",(req,res)=>{
  const room=getRoom(req.params.code),me=auth(room,req);
  if(!room||room.state!=="playing")return res.status(409).json({error:"No hay una ronda activa."});
  if(!me)return res.status(401).json({error:"Sesión inválida."});
  if(room.roundPhase!=="guess")return res.status(409).json({error:"Los votos de esta ronda ya cerraron."});
  const r=room.rounds[room.currentRound];
  if(r.mode==="ordena_al_grupo")return res.status(400).json({error:"Esta ronda requiere enviar un ranking."});
  if(me.id===r.skipVoteFor)return res.status(409).json({error:"Esta ronda habla de vos: no votás."});

  const choice=clean(req.body.choice,300);
  if(r.mode==="duo"){
    const inPair=(r.duoIds||[]).includes(me.id);
    const valid=inPair?["left","right"]:["same","different"];
    if(!valid.includes(choice))return res.status(400).json({error:"Opción inválida."});
  }else if(!(r.options||[]).some(o=>o.id===choice)){
    return res.status(400).json({error:"Opción inválida."});
  }

  r.votes[me.id]=choice;finalizeRound(room);
  res.json({ok:true,locked:room.roundPhase==="locked"});
});

app.post("/api/rooms/:code/rank-vote",(req,res)=>{
  const room=getRoom(req.params.code),me=auth(room,req);
  if(!room||room.state!=="playing")return res.status(409).json({error:"No hay una ronda activa."});
  if(!me)return res.status(401).json({error:"Sesión inválida."});
  if(room.roundPhase!=="guess")return res.status(409).json({error:"Los votos de esta ronda ya cerraron."});
  const r=room.rounds[room.currentRound];
  if(r.mode!=="ordena_al_grupo")return res.status(400).json({error:"Esta ronda no usa ranking."});
  const order=Array.isArray(req.body.order)?req.body.order.map(x=>clean(x,80)):[];
  const targets=(r.rankTargets||[]).map(t=>t.id);
  if(order.length!==targets.length||new Set(order).size!==targets.length||order.some(pid=>!targets.includes(pid))){
    return res.status(400).json({error:"Ranking inválido."});
  }
  r.votes[me.id]=order;finalizeRound(room);
  res.json({ok:true,locked:room.roundPhase==="locked"});
});

app.post("/api/rooms/:code/mission/complete",(req,res)=>{
  const room=getRoom(req.params.code),me=auth(room,req);
  if(!room)return res.status(404).json({error:"Sala inexistente."});
  if(!me)return res.status(401).json({error:"Sesión inválida."});
  if(!["playing","paywall"].includes(room.state))return res.status(409).json({error:"No hay una misión activa."});
  const mission=room.missions[me.id];
  if(!mission)return res.status(404).json({error:"No tenés misión en esta partida."});
  if(mission.status==="completed")return res.json({ok:true,already:true});
  mission.status="completed";mission.completedAt=Date.now();me.score+=mission.points||0;
  res.json({ok:true});
});

app.post("/api/rooms/:code/unlock-test",(req,res)=>{
  const room=getRoom(req.params.code);if(!room)return res.status(404).json({error:"Sala inexistente."});
  if(!requireHost(room,req))return res.status(403).json({error:"Solo el host."});
  const accessPlan=ACCESS_PLANS.find(p=>p.id===req.body?.accessPlan)?.id||"single";
  room.accessPlan=accessPlan;room.unlocked=true;room.state="playing";
  room.currentRound=Math.min(1,room.rounds.length-1);room.roundPhase="guess";room.advanceAt=null;
  res.json({ok:true,accessPlan});
});

app.post("/api/rooms/:code/restart",(req,res)=>{
  const room=getRoom(req.params.code);if(!room)return res.status(404).json({error:"Sala inexistente."});
  if(!requireHost(room,req))return res.status(403).json({error:"Solo el host."});
  room.players.forEach(p=>{p.ready=false;p.score=0});
  room.submissions={};room.missions={};room.rounds=[];
  room.state="collecting";room.currentRound=0;room.roundPhase="guess";room.advanceAt=null;room.unlocked=false;
  res.json({ok:true});
});

app.use((_req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,"0.0.0.0",()=>console.log(`La Noche full game engine running on :${PORT}`));
