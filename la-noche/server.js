import express from "express";
import pg from "pg";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false }
});

app.use(express.json({ limit: "200kb" }));
app.use(express.static(path.join(__dirname, "public")));

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

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id text PRIMARY KEY,
      code varchar(6) UNIQUE NOT NULL,
      name varchar(80) NOT NULL,
      state varchar(20) NOT NULL DEFAULT 'lobby',
      host_player_id text,
      current_round integer NOT NULL DEFAULT 0,
      round_phase varchar(20) NOT NULL DEFAULT 'guess',
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS players (
      id text PRIMARY KEY,
      room_id text NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      name varchar(40) NOT NULL,
      session_token varchar(64) UNIQUE NOT NULL,
      ready boolean NOT NULL DEFAULT false,
      score integer NOT NULL DEFAULT 0,
      joined_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS submissions (
      id text PRIMARY KEY,
      room_id text NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      player_id text NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      kind varchar(20) NOT NULL,
      prompt_index integer NOT NULL DEFAULT 0,
      text varchar(280) NOT NULL,
      UNIQUE(player_id, kind, prompt_index)
    );
    CREATE TABLE IF NOT EXISTS majority_votes (
      room_id text NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      voter_id text NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      prompt_index integer NOT NULL,
      chosen_player_id text NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      PRIMARY KEY (voter_id, prompt_index)
    );
    CREATE TABLE IF NOT EXISTS rounds (
      id text PRIMARY KEY,
      room_id text NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      position integer NOT NULL,
      mode varchar(20) NOT NULL,
      prompt text NOT NULL,
      statement text,
      correct_answer text NOT NULL,
      scored boolean NOT NULL DEFAULT false,
      UNIQUE(room_id, position)
    );
    CREATE TABLE IF NOT EXISTS round_votes (
      round_id text NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
      voter_id text NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      choice text NOT NULL,
      PRIMARY KEY(round_id, voter_id)
    );
    CREATE INDEX IF NOT EXISTS idx_players_room ON players(room_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_room ON submissions(room_id);
    CREATE INDEX IF NOT EXISTS idx_rounds_room_pos ON rounds(room_id, position);
  `);
}

async function getRoom(code) {
  const { rows } = await pool.query("SELECT * FROM rooms WHERE code=$1", [code.toUpperCase()]);
  return rows[0];
}
async function authPlayer(roomId, sessionToken) {
  if (!sessionToken) return null;
  const { rows } = await pool.query(
    "SELECT id,name,ready,score FROM players WHERE room_id=$1 AND session_token=$2",
    [roomId, sessionToken]
  );
  return rows[0] || null;
}
function bearer(req) {
  const h = req.headers.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7) : "";
}
async function requireHost(req, room) {
  const player = await authPlayer(room.id, bearer(req));
  if (!player || player.id !== room.host_player_id) return null;
  return player;
}
async function roomSnapshot(room, viewer) {
  const players = (await pool.query(
    "SELECT id,name,ready,score FROM players WHERE room_id=$1 ORDER BY joined_at",
    [room.id]
  )).rows;
  let round = null;
  if (room.state === "playing" || room.state === "finished") {
    round = (await pool.query(
      "SELECT id,position,mode,prompt,statement,correct_answer,scored FROM rounds WHERE room_id=$1 AND position=$2",
      [room.id, room.current_round]
    )).rows[0] || null;
    if (round) {
      const voteCount = Number((await pool.query(
        "SELECT count(*) c FROM round_votes WHERE round_id=$1",
        [round.id]
      )).rows[0].c);
      const ownVote = viewer ? (await pool.query(
        "SELECT choice FROM round_votes WHERE round_id=$1 AND voter_id=$2",
        [round.id, viewer.id]
      )).rows[0]?.choice || null : null;

      round.voteCount = voteCount;
      round.ownVote = ownVote;
      round.correctAnswer = room.round_phase === "reveal" || room.state === "finished" ? round.correct_answer : null;
      delete round.correct_answer;

      if (room.round_phase === "reveal" || room.state === "finished") {
        const votes = (await pool.query(
          "SELECT choice,count(*)::int total FROM round_votes WHERE round_id=$1 GROUP BY choice",
          [round.id]
        )).rows;
        round.results = votes;
      }
    }
  }
  return {
    code: room.code,
    name: room.name,
    state: room.state,
    roundPhase: room.round_phase,
    currentRound: room.current_round,
    isHost: viewer?.id === room.host_player_id,
    me: viewer ? { id: viewer.id, name: viewer.name, ready: viewer.ready, score: viewer.score } : null,
    players,
    round,
    majorityPrompts: MAJORITY_PROMPTS
  };
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/rooms", async (req, res) => {
  const name = clean(req.body.name, 80);
  const hostName = clean(req.body.hostName, 40);
  if (!name || !hostName) return res.status(400).json({ error: "Faltan datos." });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let code = roomCode();
    while ((await client.query("SELECT 1 FROM rooms WHERE code=$1", [code])).rowCount) code = roomCode();

    const roomId = id();
    const playerId = id();
    const sessionToken = token();
    await client.query(
      "INSERT INTO rooms(id,code,name,host_player_id) VALUES($1,$2,$3,$4)",
      [roomId, code, name, playerId]
    );
    await client.query(
      "INSERT INTO players(id,room_id,name,session_token) VALUES($1,$2,$3,$4)",
      [playerId, roomId, hostName, sessionToken]
    );
    await client.query("COMMIT");
    res.json({ code, sessionToken });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: "No pude crear la sala." });
  } finally {
    client.release();
  }
});

app.post("/api/rooms/:code/join", async (req, res) => {
  const room = await getRoom(req.params.code);
  if (!room) return res.status(404).json({ error: "Sala inexistente." });
  if (room.state !== "lobby") return res.status(409).json({ error: "La partida ya empezó." });

  const name = clean(req.body.name, 40);
  if (!name) return res.status(400).json({ error: "Escribí tu nombre." });
  const existing = await pool.query(
    "SELECT 1 FROM players WHERE room_id=$1 AND lower(name)=lower($2)",
    [room.id, name]
  );
  if (existing.rowCount) return res.status(409).json({ error: "Ese nombre ya está en la sala." });

  const sessionToken = token();
  await pool.query(
    "INSERT INTO players(id,room_id,name,session_token) VALUES($1,$2,$3,$4)",
    [id(), room.id, name, sessionToken]
  );
  res.json({ code: room.code, sessionToken });
});

app.get("/api/rooms/:code", async (req, res) => {
  const room = await getRoom(req.params.code);
  if (!room) return res.status(404).json({ error: "Sala inexistente." });
  const viewer = await authPlayer(room.id, bearer(req));
  res.json(await roomSnapshot(room, viewer));
});

app.post("/api/rooms/:code/start-collecting", async (req, res) => {
  const room = await getRoom(req.params.code);
  if (!room) return res.status(404).json({ error: "Sala inexistente." });
  if (!await requireHost(req, room)) return res.status(403).json({ error: "Solo el host." });
  const count = Number((await pool.query("SELECT count(*) c FROM players WHERE room_id=$1", [room.id])).rows[0].c);
  if (count < 3) return res.status(409).json({ error: "Necesitan ser al menos 3." });
  await pool.query("UPDATE rooms SET state='collecting' WHERE id=$1", [room.id]);
  res.json({ ok: true });
});

app.post("/api/rooms/:code/submissions", async (req, res) => {
  const room = await getRoom(req.params.code);
  if (!room) return res.status(404).json({ error: "Sala inexistente." });
  if (room.state !== "collecting") return res.status(409).json({ error: "No estamos cargando respuestas." });
  const player = await authPlayer(room.id, bearer(req));
  if (!player) return res.status(401).json({ error: "Volvé a entrar a la sala." });

  const secrets = Array.isArray(req.body.secrets) ? req.body.secrets.map(v => clean(v, 280)) : [];
  const truth = clean(req.body.truth, 280);
  const lie = clean(req.body.lie, 280);
  const majority = Array.isArray(req.body.majority) ? req.body.majority : [];
  if (secrets.length !== 3 || secrets.some(v => !v) || !truth || !lie || majority.length !== MAJORITY_PROMPTS.length) {
    return res.status(400).json({ error: "Completá todo antes de enviar." });
  }

  const validPlayers = new Set((await pool.query("SELECT id FROM players WHERE room_id=$1", [room.id])).rows.map(r => r.id));
  if (majority.some(v => !validPlayers.has(v))) return res.status(400).json({ error: "Hay un voto inválido." });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM submissions WHERE player_id=$1", [player.id]);
    await client.query("DELETE FROM majority_votes WHERE voter_id=$1", [player.id]);
    for (let i = 0; i < secrets.length; i++) {
      await client.query(
        "INSERT INTO submissions(id,room_id,player_id,kind,prompt_index,text) VALUES($1,$2,$3,'secret',$4,$5)",
        [id(), room.id, player.id, i, secrets[i]]
      );
    }
    await client.query(
      "INSERT INTO submissions(id,room_id,player_id,kind,prompt_index,text) VALUES($1,$2,$3,'truth',0,$4)",
      [id(), room.id, player.id, truth]
    );
    await client.query(
      "INSERT INTO submissions(id,room_id,player_id,kind,prompt_index,text) VALUES($1,$2,$3,'lie',0,$4)",
      [id(), room.id, player.id, lie]
    );
    for (let i = 0; i < majority.length; i++) {
      await client.query(
        "INSERT INTO majority_votes(room_id,voter_id,prompt_index,chosen_player_id) VALUES($1,$2,$3,$4)",
        [room.id, player.id, i, majority[i]]
      );
    }
    await client.query("UPDATE players SET ready=true WHERE id=$1", [player.id]);
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: "No pude guardar tus respuestas." });
  } finally {
    client.release();
  }
});

app.post("/api/rooms/:code/start-game", async (req, res) => {
  const room = await getRoom(req.params.code);
  if (!room) return res.status(404).json({ error: "Sala inexistente." });
  if (!await requireHost(req, room)) return res.status(403).json({ error: "Solo el host." });

  const players = (await pool.query("SELECT id,name,ready FROM players WHERE room_id=$1", [room.id])).rows;
  if (players.length < 3 || players.some(p => !p.ready)) return res.status(409).json({ error: "Todavía falta gente por responder." });

  const submissions = (await pool.query(
    "SELECT s.*,p.name player_name FROM submissions s JOIN players p ON p.id=s.player_id WHERE s.room_id=$1",
    [room.id]
  )).rows;
  const rounds = [];

  const secretPrompt = ["¿Quién contó esto?", "¿A quién le pasó?", "¿Quién escribió esto?"];
  for (const s of shuffle(submissions.filter(s => s.kind === "secret")).slice(0, 12)) {
    rounds.push({ mode: "who", prompt: secretPrompt[s.prompt_index] || "¿Quién dijo esto?", statement: s.text, correct: s.player_id });
  }
  for (const s of shuffle(submissions.filter(s => s.kind === "truth" || s.kind === "lie")).slice(0, 10)) {
    rounds.push({
      mode: "truth",
      prompt: `¿Verdad o mentira sobre ${s.player_name}?`,
      statement: s.text,
      correct: s.kind === "truth" ? "true" : "false"
    });
  }

  for (let i = 0; i < MAJORITY_PROMPTS.length; i++) {
    const tally = (await pool.query(
      `SELECT chosen_player_id,count(*)::int total
       FROM majority_votes WHERE room_id=$1 AND prompt_index=$2
       GROUP BY chosen_player_id ORDER BY total DESC, chosen_player_id`,
      [room.id, i]
    )).rows;
    const max = Math.max(...tally.map(t => t.total));
    const winners = tally.filter(t => t.total === max);
    const winner = winners[crypto.randomInt(winners.length)].chosen_player_id;
    rounds.push({ mode: "majority", prompt: "¿A quién eligió más gente?", statement: MAJORITY_PROMPTS[i], correct: winner });
  }

  const ordered = shuffle(rounds);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM rounds WHERE room_id=$1", [room.id]);
    await client.query("UPDATE players SET score=0 WHERE room_id=$1", [room.id]);
    for (let i = 0; i < ordered.length; i++) {
      const r = ordered[i];
      await client.query(
        "INSERT INTO rounds(id,room_id,position,mode,prompt,statement,correct_answer) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [id(), room.id, i, r.mode, r.prompt, r.statement, r.correct]
      );
    }
    await client.query("UPDATE rooms SET state='playing',current_round=0,round_phase='guess' WHERE id=$1", [room.id]);
    await client.query("COMMIT");
    res.json({ ok: true, rounds: ordered.length });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: "No pude armar la partida." });
  } finally {
    client.release();
  }
});

app.post("/api/rooms/:code/vote", async (req, res) => {
  const room = await getRoom(req.params.code);
  if (!room || room.state !== "playing") return res.status(409).json({ error: "No hay una ronda activa." });
  if (room.round_phase !== "guess") return res.status(409).json({ error: "La ronda ya se reveló." });
  const player = await authPlayer(room.id, bearer(req));
  if (!player) return res.status(401).json({ error: "Sesión inválida." });
  const round = (await pool.query("SELECT * FROM rounds WHERE room_id=$1 AND position=$2", [room.id, room.current_round])).rows[0];
  if (!round) return res.status(404).json({ error: "Ronda inexistente." });
  const choice = clean(req.body.choice, 80);
  if (!choice) return res.status(400).json({ error: "Elegí una opción." });

  if (round.mode === "who" || round.mode === "majority") {
    const valid = (await pool.query("SELECT 1 FROM players WHERE room_id=$1 AND id=$2", [room.id, choice])).rowCount;
    if (!valid) return res.status(400).json({ error: "Opción inválida." });
  } else if (!["true", "false"].includes(choice)) {
    return res.status(400).json({ error: "Opción inválida." });
  }

  await pool.query(
    `INSERT INTO round_votes(round_id,voter_id,choice) VALUES($1,$2,$3)
     ON CONFLICT(round_id,voter_id) DO UPDATE SET choice=excluded.choice`,
    [round.id, player.id, choice]
  );
  res.json({ ok: true });
});

app.post("/api/rooms/:code/reveal", async (req, res) => {
  const room = await getRoom(req.params.code);
  if (!room || room.state !== "playing") return res.status(409).json({ error: "No hay partida activa." });
  if (!await requireHost(req, room)) return res.status(403).json({ error: "Solo el host." });

  const round = (await pool.query("SELECT * FROM rounds WHERE room_id=$1 AND position=$2", [room.id, room.current_round])).rows[0];
  if (!round) return res.status(404).json({ error: "Ronda inexistente." });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const locked = (await client.query("SELECT * FROM rounds WHERE id=$1 FOR UPDATE", [round.id])).rows[0];
    if (!locked.scored) {
      await client.query(
        `UPDATE players p SET score = score + 100
         FROM round_votes v
         WHERE v.round_id=$1 AND v.voter_id=p.id AND v.choice=$2`,
        [round.id, round.correct_answer]
      );
      await client.query("UPDATE rounds SET scored=true WHERE id=$1", [round.id]);
    }
    await client.query("UPDATE rooms SET round_phase='reveal' WHERE id=$1", [room.id]);
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: "No pude revelar la ronda." });
  } finally {
    client.release();
  }
});

app.post("/api/rooms/:code/next", async (req, res) => {
  const room = await getRoom(req.params.code);
  if (!room || room.state !== "playing") return res.status(409).json({ error: "No hay partida activa." });
  if (!await requireHost(req, room)) return res.status(403).json({ error: "Solo el host." });
  const total = Number((await pool.query("SELECT count(*) c FROM rounds WHERE room_id=$1", [room.id])).rows[0].c);
  if (room.current_round + 1 >= total) {
    await pool.query("UPDATE rooms SET state='finished',round_phase='reveal' WHERE id=$1", [room.id]);
  } else {
    await pool.query("UPDATE rooms SET current_round=current_round+1,round_phase='guess' WHERE id=$1", [room.id]);
  }
  res.json({ ok: true });
});

app.post("/api/rooms/:code/restart", async (req, res) => {
  const room = await getRoom(req.params.code);
  if (!room) return res.status(404).json({ error: "Sala inexistente." });
  if (!await requireHost(req, room)) return res.status(403).json({ error: "Solo el host." });
  await pool.query("UPDATE players SET ready=false,score=0 WHERE room_id=$1", [room.id]);
  await pool.query("DELETE FROM rounds WHERE room_id=$1", [room.id]);
  await pool.query("UPDATE rooms SET state='collecting',current_round=0,round_phase='guess' WHERE id=$1", [room.id]);
  res.json({ ok: true });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

initDb().then(() => {
  app.listen(PORT, "0.0.0.0", () => console.log(`La Noche running on :${PORT}`));
}).catch(err => {
  console.error("DB init failed", err);
  process.exit(1);
});
