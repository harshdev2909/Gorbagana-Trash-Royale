"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useWalletContext, WalletMultiButton } from '@/contexts/WalletContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Play, Users, Clock, Gift, Twitter, MessageCircle, ExternalLink } from 'lucide-react'
import Image from 'next/image'

interface WaitlistEntry {
  id: string
  walletAddress: string
  email: string
  timestamp: number
}

export function LandingPage() {
  const { connected, publicKey } = useWalletContext()
  const [walletInput, setWalletInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [waitlistCount, setWaitlistCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  // Countdown timer for beta launch (set to 30 days from now)
  useEffect(() => {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 30)

    const timer = setInterval(() => {
      const now = new Date().getTime()
      const distance = targetDate.getTime() - now

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Load waitlist count from API
  useEffect(() => {
    const loadWaitlistCount = async () => {
      try {
        const response = await fetch('/api/waitlist')
        if (response.ok) {
          const data = await response.json()
          setWaitlistCount(data.count)
        }
      } catch (error) {
        console.error('Failed to load waitlist count:', error)
      }
    }

    loadWaitlistCount()
  }, [])

  // Prefill wallet address when connected
  useEffect(() => {
    if (connected && publicKey) {
      setWalletInput(publicKey.toString())
    }
  }, [connected, publicKey])

  const isWalletValid = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletInput)
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)
  const canSubmit = isWalletValid && isEmailValid && !isSubmitting

  const handleWaitlistSignup = async () => {
    if (!walletInput.trim() || !emailInput.trim()) {
      toast.error('Please enter both wallet address and email')
      return
    }
    if (!isWalletValid) {
      toast.error('Please enter a valid Solana wallet address')
      return
    }
    if (!isEmailValid) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)

    try {
      // Call API to join waitlist
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: walletInput,
          email: emailInput,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist')
      }

      // Update count
      setWaitlistCount(data.count)

      // Show success message
      toast.success(data.message || "You're in! 500 GORB tokens await you in the beta.")

      // If wallet is connected and input is a wallet address, trigger airdrop
      if (connected && publicKey && walletInput === publicKey.toString()) {
        await simulateAirdrop()
      }

      // Clear input
      setEmailInput('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join waitlist. Please try again.')
      console.error('Waitlist signup error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const simulateAirdrop = async () => {
    try {
      if (!publicKey) return

      const response = await fetch('/api/airdrop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process airdrop')
      }

      toast.success(data.message || '500 GORB will be credited in your in-game wallet soon. 🎉', {
        duration: 5000,
        icon: <Gift className="w-4 h-4" />
      })
      // Show additional toast for in-game wallet credit
    //   toast('500 GORB will be credited in your in-game wallet soon.', {
    //     duration: 5000,
    //     icon: <Gift className="w-4 h-4 text-green-400" />,
    //   })
    } catch (error) {
      console.error('Airdrop error:', error)
      toast.error('Failed to process airdrop. Please try again.')
    }
  }

  const handlePlayDemo = () => {
    // Navigate to the game demo
    window.location.href = '/arena'
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Cyberpunk Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-green-900/20 z-0" />
      
      {/* Animated grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30 z-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      {/* Floating particles */}
      <div className="fixed inset-0 pointer-events-none z-10">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-green-400 rounded-full"
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-20">
        {/* Navigation */}
        <nav className="flex justify-between items-center p-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4"
          >
            <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-purple-400 bg-clip-text text-transparent">
              Trash Royale
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4"
          >
            <WalletMultiButton className="bg-gradient-to-r from-green-500 to-purple-500 hover:from-green-600 hover:to-purple-600 text-white border-0" />
          </motion.div>
        </nav>

        {/* Hero Section */}
        <section className="px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <Badge className="mb-6 bg-gradient-to-r from-green-500 to-purple-500 text-white border-0">
              🚀 Beta Coming Soon
            </Badge>
            
            <h1 className="text-6xl md:text-8xl font-bold mb-6">
              <span className="bg-gradient-to-r from-green-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
                Trash Royale
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Multiplayer Chaos on Gorbagana
            </p>
            
            <p className="text-lg text-gray-400 mb-12 max-w-3xl mx-auto">
              Join the ultimate battle royale where strategy meets chaos. 
              Compete with players worldwide, earn GORB tokens, and become the last one standing.
            </p>

            {/* Game Preview with Image Background */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="mb-12"
            >
              <div className="relative max-w-4xl mx-auto aspect-[4/5] max-h-[600px] bg-gradient-to-br from-green-900/30 to-purple-900/30 rounded-lg border border-green-500/20 overflow-hidden flex items-center justify-center">
                {/* Image as background */}
                <Image
                  src="/image.png"
                  alt="Trash Royale Preview"
                  fill
                  style={{ objectFit: 'contain' }}
                  className="z-0"
                  priority
                />
                {/* Overlay for readability */}
                <div className="absolute inset-0 bg-black/60 z-10" />
                {/* Play icon and text */}
                <div className="relative z-20 flex flex-col items-center justify-center w-full h-full">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-green-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Play className="w-10 h-10 text-white ml-1" />
                  </div>
                  <p className="text-gray-300 text-lg font-semibold">Game Preview Coming Soon</p>
                </div>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              {/* <Button
                onClick={handlePlayDemo}
                size="lg"
                className="bg-gradient-to-r from-green-500 to-purple-500 hover:from-green-600 hover:to-purple-600 text-white border-0 px-8 py-3 text-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Play Demo
              </Button> */}
              
              <Button
                variant="outline"
                size="lg"
                className="border-green-500/50 text-green-400 hover:bg-green-500/10 px-8 py-3 text-lg"
                onClick={() => document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Join Waitlist
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* Countdown Timer */}
        <section className="px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold text-white mb-8">Public Beta Launch</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Days', value: timeLeft.days },
                { label: 'Hours', value: timeLeft.hours },
                { label: 'Minutes', value: timeLeft.minutes },
                { label: 'Seconds', value: timeLeft.seconds }
              ].map((item, index) => (
                <Card key={index} className="bg-black/50 border-green-500/20">
                  <CardContent className="p-4">
                    <div className="text-3xl font-bold text-green-400">{item.value}</div>
                    <div className="text-sm text-gray-400">{item.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Waitlist Section */}
        <section id="waitlist" className="px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="bg-black/50 border-green-500/20">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white">Join the Waitlist</CardTitle>
                <CardDescription className="text-gray-400">
                  Be among the first to experience Trash Royale and receive 500 GORB tokens
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:gap-2">
                  <Input
                    type="text"
                    placeholder={connected ? "Wallet address (auto-filled)" : "Enter wallet address"}
                    value={walletInput}
                    onChange={(e) => setWalletInput(e.target.value)}
                    className="bg-black/30 border-green-500/30 text-white placeholder:text-gray-500"
                  />
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="bg-black/30 border-green-500/30 text-white placeholder:text-gray-500"
                  />
                  <Button
                    onClick={handleWaitlistSignup}
                    disabled={!canSubmit}
                    className="bg-gradient-to-r from-green-500 to-purple-500 hover:from-green-600 hover:to-purple-600 text-white border-0"
                  >
                    {isSubmitting ? 'Joining...' : 'Join Waitlist'}
                  </Button>
                </div>
                
                <div className="text-center text-sm text-gray-400">
                  <Users className="w-4 h-4 inline mr-2" />
                  Total Degens on Waitlist: <span className="text-green-400 font-bold">{waitlistCount}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* Social Proof Section */}
        <section className="px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold text-white mb-8">Join the Community</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-black/50 border-green-500/20">
                <CardContent className="p-6">
                  <Twitter className="w-8 h-8 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Follow on Twitter</h3>
                  <p className="text-gray-400 mb-4">Get the latest updates and announcements</p>
                  <Button asChild variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
                    <a href="https://x.com/trashroyale9" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Follow @trashroyale9
                    </a>
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-black/50 border-green-500/20">
                <CardContent className="p-6">
                  <MessageCircle className="w-8 h-8 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Join Telegram</h3>
                  <p className="text-gray-400 mb-4">Connect with other players and developers</p>
                  <Button asChild variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
                    <a href="https://t.me/+Ke-GfH7Ofno0MWE1" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Join Telegram
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-green-500/20">
          <div className="max-w-4xl mx-auto text-center text-gray-400">
            
          </div>
        </footer>
      </div>
    </div>
  )
} 