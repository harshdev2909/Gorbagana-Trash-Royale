import { db, connectDB } from './db.js';

export async function recordWin(playerId) {
  await connectDB();
  await db.collection('leaderboard').updateOne(
    { playerId },
    {
      $inc: { wins: 1, gamesPlayed: 1 },
      $set: { lastWinAt: Date.now() },
      $setOnInsert: { playerId }
    },
    { upsert: true }
  );
}

export async function recordGamePlayed(playerId) {
  await connectDB();
  await db.collection('leaderboard').updateOne(
    { playerId },
    { $inc: { gamesPlayed: 1 }, $setOnInsert: { playerId } },
    { upsert: true }
  );
}

export async function getLeaderboard() {
  await connectDB();
  const docs = await db.collection('leaderboard').find().sort({ wins: -1 }).limit(10).toArray();
  // Optionally calculate winRate on the fly
  return docs.map(doc => ({
    ...doc,
    winRate: doc.gamesPlayed ? Math.round((doc.wins / doc.gamesPlayed) * 100) : 0
  }));
}
