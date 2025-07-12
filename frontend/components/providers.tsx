"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TrashRoyaleWalletProvider } from '@/contexts/WalletContext'
import { GameProvider } from '@/contexts/GameContext'
import { TransactionHistoryProvider } from '@/contexts/TransactionHistoryContext'
import { Toaster } from 'sonner'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <TrashRoyaleWalletProvider>
        <GameProvider>
          <TransactionHistoryProvider>
            {children}
            <Toaster 
              position="top-right"
              richColors
              closeButton
            />
          </TransactionHistoryProvider>
        </GameProvider>
      </TrashRoyaleWalletProvider>
    </QueryClientProvider>
  )
} 