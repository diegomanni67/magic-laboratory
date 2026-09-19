import express from "express";
import crypto from "crypto";
import path from "path";
import QRCode from "qrcode";
import { fileURLToPath } from "url";
import { THEMES, MODES, THEME_MODES, PROMPTS } from "./content.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json({ limit: "250kb" }));
app.use(express.static(path.join(__dirname, "public")));

const rooms = new Map();
const sessions = new Map();
const IMPLEMENTED_MODES = ["quien_fue","lee_al_grupo","mentiroso","silla_caliente","todos_contra_uno"];

function id(){ return crypto.randomUUID(); }
function token(){ return crypto.randomBytes(24).toString("hex"); }
function clean(v,max=180){ return String(v??"").trim().replace(/\s+/g," ").slice(0,max); }
function shuffle(a){ const x=[...a]; for(let i=x.length-1;i>0;i--){ const j=crypto.randomInt(i+1); [x[i],x[j]]=[x[j],x[i]]; } return x; }
function pick(a,n=1){ return shuffle(a||[]).slice(0,n); }
function roomCode(){ const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s=""; for(let i=0;i<6;i++) s+=c[crypto.randomInt(c.length)]; return s; }
function bearer(req){ const h=req.headers.authorization||""; return h.startsWith("Bearer ")?h.slice(7):""; }
function getRoom(code){ return rooms.get(String(code||"").toUpperCase()); }
function auth(room,req){ const pid=sessions.get(bearer(req)); return room?.players.find(p=>p.id===pid)||null; }
function requireHost(room,req){ const me=auth(room,req); return me && me.id===room.hostPlayerId ? me : null; }
function themePrompts(themeId){ return PROMPTS[themeId] || PROMPTS.clasico; }
function modeInfo(id){ return MODES[id] || { id, title:id, emoji:"🎮", description:"" }; }
function optionLabel(room, round, value){
  if(round.mode==="quien_fue" || round.mode==="lee_al_grupo") return room.players.find(p=>p.id===value)?.name || value;
  if(round.mode==="mentiroso") return value==="true" ? "Es verdad" : "Es mentira";
  return value;
}
function uniqueAnswerOptions(room, key, correct, max=4){
  const vals=shuffle(room.players.map(p=>room.submissions[p.id]?.[key]).filter(Boolean));
  const out=[correct];
  for(const v of vals){ if(!out.some(x=>x.toLowerCase()===v.toLowerCase())) out.push(v); if(out.length>=max) break; }
  return shuffle(out);
}
function assignMissions(room){
  const bank=themePrompts(room.themeId).missions||[];
  if(!bank.length) return;
  const shuffled=shuffle(bank);
  room.players.forEach((p,i)=>{ room.missions[p.id]={ text:shuffled[i%shuffled.length], status:"active", points:250 }; });
}
function buildRounds(room){
  const allowed=(THEME_MODES[room.themeId]||THEME_MODES.clasico).filter(x=>IMPLEMENTED_MODES.includes(x));
  const rounds=[];
  const add=r=>rounds.push({ id:id(), votes:{}, scored:false, ...r });

  if(allowed.includes("quien_fue")){
    const storyPool=[];
    for(const p of room.players){
      const s=room.submissions[p.id];
      (s?.stories||[]).forEach((text,i)=>storyPool.push({player:p,text,prompt:room.prepPrompts.storyPrompts[i]||"¿Quién contó esto?"}));
    }
    pick(storyPool,6).forEach(x=>add({
      mode:"quien_fue", prompt:"¿Quién fue?", statement:x.text, correct:x.player.id,
      authorId:x.player.id, skipVoteFor:x.player.id,
      options:room.players.map(p=>({id:p.id,label:p.name}))
    }));
  }

  if(allowed.includes("mentiroso")){
    const pool=[];
    for(const p of room.players){
      const s=room.submissions[p.id]; if(!s) continue;
      pool.push({player:p,text:s.truth,correct:"true"});
      pool.push({player:p,text:s.lie,correct:"false"});
    }
    pick(pool,6).forEach(x=>add({
      mode:"mentiroso", prompt:`¿Verdad o mentira sobre ${x.player.name}?`, statement:x.text, correct:x.correct,
      authorId:x.player.id, skipVoteFor:x.player.id,
      options:[{id:"true",label:"Es verdad"},{id:"false",label:"Es mentira"}]
    }));
  }

  if(allowed.includes("lee_al_grupo")){
    room.prepPrompts.majorityPrompts.forEach((q,idx)=>{
      const tally=new Map();
      for(const s of Object.values(room.submissions)){ const v=s.majority?.[idx]; if(v) tally.set(v,(tally.get(v)||0)+1); }
      if(!tally.size) return;
      const max=Math.max(...tally.values());
      const winners=[...tally.entries()].filter(([,n])=>n===max).map(([pid])=>pid);
      const correct=winners[crypto.randomInt(winners.length)];
      add({
        mode:"lee_al_grupo", prompt:"¿Qué decidió la mayoría?", statement:q, correct,
        options:room.players.map(p=>({id:p.id,label:p.name}))
      });
    });
  }

  if(allowed.includes("silla_caliente")){
    const candidates=shuffle(room.players).slice(0,Math.min(4,room.players.length));
    for(const p of candidates){
      const correct=room.submissions[p.id]?.hotSeatAnswer;
      if(!correct) continue;
      const opts=uniqueAnswerOptions(room,"hotSeatAnswer",correct);
      if(opts.length<2) continue;
      add({
        mode:"silla_caliente", prompt:`¿Qué respondió ${p.name}?`, statement:room.prepPrompts.hotSeatPrompt,
        correct, protagonistId:p.id, skipVoteFor:p.id,
        options:opts.map(v=>({id:v,label:v}))
      });
    }
  }

  if(allowed.includes("todos_contra_uno")){
    const candidates=shuffle(room.players).slice(0,Math.min(3,room.players.length));
    for(const p of candidates){
      const correct=room.submissions[p.id]?.oneVsAllAnswer;
      if(!correct) continue;
      const opts=uniqueAnswerOptions(room,"oneVsAllAnswer",correct);
      if(opts.length<2) continue;
      add({
        mode:"todos_contra_uno", prompt:`Todos contra ${p.name}`, statement:room.prepPrompts.oneVsAllPrompt,
        correct, protagonistId:p.id, skipVoteFor:p.id,
        options:opts.map(v=>({id:v,label:v}))
      });
    }
  }

  const mixed=shuffle(rounds);
  const firstWho=mixed.findIndex(r=>r.mode==="quien_fue");
  if(firstWho>0){ const [r]=mixed.splice(firstWho,1); mixed.unshift(r); }
  return mixed.slice(0,25).map((r,i)=>({...r,position:i}));
}
function scoreRound(room,round){
  if(round.scored) return;
  let wrong=0;
  for(const p of room.players){
    if(p.id===round.skipVoteFor) continue;
    const vote=round.votes[p.id];
    if(vote===undefined) continue;
    if(vote===round.correct) p.score+=100; else wrong++;
  }
  if(round.mode==="quien_fue" && round.authorId){
    const author=room.players.find(p=>p.id===round.authorId); if(author) author.score+=Math.min(100,wrong*25);
  }
  if(round.mode==="mentiroso" && round.correct==="false" && round.authorId){
    const author=room.players.find(p=>p.id===round.authorId); if(author) author.score+=Math.min(120,wrong*30);
  }
  if(round.mode==="todos_contra_uno" && round.protagonistId){
    const pro=room.players.find(p=>p.id===round.protagonistId); if(pro) pro.score+=Math.min(120,wrong*30);
  }
  round.scored=true;
}
function snapshot(room,viewer){
  const raw=room.rounds[room.currentRound]||null;
  let round=null;
  if(raw){
    const eligible=room.players.filter(p=>p.id!==raw.skipVoteFor).length;
    round={
      id:raw.id, position:raw.position, mode:raw.mode, modeTitle:modeInfo(raw.mode).title, modeEmoji:modeInfo(raw.mode).emoji,
      prompt:raw.prompt, statement:raw.statement, options:raw.options||[],
      voteCount:Object.keys(raw.votes).length, eligibleVoters:eligible,
      ownVote:viewer?raw.votes[viewer.id]||null:null,
      skipVote:viewer?.id===raw.skipVoteFor,
      correctAnswer:(room.roundPhase==="reveal"||room.state==="finished")?raw.correct:null,
      correctLabel:(room.roundPhase==="reveal"||room.state==="finished")?optionLabel(room,raw,raw.correct):null
    };
  }
  const availableModes=(THEME_MODES[room.themeId]||[]).map(id=>modeInfo(id));
  return {
    code:room.code,name:room.name,state:room.state,roundPhase:room.roundPhase,currentRound:room.currentRound,
    totalRounds:room.rounds.length,unlocked:room.unlocked,freeRounds:1,
    theme:THEMES[room.themeId],themeId:room.themeId,playWhen:room.playWhen,eventDate:room.eventDate,
    prepPrompts:room.prepPrompts,availableModes,
    isHost:viewer?.id===room.hostPlayerId,
    me:viewer?{id:viewer.id,name:viewer.name,ready:viewer.ready,score:viewer.score}:null,
    players:room.players.map(p=>({id:p.id,name:p.name,ready:p.ready,score:p.score})),
    round,
    mission:viewer?room.missions[viewer.id]||null:null
  };
}

app.get("/api/health",(_req,res)=>res.json({ok:true,rooms:rooms.size}));
app.get("/api/config",(_req,res)=>res.json({
  themes:Object.values(THEMES),
  modes:Object.values(MODES),
  themeModes:THEME_MODES,
  implementedModes:IMPLEMENTED_MODES
}));
app.get("/api/qr/:code",async(req,res)=>{
  const room=getRoom(req.params.code); if(!room) return res.status(404).send("Sala inexistente");
  try{
    const url=`${req.protocol}://${req.get("host")}/?code=${room.code}`;
    const png=await QRCode.toBuffer(url,{type:"png",width:640,margin:2,errorCorrectionLevel:"M"});
    res.setHeader("Content-Type","image/png"); res.setHeader("Cache-Control","no-store"); res.send(png);
  }catch(e){ console.error(e); res.status(500).send("No pude generar el QR"); }
});

app.post("/api/rooms",(req,res)=>{
  const name=clean(req.body.name,80), hostName=clean(req.body.hostName,40);
  const themeId=THEMES[req.body.themeId]?req.body.themeId:"clasico";
  const playWhen=req.body.playWhen==="later"?"later":"now";
  const eventDate=playWhen==="later"?clean(req.body.eventDate,40):"";
  if(!name||!hostName) return res.status(400).json({error:"Faltan datos."});
  if(THEMES[themeId].age18 && req.body.ageConfirmed!==true) return res.status(400).json({error:"La versión 18+ requiere confirmar mayoría de edad."});
  if(playWhen==="later"&&!eventDate) return res.status(400).json({error:"Elegí la fecha de la juntada."});

  let code=roomCode(); while(rooms.has(code)) code=roomCode();
  const hostId=id(), sessionToken=token();
  const tp=themePrompts(themeId);
  const room={
    code,name,themeId,playWhen,eventDate,
    state:playWhen==="later"?"collecting":"lobby",
    hostPlayerId:hostId,currentRound:0,roundPhase:"guess",unlocked:false,
    players:[{id:hostId,name:hostName,ready:false,score:0}],
    submissions:{},missions:{},rounds:[],
    prepPrompts:{
      storyPrompts:pick(tp.prep_story,3),
      majorityPrompts:pick(tp.majority,3),
      hotSeatPrompt:pick(tp.hot_seat,1)[0]||"",
      oneVsAllPrompt:pick(tp.one_vs_all,1)[0]||""
    },
    createdAt:Date.now()
  };
  rooms.set(code,room); sessions.set(sessionToken,hostId);
  res.json({code,sessionToken});
});

app.post("/api/rooms/:code/join",(req,res)=>{
  const room=getRoom(req.params.code); if(!room) return res.status(404).json({error:"Sala inexistente."});
  if(!["lobby","collecting"].includes(room.state)) return res.status(409).json({error:"La partida ya empezó."});
  const name=clean(req.body.name,40); if(!name) return res.status(400).json({error:"Escribí tu nombre."});
  if(room.players.some(p=>p.name.toLowerCase()===name.toLowerCase())) return res.status(409).json({error:"Ese nombre ya está en la sala."});
  const p={id:id(),name,ready:false,score:0}, t=token(); room.players.push(p); sessions.set(t,p.id);
  res.json({code:room.code,sessionToken:t});
});

app.get("/api/rooms/:code",(req,res)=>{
  const room=getRoom(req.params.code); if(!room) return res.status(404).json({error:"Sala inexistente."});
  res.json(snapshot(room,auth(room,req)));
});

app.post("/api/rooms/:code/start-collecting",(req,res)=>{
  const room=getRoom(req.params.code); if(!room) return res.status(404).json({error:"Sala inexistente."});
  if(!requireHost(room,req)) return res.status(403).json({error:"Solo el host."});
  if(room.players.length<3) return res.status(409).json({error:"Necesitan ser al menos 3."});
  room.state="collecting"; res.json({ok:true});
});

app.post("/api/rooms/:code/submissions",(req,res)=>{
  const room=getRoom(req.params.code), me=auth(room,req);
  if(!room) return res.status(404).json({error:"Sala inexistente."});
  if(!me) return res.status(401).json({error:"Volvé a entrar a la sala."});
  if(room.state!=="collecting") return res.status(409).json({error:"No estamos cargando respuestas."});
  const stories=Array.isArray(req.body.stories)?req.body.stories.map(x=>clean(x,280)):[];
  const truth=clean(req.body.truth,280), lie=clean(req.body.lie,280);
  const majority=Array.isArray(req.body.majority)?req.body.majority:[];
  const hotSeatAnswer=clean(req.body.hotSeatAnswer,160), oneVsAllAnswer=clean(req.body.oneVsAllAnswer,160);
  const valid=new Set(room.players.map(p=>p.id));
  if(stories.length!==3||stories.some(x=>!x)||!truth||!lie||majority.length!==3||majority.some(x=>!valid.has(x))||!hotSeatAnswer||!oneVsAllAnswer){
    return res.status(400).json({error:"Completá todo antes de enviar."});
  }
  room.submissions[me.id]={stories,truth,lie,majority,hotSeatAnswer,oneVsAllAnswer};
  me.ready=true; res.json({ok:true});
});

app.post("/api/rooms/:code/start-game",(req,res)=>{
  const room=getRoom(req.params.code); if(!room) return res.status(404).json({error:"Sala inexistente."});
  if(!requireHost(room,req)) return res.status(403).json({error:"Solo el host."});
  if(room.players.length<3) return res.status(409).json({error:"Necesitan ser al menos 3."});
  if(room.players.some(p=>!p.ready)) return res.status(409).json({error:"Todavía falta gente por responder."});
  room.players.forEach(p=>p.score=0); room.rounds=buildRounds(room); assignMissions(room);
  if(!room.rounds.length) return res.status(409).json({error:"No pude generar rondas con estas respuestas."});
  room.state="playing"; room.currentRound=0; room.roundPhase="guess"; room.unlocked=false;
  res.json({ok:true,rounds:room.rounds.length});
});

app.post("/api/rooms/:code/vote",(req,res)=>{
  const room=getRoom(req.params.code), me=auth(room,req);
  if(!room||room.state!=="playing") return res.status(409).json({error:"No hay una ronda activa."});
  if(!me) return res.status(401).json({error:"Sesión inválida."});
  if(room.roundPhase!=="guess") return res.status(409).json({error:"La ronda ya se reveló."});
  const r=room.rounds[room.currentRound]; if(me.id===r.skipVoteFor) return res.status(409).json({error:"Esta ronda habla de vos: no votás."});
  const choice=clean(req.body.choice,300);
  if(!r.options.some(o=>o.id===choice)) return res.status(400).json({error:"Opción inválida."});
  r.votes[me.id]=choice; res.json({ok:true});
});

app.post("/api/rooms/:code/reveal",(req,res)=>{
  const room=getRoom(req.params.code); if(!room||room.state!=="playing") return res.status(409).json({error:"No hay partida activa."});
  if(!requireHost(room,req)) return res.status(403).json({error:"Solo el host."});
  const r=room.rounds[room.currentRound]; scoreRound(room,r); room.roundPhase="reveal"; res.json({ok:true});
});

app.post("/api/rooms/:code/next",(req,res)=>{
  const room=getRoom(req.params.code); if(!room||room.state!=="playing") return res.status(409).json({error:"No hay partida activa."});
  if(!requireHost(room,req)) return res.status(403).json({error:"Solo el host."});
  if(room.roundPhase!=="reveal") return res.status(409).json({error:"Primero revelá la respuesta."});
  if(room.currentRound===0 && !room.unlocked && room.rounds.length>1){ room.state="paywall"; return res.json({ok:true,paywall:true}); }
  if(room.currentRound+1>=room.rounds.length){ room.state="finished"; room.roundPhase="reveal"; }
  else { room.currentRound++; room.roundPhase="guess"; }
  res.json({ok:true});
});

app.post("/api/rooms/:code/unlock-test",(req,res)=>{
  const room=getRoom(req.params.code); if(!room) return res.status(404).json({error:"Sala inexistente."});
  if(!requireHost(room,req)) return res.status(403).json({error:"Solo el host."});
  room.unlocked=true; room.state="playing"; room.currentRound=Math.min(1,room.rounds.length-1); room.roundPhase="guess";
  res.json({ok:true});
});

app.post("/api/rooms/:code/restart",(req,res)=>{
  const room=getRoom(req.params.code); if(!room) return res.status(404).json({error:"Sala inexistente."});
  if(!requireHost(room,req)) return res.status(403).json({error:"Solo el host."});
  room.players.forEach(p=>{p.ready=false;p.score=0;}); room.submissions={}; room.missions={}; room.rounds=[];
  room.state="collecting"; room.currentRound=0; room.roundPhase="guess"; room.unlocked=false;
  res.json({ok:true});
});

app.use((_req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,"0.0.0.0",()=>console.log(`La Noche content engine running on :${PORT}`));
