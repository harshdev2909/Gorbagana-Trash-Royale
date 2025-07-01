"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, Coins, Settings, Play, Wallet, Crown, Target, Clock, Loader2, X } from "lucide-react"
import { useGameContext } from "@/contexts/GameContext"
import { useWalletContext, WalletMultiButton } from "@/contexts/WalletContext"
import { PublicKey } from '@solana/web3.js'
import { useTransactionHistory } from '@/contexts/TransactionHistoryContext'
import { useToast } from '@/hooks/use-toast'
import RealTimeChat from './real-time-chat'
import PrivateRoom from '@/components/private-room'

const TREASURY_ADDRESS = '6ncxVhwUppRj3x99WY3GNUyqYjALjo7aZUVogUGyKhEQ'
const ENTRY_FEE_SOL = 0.001

// Use your backend for game WebSocket, not Solana RPC
const BACKEND_WS_URL = 'wss://trash-royale.onrender.com';

interface LeaderboardEntry {
  playerId: string;
  wins: number;
  winRate?: number;
}

interface Profile {
  playerId: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
}

export function GameLobby() {
  const { 
    isMatchmaking, 
    matchmakingProgress, 
    startMatchmaking, 
    cancelMatchmaking,
    error: gameError,
    setGameState
  } = useGameContext()
  
  const { 
    connected, 
    publicKey, 
    gorbBalance, 
    solBalance, 
    isLoading, 
    error: walletError,
    disconnect,
    sendTransaction
  } = useWalletContext()

  const { addTransaction, transactions } = useTransactionHistory()
  const { toast } = useToast()

  const [selectedGameMode, setSelectedGameMode] = useState<'quick' | 'tournament' | 'private'>('quick')
  const [selectedAvatar, setSelectedAvatar] = useState('Garbage Bot')
  const [error, setError] = useState<string | null>(null)
  const [playerCount, setPlayerCount] = useState(2)
  const [txStatus, setTxStatus] = useState<string | null>(null)
  const [matchId, setMatchId] = useState('public-lobby')
  const [playerList, setPlayerList] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])

  const SOL_TO_GORB_RATE = 2704.877024;
  const gorbEquivalent = solBalance * SOL_TO_GORB_RATE;

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPlayerCount(prev => Math.max(2, Math.min(8, prev + (Math.random() > 0.5 ? 1 : -1))))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const ws = new WebSocket(BACKEND_WS_URL);
    ws.onopen = () => {
      if (publicKey) ws.send(JSON.stringify({ event: 'joinLobby', playerId: publicKey.toString(), matchId }));
    };
    ws.onmessage = (event) => {
      try {
        const { event: evt, matchId: msgMatchId, data } = JSON.parse(event.data);
        if (evt === 'lobbyPlayers' && msgMatchId === matchId) setPlayerList(data);
      } catch {}
    };
    return () => {
      if (ws.readyState === WebSocket.OPEN && publicKey) {
        ws.send(JSON.stringify({ event: 'leaveLobby', playerId: publicKey.toString(), matchId }));
      }
      ws.close();
    };
  }, [publicKey, matchId]);

  useEffect(() => {
    fetch('https://trash-royale.onrender.com/leaderboard').then(r => r.json()).then(setLeaderboard);
    fetch('https://trash-royale.onrender.com/profiles').then(r => r.json()).then(setProfiles);
    const ws = new WebSocket(BACKEND_WS_URL);
    ws.onmessage = (event) => {
      try {
        const { event: evt, data } = JSON.parse(event.data);
        if (evt === 'leaderboard') setLeaderboard(data);
      } catch {}
    };
    return () => ws.close();
  }, []);

  const getProfile = (playerId: string) => profiles.find(p => p.playerId === playerId);

  const handleFindMatch = async () => {
    if (!connected) {
      setError('Please connect your wallet first')
      toast({ title: 'Wallet not connected', description: 'Please connect your wallet first.', variant: 'destructive' })
      return
    }
    setError(null)
    setTxStatus(null)
    try {
      setTxStatus('Processing entry fee payment...')
      // Send entry fee in SOL
      const signature = await sendTransaction(new PublicKey(TREASURY_ADDRESS), ENTRY_FEE_SOL)
      setTxStatus(`Entry fee paid! Tx: ${signature}`)
      addTransaction({
        type: 'entry',
        amount: ENTRY_FEE_SOL,
        hash: signature,
        timestamp: Date.now(),
      })
      toast({
        title: 'Entry Fee Paid',
        description: (
          <span>
            Transaction:&nbsp;
            <a href={`https://explorer.solana.com/tx/${signature}?cluster=custom&customUrl=https://rpc.gorbagana.wtf/`} target="_blank" rel="noopener noreferrer" className="underline text-green-600">
              {signature.slice(0, 8)}...{signature.slice(-8)}
            </a>
          </span>
        ),
      })
      startMatchmaking()
    } catch (e: any) {
      setError(e.message || 'Failed to pay entry fee')
      setTxStatus(null)
      toast({ title: 'Entry Fee Payment Failed', description: e.message || 'Failed to pay entry fee', variant: 'destructive' })
    }
  }

  const getEntryFee = () => {
    switch (selectedGameMode) {
      case 'tournament': return 50
      case 'private': return 25
      default: return 10
    }
  }

  return (
    <div className="min-h-screen p-6 pt-20 relative z-10">
      {/* Main Title */}
      <div className="text-center mb-8">
        <h1 className="text-8xl font-black bg-gradient-to-r from-green-400 via-purple-400 to-gold-400 bg-clip-text text-transparent mb-4 animate-pulse drop-shadow-lg">
          TRASH ROYALE
        </h1>
        <div className="flex items-center justify-center gap-4 text-green-400">
          {connected ? (
            <>
              <div className="flex items-center gap-2 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-green-500/50 shadow-lg">
                <Wallet className="w-5 h-5" />
                <span className="text-lg font-bold text-white">{gorbEquivalent.toLocaleString(undefined, { maximumFractionDigits: 4 })} GORB</span>
                <span className="text-blue-400 font-bold ml-2">{solBalance.toFixed(4)} SOL</span>
                {/* <span className="text-gold-400 font-bold ml-2">≈ {gorbEquivalent.toLocaleString(undefined, { maximumFractionDigits: 4 })} GORB</span> */}
              </div>
              <div className="text-sm text-gray-400">
                {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
              </div>
              <Button
                variant="outline"
                className="ml-2 border-red-500/50 text-red-400 hover:bg-red-500/20"
                onClick={disconnect}
              >
                Disconnect
              </Button>
            </>
          ) : (
            <div className="relative z-50">
              <WalletMultiButton className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-lg px-6 py-3 text-lg" />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 max-w-7xl mx-auto">
        {/* Left Panel - Daily Quests */}
        <div className="col-span-3">
          <Card className="bg-black/80 backdrop-blur-sm border-green-500/50 p-4 h-full shadow-lg shadow-green-500/10">
            <h3 className="text-green-400 font-bold mb-4 flex items-center gap-2 text-lg">
              <Target className="w-5 h-5" />
              DAILY QUESTS
            </h3>
            <div className="mb-4">
              <label className="block text-green-300 mb-1">Lobby Code</label>
              <input
                type="text"
                value={matchId}
                onChange={e => setMatchId(e.target.value)}
                className="w-full bg-gray-800 text-white px-3 py-2 rounded"
                placeholder="public-lobby or enter code"
              />
            </div>
            <div className="space-y-3">
              {[
                { task: "Eliminate 3 players", reward: 50, progress: 2 },
                { task: "Survive 5 minutes", reward: 30, progress: 5 },
                { task: "Collect 10 items", reward: 25, progress: 7 },
              ].map((quest, i) => (
                <div key={i} className="bg-gray-900/50 p-3 rounded border border-purple-500/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-300">{quest.task}</span>
                    <Badge className="bg-gold-500/20 text-gold-400">+{quest.reward} GORB</Badge>
                  </div>
                  <Progress
                    value={(quest.progress / (quest.task.includes("3") ? 3 : quest.task.includes("5") ? 5 : 10)) * 100}
                    className="h-2"
                  />
                </div>
              ))}
            </div>
            <div className="mt-6">
              <h4 className="text-green-300 font-bold mb-2">Online Players</h4>
              <ul className="text-green-200 text-sm space-y-1">
                {playerList.length === 0 ? (
                  <li>No players online</li>
                ) : playerList.map((p) => (
                  <li key={p}>{p.slice(0, 8)}...{p.slice(-8)}</li>
                ))}
              </ul>
            </div>
            <RealTimeChat />
          </Card>
        </div>

        {/* Center Panel - Main Actions */}
        <div className="col-span-6 space-y-6">
          {/* Find Match */}
          <Card className="bg-gradient-to-br from-green-900/30 to-purple-900/30 border-green-500/50 p-8 text-center">
            <div className="mb-6">
              {isMatchmaking ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-green-400" />
                    <span className="text-2xl font-bold text-green-400">FINDING MATCH...</span>
                  </div>
                  <Progress value={matchmakingProgress} className="h-3" />
                  <Button
                    variant="outline"
                    onClick={cancelMatchmaking}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                  >
                    CANCEL
                  </Button>
                </div>
              ) : (
                <Button
                  size="lg"
                  className="text-2xl px-12 py-6 bg-gradient-to-r from-green-500 to-purple-500 hover:from-green-600 hover:to-purple-600 text-black font-black shadow-lg shadow-green-500/25 animate-pulse"
                  onClick={handleFindMatch}
                  disabled={!connected || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-8 h-8 animate-spin mr-3" />
                  ) : (
                    <Play className="w-8 h-8 mr-3" />
                  )}
                  FIND MATCH
                </Button>
              )}
              
              <div className="mt-4 flex justify-center">
                <span className="flex items-center gap-2 bg-black/90 px-6 py-2 rounded-lg border-2 border-green-400 shadow-lg">
                  <Users className="w-5 h-5 text-green-300" />
                  <span className="text-2xl font-extrabold text-green-300 drop-shadow">
                    {playerList.length}/8
                  </span>
                  <span className="text-lg font-bold text-green-200 tracking-wide">PLAYERS</span>
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-4 mb-6">
              {[
                { key: 'quick', label: 'Quick Match' },
                { key: 'tournament', label: 'Tournament' },
                { key: 'private', label: 'Private Room' }
              ].map((mode) => (
                <Button
                  key={mode.key}
                  variant={selectedGameMode === mode.key ? "default" : "outline"}
                  className={selectedGameMode === mode.key ? "bg-green-500 text-black" : "border-green-500/50 text-green-400"}
                  onClick={() => {
                    setSelectedGameMode(mode.key as any)
                    if (mode.key === 'tournament') setGameState('tournament')
                  }}
                >
                  {mode.label}
                </Button>
              ))}
            </div>

            {/* Show PrivateRoom component if private mode is selected */}
            {selectedGameMode === 'private' && (
              <div className="w-full mt-4">
                <PrivateRoom />
              </div>
            )}

            <div className="flex justify-center mt-6">
              <div className="flex items-center gap-2 bg-yellow-400/90 border-2 border-yellow-500 shadow-lg px-8 py-4 rounded-xl">
                <Coins className="w-6 h-6 text-yellow-700" />
                <span className="text-2xl font-extrabold text-yellow-900 drop-shadow">Entry Fee: {ENTRY_FEE_SOL} SOL</span>
              </div>
            </div>

            {isLoading && txStatus && (
              <div className="flex justify-center mt-6">
                <div className="flex items-center gap-3 bg-green-400/90 border-2 border-green-600 shadow-lg px-8 py-4 rounded-xl">
                  <Loader2 className="w-5 h-5 text-green-900 animate-spin" />
                  <span className="text-lg font-bold text-green-900 drop-shadow">{txStatus}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}
          </Card>

          {/* Avatar Customization */}
          <Card className="bg-black/60 border-purple-500/30 p-6">
            <h3 className="text-purple-400 font-bold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              CUSTOMIZE AVATAR
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { name: "Garbage Bot", img: "https://static.vecteezy.com/system/resources/previews/042/899/708/non_2x/chibi-character-man-woman-for-your-game-character-avatar-or-your-cover-book-free-png.png" },
                { name: "Junk Warrior", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnCKCtQ9BSDw_UFSa_TatlABjhhZB4byNmDw&s" },
                { name: "Scrap Knight", img: "https://cdn.imgbin.com/0/20/4/imgbin-guild-wars-2-guild-wars-eye-of-the-north-video-game-avatar-thorn-aYFEmf9EXgvwNyK15uju9LSBB.jpg" },
                { name: "Trash Titan", img: "https://img.favpng.com/0/16/21/balthazar-guild-wars-nightfall-guild-wars-2-art-character-png-favpng-WZtLFt4RLLxJLDwHsXnak31zE.jpg" },
              ].map((avatar) => (
                <div
                  key={avatar.name}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedAvatar === avatar.name
                      ? "border-green-500 bg-green-500/20"
                      : "border-gray-600 hover:border-purple-500"
                  }`}
                  onClick={() => setSelectedAvatar(avatar.name)}
                >
                  <img
                    src={avatar.img}
                    alt={avatar.name}
                    onError={e => (e.currentTarget.src = "/placeholder-user.jpg")}
                    className="w-16 h-16 rounded-lg mx-auto mb-2 object-cover bg-gray-800"
                  />
                  <div className="text-center text-sm text-gray-300">{avatar.name}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Panel - Leaderboard */}
        <div className="col-span-3">
          <Card className="bg-black/60 border-gold-500/30 p-4 h-full">
            <h3 className="text-gold-400 font-bold mb-4 flex items-center gap-2">
              <Crown className="w-5 h-5" />
              LEADERBOARD
            </h3>
            <div className="space-y-3">
              {leaderboard.length === 0 ? (
                <div className="text-gray-400">No leaderboard data.</div>
              ) : leaderboard.map((entry, i) => {
                const profile = getProfile(entry.playerId);
                return (
                  <div
                    key={entry.playerId}
                    className="flex items-center gap-3 bg-gray-900/50 p-3 rounded border border-gold-500/20"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        i === 0 ? "bg-gold-500 text-black" :
                        i === 1 ? "bg-gray-400 text-black" :
                        i === 2 ? "bg-amber-600 text-black" :
                        "bg-gray-600 text-white"
                      }`}
                    >
                      {i + 1}
                    </div>
                    {profile?.avatarUrl && <img src={profile.avatarUrl} alt="avatar" className="w-7 h-7 rounded-full" />}
                    <div className="flex-1">
                      <div className="text-white font-semibold">{profile?.username || entry.playerId.slice(0, 8)}</div>
                      <div className="text-xs text-gray-400">
                        {entry.wins} wins • {entry.winRate ? `${entry.winRate}% WR` : '-'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Section - Match History */}
      <div className="max-w-7xl mx-auto mt-6">
        <Card className="bg-black/60 border-gray-500/30 p-4 mb-6">
          <h3 className="text-gray-400 font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            RECENT MATCHES
          </h3>
          <div className="grid grid-cols-5 gap-4">
            {[
              { result: "WIN", place: "1st", kills: 5, time: "6:32" },
              { result: "LOSS", place: "4th", kills: 2, time: "4:18" },
              { result: "WIN", place: "1st", kills: 3, time: "7:45" },
              { result: "LOSS", place: "6th", kills: 1, time: "2:56" },
              { result: "WIN", place: "2nd", kills: 4, time: "5:22" },
            ].map((match, i) => (
              <div
                key={i}
                className={`p-3 rounded border ${
                  match.result === "WIN" 
                    ? "border-green-500/50 bg-green-500/10" 
                    : "border-red-500/50 bg-red-500/10"
                }`}
              >
                <div className={`font-bold ${
                  match.result === "WIN" ? "text-green-400" : "text-red-400"
                }`}>
                  {match.result}
                </div>
                <div className="text-sm text-gray-300">
                  {match.place} • {match.kills} kills
                </div>
                <div className="text-xs text-gray-500">{match.time}</div>
              </div>
            ))}
          </div>
        </Card>
        {/* Transaction History Section */}
        <Card className="bg-black/60 border-green-500/30 p-4">
          <h3 className="text-green-400 font-bold mb-4 flex items-center gap-2">
            <Coins className="w-5 h-5" />
            TRANSACTION HISTORY
          </h3>
          {transactions.length === 0 ? (
            <div className="text-gray-400">No recent transactions.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400">
                    <th className="pr-4">Type</th>
                    <th className="pr-4">Amount (SOL)</th>
                    <th className="pr-4">Time</th>
                    <th>Tx Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, i) => (
                    <tr key={i} className="border-b border-green-500/10">
                      <td className="pr-4 capitalize text-green-300">{tx.type}</td>
                      <td className="pr-4 text-green-200">{tx.amount}</td>
                      <td className="pr-4 text-gray-400">{new Date(tx.timestamp).toLocaleTimeString()}</td>
                      <td>
                        <a
                          href={`https://explorer.solana.com/tx/${tx.hash}?cluster=custom&customUrl=https://rpc.gorbagana.wtf/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-400 underline break-all"
                        >
                          {tx.hash.slice(0, 8)}...{tx.hash.slice(-8)}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
} 