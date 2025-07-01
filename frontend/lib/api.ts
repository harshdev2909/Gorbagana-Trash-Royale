const BACKEND_URL = 'https://trash-royale.onrender.com';

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
  const res = await fetch(`${BACKEND_URL}/claim-reward`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ winnerAddress, amount, matchId, winnerId }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Reward claim failed');
  return res.json();
}

export async function getLeaderboard() {
  const res = await fetch(`${BACKEND_URL}/leaderboard`);
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}

export async function getMatchHistory() {
  const res = await fetch(`${BACKEND_URL}/match-history`);
  if (!res.ok) throw new Error('Failed to fetch match history');
  return res.json();
} 