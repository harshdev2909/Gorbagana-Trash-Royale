import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const WAITLIST_FILE = path.join(process.cwd(), 'data', 'waitlist.json')

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.dirname(WAITLIST_FILE)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Read waitlist data
const readWaitlist = () => {
  ensureDataDir()
  if (!fs.existsSync(WAITLIST_FILE)) {
    return []
  }
  try {
    const data = fs.readFileSync(WAITLIST_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading waitlist:', error)
    return []
  }
}

// Write waitlist data
const writeWaitlist = (data: any[]) => {
  ensureDataDir()
  try {
    fs.writeFileSync(WAITLIST_FILE, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error writing waitlist:', error)
    throw error
  }
}

export async function GET() {
  try {
    const waitlist = readWaitlist()
    return NextResponse.json({ 
      count: waitlist.length,
      entries: waitlist 
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch waitlist' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, email } = body

    // Require both fields
    if (!walletAddress || !email) {
      return NextResponse.json(
        { error: 'Both wallet address and email are required' },
        { status: 400 }
      )
    }

    // Validate wallet address
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid Solana wallet address' },
        { status: 400 }
      )
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    const waitlist = readWaitlist()
    
    // Check for duplicates on both fields
    const isDuplicate = waitlist.some((entry: any) => 
      entry.walletAddress === walletAddress || entry.email === email
    )

    if (isDuplicate) {
      return NextResponse.json(
        { error: 'Already registered on waitlist' },
        { status: 409 }
      )
    }

    // Add new entry
    const newEntry = {
      id: Date.now().toString(),
      walletAddress,
      email,
      timestamp: Date.now()
    }

    waitlist.push(newEntry)
    writeWaitlist(waitlist)

    return NextResponse.json({
      success: true,
      message: "You're in! 500 GORB tokens await you in the beta.",
      count: waitlist.length
    })
  } catch (error) {
    console.error('Waitlist signup error:', error)
    return NextResponse.json(
      { error: 'Failed to join waitlist' },
      { status: 500 }
    )
  }
} 