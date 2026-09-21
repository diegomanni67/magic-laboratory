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

const IMPLEMENTED_MODES=["quien_fue","lee_al_grupo","mentiroso","silla_caliente","todos_contra_uno","duo","ordena_al_grupo","duo_coincidimos","duo_dilema","duo_duelo","duo_5seg"];
const AUTO_ADVANCE_MS=4200;
const MODE_ROUND_CAPS={quien_fue:6,lee_al_grupo:3,mentiroso:6,silla_caliente:4,todos_contra_uno:3,duo:2,ordena_al_grupo:2};
const DEFAULT_PREMIUM_PRICE=5000;
const ACCESS_PLANS=[
  {id:"lifetime",title:"Premium para siempre",billing:"lifetime",unlimited:true,description:"Desbloquea Canceladísimos, Picante 18+ y partidas personalizadas para siempre."}
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
function getRoom(code){
  const room=rooms.get(String(code||"").toUpperCase());
  if(room?.state==="paywall"){
    room.state="playing";room.unlocked=true;
    room.currentRound=Math.min(Math.max(1,Number(room.currentRound)||0),Math.max(0,(room.rounds?.length||1)-1));
    room.roundPhase="guess";room.advanceAt=null;
    persistRoom(room);
  }
  return room;
}
function auth(room,req){const pid=sessions.get(sessionKey(bearer(req)));return room?.players.find(p=>p.id===pid)||null}
function requireHost(room,req){const me=auth(room,req);return me&&me.id===room.hostPlayerId?me:null}
function themePrompts(themeId){return expandedThemePrompts(themeId)}
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
  const tp=themePrompts(themeId);
  const promptCount=Object.values(tp).reduce((n,val)=>n+(Array.isArray(val)?val.length:0),0)+expandedDuoBank(themeId).length;
  return {
    modeCount:modeIds.length,
    playableModeCount:playable.length,
    maxRounds,
    promptCount,
    duoQuestionCount:expandedDuoBank(themeId).length,
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


const PAYMENT_CONFIG_KEY_HEX=process.env.PAYMENT_CONFIG_ENCRYPTION_KEY||"";
const PUBLIC_BASE_URL=(process.env.PUBLIC_BASE_URL||"https://la-noche-mvp.onrender.com").replace(/\/$/,"");
const PAYMENT_PROVIDER="mercadopago";
const PAYMENT_CURRENCY="ARS";

function paymentKey(){
  if(!/^[0-9a-f]{64}$/i.test(PAYMENT_CONFIG_KEY_HEX))throw new Error("PAYMENT_CONFIG_ENCRYPTION_KEY inválida");
  return Buffer.from(PAYMENT_CONFIG_KEY_HEX,"hex");
}
function encryptPaymentSecret(value){
  if(!value)return null;
  const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv("aes-256-gcm",paymentKey(),iv);
  const enc=Buffer.concat([cipher.update(String(value),"utf8"),cipher.final()]);
  const tag=cipher.getAuthTag();
  return ["v1",iv.toString("base64url"),tag.toString("base64url"),enc.toString("base64url")].join(".");
}
function decryptPaymentSecret(value){
  if(!value)return "";
  try{
    const [v,iv,tag,data]=String(value).split(".");
    if(v!=="v1")return "";
    const decipher=crypto.createDecipheriv("aes-256-gcm",paymentKey(),Buffer.from(iv,"base64url"));
    decipher.setAuthTag(Buffer.from(tag,"base64url"));
    return Buffer.concat([decipher.update(Buffer.from(data,"base64url")),decipher.final()]).toString("utf8");
  }catch{return ""}
}
function requireAdminAccess(req){
  const a=accessFromReq(req);
  return a&&!a.expired&&a.role==="admin"?a:null;
}
function normalizePlanPrices(raw){
  const out={};
  for(const p of ACCESS_PLANS){
    const n=Number(raw?.[p.id]);
    out[p.id]=Number.isFinite(n)&&n>0?Math.round(n*100)/100:(p.id==="lifetime"?DEFAULT_PREMIUM_PRICE:null);
  }
  return out;
}
async function getPaymentSettings({secrets=false}={}){
  if(!db)return {provider:PAYMENT_PROVIDER,currency:PAYMENT_CURRENCY,prices:normalizePlanPrices({}),configured:false};
  const r=await db.query("SELECT * FROM payment_settings WHERE id='main' LIMIT 1");
  if(!r.rowCount)return {provider:PAYMENT_PROVIDER,currency:PAYMENT_CURRENCY,prices:normalizePlanPrices({}),configured:false};
  const row=r.rows[0],accessToken=decryptPaymentSecret(row.encrypted_access_token),webhookSecret=decryptPaymentSecret(row.encrypted_webhook_secret);
  const base={
    provider:PAYMENT_PROVIDER,currency:row.currency||PAYMENT_CURRENCY,prices:normalizePlanPrices(row.prices||{}),
    accessTokenConfigured:!!accessToken,webhookSecretConfigured:!!webhookSecret,
    configured:!!accessToken
  };
  return secrets?{...base,accessToken,webhookSecret}:base;
}
async function paymentPublicConfig(){
  try{
    const p=await getPaymentSettings();
    return {
      provider:p.provider,label:"Mercado Pago",currency:p.currency,configured:p.configured,
      webhookReady:p.webhookSecretConfigured,prices:p.prices,
      webhookUrl:PUBLIC_BASE_URL+"/api/payments/webhook"
    };
  }catch(e){
    console.error("paymentPublicConfig",e.message);
    return {provider:PAYMENT_PROVIDER,label:"Mercado Pago",currency:PAYMENT_CURRENCY,configured:false,webhookReady:false,prices:normalizePlanPrices({})};
  }
}
async function mpFetch(pathname,{method="GET",body=null,accessToken,idempotencyKey=null}={}){
  const headers={Accept:"application/json","Content-Type":"application/json",Authorization:"Bearer "+accessToken};
  if(idempotencyKey)headers["X-Idempotency-Key"]=idempotencyKey;
  const r=await fetch("https://api.mercadopago.com"+pathname,{method,headers,body:body?JSON.stringify(body):undefined});
  const data=await r.json().catch(()=>({}));
  if(!r.ok){
    const msg=data?.message||data?.error||data?.cause?.[0]?.description||"Mercado Pago rechazó la solicitud.";
    const err=new Error(String(msg));err.status=r.status;throw err;
  }
  return data;
}
function verifyMercadoPagoWebhook(req,secret){
  const sig=String(req.headers["x-signature"]||""),requestId=String(req.headers["x-request-id"]||"");
  const dataId=String(req.query["data.id"]||req.body?.data?.id||"").toLowerCase();
  if(!sig||!requestId||!dataId||!secret)return false;
  let ts="",v1="";
  sig.split(",").forEach(part=>{
    const [k,...rest]=part.split("="),v=rest.join("=").trim();
    if(k?.trim()==="ts")ts=v;
    if(k?.trim()==="v1")v1=v;
  });
  if(!ts||!v1)return false;
  const manifest=`id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected=crypto.createHmac("sha256",secret).update(manifest).digest("hex");
  const a=Buffer.from(v1),b=Buffer.from(expected);
  return a.length===b.length&&crypto.timingSafeEqual(a,b);
}
function paymentStatusFromProvider(order){
  const status=String(order?.status||"").toLowerCase(),detail=String(order?.status_detail||"").toLowerCase();
  if(status==="processed"&&detail==="accredited")return "approved";
  if(["failed","cancelled","canceled","expired","rejected"].includes(status)||["rejected","cancelled","canceled","expired"].includes(detail))return "failed";
  return "pending";
}
async function findLocalPaymentOrder(idOrProvider){
  if(!db)return null;
  const r=await db.query(
    "SELECT * FROM payment_orders WHERE id::text=$1 OR provider_order_id=$1 LIMIT 1",
    [String(idOrProvider||"")]
  );
  return r.rows[0]||null;
}
async function unlockPaidRoom(roomCode,plan){
  const room=getRoom(roomCode);if(!room)return;
  room.accessPlan=plan;room.unlocked=true;
  if(room.state==="paywall"){
    room.state="playing";room.currentRound=Math.min(1,room.rounds.length-1);room.roundPhase="guess";room.advanceAt=null;
  }
  await persistRoom(room);
}
async function reconcilePayment(localOrder,providerOrder){
  if(!localOrder||!providerOrder)return localOrder;
  const providerStatus=paymentStatusFromProvider(providerOrder);
  const external=String(providerOrder.external_reference||"");
  const paid=Number(providerOrder.total_paid_amount??providerOrder.total_amount??0);
  const expected=Number(localOrder.amount);
  const currency=String(providerOrder.currency||providerOrder.currency_id||localOrder.currency||"ARS");
  if(external&&external!==String(localOrder.id))throw new Error("La referencia del pago no coincide.");
  if(providerStatus==="approved"&&(Math.abs(paid-expected)>0.009||currency!==localOrder.currency))throw new Error("El monto o la moneda del pago no coinciden.");

  if(providerStatus==="approved"&&localOrder.plan==="donation"){
    const paymentId=providerOrder.transactions?.payments?.find?.(p=>p.status==="processed")?.id||
      providerOrder.transactions?.payments?.[0]?.id||null;
    const r=await db.query(
      `UPDATE payment_orders
       SET status='approved',provider_status=$2,payment_id=$3,fulfilled_at=COALESCE(fulfilled_at,now()),updated_at=now()
       WHERE id=$1 RETURNING *`,
      [localOrder.id,String(providerOrder.status_detail||providerOrder.status||"approved"),paymentId]
    );
    return r.rows[0];
  }

  if(providerStatus==="approved"&&!localOrder.access_token){
    const token=mintAccess({plan:localOrder.plan,roomCode:null});
    const access=readAccessToken(token);
    await persistAccess(access);
    const paymentId=providerOrder.transactions?.payments?.find?.(p=>p.status==="processed")?.id||
      providerOrder.transactions?.payments?.[0]?.id||null;
    const r=await db.query(
      `UPDATE payment_orders
       SET status='approved',provider_status=$2,access_token=$3,payment_id=$4,fulfilled_at=now(),updated_at=now()
       WHERE id=$1 RETURNING *`,
      [localOrder.id,String(providerOrder.status_detail||providerOrder.status||"approved"),encryptPaymentSecret(token),paymentId]
    );
    await unlockPaidRoom(localOrder.room_code,localOrder.plan);
    return r.rows[0];
  }

  const r=await db.query(
    `UPDATE payment_orders SET status=$2,provider_status=$3,updated_at=now() WHERE id=$1 RETURNING *`,
    [localOrder.id,providerStatus,String(providerOrder.status_detail||providerOrder.status||providerStatus)]
  );
  return r.rows[0];
}
async function fetchAndReconcilePayment(localOrder){
  const cfg=await getPaymentSettings({secrets:true});
  if(!cfg.accessToken||!localOrder?.provider_order_id)return localOrder;
  const providerOrder=await mpFetch("/v1/orders/"+encodeURIComponent(localOrder.provider_order_id),{accessToken:cfg.accessToken});
  return reconcilePayment(localOrder,providerOrder);
}
function paymentOrderPublic(row){
  if(!row)return null;
  return {
    id:row.id,plan:row.plan,amount:Number(row.amount),currency:row.currency,status:row.status,isDonation:row.plan==="donation",
    providerStatus:row.provider_status||null,providerOrderId:row.provider_order_id||null,
    accessToken:row.status==="approved"?decryptPaymentSecret(row.access_token):null,
    createdAt:row.created_at,fulfilledAt:row.fulfilled_at
  };
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
  const chosen=freshPick(room,"missions",bank,Math.min(room.players.length,bank.length));
  room.players.forEach((p,i)=>{room.missions[p.id]={text:chosen[i%chosen.length],status:"active",points:250}});
}
const DUO_BANKS={
  clasico:[
    ["¿Qué elegirías para una noche libre?","Salir sin plan","Casa, comida y algo para ver"],
    ["Si mañana tuvieras el día libre, ¿qué preferirías?","Dormir hasta tarde","Aprovechar desde temprano"],
    ["Para un viaje corto, ¿qué te representa más?","Improvisar","Planear todo"],
    ["¿Qué te cuesta más abandonar?","El celular","El café"],
    ["En un restaurante nuevo, ¿qué hacés?","Pedís algo conocido","Probás algo raro"],
    ["Si te regalan entradas, ¿qué elegís?","Recital","Partido o evento deportivo"],
    ["¿Qué plan te gana más fácil?","Asado con gente","Cena tranquila"],
    ["¿Qué preferís encontrar de casualidad?","Plata","Un viaje barato"],
    ["En vacaciones, ¿qué querés más?","Descansar","Hacer cosas todo el día"],
    ["¿Qué te molesta más?","Esperar","Que te apuren"],
    ["¿Qué elegís para desconectar?","Música","Serie o película"],
    ["Si hay que decidir rápido, ¿qué hacés?","Voy por intuición","Pienso pros y contras"],
    ["¿Qué te tienta más?","Comida salada","Algo dulce"],
    ["¿Qué preferís para moverte por una ciudad nueva?","Caminar","Transporte"],
    ["¿Qué te da más fiaca?","Cocinar","Ordenar"],
    ["¿Qué te resulta más fácil?","Hablar con desconocidos","Quedarte observando"],
    ["¿Qué preferís recibir?","Un regalo útil","Una sorpresa"],
    ["Si algo sale mal, ¿qué sale primero?","Reírme","Enojarme"],
    ["¿Qué te entusiasma más comprar?","Tecnología","Ropa o accesorios"],
    ["¿Qué plan gana un domingo?","Salir","Quedarme en casa"],
    ["¿Qué preferís aprender de golpe?","Un idioma","Un instrumento"],
    ["¿Qué elegirías tener gratis por un año?","Comida","Transporte"],
    ["¿Qué te representa más?","Llegar temprano","Llegar justo"],
    ["¿Qué preferís perder por una semana?","Redes sociales","Streaming"],
    ["¿Qué elegís frente a un problema?","Resolverlo ya","Dejarlo enfriar"],
    ["¿Qué te importa más en un plan?","La gente","El lugar"],
    ["¿Qué te convence más?","Una recomendación","Descubrirlo solo"],
    ["¿Qué te gusta más recibir?","Un mensaje inesperado","Una llamada"],
    ["¿Qué elegís para festejar algo?","Salir fuerte","Plan íntimo"],
    ["¿Qué te da más curiosidad?","El futuro","El pasado"]
  ],
  profundo:[
    ["Cuando tenés una decisión difícil, ¿qué pesa más?","La tranquilidad","La oportunidad"],
    ["En un mal momento, ¿qué necesitás primero?","Que me escuchen","Que me ayuden a resolverlo"],
    ["¿Qué te costaría más perder?","Estabilidad","Libertad"],
    ["¿Qué preferirías saber con certeza?","Cómo será tu vida en 10 años","Qué piensa de verdad la gente que querés"],
    ["Si no pudieras tener las dos, ¿qué elegirías?","Una vida segura","Una vida intensa"],
    ["¿Qué valor pesa más hoy?","Lealtad","Independencia"],
    ["¿Qué te da más miedo?","No intentar","Equivocarme por arriesgar"],
    ["¿Qué te cuesta más?","Pedir perdón","Perdonar"],
    ["¿Qué preferís proteger?","Tu paz","Una relación importante"],
    ["Cuando algo te duele, ¿qué hacés más?","Lo hablo","Me lo guardo"],
    ["¿Qué te define más?","Lo que hacés","Lo que pensás"],
    ["¿Qué te importaría más al cambiar de trabajo?","Sentido","Seguridad económica"],
    ["¿Qué te resulta más difícil aceptar?","Cambiar de opinión","Que alguien cambie con vos"],
    ["¿Qué valorás más en una amistad?","Presencia","Sinceridad"],
    ["¿Qué te pesa más después de equivocarte?","Haber lastimado a alguien","Haber fallado"],
    ["¿Qué preferís escuchar?","La verdad aunque duela","Algo que te dé calma"],
    ["¿Qué te mueve más?","Curiosidad","Ambición"],
    ["¿Qué te cuesta más soltar?","Una persona","Una idea"],
    ["¿Qué preferís tener claro?","Lo que querés","Lo que no querés"],
    ["¿Qué sentís más valioso?","Tiempo","Plata"],
    ["¿Qué te marca más de alguien?","Cómo te trata","Cómo trata a los demás"],
    ["¿Qué te cuesta más mostrar?","Miedo","Enojo"],
    ["¿Qué pesa más en una decisión?","Lo racional","Lo emocional"],
    ["¿Qué preferís para crecer?","Comodidad con estabilidad","Incomodidad con cambio"],
    ["¿Qué te dolería más?","Que no te entiendan","Que no te valoren"],
    ["¿Qué te parece más difícil?","Empezar de nuevo","Cerrar una etapa"],
    ["¿Qué elegís si chocan entre sí?","Ser fiel a vos","No decepcionar a alguien"],
    ["¿Qué te importa más dejar?","Recuerdos","Resultados"],
    ["¿Qué preferís recuperar?","Tiempo perdido","Una oportunidad perdida"],
    ["¿Qué te gustaría entender mejor?","A los demás","A vos mismo"]
  ],
  parejas:[
    ["Para una cita ideal, ¿qué preferís?","Plan afuera","Plan íntimo en casa"],
    ["Después de una discusión, ¿qué necesitás primero?","Hablarlo","Un rato de espacio"],
    ["¿Qué valorás más de tu pareja?","Sentirme acompañado","Tener libertad"],
    ["¿Qué te gusta más recibir?","Una sorpresa grande","Un detalle chico"],
    ["¿Qué recordás mejor?","Fechas y momentos","Frases y detalles"],
    ["¿Qué plan de viaje preferís en pareja?","Todo organizado","Improvisar juntos"],
    ["¿Qué pesa más en una relación?","La confianza","La diversión"],
    ["¿Qué te cuesta más?","Decir que algo te molestó","Aceptar una crítica"],
    ["¿Qué gesto te llega más?","Que te ayuden","Que te digan algo lindo"],
    ["¿Qué preferís para festejar aniversario?","Salir","Quedarse solos"],
    ["¿Qué te parece más romántico?","Planear algo","Sorprender sin avisar"],
    ["¿Qué necesitás más en una semana difícil?","Contención","Distracción"],
    ["¿Qué preferís hacer juntos?","Viajar","Construir un proyecto"],
    ["¿Qué te molesta más?","Que no respondan","Que respondan cortante"],
    ["¿Qué valorás más?","Que te conozcan mucho","Que te sigan sorprendiendo"],
    ["¿Qué te parece más importante?","Hablar todo","Saber cuándo no hablar"],
    ["¿Qué preferís compartir?","Hobbies","Amigos"],
    ["¿Qué te da más seguridad?","Rutina","Planes a futuro"],
    ["¿Qué cuesta más perdonar?","Una mentira","Una indiferencia"],
    ["¿Qué te gustaría que la otra persona adivine sin preguntar?","Que necesitás cariño","Que necesitás espacio"],
    ["¿Qué plan gana un viernes?","Salir juntos","Serie y comida"],
    ["¿Qué preferís que te regalen?","Una experiencia juntos","Algo personal"],
    ["¿Qué te importa más en una pelea?","Resolverla","Sentirte escuchado"],
    ["¿Qué elegís para una escapada?","Playa","Montaña"],
    ["¿Qué te parece peor?","Olvidar una fecha","No notar que algo pasa"],
    ["¿Qué te hace sentir más querido?","Tiempo juntos","Palabras"],
    ["¿Qué preferís decidir en pareja?","Todo","Solo lo importante"],
    ["¿Qué te divierte más?","Competir","Hacer equipo"],
    ["¿Qué preferís descubrir del otro?","Un secreto viejo","Un sueño futuro"],
    ["¿Qué te gustaría conservar siempre?","La complicidad","La pasión"]
  ],
  picante18:[
    ["¿Qué pesa más en la atracción?","La química","La confianza"],
    ["¿Qué genera más tensión?","La anticipación","La espontaneidad"],
    ["¿Qué te atrae más primero?","La mirada","La conversación"],
    ["¿Qué preferís en una cita?","Que sorprendan","Saber el plan"],
    ["¿Qué te parece más seductor?","Seguridad","Misterio"],
    ["¿Qué te gana más?","Humor","Intensidad"],
    ["¿Qué preferís?","Mensaje directo","Indirecta inteligente"],
    ["¿Qué te intriga más?","Lo prohibido","Lo inesperado"],
    ["¿Qué pesa más?","Conexión mental","Atracción física"],
    ["¿Qué preferís en una primera cita?","Mucha charla","Más acción y menos charla"],
    ["¿Qué te gusta más?","Tomar la iniciativa","Que la tome la otra persona"],
    ["¿Qué te resulta más atractivo?","Confianza","Timidez"],
    ["¿Qué preferís?","Plan preparado","Improvisación"],
    ["¿Qué te marca más?","Un beso","Una conversación inolvidable"],
    ["¿Qué te divierte más?","Coquetear","Ir de frente"],
    ["¿Qué te da más curiosidad?","Lo que alguien piensa","Lo que alguien haría"],
    ["¿Qué preferís descubrir primero?","Qué le gusta","Qué no tolera"],
    ["¿Qué te atrae más?","Alguien parecido a vos","Alguien muy distinto"],
    ["¿Qué te parece más importante?","La confianza","La sorpresa"],
    ["¿Qué preferís?","Una noche intensa","Una conexión que crece lento"],
    ["¿Qué te seduce más?","Voz","Perfume"],
    ["¿Qué te gusta más recibir?","Cumplidos","Desafíos"],
    ["¿Qué te parece más atractivo?","Espontaneidad","Elegancia"],
    ["¿Qué te gana más rápido?","Una mirada","Una risa"],
    ["¿Qué preferís?","Hablar sin filtro","Dejar cosas a la imaginación"],
    ["¿Qué te interesa más?","La primera impresión","Lo que aparece después"],
    ["¿Qué te parece más divertido?","Juego de preguntas","Reto"],
    ["¿Qué preferís en una salida?","Lugar tranquilo","Lugar con mucha energía"],
    ["¿Qué te atrae más?","Atrevimiento","Sensibilidad"],
    ["¿Qué elegís?","Química instantánea","Confianza construida"]
  ],
  cumple:[
    ["En tu cumpleaños ideal, ¿qué preferís?","Fiesta grande","Pocos y cercanos"],
    ["¿Qué regalo preferís?","Una experiencia","Algo que querías hace tiempo"],
    ["¿Qué importa más ese día?","La gente","El plan"],
    ["¿Qué preferís?","Sorpresa","Saber todo de antemano"],
    ["¿Qué torta elegís?","Chocolate","Algo frutal"],
    ["¿Qué te gusta más?","Regalos","Mensajes"],
    ["¿Qué plan de cumpleaños preferís?","Salir","Festejo en casa"],
    ["¿Qué te incomoda más?","Que te canten","Abrir regalos adelante de todos"],
    ["¿Qué te gustaría más recibir?","Un viaje","Algo tecnológico"],
    ["¿Qué preferís para brindar?","Algo tranquilo","Fiesta hasta tarde"],
    ["¿Qué te importa más?","La foto del momento","Vivirlo sin celular"],
    ["¿Qué preferís?","Cumplir años","Que nadie mencione la edad"],
    ["¿Qué invitás primero?","Amigos","Familia"],
    ["¿Qué elegís para comer?","Asado","Pizza"],
    ["¿Qué querés que haya sí o sí?","Música","Buena comida"],
    ["¿Qué te hace más ilusión?","Plan sorpresa","Regalo sorpresa"],
    ["¿Qué preferís guardar?","Fotos","Mensajes"],
    ["¿Qué te gustaría más?","Fiesta temática","Plan improvisado"],
    ["¿Qué preferís?","Muchos invitados","Grupo chico"],
    ["¿Qué te gusta más organizar?","Tu cumpleaños","El de otra persona"],
    ["¿Qué te gustaría que recuerden?","La fiesta","Algo que dijiste"],
    ["¿Qué elegís para cerrar la noche?","Bailar","Charlar"],
    ["¿Qué te gustaría más de regalo?","Tiempo juntos","Algo material"],
    ["¿Qué te importa más?","Que estén todos","Que estén los importantes"],
    ["¿Qué preferís recibir primero?","Abrazo","Regalo"],
    ["¿Qué plan gana?","Cena elegante","Juntada informal"],
    ["¿Qué te divierte más?","Juegos","Música"],
    ["¿Qué preferís?","Festejar varios días","Un solo festejo fuerte"],
    ["¿Qué te gustaría más?","Video con recuerdos","Carta"],
    ["¿Qué elegís para el próximo cumpleaños?","Repetir algo que amaste","Hacer algo totalmente distinto"]
  ],
  caos:[
    ["Si un plan se descontrola, ¿qué hacés primero?","Improviso","Intento ordenar todo"],
    ["Para una noche caótica, ¿qué elegís?","Plan sorpresa","Decidir sobre la marcha"],
    ["Cuando todo sale mal, ¿qué sos?","El que se ríe","El que lo arregla"],
    ["Si pierden una reserva, ¿qué hacés?","Busco otro lugar","Insisto hasta resolverlo"],
    ["¿Qué preferís?","Un viaje sin itinerario","Cada día planificado"],
    ["Si se corta la luz, ¿qué hacés?","Armo algo","Me quiero ir"],
    ["¿Qué te divierte más?","Un quilombo inesperado","Que todo salga perfecto"],
    ["¿Qué elegís?","Último minuto","Con anticipación"],
    ["Si alguien cancela, ¿qué hacés?","Cambio el plan","Cancelo todo"],
    ["¿Qué te representa más?","Caos creativo","Orden total"],
    ["¿Qué preferís?","Perderte y descubrir","Seguir el mapa"],
    ["Si empieza a llover, ¿qué hacés?","Sigo igual","Cambio el plan"],
    ["¿Qué te molesta más?","La rutina","La improvisación"],
    ["¿Qué elegís?","Mesa desordenada","Todo en su lugar"],
    ["¿Qué hacés con una idea absurda?","La pruebo","La pienso primero"],
    ["¿Qué te sale más natural?","Resolver sobre la marcha","Prepararte"],
    ["¿Qué preferís en un grupo?","El que agita","El que organiza"],
    ["¿Qué te parece más divertido?","Anécdota desastrosa","Plan perfecto"],
    ["¿Qué elegís?","Viajar liviano","Llevar de todo"],
    ["¿Qué hacés si llegan tarde?","Me adapto","Me fastidio"],
    ["¿Qué preferís?","Fiesta improvisada","Evento armado"],
    ["¿Qué te representa más?","Vamos viendo","Ya lo tengo pensado"],
    ["¿Qué te da más adrenalina?","No saber qué sigue","Que algo salga perfecto"],
    ["¿Qué elegís si cambia todo?","Me entusiasmo","Me estreso"],
    ["¿Qué preferís?","Sorpresas","Certezas"],
    ["¿Qué hacés con un problema inesperado?","Pruebo algo","Pido ayuda"],
    ["¿Qué te divierte más?","Romper el plan","Cumplirlo"],
    ["¿Qué te gana?","Una idea loca","Una idea segura"],
    ["¿Qué preferís?","Plan B","Sin plan B"],
    ["¿Qué te representa más?","Caos","Control"]
  ],
  canceladisimos:[
    ["¿Qué tolerás menos?","La hipocresía","La falta de códigos"],
    ["¿Qué preferís?","Decir una verdad incómoda","Callarte para evitar quilombo"],
    ["¿Qué juzgás más?","Lo que alguien dice","Lo que alguien hace"],
    ["¿Qué te molesta más?","Que te claven el visto","Que te respondan con falsedad"],
    ["¿Qué te parece peor?","Llegar siempre tarde","Cancelar a último momento"],
    ["¿Qué perdonás menos?","Una mentira","Una traición"],
    ["¿Qué te irrita más?","La gente intensa","La gente indiferente"],
    ["¿Qué criticás primero?","Malos modales","Falta de sentido común"],
    ["¿Qué te parece más grave?","Hablar a espaldas","Decirlo de frente sin filtro"],
    ["¿Qué te molesta más en redes?","Presumir todo","Opinar de todo"],
    ["¿Qué bancás menos?","Victimizarse","Creerse superior"],
    ["¿Qué preferís?","Una persona brutalmente sincera","Una persona diplomática"],
    ["¿Qué te parece peor?","Copiar ideas","No dar crédito"],
    ["¿Qué te molesta más?","Interrumpir","No escuchar"],
    ["¿Qué juzgás más?","Cómo trata a un mozo","Cómo trata a sus amigos"],
    ["¿Qué te parece más cancelable?","Ser falso","Ser egoísta"],
    ["¿Qué te cuesta más tolerar?","Desorden","Impuntualidad"],
    ["¿Qué te enoja más?","Prometer y no cumplir","No prometer nada"],
    ["¿Qué preferís?","Discusión frontal","Tensión silenciosa"],
    ["¿Qué te parece peor?","Chisme","Indiferencia"],
    ["¿Qué te da más rechazo?","Arrogancia","Victimismo"],
    ["¿Qué te molesta más?","Que te corrijan","Que te ignoren"],
    ["¿Qué juzgás más rápido?","Actitud","Apariencia"],
    ["¿Qué preferís de alguien?","Que diga todo","Que mida lo que dice"],
    ["¿Qué te parece más grave?","Romper una promesa","Ocultar algo"],
    ["¿Qué te irrita más?","La gente que presume","La gente que se queja"],
    ["¿Qué bancás menos?","Que lleguen tarde","Que te apuren"],
    ["¿Qué te parece peor?","Ghostear","Responder por compromiso"],
    ["¿Qué te molesta más?","No pedir perdón","Pedir perdón sin sentirlo"],
    ["¿Qué juzgás más?","La intención","El resultado"]
  ],
  rompehielo:[
    ["Para conocer gente, ¿qué preferís?","Plan chico","Evento lleno de gente"],
    ["Al conocer a alguien, ¿qué te sale más?","Hablar mucho","Ir entrando en confianza"],
    ["¿Quién te cae mejor primero?","Alguien gracioso","Alguien tranquilo"],
    ["¿Qué pregunta preferís?","Algo divertido","Algo personal"],
    ["¿Qué te resulta más fácil?","Empezar una charla","Seguir una charla"],
    ["¿Qué preferís en un grupo nuevo?","Presentarte vos","Que te presenten"],
    ["¿Qué rompe mejor el hielo?","Un chiste","Una pregunta"],
    ["¿Qué te da menos vergüenza?","Bailar","Cantar"],
    ["¿Qué elegís primero?","Hablar con uno","Hablar con todos"],
    ["¿Qué te ayuda más a soltarte?","Música","Comida o bebida"],
    ["¿Qué preferís?","Juego de preguntas","Charla libre"],
    ["¿Qué recordás primero de alguien?","El nombre","La cara"],
    ["¿Qué te cae mejor?","Extrovertido","Reservado"],
    ["¿Qué preferís contar primero?","Algo gracioso","Algo que te gusta"],
    ["¿Qué te da más curiosidad?","A qué se dedica","Qué hace en su tiempo libre"],
    ["¿Qué te parece más fácil?","Hablar en persona","Hablar por chat"],
    ["¿Qué elegís en una juntada nueva?","Quedarte con conocidos","Mezclarte"],
    ["¿Qué te divierte más?","Anécdotas","Debates"],
    ["¿Qué preferís?","Preguntar","Contar"],
    ["¿Qué te hace confiar más rápido?","Humor","Sinceridad"],
    ["¿Qué te resulta más incómodo?","Silencio","Hablar demasiado"],
    ["¿Qué te gusta más descubrir?","Gustos en común","Diferencias"],
    ["¿Qué preferís de entrada?","Confianza rápida","Ir de a poco"],
    ["¿Qué te ayuda más a recordar a alguien?","Una historia","Un detalle visual"],
    ["¿Qué te divierte más?","Juego competitivo","Juego cooperativo"],
    ["¿Qué elegís?","Mesa grande","Grupo chico"],
    ["¿Qué te sale primero?","Escuchar","Hablar"],
    ["¿Qué te hace sentir más cómodo?","Que te pregunten","Que te dejen observar"],
    ["¿Qué preferís?","Conocer mucha gente","Conocer bien a pocas"],
    ["¿Qué te gustaría saber primero?","Qué le causa gracia","Qué le apasiona"]
  ]
};
const VARIETY_KITS={
  clasico:{
    moments:["una salida que terminó en cualquier cosa","un viaje con un imprevisto inolvidable","una compra de la que después te arrepentiste","un mensaje enviado a la persona equivocada","una mentira piadosa que se complicó","un momento en el que te hiciste el que entendías","una situación en la que llegaste demasiado tarde","un plan improvisado que salió mejor de lo esperado","una vergüenza pública que hoy te causa gracia","una vez que rompiste una regla por una pavada","un encuentro rarísimo con un desconocido","un favor que terminó siendo mucho más complicado de lo esperado"],
    actions:["llegar tarde a algo importantísimo","perder el celular en una salida","hacerse amigo de un desconocido en cinco minutos","mudarse de país sin avisar demasiado","mandar un mensaje y arrepentirse al instante","quedarse dormido en el peor momento","convertirse en meme sin querer","sobrevivir mejor a un viaje sin plan","guardar un secreto durante años","gastar de más por impulso","cancelar un plan a último momento","hacerse famoso por accidente","terminar hablando con todo el mundo en una fiesta","olvidarse una fecha importante","resolver un problema improvisando"],
    missions:["Conseguí que alguien cuente una anécdota del colegio sin preguntarle por el colegio.","Lográ que alguien diga que necesita vacaciones.","Conseguí que dos personas discutan amistosamente sobre comida.","Hacé que alguien muestre una foto vieja en el celular.","Lográ que alguien diga «yo nunca haría eso».","Conseguí que alguien proponga un próximo plan para el grupo.","Hacé que alguien mencione a una ex pareja o viejo amor sin preguntarle directamente.","Lográ que alguien admita una compra impulsiva.","Conseguí que alguien imite a otra persona del grupo.","Hacé que alguien cuente una anécdota que empiece con «una vez…»."]
  },
  profundo:{
    moments:["una decisión que te cambió más de lo que esperabas","una etapa en la que tuviste que empezar de nuevo","un momento en el que cambiaste de opinión sobre algo importante","una conversación que todavía recordás","una situación en la que tuviste que elegir entre vos y otra persona","una oportunidad que dejaste pasar","un miedo que terminaste enfrentando","una despedida que te enseñó algo","una vez que pediste ayuda cuando no querías hacerlo","una promesa que te costó cumplir","un momento en el que te sorprendiste a vos mismo","algo que antes querías y hoy ya no"],
    actions:["cambiar completamente de vida por una oportunidad","perdonar primero después de una pelea fuerte","renunciar a algo seguro por algo que le apasiona","guardar lo que siente para no preocupar al resto","pedir ayuda antes de tocar fondo","volver a empezar desde cero en otra ciudad","cambiar de opinión después de escuchar a alguien","elegir paz antes que tener razón","arriesgar una relación por ser sincero","dejar un trabajo que ya no le hace bien","tomarse un año para replantearse todo","hacer un sacrificio grande por alguien querido","soltar una amistad que ya no funciona","admitir un error aunque nadie se lo reclame","elegir tiempo por encima de plata"],
    missions:["Conseguí que alguien diga algo que cambió de opinión en los últimos años.","Lográ que alguien cuente un miedo que ya superó.","Conseguí que alguien mencione una decisión de la que está orgulloso.","Hacé que alguien diga qué valora más hoy que hace cinco años.","Lográ que alguien cuente algo que aprendió de otra persona del grupo.","Conseguí que alguien diga qué le gustaría animarse a hacer.","Hacé que alguien nombre una etapa que no repetiría.","Lográ que alguien diga cuál fue un buen consejo que recibió.","Conseguí que alguien hable de algo que le costó soltar.","Hacé que alguien admita una meta que todavía tiene pendiente."]
  },
  parejas:{
    moments:["una cita que no salió como esperabas","un viaje o escapada en pareja","una discusión que hoy parece absurda","un gesto pequeño que te quedó grabado","una sorpresa que salió muy bien o muy mal","un momento en el que te sentiste especialmente acompañado","una costumbre de pareja que nadie más entendería","una primera impresión que después cambió","una situación en la que tuvieron que hacer equipo","una decisión importante que tomaron juntos","un recuerdo cotidiano que te hace reír","una diferencia entre ustedes que terminó siendo positiva"],
    actions:["recordar una fecha que el otro olvidó","organizar una sorpresa sin que se note","ceder primero después de una discusión","proponer un viaje impulsivo","notar que al otro le pasa algo sin que diga nada","guardar un regalo durante semanas sin contarlo","elegir el restaurante sin mirar el menú","pedir perdón primero","quedarse dormido durante una película elegida por el otro","hacer una compra para la casa sin consultar","convertir una pelea en un chiste","decir «no pasa nada» cuando sí pasa","planear todo con mucha anticipación","querer resolver una discusión en el momento","necesitar espacio antes de volver a hablar"],
    missions:["Conseguí que alguien cuente cómo fue una primera cita.","Lográ que alguien diga una costumbre de su pareja que le causa gracia.","Conseguí que alguien recuerde un regalo que le haya encantado.","Hacé que alguien admita quién suele pedir perdón primero.","Lográ que alguien cuente una discusión absurda que hoy dé risa.","Conseguí que alguien diga un plan que quiere hacer en pareja.","Hacé que alguien mencione un detalle pequeño que para él vale mucho.","Lográ que alguien diga qué cosa hacen mejor como equipo.","Conseguí que alguien cuente algo que aprendió de su pareja.","Hacé que alguien nombre una canción, comida o lugar que asocie con la relación."]
  },
  picante18:{
    moments:["una cita con mucha química","un mensaje que te hizo dudar qué responder","una primera impresión que te sorprendió","una situación de tensión romántica","una cita que terminó siendo muy distinta a lo esperado","una persona que te gustó contra todo pronóstico","un intento de conquista que salió mal","una vez que interpretaste mal una señal","una conversación que cambió el tono de una relación","una cita que quisiste que durara más","una situación en la que te dio vergüenza avanzar","una atracción que intentaste disimular"],
    actions:["enamorarse de alguien que juró que no era su tipo","mandar un mensaje demasiado tarde y arrepentirse","confundir amabilidad con interés","dar el primer paso sin pensarlo mucho","investigar a una cita en redes antes de verla","quedarse enganchado con alguien inesperado","volver a hablarle a alguien después de jurar que no","hacer una declaración demasiado directa","cancelar una cita porque se puso nervioso","tener una historia secreta que nadie sospecha","besar primero en una cita","tener un crush con alguien poco conveniente","sobrepensar un mensaje durante una hora","aceptar una cita por pura curiosidad","cambiar de opinión sobre alguien después de conocerlo mejor"],
    missions:["Conseguí que alguien cuente su peor cita.","Lográ que alguien diga qué detalle le resulta irresistible.","Conseguí que alguien admita haber investigado a una cita en redes.","Hacé que alguien cuente una historia de tensión romántica sin pedírsela directamente.","Lográ que alguien diga qué famoso le parece atractivo.","Conseguí que alguien diga si prefiere dar o recibir el primer paso.","Hacé que alguien recuerde un mensaje que lo descolocó.","Lográ que alguien diga qué arruina una cita al instante.","Conseguí que alguien admita una señal que alguna vez interpretó mal.","Hacé que alguien cuente una primera impresión que terminó cambiando."]
  },
  cumple:{
    moments:["un cumpleaños que salió completamente distinto al plan","un regalo inolvidable","una sorpresa que casi se arruina","una fiesta de infancia","un brindis que todavía recordás","un cumpleaños en el que pasó algo inesperado","una torta o comida que salió mal","una foto de cumpleaños que da vergüenza","una vez que alguien olvidó una fecha importante","un festejo improvisado","un regalo rarísimo que recibiste","un cumpleaños que preferiste pasar tranquilo"],
    actions:["organizar una fiesta sorpresa sin que se note","olvidarse del cumpleaños de alguien cercano","quedarse hasta el final de cualquier fiesta","emocionarse con un regalo hecho a mano","querer festejar durante toda la semana","preferir que nadie le cante el feliz cumpleaños","ser quien arma el brindis","llevar el regalo más original","llegar primero al festejo","aparecer con una torta improvisada","sacar más fotos que nadie","proponer seguirla después del festejo","guardar todas las tarjetas y recuerdos","elegir un plan chico antes que una fiesta enorme","hacer un discurso inesperado"],
    missions:["Conseguí que alguien cuente su cumpleaños favorito.","Lográ que alguien recuerde un regalo que todavía conserva.","Conseguí que alguien diga qué torta elegiría hoy.","Hacé que alguien muestre una foto de un cumpleaños viejo.","Lográ que alguien proponga un brindis.","Conseguí que alguien diga qué regalo nunca quisiera recibir.","Hacé que alguien cuente una fiesta que salió mal.","Lográ que alguien diga si prefiere sorpresa o saber el plan.","Conseguí que alguien nombre a la persona que mejor hace regalos.","Hacé que alguien cuente qué cumpleaños le gustaría repetir."]
  },
  caos:{
    moments:["un plan que se descontroló por completo","una noche que terminó en un lugar inesperado","una apuesta absurda","un viaje sin planificación","una situación en la que todo salió mal al mismo tiempo","una idea pésima que terminó siendo divertida","una decisión tomada en menos de un minuto","un problema que resolviste improvisando","una fiesta que cambió de plan cinco veces","una vez que te perdiste","una compra absurda hecha por impulso","una historia que empezó con «esto no puede salir mal»"],
    actions:["aceptar una apuesta ridícula","proponer un viaje esa misma noche","perderse incluso usando mapas","convertir un problema en una anécdota","romper el plan apenas aparece algo mejor","hacer una compra absurda por impulso","terminar en un lugar al que nadie pensaba ir","ser el primero en decir «hagámoslo»","sobrevivir mejor sin ningún plan","convencer al resto de una idea malísima","improvisar una solución imposible","quedarse sin batería en el peor momento","cambiar de plan tres veces en una hora","hacer algo solo porque parecía divertido","reírse cuando todo está saliendo mal"],
    missions:["Conseguí que alguien acepte una apuesta tonta.","Lográ que alguien proponga cambiar el plan de la noche.","Conseguí que dos personas inventen una teoría absurda juntas.","Hacé que alguien diga «¿qué puede salir mal?».","Lográ que alguien cuente la peor decisión impulsiva que tomó.","Conseguí que alguien se saque una foto ridícula.","Hacé que alguien proponga un desafío para otra persona.","Lográ que alguien cuente una historia en la que se perdió.","Conseguí que alguien imite un sonido o una voz.","Hacé que alguien diga que una idea es «una locura»."]
  },
  canceladisimos:{
    moments:["una opinión que sabías que iba a generar discusión","una vez que dijiste una verdad que nadie quería escuchar","una situación en la que juzgaste demasiado rápido","un momento en el que cambiaste de opinión sobre alguien","una pelea por una pavada que escaló","una vez que te arrepentiste de opinar sin saber","una situación en la que alguien rompió un código del grupo","una vez que preferiste callarte para no generar quilombo","un comentario que salió peor de lo esperado","una vez que defendiste una postura impopular","una situación en la que te sentiste hipócrita","un momento en el que tuviste que elegir entre sinceridad y diplomacia"],
    actions:["decir una verdad incómoda aunque arruine el clima","cancelar a alguien por una sola actitud","cambiar de opinión después de una discusión","dejar de seguir a alguien por lo que publica","confrontar a una persona en el momento","hacer de abogado del diablo solo por discutir","guardar bronca durante semanas","decir «te lo dije» en el peor momento","bloquear a alguien sin explicación","defender una opinión impopular delante de todos","juzgar a alguien por cómo trata a un mozo","perdonar algo que juró imperdonable","leer una conversación vieja para ganar una discusión","salirse de un grupo de chat por enojo","admitir que estaba completamente equivocado"],
    missions:["Conseguí que alguien diga una opinión impopular.","Lográ que dos personas estén en desacuerdo sobre una regla social.","Conseguí que alguien diga qué conducta no perdonaría.","Hacé que alguien admita haber juzgado mal a otra persona.","Lográ que alguien diga «eso es de mala persona».","Conseguí que alguien defienda una postura con la que el resto no coincide.","Hacé que alguien cuente una vez que bloqueó o dejó de seguir a alguien.","Lográ que alguien diga qué cosa considera sobrevalorada.","Conseguí que alguien cambie de opinión durante una conversación.","Hacé que alguien diga qué código entre amigos no se rompe."]
  },
  rompehielo:{
    moments:["una situación graciosa del trabajo o estudio","un viaje corto que recuerdes","una comida que salió especialmente bien o mal","una primera vez haciendo algo","un hobby raro o inesperado","una coincidencia difícil de creer","una película o serie que te sorprendió","una situación incómoda que terminó bien","un talento inútil que descubriste","un lugar que te encantó conocer","un pequeño logro reciente","una costumbre tuya que suele llamar la atención"],
    actions:["empezar charla con un desconocido","probar una comida rara sin preguntar qué tiene","sumarse primero a un karaoke","recordar el nombre de todos","armar un plan con gente que recién conoce","hacer reír a un grupo nuevo","proponer un juego para romper el hielo","quedarse hablando hasta el final","descubrir un gusto en común con cualquiera","animarse primero a bailar","preguntar algo inesperado para conocer a alguien","llevar algo casero a una juntada","hacer de anfitrión aunque no sea su casa","contar una anécdota apenas llega","intercambiar contacto con alguien nuevo"],
    missions:["Conseguí que alguien diga cuál es su comida favorita.","Lográ que alguien cuente un hobby que tiene o tuvo.","Conseguí que alguien recomiende una serie o película.","Hacé que alguien diga un lugar que quiere conocer.","Lográ que dos personas descubran un gusto en común.","Conseguí que alguien cuente una anécdota del trabajo o estudio.","Hacé que alguien diga qué canción pondría ahora.","Lográ que alguien cuente una habilidad inútil que tiene.","Conseguí que alguien diga qué elegiría para un viaje corto.","Hacé que alguien recomiende un lugar para comer."]
  }
};

const OPEN_POOLS={
  universal:[
    "Si mañana tuvieras un día completamente libre, ¿qué harías primero?","¿Qué compra chica te mejora el día casi siempre?","¿Qué hábito tuyo te costaría más cambiar?","¿Qué lugar elegirías para desaparecer un fin de semana?","¿Qué comida podrías repetir toda una semana?","¿Qué talento te gustaría tener instantáneamente?","¿Qué aplicación borrarías para siempre si te obligaran a elegir una?","¿Qué objeto usás muchísimo más de lo que imaginabas?","¿Qué plan casi nunca rechazás?","¿Qué cosa pequeña te pone de mal humor demasiado rápido?","¿Qué harías con una semana sin obligaciones?","¿Qué famoso invitarías a una cena del grupo?","¿Qué trabajo totalmente distinto probarías un mes?","¿Qué gasto te cuesta más justificar pero igual hacés?","¿Qué cosa aprendiste tarde y te hubiera servido antes?","¿Qué ciudad volverías a visitar mañana?","¿Qué costumbre ajena te irrita más?","¿Qué te gustaría saber hacer sin tener que practicar?","¿Qué día de tu vida repetirías solo por diversión?","¿Qué cosa nunca compartirías aunque te la pidan?"
  ],
  deep:[
    "¿Qué decisión te gustaría poder volver a pensar con lo que sabés hoy?","¿Qué valor no negociarías por plata?","¿Qué miedo te gustaría dejar atrás?","¿Qué parte de crecer te sorprendió más?","¿Qué conversación pendiente te gustaría poder tener?","¿Qué cosa de vos entendiste recién en los últimos años?","¿Qué necesitás para sentir que un lugar es tu casa?","¿Qué te gustaría que la gente recuerde de vos?","¿Qué tipo de fracaso te enseñó más?","¿Qué elegís proteger cuando todo se complica?","¿Qué consejo te hubiera gustado recibir antes?","¿Qué vínculo cambió tu manera de ver algo importante?","¿Qué te cuesta más pedir?","¿Qué te hace sentir realmente orgulloso de vos?","¿Qué cosa te gustaría dejar de postergar?","¿Qué significa para vos tener una buena vida?","¿Qué te resulta más difícil: empezar o terminar?","¿Qué te hace sentir que estás perdiendo el tiempo?","¿Qué parte de tu personalidad cambió más?","¿Qué te gustaría entender mejor de vos mismo?"
  ],
  relation:[
    "¿Qué gesto cotidiano te hace sentir más querido?","¿Qué plan en pareja nunca te cansaría?","¿Qué detalle del otro notás aunque nadie más lo vea?","¿Qué diferencia entre ustedes terminó siendo buena?","¿Qué recuerdo juntos te hace reír más rápido?","¿Qué tema cuesta más hablar sin discutir?","¿Qué cosa te gustaría hacer juntos por primera vez?","¿Qué costumbre de la relación defenderías siempre?","¿Qué pequeña atención vale más que un regalo caro?","¿Qué aprendiste sobre vos estando en esta relación?","¿Qué lugar tiene un significado especial para ustedes?","¿Qué tipo de sorpresa sí te gustaría recibir?","¿Qué plan simple representa mejor a la pareja?","¿Qué cosa hace el otro que te calma?","¿Qué decisión importante preferís tomar siempre de a dos?","¿Qué canción podría estar en la banda sonora de la relación?","¿Qué momento hizo que confiaras más?","¿Qué tradición propia les gustaría inventar?","¿Qué parte de convivir o compartir tiempo requiere más paciencia?","¿Qué cosa del otro admirás más hoy que al principio?"
  ],
  chaos:[
    "Si te dieran una hora para irte de viaje, ¿qué sería lo primero que agarrás?","¿Qué harías si mañana despertaras en otro país sin explicación?","¿Cuál es la apuesta absurda que sí aceptarías?","¿Qué objeto inútil llevarías a una isla solo por diversión?","Si pudieras prohibir una palabra por un día, ¿cuál sería?","¿Qué harías primero durante un apagón largo con amigos?","¿Qué plan improvisado te tentaría aunque sea mala idea?","Si el grupo ganara una camioneta por 24 horas, ¿a dónde irían?","¿Qué regla inventarías para una fiesta imposible?","¿Qué harías si te regalaran un pasaje que sale en dos horas?","¿Qué cosa absurda comprarías si costara un peso?","¿Qué desafío ridículo aceptarías por una cena gratis?","Si solo pudieras comunicarte con una frase por un día, ¿cuál sería?","¿Qué lugar sería pésimo pero divertido para una fiesta?","¿Qué harías si perdieras el celular durante toda una noche?","¿Qué personaje ficticio sería peor compañero de viaje?","¿Qué decisión tomarías al azar solo por una vez?","¿Qué cosa normal convertirías en competencia?","¿Qué premio ridículo te gustaría ganar?","¿Qué plan sería divertido precisamente porque puede salir mal?"
  ],
  adult:[
    "¿Qué detalle te genera atracción antes de conocer bien a alguien?","¿Qué arruina una cita casi instantáneamente?","¿Qué tipo de mensaje te intriga más?","¿Qué primera impresión suele engañarte?","¿Qué gesto te parece más seductor sin ser obvio?","¿Qué te hace perder interés más rápido?","¿Qué tipo de cita te parece más divertida?","¿Qué señal te cuesta más interpretar?","¿Qué cosa preferís que alguien diga de frente?","¿Qué te hace sentir más química con alguien?","¿Qué te parece más atractivo: seguridad o misterio?","¿Qué historia de una cita contarías como comedia?","¿Qué te resulta más incómodo en una primera cita?","¿Qué detalle recordás más después de conocer a alguien?","¿Qué hace que quieras volver a ver a alguien?","¿Qué tipo de cumplido te llega más?","¿Qué cosa jamás pondrías en una app de citas?","¿Qué preferís saber antes de una cita?","¿Qué te parece más difícil: dar una señal o leerla?","¿Qué consejo sobre citas jamás seguirías?"
  ],
  edge:[
    "¿Qué opinión tuya sabés que divide al grupo?","¿Qué conducta social te parece completamente sobrevalorada?","¿Qué cosa perdona demasiado fácil la gente?","¿Qué actitud te hace juzgar a alguien enseguida?","¿Qué verdad preferís que te digan aunque duela?","¿Qué regla social romperías sin culpa?","¿Qué cosa hace la gente por compromiso y debería dejar de hacer?","¿Qué opinión cambiaste después de discutir mucho?","¿Qué comportamiento en redes te resulta insoportable?","¿Qué código entre amigos te parece sagrado?","¿Qué cosa te parece peor de lo que la mayoría admite?","¿Qué defecto tolerás menos aunque sea pequeño?","¿Qué frase te hace desconfiar inmediatamente?","¿Qué cosa te parece injustamente cancelada?","¿Qué hábito ajeno te cuesta no juzgar?","¿Qué preferís: sinceridad brutal o diplomacia?","¿Qué cosa jamás publicarías en redes?","¿Qué tema evita el grupo porque siempre termina mal?","¿Qué promesa te parece imperdonable romper?","¿Qué postura defenderías aunque quedes solo?"
  ]
};

const DUO_SHARED={
  everyday:[
    ["¿Qué preferís para un sábado libre?","Salir temprano","Quedarte sin horario"],["¿Qué elegís para viajar?","Ventana","Pasillo"],["¿Qué te compra más fácil?","Buena comida","Buen lugar"],["¿Qué te gustaría dominar?","Cocinar muy bien","Arreglar cualquier cosa"],["¿Qué preferís encontrar?","Un bar increíble","Un lugar tranquilo"],["¿Qué te salva más un día malo?","Dormir","Hablar con alguien"],["¿Qué elegís si solo podés tener uno?","Aire acondicionado","Internet rápido"],["¿Qué te molesta más en un viaje?","Esperar","Perderte"],["¿Qué te parece mejor regalo?","Algo útil","Algo inesperado"],["¿Qué preferís para escuchar música?","Auriculares","Parlante"],["¿Qué te cuesta más dejar?","Azúcar","Celular"],["¿Qué elegís para una noche de lluvia?","Película","Juego"],["¿Qué preferís descubrir en una ciudad?","Comida","Lugares"],["¿Qué te representa más?","Lista de pendientes","Vamos viendo"],["¿Qué te da más satisfacción?","Terminar algo","Empezar algo nuevo"],["¿Qué preferís recordar?","Fotos","Historias"],["¿Qué elegís para una espera larga?","Música","Leer"],["¿Qué te gustaría recibir gratis?","Comida por un año","Viajes por un año"],["¿Qué te sale más natural?","Preguntar","Contar"],["¿Qué preferís para aprender algo?","Probar","Mirar primero"],["¿Qué te cambia más el humor?","Hambre","Sueño"],["¿Qué plan te tienta más?","Feria o evento","Casa y comida"],["¿Qué te importa más en un hotel?","Cama","Desayuno"],["¿Qué preferís perder por un mes?","Delivery","Streaming"],["¿Qué te gustaría tener más?","Energía","Tiempo"],["¿Qué elegís si tenés que improvisar una cena?","Pedir","Cocinar con lo que hay"],["¿Qué te divierte más?","Trivia","Mímica"],["¿Qué preferís recibir?","Audio largo","Mensaje corto"],["¿Qué te parece más difícil?","Llegar temprano","Irte temprano"],["¿Qué elegís para bajar un cambio?","Caminar","Quedarte quieto"]
  ],
  deep:[
    ["¿Qué pesa más?","Paz mental","Ambición"],["¿Qué elegirías preservar?","Libertad","Seguridad"],["¿Qué te cuesta más?","Pedir ayuda","Decir que no"],["¿Qué preferís saber?","Qué va a pasar","Por qué pasó"],["¿Qué valorás más?","Coherencia","Flexibilidad"],["¿Qué duele más?","Decepcionar","Ser decepcionado"],["¿Qué preferís cambiar?","El pasado","El futuro"],["¿Qué te parece más importante?","Ser entendido","Ser aceptado"],["¿Qué te cuesta más soltar?","Una persona","Un proyecto"],["¿Qué elegís en una crisis?","Hablar","Pensar solo"],["¿Qué te define más?","Tus decisiones","Tus intenciones"],["¿Qué preferís?","Estabilidad","Posibilidad"],["¿Qué te mueve más?","Curiosidad","Responsabilidad"],["¿Qué necesitás más?","Tiempo","Claridad"],["¿Qué te cuesta más admitir?","Miedo","Enojo"],["¿Qué te importa más al trabajar?","Sentido","Ingreso"],["¿Qué valorás más de un amigo?","Lealtad","Honestidad"],["¿Qué preferís recibir?","Un consejo","Que te escuchen"],["¿Qué te resulta más difícil?","Empezar de nuevo","Cerrar algo"],["¿Qué elegirías primero?","Cuidarte","Cumplir"],["¿Qué te pesa más?","Lo que hiciste","Lo que no hiciste"],["¿Qué preferís arriesgar?","Comodidad","Oportunidad"],["¿Qué te da más miedo?","Fracasar","No intentar"],["¿Qué te cuesta más?","Perdonarte","Perdonar"],["¿Qué valorás más?","Tiempo compartido","Espacio propio"],["¿Qué te gustaría tener más claro?","Lo que querés","Lo que sentís"],["¿Qué te parece más valioso?","Experiencia","Potencial"],["¿Qué elegís proteger?","Tu paz","Tu vínculo"],["¿Qué te marca más?","Una pérdida","Una oportunidad"],["¿Qué preferís cambiar primero?","Un hábito","Una relación"]
  ],
  connection:[
    ["¿Qué te acerca más a alguien?","Humor","Sinceridad"],["¿Qué preferís compartir?","Planes","Conversaciones"],["¿Qué te hace confiar más?","Coherencia","Vulnerabilidad"],["¿Qué recordás más de alguien?","Lo que dijo","Cómo te hizo sentir"],["¿Qué te gusta más recibir?","Tiempo","Detalles"],["¿Qué te cuesta más en un vínculo?","Pedir espacio","Pedir atención"],["¿Qué preferís?","Hablar todo","Elegir el momento"],["¿Qué te hace sentir más acompañado?","Presencia","Mensajes"],["¿Qué valorás más?","Complicidad","Admiración"],["¿Qué te gustaría que adivinen?","Cuándo necesitás cariño","Cuándo necesitás espacio"],["¿Qué preferís para resolver algo?","Hablar en persona","Escribir primero"],["¿Qué te llega más?","Un abrazo","Una frase"],["¿Qué te parece más importante?","Tener gustos en común","Respetar diferencias"],["¿Qué hace más fuerte un vínculo?","Rutinas","Aventuras"],["¿Qué te cuesta más olvidar?","Una mentira","Una ausencia"],["¿Qué preferís compartir primero?","Un secreto","Un sueño"],["¿Qué te genera más cercanía?","Reír juntos","Hablar en serio"],["¿Qué te importa más?","Que te conozcan","Que te acepten"],["¿Qué preferís?","Sorpresa","Previsibilidad"],["¿Qué te gusta más?","Hacer equipo","Competir"],["¿Qué valorás más en una discusión?","Resolver","Sentirte escuchado"],["¿Qué te parece más íntimo?","Compartir silencios","Contar todo"],["¿Qué te gusta más planear?","Viajes","Proyectos"],["¿Qué te une más a alguien?","Recuerdos","Metas"],["¿Qué preferís recibir?","Una llamada","Una visita"],["¿Qué te hace sentir más cuidado?","Que se acuerden","Que pregunten"],["¿Qué preferís descubrir?","Algo del pasado","Un plan futuro"],["¿Qué cuesta más?","Confiar","Volver a confiar"],["¿Qué preferís construir?","Rutina","Tradiciones"],["¿Qué te importa más?","La intención","El gesto"]
  ],
  wild:[
    ["¿Qué preferís probar una vez?","Karaoke","Stand up"],["¿Qué poder inútil elegirías?","Encontrar estacionamiento","No hacer fila"],["¿Qué te divertiría más?","Un viaje sin destino","Una fiesta sorpresa"],["¿Qué elegirías por 24 horas?","Ser invisible","Leer mentes"],["¿Qué riesgo tomarías?","Pasaje sin vuelta","Trabajo sin saber qué es"],["¿Qué preferís perder?","Llaves","Billetera"],["¿Qué harías primero en un apocalipsis?","Buscar comida","Buscar amigos"],["¿Qué sería peor?","Un mes sin música","Un mes sin memes"],["¿Qué elegís para una apuesta?","Comida picante","Karaoke público"],["¿Qué te parece más divertido?","Cambiar de nombre un día","Vestirte como otro"],["¿Qué preferís ganar?","Un viaje sorpresa","Dinero sorpresa"],["¿Qué sería mejor historia?","Perder un vuelo","Subirte al vuelo equivocado"],["¿Qué te gustaría poder pausar?","El tiempo","A la gente"],["¿Qué elegirías al azar?","Destino de viaje","Restaurante"],["¿Qué te parece peor?","Quedarte sin batería","Quedarte sin plata"],["¿Qué harías en una fiesta vacía?","Poner música","Irte"],["¿Qué preferís improvisar?","Una cena","Un viaje"],["¿Qué te gustaría borrar por un día?","Vergüenza","Sueño"],["¿Qué sería más útil?","Teletransportarte","Clonarte"],["¿Qué te animarías a hacer?","Viajar solo","Mudarte sin conocer a nadie"],["¿Qué te divertiría más ganar?","Un trofeo absurdo","Una corona ridícula"],["¿Qué preferís que pase?","Plan inesperado","Visita inesperada"],["¿Qué te parece más caótico?","Mudanza","Aeropuerto"],["¿Qué elegirías para sobrevivir?","Muchísima suerte","Muchísima paciencia"],["¿Qué preferís inventar?","Una excusa","Una tradición"],["¿Qué sería peor compañero?","Alguien que planifica todo","Alguien que no planifica nada"],["¿Qué te gustaría controlar?","El clima","El tránsito"],["¿Qué preferís que dure cinco minutos?","Una discusión","Una fila"],["¿Qué te parece más divertido romper?","Una rutina","Un récord"],["¿Qué elegirías como desafío?","24 h sin celular","24 h sin quejarte"]
  ]
};

function uniqStrings(list){
  const seen=new Set(),out=[];
  for(const item of list||[]){const v=String(item||"").trim();if(!v)continue;const k=v.toLowerCase();if(seen.has(k))continue;seen.add(k);out.push(v)}
  return out;
}
function expandedDuoBank(themeId){
  const own=DUO_BANKS[themeId]||DUO_BANKS.clasico;
  const map={
    clasico:["everyday","wild"],profundo:["deep","connection"],parejas:["connection","deep"],picante18:["connection","wild"],
    cumple:["everyday","connection"],caos:["wild","everyday"],canceladisimos:["deep","wild"],rompehielo:["everyday","connection"]
  };
  const extra=(map[themeId]||["everyday"]).flatMap(k=>DUO_SHARED[k]||[]);
  const seen=new Set(),out=[];
  for(const q of [...own,...extra]){
    const key=[q[0],q[1],q[2]].join("|").toLowerCase();
    if(seen.has(key))continue;seen.add(key);out.push(q);
  }
  return out;
}
function expandedThemePrompts(themeId){
  const base=PROMPTS[themeId]||PROMPTS.clasico;
  const kit=VARIETY_KITS[themeId]||VARIETY_KITS.clasico;
  const storyGenerated=[];
  for(const x of kit.moments){
    storyGenerated.push("Contá una historia real sobre "+x+".");
    storyGenerated.push("Recordá "+x+" y contá qué pasó.");
    storyGenerated.push("¿Cuál es la anécdota que más recordás relacionada con "+x+"?");
    storyGenerated.push("Contá algo que casi nadie del grupo sepa sobre "+x+".");
  }
  const majorityGenerated=[],rankGenerated=[];
  for(const x of kit.actions){
    majorityGenerated.push("¿Quién tiene más chances de "+x+"?");
    majorityGenerated.push("Si hubiera que apostar, ¿quién sería el primero en "+x+"?");
    majorityGenerated.push("¿A quién del grupo le ves más probable "+x+"?");
    majorityGenerated.push("¿Quién sería capaz de "+x+" sin sorprender demasiado al resto?");
    rankGenerated.push("Ordenalos según quién tiene más chances de "+x+".");
    rankGenerated.push("Del más al menos probable: "+x+".");
    rankGenerated.push("Ordená al grupo pensando en quién podría "+x+" antes que los demás.");
  }
  const truthGenerated=[],lieGenerated=[];
  for(const x of kit.moments){
    truthGenerated.push("Contá algo completamente real relacionado con "+x+".");
    truthGenerated.push("Escribí una verdad sobre vos que encaje con "+x+" y pueda sorprender.");
    lieGenerated.push("Inventá una historia creíble relacionada con "+x+".");
    lieGenerated.push("Escribí una mentira posible sobre vos que tenga que ver con "+x+".");
  }
  const openMap={clasico:"universal",profundo:"deep",parejas:"relation",picante18:"adult",cumple:"universal",caos:"chaos",canceladisimos:"edge",rompehielo:"universal"};
  const open=OPEN_POOLS[openMap[themeId]||"universal"]||OPEN_POOLS.universal;
  return {
    ...base,
    prep_story:uniqStrings([...(base.prep_story||[]),...storyGenerated]),
    majority:uniqStrings([...(base.majority||[]),...majorityGenerated]),
    truth:uniqStrings(truthGenerated),
    lie:uniqStrings(lieGenerated),
    hot_seat:uniqStrings([...(base.hot_seat||[]),...open]),
    one_vs_all:uniqStrings([...(base.one_vs_all||[]),...open.slice().reverse()]),
    rank:uniqStrings([...(base.rank||[]),...rankGenerated]),
    missions:uniqStrings([...(base.missions||[]),...(kit.missions||[])])
  };
}
function contentFingerprint(v){
  if(v&&typeof v==="object")return JSON.stringify(v);
  return String(v||"");
}
function freshPick(room,key,bank,n=1){
  const source=[...(bank||[])];if(!source.length)return [];
  room.usedContent=room.usedContent&&typeof room.usedContent==="object"?room.usedContent:{};
  let used=new Set(Array.isArray(room.usedContent[key])?room.usedContent[key]:[]);
  let available=source.filter(x=>!used.has(contentFingerprint(x)));
  if(available.length<n){used=new Set();available=source}
  const chosen=pick(available,Math.min(n,available.length));
  room.usedContent[key]=[...used,...chosen.map(contentFingerprint)].slice(-Math.max(source.length,80));
  return chosen;
}
function makePrepPrompts(room){
  const tp=themePrompts(room.themeId);
  return {
    storyPrompts:freshPick(room,"prep_story",packBank(room,"prep_story",tp.prep_story),3),
    majorityPrompts:freshPick(room,"majority",packBank(room,"majority",tp.majority),3),
    truthPrompt:freshPick(room,"truth",tp.truth||[],1)[0]||"Contá una verdad sorprendente sobre vos.",
    liePrompt:freshPick(room,"lie",tp.lie||[],1)[0]||"Inventá una mentira creíble sobre vos.",
    hotSeatPrompt:freshPick(room,"hot_seat",packBank(room,"hot_seat",tp.hot_seat),1)[0]||"",
    oneVsAllPrompt:freshPick(room,"one_vs_all",packBank(room,"one_vs_all",tp.one_vs_all),1)[0]||""
  };
}

function ensureDuoPrep(room){
  if(Array.isArray(room.duoPrepQuestions)&&room.duoPrepQuestions.length===10)return room.duoPrepQuestions;
  const bank=expandedDuoBank(room.themeId);
  const used=new Set(Array.isArray(room.duoUsedQuestions)?room.duoUsedQuestions:[]);
  let pool=shuffle(bank.map(function(q){return {q:q,key:room.themeId+"|"+q[0]+"|"+q[1]+"|"+q[2]}}).filter(function(x){return !used.has(x.key)}));
  if(pool.length<10){room.duoUsedQuestions=[];pool=shuffle(bank.map(function(q){return {q:q,key:room.themeId+"|"+q[0]+"|"+q[1]+"|"+q[2]}}))}
  const chosen=pool.slice(0,10);
  room.duoPrepQuestions=chosen.map(function(x,i){return {id:"dq"+i,question:x.q[0],options:[{id:"a",label:x.q[1]},{id:"b",label:x.q[2]}]}})
  room.duoUsedQuestions=(room.duoUsedQuestions||[]).concat(chosen.map(function(x){return x.key})).slice(-90);
  room.duoEngineVersion=4;
  return room.duoPrepQuestions;
}
function duoThemeBank(room){
  return DUO_BANKS[room.themeId]||DUO_BANKS.clasico;
}
function buildDuo2Rounds(room){
  const questions=ensureDuoPrep(room);
  const values=[100,100,100,100,125,125,125,150,150,250];
  return questions.map(function(q,i){
    return {
      id:id(),mode:"duo_read",
      prompt:i===9?"La definitiva":i>=7?"Vale más":"¿Cuánto me conocés?",
      statement:q.question,questionIndex:i,points:values[i]||100,
      options:q.options,votes:{},scored:false,position:i
    };
  });
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
    const generated=expandedDuoBank(room.themeId).map(q=>({question:q[0],left:q[1],right:q[2]}));
    const bank=packBank(room,"duo",[...(DUO_CHOICES[room.themeId]||[]),...generated]);
    const qs=freshPick(room,"group_duo",bank,Math.min(2,bank.length));
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
    for(const prompt of freshPick(room,"rank_round",rankBank,Math.min(2,rankBank.length))){
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
  if(["duo","ordena_al_grupo","duo_read","duo_risk","duo_speed"].includes(round.mode))return [...room.players];
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

  if(round.mode==="duo_read"&&Number.isInteger(round.questionIndex)){
    const idx=round.questionIndex;
    if(room.players.length!==2)return;
    const a=room.players[0],b=room.players[1];
    const va=round.votes[a.id],vb=round.votes[b.id];
    if(va===undefined||vb===undefined)return;
    const aa=room.submissions[a.id]?.duoAnswers?.[idx];
    const ab=room.submissions[b.id]?.duoAnswers?.[idx];
    if(!aa||!ab)return;
    const pts=Number(round.points)||100;
    round.actualAnswers={[a.id]:aa,[b.id]:ab};
    round.pointsByPlayer={[a.id]:0,[b.id]:0};
    if(va===ab){a.score+=pts;round.pointsByPlayer[a.id]=pts}
    if(vb===aa){b.score+=pts;round.pointsByPlayer[b.id]=pts}
    round.scored=true;return;
  }

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
  // Self-heal Duo rooms that were already 2/2 ready before automatic start existed.
  if(room.state==="collecting"&&isDuoRoom(room)&&room.players.length===2&&!room.surprise?.enabled&&room.players.every(p=>p.ready)){
    room.players.forEach(p=>p.score=0);
    room.rounds=buildDuo2Rounds(room);room.state="starting";room.currentRound=0;room.roundPhase="guess";room.advanceAt=null;room.startAt=Date.now()+3200;
    persistRoom(room);return;
  }
  if(room.state==="starting"){
    if(room.startAt&&Date.now()>=room.startAt){room.state="playing";room.startAt=null;changed=true}
    if(changed)persistRoom(room);
    return;
  }
  if(room.state!=="playing"||room.roundPhase!=="locked"||!room.advanceAt||Date.now()<room.advanceAt)return;
  room.advanceAt=null;changed=true;
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
  if(r.mode==="duo_read"&&r.actualAnswers){
    return room.players.map(function(p){
      const v=r.actualAnswers[p.id],label=(r.options||[]).find(o=>o.id===v)?.label||"";
      return p.name+" eligió: "+label;
    }).join(" · ");
  }
  if(r.mode==="duo_coincidimos"||r.mode==="duo_dilema")return r.correct==="same"?"¡Coincidieron!":"Eligieron distinto";
  if(r.mode==="duo_duelo")return (r.options||[]).find(o=>o.id===r.correct)?.label||"";
  if(r.mode==="duo_5seg")return "Ronda de honor";
  if(r.mode==="quien_fue"||r.mode==="lee_al_grupo")return playerName(room,r.correct);
  if(r.mode==="mentiroso")return r.correct==="true"?"Era verdad":"Era mentira";
  if(r.mode==="duo")return r.correct==="same"?"Coincidieron":"No coincidieron";
  if(r.mode==="ordena_al_grupo")return (r.consensus||[]).map(pid=>playerName(room,pid)).join(" → ");
  return r.correct||"";
}
function roundPointsForViewer(room,r,viewer){
  if(!viewer||!r.scored)return 0;
  if(r.mode==="duo_read"&&Number.isInteger(r.questionIndex)){
    return Number(r.pointsByPlayer?.[viewer.id]||0);
  }
  if(r.mode==="duo_coincidimos"||r.mode==="duo_dilema")return r.correct==="same"?100:0;
  if(r.mode==="duo_duelo")return r.votes[viewer.id]===r.correct?100:0;
  if(r.mode==="duo_5seg")return r.votes[viewer.id]==="yes"?75:0;
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
    }else if(r.mode==="duo_read"&&Number.isInteger(r.questionIndex)){
      for(const p of room.players){
        const other=room.players.find(x=>x.id!==p.id);
        const actual=other?room.submissions[other.id]?.duoAnswers?.[r.questionIndex]:null;
        const guess=r.votes[p.id];
        if(guess===undefined||!actual)continue;
        directAttempts++;
        if(guess===actual){directHits++;if(per[p.id])per[p.id].duoSync++}
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
  const duoBreakdown=isDuoRoom(room)?room.players.map(function(p){
    let hits=0,attempts=0,points=0;
    for(const r of played){
      if(r.mode!=="duo_read"||!Number.isInteger(r.questionIndex))continue;
      const other=room.players.find(x=>x.id!==p.id);
      const actual=other?room.submissions[other.id]?.duoAnswers?.[r.questionIndex]:null;
      const guess=r.votes[p.id];
      if(guess===undefined||!actual)continue;
      attempts++;
      if(guess===actual)hits++;
      points+=Number(r.pointsByPlayer?.[p.id]||0);
    }
    return {playerId:p.id,name:p.name,hits,attempts,points};
  }):null;
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
    duoBreakdown,
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

  if(raw.mode==="duo_read"&&Number.isInteger(raw.questionIndex)){
    const other=viewer?room.players.find(p=>p.id!==viewer.id):null;
    return {
      ...base,
      prompt:"¿Qué respondió "+(other?.name||"la otra persona")+"?",
      options:raw.options||[],
      ownVote:viewer?raw.votes[viewer.id]||null:null,
      skipVote:false,
      duoRole:"guesser",
      otherName:other?.name||"",
      pointsAtStake:Number(raw.points)||100,
      prepPowered:true
    };
  }

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
function isDuoRoom(room){return room.playerCount?room.playerCount==="2":room.players.length===2}
function snapshot(room,viewer){
  maybeAdvance(room);
  const raw=room.rounds[room.currentRound]||null;
  const finished=room.state==="finished";
  return {
    code:room.code,name:room.name,state:room.state,roundPhase:room.roundPhase,currentRound:room.currentRound,totalRounds:room.rounds.length,startAt:room.startAt||null,advanceAt:room.advanceAt||null,
    unlocked:true,freeRounds:room.rounds.length,accessPlan:room.accessPlan||null,theme:THEMES[room.themeId],themeId:room.themeId,playWhen:room.playWhen,eventDate:room.eventDate,
    customPack:room.customPack?{id:room.customPack.id,name:room.customPack.name,mixMode:room.customPack.mixMode}:null,
    roundLimit:room.roundLimit||15,disabledModes:room.disabledModes||[],playerCount:room.playerCount||null,
    surprise:room.surprise?.enabled?{
      enabled:true,
      honoreeName:room.surprise.honoreeName,
      honoreeJoined:!!room.surprise.honoreePlayerId,
      honoreePlayerId:room.surprise.honoreePlayerId||null,
      isHonoree:!!viewer?.isHonoree,
      inviteKey:viewer?.id===room.hostPlayerId?room.surprise.joinKey:null,
      quickQuestions:viewer?.isHonoree&&!viewer.ready?(room.surprise.quickQuestions||SURPRISE_QUICK_QUESTIONS):null
    }:null,
    prepPrompts:room.prepPrompts,duoPrepQuestions:isDuoRoom(room)?ensureDuoPrep(room):null,availableModes:(isDuoRoom(room)?["duo_read"]:(THEME_MODES[room.themeId]||[])).map(modeInfo),
    isHost:viewer?.id===room.hostPlayerId,
    me:viewer?{id:viewer.id,name:viewer.name,ready:viewer.ready,isHonoree:!!viewer.isHonoree,score:finished?viewer.score:null}:null,
    players:room.players.map(p=>({id:p.id,name:p.name,ready:p.ready,isHonoree:!!p.isHonoree,score:(finished||isDuoRoom(room))?p.score:null,isHost:p.id===room.hostPlayerId})),
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

app.get("/api/config",async(_req,res)=>{
  const payments=await paymentPublicConfig();
  res.json({
    themes:Object.values(THEMES),modes:Object.values(MODES),themeModes:THEME_MODES,
    implementedModes:IMPLEMENTED_MODES,accessPlans:ACCESS_PLANS,
    devPayments:process.env.ALLOW_TEST_PREMIUM==="true",
    payments,
    themeStats:Object.fromEntries(Object.keys(THEMES).map(id=>[id,themeStats(id)]))
  });
});
app.get("/api/admin/payments",async(req,res)=>{
  if(!requireAdminAccess(req))return res.status(403).json({error:"Solo ADMIN."});
  try{
    const cfg=await getPaymentSettings();
    res.json({
      provider:"mercadopago",label:"Mercado Pago",currency:cfg.currency,prices:cfg.prices,
      accessTokenConfigured:cfg.accessTokenConfigured,webhookSecretConfigured:cfg.webhookSecretConfigured,
      configured:cfg.configured,webhookUrl:PUBLIC_BASE_URL+"/api/payments/webhook"
    });
  }catch(e){res.status(500).json({error:"No pude leer la configuración de cobros."})}
});

app.post("/api/admin/payments",async(req,res)=>{
  if(!requireAdminAccess(req))return res.status(403).json({error:"Solo ADMIN."});
  if(!db)return res.status(503).json({error:"La base de datos no está disponible."});
  try{
    const current=await getPaymentSettings({secrets:true});
    const accessToken=clean(req.body?.accessToken,800)||current.accessToken||"";
    const webhookSecret=clean(req.body?.webhookSecret,800)||current.webhookSecret||"";
    const prices=normalizePlanPrices(req.body?.prices||current.prices||{});
    if(accessToken&&accessToken!==current.accessToken){
      const check=await fetch("https://api.mercadolibre.com/users/me",{headers:{Authorization:"Bearer "+accessToken}});
      if(!check.ok)return res.status(400).json({error:"El Access Token de Mercado Pago no es válido."});
    }
    await db.query(
      `INSERT INTO payment_settings(id,provider,encrypted_access_token,encrypted_webhook_secret,prices,currency,updated_at)
       VALUES('main','mercadopago',$1,$2,$3::jsonb,'ARS',now())
       ON CONFLICT(id) DO UPDATE SET
         encrypted_access_token=EXCLUDED.encrypted_access_token,
         encrypted_webhook_secret=EXCLUDED.encrypted_webhook_secret,
         prices=EXCLUDED.prices,currency='ARS',updated_at=now()`,
      [accessToken?encryptPaymentSecret(accessToken):null,webhookSecret?encryptPaymentSecret(webhookSecret):null,JSON.stringify(prices)]
    );
    const saved=await getPaymentSettings();
    res.json({
      ok:true,configured:saved.configured,accessTokenConfigured:saved.accessTokenConfigured,
      webhookSecretConfigured:saved.webhookSecretConfigured,prices:saved.prices,currency:saved.currency,
      webhookUrl:PUBLIC_BASE_URL+"/api/payments/webhook"
    });
  }catch(e){
    console.error("save payment settings",e.message);
    res.status(500).json({error:"No pude guardar la configuración de Mercado Pago."});
  }
});

app.post("/api/payments/checkout",async(req,res)=>{
  if(!db)return res.status(503).json({error:"La base de datos no está disponible."});
  const plan=ACCESS_PLANS.find(p=>p.id===req.body?.plan);
  if(!plan)return res.status(400).json({error:"Acceso Premium inválido."});
  const requestedRoom=clean(req.body?.roomCode,12);
  const room=requestedRoom?getRoom(requestedRoom):null;
  const host=room?requireHost(room,req):null;
  if(requestedRoom&&!room)return res.status(404).json({error:"Sala inexistente."});
  if(room&&!host)return res.status(403).json({error:"Solo el host puede asociar Premium a esta sala."});
  try{
    const cfg=await getPaymentSettings({secrets:true});
    if(!cfg.accessToken)return res.status(503).json({error:"Mercado Pago todavía no está conectado."});
    const amount=Number(cfg.prices?.[plan.id]||DEFAULT_PREMIUM_PRICE);
    if(!Number.isFinite(amount)||amount<=0)return res.status(409).json({error:"Premium todavía no tiene un precio configurado."});
    const localId=id(),amountText=amount.toFixed(2);
    await db.query(
      `INSERT INTO payment_orders(id,provider,room_code,host_player_id,plan,amount,currency,status)
       VALUES($1,'mercadopago',$2,$3,$4,$5,'ARS','created')`,
      [localId,room?.code||null,host?.id||null,plan.id,amount]
    );
    const roomQuery=room?"&code="+encodeURIComponent(room.code):"";
    const retBase=PUBLIC_BASE_URL+"/?payment_order="+encodeURIComponent(localId)+roomQuery+"&payment_return=";
    const providerOrder=await mpFetch("/v1/orders",{
      method:"POST",accessToken:cfg.accessToken,idempotencyKey:localId,
      body:{
        type:"online",
        processing_mode:"manual",
        capture_mode:"automatic_async",
        total_amount:amountText,
        external_reference:localId,
        description:"La Juntada · "+plan.title,
        items:[{
          title:"La Juntada · "+plan.title,
          quantity:1,
          unit_measure:"unit",
          unit_price:amountText,
          total_amount:amountText
        }],
        config:{online:{
          success_url:retBase+"success",
          pending_url:retBase+"pending",
          failure_url:retBase+"failure",
          auto_return:"all"
        }}
      }
    });
    await db.query(
      "UPDATE payment_orders SET provider_order_id=$2,provider_status=$3,updated_at=now() WHERE id=$1",
      [localId,providerOrder.id,String(providerOrder.status_detail||providerOrder.status||"created")]
    );
    res.json({orderId:localId,checkoutUrl:providerOrder.checkout_url,providerOrderId:providerOrder.id,amount,currency:"ARS"});
  }catch(e){
    console.error("payment checkout",e.message);
    res.status(e.status>=400&&e.status<500?400:502).json({error:"No pude iniciar el pago con Mercado Pago: "+e.message});
  }
});

app.post("/api/payments/donate",async(req,res)=>{
  if(!db)return res.status(503).json({error:"La base de datos no está disponible."});
  const amount=Math.round(Number(req.body?.amount));
  if(!Number.isFinite(amount)||amount<500||amount>500000)return res.status(400).json({error:"Elegí un monto entre $500 y $500.000."});
  try{
    const cfg=await getPaymentSettings({secrets:true});
    if(!cfg.accessToken)return res.status(503).json({error:"Mercado Pago todavía no está conectado."});
    const localId=id(),amountText=amount.toFixed(2);
    await db.query(
      `INSERT INTO payment_orders(id,provider,room_code,host_player_id,plan,amount,currency,status)
       VALUES($1,'mercadopago',NULL,NULL,'donation',$2,'ARS','created')`,
      [localId,amount]
    );
    const retBase=PUBLIC_BASE_URL+"/?payment_order="+encodeURIComponent(localId)+"&payment_return=";
    const providerOrder=await mpFetch("/v1/orders",{
      method:"POST",accessToken:cfg.accessToken,idempotencyKey:localId,
      body:{
        type:"online",
        processing_mode:"manual",
        capture_mode:"automatic_async",
        total_amount:amountText,
        external_reference:localId,
        description:"La Juntada · Aporte voluntario",
        items:[{
          title:"Aporte voluntario a La Juntada",
          quantity:1,
          unit_measure:"unit",
          unit_price:amountText,
          total_amount:amountText
        }],
        config:{online:{
          success_url:retBase+"success",
          pending_url:retBase+"pending",
          failure_url:retBase+"failure",
          auto_return:"all"
        }}
      }
    });
    await db.query(
      "UPDATE payment_orders SET provider_order_id=$2,provider_status=$3,updated_at=now() WHERE id=$1",
      [localId,providerOrder.id,String(providerOrder.status_detail||providerOrder.status||"created")]
    );
    res.json({orderId:localId,checkoutUrl:providerOrder.checkout_url,providerOrderId:providerOrder.id,amount,currency:"ARS"});
  }catch(e){
    console.error("donation checkout",e.message);
    res.status(e.status>=400&&e.status<500?400:502).json({error:"No pude abrir Mercado Pago: "+e.message});
  }
});

app.get("/api/payments/orders/:orderId",async(req,res)=>{
  if(!db)return res.status(503).json({error:"La base de datos no está disponible."});
  try{
    let order=await findLocalPaymentOrder(req.params.orderId);
    if(!order)return res.status(404).json({error:"Pago inexistente."});
    const room=order.room_code?getRoom(order.room_code):null;
    if(order.room_code&&(!room||!requireHost(room,req)))return res.status(403).json({error:"Solo el host puede consultar este pago."});
    if(order.status!=="approved"&&order.provider_order_id){
      try{order=await fetchAndReconcilePayment(order)}catch(e){console.error("payment reconcile",e.message)}
    }
    res.json({payment:paymentOrderPublic(order)});
  }catch(e){res.status(500).json({error:"No pude consultar el pago."})}
});

app.post("/api/payments/orders/:orderId/reconcile",async(req,res)=>{
  if(!db)return res.status(503).json({error:"La base de datos no está disponible."});
  try{
    let order=await findLocalPaymentOrder(req.params.orderId);
    if(!order)return res.status(404).json({error:"Pago inexistente."});
    const room=order.room_code?getRoom(order.room_code):null;
    if(order.room_code&&(!room||!requireHost(room,req)))return res.status(403).json({error:"Solo el host puede verificar este pago."});
    order=await fetchAndReconcilePayment(order);
    res.json({payment:paymentOrderPublic(order)});
  }catch(e){res.status(502).json({error:"No pude verificar el pago con Mercado Pago."})}
});

app.post("/api/payments/webhook",async(req,res)=>{
  try{
    const cfg=await getPaymentSettings({secrets:true});
    if(!cfg.webhookSecret)return res.status(503).end();
    if(!verifyMercadoPagoWebhook(req,cfg.webhookSecret))return res.status(401).end();
    const dataId=String(req.query["data.id"]||req.body?.data?.id||"");
    if(!dataId)return res.status(200).end();
    const eventId=String(req.body?.id||"")+"|"+String(req.body?.action||"")+"|"+dataId;
    const seen=await db.query("SELECT 1 FROM payment_webhook_events WHERE event_id=$1",[eventId]);
    if(seen.rowCount)return res.status(200).end();
    const local=await findLocalPaymentOrder(dataId);
    if(local){
      const providerOrder=await mpFetch("/v1/orders/"+encodeURIComponent(dataId),{accessToken:cfg.accessToken});
      await reconcilePayment(local,providerOrder);
    }
    await db.query("INSERT INTO payment_webhook_events(event_id,provider) VALUES($1,'mercadopago') ON CONFLICT DO NOTHING",[eventId]);
    res.status(200).end();
  }catch(e){
    console.error("payment webhook",e.message);
    res.status(500).end();
  }
});

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
  if(!access)return res.status(402).json({error:"Necesitás Premium para usar packs personalizados."});
  const prefix=access.id+":";
  const packs=[...customPackStore.entries()].filter(([k])=>k.startsWith(prefix)).map(([,v])=>v).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  res.json({packs});
});

app.post("/api/custom-packs/sync",(req,res)=>{
  const access=packOwnerAccess(req);
  if(!access)return res.status(402).json({error:"Necesitás Premium para sincronizar packs."});
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
  if(customPack&&!hasPremiumAccess(req))return res.status(402).json({error:"La personalización es Premium. Desbloqueá Premium para usar partidas personalizadas."});
  const surpriseEnabled=req.body.surpriseMode===true;
  const honoreeName=surpriseEnabled?clean(req.body.honoreeName,40):"";
  if(surpriseEnabled&&!honoreeName)return res.status(400).json({error:"Decinos para quién es la sorpresa."});
  const roundLimit=[8,12,15,25].includes(Number(req.body.roundLimit))?Number(req.body.roundLimit):15;
  const disabledModes=Array.isArray(req.body.disabledModes)?req.body.disabledModes.filter(x=>MODES[x]).slice(0,12):[];
  const playWhen=req.body.playWhen==="later"?"later":"now",eventDate=playWhen==="later"?clean(req.body.eventDate,40):"";
  if(!name||!hostName)return res.status(400).json({error:"Faltan datos."});
  if(surpriseEnabled&&honoreeName.toLowerCase()===hostName.toLowerCase())return res.status(400).json({error:"La persona sorpresa no puede tener el mismo nombre que el host."});
  if(THEMES[themeId].premiumOnly&&!hasPremiumAccess(req))return res.status(402).json({error:"Esta temática es Premium. Desbloqueá Premium para usarla."});
  if(THEMES[themeId].age18&&req.body.ageConfirmed!==true)return res.status(400).json({error:"La versión 18+ requiere confirmar mayoría de edad."});
  if(playWhen==="later"&&!eventDate)return res.status(400).json({error:"Elegí la fecha de la juntada."});
  let code=roomCode();while(rooms.has(code))code=roomCode();
  const hostId=id(),sessionToken=token(),tp=themePrompts(themeId),access=accessFromReq(req);
  const inheritedAccess=accessCanCreatePremium(access);
  const room={
    code,name,themeId,playWhen,eventDate,playerCount:req.body.playerCount==="2"?"2":"group",state:playWhen==="later"?"collecting":"lobby",
    hostPlayerId:hostId,currentRound:0,roundPhase:"guess",advanceAt:null,startAt:null,unlocked:true,accessPlan:inheritedAccess?(access.role==="admin"?"admin":access.plan):null,
    players:[{id:hostId,name:hostName,ready:false,score:0}],submissions:{},missions:{},rounds:[],
    customPack,
    surprise:surpriseEnabled?{
      enabled:true,honoreeName,honoreePlayerId:null,joinKey:token(),quickQuestions:SURPRISE_QUICK_QUESTIONS
    }:null,
    roundLimit,
    disabledModes,
    usedContent:{},
    duoPrepQuestions:req.body.playerCount==="2"?null:null,
    prepPrompts:null,
    createdAt:Date.now()
  };
  room.prepPrompts=makePrepPrompts(room);
  if(isDuoRoom(room))ensureDuoPrep(room);
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
  if(isDuoRoom(room)&&!isHonoree&&room.players.filter(p=>!p.isHonoree).length>=2)return res.status(409).json({error:"Esta sala es Modo Dúo y ya están las 2 personas."});
  const alreadyPlaying=["starting","playing","paywall"].includes(room.state);
  const p={id:id(),name,ready:isHonoree?false:alreadyPlaying,score:0,isHonoree},t=token();
  room.players.push(p);
  if(isHonoree)room.surprise.honoreePlayerId=p.id;
  sessions.set(sessionKey(t),p.id);persistSession(t,room.code,p.id);persistRoom(room);
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
  // The host can open preparation immediately. Players who join while collecting enter the same answer screen.
  // With two players both people must enter the answer/preparation screen first.
  // The Duo match starts only after both have submitted their answers.
  room.state="collecting";res.json({ok:true,duo:isDuoRoom(room)});
});

app.post("/api/rooms/:code/submissions",(req,res)=>{
  const room=getRoom(req.params.code),me=auth(room,req);
  if(!room)return res.status(404).json({error:"Sala inexistente."});
  if(!me)return res.status(401).json({error:"Volvé a entrar a la sala."});
  if(room.state!=="collecting")return res.status(409).json({error:"La preparación ya cerró."});
  if(me.isHonoree)return res.status(409).json({error:"Tu preparación sorpresa usa solo las 3 preguntas rápidas."});
  if(isDuoRoom(room)&&!room.surprise?.enabled){
    const questions=ensureDuoPrep(room);
    const duoAnswers=Array.isArray(req.body.duoAnswers)?req.body.duoAnswers.map(x=>clean(x,10)):[];
    if(duoAnswers.length!==questions.length)return res.status(400).json({error:"Respondé las 10 preguntas antes de sellar tu perfil."});
    for(let i=0;i<questions.length;i++){
      if(!questions[i].options.some(o=>o.id===duoAnswers[i]))return res.status(400).json({error:"Hay una respuesta inválida en tu perfil."});
    }
    room.submissions[me.id]={duoAnswers};
    me.ready=true;
    if(room.players.length===2&&room.players.every(p=>p.ready)){
      room.players.forEach(p=>p.score=0);
      room.rounds=buildDuo2Rounds(room);room.state="starting";room.currentRound=0;room.roundPhase="guess";room.advanceAt=null;room.startAt=Date.now()+3200;
      return res.json({ok:true,duo:true,autoStarted:true,rounds:room.rounds.length,startAt:room.startAt});
    }
    return res.json({ok:true,duo:true});
  }
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
  me.ready=true;
  // In Duo, once both people have answered there is nobody else to wait for: start automatically.
  if(isDuoRoom(room)&&room.players.length===2&&!room.surprise?.enabled&&room.players.every(p=>p.ready)){
    room.players.forEach(p=>p.score=0);
    room.rounds=buildDuo2Rounds(room);room.state="starting";room.currentRound=0;room.roundPhase="guess";room.advanceAt=null;room.startAt=Date.now()+3200;
    return res.json({ok:true,duo:true,autoStarted:true,rounds:room.rounds.length,startAt:room.startAt});
  }
  res.json({ok:true});
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

app.post("/api/rooms/:code/leave",(req,res)=>{
  const room=getRoom(req.params.code);if(!room)return res.json({ok:true,closed:false});
  const me=auth(room,req);if(!me)return res.status(401).json({error:"Sesión inválida."});
  if(me.id===room.hostPlayerId){
    rooms.delete(room.code);
    if(db){db.query("DELETE FROM game_rooms WHERE code=$1",[room.code]).catch(e=>console.error("delete room",e.message));db.query("DELETE FROM game_sessions WHERE room_code=$1",[room.code]).catch(e=>console.error("delete sessions",e.message));}
    return res.json({ok:true,closed:true});
  }
  removePlayerFromRoom(room,me.id);
  res.json({ok:true,closed:false});
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
  if(isDuoRoom(room)){
    if(room.players.length!==2)return res.status(409).json({error:"El Modo Dúo necesita exactamente 2 personas."});
    if(room.players.some(p=>!p.ready))return res.status(409).json({error:"Falta que ambos terminen de responder."});
    room.players.forEach(p=>p.score=0);room.rounds=buildDuo2Rounds(room);room.state="starting";room.currentRound=0;room.roundPhase="guess";room.advanceAt=null;room.startAt=Date.now()+3200;return res.json({ok:true,duo:true,rounds:room.rounds.length,startAt:room.startAt});
  }
  if(room.players.length<3)return res.status(409).json({error:"El modo grupal necesita al menos 3 personas."});
  if(room.surprise?.enabled&&!room.surprise.honoreePlayerId)return res.status(409).json({error:"Todavía falta que entre "+room.surprise.honoreeName+" con su link sorpresa."});
  if(room.players.some(p=>!p.ready))return res.status(409).json({error:"Todavía falta gente por responder."});
  room.players.forEach(p=>p.score=0);
  room.rounds=buildRounds(room);assignMissions(room);
  if(!room.rounds.length)return res.status(409).json({error:"No pude generar rondas con estas respuestas."});
  room.state="starting";room.currentRound=0;room.roundPhase="guess";room.advanceAt=null;room.unlocked=true;
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
  // Dedicated two-player rounds always accept their own visible options directly.
  if(["duo_read","duo_risk","duo_speed"].includes(r.mode)){
    if(!(r.options||[]).some(o=>String(o.id)===choice))return res.status(400).json({error:"Opción inválida para esta ronda Dúo."});
  }else if(r.mode==="duo"){
    const inPair=(r.duoIds||[]).includes(me.id);
    const valid=inPair?["left","right"]:["same","different"];
    if(!valid.includes(choice))return res.status(400).json({error:"Opción inválida."});
  }else if(!(r.options||[]).some(o=>String(o.id)===choice)){
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
  if(!requireAdminAccess(req))return res.status(403).json({error:"La simulación de pago es solo para ADMIN."});
  const accessPlan=ACCESS_PLANS.find(p=>p.id===req.body?.accessPlan)?.id||"lifetime";
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
  room.submissions={};room.missions={};room.rounds=[];room.duoPrepQuestions=null;
  if(isDuoRoom(room))ensureDuoPrep(room);
  room.prepPrompts=makePrepPrompts(room);
  room.state=isDuoRoom(room)?"lobby":"collecting";room.currentRound=0;room.roundPhase="guess";room.advanceAt=null;room.startAt=null;room.unlocked=true;
  res.json({ok:true});
});

app.use((_req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
hydrateDatabase().finally(()=>{
  app.listen(PORT,"0.0.0.0",()=>console.log(`La Noche full game engine running on :${PORT}`));
});
