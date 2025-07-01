"use client"

import { useState } from "react"
import { useGameContext } from "@/contexts/GameContext"
import { useRouter } from "next/navigation"
import { useWalletContext } from "@/contexts/WalletContext"
import { PublicKey } from "@solana/web3.js"

const TREASURY_ADDRESS = '6ncxVhwUppRj3x99WY3GNUyqYjALjo7aZUVogUGyKhEQ'
const PRIVATE_ROOM_FEE_SOL = 0.01

export default function PrivateRoom() {
  const { setCurrentMatch, setCurrentPlayer, currentPlayer } = useGameContext()
  const [roomCode, setRoomCode] = useState("")
  const [createdRoom, setCreatedRoom] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState("")
  const [status, setStatus] = useState("")
  const router = useRouter()
  const { sendTransaction, connected } = useWalletContext()

  // Helper to get player object (customize as needed)
  const getPlayer = () => {
    if (!currentPlayer) return null
    return {
      id: currentPlayer.id,
      name: currentPlayer.name,
      avatar: currentPlayer.avatar,
    }
  }

  // Create a private room
  const handleCreateRoom = async () => {
    setStatus("Creating room...")
    if (!currentPlayer) {
      setStatus("Please connect your wallet or profile first.")
      return
    }
    if (!connected) {
      setStatus("Please connect your wallet first.")
      return
    }
    try {
      setStatus("Processing room creation fee...")
      // Send SOL fee to treasury
      const signature = await sendTransaction(new PublicKey(TREASURY_ADDRESS), PRIVATE_ROOM_FEE_SOL)
      setStatus(`Fee paid! Tx: ${signature.slice(0, 8)}...${signature.slice(-8)}. Creating room...`)
      // Proceed to create the room
      const player = {
        id: currentPlayer.id,
        name: currentPlayer.name,
        avatar: currentPlayer.avatar,
      }
      const res = await fetch("https://trash-royale.onrender.com/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player }),
      })
      const data = await res.json()
      if (data.matchId) {
        setCreatedRoom(data.matchId)
        setStatus("Room created! Share this code: " + data.matchId)
        setCurrentMatch({
          id: data.matchId,
          players: [currentPlayer],
          arenaSize: 1000,
          currentPhase: "waiting",
          timeRemaining: 300,
          totalPlayers: 1,
          alivePlayers: 1,
          killFeed: [],
          upgrades: [],
        })
        router.push("/arena")
      } else {
        setStatus("Failed to create room.")
      }
    } catch (e: any) {
      setStatus(e.message || "Failed to pay fee or create room.")
    }
  }

  // Join a private room
  const handleJoinRoom = async () => {
    setStatus("Joining room...")
    if (!currentPlayer) {
      setStatus("Please connect your wallet or profile first.")
      return
    }
    const player = {
      id: currentPlayer.id,
      name: currentPlayer.name,
      avatar: currentPlayer.avatar,
    }
    const res = await fetch("https://trash-royale.onrender.com/join-room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: joinCode, player }),
    })
    const data = await res.json()
    if (data.success) {
      setStatus("Joined room: " + joinCode)
      setCurrentMatch({
        id: joinCode,
        players: data.players || [],
        arenaSize: data.arenaSize || 1000,
        currentPhase: data.currentPhase || "waiting",
        timeRemaining: data.timeRemaining || 300,
        totalPlayers: data.totalPlayers || 1,
        alivePlayers: data.alivePlayers || 1,
        killFeed: data.killFeed || [],
        upgrades: data.upgrades || [],
      })
      router.push("/arena")
    } else {
      setStatus(data.error || "Failed to join room.")
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-black/80 rounded-lg shadow-lg mt-8">
      <h2 className="text-xl font-bold text-white mb-4">Private Room</h2>
      <div className="mb-6">
        <button
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleCreateRoom}
        >
          Create Private Room
        </button>
        {createdRoom && (
          <div className="mt-2 text-green-400">
            Room Code: <span className="font-mono">{createdRoom}</span>
          </div>
        )}
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Enter Room Code"
          value={joinCode}
          onChange={e => setJoinCode(e.target.value.toUpperCase())}
          className="w-full px-3 py-2 rounded bg-gray-900 text-white border border-gray-700"
        />
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2 w-full"
          onClick={handleJoinRoom}
        >
          Join Room
        </button>
      </div>
      {status && <div className="text-yellow-400 mt-2">{status}</div>}
    </div>
  )
} 