import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';

const PORT = Number(process.env.PORT || 8080);
const ROOM_TTL_MS = 30_000;
const MAX_ROOM_AGE_MS = 6 * 60 * 60 * 1000;
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const formats = new Set(['rapido', 'set', 'partido']);

const rooms = new Map();
const queues = new Map();
const startedAt = Date.now();

function send(ws, payload) {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
}
function broadcast(room, payload) {
  for (const p of room.players) send(p?.ws, payload);
}
function capacityFor(teamSize) { return teamSize === 2 ? 4 : 2; }
function seatOrder(teamSize) { return teamSize === 2 ? [0, 2, 1, 3] : [0, 2]; }
function teamForPlayerId(playerId) { return playerId < 2 ? 0 : 1; }
function queueKey(teamSize, format) { return `${teamSize}:${format}`; }
function randomCode() {
  let code = '';
  for (let i = 0; i < 5; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}
function newToken() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
function normalizeRegion(value) {
  const r = String(value || 'GLOBAL').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 16);
  return r || 'GLOBAL';
}
function regionFamily(region) {
  if (['AR', 'UY', 'CL', 'BR-S', 'PY'].includes(region)) return 'SOUTH-CONE';
  if (['BO', 'PE', 'EC', 'CO', 'VE', 'BR', 'BR-S', 'AR', 'UY', 'CL', 'PY'].includes(region)) return 'SOUTH-AMERICA';
  if (['MX', 'CR', 'PA', 'GT', 'HN', 'SV', 'NI', 'DO', 'PR'].includes(region)) return 'LATAM-NORTH';
  return region;
}
function regionDistance(a, b) {
  if (a === b) return 0;
  const fa = regionFamily(a), fb = regionFamily(b);
  if (fa === 'SOUTH-CONE' && fb === 'SOUTH-CONE') return 1;
  if ((fa === 'SOUTH-CONE' || fa === 'SOUTH-AMERICA') && (fb === 'SOUTH-CONE' || fb === 'SOUTH-AMERICA')) return 2;
  if ((fa.startsWith('SOUTH-') || fa.startsWith('LATAM-')) && (fb.startsWith('SOUTH-') || fb.startsWith('LATAM-'))) return 3;
  return 9;
}
function allowedDistance(waitMs) {
  if (waitMs < 8_000) return 0;
  if (waitMs < 18_000) return 1;
  if (waitMs < 30_000) return 2;
  if (waitMs < 45_000) return 3;
  return 9;
}
function scopeName(distance) {
  return distance === 0 ? 'local' : distance <= 1 ? 'cercana' : distance <= 3 ? 'regional' : 'global';
}
function liveQueueEntries(teamSize) {
  let total = 0;
  for (const [key, q] of queues) {
    if (!key.startsWith(`${teamSize}:`)) continue;
    total += q.filter((entry) => entry.ws?.readyState === WebSocket.OPEN && !entry.ws.roomCode).length;
  }
  return total;
}
function queueStats() {
  return {
    type: 'queue-stats',
    oneVOne: liveQueueEntries(1),
    twoVTwo: liveQueueEntries(2),
    updatedAt: Date.now(),
  };
}
function publishQueueStats() {
  const stats = queueStats();
  for (const client of wss?.clients ?? []) send(client, stats);
}

function createRoom({ teamSize = 1, format = 'rapido', isPrivate = false } = {}) {
  teamSize = teamSize === 2 ? 2 : 1;
  format = formats.has(format) ? format : 'rapido';
  let code;
  do code = randomCode(); while (rooms.has(code));
  const room = {
    code,
    format,
    teamSize,
    capacity: capacityFor(teamSize),
    isPrivate,
    players: Array(capacityFor(teamSize)).fill(null),
    started: false,
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
  };
  rooms.set(code, room);
  return room;
}
function roomSummary(room) {
  const connected = room.players.map((p) => !!p?.ws);
  return {
    type: 'room',
    code: room.code,
    format: room.format,
    teamSize: room.teamSize,
    required: room.capacity,
    ready: connected.filter(Boolean).length === room.capacity,
    connected,
  };
}
function announce(room) { broadcast(room, roomSummary(room)); }
function playerById(room, playerId) {
  return room.players.find((p) => p?.playerId === playerId) || null;
}

function startPeerRoom(room, resumed = false) {
  if (!room.players.every((p) => !!p?.ws)) return;
  room.started = true;
  room.lastActiveAt = Date.now();
  const hostId = 0;
  const host = playerById(room, hostId);
  if (!host) return;
  for (const p of room.players) {
    if (!p?.ws) continue;
    const peers = p.playerId === hostId
      ? room.players.filter((other) => other && other.playerId !== hostId).map((other) => other.playerId)
      : [hostId];
    send(p.ws, {
      type: 'p2p-init',
      hostId,
      peers,
      initiator: p.playerId === hostId,
      iceServers: [
        { urls: 'stun:stun.cloudflare.com:3478' },
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    });
  }
  broadcast(room, {
    type: 'start',
    code: room.code,
    format: room.format,
    teamSize: room.teamSize,
    transport: 'hybrid-p2p',
    resumed,
  });
}

function attachPlayer(ws, room, slot, token = newToken(), region = 'GLOBAL') {
  const playerId = seatOrder(room.teamSize)[slot];
  const previous = room.players[slot];
  room.players[slot] = {
    token,
    ws,
    slot,
    playerId,
    team: teamForPlayerId(playerId),
    region: normalizeRegion(region || previous?.region),
    disconnectedAt: 0,
  };
  ws.roomCode = room.code;
  ws.slot = slot;
  ws.playerId = playerId;
  ws.playerToken = token;
  send(ws, {
    type: 'joined',
    code: room.code,
    token,
    slot,
    playerId,
    team: teamForPlayerId(playerId),
    teamSize: room.teamSize,
    required: room.capacity,
    format: room.format,
    private: room.isPrivate,
  });
  announce(room);
  if (room.players.every((p) => !!p?.ws)) startPeerRoom(room, !!previous);
}

function removeFromQueues(ws) {
  let changed = false;
  for (const [key, q] of queues) {
    const next = q.filter((entry) => entry.ws !== ws && entry.ws?.readyState === WebSocket.OPEN);
    if (next.length !== q.length) changed = true;
    if (next.length) queues.set(key, next); else queues.delete(key);
    publishQueue(key);
  }
  ws.queueKey = null;
  if (changed) publishQueueStats();
}
function publishQueue(key) {
  const q = queues.get(key) ?? [];
  if (!q.length) return;
  const [teamSizeText] = key.split(':');
  const teamSize = Number(teamSizeText) === 2 ? 2 : 1;
  const required = capacityFor(teamSize);
  const now = Date.now();
  for (const entry of q) {
    const allowed = allowedDistance(now - entry.queuedAt);
    const compatible = q.filter((candidate) => candidate !== entry && regionDistance(entry.region, candidate.region) <= allowed).length;
    send(entry.ws, {
      type: 'queue',
      teamSize,
      found: Math.min(required, 1 + compatible),
      required,
      scope: scopeName(allowed),
    });
  }
}
function chooseMatch(q, required, now) {
  if (q.length < required) return null;
  const anchors = [...q].sort((a, b) => a.queuedAt - b.queuedAt);
  for (const anchor of anchors) {
    const allowed = allowedDistance(now - anchor.queuedAt);
    const candidates = q
      .filter((entry) => entry !== anchor)
      .map((entry) => ({ entry, distance: regionDistance(anchor.region, entry.region) }))
      .filter((item) => item.distance <= allowed)
      .sort((a, b) => a.distance - b.distance || a.entry.queuedAt - b.entry.queuedAt);
    if (candidates.length >= required - 1) return [anchor, ...candidates.slice(0, required - 1).map((item) => item.entry)];
  }
  return null;
}
function tryMatch(key) {
  let q = (queues.get(key) ?? []).filter((entry) => entry.ws?.readyState === WebSocket.OPEN && !entry.ws.roomCode);
  const [teamSizeText, format] = key.split(':');
  const teamSize = Number(teamSizeText) === 2 ? 2 : 1;
  const required = capacityFor(teamSize);
  const now = Date.now();
  let changed = false;
  while (q.length >= required) {
    const selected = chooseMatch(q, required, now);
    if (!selected) break;
    const selectedSet = new Set(selected);
    q = q.filter((entry) => !selectedSet.has(entry));
    const room = createRoom({ teamSize, format, isPrivate: false });
    selected.forEach((entry, slot) => {
      entry.ws.queueKey = null;
      attachPlayer(entry.ws, room, slot, newToken(), entry.region);
    });
    changed = true;
  }
  if (q.length) queues.set(key, q); else queues.delete(key);
  publishQueue(key);
  if (changed) publishQueueStats();
}

let wss;
const server = http.createServer((req, res) => {
  const path = String(req.url || '').split('?')[0];
  if (path === '/health' || path === '/queue-stats') {
    const stats = queueStats();
    const body = path === '/health'
      ? {
          ok: true,
          sport: 'padel',
          transport: 'hybrid-p2p',
          rooms: rooms.size,
          queued: stats.oneVOne + stats.twoVTwo,
          oneVOne: stats.oneVOne,
          twoVTwo: stats.twoVTwo,
          uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
        }
      : { ok: true, oneVOne: stats.oneVOne, twoVTwo: stats.twoVTwo, updatedAt: stats.updatedAt };
    res.writeHead(200, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
    });
    res.end(JSON.stringify(body));
    return;
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'content-type',
    });
    res.end();
    return;
  }
  res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
  res.end('Pongball Padel proximity matchmaking + WebRTC signaling.');
});
wss = new WebSocketServer({ server });
server.listen(PORT, '0.0.0.0', () => console.log(`Pongball P2P signaling listo en :${PORT}`));

wss.on('connection', (ws) => {
  send(ws, { type: 'hello', sport: 'padel', transport: 'hybrid-p2p', serverTime: Date.now() });
  send(ws, queueStats());
  ws.on('message', (data) => {
    let msg;
    try { msg = JSON.parse(String(data)); } catch { return; }
    if (!msg || typeof msg.type !== 'string') return;

    if (msg.type === 'matchmake') {
      removeFromQueues(ws);
      const teamSize = msg.teamSize === 2 ? 2 : 1;
      const format = formats.has(msg.format) ? msg.format : 'rapido';
      const key = queueKey(teamSize, format);
      const q = queues.get(key) ?? [];
      q.push({ ws, queuedAt: Date.now(), region: normalizeRegion(msg.region) });
      queues.set(key, q);
      ws.queueKey = key;
      send(ws, { type: 'status', status: 'waiting', message: 'Buscando primero jugadores cercanos…' });
      publishQueue(key);
      publishQueueStats();
      tryMatch(key);
      return;
    }
    if (msg.type === 'cancel-queue') {
      removeFromQueues(ws);
      send(ws, { type: 'queue-cancelled' });
      return;
    }
    if (msg.type === 'queue-stats') {
      send(ws, queueStats());
      return;
    }
    if (msg.type === 'create') {
      removeFromQueues(ws);
      const room = createRoom({ teamSize: msg.teamSize === 2 ? 2 : 1, format: msg.format, isPrivate: true });
      attachPlayer(ws, room, 0, newToken(), normalizeRegion(msg.region));
      return;
    }
    if (msg.type === 'join') {
      removeFromQueues(ws);
      const room = rooms.get(String(msg.code || '').trim().toUpperCase());
      if (!room || !room.isPrivate) return send(ws, { type: 'error', message: 'Sala privada inexistente o vencida.' });
      const slot = room.players.findIndex((p) => !p?.ws && !p?.token);
      if (slot < 0) return send(ws, { type: 'error', message: 'La sala ya está completa.' });
      attachPlayer(ws, room, slot, newToken(), normalizeRegion(msg.region));
      return;
    }
    if (msg.type === 'resume') {
      removeFromQueues(ws);
      const room = rooms.get(String(msg.code || '').toUpperCase());
      if (!room) return send(ws, { type: 'error', message: 'La partida ya no está disponible.' });
      const slot = room.players.findIndex((p) => p?.token === msg.token);
      if (slot < 0) return send(ws, { type: 'error', message: 'No pude recuperar tu lugar.' });
      attachPlayer(ws, room, slot, msg.token, normalizeRegion(msg.region));
      return;
    }
    if (msg.type === 'signal' || msg.type === 'peer-data') {
      const room = rooms.get(ws.roomCode);
      if (!room) return;
      const target = playerById(room, Number(msg.to));
      if (!target?.ws) return;
      room.lastActiveAt = Date.now();
      send(target.ws, {
        type: msg.type,
        from: ws.playerId,
        ...(msg.type === 'signal' ? { data: msg.data } : { payload: msg.payload }),
      });
      return;
    }
    if (msg.type === 'ping') {
      send(ws, { type: 'pong', sentAt: msg.sentAt, serverTime: Date.now() });
    }
  });

  ws.on('close', () => {
    removeFromQueues(ws);
    const room = rooms.get(ws.roomCode);
    const slot = ws.slot;
    if (!room || !Number.isInteger(slot)) return;
    const player = room.players[slot];
    if (player?.ws === ws) {
      player.ws = null;
      player.disconnectedAt = Date.now();
      room.lastActiveAt = Date.now();
      announce(room);
      broadcast(room, { type: 'peer-disconnected', playerId: player.playerId, team: player.team, graceMs: ROOM_TTL_MS });
    }
  });
});

setInterval(() => {
  const now = Date.now();
  for (const key of [...queues.keys()]) tryMatch(key);
  for (const [code, room] of rooms) {
    const disconnectedTooLong = room.players.some((p) => p?.token && !p.ws && p.disconnectedAt && now - p.disconnectedAt > ROOM_TTL_MS);
    const noConnections = room.players.every((p) => !p?.ws);
    if (disconnectedTooLong || (noConnections && now - room.lastActiveAt > ROOM_TTL_MS) || now - room.createdAt > MAX_ROOM_AGE_MS) {
      broadcast(room, { type: 'closed', reason: 'La partida terminó.' });
      rooms.delete(code);
    }
  }
}, 1000);

function shutdown() {
  for (const room of rooms.values()) broadcast(room, { type: 'closed', reason: 'Servidor detenido.' });
  wss.close(() => server.close(() => process.exit(0)));
  setTimeout(() => process.exit(0), 1000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
