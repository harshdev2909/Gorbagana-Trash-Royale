"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useWalletContext } from './WalletContext'
import { gameWS } from "@/lib/game-ws"

export type GameState = 'lobby' | 'matchmaking' | 'battle' | 'victory' | 'defeat' | 'spectator' | 'tournament'

export interface Player {
  id: string
  name: string
  publicKey: string
  health: number
  shields: number
  position: { x: number; y: number }
  eliminations: number
  isAlive: boolean
  avatar: string
  level: number
  xp: number
}

export interface MatchData {
  id: string
  players: Player[]
  arenaSize: number
  currentPhase: 'waiting' | 'battle' | 'shrinking' | 'final'
  timeRemaining: number
  totalPlayers: number
  alivePlayers: number
  killFeed: Array<{
    killer: string
    victim: string
    timestamp: number
  }>
  upgrades: Array<{
    id: string
    name: string
    cost: number
    description: string
  }>
}

export interface TournamentData {
  id: string
  name: string
  entryFee: number
  prizePool: number
  players: Player[]
  brackets: Array<{
    round: number
    matches: Array<{
      id: string
      player1: string
      player2: string
      winner: string | null
    }>
  }>
  startTime: number
  status: 'registration' | 'active' | 'completed'
}

export interface SpectatorData {
  viewerCount: number
  bets: Array<{
    playerId: string
    amount: number
    odds: number
  }>
  chat: Array<{
    id: string
    user: string
    message: string
    timestamp: number
  }>
}

interface GameContextType {
  // Game State
  gameState: GameState
  setGameState: (state: GameState) => void
  
  // Player Data
  currentPlayer: Player | null
  setCurrentPlayer: (player: Player | null) => void
  
  // Match Data
  currentMatch: MatchData | null
  setCurrentMatch: (match: MatchData | null) => void
  
  // Tournament Data
  currentTournament: TournamentData | null
  setCurrentTournament: (tournament: TournamentData | null) => void
  
  // Spectator Data
  spectatorData: SpectatorData | null
  setSpectatorData: (data: SpectatorData | null) => void
  
  // Game Actions
  joinMatch: (entryFee: number) => Promise<void>
  leaveMatch: () => void
  buyUpgrade: (upgradeId: string, cost: number) => Promise<void>
  joinTournament: (tournamentId: string, entryFee: number) => Promise<void>
  placeBet: (playerId: string, amount: number) => Promise<void>
  claimRewards: () => Promise<void>
  
  // Matchmaking
  isMatchmaking: boolean
  matchmakingProgress: number
  startMatchmaking: () => void
  cancelMatchmaking: () => void
  
  // Real-time Updates
  updatePlayerHealth: (playerId: string, health: number) => void
  updatePlayerPosition: (playerId: string, position: { x: number; y: number }) => void
  eliminatePlayer: (playerId: string, killerId: string) => void
  updateArenaSize: (size: number) => void
  
  // Loading States
  isLoading: boolean
  error: string | null
  
  // New function
  startSinglePlayerMatch: () => Promise<void>
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function useGameContext() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider')
  }
  return context
}

// Avatar options for mock players (move to module scope)
const avatarOptions = [
  "Garbage Bot",
  "Junk Warrior",
  "Scrap Knight",
  "Trash Titan"
];

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { connected, publicKey, gorbBalance, sendTransaction, refreshBalance } = useWalletContext()
  
  // Game State
  const [gameState, setGameState] = useState<GameState>('lobby')
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [currentMatch, setCurrentMatch] = useState<MatchData | null>(null)
  const [currentTournament, setCurrentTournament] = useState<TournamentData | null>(null)
  const [spectatorData, setSpectatorData] = useState<SpectatorData | null>(null)
  
  // Matchmaking
  const [isMatchmaking, setIsMatchmaking] = useState(false)
  const [matchmakingProgress, setMatchmakingProgress] = useState(0)
  
  // Loading States
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize current player when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      const player: Player = {
        id: publicKey.toString(),
        name: `Player_${publicKey.toString().slice(0, 8)}`,
        publicKey: publicKey.toString(),
        health: 100,
        shields: 50,
        position: {
          x: 500,
          y: 500
        },
        eliminations: 0,
        isAlive: true,
        avatar: avatarOptions[0], // Always give the real player the first avatar
        level: 1,
        xp: 0
      }
      setCurrentPlayer(player)
    } else {
      setCurrentPlayer(null)
    }
  }, [connected, publicKey])

  // Real-time player list sync for lobbies
  useEffect(() => {
    // Prevent multiplayer WebSocket from running in single player mode
    if (currentMatch && currentMatch.id && currentMatch.id.startsWith('single_')) return;
    const WS_URL = 'wss://trash-royale.onrender.com';
    gameWS.connect(WS_URL);
    function handleLobbyPlayers(players: any) {
      setCurrentMatch(prev => prev ? { ...prev, players } : prev)
    }
    gameWS.on('lobbyPlayers', handleLobbyPlayers)
    return () => {
      gameWS.off('lobbyPlayers', handleLobbyPlayers)
      gameWS.close();
    }
  }, [currentMatch])

  // Matchmaking simulation
  const startMatchmaking = useCallback(() => {
    setIsMatchmaking(true)
    setMatchmakingProgress(0)
    setGameState('matchmaking')
    
    const interval = setInterval(() => {
      setMatchmakingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsMatchmaking(false)
          // Simulate finding a match
          const mockMatch: MatchData = {
            id: `match_${Date.now()}`,
            players: currentPlayer ? [currentPlayer, ...generateMockPlayers(7)] : [],
            arenaSize: 1000,
            currentPhase: 'waiting',
            timeRemaining: 300,
            totalPlayers: 8,
            alivePlayers: 8,
            killFeed: [],
            upgrades: [
              { id: 'shield', name: 'Shield Boost', cost: 50, description: '+25 shields' },
              { id: 'health', name: 'Health Pack', cost: 75, description: '+50 health' },
              { id: 'speed', name: 'Speed Boost', cost: 100, description: '+20% movement' },
              { id: 'damage', name: 'Damage Boost', cost: 150, description: '+30% damage' }
            ]
          }
          setCurrentMatch(mockMatch)
          setGameState('battle')
          return 100
        }
        return prev + Math.random() * 20
      })
    }, 500)
  }, [currentPlayer])

  const cancelMatchmaking = useCallback(() => {
    setIsMatchmaking(false)
    setMatchmakingProgress(0)
    setGameState('lobby')
  }, [])

  const joinMatch = useCallback(async (entryFee: number) => {
    if (!connected || !publicKey) {
      setError('Wallet not connected')
      return
    }

    if (gorbBalance < entryFee) {
      setError('Insufficient GORB balance')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      startMatchmaking()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join match')
    } finally {
      setIsLoading(false)
    }
  }, [connected, publicKey, gorbBalance, startMatchmaking])

  const leaveMatch = useCallback(() => {
    setCurrentMatch(null)
    setGameState('lobby')
  }, [])

  const buyUpgrade = useCallback(async (upgradeId: string, cost: number) => {
    if (!currentMatch || !currentPlayer) return

    if (gorbBalance < cost) {
      setError('Insufficient GORB balance')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 1000))
      // Apply upgrade effect
      const updatedPlayer = { ...currentPlayer }
      switch (upgradeId) {
        case 'shield':
          updatedPlayer.shields = Math.min(100, updatedPlayer.shields + 25)
          break
        case 'health':
          updatedPlayer.health = Math.min(100, updatedPlayer.health + 50)
          break
        case 'speed':
          // Speed boost would be applied during movement
          break
        case 'damage':
          // Damage boost would be applied during combat
          break
      }
      setCurrentPlayer(updatedPlayer)
      // Refresh GORB balance after upgrade
      await refreshBalance()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to buy upgrade')
    } finally {
      setIsLoading(false)
    }
  }, [currentMatch, currentPlayer, gorbBalance, refreshBalance])

  const joinTournament = useCallback(async (tournamentId: string, entryFee: number) => {
    if (!connected || !publicKey) {
      setError('Wallet not connected')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      // Simulate tournament registration
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockTournament: TournamentData = {
        id: tournamentId,
        name: 'Weekly Championship',
        entryFee,
        prizePool: entryFee * 32, // 32 players
        players: currentPlayer ? [currentPlayer, ...generateMockPlayers(31)] : [],
        brackets: [],
        startTime: Date.now() + 3600000, // 1 hour from now
        status: 'registration'
      }
      
      setCurrentTournament(mockTournament)
      setGameState('tournament')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join tournament')
    } finally {
      setIsLoading(false)
    }
  }, [connected, publicKey, currentPlayer])

  const placeBet = useCallback(async (playerId: string, amount: number) => {
    if (!connected || !publicKey) {
      setError('Wallet not connected')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      // Simulate betting transaction
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update spectator data
      if (spectatorData) {
        const newBet = {
          playerId,
          amount,
          odds: Math.random() * 3 + 1 // Random odds between 1-4
        }
        setSpectatorData({
          ...spectatorData,
          bets: [...spectatorData.bets, newBet]
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bet')
    } finally {
      setIsLoading(false)
    }
  }, [connected, publicKey, spectatorData])

  const claimRewards = useCallback(async () => {
    if (!connected || !publicKey) {
      setError('Wallet not connected')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      // Simulate reward claiming
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Reset game state
      setCurrentMatch(null)
      setGameState('lobby')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim rewards')
    } finally {
      setIsLoading(false)
    }
  }, [connected, publicKey])

  // Real-time update functions
  const updatePlayerHealth = useCallback((playerId: string, health: number) => {
    if (currentMatch) {
      const updatedPlayers = currentMatch.players.map(player =>
        player.id === playerId ? { ...player, health } : player
      )
      setCurrentMatch({ ...currentMatch, players: updatedPlayers })
    }
  }, [currentMatch])

  const updatePlayerPosition = useCallback((playerId: string, position: { x: number; y: number }) => {
    if (currentMatch) {
      const updatedPlayers = currentMatch.players.map(player =>
        player.id === playerId ? { ...player, position } : player
      )
      setCurrentMatch({ ...currentMatch, players: updatedPlayers })
    }
    // Also update currentPlayer if it's the same player
    if (currentPlayer && currentPlayer.id === playerId) {
      setCurrentPlayer({ ...currentPlayer, position })
    }
  }, [currentMatch, currentPlayer])

  const eliminatePlayer = useCallback((playerId: string, killerId: string) => {
    if (currentMatch) {
      const updatedPlayers = currentMatch.players.map(player =>
        player.id === playerId ? { ...player, isAlive: false } : player
      )
      
      const updatedKillFeed = [
        ...currentMatch.killFeed,
        { killer: killerId, victim: playerId, timestamp: Date.now() }
      ]
      
      setCurrentMatch({
        ...currentMatch,
        players: updatedPlayers,
        killFeed: updatedKillFeed,
        alivePlayers: currentMatch.alivePlayers - 1
      })
    }
  }, [currentMatch])

  const updateArenaSize = useCallback((size: number) => {
    if (currentMatch) {
      setCurrentMatch({ ...currentMatch, arenaSize: size })
    }
  }, [currentMatch])

  const startSinglePlayerMatch = useCallback(async () => {
    if (!currentPlayer) return;
    setIsLoading(true);
    setError(null);
    try {
      // Create a match with 1 player and 7 bots
      const bots = generateMockPlayers(7);
      const match: MatchData = {
        id: `single_${Date.now()}`,
        players: [currentPlayer, ...bots],
        arenaSize: 1000,
        currentPhase: 'battle',
        timeRemaining: 300,
        totalPlayers: 8,
        alivePlayers: 8,
        killFeed: [],
        upgrades: [
          { id: 'shield', name: 'Shield Boost', cost: 50, description: '+25 shields' },
          { id: 'health', name: 'Health Pack', cost: 75, description: '+50 health' },
          { id: 'speed', name: 'Speed Boost', cost: 100, description: '+20% movement' },
          { id: 'damage', name: 'Damage Boost', cost: 150, description: '+30% damage' }
        ]
      };
      setCurrentMatch(match);
      setGameState('battle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start single player match');
    } finally {
      setIsLoading(false);
    }
  }, [currentPlayer]);

  const value: GameContextType = {
    gameState,
    setGameState,
    currentPlayer,
    setCurrentPlayer,
    currentMatch,
    setCurrentMatch,
    currentTournament,
    setCurrentTournament,
    spectatorData,
    setSpectatorData,
    joinMatch,
    leaveMatch,
    buyUpgrade,
    joinTournament,
    placeBet,
    claimRewards,
    isMatchmaking,
    matchmakingProgress,
    startMatchmaking,
    cancelMatchmaking,
    updatePlayerHealth,
    updatePlayerPosition,
    eliminatePlayer,
    updateArenaSize,
    isLoading,
    error,
    startSinglePlayerMatch
  }

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  )
}

// Helper function to generate mock players
function generateMockPlayers(count: number): Player[] {
  const names = ['TrashMaster', 'GorbKing', 'JunkLord', 'ScrapGod', 'WasteWarrior', 'RubbishRuler', 'DebrisDuke', 'LitterLord']
  return Array.from({ length: count }, (_, i) => {
    // Spread players in a circle
    const angle = (2 * Math.PI * i) / count;
    const radius = 350; // distance from center
    const centerX = 500;
    const centerY = 500;
    const x = Math.round(centerX + radius * Math.cos(angle));
    const y = Math.round(centerY + radius * Math.sin(angle));
    return {
      id: `player_${i}`,
      name: names[i % names.length],
      publicKey: `mock_public_key_${i}`,
      health: 100,
      shields: 50,
      position: { x, y },
      eliminations: 0,
      isAlive: true,
      avatar: avatarOptions[i % avatarOptions.length],
      level: Math.floor(Math.random() * 10) + 1,
      xp: Math.floor(Math.random() * 1000)
    };
  })
} 