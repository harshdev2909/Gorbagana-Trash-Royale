"use client"

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { Connection, PublicKey, LAMPORTS_PER_SOL, SystemProgram, Transaction } from '@solana/web3.js'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import { WalletProvider, useWallet } from '@solana/wallet-adapter-react'
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, AccountLayout } from "@solana/spl-token";

// Gorbagana testnet configuration
const GORBAGANA_RPC = 'https://rpc.gorbagana.wtf/'
const GORB_TOKEN_MINT = new PublicKey("5B2gczxMA1Gshf4ZHXofwFGd5pdRQ6HkbuiV4wV59XLP")

interface WalletContextType {
  connected: boolean
  publicKey: PublicKey | null
  gorbBalance: number
  solBalance: number
  isLoading: boolean
  error: string | null
  refreshBalance: () => Promise<void>
  sendTransaction: (to: PublicKey, amount: number) => Promise<string>
  disconnect: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function useWalletContext() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider')
  }
  return context
}

function WalletContextProvider({ children }: { children: React.ReactNode }) {
  const { publicKey, connected, sendTransaction: walletSendTransaction, signTransaction, disconnect } = useWallet()
  const [gorbBalance, setGorbBalance] = useState(0)
  const [solBalance, setSolBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connection = useMemo(() => new Connection(GORBAGANA_RPC, 'confirmed'), [])

  const CONFIRM_TIMEOUT_MS = 60000; // 60 seconds

  // Real SPL token balance fetch
  const refreshBalance = async () => {
    if (!publicKey) return
    try {
      setIsLoading(true)
      setError(null)
      // Fetch SOL balance
      const solBalanceRaw = await connection.getBalance(publicKey)
      setSolBalance(solBalanceRaw / LAMPORTS_PER_SOL)
      console.log('Fetched SOL balance:', solBalanceRaw / LAMPORTS_PER_SOL)
      // Fetch GORB SPL token balance
      const accounts = await connection.getTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID,
      });

      let gorb = 0;
      for (const acc of accounts.value) {
        // Decode the raw account data
        const data = AccountLayout.decode(acc.account.data);
        const mint = new PublicKey(data.mint).toBase58();
        const amount = Number(data.amount); // raw amount (may need to adjust for decimals)
        console.log("Token Mint:", mint, "Amount:", amount);

        // If you know the GORB mint, match it here:
        if (mint === GORB_TOKEN_MINT.toBase58()) {
          gorb = amount; // or adjust for decimals if needed
        }
      }

      setGorbBalance(gorb);
      if (accounts.value.length === 0) {
        console.warn("❌ No token accounts found — GORB might be non-standard or under a different program.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance')
      console.error('Error fetching balance:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const sendTransaction = async (to: PublicKey, amount: number): Promise<string> => {
    if (!publicKey || !connected || !signTransaction || !walletSendTransaction) {
      throw new Error('Wallet not connected')
    }
    try {
      setIsLoading(true)
      setError(null)
      // Create a SOL transfer transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: to,
          lamports: Math.round(amount * LAMPORTS_PER_SOL),
        })
      )
      // Send transaction using wallet adapter
      const signature = await walletSendTransaction(transaction, connection)
      // Wait for confirmation with longer timeout
      let confirmed = false;
      try {
        await Promise.race([
          connection.confirmTransaction(signature, 'confirmed').then(() => { confirmed = true }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Transaction confirmation timed out.')), CONFIRM_TIMEOUT_MS))
        ])
      } catch (timeoutErr) {
        if (!confirmed) {
          setError('Transaction not confirmed in 60 seconds. Check status on the explorer.')
        }
      }
      await refreshBalance()
      return signature
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (connected && publicKey) {
      refreshBalance()
    } else {
      setGorbBalance(0)
      setSolBalance(0)
    }
  }, [connected, publicKey])

  const value = {
    connected,
    publicKey,
    gorbBalance,
    solBalance,
    isLoading,
    error,
    refreshBalance,
    sendTransaction,
    disconnect
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export function TrashRoyaleWalletProvider({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      // TODO: Add BackpackWalletAdapter when available in the package
    ],
    []
  )
  return (
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </WalletModalProvider>
    </WalletProvider>
  )
}

export { WalletMultiButton } 