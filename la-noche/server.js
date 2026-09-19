import express from "express";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "200kb" }));
app.use(express.static(path.join(__dirname, "public")));

const rooms = new Map();
const sessions = new Map();
const MAJORITY_PROMPTS = [
  "¿Quién llegaría tarde a su propio casamiento?",
  "¿Quién sobreviviría mejor solo en una isla?",
  "¿Quién desaparecería primero en una fiesta?"
];

function id() { return crypto.randomUUID(); }
function token() { return crypto.randomBytes(24).toString("hex"); }
function roomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[crypto.randomInt(chars.length)];
  return out;
}
function clean(value, max = 120) {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max);
}
function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function bearer(req) {
  const h = req.headers.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7) : "";
}
function getRoom(code) { return rooms.get(String(code || "").toUpperCase()); }
function auth(room, req) {
  const t = bearer(req);
  const pId = sessions.get(t);
  return room?.players.find(p => p.id === pId) || null;
}
function snapshot(room, viewer) {
  const round = room.rounds[room.currentRound] || null;
  const publicRound = round ? {
    id: round.id, position: round.position, mode: round.mode, prompt: round.prompt,
    statement: round.statement, voteCount: Object.keys(round.votes).length,
    ownVote: viewer ? round.votes[viewer.id] || null : null,
    correctAnswer: room.roundPhase === "reveal" || room.state === "finished" ? round.correct : null
  } : null;
  return {
    code: room.code, name: room.name, state: room.state, roundPhase: room.roundPhase,
    currentRound: room.currentRound, isHost: viewer?.id === room.hostPlayerId,
    me: viewer ? { id: viewer.id, name: viewer.name, ready: viewer.ready, score: viewer.score } : null,
    players: room.players.map(p => ({ id: p.id, name: p.name, ready: p.ready, score: p.score })),
    round: publicRound, majorityPrompts: MAJORITY_PROMPTS
  };
}

app.get("/api/health", (_req, res) => res.json({ ok: true, rooms: rooms.size }));

app.post("/api/rooms", (req, res) => {
  const name = clean(req.body.name, 80);
  const hostName = clean(req.body.hostName, 40);
  if (!name || !hostName) return res.status(400).json({ error: "Faltan datos." });

  let code = roomCode();
  while (rooms.has(code)) code = roomCode();
  const hostId = id();
  const sessionToken = token();
  const room = {
    code, name, state: "lobby", hostPlayerId: hostId, currentRound: 0, roundPhase: "guess",
    players: [{ id: hostId, name: hostName, ready: false, score: 0 }],
    submissions: {}, majorityVotes: {}, rounds: [], createdAt: Date.now()
  };
  rooms.set(code, room);
  sessions.set(sessionToken, hostId);
  res.json({ code, sessionToken });
});

app.post("/api/rooms/:code/join", (req, res) => {
  const room = getRoom(req.params.code);
  if (!room) return res.status(404).json({ error: "Sala inexistente." });
  if (room.state !== "lobby") return res.status(409).json({ error: "La partida ya empezó." });
  const name = clean(req.body.name, 40);
  if (!name) return res.status(400).json({ error: "Escribí tu nombre." });
  if (room.players.some(p => p.name.toLowerCase() === name.toLowerCase())) return res.status(409).json({ error: "Ese nombre ya está en la sala." });
  const player = { id: id(), name, ready: false, score: 0 };
  const sessionToken = token();
  room.players.push(player);
  sessions.set(sessionToken, player.id);
  res.json({ code: room.code, sessionToken });
});

app.get("/api/rooms/:code", (req, res) => {
  const room = getRoom(req.params.code);
  if (!room) return res.status(404).json({ error: "Sala inexistente." });
  res.json(snapshot(room, auth(room, req)));
});

app.post("/api/rooms/:code/start-collecting", (req, res) => {
  const room = getRoom(req.params.code);
  const me = auth(room, req);
  if (!room) return res.status(404).json({ error: "Sala inexistente." });
  if (!me || me.id !== room.hostPlayerId) return res.status(403).json({ error: "Solo el host." });
  if (room.players.length < 3) return res.status(409).json({ error: "Necesitan ser al menos 3." });
  room.state = "collecting";
  res.json({ ok: true });
});

app.post("/api/rooms/:code/submissions", (req, res) => {
  const room = getRoom(req.params.code);
  const me = auth(room, req);
  if (!room) return res.status(404).json({ error: "Sala inexistente." });
  if (!me) return res.status(401).json({ error: "Volvé a entrar a la sala." });
  if (room.state !== "collecting") return res.status(409).json({ error: "No estamos cargando respuestas." });

  const secrets = Array.isArray(req.body.secrets) ? req.body.secrets.map(v => clean(v, 280)) : [];
  const truth = clean(req.body.truth, 280);
  const lie = clean(req.body.lie, 280);
  const majority = Array.isArray(req.body.majority) ? req.body.majority : [];
  const validIds = new Set(room.players.map(p => p.id));
  if (secrets.length !== 3 || secrets.some(v => !v) || !truth || !lie || majority.length !== MAJORITY_PROMPTS.length || majority.some(v => !validIds.has(v))) {
    return res.status(400).json({ error: "Completá todo antes de enviar." });
  }
  room.submissions[me.id] = { secrets, truth, lie };
  room.majorityVotes[me.id] = majority;
  me.ready = true;
  res.json({ ok: true });
});

app.post("/api/rooms/:code/start-game", (req, res) => {
  const room = getRoom(req.params.code);
  const me = auth(room, req);
  if (!room) return res.status(404).json({ error: "Sala inexistente." });
  if (!me || me.id !== room.hostPlayerId) return res.status(403).json({ error: "Solo el host." });
  if (room.players.length < 3 || room.players.some(p => !p.ready)) return res.status(409).json({ error: "Todavía falta gente por responder." });

  const rounds = [];
  for (const p of room.players) {
    const s = room.submissions[p.id];
    s.secrets.forEach((text, i) => rounds.push({ id:id(), mode:"who", prompt:["¿Quién contó esto?","¿A quién le pasó?","¿Quién escribió esto?"][i], statement:text, correct:p.id, votes:{} }));
    rounds.push({ id:id(), mode:"truth", prompt:`¿Verdad o mentira sobre ${p.name}?`, statement:s.truth, correct:"true", votes:{} });
    rounds.push({ id:id(), mode:"truth", prompt:`¿Verdad o mentira sobre ${p.name}?`, statement:s.lie, correct:"false", votes:{} });
  }
  for (let i=0;i<MAJORITY_PROMPTS.length;i++) {
    const tally = new Map();
    Object.values(room.majorityVotes).forEach(votes => tally.set(votes[i], (tally.get(votes[i])||0)+1));
    const max = Math.max(...tally.values());
    const winners = [...tally.entries()].filter(([,n])=>n===max).map(([pid])=>pid);
    const winner = winners[crypto.randomInt(winners.length)];
    rounds.push({ id:id(), mode:"majority", prompt:"¿A quién eligió más gente?", statement:MAJORITY_PROMPTS[i], correct:winner, votes:{} });
  }
  room.rounds = shuffle(rounds).slice(0, Math.min(rounds.length, 25)).map((r,i)=>({...r,position:i,scored:false}));
  room.players.forEach(p => p.score = 0);
  room.state = "playing"; room.currentRound = 0; room.roundPhase = "guess";
  res.json({ ok:true, rounds:room.rounds.length });
});

app.post("/api/rooms/:code/vote", (req, res) => {
  const room = getRoom(req.params.code);
  const me = auth(room, req);
  if (!room || room.state !== "playing") return res.status(409).json({ error: "No hay una ronda activa." });
  if (!me) return res.status(401).json({ error: "Sesión inválida." });
  if (room.roundPhase !== "guess") return res.status(409).json({ error: "La ronda ya se reveló." });
  const round = room.rounds[room.currentRound];
  const choice = clean(req.body.choice, 80);
  if (!choice) return res.status(400).json({ error: "Elegí una opción." });
  if ((round.mode === "who" || round.mode === "majority") && !room.players.some(p => p.id === choice)) return res.status(400).json({ error: "Opción inválida." });
  if (round.mode === "truth" && !["true","false"].includes(choice)) return res.status(400).json({ error: "Opción inválida." });
  round.votes[me.id] = choice;
  res.json({ ok:true });
});

app.post("/api/rooms/:code/reveal", (req, res) => {
  const room = getRoom(req.params.code);
  const me = auth(room, req);
  if (!room || room.state !== "playing") return res.status(409).json({ error: "No hay partida activa." });
  if (!me || me.id !== room.hostPlayerId) return res.status(403).json({ error: "Solo el host." });
  const round = room.rounds[room.currentRound];
  if (!round.scored) {
    Object.entries(round.votes).forEach(([pid, choice]) => {
      if (choice === round.correct) {
        const p = room.players.find(x => x.id === pid);
        if (p) p.score += 100;
      }
    });
    round.scored = true;
  }
  room.roundPhase = "reveal";
  res.json({ ok:true });
});

app.post("/api/rooms/:code/next", (req, res) => {
  const room = getRoom(req.params.code);
  const me = auth(room, req);
  if (!room || room.state !== "playing") return res.status(409).json({ error: "No hay partida activa." });
  if (!me || me.id !== room.hostPlayerId) return res.status(403).json({ error: "Solo el host." });
  if (room.currentRound + 1 >= room.rounds.length) {
    room.state = "finished"; room.roundPhase = "reveal";
  } else {
    room.currentRound += 1; room.roundPhase = "guess";
  }
  res.json({ ok:true });
});

app.post("/api/rooms/:code/restart", (req, res) => {
  const room = getRoom(req.params.code);
  const me = auth(room, req);
  if (!room) return res.status(404).json({ error: "Sala inexistente." });
  if (!me || me.id !== room.hostPlayerId) return res.status(403).json({ error: "Solo el host." });
  room.players.forEach(p => { p.ready=false; p.score=0; });
  room.submissions = {}; room.majorityVotes = {}; room.rounds = [];
  room.state = "collecting"; room.currentRound = 0; room.roundPhase = "guess";
  res.json({ ok:true });
});

app.use((_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, "0.0.0.0", () => console.log(`La Noche running on :${PORT}`));
