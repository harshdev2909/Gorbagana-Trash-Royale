"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, Shield, Coins, Map, MessageCircle, Users, Skull, Zap, Sword, Eye, Loader2 } from "lucide-react"
import { useGameContext } from "@/contexts/GameContext"
import { useWalletContext } from "@/contexts/WalletContext"
import { gameWS } from "@/lib/game-ws"
import { PublicKey } from '@solana/web3.js'
import { useTransactionHistory } from '@/contexts/TransactionHistoryContext'
import { useToast } from '@/hooks/use-toast'

const TREASURY_ADDRESS = '6ncxVhwUppRj3x99WY3GNUyqYjALjo7aZUVogUGyKhEQ'
const UPGRADE_COST_SOL = 0.001

// Avatar mapping for arena
const avatarImages: Record<string, string> = {
  "Garbage Bot": "https://static.vecteezy.com/system/resources/previews/042/899/708/non_2x/chibi-character-man-woman-for-your-game-character-avatar-or-your-cover-book-free-png.png",
  "Junk Warrior": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnCKCtQ9BSDw_UFSa_TatlABjhhZB4byNmDw&s",
  "Scrap Knight": "https://cdn.imgbin.com/0/20/4/imgbin-guild-wars-2-guild-wars-eye-of-the-north-video-game-avatar-thorn-aYFEmf9EXgvwNyK15uju9LSBB.jpg",
  "Trash Titan": "https://img.favpng.com/0/16/21/balthazar-guild-wars-nightfall-guild-wars-2-art-character-png-favpng-WZtLFt4RLLxJLDwHsXnak31zE.jpg"
};

export function BattleArena() {
  const { 
    currentMatch, 
    currentPlayer, 
    setGameState, 
    buyUpgrade, 
    updatePlayerHealth, 
    updatePlayerPosition,
    eliminatePlayer,
    updateArenaSize,
    isLoading,
    error
  } = useGameContext()
  
  const { gorbBalance, sendTransaction, connected } = useWalletContext()
  const { addTransaction } = useTransactionHistory()
  const { toast } = useToast()
  
  const [shrinkTimer, setShrinkTimer] = useState(30)
  const [chatMessages, setChatMessages] = useState<Array<{id: string, player: string, message: string}>>([])
  const [newChatMessage, setNewChatMessage] = useState("")
  const [upgradeTxStatus, setUpgradeTxStatus] = useState<string | null>(null)
  const moveStep = 40; // Good speed for all players and bots, all modes
  const arenaMin = 0;
  const arenaMax = 1000;
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  const movementKeys = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "W", "A", "S", "D"]);
  const [boosted, setBoosted] = useState(false); // For upgrade effect
  const [buyingUpgradeId, setBuyingUpgradeId] = useState<string | null>(null); // Track which upgrade is being purchased
  const [timerFinished, setTimerFinished] = useState<string | null>(null);
  const shrinkTimerInitialized = useRef<string | null>(null);
  const [arenaShrinkCount, setArenaShrinkCount] = useState(0);
  const MIN_ARENA_SIZE = 200;
  const lastMatchId = useRef<string | null>(null);

  // Demo/mock players if needed
  const demoPlayers = useMemo(() => {
    const avatars = Object.keys(avatarImages)
    return Array.from({ length: 4 }).map((_, i) => ({
      id: `demo_${i}`,
      name: `DemoPlayer${i + 1}`,
      avatar: avatars[(i + 1) % avatars.length],
      position: { x: Math.floor(Math.random() * 1000), y: Math.floor(Math.random() * 1000) },
      health: Math.floor(Math.random() * 100) + 1,
      shields: Math.floor(Math.random() * 50),
      level: Math.floor(Math.random() * 5) + 1,
      isAlive: true,
    }))
  }, [])

  // Use demo players if the player list is empty or only contains the current user
  const playersToShow = useMemo(() => {
    let list = []
    // Detect private room: only one player in match
    const isPrivateRoom = currentMatch && currentMatch.players && currentMatch.players.length === 1;
    if (isPrivateRoom) {
      // Only show the current player in private arena
      list = [currentPlayer]
    } else if (!currentMatch || !currentMatch.players || currentMatch.players.length <= 1) {
      list = [currentPlayer, ...demoPlayers]
    } else {
      list = currentMatch.players
    }
    // Filter out null/undefined
    return list.filter((p) => !!p)
  }, [currentMatch, currentPlayer, demoPlayers])

  useEffect(() => {
    if (!currentMatch || !currentPlayer) return;
    // Only run multiplayer WebSocket logic for non-single-player matches
    if (currentMatch.id.startsWith('single_')) return;
    if (!currentMatch.players || currentMatch.players.length <= 1) return; // Only real matches
    const WS_URL = 'wss://trash-royale.onrender.com';
    gameWS.connect(WS_URL, () => {
      // Optionally send join event
      if (currentPlayer) gameWS.send("joinLobby", { playerId: currentPlayer.id, matchId: currentMatch.id });
    });

    const handlePlayerUpdated = (data: any) => {
      if (data.health !== undefined) {
        updatePlayerHealth(data.playerId, data.health)
      }
      if (data.position) {
        updatePlayerPosition(data.playerId, data.position)
      }
    };
    const handlePlayerEliminated = (data: any) => eliminatePlayer(data.playerId, data.killerId);
    const handleArenaShrinking = (data: any) => { updateArenaSize(data.newSize); };
    const handleChatMessage = (data: any) => {
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        player: data.playerId,
        message: data.message
      }])
    };
    const handleVictory = (data: any) => {
      if (data && data.winnerId && currentPlayer && data.winnerId === currentPlayer.id) {
        setGameState('victory');
      }
    };

    gameWS.on('player-updated', handlePlayerUpdated)
    gameWS.on('player-eliminated', handlePlayerEliminated)
    gameWS.on('arena-shrinking', handleArenaShrinking)
    gameWS.on('chat-message', handleChatMessage)
    gameWS.on('victory', handleVictory)

    return () => {
      gameWS.off('player-updated', handlePlayerUpdated)
      gameWS.off('player-eliminated', handlePlayerEliminated)
      gameWS.off('arena-shrinking', handleArenaShrinking)
      gameWS.off('chat-message', handleChatMessage)
      gameWS.off('victory', handleVictory)
      gameWS.close()
    }
  }, [currentMatch, currentPlayer]);

  // Smooth movement effect
  useEffect(() => {
    if (!currentPlayer || !currentPlayer.isAlive) return;
    let animationFrame: number;
    const pressed = new Set<string>();

    const move = () => {
      let { x, y } = currentPlayer.position;
      let moved = false;
      if (pressed.has("ArrowUp") || pressed.has("w") || pressed.has("W")) { y -= moveStep; moved = true; }
      if (pressed.has("ArrowDown") || pressed.has("s") || pressed.has("S")) { y += moveStep; moved = true; }
      if (pressed.has("ArrowLeft") || pressed.has("a") || pressed.has("A")) { x -= moveStep; moved = true; }
      if (pressed.has("ArrowRight") || pressed.has("d") || pressed.has("D")) { x += moveStep; moved = true; }
      x = Math.max(arenaMin, Math.min(arenaMax, x));
      y = Math.max(arenaMin, Math.min(arenaMax, y));
      if (moved && (x !== currentPlayer.position.x || y !== currentPlayer.position.y)) {
        updatePlayerPosition(currentPlayer.id, { x, y });
      }
      animationFrame = requestAnimationFrame(move);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (movementKeys.has(e.key)) pressed.add(e.key);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (movementKeys.has(e.key)) pressed.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    animationFrame = requestAnimationFrame(move);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrame);
    };
  }, [currentPlayer, updatePlayerPosition]);

  // Transaction toast UI
  const [showTxToast, setShowTxToast] = useState(false);
  useEffect(() => {
    if (upgradeTxStatus) {
      setShowTxToast(true);
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => setShowTxToast(false), 5000);
    }
  }, [upgradeTxStatus]);

  const handleBuyUpgrade = async (upgradeId: string, cost: number) => {
    await buyUpgrade(upgradeId, cost);
    // Cap health and shields at 100 after upgrade
    if (currentPlayer) {
      if (upgradeId === 'health' && currentPlayer.health > 100) {
        updatePlayerHealth(currentPlayer.id, 100);
      }
      if (upgradeId === 'shield' && currentPlayer.shields > 100) {
        // You may need a similar updatePlayerShields if available
      }
    }
  }

  const sendChatMessage = () => {
    if (newChatMessage.trim() && currentPlayer) {
      gameWS.send("chatMessage", { playerId: currentPlayer.id, message: newChatMessage })
      setNewChatMessage("")
    }
  }

  const handleBuyUpgradeWithSol = async () => {
    setUpgradeTxStatus(null)
    if (!connected) {
      setUpgradeTxStatus('Please connect your wallet first')
      toast({ title: 'Wallet not connected', description: 'Please connect your wallet first.', variant: 'destructive' })
      return
    }
    try {
      setUpgradeTxStatus('Processing upgrade payment...')
      const signature = await sendTransaction(new PublicKey(TREASURY_ADDRESS), UPGRADE_COST_SOL)
      setUpgradeTxStatus(`Upgrade purchased! Tx: ${signature}`)
      addTransaction({
        type: 'upgrade',
        amount: UPGRADE_COST_SOL,
        hash: signature,
        timestamp: Date.now(),
      })
      toast({
        title: 'Upgrade Purchased',
        description: (
          <span>
            Transaction:&nbsp;
            <a href={`https://explorer.solana.com/tx/${signature}?cluster=custom&customUrl=https://rpc.gorbagana.wtf/`} target="_blank" rel="noopener noreferrer" className="underline text-green-600">
              {signature.slice(0, 8)}...{signature.slice(-8)}
            </a>
          </span>
        ),
      })
      // Optionally, call buyUpgrade logic here if needed
    } catch (e: any) {
      setUpgradeTxStatus(e.message || 'Failed to purchase upgrade')
      toast({ title: 'Upgrade Payment Failed', description: e.message || 'Failed to purchase upgrade', variant: 'destructive' })
    }
  }

  // Add a handler for GORB-based upgrades
  const handleBuyUpgradeWithGorb = async (upgradeId: string, cost: number) => {
    if (gorbBalance < cost) return;
    setBuyingUpgradeId(upgradeId);
    setBoosted(true);
    setTimeout(() => setBoosted(false), 2000); // Show boost effect for 2s
    await buyUpgrade(upgradeId, cost);
    setBuyingUpgradeId(null);
    // Optionally, show a toast or sound here
  }

  // Debug log for GORB balance and loading
  useEffect(() => {
    console.log('GORB balance:', gorbBalance, 'isLoading:', isLoading);
  }, [gorbBalance, isLoading]);

  // --- Timer Logic (never stuck, highest health wins at end) ---
  useEffect(() => {
    if (!currentMatch?.id) return;

    // Only reset timer if match id truly changes
    if (lastMatchId.current !== currentMatch.id) {
      lastMatchId.current = currentMatch.id;
      setShrinkTimer(30);
      setTimerFinished(null);
    }

    const timer = setInterval(() => {
      setShrinkTimer(prev => {
        console.log("Shrink timer tick:", prev); // Debug log
        if (prev <= 1 && timerFinished !== currentMatch.id) {
          setTimerFinished(currentMatch.id);
          // Shrink arena once if not at minimum size
          if (currentMatch.arenaSize > 200) {
            updateArenaSize(200);
          }
          // After 30s, determine winner by health
          if (!currentMatch || !currentPlayer) return 0;
          const alive = currentMatch.players.filter(p => p.isAlive && p.health > 0);
          if (alive.length === 0) {
            setGameState('defeat');
            return 0;
          }
          const maxHealth = Math.max(...alive.map(p => p.health));
          const winners = alive.filter(p => p.health === maxHealth);
          if (winners.find(p => p.id === currentPlayer.id && currentPlayer.health > 0)) {
            setGameState('victory');
          } else {
            setGameState('defeat');
          }
          return 0;
        }
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentMatch?.id, timerFinished, updateArenaSize]);

  // --- Danger zone logic: reduce health by fixed amount if outside ---
  useEffect(() => {
    if (!currentMatch) return;
    const shrinkPercent = Math.max(0.2, (typeof shrinkTimer === 'number' ? shrinkTimer : 30) / 30);
    const safeRadius = (currentMatch.arenaSize / 2) * shrinkPercent;
    const center = { x: 500, y: 500 };
    const checkDangerZone = () => {
      currentMatch.players.forEach(player => {
        if (!player.isAlive || player.health <= 0) return;
        const dx = player.position.x - center.x;
        const dy = player.position.y - center.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > safeRadius) {
          // Reduce health by a fixed amount (no fluctuation)
          updatePlayerHealth(player.id, Math.max(0, player.health - 8));
        }
      });
    };
    const interval = setInterval(checkDangerZone, 500);
    return () => clearInterval(interval);
  }, [currentMatch, shrinkTimer, updatePlayerHealth]);

  // --- Dynamic win/loss during match (not just at timer end) ---
  useEffect(() => {
    if (!currentMatch || !currentPlayer) return;
    const alive = currentMatch.players.filter(p => p.isAlive);
    if (alive.length === 1 && alive[0].id === currentPlayer.id) {
      setGameState('victory');
    } else if (!alive.find(p => p.id === currentPlayer.id)) {
      setGameState('defeat');
    }
  }, [currentMatch, currentPlayer, setGameState]);

  // Dynamic victory for single player mode
  useEffect(() => {
    if (!currentMatch || !currentMatch.id.startsWith('single_')) return;
    if (!currentPlayer) return;
    const alive = currentMatch.players.filter(p => p.isAlive);
    if (alive.length === 1 && alive[0].id === currentPlayer.id) {
      setGameState('victory');
    }
  }, [currentMatch, currentPlayer, setGameState]);

  // --- Cap all health and shields at 100 ---
  useEffect(() => {
    if (!currentMatch || !currentPlayer) return;
    // Cap all players' health and shields at 100
    const cappedPlayers = currentMatch.players.map(p => ({
      ...p,
      health: Math.min(100, p.health),
      shields: Math.min(100, p.shields),
    }));
    if (JSON.stringify(cappedPlayers) !== JSON.stringify(currentMatch.players)) {
      updatePlayerPosition(currentPlayer.id, currentPlayer.position); // trigger update
      // Only update if something changed
      setTimeout(() => {
        cappedPlayers.forEach(p => {
          if (p.health !== currentMatch.players.find(x => x.id === p.id)?.health) {
            updatePlayerHealth(p.id, p.health);
          }
        });
      }, 0);
    }
  }, [currentMatch, currentPlayer, updatePlayerHealth, updatePlayerPosition]);

  // --- Prevent movement if health is 0 ---
  // For user
  useEffect(() => {
    if (!currentPlayer || currentPlayer.health > 0) return;
    const block = (e: KeyboardEvent) => e.preventDefault();
    window.addEventListener('keydown', block, { capture: true });
    return () => window.removeEventListener('keydown', block, { capture: true });
  }, [currentPlayer]);
  // For bots: skip movement if health is 0
  useEffect(() => {
    if (!currentMatch || !currentPlayer) return;
    // Always run bot movement, even in single player mode
    const botMoveInterval = setInterval(() => {
      const bots = currentMatch.players.filter(p => p.id !== currentPlayer.id && p.isAlive && p.health > 0);
      bots.forEach(bot => {
        const dx = Math.floor(Math.random() * 81) - 40;
        const dy = Math.floor(Math.random() * 81) - 40;
        const newX = Math.max(0, Math.min(1000, bot.position.x + dx));
        const newY = Math.max(0, Math.min(1000, bot.position.y + dy));
        updatePlayerPosition(bot.id, { x: newX, y: newY });
        if (Math.random() < 0.5) {
          const target = Math.random() < 0.6 ? currentPlayer : bots[Math.floor(Math.random() * bots.length)];
          if (target && target.isAlive && target.id !== bot.id && target.health > 0) {
            const damage = Math.floor(Math.random() * 25) + 10;
            updatePlayerHealth(target.id, Math.max(0, target.health - damage));
          }
        }
      });
    }, 400);
    return () => clearInterval(botMoveInterval);
  }, [currentMatch, currentPlayer, updatePlayerPosition, updatePlayerHealth]);

  if (!currentMatch || !currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading battle...</div>
      </div>
    )
  }

  const alivePlayers = playersToShow.filter(p => p.isAlive)
  const playerHealth = currentPlayer.health
  const playerShield = currentPlayer.shields

  // Calculate dynamic shrinking for arena
  const shrinkPercent = Math.max(0.2, shrinkTimer / 30); // 1 at start, 0.2 at end
  const dangerInset = 4 + (1 - shrinkPercent) * 80; // from 4px to 84px
  const pingInset = 8 + (1 - shrinkPercent) * 120;   // from 8px to 128px

  return (
    <div className="min-h-screen p-4 pt-20 relative z-10">
      {/* Backend Info Banner - now just below nav, above all content */}
      <div className="w-full bg-yellow-900 text-yellow-200 text-center py-2 rounded shadow-lg font-semibold mb-6 fixed left-0 right-0 top-16 z-50" style={{maxWidth: '100vw'}}>
        ⚠️ The backend is deployed on a free instance, so some things may load late.
      </div>
      {/* Top HUD */}
      <div className="fixed top-28 left-0 right-0 z-40 px-6 mt-4"> {/* mt-4 for spacing below banner */}
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Health & Shield */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-black/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-green-500/50 shadow-lg">
              <Heart className="w-5 h-5 text-red-500" />
              <Progress value={playerHealth} className="w-32 h-3" />
              <span className="text-white font-bold">{playerHealth}</span>
            </div>
            <div className="flex items-center gap-2 bg-black/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-blue-500/50 shadow-lg">
              <Shield className="w-5 h-5 text-blue-500" />
              <Progress value={playerShield} className="w-32 h-3" />
              <span className="text-white font-bold">{playerShield}</span>
            </div>
          </div>

          {/* Center Timer */}
          <div
            className={`bg-black/95 backdrop-blur-sm px-6 py-3 rounded-lg border-2 shadow-lg ${
              shrinkTimer <= 10 ? "border-red-500 animate-pulse shadow-red-500/25" : "border-orange-500 shadow-orange-500/25"
            }`}
          >
            <div className="text-center">
              <div className="text-red-400 font-bold text-lg">ARENA SHRINKING IN</div>
              <div className="text-white text-3xl font-black">{shrinkTimer}s</div>
            </div>
          </div>

          {/* GORB Balance - always up to date */}
          <div className="flex items-center gap-2 bg-black/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-gold-500/50 shadow-lg">
            <Coins className="w-5 h-5 text-gold-400" />
            <span className="text-gold-400 font-bold text-lg">{gorbBalance.toLocaleString()} GORB</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 max-w-7xl mx-auto mt-16">
        {/* Left Sidebar - Player List */}
        <div className="col-span-2">
          <Card className="bg-black/80 border-green-500/30 p-4 h-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-green-400 font-bold flex items-center gap-2 text-lg">
                <Users className="w-4 h-4" />
                PLAYERS
              </h3>
              <span className="bg-black/90 px-3 py-1 rounded-lg border-2 border-green-400 text-green-300 text-lg font-extrabold shadow-lg">
                {alivePlayers.length}
              </span>
            </div>
            <div className="space-y-2">
              {playersToShow.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-all truncate
                    ${player.id === currentPlayer.id ? "bg-green-900/40 border border-green-400" : player.isAlive ? "bg-gray-900/40" : "bg-red-900/20 border border-red-400"}
                  `}
                >
                  <img
                    src={avatarImages[player.avatar] || "/placeholder-user.jpg"}
                    alt={player.avatar}
                    onError={e => (e.currentTarget.src = "/placeholder-user.jpg")}
                    className={`w-8 h-8 rounded-full object-cover bg-gray-800 border-2
                      ${player.id === currentPlayer.id ? "border-green-400" : player.isAlive ? "border-blue-400" : "border-red-400 opacity-60 grayscale"}
                    `}
                  />
                  <span className={`text-white font-medium truncate ${!player.isAlive ? "line-through text-red-400" : ""}`}>{player.id === currentPlayer.id ? "YOU" : player.name}</span>
                  {!player.isAlive && <Skull className="w-4 h-4 text-red-500 ml-auto" />}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Center - Battle Arena */}
        <div className="col-span-8">
          <Card className="bg-black/60 border-purple-500/30 p-4 h-96 relative overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />

            {/* Danger Zone */}
            <div
              className="absolute border-8 border-red-600 rounded-full animate-pulse opacity-80 shadow-2xl shadow-red-700"
              style={{ inset: `${dangerInset}px`, boxShadow: '0 0 60px 20px #dc2626, 0 0 120px 40px #f87171' }}
            />
            <div
              className="absolute border-4 border-yellow-400 rounded-full animate-ping opacity-60 shadow-lg shadow-yellow-500"
              style={{ inset: `${pingInset}px`, boxShadow: '0 0 40px 10px #facc15' }}
            />

            {/* Player Positions */}
            {playersToShow.map((player) =>
              player.position && typeof player.position.x === 'number' && typeof player.position.y === 'number' ? (
                <div
                  key={player.id}
                  className={`absolute flex flex-col items-center justify-center z-10 pointer-events-none
                    ${player.isAlive ? "animate-bounce-slow" : "opacity-60 grayscale"}
                  `}
                  style={{
                    left: `${(player.position.x / 1000) * 100}%`,
                    top: `${(player.position.y / 1000) * 100}%`,
                    transform: "translate(-50%, -50%)"
                  }}
                >
                  <div className={`relative`}>
                    <img
                      src={avatarImages[player.avatar] || "/placeholder-user.jpg"}
                      alt={player.avatar}
                      onError={e => (e.currentTarget.src = "/placeholder-user.jpg")}
                      className={`w-12 h-12 rounded-full object-cover border-4 shadow-lg bg-gray-800
                        ${player.id === currentPlayer.id ? "border-green-400 ring-2 ring-green-300" : player.isAlive ? "border-blue-400" : "border-red-400"}
                        ${player.id === currentPlayer.id && boosted ? "ring-4 ring-yellow-400 animate-pulse" : ""}
                      `}
                      style={{ boxShadow: player.id === currentPlayer.id ? "0 0 16px #22c55e" : undefined }}
                    />
                    {/* Boost effect overlay */}
                    {player.id === currentPlayer.id && boosted && (
                      <>
                        {/* Existing glow effect */}
                        <div className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-ping pointer-events-none" style={{ zIndex: 2 }} />
                        {/* Burst/confetti effect */}
                        <div className="absolute inset-0 pointer-events-none z-30">
                          {[...Array(12)].map((_, i) => (
                            <div
                              key={i}
                              className="absolute w-2 h-2 rounded-full"
                              style={{
                                left: '50%',
                                top: '50%',
                                background: `hsl(${i * 30}, 90%, 60%)`,
                                transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-32px)`,
                                animation: 'burst 0.7s cubic-bezier(.4,2,.6,1) both'
                              }}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  {/* Health Bar */}
                  <div className="w-12 h-2 bg-gray-700 rounded mt-1 relative overflow-hidden">
                    <div
                      className="h-2 rounded bg-green-400 transition-all"
                      style={{ width: `${Math.max(0, Math.min(100, player.health))}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold">
                      {player.health}
                    </div>
                  </div>
                  {/* Shields and Info */}
                  <div className="flex items-center gap-2 mt-1 text-xs font-semibold">
                    <span className="text-blue-300">🛡️ {player.shields}</span>
                    <span className="text-yellow-300">⚡ Lv.{player.level}</span>
                  </div>
                  <div className={`mt-1 text-xs font-bold text-center select-none
                    ${player.id === currentPlayer.id ? "text-green-300" : player.isAlive ? "text-blue-200" : "text-red-400 line-through"}
                  `}>
                    {player.id === currentPlayer.id ? "YOU" : player.name}
                  </div>
                </div>
              ) : null
            )}

            {/* Battle Effects */}
            <div className="absolute top-1/4 right-1/4 w-8 h-8 bg-orange-500 rounded-full animate-ping opacity-75" />
            <div className="absolute bottom-1/3 left-1/3 w-6 h-6 bg-red-500 rounded-full animate-pulse opacity-60" />

            {/* Upgrade Button */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
              <Button
                className="bg-gold-500 hover:bg-gold-600 text-black font-bold px-8"
                onClick={handleBuyUpgradeWithSol}
                disabled={!connected}
              >
                Buy Upgrade (0.001 SOL)
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Sidebar - Mini-map & Kill Feed */}
        <div className="col-span-2 space-y-4">
          <Card className="bg-black/80 border-blue-500/30 p-4">
            <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
              <Map className="w-4 h-4" />
              MINI-MAP
            </h3>
            <div className="w-full h-24 bg-gray-900 rounded border border-blue-500/30 relative">
              {playersToShow.map((player) =>
                player.position && typeof player.position.x === 'number' && typeof player.position.y === 'number' ? (
                  <div
                    key={player.id}
                    className={`absolute w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
                      player.id === currentPlayer.id ? "bg-green-500" : "bg-blue-500"
                    }`}
                    style={{
                      left: `${(player.position.x / 1000) * 100}%`,
                      top: `${(player.position.y / 1000) * 100}%`
                    }}
                  />
                ) : null
              )}
            </div>
          </Card>

          <Card className="bg-black/80 border-red-500/30 p-4">
            <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2">
              <Skull className="w-4 h-4" />
              KILL FEED
            </h3>
            <div className="space-y-1 text-xs">
              {currentMatch.killFeed.slice(-5).map((kill, i) => (
                <div key={i} className="text-green-400">
                  {kill.killer} eliminated {kill.victim}
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-black/80 border-purple-500/30 p-4">
            <h3 className="text-purple-400 font-bold mb-2 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              SPECTATORS
            </h3>
            <div className="text-center text-2xl font-bold text-purple-400">247</div>
          </Card>
        </div>
      </div>

      {/* Bottom Panel - Upgrade Shop */}
      <div className="fixed bottom-4 left-0 right-0 px-6">
        <Card className="bg-black/90 border-gold-500/30 p-4 max-w-7xl mx-auto">
          <h3 className="text-gold-400 font-bold mb-4 text-center">UPGRADE SHOP</h3>
          <div className="grid grid-cols-6 gap-4">
            {currentMatch.upgrades.map((upgrade) => (
              <div
                key={upgrade.id}
                className="bg-gray-900/50 p-3 rounded border border-gold-500/30 text-center"
              >
                <div className="text-gold-400 font-bold mb-2">{upgrade.name}</div>
                <div className="text-xs text-gray-400 mb-2">{upgrade.description}</div>
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Coins className="w-3 h-3 text-gold-400" />
                  <span className="text-gold-400 text-sm">{upgrade.cost}</span>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-gold-500 text-black hover:bg-gold-600"
                  onClick={() => handleBuyUpgradeWithGorb(upgrade.id, upgrade.cost)}
                  disabled={buyingUpgradeId !== null && buyingUpgradeId !== upgrade.id || gorbBalance < upgrade.cost}
                >
                  {buyingUpgradeId === upgrade.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "BUY"}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Chat Panel */}
      <div className="fixed bottom-4 right-4 w-80">
        <Card className="bg-black/90 border-purple-500/30 p-4">
          <h3 className="text-purple-400 font-bold mb-2 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            CHAT
          </h3>
          <div className="h-32 overflow-y-auto mb-2 space-y-1 text-xs">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="text-gray-300">
                <span className="text-purple-400">{msg.player}:</span> {msg.message}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newChatMessage}
              onChange={(e) => setNewChatMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
              placeholder="Type message..."
              className="flex-1 bg-gray-800 text-white px-2 py-1 rounded text-xs"
            />
            <Button size="sm" onClick={sendChatMessage} className="bg-purple-500 hover:bg-purple-600">
              Send
            </Button>
          </div>
        </Card>
      </div>

      {/* Transaction Toast */}
      {showTxToast && upgradeTxStatus && (
        <div className="fixed top-6 right-6 z-50 bg-green-900 border border-green-500 px-6 py-3 rounded-lg shadow-lg max-w-md w-full text-green-200 text-sm font-semibold truncate">
          {upgradeTxStatus.length > 80 ? `${upgradeTxStatus.slice(0, 80)}...` : upgradeTxStatus}
        </div>
      )}

      {error && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500/90 p-4 rounded-lg border border-red-500">
          <span className="text-white">{error}</span>
        </div>
      )}
    </div>
  )
} 