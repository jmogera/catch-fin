import { format } from 'date-fns'
import { type Transaction } from '@/features/transactions/data/schema'
import { useCategories } from '@/hooks/use-categories'
import { convertCategoriesToOptions } from '@/features/transactions/utils/category-helpers'
import { useMemo } from 'react'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

type RecentTransactionsProps = {
  transactions: Transaction[]
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const { categories: dbCategories } = useCategories()
  const categories = useMemo(() => convertCategoriesToOptions(dbCategories), [dbCategories])
  
  return (
    <div className='space-y-4'>
      {transactions.map((transaction) => {
        const category = categories.find(
          (cat) => cat.value === transaction.category
        )
        return (
          <div key={transaction.id} className='flex items-center gap-4'>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                transaction.amount >= 0
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
              }`}
            >
              {category?.icon && (
                <category.icon className='h-4 w-4' />
              )}
            </div>
            <div className='flex flex-1 flex-wrap items-center justify-between'>
              <div className='space-y-1'>
                <p className='text-sm leading-none font-medium'>
                  {transaction.description}
                </p>
                <p className='text-sm text-muted-foreground'>
                  {format(transaction.date, 'MMM dd, yyyy')}
                </p>
              </div>
              <div
                className={`font-medium ${
                  transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(transaction.amount)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
