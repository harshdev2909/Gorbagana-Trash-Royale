"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, Coins, Star, Share2, Play, Crown, Target, Zap, Loader2 } from "lucide-react"
import { useGameContext } from "@/contexts/GameContext"
import { useWalletContext } from "@/contexts/WalletContext"
import { useState, useEffect } from "react"
import { useToast } from '@/hooks/use-toast'
import CountUp from 'react-countup'

async function claimSolReward({ winnerAddress, amount, matchId, winnerId }: { winnerAddress: string, amount: number, matchId?: string, winnerId?: string }) {
  const res = await fetch('http://localhost:3001/claim-sol-reward', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ winnerAddress, amount, matchId, winnerId }),
  });
  if (!res.ok) throw new Error('Reward claim failed');
  return await res.json(); // { signature }
}

export function VictoryScreen() {
  const { 
    currentMatch, 
    currentPlayer, 
    setGameState, 
    claimRewards,
    isLoading,
    error
  } = useGameContext()
  
  const { gorbBalance, publicKey } = useWalletContext()
  const { toast } = useToast()
  
  const [rewardsClaimed, setRewardsClaimed] = useState(false)
  const [xpGained, setXpGained] = useState(0)
  const [levelUp, setLevelUp] = useState(false)
  const [solRewardClaimed, setSolRewardClaimed] = useState(false)
  const [solRewardMsg, setSolRewardMsg] = useState<string | null>(null)
  const [isClaiming, setIsClaiming] = useState(false)
  const [realSignature, setRealSignature] = useState<string | null>(null)

  // Enhanced reward logic
  const place = 1; // Always 1st for victory, but can be dynamic if needed
  const kills = currentMatch && currentPlayer ? currentMatch.killFeed.filter(k => k.killer === currentPlayer.id).length : 0;
  const survivalTime = currentMatch ? Math.floor((300 - (currentMatch.timeRemaining || 0)) / 60) : 0;
  const survivalSeconds = currentMatch ? Math.floor((300 - (currentMatch.timeRemaining || 0)) % 60) : 0;
  const baseReward = 100 + (place === 1 ? 100 : 0);
  const killBonus = kills * 40;
  const survivalBonus = (survivalTime * 10) + Math.floor(Math.random() * 30);
  const randomBonus = Math.floor(Math.random() * 50);
  const totalReward = baseReward + killBonus + survivalBonus + randomBonus;

  // Play victory sound on mount
  useEffect(() => {
    const audio = new Audio('/sounds/victory.mp3');
    audio.volume = 0.5;
    audio.play();
  }, []);

  const handleClaimRewards = async () => {
    await claimRewards()
    setRewardsClaimed(true)
    // Play coin sound
    const audio = new Audio('/sounds/coin.mp3');
    audio.volume = 0.5;
    audio.play();
    
    // Simulate XP gain and level up
    const newXp = Math.floor(Math.random() * 200) + 100
    setXpGained(newXp)
    
    if (Math.random() > 0.7) {
      setLevelUp(true)
    }
  }

  const handlePlayAgain = () => {
    setGameState('lobby')
  }

  const handleShare = () => {
    const text = `🏆 Just won Trash Royale on #GorbaganaTestnet! Earned ${totalReward} GORB tokens! 🗑️⚔️`
    const url = window.location.href
    
    if (navigator.share) {
      navigator.share({
        title: 'Trash Royale Victory!',
        text,
        url
      })
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(`${text}\n${url}`)
      alert('Victory message copied to clipboard!')
    }
  }

  const handleClaimSolReward = async () => {
    setIsClaiming(true)
    setSolRewardClaimed(true)
    setSolRewardMsg('Processing SOL reward...')
    try {
      const result = await claimSolReward({
        winnerAddress: publicKey?.toString()!,
        amount: 0.001, // or your dynamic reward
        matchId: currentMatch?.id,
        winnerId: currentPlayer?.id,
      })
      setRealSignature(result.signature)
      setSolRewardMsg(`Reward sent! Tx: ${result.signature}`)
      toast({
        title: 'SOL Reward Sent',
        description: (
          <a
            href={`https://explorer.solana.com/tx/${result.signature}?cluster=custom&customUrl=https://rpc.gorbagana.wtf/`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-green-600"
          >
            {result.signature.slice(0, 8)}...{result.signature.slice(-8)}
          </a>
        ),
      })
    } catch (e: any) {
      setSolRewardMsg('Reward claim failed: ' + e.message)
      setRealSignature(null)
      toast({ title: 'Reward Claim Failed', description: e.message, variant: 'destructive' })
    } finally {
      setIsClaiming(false)
    }
  }

  if (!currentMatch || !currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading victory screen...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 pt-20 relative z-10">
      {/* Victory Animation Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-gold-900/30 via-yellow-900/20 to-orange-900/30 z-0" />
      
      {/* Confetti Effect */}
      <div className="fixed inset-0 pointer-events-none z-10">
        {[...Array(80)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `hsl(${Math.random() * 360}, 80%, 60%)`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto relative z-20">
        {/* Main Victory Card */}
        <Card className="bg-gradient-to-br from-gold-900/50 to-yellow-900/30 border-gold-500/50 p-8 text-center mb-8">
          <div className="mb-6">
            <Trophy className="w-24 h-24 text-gold-400 mx-auto mb-4 animate-pulse" />
            <h1 className="text-6xl font-black bg-gradient-to-r from-gold-400 to-yellow-400 bg-clip-text text-transparent mb-4">
              VICTORY ROYALE!
            </h1>
            <div className="text-gold-300 text-xl">
              You are the last trash standing!
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-black/40 p-4 rounded-lg border border-gold-500/30">
              <Target className="w-8 h-8 text-gold-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gold-400">{kills}</div>
              <div className="text-sm text-gold-300">ELIMINATIONS</div>
            </div>
            <div className="bg-black/40 p-4 rounded-lg border border-gold-500/30">
              <Zap className="w-8 h-8 text-gold-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gold-400">{survivalTime}m {survivalSeconds}s</div>
              <div className="text-sm text-gold-300">SURVIVAL TIME</div>
            </div>
            <div className="bg-black/40 p-4 rounded-lg border border-gold-500/30">
              <Crown className="w-8 h-8 text-gold-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gold-400">1st</div>
              <div className="text-sm text-gold-300">PLACE</div>
            </div>
          </div>

          {/* Rewards Section */}
          <div className="bg-black/60 p-6 rounded-lg border border-gold-500/30 mb-6">
            <h2 className="text-gold-400 font-bold text-2xl mb-4">REWARDS EARNED</h2>
            <div className="flex items-center justify-center gap-4 mb-4">
              <Coins className="w-8 h-8 text-gold-400" />
              <span className="text-4xl font-bold text-gold-400">
                <CountUp end={totalReward} duration={1.5} separator="," /> GORB
              </span>
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="text-gold-300 animate-pop-in" style={{ animationDelay: '0.1s' }}>
                Base Reward: <CountUp end={baseReward} duration={1.2} />
              </div>
              <div className="text-gold-300 animate-pop-in" style={{ animationDelay: '0.3s' }}>
                Kill Bonus: +<CountUp end={killBonus} duration={1.2} />
              </div>
              <div className="text-gold-300 animate-pop-in" style={{ animationDelay: '0.5s' }}>
                Survival: +<CountUp end={survivalBonus} duration={1.2} />
              </div>
              <div className="text-gold-300 animate-pop-in" style={{ animationDelay: '0.7s' }}>
                Random: +<CountUp end={randomBonus} duration={1.2} />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-4">
              <Button
                size="lg"
                className="bg-gold-500 text-black hover:bg-gold-600 font-bold px-8"
                onClick={handleClaimRewards}
                disabled={rewardsClaimed || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Coins className="w-5 h-5 mr-2" />
                )}
                {rewardsClaimed ? "REWARDS CLAIMED" : "CLAIM REWARDS"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gold-500/50 text-gold-400 hover:bg-gold-500/20 font-bold px-8"
                onClick={handlePlayAgain}
              >
                <Play className="w-5 h-5 mr-2" />
                PLAY AGAIN
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20 font-bold px-8"
                onClick={handleShare}
              >
                <Share2 className="w-5 h-5 mr-2" />
                SHARE
              </Button>
            </div>
            <Button
              size="lg"
              className={`bg-green-500 text-black hover:bg-green-600 font-bold px-8 mt-2`}
              onClick={handleClaimSolReward}
              disabled={solRewardClaimed || isClaiming}
            >
              {isClaiming
                ? <Loader2 className="w-5 h-5 animate-spin mr-2" />
                : solRewardClaimed
                  ? "SOL REWARD CLAIMED"
                  : "CLAIM SOL REWARD (Demo)"}
            </Button>
            {solRewardMsg && (
              <div className="mt-2 p-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm text-center">
                {realSignature ? (
                  <>
                    Reward sent! Tx: {" "}
                    <a
                      href={`https://explorer.solana.com/tx/${realSignature}?cluster=custom&customUrl=https://rpc.gorbagana.wtf/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-green-600"
                    >
                      {realSignature.slice(0, 8)}...{realSignature.slice(-8)}
                    </a>
                    {realSignature && realSignature.startsWith('FAKE_') && (
                      <span className="ml-2 px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-bold">Demo Mode</span>
                    )}
                  </>
                ) : (
                  solRewardMsg
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Level Progress */}
        {rewardsClaimed && (
          <Card className="bg-black/60 border-purple-500/30 p-6 mb-6">
            <h3 className="text-purple-400 font-bold text-xl mb-4 flex items-center gap-2">
              <Star className="w-5 h-5" />
              LEVEL PROGRESSION
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white">Level {currentPlayer.level}</span>
                <span className="text-purple-400">+{xpGained} XP</span>
              </div>
              <Progress value={((currentPlayer.xp + xpGained) % 1000) / 10} className="h-3" />
              {levelUp && (
                <div className="text-center text-green-400 font-bold animate-pulse">
                  🎉 LEVEL UP! You are now Level {currentPlayer.level + 1} 🎉
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Match Summary */}
        <Card className="bg-black/60 border-gray-500/30 p-6">
          <h3 className="text-gray-400 font-bold text-xl mb-4">MATCH SUMMARY</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-gray-300 font-semibold mb-2">Player Performance</h4>
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
                  <span className="text-gray-400">Upgrades Purchased:</span>
                  <span className="text-white">{Math.floor(Math.random() * 4) + 1}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-gray-300 font-semibold mb-2">Match Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Players:</span>
                  <span className="text-white">{currentMatch.totalPlayers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Match Duration:</span>
                  <span className="text-white">{survivalTime}m {survivalSeconds}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Arena Size:</span>
                  <span className="text-white">{currentMatch.arenaSize}m²</span>
                </div>
              </div>
            </div>
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