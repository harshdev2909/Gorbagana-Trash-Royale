import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress } = body

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Basic Solana address validation
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid Solana wallet address' },
        { status: 400 }
      )
    }

    // Simulate airdrop processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // In a real implementation, this would:
    // 1. Verify the wallet is on the waitlist
    // 2. Check if airdrop was already sent
    // 3. Create and send the actual SPL token transaction
    // 4. Record the airdrop in a database

    // For now, we'll simulate success
    const airdropData = {
      walletAddress,
      amount: 500,
      token: 'GORB',
      timestamp: Date.now(),
      transactionId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    return NextResponse.json({
      success: true,
      message: '500 GORB has been sent to your wallet 🎉',
      data: airdropData
    })
  } catch (error) {
    console.error('Airdrop error:', error)
    return NextResponse.json(
      { error: 'Failed to process airdrop' },
      { status: 500 }
    )
  }
} 