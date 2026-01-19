import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ExpenseCategoryTable } from './components/expense-category-table'
import { useAccounts } from '@/hooks/use-accounts'
import { useTransactions } from '@/hooks/use-transactions'
import { useCategories } from '@/hooks/use-categories'
import { useUserSettings } from '@/hooks/use-user-settings'
import { convertCategoriesToOptions } from '@/features/transactions/utils/category-helpers'
import { TrendingUp, TrendingDown, PiggyBank, Target } from 'lucide-react'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export function Dashboard() {
  const { accounts, isLoading: accountsLoading } = useAccounts()
  const { transactions, isLoading: transactionsLoading } = useTransactions()
  const { categories: dbCategories } = useCategories()
  const { settings } = useUserSettings()

  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)

  // Get category classifications (same logic as table)
  const categories = useMemo(() => convertCategoriesToOptions(dbCategories), [dbCategories])

  const incomeCategories = useMemo(() => {
    return categories.filter((cat) => {
      const isExplicitIncome =
        cat.value === 'salary' ||
        cat.value === 'investment' ||
        cat.value === 'gift-received' ||
        cat.value === 'gift_received' ||
        cat.value === 'interest-earned' ||
        cat.value === 'interest_earned' ||
        cat.value === 'refund' ||
        cat.value === 'refunds'

      const labelIndicatesGift = /gift/i.test(cat.label)
      const labelIndicatesInterest = /interest/i.test(cat.label)
      const labelIndicatesRefund = /refund/i.test(cat.label)

      return (
        isExplicitIncome ||
        labelIndicatesGift ||
        labelIndicatesInterest ||
        labelIndicatesRefund
      )
    })
  }, [categories])

  const savingsCategories = useMemo(() => {
    return categories.filter((cat) => {
      const isExplicitSavings =
        cat.value === 'savings' ||
        cat.value === 'saving' ||
        cat.value === 'savings-account' ||
        cat.value === 'savings_account'

      const labelIndicatesSavings = /saving/i.test(cat.label)
      const valueIndicatesSavings = /saving/i.test(cat.value)

      return isExplicitSavings || labelIndicatesSavings || valueIndicatesSavings
    })
  }, [categories])

  // Get available years from transactions
  const yearOptions = useMemo(() => {
    const years = new Set<number>()
    transactions.forEach((t) => {
      years.add(new Date(t.date).getFullYear())
    })
    years.add(currentYear)
    return Array.from(years).sort((a, b) => b - a)
  }, [transactions, currentYear])

  const minYear = Math.min(...yearOptions)
  const maxYear = Math.max(...yearOptions)

  const handlePreviousYear = () => {
    if (selectedYear > minYear) {
      setSelectedYear(selectedYear - 1)
    }
  }

  const handleNextYear = () => {
    if (selectedYear < maxYear) {
      setSelectedYear(selectedYear + 1)
    }
  }

  // Calculate totals for the selected year (matching table logic exactly)
  // The table calculates: sum of uncategorized + sum of all incomeCategories/expenseCategories
  // We need to replicate the same data structure and calculation
  const yearTransactions = transactions.filter((t) => {
    const tDate = new Date(t.date)
    return (
      (t.type === 'income' || t.type === 'expense') &&
      tDate.getFullYear() === selectedYear
    )
  })

  // Build the same data structure as the table
  const incomeDataByCategory: Record<string, number> = {}
  const expenseDataByCategory: Record<string, number> = {}
  let uncategorizedIncome = 0
  let uncategorizedExpenses = 0

  // Initialize income categories
  incomeCategories.forEach((category) => {
    incomeDataByCategory[category.value] = 0
  })

  // Initialize expense categories
  const expenseCategories = categories.filter((cat) => {
    const isIncome = incomeCategories.some((incomeCat) => incomeCat.value === cat.value)
    const isSavings = savingsCategories.some((savingsCat) => savingsCat.value === cat.value)
    return !isIncome && !isSavings
  })

  expenseCategories.forEach((category) => {
    expenseDataByCategory[category.value] = 0
  })

  // Process transactions exactly like the table
  yearTransactions.forEach((transaction) => {
    const tDate = new Date(transaction.date)
    const category = transaction.category
    const amount = Math.abs(transaction.amount) // Table uses Math.abs()
    const isSavingsCategory = savingsCategories.some((sc) => sc.value === category)

    if (transaction.type === 'income') {
      if (isSavingsCategory) {
        // Skip - goes to savings
        return
      } else if (!category) {
        uncategorizedIncome += amount
      } else if (incomeDataByCategory[category] !== undefined) {
        // Only count if category exists in incomeDataByCategory
        incomeDataByCategory[category] += amount
      }
      // If category doesn't exist in incomeDataByCategory, skip it (matches table logic)
    } else if (transaction.type === 'expense') {
      if (isSavingsCategory) {
        // Skip - goes to savings
        return
      } else if (!category) {
        uncategorizedExpenses += amount
      } else if (expenseDataByCategory[category] !== undefined) {
        // Only count if category exists in expenseDataByCategory
        expenseDataByCategory[category] += amount
      }
      // If category doesn't exist in expenseDataByCategory, skip it (matches table logic)
    }
  })

  // Calculate totals exactly like the table: uncategorized + sum of all categories
  const totalIncome = uncategorizedIncome + Object.values(incomeDataByCategory).reduce((sum, val) => sum + val, 0)
  const totalExpenses = uncategorizedExpenses + Object.values(expenseDataByCategory).reduce((sum, val) => sum + val, 0)

  const savings = totalIncome - totalExpenses
  
  // Calculate percentages
  const expensePercentage = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0
  const savingsPercentage = totalIncome > 0 ? (savings / totalIncome) * 100 : 0

  // Calculate savings target and progress
  const targetSavingsPercentage = settings?.savingsPercentage ?? 20
  const targetSavingsAmount = totalIncome * (targetSavingsPercentage / 100)
  const savingsDifference = savings - targetSavingsAmount
  const percentageDifference = savingsPercentage - targetSavingsPercentage
  const isBehindTarget = savingsDifference < 0
  // If behind, calculate how much expenses need to be reduced
  const expenseReductionNeeded = isBehindTarget ? Math.abs(savingsDifference) : 0
  const expenseReductionPercentage = totalIncome > 0 ? (expenseReductionNeeded / totalIncome) * 100 : 0

  if (accountsLoading || transactionsLoading) {
    return (
      <>
        <Header>
          <div className='ms-auto flex items-center space-x-4'>
            <Search />
            <ThemeSwitch />
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </Header>
        <Main>
          <div className='flex items-center justify-center py-12'>
            <p className='text-muted-foreground'>Loading dashboard...</p>
          </div>
        </Main>
      </>
    )
  }

  return (
    <>
      <Header>
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-4 flex items-center justify-between space-y-2'>
          <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='icon'
              className='h-8 w-8'
              onClick={handlePreviousYear}
              disabled={selectedYear <= minYear}
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <span className='w-20 text-center font-medium'>{selectedYear}</span>
            <Button
              variant='outline'
              size='icon'
              className='h-8 w-8'
              onClick={handleNextYear}
              disabled={selectedYear >= maxYear}
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
        <div className='space-y-4'>
          {/* Savings Target Card */}
          {settings && (
            <Card className='border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Savings Target</CardTitle>
                <Target className='h-4 w-4 text-blue-600' />
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  <div className='flex items-baseline justify-between'>
                    <span className='text-sm text-muted-foreground'>Target:</span>
                    <span className='text-lg font-semibold text-blue-600'>
                      {targetSavingsPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className='flex items-baseline justify-between'>
                    <span className='text-sm text-muted-foreground'>Current:</span>
                    <span className={`text-lg font-semibold ${isBehindTarget ? 'text-red-600' : 'text-green-600'}`}>
                      {savingsPercentage.toFixed(1)}%
                    </span>
                  </div>
                  {isBehindTarget && (
                    <div className='mt-3 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/20'>
                      <div className='flex items-start gap-2'>
                        <AlertCircle className='h-4 w-4 text-red-600 mt-0.5' />
                        <div className='flex-1 space-y-1'>
                          <p className='text-sm font-medium text-red-900 dark:text-red-100'>
                            Behind target by {Math.abs(percentageDifference).toFixed(1)}%
                          </p>
                          <p className='text-xs text-red-700 dark:text-red-300'>
                            Reduce expenses by {formatCurrency(expenseReductionNeeded)} ({expenseReductionPercentage.toFixed(1)}% of income) to meet your {targetSavingsPercentage.toFixed(1)}% savings target.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {!isBehindTarget && savingsDifference > 0 && (
                    <div className='mt-3 rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/20'>
                      <p className='text-sm font-medium text-green-900 dark:text-green-100'>
                        ✓ Exceeding target by {percentageDifference.toFixed(1)}% ({formatCurrency(savingsDifference)})
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Total Income</CardTitle>
                <TrendingUp className='h-4 w-4 text-green-600' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-green-600'>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(totalIncome)}
                </div>
                <p className='text-xs text-muted-foreground'>
                  {selectedYear}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Total Expenses
                </CardTitle>
                <TrendingDown className='h-4 w-4 text-red-600' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-red-600'>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(totalExpenses)}
                </div>
                <p className='text-xs text-muted-foreground'>
                  {totalIncome > 0 ? `${expensePercentage.toFixed(1)}% of income` : selectedYear}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Savings</CardTitle>
                <PiggyBank className='h-4 w-4 text-blue-600' />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    savings >= 0 ? 'text-blue-600' : 'text-red-600'
                  }`}
                >
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(savings)}
                </div>
                <p className='text-xs text-muted-foreground'>
                  {totalIncome > 0 ? `${savingsPercentage.toFixed(1)}% of income` : 'Income - Expenses'}
                </p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Income & Expense Analysis</CardTitle>
              <CardDescription>
                Monthly income and expenses broken down by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExpenseCategoryTable selectedYear={selectedYear} onYearChange={setSelectedYear} />
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
