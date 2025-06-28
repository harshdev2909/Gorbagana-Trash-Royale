import { io, Socket } from 'socket.io-client'

export interface GameEvent {
  type: string
  data: any
  timestamp: number
}

export interface PlayerUpdate {
  playerId: string
  health?: number
  shields?: number
  position?: { x: number; y: number }
  eliminations?: number
  isAlive?: boolean
}

export interface MatchEvent {
  matchId: string
  event: GameEvent
}

class GameSocket {
  private socket: Socket | null = null
  private isConnected = false
  private eventListeners: Map<string, Function[]> = new Map()

  connect(playerId: string, matchId?: string) {
    if (this.socket) {
      this.disconnect()
    }

    // Connect to mock server (in production, this would be your actual server)
    this.socket = io('http://localhost:3001', {
      auth: {
        playerId,
        matchId
      }
    })

    this.socket.on('connect', () => {
      console.log('Connected to game server')
      this.isConnected = true
      this.emit('player-connected', { playerId, matchId })
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from game server')
      this.isConnected = false
    })

    this.socket.on('match-started', (data) => {
      this.emit('match-started', data)
    })

    this.socket.on('player-updated', (data: PlayerUpdate) => {
      this.emit('player-updated', data)
    })

    this.socket.on('player-eliminated', (data: { playerId: string; killerId: string }) => {
      this.emit('player-eliminated', data)
    })

    this.socket.on('arena-shrinking', (data: { newSize: number; timeRemaining: number }) => {
      this.emit('arena-shrinking', data)
    })

    this.socket.on('upgrade-purchased', (data: { playerId: string; upgradeId: string }) => {
      this.emit('upgrade-purchased', data)
    })

    this.socket.on('match-ended', (data: { winnerId: string; rewards: any }) => {
      this.emit('match-ended', data)
    })

    this.socket.on('spectator-bet', (data: { playerId: string; amount: number; odds: number }) => {
      this.emit('spectator-bet', data)
    })

    this.socket.on('chat-message', (data: { playerId: string; message: string }) => {
      this.emit('chat-message', data)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  emit(event: string, data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data)
    }
  }

  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  off(event: string, callback?: Function) {
    if (!callback) {
      this.eventListeners.delete(event)
    } else {
      const listeners = this.eventListeners.get(event)
      if (listeners) {
        const index = listeners.indexOf(callback)
        if (index > -1) {
          listeners.splice(index, 1)
        }
      }
    }
  }

  // Game-specific methods
  joinMatch(matchId: string, playerId: string) {
    this.emit('join-match', { matchId, playerId })
  }

  leaveMatch(matchId: string, playerId: string) {
    this.emit('leave-match', { matchId, playerId })
  }

  updatePlayerPosition(playerId: string, position: { x: number; y: number }) {
    this.emit('update-position', { playerId, position })
  }

  attackPlayer(attackerId: string, targetId: string, damage: number) {
    this.emit('attack-player', { attackerId, targetId, damage })
  }

  buyUpgrade(playerId: string, upgradeId: string, cost: number) {
    this.emit('buy-upgrade', { playerId, upgradeId, cost })
  }

  sendChatMessage(playerId: string, message: string) {
    this.emit('chat-message', { playerId, message })
  }

  placeBet(spectatorId: string, playerId: string, amount: number) {
    this.emit('place-bet', { spectatorId, playerId, amount })
  }

  joinTournament(tournamentId: string, playerId: string, entryFee: number) {
    this.emit('join-tournament', { tournamentId, playerId, entryFee })
  }

  getConnectionStatus() {
    return this.isConnected
  }
}

// Create singleton instance
export const gameSocket = new GameSocket()

// Mock server for development (remove in production)
export function startMockServer() {
  console.log('Starting mock game server...')
  
  // Simulate server events
  setInterval(() => {
    if (gameSocket.getConnectionStatus()) {
      // Simulate random game events
      const events = [
        'player-updated',
        'arena-shrinking',
        'chat-message'
      ]
      
      const randomEvent = events[Math.floor(Math.random() * events.length)]
      
      switch (randomEvent) {
        case 'player-updated':
          gameSocket.emit('player-updated', {
            playerId: `player_${Math.floor(Math.random() * 8)}`,
            health: Math.floor(Math.random() * 100),
            position: { x: Math.random() * 1000, y: Math.random() * 1000 }
          })
          break
        case 'arena-shrinking':
          gameSocket.emit('arena-shrinking', {
            newSize: Math.floor(Math.random() * 500) + 500,
            timeRemaining: Math.floor(Math.random() * 60)
          })
          break
        case 'chat-message':
          gameSocket.emit('chat-message', {
            playerId: `player_${Math.floor(Math.random() * 8)}`,
            message: 'Trash talk! 🗑️'
          })
          break
      }
    }
  }, 5000)
} 