"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Eye, Coins, MessageCircle, Users, Map, Loader2, Play } from "lucide-react"
import { useGameContext } from "@/contexts/GameContext"
import { useWalletContext } from "@/contexts/WalletContext"
import { useState, useEffect } from "react"

export function SpectatorMode() {
  const { 
    currentMatch, 
    setGameState, 
    placeBet,
    isLoading,
    error
  } = useGameContext()
  
  const { gorbBalance } = useWalletContext()
  
  const [betAmount, setBetAmount] = useState(10)
  const [selectedPlayer, setSelectedPlayer] = useState<string>("")
  const [chatMessages, setChatMessages] = useState<Array<{id: string, user: string, message: string}>>([])
  const [newChatMessage, setNewChatMessage] = useState("")
  const [viewerCount, setViewerCount] = useState(247)
  const [betsPlaced, setBetsPlaced] = useState<Array<{playerId: string, amount: number, odds: number}>>([])

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount(prev => prev + Math.floor(Math.random() * 10) - 5)
      
      // Simulate chat messages
      if (Math.random() > 0.7) {
        const messages = [
          "This is intense! 🔥",
          "Go TrashKing! 🗑️",
          "Amazing play! 👏",
          "The arena is shrinking fast! ⚡",
          "Who will win? 🤔",
          "Epic battle! ⚔️"
        ]
        const randomMessage = messages[Math.floor(Math.random() * messages.length)]
        const users = ["Spectator1", "Fan2", "Viewer3", "TrashFan", "GorbLover"]
        const randomUser = users[Math.floor(Math.random() * users.length)]
        
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          user: randomUser,
          message: randomMessage
        }])
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [])

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

  const handleSendChat = () => {
    if (newChatMessage.trim()) {
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        user: "You",
        message: newChatMessage
      }])
      setNewChatMessage("")
    }
  }

  const handleJoinMatch = () => {
    setGameState('lobby')
  }

  if (!currentMatch) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">No active matches to spectate</div>
      </div>
    )
  }

  const alivePlayers = currentMatch.players.filter(p => p.isAlive)

  return (
    <div className="min-h-screen p-4 pt-20 relative z-10">
      {/* Top HUD */}
      <div className="fixed top-20 left-0 right-0 z-40 px-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-black/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-purple-500/50 shadow-lg">
              <Eye className="w-5 h-5 text-purple-400" />
              <span className="text-purple-400 font-bold">{viewerCount} SPECTATORS</span>
            </div>
            <div className="flex items-center gap-2 bg-black/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-gold-500/50 shadow-lg">
              <Coins className="w-5 h-5 text-gold-400" />
              <span className="text-gold-400 font-bold">{gorbBalance.toLocaleString()} GORB</span>
            </div>
          </div>

          <Button
            className="bg-green-500 hover:bg-green-600 text-black font-bold"
            onClick={handleJoinMatch}
          >
            <Play className="w-4 h-4 mr-2" />
            JOIN MATCH
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 max-w-7xl mx-auto mt-16">
        {/* Left Sidebar - Player List */}
        <div className="col-span-2">
          <Card className="bg-black/80 border-purple-500/30 p-4 h-96">
            <h3 className="text-purple-400 font-bold mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              PLAYERS ({alivePlayers.length})
            </h3>
            <div className="space-y-2">
              {currentMatch.players.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all ${
                    player.isAlive 
                      ? "bg-gray-900/50 hover:bg-purple-500/20" 
                      : "bg-red-500/20 border border-red-500/50"
                  }`}
                  onClick={() => setSelectedPlayer(player.id)}
                >
                  <div className={`w-3 h-3 rounded-full ${player.isAlive ? "bg-green-500" : "bg-red-500"}`} />
                  <span className={`text-sm ${player.isAlive ? "text-white" : "text-gray-500 line-through"}`}>
                    {player.name}
                  </span>
                  {player.isAlive && (
                    <div className="ml-auto text-xs text-gray-400">
                      {player.health}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Center - Battle Arena */}
        <div className="col-span-8">
          <Card className="bg-black/60 border-purple-500/30 p-4 h-96 relative overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(128,0,128,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(128,0,128,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />

            {/* Danger Zone */}
            <div className="absolute inset-4 border-4 border-red-500 rounded-full animate-pulse opacity-50" />
            <div className="absolute inset-8 border-2 border-red-400 rounded-full animate-ping opacity-30" />

            {/* Player Positions */}
            {currentMatch.players.map((player) => (
              <div
                key={player.id}
                className={`absolute w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
                  player.isAlive ? "bg-blue-500" : "bg-red-500"
                } ${selectedPlayer === player.id ? "ring-2 ring-purple-400 animate-pulse" : ""}`}
                style={{ 
                  left: `${(player.position.x / 1000) * 100}%`, 
                  top: `${(player.position.y / 1000) * 100}%` 
                }}
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-blue-400">
                  {player.name}
                </div>
              </div>
            ))}

            {/* Battle Effects */}
            <div className="absolute top-1/4 right-1/4 w-8 h-8 bg-orange-500 rounded-full animate-ping opacity-75" />
            <div className="absolute bottom-1/3 left-1/3 w-6 h-6 bg-red-500 rounded-full animate-pulse opacity-60" />
          </Card>
        </div>

        {/* Right Sidebar - Betting & Chat */}
        <div className="col-span-2 space-y-4">
          {/* Betting Panel */}
          <Card className="bg-black/80 border-gold-500/30 p-4">
            <h3 className="text-gold-400 font-bold mb-4 flex items-center gap-2">
              <Coins className="w-4 h-4" />
              PLACE BETS
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-gray-300 text-sm">Select Player:</label>
                <select
                  value={selectedPlayer}
                  onChange={(e) => setSelectedPlayer(e.target.value)}
                  className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600 mt-1 text-xs"
                >
                  <option value="">Choose a player...</option>
                  {alivePlayers.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({player.health}%)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-300 text-sm">Bet Amount:</label>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  min="1"
                  max={gorbBalance}
                  className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600 mt-1 text-xs"
                />
              </div>
              <Button
                size="sm"
                className="w-full bg-gold-500 hover:bg-gold-600 text-black"
                onClick={handlePlaceBet}
                disabled={!selectedPlayer || betAmount <= 0 || betAmount > gorbBalance || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <Coins className="w-3 h-3 mr-1" />
                )}
                BET
              </Button>
            </div>
          </Card>

          {/* Chat Panel */}
          <Card className="bg-black/80 border-blue-500/30 p-4">
            <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              CHAT
            </h3>
            <div className="h-32 overflow-y-auto mb-2 space-y-1 text-xs">
              {chatMessages.slice(-10).map((msg) => (
                <div key={msg.id} className="text-gray-300">
                  <span className="text-blue-400">{msg.user}:</span> {msg.message}
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              <input
                type="text"
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="Type message..."
                className="flex-1 bg-gray-800 text-white px-2 py-1 rounded text-xs"
              />
              <Button size="sm" onClick={handleSendChat} className="bg-blue-500 hover:bg-blue-600 text-xs">
                Send
              </Button>
            </div>
          </Card>

          {/* Mini-map */}
          <Card className="bg-black/80 border-green-500/30 p-4">
            <h3 className="text-green-400 font-bold mb-2 flex items-center gap-2">
              <Map className="w-4 h-4" />
              MINI-MAP
            </h3>
            <div className="w-full h-24 bg-gray-900 rounded border border-green-500/30 relative">
              {currentMatch.players.map((player) => (
                <div
                  key={player.id}
                  className={`absolute w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
                    player.isAlive ? "bg-blue-500" : "bg-red-500"
                  }`}
                  style={{ 
                    left: `${(player.position.x / 1000) * 100}%`, 
                    top: `${(player.position.y / 1000) * 100}%` 
                  }}
                />
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Panel - Betting History */}
      <div className="fixed bottom-4 left-0 right-0 px-6">
        <Card className="bg-black/90 border-purple-500/30 p-4 max-w-7xl mx-auto">
          <h3 className="text-purple-400 font-bold mb-4">YOUR BETS</h3>
          <div className="grid grid-cols-6 gap-4">
            {betsPlaced.map((bet, i) => (
              <div
                key={i}
                className="bg-gray-900/50 p-3 rounded border border-purple-500/30 text-center"
              >
                <div className="text-purple-400 font-bold mb-1">
                  {currentMatch.players.find(p => p.id === bet.playerId)?.name}
                </div>
                <div className="text-sm text-gray-300 mb-1">{bet.amount} GORB</div>
                <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                  {bet.odds.toFixed(1)}x
                </Badge>
              </div>
            ))}
            {betsPlaced.length === 0 && (
              <div className="col-span-6 text-center text-gray-500 py-8">
                No bets placed yet. Place your first bet to get started!
              </div>
            )}
          </div>
        </Card>
      </div>

      {error && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500/90 p-4 rounded-lg border border-red-500">
          <span className="text-white">{error}</span>
        </div>
      )}
    </div>
  )
} 