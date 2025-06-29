"use client";
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

interface LeaderboardEntry {
  playerId: string;
  wins: number;
  winRate?: number;
}

interface MatchRecord {
  id: string;
  winner: string;
  players: string[];
  endedAt: number;
}

interface Profile {
  playerId: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
}

// Use your backend for game WebSocket, not Solana RPC
const BACKEND_WS_URL = 'ws://localhost:3001'; // Change to wss://your-backend-domain for production

export default function LeaderboardHistory() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchRecord[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    fetch('http://localhost:3001/leaderboard').then(r => r.json()).then(setLeaderboard);
    fetch('http://localhost:3001/match-history').then(r => r.json()).then(setMatchHistory);
    fetch('http://localhost:3001/profiles').then(r => r.json()).then(setProfiles);
    const ws = new WebSocket(BACKEND_WS_URL);
    ws.onmessage = (event) => {
      try {
        const { event: evt, data } = JSON.parse(event.data);
        if (evt === 'leaderboard') setLeaderboard(data);
        if (evt === 'matchHistory') setMatchHistory(data);
      } catch {}
    };
    return () => ws.close();
  }, []);

  const getProfile = (playerId: string) => profiles.find(p => p.playerId === playerId);

  return (
    <div className="max-w-4xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card className="bg-black/70 border-green-500/30 p-6">
        <h2 className="text-green-400 font-bold text-2xl mb-4">Leaderboard</h2>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-green-300">
              <th className="pr-4">Player</th>
              <th className="pr-4">Wins</th>
              <th>Win Rate</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length === 0 ? (
              <tr><td colSpan={3} className="text-gray-400">No data</td></tr>
            ) : leaderboard.map((entry, i) => {
              const profile = getProfile(entry.playerId);
              return (
                <tr key={entry.playerId} className="border-b border-green-500/10">
                  <td className="pr-4 flex items-center gap-2">
                    {profile?.avatarUrl && <img src={profile.avatarUrl} alt="avatar" className="w-6 h-6 rounded-full" />}
                    <span className="font-bold">{profile?.username || entry.playerId.slice(0, 8)}</span>
                  </td>
                  <td className="pr-4">{entry.wins}</td>
                  <td>{entry.winRate ? `${entry.winRate}%` : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      <Card className="bg-black/70 border-gold-500/30 p-6">
        <h2 className="text-gold-400 font-bold text-2xl mb-4">Match History</h2>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gold-300">
              <th className="pr-4">Match ID</th>
              <th className="pr-4">Winner</th>
              <th>Ended</th>
            </tr>
          </thead>
          <tbody>
            {matchHistory.length === 0 ? (
              <tr><td colSpan={3} className="text-gray-400">No data</td></tr>
            ) : matchHistory.map((match, i) => {
              const winnerProfile = getProfile(match.winner);
              return (
                <tr key={match.id} className="border-b border-gold-500/10">
                  <td className="pr-4">{match.id}</td>
                  <td className="pr-4 flex items-center gap-2">
                    {winnerProfile?.avatarUrl && <img src={winnerProfile.avatarUrl} alt="avatar" className="w-5 h-5 rounded-full" />}
                    <span>{winnerProfile?.username || match.winner.slice(0, 8)}</span>
                  </td>
                  <td>{new Date(match.endedAt).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
} 