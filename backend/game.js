import { db, connectDB } from './db.js';

// Simple in-memory game state for demo
export const matches = {};
export const players = {};
export const matchHistory = [];

export function createMatch(matchId, playerIds) {
  matches[matchId] = {
    id: matchId,
    players: playerIds,
    state: 'waiting',
    winner: null,
    createdAt: Date.now(),
  };
}

export function setWinner(matchId, winnerId) {
  if (matches[matchId]) {
    matches[matchId].winner = winnerId;
    matches[matchId].state = 'finished';
  }
}

export async function recordMatch(match) {
  await connectDB();
  await db.collection('matchHistory').insertOne(match);
}

export async function getMatchHistory() {
  await connectDB();
  return db.collection('matchHistory').find().sort({ endedAt: -1 }).limit(100).toArray();
}

export function playerJoin(playerId) {
  players[playerId] = { id: playerId, joinedAt: Date.now() };
}

export function playerLeave(playerId) {
  delete players[playerId];
}

export function getPlayerList() {
  return Object.values(players);
}
