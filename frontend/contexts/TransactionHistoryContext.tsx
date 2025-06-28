import React, { createContext, useContext, useState } from 'react'

export type TransactionType = 'entry' | 'upgrade' | 'reward'

export interface TransactionRecord {
  type: TransactionType
  amount: number
  hash: string
  timestamp: number
}

interface TransactionHistoryContextType {
  transactions: TransactionRecord[]
  addTransaction: (tx: TransactionRecord) => void
}

const TransactionHistoryContext = createContext<TransactionHistoryContextType | undefined>(undefined)

export function TransactionHistoryProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])

  const addTransaction = (tx: TransactionRecord) => {
    setTransactions(prev => [tx, ...prev].slice(0, 20)) // keep last 20
  }

  return (
    <TransactionHistoryContext.Provider value={{ transactions, addTransaction }}>
      {children}
    </TransactionHistoryContext.Provider>
  )
}

export function useTransactionHistory() {
  const ctx = useContext(TransactionHistoryContext)
  if (!ctx) throw new Error('useTransactionHistory must be used within a TransactionHistoryProvider')
  return ctx
} 