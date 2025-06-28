import React, { useState } from 'react'
import { useWalletContext } from '../contexts/WalletContext'
import { PublicKey } from '@solana/web3.js'

const TREASURY_ADDRESS = 'BdmpkTAbBQYRq5WUHTTCbAKCE6HbeoSzLZu1inQRrzU6'
const AMOUNT_SOL = 0.001

export default function SolDemo() {
  const { connected, publicKey, solBalance, sendTransaction, isLoading, error } = useWalletContext()
  const [status, setStatus] = useState<string | null>(null)

  const handleSend = async (type: 'entry' | 'upgrade') => {
    setStatus(null)
    try {
      const signature = await sendTransaction(new PublicKey(TREASURY_ADDRESS), AMOUNT_SOL)
      setStatus(`${type === 'entry' ? 'Entry fee' : 'Upgrade'} sent! Tx: ${signature}`)
    } catch (e: any) {
      setStatus(e.message)
    }
  }

  // For demo, Claim Reward just shows a message
  const handleClaimReward = () => {
    setStatus('Claim Reward: In a real game, the treasury would send SOL to the winner.')
  }

  return (
    <div style={{
      maxWidth: 400,
      margin: '2rem auto',
      padding: 24,
      border: '1px solid #eee',
      borderRadius: 12,
      color: '#fff',
      background: 'rgba(0,0,0,0.7)'
    }}>
      <h2>SOL Payment Demo</h2>
      <div style={{ marginBottom: 12 }}>
        <strong>Your SOL balance:</strong> {solBalance.toFixed(4)}
      </div>
      <button disabled={!connected || isLoading} onClick={() => handleSend('entry')} style={{ marginBottom: 8, width: '100%' }}>
        {isLoading ? 'Processing...' : `Enter Game (0.001 SOL)`}
      </button>
      <button disabled={!connected || isLoading} onClick={() => handleSend('upgrade')} style={{ marginBottom: 8, width: '100%' }}>
        {isLoading ? 'Processing...' : `Upgrade (0.001 SOL)`}
      </button>
      <button disabled={!connected} onClick={handleClaimReward} style={{ width: '100%' }}>
        Claim Reward (Demo)
      </button>
      {status && status.includes('Tx:') && (
        <div style={{ marginTop: 16, color: 'green' }}>
          Entry fee sent! Tx:&nbsp;
          <a
            href={`https://explorer.solana.com/tx/${status.split('Tx: ')[1]}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'lightgreen', wordBreak: 'break-all', textDecoration: 'underline' } as React.CSSProperties}
          >
            {status.split('Tx: ')[1]}
          </a>
        </div>
      )}
      {error && <div style={{ marginTop: 8, color: 'red' }}>{error}</div>}
    </div>
  )
} 