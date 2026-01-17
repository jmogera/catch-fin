import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type Transaction } from '../data/schema'

type TransactionsDialogType = 'create' | 'update' | 'delete' | 'import'

type TransactionsContextType = {
  open: TransactionsDialogType | null
  setOpen: (str: TransactionsDialogType | null) => void
  currentRow: Transaction | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Transaction | null>>
}

const TransactionsContext = React.createContext<TransactionsContextType | null>(
  null
)

export function TransactionsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useDialogState<TransactionsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Transaction | null>(null)

  return (
    <TransactionsContext.Provider
      value={{ open, setOpen, currentRow, setCurrentRow }}
    >
      {children}
    </TransactionsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTransactions = () => {
  const transactionsContext = React.useContext(TransactionsContext)

  if (!transactionsContext) {
    throw new Error('useTransactions has to be used within <TransactionsProvider>')
  }

  return transactionsContext
}
