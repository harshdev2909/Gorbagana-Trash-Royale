"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, Coins, Users, Clock, Crown, Target, Loader2, Play } from "lucide-react"
import { useGameContext } from "@/contexts/GameContext"
import { useWalletContext } from "@/contexts/WalletContext"
import { useState } from "react"

export function TournamentHub() {
  const { 
    currentTournament, 
    setGameState, 
    joinTournament,
    isLoading,
    error
  } = useGameContext()
  
  const { gorbBalance } = useWalletContext()
  
  const [selectedTournament, setSelectedTournament] = useState<string>("")

  const tournaments = [
    {
      id: "weekly_champ",
      name: "Weekly Championship",
      entryFee: 50,
      prizePool: 1600,
      players: 32,
      registered: 24,
      startTime: Date.now() + 3600000, // 1 hour from now
      status: "registration" as const
    },
    {
      id: "daily_quick",
      name: "Daily Quick Fire",
      entryFee: 10,
      prizePool: 320,
      players: 32,
      registered: 28,
      startTime: Date.now() + 300000, // 5 minutes from now
      status: "registration" as const
    },
    {
      id: "pro_league",
      name: "Pro League Finals",
      entryFee: 200,
      prizePool: 6400,
      players: 32,
      registered: 16,
      startTime: Date.now() + 86400000, // 24 hours from now
      status: "registration" as const
    }
  ]

  const handleJoinTournament = async (tournamentId: string, entryFee: number) => {
    await joinTournament(tournamentId, entryFee)
  }

  const handleBackToLobby = () => {
    setGameState('lobby')
  }

  const formatTimeRemaining = (startTime: number) => {
    const remaining = startTime - Date.now()
    if (remaining <= 0) return "Starting now..."
    
    const hours = Math.floor(remaining / 3600000)
    const minutes = Math.floor((remaining % 3600000) / 60000)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  return (
    <div className="min-h-screen p-6 pt-20 relative z-10">
      {/* Tournament Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-gold-900/30 via-yellow-900/20 to-orange-900/30 z-0" />
      
      {/* Trophy Particles */}
      <div className="fixed inset-0 pointer-events-none z-10">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gold-400 rounded-full animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
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
                          {tournament.prizePool} GORB
                        </div>
                        <div className="text-sm text-gray-400">Prize Pool</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-black/40 p-3 rounded border border-gold-500/30">
                          <div className="text-gold-400 font-bold">{tournament.entryFee} GORB</div>
                          <div className="text-xs text-gray-400">Entry Fee</div>
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
                        disabled={isLoading || gorbBalance < tournament.entryFee || tournament.registered >= tournament.players}
                      >
                        {isLoading ? (
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
                    <div className="text-green-400 font-bold">{currentTournament.prizePool} GORB</div>
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
                  { name: "TrashMaster", wins: 15, earnings: 2400 },
                  { name: "GorbKing", wins: 12, earnings: 1800 },
                  { name: "JunkLord", wins: 10, earnings: 1500 },
                  { name: "ScrapGod", wins: 8, earnings: 1200 },
                  { name: "WasteWarrior", wins: 6, earnings: 900 },
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
                        {player.wins} wins • {player.earnings} GORB
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Tournament Rules */}
            <Card className="bg-black/80 border-blue-500/30 p-6">
              <h3 className="text-blue-400 font-bold text-xl mb-4">TOURNAMENT RULES</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Single elimination bracket format</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Winners advance to next round</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Prize pool distributed to top 8</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>No refunds for early elimination</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Fair play enforced - no cheating</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <span className="text-red-400">{error}</span>
          </div>
        )}
      </div>
    </div>
  )
} 