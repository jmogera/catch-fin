import {
  ArrowDown,
  ArrowUp,
  ArrowLeftRight,
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Film,
  Heart,
  GraduationCap,
  DollarSign,
  TrendingUp,
  Circle,
} from 'lucide-react'
import type { TransactionType, TransactionCategory } from './schema'

export const transactionTypes = [
  {
    label: 'Income',
    value: 'income' as const,
    icon: ArrowUp,
  },
  {
    label: 'Expense',
    value: 'expense' as const,
    icon: ArrowDown,
  },
  {
    label: 'Transfer',
    value: 'transfer' as const,
    icon: ArrowLeftRight,
  },
]

export const categories: Array<{
  label: string
  value: TransactionCategory
  icon: typeof Utensils
}> = [
  {
    label: 'Food',
    value: 'food',
    icon: Utensils,
  },
  {
    label: 'Transportation',
    value: 'transportation',
    icon: Car,
  },
  {
    label: 'Shopping',
    value: 'shopping',
    icon: ShoppingBag,
  },
  {
    label: 'Bills',
    value: 'bills',
    icon: Receipt,
  },
  {
    label: 'Entertainment',
    value: 'entertainment',
    icon: Film,
  },
  {
    label: 'Healthcare',
    value: 'healthcare',
    icon: Heart,
  },
  {
    label: 'Education',
    value: 'education',
    icon: GraduationCap,
  },
  {
    label: 'Salary',
    value: 'salary',
    icon: DollarSign,
  },
  {
    label: 'Investment',
    value: 'investment',
    icon: TrendingUp,
  },
  {
    label: 'Other',
    value: 'other',
    icon: Circle,
  },
]
