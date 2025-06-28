import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createMatch, setWinner, matches, recordMatch, matchHistory, playerJoin, playerLeave, getPlayerList, getMatchHistory } from './game.js';
import { getLeaderboard, recordWin } from './leaderboard.js';
import { WebSocketServer } from 'ws';
import { db, connectDB } from './db.js';
import crypto from 'crypto';
import solanaRoutes from './solana.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Claim reward endpoint
app.post('/claim-reward', async (req, res) => {
  const { winnerAddress, amount, matchId, winnerId, players, events } = req.body;
  if (!winnerAddress || !amount) return res.status(400).json({ error: 'Missing params' });

  try {
    const signature = await sendSol(winnerAddress, amount);
    if (matchId && winnerId) {
      setWinner(matchId, winnerId);
      await recordWin(winnerId);
      await recordMatch({
        id: matchId,
        winner: winnerId,
        players: players || matches[matchId]?.players,
        endedAt: Date.now(),
        events: events || [],
      });
      broadcast('leaderboard', await getLeaderboard());
      broadcast('matchHistory', await getMatchHistory());
    }
    res.json({ success: true, signature });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leaderboard endpoint
app.get('/leaderboard', async (req, res) => {
  res.json(await getLeaderboard());
});

// Match history endpoint
app.get('/match-history', async (req, res) => {
  res.json(await getMatchHistory());
});

// In-memory lobby tracking
const lobbies = {}; // { matchId: [playerId, ...] }

// Helper to broadcast to all sockets in a lobby
function broadcastToLobby(matchId, event, data) {
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ event, matchId, data }));
    }
  });
}

// WebSocket for real-time events
const wss = new WebSocketServer({ noServer: true });
wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    try {
      const { event, playerId, matchId } = JSON.parse(msg);
      if (event === 'joinLobby') {
        if (!lobbies[matchId]) lobbies[matchId] = [];
        if (!lobbies[matchId].includes(playerId)) lobbies[matchId].push(playerId);
        broadcastToLobby(matchId, 'lobbyPlayers', lobbies[matchId]);
      }
      if (event === 'leaveLobby') {
        if (lobbies[matchId]) {
          lobbies[matchId] = lobbies[matchId].filter(id => id !== playerId);
          broadcastToLobby(matchId, 'lobbyPlayers', lobbies[matchId]);
        }
      }
    } catch {}
  });
});

function broadcast(event, data) {
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ event, data }));
    }
  });
}

// Example: after updating leaderboard or match history
broadcast('leaderboard', await getLeaderboard());
broadcast('matchHistory', await getMatchHistory());

// --- DEMO: Auto-create a match with mock players on startup ---
function generateMockPlayer(id) {
  return {
    id: `player_${id}`,
    name: `Player_${id}`,
    position: { x: Math.floor(Math.random() * 1000), y: Math.floor(Math.random() * 1000) },
    health: 100,
    shields: 50,
    isAlive: true,
    eliminations: 0,
    avatar: 'Garbage Bot',
    level: 1,
    xp: 0
  };
}

function createDemoMatch() {
  const players = Array.from({ length: 8 }, (_, i) => generateMockPlayer(i + 1));
  matches['demo_match'] = {
    id: 'demo_match',
    players,
    state: 'waiting',
    winner: null,
    createdAt: Date.now(),
  };
}

createDemoMatch();

// --- GAME LOOP FOR DYNAMIC ARENA (DEMO) ---
function randomPosition(size = 1000) {
  return { x: Math.floor(Math.random() * size), y: Math.floor(Math.random() * size) };
}

let arenaSize = 1000;
let shrinkInterval = 30; // seconds

setInterval(() => {
  // For each match, update player positions and broadcast
  Object.values(matches).forEach(match => {
    if (!match.players || match.state !== 'waiting') return;
    // Simulate player positions
    match.players = match.players.map(player => {
      if (!player.isAlive) return player;
      // Move randomly
      const dx = Math.floor(Math.random() * 41) - 20;
      const dy = Math.floor(Math.random() * 41) - 20;
      const newPos = {
        x: Math.max(0, Math.min(1000, (player.position?.x || 500) + dx)),
        y: Math.max(0, Math.min(1000, (player.position?.y || 500) + dy)),
      };
      return { ...player, position: newPos };
    });
    // Broadcast each player's update
    match.players.forEach(player => {
      broadcastToLobby(match.id, 'player-updated', {
        playerId: player.id,
        health: player.health,
        position: player.position,
        isAlive: player.isAlive,
      });
    });
  });
}, 1000); // Update every second

// Arena shrinking logic
setInterval(() => {
  arenaSize = Math.max(200, arenaSize - 50); // Shrink arena
  Object.values(matches).forEach(match => {
    broadcastToLobby(match.id, 'arena-shrinking', {
      newSize: arenaSize,
      timeRemaining: shrinkInterval,
    });
  });
}, shrinkInterval * 1000);

// --- PRIVATE ROOM LOGIC ---

// Helper to generate a unique room code
function generateRoomCode(length = 6) {
  return crypto.randomBytes(length).toString('base64').replace(/[^A-Za-z0-9]/g, '').slice(0, length).toUpperCase();
}

// Endpoint to create a private room
app.post('/create-room', (req, res) => {
  const { player } = req.body; // player: { id, name, ... }
  if (!player || !player.id) return res.status(400).json({ error: 'Missing player data' });
  const matchId = generateRoomCode();
  matches[matchId] = {
    id: matchId,
    players: [{ ...player, position: { x: 500, y: 500 }, health: 100, shields: 50, isAlive: true, eliminations: 0, avatar: player.avatar || 'Garbage Bot', level: 1, xp: 0 }],
    state: 'waiting',
    winner: null,
    createdAt: Date.now(),
  };
  res.json({ matchId });
});

// Endpoint to join a private room
app.post('/join-room', (req, res) => {
  const { matchId, player } = req.body;
  if (!matchId || !player || !player.id) return res.status(400).json({ error: 'Missing matchId or player data' });
  const match = matches[matchId];
  if (!match) return res.status(404).json({ error: 'Room not found' });
  if (!match.players.some(p => p.id === player.id)) {
    match.players.push({
      ...player,
      position: { x: 500, y: 500 },
      health: 100,
      shields: 50,
      isAlive: true,
      eliminations: 0,
      avatar: player.avatar || 'Garbage Bot',
      level: 1,
      xp: 0
    });
  }
  // Broadcast updated player list to all clients in the room
  broadcastToLobby(matchId, 'lobbyPlayers', match.players);
  res.json({ success: true, matchId });
});

// Create or update user profile
const server = app.listen(process.env.PORT || 3001, () => {
  console.log('Backend running on port', process.env.PORT || 3001);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

app.use('/', solanaRoutes);
