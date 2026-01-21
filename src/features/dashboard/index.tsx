import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { useBudgetPlan } from '@/hooks/use-budget-plan'
import { convertCategoriesToOptions } from '@/features/transactions/utils/category-helpers'
import { TrendingUp, TrendingDown, PiggyBank, CheckCircle2, AlertCircle } from 'lucide-react'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export function Dashboard() {
  const { accounts, isLoading: accountsLoading } = useAccounts()
  const { transactions, isLoading: transactionsLoading } = useTransactions()
  const { categories: dbCategories } = useCategories()

  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const { plan: budgetPlan } = useBudgetPlan(selectedYear)

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

  // Build the same data structure as the table for income/expenses
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
    return !isIncome
  })

  expenseCategories.forEach((category) => {
    expenseDataByCategory[category.value] = 0
  })

  // Process transactions exactly like the table
  yearTransactions.forEach((transaction) => {
    const category = transaction.category
    const amount = Math.abs(transaction.amount) // Table uses Math.abs()

    if (transaction.type === 'income') {
      if (!category) {
        uncategorizedIncome += amount
      } else if (incomeDataByCategory[category] !== undefined) {
        // Only count if category exists in incomeDataByCategory
        incomeDataByCategory[category] += amount
      }
      // If category doesn't exist in incomeDataByCategory, skip it (matches table logic)
    } else if (transaction.type === 'expense') {
      if (!category) {
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

  // Savings card should reflect only transactions whose type is explicitly 'savings'
  const savings = transactions
    .filter((t) => {
      const tDate = new Date(t.date)
      return t.type === 'savings' && tDate.getFullYear() === selectedYear
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  
  // Calculate percentages relative to total income
  const expensePercentage = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0
  const savingsPercentage = totalIncome > 0 ? (savings / totalIncome) * 100 : 0

  // Budget plan tracking - only if a plan exists
  const budgetStatus = useMemo(() => {
    if (!budgetPlan) return null

    const currentMonth = new Date().getMonth() + 1 // 1-12
    const isCurrentYear = selectedYear === currentYear
    const monthsElapsed = isCurrentYear ? currentMonth : 12

    // Calculate expected savings based on plan
    const expectedMonthlySavings = budgetPlan.baseMonthlySavingsGoal
    const expectedSavingsToDate = expectedMonthlySavings * monthsElapsed
    const savingsGoalMet = savings >= expectedSavingsToDate

    // Calculate expected expenses based on category budgets
    let expectedExpensesYTD = 0
    let hasExpenseBudgets = false

    if (budgetPlan.categoryBudgets && Object.keys(budgetPlan.categoryBudgets).length > 0) {
      hasExpenseBudgets = true
      Object.values(budgetPlan.categoryBudgets).forEach(budget => {
        // Annual budget, prorate for months elapsed
        expectedExpensesYTD += (budget / 12) * monthsElapsed
      })
    }

    const expensesOnTrack = hasExpenseBudgets ? totalExpenses <= expectedExpensesYTD : null

    return {
      savingsGoalMet,
      expectedSavingsToDate,
      actualSavings: savings,
      expensesOnTrack,
      expectedExpensesYTD,
      actualExpenses: totalExpenses,
      monthsElapsed,
      hasExpenseBudgets,
    }
  }, [budgetPlan, savings, totalExpenses, selectedYear, currentYear])

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
                <div className='flex items-center gap-2'>
                  {budgetStatus && budgetStatus.hasExpenseBudgets && budgetStatus.expensesOnTrack !== null && (
                    budgetStatus.expensesOnTrack ? (
                      <CheckCircle2 className='h-4 w-4 text-green-600' />
                    ) : (
                      <AlertCircle className='h-4 w-4 text-orange-600' />
                    )
                  )}
                  <TrendingDown className='h-4 w-4 text-red-600' />
                </div>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-red-600'>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(totalExpenses)}
                </div>
                <div className='space-y-1'>
                  <p className='text-xs text-muted-foreground'>
                    {totalIncome > 0 ? `${expensePercentage.toFixed(1)}% of income` : selectedYear}
                  </p>
                  {budgetStatus && budgetStatus.hasExpenseBudgets && (
                    <div className='flex items-center gap-2'>
                      <Badge
                        variant={budgetStatus.expensesOnTrack ? 'default' : 'secondary'}
                        className={`text-xs ${
                          budgetStatus.expensesOnTrack
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100'
                        }`}
                      >
                        {budgetStatus.expensesOnTrack ? 'On Track' : 'Over Budget'}
                      </Badge>
                      <span className='text-xs text-muted-foreground'>
                        Budget: {formatCurrency(budgetStatus.expectedExpensesYTD)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Savings</CardTitle>
                <div className='flex items-center gap-2'>
                  {budgetStatus && (
                    budgetStatus.savingsGoalMet ? (
                      <CheckCircle2 className='h-4 w-4 text-green-600' />
                    ) : (
                      <AlertCircle className='h-4 w-4 text-orange-600' />
                    )
                  )}
                  <PiggyBank className='h-4 w-4 text-blue-600' />
                </div>
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
                <div className='space-y-1'>
                  <p className='text-xs text-muted-foreground'>
                    {totalIncome > 0 ? `${savingsPercentage.toFixed(1)}% of income` : 'Income - Expenses'}
                  </p>
                  {budgetStatus && (
                    <div className='flex items-center gap-2'>
                      <Badge
                        variant={budgetStatus.savingsGoalMet ? 'default' : 'secondary'}
                        className={`text-xs ${
                          budgetStatus.savingsGoalMet
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100'
                        }`}
                      >
                        {budgetStatus.savingsGoalMet ? 'On Track' : 'Below Goal'}
                      </Badge>
                      <span className='text-xs text-muted-foreground'>
                        Goal: {formatCurrency(budgetStatus.expectedSavingsToDate)}
                      </span>
                    </div>
                  )}
                </div>
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
