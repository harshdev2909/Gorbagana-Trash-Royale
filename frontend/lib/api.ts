export async function claimSolReward({
  winnerAddress,
  amount,
  matchId,
  winnerId,
}: {
  winnerAddress: string;
  amount: number;
  matchId?: string;
  winnerId?: string;
}) {
  const res = await fetch('http://localhost:3001/claim-reward', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ winnerAddress, amount, matchId, winnerId }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Reward claim failed');
  return res.json();
}

export async function getLeaderboard() {
  const res = await fetch('http://localhost:3001/leaderboard');
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}

export async function getMatchHistory() {
  const res = await fetch('http://localhost:3001/match-history');
  if (!res.ok) throw new Error('Failed to fetch match history');
  return res.json();
} 