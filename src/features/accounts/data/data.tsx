import {
  Wallet,
  PiggyBank,
  CreditCard,
  TrendingUp,
  Banknote,
  Circle,
} from 'lucide-react'
import type { AccountType } from './schema'

export const accountTypes = [
  {
    label: 'Checking',
    value: 'checking' as const,
    icon: Wallet,
  },
  {
    label: 'Savings',
    value: 'savings' as const,
    icon: PiggyBank,
  },
  {
    label: 'Credit Card',
    value: 'credit' as const,
    icon: CreditCard,
  },
  {
    label: 'Investment',
    value: 'investment' as const,
    icon: TrendingUp,
  },
  {
    label: 'Cash',
    value: 'cash' as const,
    icon: Banknote,
  },
  {
    label: 'Other',
    value: 'other' as const,
    icon: Circle,
  },
]
