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
import { useYearlySavingsGoal } from '@/hooks/use-yearly-savings-goals'
import { useBudgetPlan } from '@/hooks/use-budget-plan'
import { convertCategoriesToOptions } from '@/features/transactions/utils/category-helpers'
import {
  Target,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  TrendingDown,
  Percent,
  Info,
  CheckCircle2,
  AlertCircle,
  Circle,
} from 'lucide-react'
import { useEffect, useMemo, useState, useRef, useCallback, memo } from 'react'
import { cn, formatCurrency } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

// Memoized Slider component to prevent infinite re-renders
const SavingsSlider = memo(
  ({
    value,
    onValueChange,
    onValueCommit,
    disabled,
  }: {
    value: number[]
    onValueChange: (value: number[]) => void
    onValueCommit: (value: number[]) => void
    disabled?: boolean
  }) => {
    // Use refs to prevent callback recreation
    const onValueChangeRef = useRef(onValueChange)
    const onValueCommitRef = useRef(onValueCommit)
    
    useEffect(() => {
      onValueChangeRef.current = onValueChange
      onValueCommitRef.current = onValueCommit
    }, [onValueChange, onValueCommit])

    const handleValueChange = useCallback((val: number[]) => {
      onValueChangeRef.current(val)
    }, [])

    const handleValueCommit = useCallback((val: number[]) => {
      onValueCommitRef.current(val)
    }, [])

    return (
      <Slider
        value={value}
        onValueChange={handleValueChange}
        onValueCommit={handleValueCommit}
        min={0}
        max={100}
        step={0.1}
        disabled={disabled}
        className='w-full'
      />
    )
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.value[0] === nextProps.value[0] &&
      prevProps.disabled === nextProps.disabled
    )
  }
)
SavingsSlider.displayName = 'SavingsSlider'

// Memoized Category Cut Slider component
const CategoryCutSlider = memo(
  ({
    value,
    onValueChange,
    disabled,
  }: {
    value: number
    onValueChange: (value: number) => void
    disabled?: boolean
  }) => {
    const onValueChangeRef = useRef(onValueChange)
    
    useEffect(() => {
      onValueChangeRef.current = onValueChange
    }, [onValueChange])

    const handleValueChange = useCallback((val: number[]) => {
      onValueChangeRef.current(val[0])
    }, [])

    return (
      <div className='flex items-center gap-2'>
        <Slider
          value={[value]}
          onValueChange={handleValueChange}
          min={0}
          max={100}
          step={0.5}
          disabled={disabled}
          className='w-24'
        />
        <span className='w-12 text-right text-xs font-medium'>
          {value.toFixed(1)}%
        </span>
      </div>
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.value === nextProps.value &&
      prevProps.disabled === nextProps.disabled
    )
  }
)
CategoryCutSlider.displayName = 'CategoryCutSlider'

export function Budget() {
  const { transactions, isLoading: transactionsLoading } = useTransactions()
  const { categories: dbCategories } = useCategories()

  const currentYear = new Date().getFullYear()

  const [selectedYear, setSelectedYear] = useState(currentYear)
  const { goal, updateGoal, isUpdating } = useYearlySavingsGoal(selectedYear)
  const { plan: savedPlan, updatePlan, isUpdating: isSavingPlan } = useBudgetPlan(selectedYear)
  
  // Local slider value - only sync from goal when year changes
  const [sliderValue, setSliderValue] = useState<number[]>([20])

  // Track the last synced year to prevent re-syncing
  const lastSyncedYearRef = useRef(selectedYear)
  const lastSyncedGoalIdRef = useRef<string | undefined>(undefined)
  const isUserInteractingRef = useRef(false)
  
  // Only sync when year changes or goal first loads (not on subsequent goal updates)
  useEffect(() => {
    // Don't sync if user is currently interacting with slider
    if (isUserInteractingRef.current) return
    
    const yearChanged = selectedYear !== lastSyncedYearRef.current
    const goalFirstLoad = goal && goal.id !== lastSyncedGoalIdRef.current
    
    if (yearChanged) {
      lastSyncedYearRef.current = selectedYear
      lastSyncedGoalIdRef.current = undefined // Reset to allow new goal to sync
    }
    
    if (yearChanged || goalFirstLoad) {
      if (goal) {
        setSliderValue([goal.savingsPercentage])
        lastSyncedGoalIdRef.current = goal.id
      } else {
        setSliderValue([20])
      }
    }
    // Only depend on selectedYear and goal.id, not goal.savingsPercentage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, goal?.id])
  
  // Stable callbacks
  const handleSliderChange = useCallback((value: number[]) => {
    isUserInteractingRef.current = true
    setSliderValue(value)
  }, [])
  
  const handleSliderCommit = useCallback((value: number[]) => {
    updateGoal(value[0])
    // Reset interaction flag after a delay to allow query to update
    setTimeout(() => {
      isUserInteractingRef.current = false
    }, 200)
  }, [updateGoal])
  
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

  // Filter to selected year (exclude savings type - they're calculated separately)
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
  
  // Calculate savings from explicit savings-type transactions
  const savingsTransactions = useMemo(
    () =>
      transactions.filter((t) => {
        const tDate = new Date(t.date)
        return t.type === 'savings' && tDate.getFullYear() === selectedYear
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

    // Savings = sum of all transactions with type='savings' (not income - expenses)
    const savingsCalc = savingsTransactions.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    )
    const savingsPct =
      totalIncomeCalc > 0 ? (savingsCalc / totalIncomeCalc) * 100 : 0

    return {
      totalIncome: totalIncomeCalc,
      totalExpenses: totalExpensesCalc,
      savings: savingsCalc,
      savingsPercentage: savingsPct,
      expenseByCategory: expenseDataByCategory,
    }
  }, [categories, incomeCategories, savingsCategories, expenseCategories, yearTransactions, savingsTransactions])

  // Calculate average income (across all years, excluding current year) - declared early
  const averageIncome = useMemo(() => {
    const incomeByYear: Record<number, number> = {}

    transactions.forEach((t) => {
      if (t.type === 'income') {
        const tDate = new Date(t.date)
        const year = tDate.getFullYear()
        if (year !== selectedYear) {
          if (!incomeByYear[year]) {
            incomeByYear[year] = 0
          }
          incomeByYear[year] += Math.abs(t.amount)
        }
      }
    })

    const values = Object.values(incomeByYear).filter(v => v > 0)
    return values.length > 0
      ? values.reduce((sum, val) => sum + val, 0) / values.length
      : 0
  }, [transactions, selectedYear])

  const targetSavingsPercentage = sliderValue[0]
  // Use average income for target calculations
  const targetSavingsAmount = averageIncome * (targetSavingsPercentage / 100)
  // For comparison, calculate what current savings would be as % of average income
  const savingsPercentageOfAvgIncome = averageIncome > 0 ? (savings / averageIncome) * 100 : 0
  const savingsDifference = savings - targetSavingsAmount
  const percentageDifference = savingsPercentageOfAvgIncome - targetSavingsPercentage
  const isBehindTarget = savingsDifference < 0
  const expenseReductionNeeded = isBehindTarget ? Math.abs(savingsDifference) : 0
  const expenseReductionPercentage =
    averageIncome > 0 ? (expenseReductionNeeded / averageIncome) * 100 : 0

  const targetExtraSavingsPct = isBehindTarget
    ? targetSavingsPercentage - savingsPercentageOfAvgIncome
    : 0

  // Calculate monthly savings needed to reach target
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() // 0-11
  const isCurrentYear = selectedYear === currentYear
  const remainingMonths = isCurrentYear ? 12 - currentMonth : 12
  const monthlySavingsNeeded = remainingMonths > 0 && isBehindTarget
    ? expenseReductionNeeded / remainingMonths
    : 0

  // Category budgets state - declared early so it can be used in useMemo hooks
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({})

  // Base monthly savings goal - user-defined target
  const [baseMonthlySavingsGoal, setBaseMonthlySavingsGoal] = useState<number>(0)

  // Calculate previous year spending per category
  const previousYearSpending = useMemo(() => {
    const prevYear = selectedYear - 1
    const prevYearTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date)
      return (
        t.type === 'expense' &&
        tDate.getFullYear() === prevYear
      )
    })

    const spending: Record<string, number> = {}
    expenseCategories.forEach((cat) => {
      spending[cat.value] = 0
    })

    prevYearTransactions.forEach((t) => {
      const category = t.category
      if (category && spending[category] !== undefined) {
        spending[category] += Math.abs(t.amount)
      }
    })

    return spending
  }, [transactions, selectedYear, expenseCategories])

  // Calculate average spending per category (across all years)
  const averageSpending = useMemo(() => {
    const yearSpending: Record<string, number[]> = {}
    expenseCategories.forEach((cat) => {
      yearSpending[cat.value] = []
    })

    // Group spending by year and category
    const spendingByYear: Record<number, Record<string, number>> = {}
    transactions.forEach((t) => {
      if (t.type === 'expense') {
        const tDate = new Date(t.date)
        const year = tDate.getFullYear()
        if (!spendingByYear[year]) {
          spendingByYear[year] = {}
          expenseCategories.forEach((cat) => {
            spendingByYear[year][cat.value] = 0
          })
        }
        const category = t.category
        if (category && spendingByYear[year][category] !== undefined) {
          spendingByYear[year][category] += Math.abs(t.amount)
        }
      }
    })

    // Calculate average for each category
    const averages: Record<string, number> = {}
    expenseCategories.forEach((cat) => {
      const values: number[] = []
      Object.keys(spendingByYear).forEach((yearStr) => {
        const year = parseInt(yearStr)
        if (year !== selectedYear && spendingByYear[year][cat.value] > 0) {
          values.push(spendingByYear[year][cat.value])
        }
      })
      averages[cat.value] =
        values.length > 0
          ? values.reduce((sum, val) => sum + val, 0) / values.length
          : 0
    })

    return averages
  }, [transactions, selectedYear, expenseCategories])

  // Build per-category reduction plan
  // Reduction % is based on average spending, not current spending
  const reductionPlan = useMemo(() => {
    if (!isBehindTarget || totalExpenses <= 0 || expenseReductionNeeded <= 0) {
      return []
    }

    return expenseCategories
      .map((cat) => {
        const currentAmount = expenseByCategory[cat.value] ?? 0
        const avgAmount = averageSpending[cat.value] ?? 0
        
        // Skip if no average spending (can't calculate reduction)
        if (avgAmount <= 0) return null

      // Calculate reduction based on average spending
      // Default reduction % is proportional to how much this category needs to contribute
      // Use average spending total for share calculation
      const avgTotalExpenses = Object.values(averageSpending).reduce((sum, val) => sum + val, 0)
      const shareOfExpenses = avgTotalExpenses > 0 ? avgAmount / avgTotalExpenses : 0
      const targetReductionAmount = expenseReductionNeeded * shareOfExpenses
      const defaultReductionPct = avgAmount > 0 
        ? (targetReductionAmount / avgAmount) * 100 
        : 0

      return {
        label: cat.label,
        value: cat.value,
        currentAmount,
        avgAmount,
        shareOfExpenses,
        defaultReductionPct,
        savingsPctOfIncome: expenseReductionPercentage * shareOfExpenses,
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
    averageSpending,
    averageIncome,
  ])

  // Allow user to adjust cuts per category
  const [customCuts, setCustomCuts] = useState<
    { value: string; cutPct: number }[]
  >([])

  const [lockedCategories, setLockedCategories] = useState<string[]>([])

  // Track if we're loading vs user making changes
  const isLoadingPlanRef = useRef(false)

  // Load saved plan from database or initialize from computed plan
  useEffect(() => {
    isLoadingPlanRef.current = true

    if (savedPlan) {
      // Load saved plan
      setCustomCuts(savedPlan.customCuts)
      setLockedCategories(savedPlan.lockedCategories)
      setCategoryBudgets(savedPlan.categoryBudgets || {})
      setBaseMonthlySavingsGoal(savedPlan.baseMonthlySavingsGoal || 0)
    } else if (!isBehindTarget || reductionPlan.length === 0) {
      // No saved plan and no reduction needed
      setCustomCuts([])
      setLockedCategories([])
      setCategoryBudgets({})
      setBaseMonthlySavingsGoal(0)
    } else {
      // Initialize from computed plan (only if no saved plan exists)
      setCustomCuts(
        reductionPlan.map((row) => ({
          value: row.value,
          cutPct: row.defaultReductionPct ?? 0,
        }))
      )
      setLockedCategories([])
      setCategoryBudgets({})
      setBaseMonthlySavingsGoal(0)
    }

    // Reset loading flag after state updates
    setTimeout(() => {
      isLoadingPlanRef.current = false
    }, 100)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedPlan?.id, isBehindTarget, reductionPlan.length, selectedYear])

  // Save plan to database when customCuts, lockedCategories, categoryBudgets, or baseMonthlySavingsGoal change (debounced)
  useEffect(() => {
    if (isLoadingPlanRef.current) {
      return
    }

    const timeoutId = setTimeout(() => {
      updatePlan({
        customCuts,
        lockedCategories,
        categoryBudgets,
        baseMonthlySavingsGoal,
      })
    }, 1000) // Debounce by 1 second

    return () => clearTimeout(timeoutId)
  }, [customCuts, lockedCategories, categoryBudgets, baseMonthlySavingsGoal, updatePlan])

  const userPlan = useMemo(() => {
    if (reductionPlan.length === 0 || averageIncome <= 0) {
      return {
        rows: [] as (typeof reductionPlan)[number][],
        totalSavingsPct: 0,
      }
    }

    const monthlyIncome = averageIncome / 12

    const rows = reductionPlan.map((row) => {
      const isLocked = lockedCategories.includes(row.value)
      const custom = customCuts.find((c) => c.value === row.value)
      const baseCutPct = custom ? custom.cutPct : (row.defaultReductionPct ?? 0)
      const cutPct = isLocked ? 0 : baseCutPct

      // Calculate monthly average and reduction
      const avgMonthlyAmount = row.avgAmount / 12
      const monthlyReductionAmount = (avgMonthlyAmount * cutPct) / 100
      const monthlySavingsPctOfIncome =
        monthlyIncome > 0 ? (monthlyReductionAmount / monthlyIncome) * 100 : 0

      return {
        ...row,
        isLocked,
        cutPct,
        avgMonthlyAmount,
        monthlyReductionAmount,
        monthlySavingsPctOfIncome,
      }
    })

    const totalSavingsPct = rows.reduce(
      (sum, r) => sum + r.monthlySavingsPctOfIncome,
      0
    )

    return { rows, totalSavingsPct }
  }, [reductionPlan, customCuts, averageIncome, lockedCategories])

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
              Year
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

        {/* Expense Reduction Plan - Integrated with Target */}
        <div>
          <Card>
            <CardHeader>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='flex items-center gap-2 text-lg font-semibold'>
                    <TrendingDown className='h-5 w-5 text-orange-600' />
                    Expense Reduction Plan
                  </CardTitle>
                </div>

                {/* Savings Summary */}
                <div className='rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/20'>
                  {/* Current Year Actual Savings */}
                  <div className='mb-3 rounded-md border border-blue-300 bg-blue-100/50 p-3 dark:border-blue-800 dark:bg-blue-900/30'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <div className='text-xs font-medium text-blue-900 dark:text-blue-100'>
                          Current {selectedYear} Savings
                        </div>
                        <div className='mt-0.5 text-xs text-blue-700 dark:text-blue-300'>
                          Actual savings transactions recorded this year
                        </div>
                      </div>
                      <div className='text-right'>
                        <div className='text-2xl font-bold text-blue-600'>
                          {formatCurrency(savings)}
                        </div>
                        <div className='text-xs text-blue-600'>
                          {formatCurrency(savings / 12)}/month avg
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='grid grid-cols-3 gap-4 text-xs'>
                    <div className='text-center'>
                      <div className='text-muted-foreground'>Base Monthly Savings</div>
                      <div className='mt-1 flex items-center justify-center gap-1'>
                        <span className='text-lg font-semibold text-teal-600'>$</span>
                        <Input
                          type='number'
                          min='0'
                          step='50'
                          value={baseMonthlySavingsGoal}
                          onChange={(e) => setBaseMonthlySavingsGoal(parseFloat(e.target.value) || 0)}
                          className='h-8 w-28 text-center text-lg font-bold text-teal-600'
                        />
                      </div>
                      <div className='mt-1 text-xs text-muted-foreground'>
                        End of Year: {formatCurrency(baseMonthlySavingsGoal * 12)}
                      </div>
                    </div>
                    <div className='text-center'>
                      <div className='text-muted-foreground'>Additional Savings</div>
                      <div className='mt-1 text-2xl font-bold text-green-600'>
                        {formatCurrency(userPlan.rows.reduce((sum, row) => sum + row.monthlyReductionAmount, 0))}
                      </div>
                      <div className='mt-0.5 text-sm font-semibold text-green-600'>
                        {baseMonthlySavingsGoal > 0
                          ? `+${((userPlan.rows.reduce((sum, row) => sum + row.monthlyReductionAmount, 0) / baseMonthlySavingsGoal) * 100).toFixed(1)}%`
                          : ''
                        }
                      </div>
                      <div className='mt-1 text-xs text-muted-foreground'>
                        End of Year: {formatCurrency(userPlan.rows.reduce((sum, row) => sum + row.monthlyReductionAmount, 0) * 12)}
                      </div>
                    </div>
                    <div className='text-center'>
                      <div className='text-muted-foreground'>Combined Total</div>
                      <div className='mt-1 text-2xl font-bold text-purple-600'>
                        {formatCurrency(
                          baseMonthlySavingsGoal +
                          userPlan.rows.reduce((sum, row) => sum + row.monthlyReductionAmount, 0)
                        )}
                      </div>
                      <div className='mt-1 text-xs text-muted-foreground'>
                        End of Year: {formatCurrency((baseMonthlySavingsGoal + userPlan.rows.reduce((sum, row) => sum + row.monthlyReductionAmount, 0)) * 12)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {reductionPlan.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-8 text-center'>
                  <Target className='mb-2 h-12 w-12 text-muted-foreground' />
                  <p className='text-sm font-medium text-foreground'>
                    {Object.keys(categoryBudgets).length > 0 && 
                     Object.values(categoryBudgets).some(b => b > 0)
                      ? 'All categories are within budget!'
                      : 'No expense categories to reduce'}
                  </p>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    {Object.keys(categoryBudgets).length > 0 && 
                     Object.values(categoryBudgets).some(b => b > 0)
                      ? 'Set budgets above to see reduction plans based on actual vs budget.'
                      : 'Add expense transactions or set category budgets to see reduction options.'}
                  </p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {/* Categories Table */}
                  <div className='rounded-lg border bg-card'>
                    <div className='grid grid-cols-7 gap-3 border-b bg-muted/30 px-4 py-3 text-xs font-medium text-foreground'>
                      <span className='flex items-center gap-1'>
                        Category
                        <Info className='h-3 w-3 text-muted-foreground' />
                      </span>
                      <span className='text-right'>Previous Year</span>
                      <span className='text-right'>Average</span>
                      <span className='text-right'>Avg Monthly</span>
                      <span className='text-right'>Reduction %</span>
                      <span className='text-right'>Savings Amount</span>
                      <span className='text-right'>% of Income</span>
                    </div>
                    <div className='max-h-96 space-y-0 divide-y overflow-y-auto'>
                      {userPlan.rows.map((row) => {
                        const categoryIcon = categories.find(
                          (cat) => cat.value === row.value
                        )?.icon
                        const IconComponent = categoryIcon || Circle
                        const prevYearAmount = previousYearSpending[row.value] || 0
                        const avgAmount = averageSpending[row.value] || 0

                        return (
                          <div
                            key={row.value}
                            className={cn(
                              'grid grid-cols-7 gap-3 px-4 py-3 text-xs transition-colors hover:bg-muted/50',
                              row.isLocked && 'bg-muted/20 opacity-75'
                            )}
                          >
                            <div className='flex items-center gap-2'>
                              <button
                                type='button'
                                className={cn(
                                  'inline-flex h-6 w-6 items-center justify-center rounded-md border transition-colors',
                                  row.isLocked
                                    ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400'
                                    : 'border-border bg-background text-muted-foreground hover:bg-muted'
                                )}
                                onClick={() => {
                                  setLockedCategories((prev) =>
                                    prev.includes(row.value)
                                      ? prev.filter((v) => v !== row.value)
                                      : [...prev, row.value]
                                  )
                                }}
                                title={
                                  row.isLocked
                                    ? 'Unlock to allow changes'
                                    : 'Lock to prevent changes'
                                }
                              >
                                {row.isLocked ? (
                                  <Lock className='h-3 w-3' />
                                ) : (
                                  <Unlock className='h-3 w-3' />
                                )}
                              </button>
                              <IconComponent className='h-4 w-4 text-muted-foreground' />
                              <span
                                className={cn(
                                  'truncate font-medium',
                                  row.isLocked && 'text-muted-foreground'
                                )}
                              >
                                {row.label}
                              </span>
                            </div>
                            <div className='flex items-center justify-end'>
                              <span className='text-muted-foreground text-[10px]'>
                                {prevYearAmount > 0 ? formatCurrency(prevYearAmount) : '-'}
                              </span>
                            </div>
                            <div className='flex items-center justify-end'>
                              <span className='text-muted-foreground text-[10px]'>
                                {avgAmount > 0 ? formatCurrency(avgAmount) : '-'}
                              </span>
                            </div>
                            <div className='flex items-center justify-end'>
                              <span className='text-muted-foreground text-[10px]'>
                                {row.avgMonthlyAmount > 0 ? formatCurrency(row.avgMonthlyAmount) : '-'}
                              </span>
                            </div>
                            <div className='flex items-center justify-end'>
                              <CategoryCutSlider
                                value={row.cutPct ?? 0}
                                disabled={row.isLocked}
                                onValueChange={(cutPct) => {
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
                            </div>
                            <div className='flex items-center justify-end'>
                              <span className='font-medium text-green-600'>
                                {formatCurrency(row.monthlyReductionAmount)}
                              </span>
                            </div>
                            <div className='flex items-center justify-end'>
                              <span className='font-medium'>
                                {row.monthlySavingsPctOfIncome.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className='grid grid-cols-7 gap-3 border-t bg-muted/30 px-4 py-3 text-xs font-semibold'>
                      <span>Total</span>
                      <span className='text-right text-muted-foreground'>
                        {formatCurrency(
                          Object.values(previousYearSpending).reduce((sum, val) => sum + val, 0)
                        )}
                      </span>
                      <span className='text-right text-muted-foreground'>
                        {formatCurrency(
                          Object.values(averageSpending).reduce((sum, val) => sum + val, 0)
                        )}
                      </span>
                      <span className='text-right text-muted-foreground'>
                        {formatCurrency(
                          Object.values(averageSpending).reduce((sum, val) => sum + val, 0) / 12
                        )}
                      </span>
                      <span />
                      <span className='text-right text-green-600'>
                        {formatCurrency(
                          userPlan.rows.reduce(
                            (sum, row) => sum + row.monthlyReductionAmount,
                            0
                          )
                        )}
                      </span>
                      <span className='text-right'>
                        {userPlan.totalSavingsPct.toFixed(2)}%
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

