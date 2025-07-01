"use client"

import { BattleArena } from "@/components/battle-arena"
import { GameLobby } from "@/components/game-lobby"
import { VictoryScreen } from "@/components/victory-screen"
import { DefeatScreen } from "@/components/defeat-screen"
import { SpectatorMode } from "@/components/spectator-mode"
import { TournamentHub } from "@/components/tournament-hub"
import { Navigation } from "@/components/navigation"
import { useGameContext } from "@/contexts/GameContext"
import SolDemo from '../components/sol-demo'

export default function TrashRoyale() {
  const { gameState, setGameState } = useGameContext()

  const renderGameState = () => {
    switch (gameState) {
      case "lobby":
        return <GameLobby />
      case "battle":
        return <BattleArena />
      case "victory":
        return <VictoryScreen />
      case "defeat":
        return <DefeatScreen />
      case "spectator":
        return <SpectatorMode />
      case "tournament":
        return <TournamentHub />
      default:
        return <GameLobby />
    }
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Cyberpunk Background - lowest layer */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-green-900/20 z-0" />

      {/* Subtle dot-grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30 z-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      {/* Particle Effects */}
      <div className="fixed inset-0 pointer-events-none z-10">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-green-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main content with proper z-index */}
      <div className="relative z-20">
        <Navigation />
        {renderGameState()}
        {/* <SolDemo /> */}
      </div>
    </div>
  )
}
