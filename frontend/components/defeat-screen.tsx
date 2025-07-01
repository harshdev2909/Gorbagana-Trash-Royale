"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skull, Coins, Eye, Play, RotateCcw, TrendingUp, Target, Clock, Loader2 } from "lucide-react"
import { useGameContext } from "@/contexts/GameContext"
import { useWalletContext } from "@/contexts/WalletContext"
import { useState, useEffect } from "react"
import CountUp from 'react-countup'

export function DefeatScreen() {
  const { 
    currentMatch, 
    currentPlayer, 
    setGameState, 
    placeBet,
    isLoading,
    error
  } = useGameContext()
  
  const { gorbBalance } = useWalletContext()
  
  const [betAmount, setBetAmount] = useState(10)
  const [selectedPlayer, setSelectedPlayer] = useState<string>("")
  const [betsPlaced, setBetsPlaced] = useState<Array<{playerId: string, amount: number, odds: number}>>([])

  const handlePlaceBet = async () => {
    if (!selectedPlayer || betAmount <= 0) return
    await placeBet(selectedPlayer, betAmount)
    setBetsPlaced(prev => [...prev, {
      playerId: selectedPlayer,
      amount: betAmount,
      odds: Math.random() * 3 + 1
    }])
    setSelectedPlayer("")
    setBetAmount(10)
  }

  const handleRematch = () => {
    setGameState('lobby')
  }

  const handleSpectate = () => {
    setGameState('spectator')
  }

  // Play defeat sound on mount
  useEffect(() => {
    const audio = new Audio('/sounds/defeat.mp3')
    audio.volume = 0.5
    audio.play()
  }, [])

  if (!currentMatch || !currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading defeat screen...</div>
      </div>
    )
  }

  const alivePlayers = currentMatch.players.filter(p => p.isAlive)
  const eliminationDetails = currentMatch.killFeed.find(k => k.victim === currentPlayer.id)
  const killer = eliminationDetails ? currentMatch.players.find(p => p.id === eliminationDetails.killer) : null
  const playerRank = currentMatch.players.filter(p => !p.isAlive).length + 1

  // Dynamic defeat stats
  const place = currentMatch && currentPlayer ? currentMatch.players.filter(p => !p.isAlive).length + 1 : 0;
  const kills = currentMatch && currentPlayer ? currentMatch.killFeed.filter(k => k.killer === currentPlayer.id).length : 0;
  const survivalTime = currentMatch ? Math.floor((300 - (currentMatch.timeRemaining || 0)) / 60) : 0;
  const survivalSeconds = currentMatch ? Math.floor((300 - (currentMatch.timeRemaining || 0)) % 60) : 0;
  const baseConsolation = 30;
  const killBonus = kills * 10;
  const survivalBonus = (survivalTime * 3) + Math.floor(Math.random() * 10);
  const totalConsolation = baseConsolation + killBonus + survivalBonus;

  return (
    <div className="min-h-screen p-6 pt-20 relative z-10">
      {/* Dramatic Animated Overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-red-900/80 via-red-700/60 to-black/80 z-50 animate-fade-in-fast pointer-events-none" />
      {/* Confetti/Particle Effect */}
      <div className="fixed inset-0 pointer-events-none z-40">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-red-400 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
      <div className="max-w-6xl mx-auto relative z-50">
        {/* Main Defeat Card */}
        <Card className="bg-gradient-to-br from-red-900/70 to-gray-900/40 border-red-500/70 p-10 text-center mb-8 animate-fade-in animate-pop-in shadow-2xl shadow-red-900/40">
          <div className="mb-6">
            <Skull className="w-28 h-28 text-red-400 mx-auto mb-4 animate-bounce animate-pulse" />
            <h1 className="text-7xl font-black text-transparent bg-gradient-to-r from-red-500 via-yellow-200 to-red-700 bg-clip-text mb-4 animate-pulse animate-shake">
              ELIMINATED
            </h1>
            <div className="text-red-200 text-2xl font-bold animate-fade-in-slow">
              {eliminationDetails ? `Eliminated by ${killer?.name || 'Unknown'}` : 'You have been eliminated'}
            </div>
          </div>
          {/* Elimination Stats */}
          <div className="grid grid-cols-3 gap-6 mb-8 animate-pop-in">
            <div className="bg-black/60 p-6 rounded-lg border border-red-500/40 shadow-lg animate-fade-in-slow">
              <Target className="w-10 h-10 text-red-400 mx-auto mb-2 animate-bounce" />
              <div className="text-3xl font-bold text-red-400 animate-pulse">{place}</div>
              <div className="text-base text-red-300">PLACE</div>
            </div>
            <div className="bg-black/60 p-6 rounded-lg border border-red-500/40 shadow-lg animate-fade-in-slow">
              <Clock className="w-10 h-10 text-red-400 mx-auto mb-2 animate-bounce" />
              <div className="text-3xl font-bold text-red-400 animate-pulse">
                {survivalTime}m {survivalSeconds}s
              </div>
              <div className="text-base text-red-300">SURVIVAL TIME</div>
            </div>
            <div className="bg-black/60 p-6 rounded-lg border border-red-500/40 shadow-lg animate-fade-in-slow">
              <TrendingUp className="w-10 h-10 text-red-400 mx-auto mb-2 animate-bounce" />
              <div className="text-3xl font-bold text-red-400 animate-pulse">
                {kills}
              </div>
              <div className="text-base text-red-300">ELIMINATIONS</div>
            </div>
          </div>
          <div className="text-2xl font-bold text-red-200 mt-4 animate-fade-in-slow">
            Consolation Reward: <span className="text-3xl"><CountUp end={totalConsolation} duration={1.5} separator="," /></span> GORB
          </div>
          <div className="grid grid-cols-3 gap-4 text-lg mt-2 animate-pop-in">
            <div className="text-red-300 animate-pop-in" style={{ animationDelay: '0.1s' }}>
              Base: <CountUp end={baseConsolation} duration={1.2} />
            </div>
            <div className="text-red-300 animate-pop-in" style={{ animationDelay: '0.3s' }}>
              Kill Bonus: +<CountUp end={killBonus} duration={1.2} />
            </div>
            <div className="text-red-300 animate-pop-in" style={{ animationDelay: '0.5s' }}>
              Survival: +<CountUp end={survivalBonus} duration={1.2} />
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex justify-center gap-6 mt-8 animate-fade-in-slow">
            <Button
              size="lg"
              className="bg-red-500 text-white hover:bg-red-600 font-bold px-10 py-3 text-xl animate-pop-in"
              onClick={handleRematch}
            >
              <RotateCcw className="w-6 h-6 mr-2" />
              REMATCH
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20 font-bold px-10 py-3 text-xl animate-pop-in"
              onClick={handleSpectate}
            >
              <Eye className="w-6 h-6 mr-2" />
              SPECTATE
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-gray-500/50 text-gray-400 hover:bg-gray-500/20 font-bold px-10 py-3 text-xl animate-pop-in"
              onClick={() => setGameState('lobby')}
            >
              <Play className="w-6 h-6 mr-2" />
              LOBBY
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-6">
          {/* Spectator Betting */}
          <Card className="bg-black/60 border-purple-500/30 p-6">
            <h3 className="text-purple-400 font-bold text-xl mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              SPECTATOR BETTING
            </h3>
            <div className="space-y-4">
              <div className="bg-gray-900/50 p-4 rounded-lg">
                <h4 className="text-purple-300 font-semibold mb-3">Place Your Bets</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-gray-300 text-sm">Select Player:</label>
                    <select
                      value={selectedPlayer}
                      onChange={(e) => setSelectedPlayer(e.target.value)}
                      className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600 mt-1"
                    >
                      <option value="">Choose a player...</option>
                      {alivePlayers.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name} (Health: {player.health}%)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm">Bet Amount (GORB):</label>
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(Number(e.target.value))}
                      min="1"
                      max={gorbBalance}
                      className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600 mt-1"
                    />
                  </div>
                  <Button
                    className="w-full bg-purple-500 hover:bg-purple-600"
                    onClick={handlePlaceBet}
                    disabled={!selectedPlayer || betAmount <= 0 || betAmount > gorbBalance || isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Coins className="w-4 h-4 mr-2" />
                    )}
                    PLACE BET
                  </Button>
                </div>
              </div>

              {/* Betting History */}
              {betsPlaced.length > 0 && (
                <div className="bg-gray-900/50 p-4 rounded-lg">
                  <h4 className="text-purple-300 font-semibold mb-3">Your Bets</h4>
                  <div className="space-y-2">
                    {betsPlaced.map((bet, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="text-gray-300">
                          {currentMatch.players.find(p => p.id === bet.playerId)?.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-gold-400">{bet.amount} GORB</span>
                          <Badge className="bg-purple-500/20 text-purple-400">
                            {bet.odds.toFixed(1)}x
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Performance Analysis */}
          <Card className="bg-black/60 border-blue-500/30 p-6">
            <h3 className="text-blue-400 font-bold text-xl mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              PERFORMANCE ANALYSIS
            </h3>
            <div className="space-y-4">
              <div className="bg-gray-900/50 p-4 rounded-lg">
                <h4 className="text-blue-300 font-semibold mb-3">Match Statistics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Final Health:</span>
                    <span className="text-white">{currentPlayer.health}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Shields Remaining:</span>
                    <span className="text-white">{currentPlayer.shields}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Damage Dealt:</span>
                    <span className="text-white">{Math.floor(Math.random() * 500) + 200}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Distance Traveled:</span>
                    <span className="text-white">{Math.floor(Math.random() * 1000) + 500}m</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/50 p-4 rounded-lg">
                <h4 className="text-blue-300 font-semibold mb-3">Improvement Tips</h4>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Stay closer to the center to avoid arena shrinking</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Purchase shield upgrades early in the match</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Use cover and avoid open areas</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Focus on survival over aggressive play</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Remaining Players */}
        <Card className="bg-black/60 border-green-500/30 p-6 mt-6">
          <h3 className="text-green-400 font-bold text-xl mb-4">REMAINING PLAYERS</h3>
          <div className="grid grid-cols-4 gap-4">
            {alivePlayers.map((player) => (
              <div
                key={player.id}
                className="bg-gray-900/50 p-4 rounded-lg border border-green-500/30"
              >
                <div className="text-center">
                  <div className="text-green-400 font-bold mb-2">{player.name}</div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-300">Alive</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Health: {player.health}% | Kills: {player.eliminations}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <span className="text-red-400">{error}</span>
          </div>
        )}
      </div>
    </div>
  )
} 