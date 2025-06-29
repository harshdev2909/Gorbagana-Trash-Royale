"use client"

import { Button } from "@/components/ui/button"
import { useGameContext } from "@/contexts/GameContext"
import { useWalletContext } from "@/contexts/WalletContext"
import { Home, Users, Trophy, Eye, Settings, Wallet } from "lucide-react"

export function Navigation() {
  const { gameState, setGameState } = useGameContext()
  const { connected, gorbBalance, solBalance } = useWalletContext()
  const SOL_TO_GORB_RATE = 2704.877024
  const gorbEquivalent = solBalance * SOL_TO_GORB_RATE

  const navItems = [
    { id: 'lobby', label: 'LOBBY', icon: Home },
    { id: 'tournament', label: 'TOURNAMENT', icon: Trophy },
    { id: 'spectator', label: 'SPECTATE', icon: Eye },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-green-500/30">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Navigation */}
          <div className="flex items-center gap-4">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant={gameState === item.id ? "default" : "ghost"}
                  className={`${
                    gameState === item.id 
                      ? "bg-green-500 text-black" 
                      : "text-green-400 hover:bg-green-500/20"
                  } font-bold`}
                  onClick={() => setGameState(item.id as any)}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              )
            })}
          </div>

          {/* Right side - Wallet info */}
          <div className="flex items-center gap-4">
            {connected && (
              <div className="flex items-center gap-2 bg-green-500/20 px-3 py-2 rounded-lg border border-green-500/50">
                <Wallet className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-bold">{gorbBalance.toLocaleString()} GORB</span>
                <span className="text-blue-400 font-bold ml-2">{solBalance.toFixed(4)} SOL</span>
                <span className="text-gold-400 font-bold ml-2">≈ {gorbEquivalent.toLocaleString(undefined, { maximumFractionDigits: 4 })} GORB</span>
              </div>
            )}
            
            <Button variant="outline" className="border-purple-500/50 text-purple-400">
              <Settings className="w-4 h-4 mr-2" />
              SETTINGS
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
} 