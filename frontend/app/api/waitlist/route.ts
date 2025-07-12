import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI as string
const dbName = process.env.MONGODB_DB as string

if (!uri || !dbName) {
  throw new Error('Please define MONGODB_URI and MONGODB_DB in your environment variables')
}

let cachedClient: MongoClient | null = null

async function getClient() {
  if (cachedClient) return cachedClient
  const client = new MongoClient(uri)
  await client.connect()
  cachedClient = client
  return client
}

export async function GET() {
  try {
    const client = await getClient()
    const db = client.db(dbName)
    const waitlist = await db.collection('waitlist').find({}).toArray()
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

    const client = await getClient()
    const db = client.db(dbName)
    const collection = db.collection('waitlist')

    // Check for duplicates on both fields
    const isDuplicate = await collection.findOne({
      $or: [
        { walletAddress },
        { email }
      ]
    })

    if (isDuplicate) {
      return NextResponse.json(
        { error: 'Already registered on waitlist' },
        { status: 409 }
      )
    }

    // Add new entry
    const newEntry = {
      walletAddress,
      email,
      timestamp: Date.now()
    }

    await collection.insertOne(newEntry)
    const count = await collection.countDocuments()

    return NextResponse.json({
      success: true,
      message: "You're in! 500 GORB tokens await you in the beta.",
      count
    })
  } catch (error) {
    console.error('Waitlist signup error:', error)
    return NextResponse.json(
      { error: 'Failed to join waitlist' },
      { status: 500 }
    )
  }
} 