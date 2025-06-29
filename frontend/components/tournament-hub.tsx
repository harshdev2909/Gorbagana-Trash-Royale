"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, Coins, Users, Clock, Crown, Target, Loader2, Play } from "lucide-react"
import { useGameContext } from "@/contexts/GameContext"
import { useWalletContext } from "@/contexts/WalletContext"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from '@/hooks/use-toast'
import { PublicKey } from '@solana/web3.js'
import { useTransactionHistory } from '@/contexts/TransactionHistoryContext'

function JoinedTournaments({ joined }: { joined: any[] }) {
  if (!joined.length) return (
    <Card className="bg-black/80 border-blue-500/30 p-6">
      <h3 className="text-blue-400 font-bold text-xl mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5" />
        JOINED TOURNAMENTS
      </h3>
      <div className="text-blue-200">You haven't joined any tournaments yet.</div>
    </Card>
  )
  return (
    <Card className="bg-black/80 border-blue-500/30 p-6">
      <h3 className="text-blue-400 font-bold text-xl mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5" />
        JOINED TOURNAMENTS
      </h3>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-blue-200">
            <th className="pr-4 font-bold">Tournament</th>
            <th className="pr-4 font-bold">Entry Fee</th>
            <th className="pr-4 font-bold">Prize Pool</th>
            <th className="pr-4 font-bold">Joined</th>
            <th className="font-bold">Tx</th>
          </tr>
        </thead>
        <tbody>
          {joined.map((j, i) => (
            <tr key={i} className="border-b border-blue-500/10 hover:bg-blue-900/20 transition-colors">
              <td className="pr-4 text-white font-semibold">{j.name}</td>
              <td className="pr-4 text-blue-100">{j.entryFee} SOL</td>
              <td className="pr-4 text-blue-100">{j.prizePool} SOL</td>
              <td className="pr-4 text-blue-100">{new Date(j.joinedAt).toLocaleString()}</td>
              <td>
                <a href={`https://explorer.solana.com/tx/${j.tx}?cluster=custom&customUrl=https://rpc.gorbagana.wtf/`} target="_blank" rel="noopener noreferrer" className="underline text-blue-300 font-mono">
                  {j.tx.slice(0, 8)}...{j.tx.slice(-8)}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

export function TournamentHub() {
  const { 
    currentTournament, 
    setGameState, 
    joinTournament,
    isLoading,
    error
  } = useGameContext()
  
  const { gorbBalance, solBalance, publicKey, sendTransaction } = useWalletContext()
  const { toast } = useToast()
  const SOL_TO_GORB_RATE = 2704.877024
  const gorbEquivalent = solBalance * SOL_TO_GORB_RATE
  
  const [selectedTournament, setSelectedTournament] = useState<string>("")
  const [tournaments, setTournaments] = useState<any[]>([])
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingTournament, setPendingTournament] = useState<any>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [joinedTournaments, setJoinedTournaments] = useState<any[]>([])
  const { addTransaction } = useTransactionHistory()

  // Load joined tournaments from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('joinedTournaments')
    if (saved) {
      try {
        setJoinedTournaments(JSON.parse(saved))
      } catch {}
    }
  }, [])

  // Save joined tournaments to localStorage on update
  useEffect(() => {
    localStorage.setItem('joinedTournaments', JSON.stringify(joinedTournaments))
  }, [joinedTournaments])

  // Generate dynamic tournaments
  useEffect(() => {
    const generateTournaments = () => {
      const now = Date.now()
      const baseTournaments = [
        {
          id: "weekly_champ",
          name: "Weekly Championship",
          entryFee: 0.01, // SOL
          prizePool: 0.32, // SOL (32 * 0.01)
          players: 32,
          registered: Math.floor(Math.random() * 20) + 10, // 10-30 players
          startTime: now + 3600000, // 1 hour from now
          status: "registration" as const,
          description: "The ultimate weekly challenge for serious players"
        },
        {
          id: "daily_quick",
          name: "Daily Quick Fire",
          entryFee: 0.002, // SOL
          prizePool: 0.064, // SOL (32 * 0.002)
          players: 32,
          registered: Math.floor(Math.random() * 25) + 15, // 15-40 players
          startTime: now + 300000, // 5 minutes from now
          status: "registration" as const,
          description: "Fast-paced daily tournament for quick rewards"
        },
        {
          id: "pro_league",
          name: "Pro League Finals",
          entryFee: 0.05, // SOL
          prizePool: 1.6, // SOL (32 * 0.05)
          players: 32,
          registered: Math.floor(Math.random() * 15) + 5, // 5-20 players
          startTime: now + 86400000, // 24 hours from now
          status: "registration" as const,
          description: "High-stakes tournament for elite players"
        },
        {
          id: "rookie_rising",
          name: "Rookie Rising",
          entryFee: 0.001, // SOL
          prizePool: 0.032, // SOL (32 * 0.001)
          players: 32,
          registered: Math.floor(Math.random() * 30) + 20, // 20-50 players
          startTime: now + 1800000, // 30 minutes from now
          status: "registration" as const,
          description: "Perfect for new players to get started"
        }
      ]
      setTournaments(baseTournaments)
    }

    generateTournaments()
    // Update tournaments every 30 seconds
    const interval = setInterval(generateTournaments, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleJoinTournament = async (tournamentId: string, entryFee: number, treasuryAddress?: string) => {
    if (solBalance < entryFee) {
      toast({ title: 'Insufficient SOL', description: `You need ${entryFee} SOL to join.`, variant: 'destructive' })
      return
    }
    const tournament = tournaments.find(t => t.id === tournamentId)
    setPendingTournament(tournament)
    setShowConfirm(true)
  }

  const confirmJoin = async () => {
    if (!pendingTournament) return
    setIsJoining(true)
    try {
      // Replace with your treasury address
      const TREASURY_ADDRESS = '6ncxVhwUppRj3x99WY3GNUyqYjALjo7aZUVogUGyKhEQ'
      const signature = await sendTransaction(new PublicKey(TREASURY_ADDRESS), pendingTournament.entryFee)
      toast({
        title: 'Joined Tournament',
        description: (
          <span>
            You have joined {pendingTournament.name}!<br />
            <a
              href={`https://explorer.solana.com/tx/${signature}?cluster=custom&customUrl=https://rpc.gorbagana.wtf/`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-600"
            >
              View Transaction
            </a>
          </span>
        ),
        variant: 'default'
      })
      setJoinedTournaments(prev => [
        {
          name: pendingTournament.name,
          entryFee: pendingTournament.entryFee,
          prizePool: pendingTournament.prizePool,
          joinedAt: Date.now(),
          tx: signature
        },
        ...prev
      ])
      // Use 'entry' as the transaction type for tournament joins (TransactionType only allows 'entry', 'upgrade', 'reward')
      addTransaction({
        type: 'entry',
        amount: pendingTournament.entryFee,
        hash: signature,
        timestamp: Date.now(),
      })
      setShowConfirm(false)
      setPendingTournament(null)
      // Optionally call backend join logic here
    } catch (e: any) {
      toast({ title: 'Join Failed', description: e.message || 'Failed to join tournament', variant: 'destructive' })
    } finally {
      setIsJoining(false)
    }
  }

  const handleBackToLobby = () => {
    setGameState('lobby')
  }

  const formatTimeRemaining = (startTime: number) => {
    const now = Date.now()
    const diff = startTime - now
    
    if (diff <= 0) return "Starting now"
    
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    
    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m ${seconds}s`
    return `${seconds}s`
  }

  return (
    <div className="min-h-screen p-6 pt-20 relative z-10">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-gold-900/20 -z-10" />
      
      {/* Animated particles */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gold-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-20">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-black bg-gradient-to-r from-gold-400 to-yellow-400 bg-clip-text text-transparent mb-4">
            TOURNAMENT HUB
          </h1>
          <div className="flex items-center justify-center gap-4 text-gold-400">
            <div className="flex items-center gap-2 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-gold-500/50 shadow-lg">
              <Coins className="w-5 h-5" />
              <span className="text-lg font-bold text-white">{gorbBalance.toLocaleString()} GORB</span>
              <span className="text-blue-400 font-bold ml-2">{solBalance.toFixed(4)} SOL</span>
              <span className="text-gold-400 font-bold ml-2">≈ {gorbEquivalent.toLocaleString(undefined, { maximumFractionDigits: 4 })} GORB</span>
            </div>
            <Button
              variant="outline"
              className="border-gold-500/50 text-gold-400 hover:bg-gold-500/20"
              onClick={handleBackToLobby}
            >
              <Play className="w-4 h-4 mr-2" />
              BACK TO LOBBY
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Available Tournaments */}
          <div className="col-span-8">
            <Card className="bg-black/80 border-gold-500/50 p-6">
              <h2 className="text-gold-400 font-bold text-2xl mb-6 flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                AVAILABLE TOURNAMENTS
              </h2>
              <div className="space-y-4">
                {tournaments.map((tournament) => (
                  <div
                    key={tournament.id}
                    className="bg-gray-900/50 p-6 rounded-lg border border-gold-500/30 hover:border-gold-400/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-gold-400 font-bold text-xl mb-2">{tournament.name}</h3>
                        <p className="text-gray-400 text-sm mb-2">{tournament.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-300">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {tournament.registered}/{tournament.players} Players
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTimeRemaining(tournament.startTime)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-gold-400 font-bold text-2xl mb-1">
                          {tournament.prizePool} SOL
                        </div>
                        <div className="text-sm text-gray-400">Prize Pool</div>
                        <div className="text-blue-400 font-bold text-lg mt-1">
                          ≈ {(tournament.prizePool * SOL_TO_GORB_RATE).toLocaleString()} GORB
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-black/40 p-3 rounded border border-gold-500/30">
                          <div className="text-gold-400 font-bold">{tournament.entryFee} SOL</div>
                          <div className="text-xs text-gray-400">Entry Fee</div>
                          <div className="text-blue-400 text-xs">
                            ≈ {(tournament.entryFee * SOL_TO_GORB_RATE).toLocaleString()} GORB
                          </div>
                        </div>
                        <div className="bg-black/40 p-3 rounded border border-purple-500/30">
                          <div className="text-purple-400 font-bold">
                            {Math.floor((tournament.registered / tournament.players) * 100)}%
                          </div>
                          <div className="text-xs text-gray-400">Full</div>
                        </div>
                      </div>
                      <Button
                        className="bg-gold-500 hover:bg-gold-600 text-black font-bold px-8"
                        onClick={() => handleJoinTournament(tournament.id, tournament.entryFee)}
                        disabled={isJoining || solBalance < tournament.entryFee || tournament.registered >= tournament.players}
                      >
                        {isJoining ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Trophy className="w-4 h-4 mr-2" />
                        )}
                        {tournament.registered >= tournament.players ? "FULL" : "JOIN"}
                      </Button>
                    </div>

                    <Progress 
                      value={(tournament.registered / tournament.players) * 100} 
                      className="mt-4 h-2" 
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Panel - Tournament Info & Leaderboard */}
          <div className="col-span-4 space-y-6">
            {/* Current Tournament Status */}
            {currentTournament && (
              <Card className="bg-black/80 border-green-500/50 p-6">
                <h3 className="text-green-400 font-bold text-xl mb-4 flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  YOUR TOURNAMENT
                </h3>
                <div className="space-y-3">
                  <div className="bg-gray-900/50 p-3 rounded border border-green-500/30">
                    <div className="text-green-400 font-bold">{currentTournament.name}</div>
                    <div className="text-sm text-gray-400">Status: {currentTournament.status}</div>
                  </div>
                  <div className="bg-gray-900/50 p-3 rounded border border-green-500/30">
                    <div className="text-green-400 font-bold">{currentTournament.prizePool} SOL</div>
                    <div className="text-sm text-gray-400">Prize Pool</div>
                  </div>
                  <div className="bg-gray-900/50 p-3 rounded border border-green-500/30">
                    <div className="text-green-400 font-bold">{currentTournament.players.length}</div>
                    <div className="text-sm text-gray-400">Registered Players</div>
                  </div>
                </div>
              </Card>
            )}

            {/* Tournament Leaderboard */}
            <Card className="bg-black/80 border-purple-500/30 p-6">
              <h3 className="text-purple-400 font-bold text-xl mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                TOURNAMENT LEADERS
              </h3>
              <div className="space-y-3">
                {[
                  { name: "TrashMaster", wins: 15, earnings: 0.45 },
                  { name: "GorbKing", wins: 12, earnings: 0.36 },
                  { name: "JunkLord", wins: 10, earnings: 0.30 },
                  { name: "ScrapGod", wins: 8, earnings: 0.24 },
                  { name: "WasteWarrior", wins: 6, earnings: 0.18 },
                ].map((player, i) => (
                  <div
                    key={player.name}
                    className="flex items-center gap-3 bg-gray-900/50 p-3 rounded border border-purple-500/20"
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
                    <div className="flex-1">
                      <div className="text-white font-semibold">{player.name}</div>
                      <div className="text-xs text-gray-400">
                        {player.wins} wins • {player.earnings} SOL
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Tournament Rules */}
            <Card className="bg-black/80 border-blue-500/30 p-6">
              <h3 className="text-blue-400 font-bold text-xl mb-4">TOURNAMENT RULES</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Entry fees are paid in SOL</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Last player standing wins the prize pool</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Tournaments start when full or time expires</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>No refunds once tournament begins</span>
                </div>
              </div>
            </Card>

            <JoinedTournaments joined={joinedTournaments} />
          </div>
        </div>
      </div>

      {error && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500/90 p-4 rounded-lg border border-red-500">
          <span className="text-white">{error}</span>
        </div>
      )}

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Tournament Join</DialogTitle>
          </DialogHeader>
          {pendingTournament && (
            <div className="space-y-4">
              <div className="text-lg font-bold">{pendingTournament.name}</div>
              <div>Entry Fee: <span className="text-blue-400 font-bold">{pendingTournament.entryFee} SOL</span> <span className="text-gold-400">(≈ {(pendingTournament.entryFee * SOL_TO_GORB_RATE).toLocaleString(undefined, { maximumFractionDigits: 4 })} GORB)</span></div>
              <div>Are you sure you want to join this tournament?</div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isJoining}>Cancel</Button>
            <Button onClick={confirmJoin} disabled={isJoining} className="bg-gold-500 hover:bg-gold-600 text-black font-bold">
              {isJoining ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trophy className="w-4 h-4 mr-2" />}
              Confirm & Join
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 