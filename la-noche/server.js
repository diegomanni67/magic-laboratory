import express from "express";
import crypto from "crypto";
import path from "path";
import QRCode from "qrcode";
import pg from "pg";
import { fileURLToPath } from "url";
import { THEMES, MODES, THEME_MODES, PROMPTS, DUO_CHOICES } from "./content.js";

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const app=express();
const PORT=process.env.PORT||3000;
const {Pool}=pg;
const db=process.env.DATABASE_URL?new Pool({connectionString:process.env.DATABASE_URL}):null;
app.use(express.json({limit:"250kb"}));
app.use(express.static(path.join(__dirname,"public")));

const rooms=new Map();
const sessions=new Map();
const customPackStore=new Map();

function sessionKey(raw){return crypto.createHash("sha256").update(String(raw||"")).digest("hex")}
async function persistRoom(room){
  if(!db||!room)return;
  try{
    await db.query(
      `INSERT INTO game_rooms(code,data,state,updated_at,created_at)
       VALUES($1,$2::jsonb,$3,now(),to_timestamp($4/1000.0))
       ON CONFLICT(code) DO UPDATE SET data=EXCLUDED.data,state=EXCLUDED.state,updated_at=now()`,
      [room.code,JSON.stringify(room),room.state,room.createdAt||Date.now()]
    );
  }catch(e){console.error("persistRoom",e.message)}
}
async function persistSession(rawToken,roomCode,playerId){
  if(!db||!rawToken)return;
  try{
    await db.query(
      `INSERT INTO game_sessions(token_hash,room_code,player_id)
       VALUES($1,$2,$3)
       ON CONFLICT(token_hash) DO UPDATE SET room_code=EXCLUDED.room_code,player_id=EXCLUDED.player_id`,
      [sessionKey(rawToken),roomCode,playerId]
    );
  }catch(e){console.error("persistSession",e.message)}
}
async function persistAccess(a){
  if(!db||!a?.id)return;
  try{
    await db.query(
      `INSERT INTO access_passes(access_id,plan,role,room_code,expires_at,last_seen_at)
       VALUES($1,$2,$3,$4,$5,now())
       ON CONFLICT(access_id) DO UPDATE SET plan=EXCLUDED.plan,role=EXCLUDED.role,room_code=EXCLUDED.room_code,expires_at=EXCLUDED.expires_at,last_seen_at=now()`,
      [a.id,a.plan,a.role||"customer",a.roomCode||null,a.exp?new Date(a.exp):null]
    );
  }catch(e){console.error("persistAccess",e.message)}
}
async function persistCustomPack(ownerAccessId,pack){
  if(!db||!ownerAccessId||!pack?.id)return;
  try{
    await db.query(
      `INSERT INTO custom_packs(id,owner_access_id,name,description,mix_mode,content,created_at,updated_at)
       VALUES($1::uuid,$2,$3,$4,$5,$6::jsonb,now(),to_timestamp($7/1000.0))
       ON CONFLICT(id) DO UPDATE SET owner_access_id=EXCLUDED.owner_access_id,name=EXCLUDED.name,description=EXCLUDED.description,mix_mode=EXCLUDED.mix_mode,content=EXCLUDED.content,updated_at=EXCLUDED.updated_at`,
      [pack.id,ownerAccessId,pack.name,pack.description||"",pack.mixMode,JSON.stringify(pack.content||{}),pack.updatedAt||Date.now()]
    );
  }catch(e){console.error("persistCustomPack",e.message)}
}
async function deleteCustomPackPersisted(ownerAccessId,packId){
  if(!db)return;
  try{await db.query("DELETE FROM custom_packs WHERE id=$1::uuid AND owner_access_id=$2",[packId,ownerAccessId])}
  catch(e){console.error("deleteCustomPack",e.message)}
}
function packOwnerAccess(req){
  const a=accessFromReq(req);
  if(!accessCanCreatePremium(a))return null;
  return a;
}

async function hydrateDatabase(){
  if(!db){console.log("Persistence: memory fallback");return}
  try{
    const rr=await db.query("SELECT code,data FROM game_rooms");
    rr.rows.forEach(row=>rooms.set(row.code,row.data));
    const ss=await db.query("SELECT token_hash,player_id FROM game_sessions");
    ss.rows.forEach(row=>sessions.set(row.token_hash,row.player_id));
    const pp=await db.query("SELECT id,owner_access_id,name,description,mix_mode,content,extract(epoch from updated_at)*1000 AS updated_ms FROM custom_packs");
    pp.rows.forEach(row=>customPackStore.set(row.owner_access_id+":"+row.id,{
      id:row.id,name:row.name,description:row.description||"",mixMode:row.mix_mode||"mixed",content:row.content||{},updatedAt:Number(row.updated_ms)||Date.now()
    }));
    console.log(`Persistence: loaded ${rr.rowCount} rooms, ${ss.rowCount} sessions and ${pp.rowCount} custom packs`);
  }catch(e){console.error("hydrateDatabase",e.message)}
}

const IMPLEMENTED_MODES=["quien_fue","lee_al_grupo","mentiroso","silla_caliente","todos_contra_uno","duo","ordena_al_grupo"];
const AUTO_ADVANCE_MS=4200;
const MODE_ROUND_CAPS={quien_fue:6,lee_al_grupo:3,mentiroso:6,silla_caliente:4,todos_contra_uno:3,duo:2,ordena_al_grupo:2};
const ACCESS_PLANS=[
  {id:"single",title:"Esta Juntada",billing:"one_time",unlimited:false,description:"Desbloquea únicamente esta partida completa."},
  {id:"day",title:"Pase 24 horas",billing:"day",unlimited:true,description:"Creá y jugá todas las juntadas que quieras durante 24 horas."},
  {id:"monthly",title:"Pase mensual",billing:"monthly",unlimited:true,description:"Partidas ilimitadas durante 30 días."},
  {id:"annual",title:"Pase anual",billing:"annual",unlimited:true,description:"Partidas ilimitadas durante 365 días."},
  {id:"lifetime",title:"De por vida",billing:"lifetime",unlimited:true,description:"Partidas ilimitadas para siempre."}
];

const SURPRISE_QUICK_QUESTIONS=[
  {id:"plan",question:"Si hoy pudieras elegir el plan perfecto, ¿con cuál te quedás?",options:[
    {id:"salir",label:"Salir sin plan"},{id:"cena",label:"Cena larga"},{id:"casa",label:"Casa y película"},{id:"nuevo",label:"Probar algo nuevo"}
  ]},
  {id:"viaje",question:"En un viaje sos más de…",options:[
    {id:"planear",label:"Planear todo"},{id:"improvisar",label:"Improvisar"},{id:"comer",label:"Buscar dónde comer"},{id:"dormir",label:"Dormir hasta tarde"}
  ]},
  {id:"regalo",question:"Si mañana te regalan una de estas cosas, ¿qué elegís?",options:[
    {id:"viaje",label:"Un viaje"},{id:"entradas",label:"Entradas para algo"},{id:"objeto",label:"Algo que querías hace tiempo"},{id:"sorpresa",label:"Una experiencia sorpresa"}
  ]}
];


function id(){return crypto.randomUUID()}
function token(){return crypto.randomBytes(24).toString("hex")}
function clean(v,max=180){return String(v??"").trim().replace(/\s+/g," ").slice(0,max)}
function shuffle(a){const x=[...(a||[])];for(let i=x.length-1;i>0;i--){const j=crypto.randomInt(i+1);[x[i],x[j]]=[x[j],x[i]]}return x}
function pick(a,n=1){return shuffle(a).slice(0,n)}
function roomCode(){const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let s="";for(let i=0;i<6;i++)s+=c[crypto.randomInt(c.length)];return s}
function bearer(req){const h=req.headers.authorization||"";return h.startsWith("Bearer ")?h.slice(7):""}
function getRoom(code){return rooms.get(String(code||"").toUpperCase())}
function auth(room,req){const pid=sessions.get(sessionKey(bearer(req)));return room?.players.find(p=>p.id===pid)||null}
function requireHost(room,req){const me=auth(room,req);return me&&me.id===room.hostPlayerId?me:null}
function themePrompts(themeId){return PROMPTS[themeId]||PROMPTS.clasico}
function cleanList(v,maxItems=40,maxLen=220){
  return Array.isArray(v)?v.map(x=>clean(x,maxLen)).filter(Boolean).slice(0,maxItems):[];
}
function sanitizeCustomPack(raw){
  if(!raw||typeof raw!=="object")return null;
  const content=raw.content&&typeof raw.content==="object"?raw.content:{};
  const duo=Array.isArray(content.duo)?content.duo.map(x=>({
    question:clean(x?.question,180),a:clean(x?.a,90),b:clean(x?.b,90)
  })).filter(x=>x.question&&x.a&&x.b).slice(0,30):[];
  const rawId=clean(raw.id,80);
  const safeId=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawId)?rawId:id();
  return {
    id:safeId,
    name:clean(raw.name,70)||"Mi pack",
    description:clean(raw.description,180),
    mixMode:raw.mixMode==="custom_first"?"custom_first":"mixed",
    updatedAt:Number(raw.updatedAt)||Date.now(),
    content:{
      prep_story:cleanList(content.prep_story,40,220),
      majority:cleanList(content.majority,40,180),
      hot_seat:cleanList(content.hot_seat,30,180),
      one_vs_all:cleanList(content.one_vs_all,30,180),
      rank:cleanList(content.rank,30,180),
      missions:cleanList(content.missions,40,180),
      duo
    }
  };
}
function packBank(room,key,official=[]){
  const own=room.customPack?.content?.[key];
  if(!Array.isArray(own)||!own.length)return official;
  return room.customPack.mixMode==="custom_first"?[...own,...official]:shuffle([...official,...own]);
}
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

const DEV_ADMIN_CODE_HASH="74ee341358f857c9bd68792e073ab2142ba405ac3c19b7a91547a6e39a935573";
const ACCESS_SIGNING_SECRET=process.env.ACCESS_SIGNING_SECRET||crypto.createHash("sha256").update("la-juntada-access-v1|"+DEV_ADMIN_CODE_HASH).digest("hex");
const ACCESS_HEADER="x-la-juntada-access";
function b64url(value){return Buffer.from(value).toString("base64url")}
function accessSignature(body){
  if(!ACCESS_SIGNING_SECRET)return "";
  return crypto.createHmac("sha256",ACCESS_SIGNING_SECRET).update(body).digest("base64url");
}
function planExpiry(plan,now=Date.now()){
  if(plan==="day")return now+24*60*60*1000;
  if(plan==="monthly")return now+30*24*60*60*1000;
  if(plan==="annual")return now+365*24*60*60*1000;
  return null;
}
function mintAccess({plan="single",role="customer",roomCode=null}={}){
  if(!ACCESS_SIGNING_SECRET)throw new Error("ACCESS_SIGNING_SECRET no configurado");
  const now=Date.now(),exp=role==="admin"||plan==="lifetime"?null:planExpiry(plan,now);
  const payload={v:1,id:crypto.randomBytes(8).toString("hex"),plan,role,roomCode:roomCode||null,iat:now,exp};
  const body=b64url(JSON.stringify(payload));
  return "LJ1."+body+"."+accessSignature(body);
}
function readAccessToken(raw){
  try{
    if(!raw||typeof raw!=="string")return null;
    const [prefix,body,sig]=raw.trim().split(".");
    if(prefix!=="LJ1"||!body||!sig||!ACCESS_SIGNING_SECRET)return null;
    const expected=accessSignature(body);
    const a=Buffer.from(sig),b=Buffer.from(expected);
    if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return null;
    const payload=JSON.parse(Buffer.from(body,"base64url").toString("utf8"));
    if(payload.v!==1)return null;
    if(payload.exp&&Date.now()>payload.exp)return {...payload,expired:true};
    return {...payload,expired:false};
  }catch{return null}
}
function accessFromReq(req){return readAccessToken(req.headers[ACCESS_HEADER])}
function accessPublic(a){
  if(!a)return {active:false};
  return {
    active:!a.expired,
    expired:!!a.expired,
    accessId:a.id||null,
    plan:a.plan,
    role:a.role||"customer",
    roomCode:a.roomCode||null,
    issuedAt:a.iat||null,
    expiresAt:a.exp||null,
    title:a.role==="admin"?"Administrador":(ACCESS_PLANS.find(p=>p.id===a.plan)?.title||a.plan)
  };
}
function accessCanCreatePremium(a){
  return !!a&&!a.expired&&(a.role==="admin"||["day","monthly","annual","lifetime"].includes(a.plan));
}
function accessCanUnlockRoom(a,room){
  if(!a||a.expired)return false;
  if(a.role==="admin"||["day","monthly","annual","lifetime"].includes(a.plan))return true;
  return a.plan==="single"&&a.roomCode===room?.code;
}
function hasPremiumAccess(req){return accessCanCreatePremium(accessFromReq(req))}
function constantTimeTextEqual(a,b){
  const x=Buffer.from(String(a||"")),y=Buffer.from(String(b||""));
  return x.length===y.length&&crypto.timingSafeEqual(x,y);
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
  if((room.disabledModes||[]).includes("mision_secreta")||!(THEME_MODES[room.themeId]||[]).includes("mision_secreta"))return;
  const bank=packBank(room,"missions",themePrompts(room.themeId).missions||[]);
  if(!bank.length)return;
  const shuffled=shuffle(bank);
  room.players.forEach((p,i)=>{room.missions[p.id]={text:shuffled[i%shuffled.length],status:"active",points:250}});
}
function buildRounds(room){
  const disabled=new Set(room.disabledModes||[]);
  const allowed=(THEME_MODES[room.themeId]||THEME_MODES.clasico).filter(x=>IMPLEMENTED_MODES.includes(x)&&!disabled.has(x));
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
    const bank=packBank(room,"duo",DUO_CHOICES[room.themeId]||[]);
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
    const rankBank=packBank(room,"rank",themePrompts(room.themeId).rank||[]);
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

  if(room.surprise?.enabled){
    const honoree=room.players.find(p=>p.id===room.surprise.honoreePlayerId);
    const contributors=room.players.filter(p=>!p.isHonoree);
    const memories=[];
    for(const p of contributors){
      const memory=room.submissions[p.id]?.surpriseMemory;
      if(memory)memories.push({p,memory});
    }
    pick(memories,Math.min(4,memories.length)).forEach(x=>add({
      mode:"quien_fue",
      prompt:`Sorpresa para ${room.surprise.honoreeName} · ¿Quién escribió esto?`,
      statement:x.memory,correct:x.p.id,authorId:x.p.id,skipVoteFor:x.p.id,surpriseRound:true,
      options:contributors.map(p=>({id:p.id,label:p.name,sourcePlayerId:p.id}))
    }));
    if(honoree&&Array.isArray(room.surprise.honoreeAnswers)){
      const qs=room.surprise.quickQuestions||SURPRISE_QUICK_QUESTIONS;
      qs.forEach((q,i)=>{
        const correct=room.surprise.honoreeAnswers[i];
        if(!correct)return;
        add({
          mode:"silla_caliente",
          prompt:`Sorpresa · ¿Qué eligió ${honoree.name}?`,
          statement:q.question,correct,protagonistId:honoree.id,skipVoteFor:honoree.id,surpriseRound:true,
          options:q.options.map(o=>({id:o.id,label:o.label}))
        });
      });
    }
  }

  const mixed=shuffle(rounds);
  const firstWho=mixed.findIndex(r=>r.mode==="quien_fue");
  if(firstWho>0){const [r]=mixed.splice(firstWho,1);mixed.unshift(r)}
  const limit=room.roundLimit||15;
  if(room.surprise?.enabled){
    const special=mixed.filter(r=>r.surpriseRound);
    const regular=mixed.filter(r=>!r.surpriseRound);
    const guaranteed=shuffle(special).slice(0,Math.min(special.length,Math.max(3,Math.floor(limit/3))));
    const rest=shuffle([...regular,...special.filter(r=>!guaranteed.includes(r))]);
    const final=[];
    let gi=0,ri=0;
    while(final.length<limit&&(gi<guaranteed.length||ri<rest.length)){
      if(gi<guaranteed.length)final.push(guaranteed[gi++]);
      if(final.length<limit&&ri<rest.length)final.push(rest[ri++]);
    }
    return final.slice(0,limit).map((r,i)=>({...r,position:i}));
  }
  return mixed.slice(0,limit).map((r,i)=>({...r,position:i}));
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
  let changed=false;
  if(room.state==="starting"){
    if(room.startAt&&Date.now()>=room.startAt){room.state="playing";room.startAt=null;changed=true}
    if(changed)persistRoom(room);
    return;
  }
  if(room.state!=="playing"||room.roundPhase!=="locked"||!room.advanceAt||Date.now()<room.advanceAt)return;
  room.advanceAt=null;changed=true;
  if(room.currentRound===0&&!room.unlocked&&room.rounds.length>1){room.state="paywall";persistRoom(room);return}
  if(room.currentRound+1>=room.rounds.length){room.state="finished";room.roundPhase="done";room.finishedAt=Date.now();persistRoom(room);return}
  room.currentRound++;
  room.roundPhase="guess";
  if(changed)persistRoom(room);
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
  const removed=room.players.find(p=>p.id===pid);
  room.players=room.players.filter(p=>p.id!==pid);
  if(removed?.isHonoree&&room.surprise){room.surprise.honoreePlayerId=null;delete room.surprise.honoreeAnswers}
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
      isHonoree:!!p.isHonoree,
      surpriseMemory:s.surpriseMemory||"",
      surpriseQuick:p.isHonoree&&room.surprise?.honoreeAnswers
        ?(room.surprise.quickQuestions||SURPRISE_QUICK_QUESTIONS).map((q,i)=>({
          question:q.question,
          answer:q.options.find(o=>o.id===room.surprise.honoreeAnswers[i])?.label||""
        })):[],
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
function roundPointsForViewer(room,r,viewer){
  if(!viewer||!r.scored)return 0;
  if(r.mode==="duo"){
    const pair=new Set(r.duoIds||[]),vote=r.votes[viewer.id];
    if(pair.has(viewer.id))return r.correct==="same"?100:0;
    return vote===r.correct?75:0;
  }
  if(r.mode==="ordena_al_grupo"){
    const order=r.votes[viewer.id];if(!Array.isArray(order)||!Array.isArray(r.consensus))return 0;
    const n=r.consensus.length,maxDistance=Math.max(1,Math.floor((n*n)/2));
    const dist=rankDistance(order,r.consensus);
    return Math.max(0,Math.round(150*(1-Math.min(dist,maxDistance)/maxDistance)));
  }
  if(viewer.id===r.skipVoteFor){
    const wrong=eligibleVoters(room,r).filter(p=>r.votes[p.id]!==r.correct).length;
    if(r.mode==="quien_fue"&&r.authorId===viewer.id)return Math.min(100,wrong*25);
    if(r.mode==="mentiroso"&&r.correct==="false"&&r.authorId===viewer.id)return Math.min(120,wrong*30);
    if(r.mode==="todos_contra_uno"&&r.protagonistId===viewer.id)return Math.min(120,wrong*30);
    return 0;
  }
  return r.votes[viewer.id]===r.correct?100:0;
}

function finalAnalytics(room){
  const per=Object.fromEntries(room.players.map(p=>[p.id,{detective:0,groupReader:0,liarFooled:0,hardToRead:0,duoSync:0,mission:0}]));
  let totalVotes=0,directHits=0,directAttempts=0,totalPoints=room.players.reduce((n,p)=>n+(p.score||0),0);
  const played=room.rounds.filter(r=>r.scored);

  for(const r of played){
    totalVotes+=Object.keys(r.votes||{}).length;

    if(r.mode==="quien_fue"){
      for(const p of eligibleVoters(room,r)){
        const v=r.votes[p.id];if(v===undefined)continue;
        directAttempts++;if(v===r.correct){directHits++;if(per[p.id])per[p.id].detective++}
        else if(per[r.authorId])per[r.authorId].hardToRead++;
      }
    }else if(r.mode==="lee_al_grupo"){
      for(const p of eligibleVoters(room,r)){
        const v=r.votes[p.id];if(v===undefined)continue;
        directAttempts++;if(v===r.correct){directHits++;if(per[p.id])per[p.id].groupReader++}
      }
    }else if(r.mode==="mentiroso"){
      for(const p of eligibleVoters(room,r)){
        const v=r.votes[p.id];if(v===undefined)continue;
        directAttempts++;if(v===r.correct)directHits++;
        else if(r.correct==="false"&&per[r.authorId])per[r.authorId].liarFooled++;
      }
    }else if(r.mode==="silla_caliente"||r.mode==="todos_contra_uno"){
      for(const p of eligibleVoters(room,r)){
        const v=r.votes[p.id];if(v===undefined)continue;
        directAttempts++;if(v===r.correct)directHits++;
        else if(per[r.protagonistId])per[r.protagonistId].hardToRead++;
      }
    }else if(r.mode==="duo"){
      const actual=r.correct||duoActual(room,r),pair=new Set(r.duoIds||[]);
      for(const p of room.players){
        const v=r.votes[p.id];if(v===undefined)continue;
        directAttempts++;
        if(pair.has(p.id)){
          if(actual==="same"){directHits++;if(per[p.id])per[p.id].duoSync++}
        }else if(v===actual)directHits++;
      }
    }
  }

  for(const p of room.players){
    const m=room.missions[p.id];
    if(m?.status==="completed"&&per[p.id])per[p.id].mission=1;
  }

  function award(metric,title,icon,description,valueLabel){
    const values=room.players.map(p=>({p,value:per[p.id]?.[metric]||0}));
    const max=Math.max(0,...values.map(x=>x.value));
    if(max<=0)return null;
    const winners=values.filter(x=>x.value===max).map(x=>x.p.name);
    return {id:metric,title,icon,players:winners,value:max,label:valueLabel(max,winners.length),description};
  }

  const awards=[
    award("detective","Mejor detective","⌕","El que más veces descubrió de quién era una historia.",v=>v+" acierto"+(v===1?"":"s")+" en ¿Quién fue?"),
    award("liarFooled","Mejor mentiroso","◐","El que consiguió que más personas compraran una mentira.",v=>v+" persona"+(v===1?"":"s")+" engañada"+(v===1?"":"s")),
    award("groupReader","Leyó al grupo","◎","El que mejor anticipó lo que había elegido la mayoría.",v=>v+" mayoría"+(v===1?"":"s")+" acertada"+(v===1?"":"s")),
    award("hardToRead","Más difícil de descifrar","◇","El que más hizo fallar al resto cuando la ronda hablaba de él.",v=>v+" voto"+(v===1?"":"s")+" errado"+(v===1?"":"s")+" contra él"),
    award("duoSync","Modo telepatía","∞","Integrante de dúo que más veces coincidió con su pareja.",v=>v+" coincidencia"+(v===1?"":"s")),
    award("mission","Misión cumplida","✦","Completó su objetivo secreto durante la juntada.",v=>v+" misión cumplida")
  ].filter(Boolean);

  const ranking=[...room.players].sort((a,b)=>(b.score||0)-(a.score||0));
  return {
    roundsPlayed:played.length,
    modesPlayed:new Set(played.map(r=>r.mode)).size,
    totalVotes,
    directHits,
    directAttempts,
    accuracy:directAttempts?Math.round(directHits/directAttempts*100):0,
    missionsCompleted:room.players.filter(p=>room.missions[p.id]?.status==="completed").length,
    totalPoints,
    winnerMargin:ranking.length>1?Math.max(0,(ranking[0].score||0)-(ranking[1].score||0)):0,
    awards
  };
}

function roundArchive(room){
  return room.rounds.map(r=>({mode:r.mode,modeTitle:modeInfo(r.mode).title,prompt:r.prompt,statement:r.statement,answer:answerForRound(room,r)}));
}
function roundSnapshot(room,raw,viewer){
  const base={
    id:raw.id,position:raw.position,mode:raw.mode,modeTitle:modeInfo(raw.mode).title,modeEmoji:modeInfo(raw.mode).emoji,
    prompt:raw.prompt,statement:raw.statement,
    voteCount:Object.keys(raw.votes).length,eligibleVoters:eligibleVoters(room,raw).length,
    locked:room.roundPhase==="locked",
    reveal:room.roundPhase==="locked"?{answer:answerForRound(room,raw),ownPoints:roundPointsForViewer(room,raw,viewer)}:null
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
    code:room.code,name:room.name,state:room.state,roundPhase:room.roundPhase,currentRound:room.currentRound,totalRounds:room.rounds.length,startAt:room.startAt||null,advanceAt:room.advanceAt||null,
    unlocked:room.unlocked,freeRounds:1,accessPlan:room.accessPlan||null,theme:THEMES[room.themeId],themeId:room.themeId,playWhen:room.playWhen,eventDate:room.eventDate,
    customPack:room.customPack?{id:room.customPack.id,name:room.customPack.name,mixMode:room.customPack.mixMode}:null,
    roundLimit:room.roundLimit||15,disabledModes:room.disabledModes||[],
    surprise:room.surprise?.enabled?{
      enabled:true,
      honoreeName:room.surprise.honoreeName,
      honoreeJoined:!!room.surprise.honoreePlayerId,
      honoreePlayerId:room.surprise.honoreePlayerId||null,
      isHonoree:!!viewer?.isHonoree,
      inviteKey:viewer?.id===room.hostPlayerId?room.surprise.joinKey:null,
      quickQuestions:viewer?.isHonoree&&!viewer.ready?(room.surprise.quickQuestions||SURPRISE_QUICK_QUESTIONS):null
    }:null,
    prepPrompts:room.prepPrompts,availableModes:(THEME_MODES[room.themeId]||[]).map(modeInfo),
    isHost:viewer?.id===room.hostPlayerId,
    me:viewer?{id:viewer.id,name:viewer.name,ready:viewer.ready,isHonoree:!!viewer.isHonoree,score:finished?viewer.score:null}:null,
    players:room.players.map(p=>({id:p.id,name:p.name,ready:p.ready,isHonoree:!!p.isHonoree,score:finished?p.score:null,isHost:p.id===room.hostPlayerId})),
    round:raw&&room.state==="playing"?roundSnapshot(room,raw,viewer):null,
    mission:viewer?room.missions[viewer.id]||null:null,
    answers:finished?endArchive(room):null,
    roundAnswers:finished?roundArchive(room):null,
    finale:finished?finalAnalytics(room):null
  };
}

app.get("/api/health",(_req,res)=>res.json({ok:true,rooms:rooms.size,persistence:db?"postgres":"memory"}));
app.use("/api/rooms/:code",(req,res,next)=>{
  const roomCodeParam=req.params.code;
  if(req.method!=="GET"){
    res.on("finish",()=>{
      if(res.statusCode<400){
        const room=getRoom(roomCodeParam);
        if(room)persistRoom(room);
      }
    });
  }
  next();
});

app.get("/api/config",(_req,res)=>res.json({
  themes:Object.values(THEMES),modes:Object.values(MODES),themeModes:THEME_MODES,
  implementedModes:IMPLEMENTED_MODES,accessPlans:ACCESS_PLANS,
  devPayments:process.env.ALLOW_TEST_PREMIUM==="true",
  themeStats:Object.fromEntries(Object.keys(THEMES).map(id=>[id,themeStats(id)]))
}));
app.get("/api/access/me",(req,res)=>{
  const a=accessFromReq(req);
  res.json(accessPublic(a));
});

app.post("/api/access/restore",(req,res)=>{
  const raw=clean(req.body?.accessToken,1200);
  const a=readAccessToken(raw);
  if(!a||a.expired)return res.status(401).json({error:a?.expired?"Este pase venció.":"La clave de acceso no es válida."});
  persistAccess(a);res.json({access:accessPublic(a),accessToken:raw});
});

app.post("/api/access/admin",(req,res)=>{
  const code=clean(req.body?.code,160);
  const configured=process.env.ADMIN_MASTER_CODE||"";
  const valid=configured
    ?constantTimeTextEqual(code,configured)
    :constantTimeTextEqual(crypto.createHash("sha256").update(code).digest("hex"),DEV_ADMIN_CODE_HASH);
  if(!valid)return res.status(403).json({error:"Código de administrador incorrecto."});
  const accessToken=mintAccess({plan:"lifetime",role:"admin"});
  const access=readAccessToken(accessToken);persistAccess(access);
  res.json({access:accessPublic(access),accessToken});
});

app.get("/api/custom-packs",(req,res)=>{
  const access=packOwnerAccess(req);
  if(!access)return res.status(402).json({error:"Necesitás un pase activo para usar packs personalizados."});
  const prefix=access.id+":";
  const packs=[...customPackStore.entries()].filter(([k])=>k.startsWith(prefix)).map(([,v])=>v).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  res.json({packs});
});

app.post("/api/custom-packs/sync",(req,res)=>{
  const access=packOwnerAccess(req);
  if(!access)return res.status(402).json({error:"Necesitás un pase activo para sincronizar packs."});
  const incoming=Array.isArray(req.body?.packs)?req.body.packs.slice(0,30):[];
  for(const raw of incoming){
    const pack=sanitizeCustomPack(raw);if(!pack)continue;
    const key=access.id+":"+pack.id,current=customPackStore.get(key);
    if(!current||(pack.updatedAt||0)>=(current.updatedAt||0)){
      customPackStore.set(key,pack);persistCustomPack(access.id,pack);
    }
  }
  const prefix=access.id+":";
  const packs=[...customPackStore.entries()].filter(([k])=>k.startsWith(prefix)).map(([,v])=>v).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  res.json({packs});
});

app.delete("/api/custom-packs/:packId",(req,res)=>{
  const access=packOwnerAccess(req);
  if(!access)return res.status(402).json({error:"Necesitás un pase activo."});
  const packId=clean(req.params.packId,80),key=access.id+":"+packId;
  customPackStore.delete(key);deleteCustomPackPersisted(access.id,packId);
  res.json({ok:true});
});

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
  const customPack=sanitizeCustomPack(req.body.customPack);
  if(customPack&&!hasPremiumAccess(req))return res.status(402).json({error:"La personalización es Premium. Necesitás un pase activo."});
  const surpriseEnabled=req.body.surpriseMode===true;
  const honoreeName=surpriseEnabled?clean(req.body.honoreeName,40):"";
  if(surpriseEnabled&&!hasPremiumAccess(req))return res.status(402).json({error:"Armala para alguien es Premium. Necesitás un pase activo."});
  if(surpriseEnabled&&!honoreeName)return res.status(400).json({error:"Decinos para quién es la sorpresa."});
  const roundLimit=[8,15,25].includes(Number(req.body.roundLimit))?Number(req.body.roundLimit):15;
  const disabledModes=Array.isArray(req.body.disabledModes)?req.body.disabledModes.filter(x=>MODES[x]).slice(0,12):[];
  const playWhen=req.body.playWhen==="later"?"later":"now",eventDate=playWhen==="later"?clean(req.body.eventDate,40):"";
  if(!name||!hostName)return res.status(400).json({error:"Faltan datos."});
  if(surpriseEnabled&&honoreeName.toLowerCase()===hostName.toLowerCase())return res.status(400).json({error:"La persona sorpresa no puede tener el mismo nombre que el host."});
  if(THEMES[themeId].premiumOnly&&!hasPremiumAccess(req))return res.status(402).json({error:"Esta temática es Premium +18. Necesitás comprar una partida o tener un pase activo para crearla."});
  if(THEMES[themeId].age18&&req.body.ageConfirmed!==true)return res.status(400).json({error:"La versión 18+ requiere confirmar mayoría de edad."});
  if(playWhen==="later"&&!eventDate)return res.status(400).json({error:"Elegí la fecha de la juntada."});
  let code=roomCode();while(rooms.has(code))code=roomCode();
  const hostId=id(),sessionToken=token(),tp=themePrompts(themeId),access=accessFromReq(req);
  const inheritedAccess=accessCanCreatePremium(access);
  const room={
    code,name,themeId,playWhen,eventDate,state:playWhen==="later"?"collecting":"lobby",
    hostPlayerId:hostId,currentRound:0,roundPhase:"guess",advanceAt:null,startAt:null,unlocked:inheritedAccess,accessPlan:inheritedAccess?(access.role==="admin"?"admin":access.plan):null,
    players:[{id:hostId,name:hostName,ready:false,score:0}],submissions:{},missions:{},rounds:[],
    customPack,
    surprise:surpriseEnabled?{
      enabled:true,honoreeName,honoreePlayerId:null,joinKey:token(),quickQuestions:SURPRISE_QUICK_QUESTIONS
    }:null,
    roundLimit,
    disabledModes,
    prepPrompts:{
      storyPrompts:pick(customPack?packBank({customPack},"prep_story",tp.prep_story):tp.prep_story,3),
      majorityPrompts:pick(customPack?packBank({customPack},"majority",tp.majority):tp.majority,3),
      hotSeatPrompt:pick(customPack?packBank({customPack},"hot_seat",tp.hot_seat):tp.hot_seat,1)[0]||"",
      oneVsAllPrompt:pick(customPack?packBank({customPack},"one_vs_all",tp.one_vs_all):tp.one_vs_all,1)[0]||""
    },
    createdAt:Date.now()
  };
  rooms.set(code,room);sessions.set(sessionKey(sessionToken),hostId);persistRoom(room).then(()=>persistSession(sessionToken,code,hostId));res.json({code,sessionToken});
});

app.post("/api/rooms/:code/join",(req,res)=>{
  const room=getRoom(req.params.code);if(!room)return res.status(404).json({error:"Sala inexistente."});
  if(room.state==="finished")return res.status(409).json({error:"Esta partida ya terminó."});
  const suppliedHonoreeKey=clean(req.body.honoreeKey,120);
  const isHonoree=!!(room.surprise?.enabled&&suppliedHonoreeKey&&constantTimeTextEqual(suppliedHonoreeKey,room.surprise.joinKey));
  if(isHonoree&&room.surprise.honoreePlayerId)return res.status(409).json({error:room.surprise.honoreeName+" ya entró a la sala."});
  if(isHonoree&&["starting","playing","paywall","finished"].includes(room.state))return res.status(409).json({error:"La sorpresa ya empezó."});
  const name=isHonoree?room.surprise.honoreeName:clean(req.body.name,40);
  if(!name)return res.status(400).json({error:"Escribí tu nombre."});
  if(room.players.some(p=>p.name.toLowerCase()===name.toLowerCase()))return res.status(409).json({error:"Ese nombre ya está en la sala."});
  const alreadyPlaying=["starting","playing","paywall"].includes(room.state);
  const p={id:id(),name,ready:isHonoree?false:alreadyPlaying,score:0,isHonoree},t=token();
  room.players.push(p);
  if(isHonoree)room.surprise.honoreePlayerId=p.id;
  sessions.set(sessionKey(t),p.id);persistSession(t,room.code,p.id);
  if(alreadyPlaying&&room.state==="playing"&&room.roundPhase==="guess")finalizeRound(room);
  res.json({code:room.code,sessionToken:t,lateJoin:alreadyPlaying,isHonoree});
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
  if(me.isHonoree)return res.status(409).json({error:"Tu preparación sorpresa usa solo las 3 preguntas rápidas."});
  const stories=Array.isArray(req.body.stories)?req.body.stories.map(x=>clean(x,280)):[],
        truth=clean(req.body.truth,280),lie=clean(req.body.lie,280),
        majority=Array.isArray(req.body.majority)?req.body.majority:[],
        hotSeatAnswer=clean(req.body.hotSeatAnswer,160),oneVsAllAnswer=clean(req.body.oneVsAllAnswer,160),
        surpriseMemory=room.surprise?.enabled?clean(req.body.surpriseMemory,320):"";
  const valid=new Set(room.players.map(p=>p.id));
  if(stories.length!==3||stories.some(x=>!x)||!truth||!lie||majority.length!==3||majority.some(x=>!valid.has(x))||!hotSeatAnswer||!oneVsAllAnswer||(room.surprise?.enabled&&!surpriseMemory)){
    return res.status(400).json({error:"Completá todo antes de enviar."});
  }
  room.submissions[me.id]={stories,truth,lie,majority,hotSeatAnswer,oneVsAllAnswer,surpriseMemory};
  me.ready=true;res.json({ok:true});
});

app.post("/api/rooms/:code/surprise-honoree",(req,res)=>{
  const room=getRoom(req.params.code),me=auth(room,req);
  if(!room)return res.status(404).json({error:"Sala inexistente."});
  if(!me||!me.isHonoree||room.surprise?.honoreePlayerId!==me.id)return res.status(403).json({error:"Este acceso es solo para la persona sorpresa."});
  if(room.state!=="collecting")return res.status(409).json({error:"La preparación ya cerró."});
  const answers=Array.isArray(req.body.answers)?req.body.answers.map(x=>clean(x,80)):[];
  const qs=room.surprise.quickQuestions||SURPRISE_QUICK_QUESTIONS;
  if(answers.length!==qs.length)return res.status(400).json({error:"Respondé las 3 preguntas."});
  for(let i=0;i<qs.length;i++){
    if(!qs[i].options.some(o=>o.id===answers[i]))return res.status(400).json({error:"Respuesta inválida."});
  }
  room.surprise.honoreeAnswers=answers;
  me.ready=true;
  res.json({ok:true});
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
  if(room.surprise?.enabled&&!room.surprise.honoreePlayerId)return res.status(409).json({error:"Todavía falta que entre "+room.surprise.honoreeName+" con su link sorpresa."});
  if(room.players.some(p=>!p.ready))return res.status(409).json({error:"Todavía falta gente por responder."});
  room.players.forEach(p=>p.score=0);
  room.rounds=buildRounds(room);assignMissions(room);
  if(!room.rounds.length)return res.status(409).json({error:"No pude generar rondas con estas respuestas."});
  room.state="starting";room.currentRound=0;room.roundPhase="guess";room.advanceAt=null;room.unlocked=false;
  room.startAt=Date.now()+4200;
  res.json({ok:true,rounds:room.rounds.length,startAt:room.startAt});
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

app.post("/api/rooms/:code/use-access",(req,res)=>{
  const room=getRoom(req.params.code);if(!room)return res.status(404).json({error:"Sala inexistente."});
  if(!requireHost(room,req))return res.status(403).json({error:"Solo el host."});
  const access=accessFromReq(req);
  if(!accessCanUnlockRoom(access,room))return res.status(402).json({error:"Este pase no desbloquea esta partida."});
  room.accessPlan=access.role==="admin"?"admin":access.plan;room.unlocked=true;
  if(room.state==="paywall"){room.state="playing";room.currentRound=Math.min(1,room.rounds.length-1);room.roundPhase="guess";room.advanceAt=null}
  res.json({ok:true,accessPlan:room.accessPlan,access:accessPublic(access)});
});

app.post("/api/rooms/:code/unlock-test",(req,res)=>{
  const room=getRoom(req.params.code);if(!room)return res.status(404).json({error:"Sala inexistente."});
  if(!requireHost(room,req))return res.status(403).json({error:"Solo el host."});
  if(process.env.ALLOW_TEST_PREMIUM!=="true")return res.status(404).json({error:"Checkout de prueba desactivado."});
  const accessPlan=ACCESS_PLANS.find(p=>p.id===req.body?.accessPlan)?.id||"single";
  const accessToken=mintAccess({plan:accessPlan,roomCode:accessPlan==="single"?room.code:null});
  const access=readAccessToken(accessToken);persistAccess(access);
  room.accessPlan=accessPlan;room.unlocked=true;room.state="playing";
  room.currentRound=Math.min(1,room.rounds.length-1);room.roundPhase="guess";room.advanceAt=null;
  res.json({ok:true,accessPlan,access:accessPublic(access),accessToken});
});

app.post("/api/rooms/:code/restart",(req,res)=>{
  const room=getRoom(req.params.code);if(!room)return res.status(404).json({error:"Sala inexistente."});
  if(!requireHost(room,req))return res.status(403).json({error:"Solo el host."});
  room.players=room.players.filter(p=>!p.isHonoree);
  room.players.forEach(p=>{p.ready=false;p.score=0});
  if(room.surprise){room.surprise.honoreePlayerId=null;delete room.surprise.honoreeAnswers;room.surprise.joinKey=token()}
  room.submissions={};room.missions={};room.rounds=[];
  const tp=themePrompts(room.themeId);
  room.prepPrompts={
    storyPrompts:pick(packBank(room,"prep_story",tp.prep_story),3),
    majorityPrompts:pick(packBank(room,"majority",tp.majority),3),
    hotSeatPrompt:pick(packBank(room,"hot_seat",tp.hot_seat),1)[0]||"",
    oneVsAllPrompt:pick(packBank(room,"one_vs_all",tp.one_vs_all),1)[0]||""
  };
  room.state="collecting";room.currentRound=0;room.roundPhase="guess";room.advanceAt=null;room.startAt=null;room.unlocked=false;
  res.json({ok:true});
});

app.use((_req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
hydrateDatabase().finally(()=>{
  app.listen(PORT,"0.0.0.0",()=>console.log(`La Noche full game engine running on :${PORT}`));
});
