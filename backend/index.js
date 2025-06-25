const express = require('express');
const app = express();
const port = 3000;
const cors = require('cors');
app.use(cors());
app.use(express.json());

// In-memory store (temporary)
let players = {};
let leaderboard = [];

// Save player score
app.post('/api/score', (req, res) => {
  const { playerId, score } = req.body;
  if (!playerId || score === undefined) {
    return res.status(400).json({ error: 'Player ID and score are required' });
  }
  players[playerId] = { score, lastUpdated: Date.now() };
  updateLeaderboard();
  res.json({ success: true, score });
});

// Get player score
app.get('/api/score/:playerId', (req, res) => {
  const { playerId } = req.params;
  const player = players[playerId];
  if (!player) return res.status(404).json({ error: 'Player not found' });
  res.json(player);
});

// Purchase power-up (simulated)
app.post('/api/power-up', (req, res) => {
  const { playerId, powerUpType } = req.body;
  if (!playerId || !powerUpType) {
    return res.status(400).json({ error: 'Player ID and power-up type are required' });
  }
  // Simulate $GOR cost (e.g., 10 $GOR for speed boost)
  const cost = 10;
  if (!players[playerId] || players[playerId].score < cost) {
    return res.status(403).json({ error: 'Insufficient score or $GOR' });
  }
  players[playerId].score -= cost;
  players[playerId].powerUp = powerUpType;
  players[playerId].powerUpExpires = Date.now() + 8000; // 8s duration
  updateLeaderboard();
  res.json({ success: true, powerUp: powerUpType });
});

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
  res.json(leaderboard);
});

// Update leaderboard
function updateLeaderboard() {
  leaderboard = Object.entries(players)
    .map(([id, data]) => ({ playerId: id, score: data.score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // Top 10
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});