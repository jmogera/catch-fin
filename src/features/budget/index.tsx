import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useTransactions } from '@/hooks/use-transactions'
import { useCategories } from '@/hooks/use-categories'
import { useUserSettings } from '@/hooks/use-user-settings'
import { convertCategoriesToOptions } from '@/features/transactions/utils/category-helpers'
import { Target, ChevronLeft, ChevronRight, Lock, Unlock } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { cn, formatCurrency } from '@/lib/utils'
import { Input } from '@/components/ui/input'

export function Budget() {
  const { transactions, isLoading: transactionsLoading } = useTransactions()
  const { categories: dbCategories } = useCategories()
  const { settings } = useUserSettings()

  const currentYear = new Date().getFullYear()

  const [selectedYear, setSelectedYear] = useState(currentYear)

  const yearOptions = useMemo(() => {
    const years = new Set<number>()
    transactions.forEach((t) => {
      years.add(new Date(t.date).getFullYear())
    })
    years.add(currentYear)
    return Array.from(years).sort((a, b) => b - a)
  }, [transactions, currentYear])

  const minYear = yearOptions.length ? Math.min(...yearOptions) : currentYear
  const maxYear = yearOptions.length ? Math.max(...yearOptions) : currentYear

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

  // Get category classifications (same logic as dashboard/table)
  const categories = useMemo(
    () => convertCategoriesToOptions(dbCategories),
    [dbCategories]
  )

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

  // Expense categories: exclude income AND savings categories
  const expenseCategories = useMemo(() => {
    return categories.filter((cat) => {
      const isIncome = incomeCategories.some(
        (incomeCat) => incomeCat.value === cat.value
      )
      const isSavings = savingsCategories.some(
        (savingsCat) => savingsCat.value === cat.value
      )
      return !isIncome && !isSavings
    })
  }, [categories, incomeCategories, savingsCategories])

  // Filter to selected year
  const yearTransactions = useMemo(
    () =>
      transactions.filter((t) => {
        const tDate = new Date(t.date)
        return (
          (t.type === 'income' || t.type === 'expense') &&
          tDate.getFullYear() === selectedYear
        )
      }),
    [transactions, selectedYear]
  )

  // Build the same data structure as the dashboard/table
  const {
    totalIncome,
    totalExpenses,
    savings,
    savingsPercentage,
    expenseByCategory,
  } = useMemo(() => {
    const incomeDataByCategory: Record<string, number> = {}
    const expenseDataByCategory: Record<string, number> = {}
    let uncategorizedIncome = 0
    let uncategorizedExpenses = 0

    incomeCategories.forEach((category) => {
      incomeDataByCategory[category.value] = 0
    })

    expenseCategories.forEach((category) => {
      expenseDataByCategory[category.value] = 0
    })

    yearTransactions.forEach((transaction) => {
      const category = transaction.category
      const amount = Math.abs(transaction.amount)
      const isSavingsCategory = savingsCategories.some(
        (sc) => sc.value === category
      )

      if (transaction.type === 'income') {
        if (isSavingsCategory) {
          return
        } else if (!category) {
          uncategorizedIncome += amount
        } else if (incomeDataByCategory[category] !== undefined) {
          incomeDataByCategory[category] += amount
        }
      } else if (transaction.type === 'expense') {
        if (isSavingsCategory) {
          return
        } else if (!category) {
          uncategorizedExpenses += amount
        } else if (expenseDataByCategory[category] !== undefined) {
          expenseDataByCategory[category] += amount
        }
      }
    })

    const totalIncomeCalc =
      uncategorizedIncome +
      Object.values(incomeDataByCategory).reduce((sum, val) => sum + val, 0)
    const totalExpensesCalc =
      uncategorizedExpenses +
      Object.values(expenseDataByCategory).reduce((sum, val) => sum + val, 0)

    const savingsCalc = totalIncomeCalc - totalExpensesCalc
    const savingsPct =
      totalIncomeCalc > 0 ? (savingsCalc / totalIncomeCalc) * 100 : 0

    return {
      totalIncome: totalIncomeCalc,
      totalExpenses: totalExpensesCalc,
      savings: savingsCalc,
      savingsPercentage: savingsPct,
      expenseByCategory: expenseDataByCategory,
    }
  }, [categories, incomeCategories, savingsCategories, expenseCategories, yearTransactions])

  const targetSavingsPercentage = settings?.savingsPercentage ?? 20
  const targetSavingsAmount = totalIncome * (targetSavingsPercentage / 100)
  const savingsDifference = savings - targetSavingsAmount
  const percentageDifference = savingsPercentage - targetSavingsPercentage
  const isBehindTarget = savingsDifference < 0
  const expenseReductionNeeded = isBehindTarget ? Math.abs(savingsDifference) : 0
  const expenseReductionPercentage =
    totalIncome > 0 ? (expenseReductionNeeded / totalIncome) * 100 : 0

  const targetExtraSavingsPct = isBehindTarget
    ? targetSavingsPercentage - savingsPercentage
    : 0

  // Build per-category reduction plan when behind target
  const reductionPlan = useMemo(() => {
    if (!isBehindTarget || totalExpenses <= 0 || expenseReductionNeeded <= 0) {
      return []
    }

    return expenseCategories
      .map((cat) => {
        const amount = expenseByCategory[cat.value] ?? 0
        if (amount <= 0) return null

        const shareOfExpenses = amount / totalExpenses
        const reductionAmount = expenseReductionNeeded * shareOfExpenses
        const reductionPctOfCategory =
          amount > 0 ? (reductionAmount / amount) * 100 : 0
        const savingsPctOfIncome =
          expenseReductionPercentage * shareOfExpenses

        return {
          label: cat.label,
          value: cat.value,
          currentAmount: amount,
          shareOfExpenses,
          reductionAmount,
          reductionPctOfCategory,
          savingsPctOfIncome,
        }
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((a, b) => b.currentAmount - a.currentAmount)
  }, [
    isBehindTarget,
    totalExpenses,
    expenseReductionNeeded,
    expenseCategories,
    expenseByCategory,
    expenseReductionPercentage,
  ])

  // Allow user to adjust cuts per category
  const [customCuts, setCustomCuts] = useState<
    { value: string; cutPct: number }[]
  >([])

  const [lockedCategories, setLockedCategories] = useState<string[]>([])

  // Initialize custom cuts from computed plan when it changes
  useEffect(() => {
    if (!isBehindTarget || reductionPlan.length === 0) {
      setCustomCuts([])
      return
    }
    setCustomCuts(
      reductionPlan.map((row) => ({
        value: row.value,
        cutPct: row.reductionPctOfCategory,
      }))
    )
  }, [isBehindTarget, reductionPlan])

  const userPlan = useMemo(() => {
    if (!isBehindTarget || reductionPlan.length === 0 || totalIncome <= 0) {
      return {
        rows: [] as (typeof reductionPlan)[number][],
        totalSavingsPct: 0,
      }
    }

    const rows = reductionPlan.map((row) => {
      const isLocked = lockedCategories.includes(row.value)
      const custom = customCuts.find((c) => c.value === row.value)
      const baseCutPct = custom ? custom.cutPct : row.reductionPctOfCategory
      const cutPct = isLocked ? 0 : baseCutPct
      const reductionAmount = (row.currentAmount * cutPct) / 100
      const savingsPctOfIncome =
        totalIncome > 0 ? (reductionAmount / totalIncome) * 100 : 0

      return {
        ...row,
        isLocked,
        cutPct,
        reductionAmount,
        savingsPctOfIncome,
      }
    })

    const totalSavingsPct = rows.reduce(
      (sum, r) => sum + r.savingsPctOfIncome,
      0
    )

    return { rows, totalSavingsPct }
  }, [isBehindTarget, reductionPlan, customCuts, totalIncome])

  if (transactionsLoading) {
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
            <p className='text-muted-foreground'>Loading budget...</p>
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
          <h1 className='text-2xl font-bold tracking-tight'>Budget</h1>
          <div className='flex items-center gap-2'>
            <span className='text-sm text-muted-foreground'>
              Savings target vs actual for
            </span>
            <button
              type='button'
              onClick={handlePreviousYear}
              disabled={selectedYear <= minYear}
              className='inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-xs text-muted-foreground hover:bg-muted disabled:opacity-50'
            >
              <ChevronLeft className='h-3 w-3' />
            </button>
            <span className='w-16 text-center text-sm font-medium'>
              {selectedYear}
            </span>
            <button
              type='button'
              onClick={handleNextYear}
              disabled={selectedYear >= maxYear}
              className='inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-xs text-muted-foreground hover:bg-muted disabled:opacity-50'
            >
              <ChevronRight className='h-3 w-3' />
            </button>
          </div>
        </div>

        <div className='grid gap-4 lg:grid-cols-2'>
          <Card className='border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Savings Target
              </CardTitle>
              <Target className='h-4 w-4 text-blue-600' />
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='flex items-baseline justify-between'>
                  <span className='text-sm text-muted-foreground'>Target:</span>
                  <span className='text-lg font-semibold text-blue-600'>
                    {targetSavingsPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className='flex items-baseline justify-between'>
                  <span className='text-sm text-muted-foreground'>
                    Current:
                  </span>
                  <span
                    className={`text-lg font-semibold ${
                      isBehindTarget ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {savingsPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className='flex items-baseline justify-between text-sm'>
                  <span className='text-muted-foreground'>Income:</span>
                  <span>{formatCurrency(totalIncome)}</span>
                </div>
                <div className='flex items-baseline justify-between text-sm'>
                  <span className='text-muted-foreground'>Savings:</span>
                  <span>{formatCurrency(savings)}</span>
                </div>
                <div className='flex items-baseline justify-between text-sm'>
                  <span className='text-muted-foreground'>Target amount:</span>
                  <span>{formatCurrency(targetSavingsAmount)}</span>
                </div>

                {!isBehindTarget && savingsDifference > 0 && (
                  <div className='mt-3 rounded-md border border-green-200 bg-green-50 p-3 text-sm dark:border-green-900 dark:bg-green-950/20'>
                    <p className='font-medium text-green-900 dark:text-green-100'>
                      Exceeding target by {percentageDifference.toFixed(1)}% (
                      {formatCurrency(savingsDifference)})
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {isBehindTarget && (
          <div className='mt-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900 dark:bg-red-950/20'>
            <p className='font-medium text-red-900 dark:text-red-100'>
              Behind target by {Math.abs(percentageDifference).toFixed(1)}%
            </p>
            <p className='text-xs text-red-700 dark:text-red-300'>
              Reduce expenses by {formatCurrency(expenseReductionNeeded)} (
              {targetExtraSavingsPct.toFixed(1)}% of income) to meet your{' '}
              {targetSavingsPercentage.toFixed(1)}% savings target.
            </p>
          </div>
        )}

        {/* Expense reduction breakdown */}
        <div className='mt-4'>
          <Card>
            <CardHeader>
              <CardTitle className='text-sm font-medium'>
                Expense Reduction Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isBehindTarget || reductionPlan.length === 0 ? (
                <p className='text-sm text-muted-foreground'>
                  You&apos;re at or above your savings target. No reductions
                  needed for this year.
                </p>
              ) : (
                <div className='space-y-3 text-xs sm:text-sm'>
                  <p className='text-muted-foreground'>
                    To move from {savingsPercentage.toFixed(1)}% to{' '}
                    {targetSavingsPercentage.toFixed(1)}% savings, reduce total
                    expenses by{' '}
                    <span className='font-medium'>
                      {targetExtraSavingsPct.toFixed(1)}% of income
                    </span>
                    . Your plan below currently saves{' '}
                    <span className='font-medium'>
                      {userPlan.totalSavingsPct.toFixed(1)}% of income
                    </span>{' '}
                    ({(userPlan.totalSavingsPct - targetExtraSavingsPct).toFixed(
                      1
                    )}
                    % vs target).
                  </p>
                  <div className='mt-2 rounded-md border bg-card'>
                    <div className='grid grid-cols-4 gap-2 border-b px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs'>
                      <span>Category</span>
                      <span className='text-right'>Spend</span>
                      <span className='text-right'>Cut / Cat%</span>
                      <span className='text-right'>Δ Save (% of inc)</span>
                    </div>
                    <div className='max-h-72 space-y-1 overflow-y-auto py-1'>
                      {userPlan.rows.map((row) => (
                        <div
                          key={row.value}
                          className='grid grid-cols-4 gap-2 px-3 py-1 text-[11px] sm:text-xs'
                        >
                          <span className='truncate'>
                            <div className='flex items-center gap-1'>
                              <button
                                type='button'
                                className='inline-flex h-5 w-5 items-center justify-center rounded border border-border text-[10px] text-muted-foreground hover:bg-muted'
                                onClick={() => {
                                  setLockedCategories((prev) =>
                                    prev.includes(row.value)
                                      ? prev.filter((v) => v !== row.value)
                                      : [...prev, row.value]
                                  )
                                }}
                              >
                                {row.isLocked ? (
                                  <Lock className='h-3 w-3' />
                                ) : (
                                  <Unlock className='h-3 w-3' />
                                )}
                              </button>
                              <span
                                className={cn(
                                  'truncate',
                                  row.isLocked && 'text-muted-foreground'
                                )}
                              >
                                {row.label}
                              </span>
                            </div>
                          </span>
                          <span className='text-right'>
                            {formatCurrency(row.currentAmount)}
                          </span>
                          <span className='text-right'>
                            <div className='flex flex-col items-end gap-1'>
                              <div className='flex items-center gap-1'>
                                <Input
                                  type='number'
                                  min={0}
                                  max={100}
                                  step={0.5}
                                  className='h-7 w-16 px-1 text-right text-[11px] sm:text-xs'
                                  value={row.cutPct.toFixed(1)}
                                  disabled={row.isLocked}
                                  onChange={(e) => {
                                    const v = parseFloat(e.target.value)
                                    const cutPct = Number.isNaN(v)
                                      ? 0
                                      : Math.max(0, Math.min(100, v))
                                    setCustomCuts((prev) => {
                                      const existing = prev.find(
                                        (c) => c.value === row.value
                                      )
                                      if (existing) {
                                        return prev.map((c) =>
                                          c.value === row.value
                                            ? { ...c, cutPct }
                                            : c
                                        )
                                      }
                                      return [...prev, { value: row.value, cutPct }]
                                    })
                                  }}
                                />
                                <span className='text-[10px] text-muted-foreground'>
                                  %
                                </span>
                              </div>
                              <span className='text-[10px] text-muted-foreground'>
                                {formatCurrency(row.reductionAmount)}
                              </span>
                            </div>
                          </span>
                          <span className='text-right'>
                            {row.savingsPctOfIncome.toFixed(2)}%
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className='grid grid-cols-4 gap-2 border-t px-3 py-2 text-[11px] font-medium sm:text-xs'>
                      <span>Total</span>
                      <span />
                      <span />
                      <span className='text-right'>
                        ≈ {userPlan.totalSavingsPct.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}

