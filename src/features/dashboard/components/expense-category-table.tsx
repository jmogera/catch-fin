import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, PiggyBank } from 'lucide-react'
import { useTransactions } from '@/hooks/use-transactions'
import { useCategories } from '@/hooks/use-categories'
import { convertCategoriesToOptions } from '@/features/transactions/utils/category-helpers'
import { useMemo } from 'react'
import { isFuture } from 'date-fns'
import { HelpCircle } from 'lucide-react'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

type ExpenseCategoryTableProps = {
  selectedYear?: number
  onYearChange?: (year: number) => void
}

export function ExpenseCategoryTable({ 
  selectedYear: propSelectedYear, 
  onYearChange 
}: ExpenseCategoryTableProps = {}) {
  const currentYear = new Date().getFullYear()
  const [internalSelectedYear, setInternalSelectedYear] = useState(currentYear)
  const selectedYear = propSelectedYear ?? internalSelectedYear
  const setSelectedYear = onYearChange ?? setInternalSelectedYear
  const navigate = useNavigate()
  const { transactions } = useTransactions()
  const { categories: dbCategories } = useCategories()
  
  const categories = useMemo(() => convertCategoriesToOptions(dbCategories), [dbCategories])

  // Get income, expense, and savings categories
  const incomeCategories = categories.filter((cat) => {
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

  const savingsCategories = categories.filter((cat) => {
    const isExplicitSavings =
      cat.value === 'savings' ||
      cat.value === 'saving' ||
      cat.value === 'savings-account' ||
      cat.value === 'savings_account'

    const labelIndicatesSavings = /saving/i.test(cat.label)
    const valueIndicatesSavings = /saving/i.test(cat.value)

    return isExplicitSavings || labelIndicatesSavings || valueIndicatesSavings
  })

  // Expense categories: exclude income AND savings categories
  const expenseCategories = categories.filter((cat) => {
    const isIncome = incomeCategories.some((incomeCat) => incomeCat.value === cat.value)
    const isSavings = savingsCategories.some((savingsCat) => savingsCat.value === cat.value)
    return !isIncome && !isSavings
  })

  const handleCellClick = (
    category: string | undefined,
    monthIndex: number,
    type: 'income' | 'expense' | 'savings'
  ) => {
    const month = monthIndex + 1 // 1-12 for URL
    // For savings, show ONLY type='savings' transactions
    const transactionTypes = type === 'savings' ? ['savings'] : [type]
    navigate({
      to: '/transactions',
      search: {
        page: 1,
        pageSize: 10,
        filter: '',
        type: transactionTypes,
        category: category ? [category] : '__uncategorized__', // special marker for uncategorized
        month,
        year: selectedYear,
      },
    })
  }

  // Calculate income, expenses, and savings by category and month
  // Recalculate when selectedYear or transactions change
  const { income: incomeData, expense: expenseData, savings: savingsData } = useMemo(() => {
    const incomeData: Record<string, Record<number, number>> = {}
    const expenseData: Record<string, Record<number, number>> = {}
    const savingsData: Record<string, Record<number, number>> = {}
    const uncategorizedIncomeData: Record<number, number> = {}
    const uncategorizedExpenseData: Record<number, number> = {}
    const uncategorizedSavingsData: Record<number, number> = {}

    // Initialize uncategorized
    for (let month = 0; month < 12; month++) {
      uncategorizedIncomeData[month] = 0
      uncategorizedExpenseData[month] = 0
      uncategorizedSavingsData[month] = 0
    }

    incomeCategories.forEach((category) => {
      incomeData[category.value] = {}
      for (let month = 0; month < 12; month++) {
        incomeData[category.value][month] = 0
      }
    })

    expenseCategories.forEach((category) => {
      // Double-check: ensure this is not a savings category
      const isSavings = savingsCategories.some((sc) => sc.value === category.value)
      if (!isSavings) {
        expenseData[category.value] = {}
        for (let month = 0; month < 12; month++) {
          expenseData[category.value][month] = 0
        }
      }
    })

    // Only process savings-type transactions for savings section
    // First, collect all unique categories from savings transactions
    const savingsTransactionCategories = new Set<string>()
    transactions
      .filter((t) => {
        const tDate = new Date(t.date)
        return t.type === 'savings' && tDate.getFullYear() === selectedYear
      })
      .forEach((t) => {
        if (t.category) {
          savingsTransactionCategories.add(t.category)
        }
      })

    // Initialize savingsData only for categories that have savings transactions
    savingsTransactionCategories.forEach((categoryValue) => {
      savingsData[categoryValue] = {}
      for (let month = 0; month < 12; month++) {
        savingsData[categoryValue][month] = 0
      }
    })

    // Process income and expense transactions (exclude savings type)
    transactions
      .filter((t) => {
        const tDate = new Date(t.date)
        return (
          (t.type === 'income' || t.type === 'expense') &&
          tDate.getFullYear() === selectedYear
        )
      })
      .forEach((transaction) => {
        const tDate = new Date(transaction.date)
        const month = tDate.getMonth()
        const category = transaction.category
        const amount = Math.abs(transaction.amount)

        if (transaction.type === 'income') {
          if (!category) {
            uncategorizedIncomeData[month] += amount
          } else if (incomeData[category] && incomeData[category][month] !== undefined) {
            incomeData[category][month] += amount
          }
        } else if (transaction.type === 'expense') {
          if (!category) {
            uncategorizedExpenseData[month] += amount
          } else if (expenseData[category] && expenseData[category][month] !== undefined) {
            expenseData[category][month] += amount
          }
        }
      })

    // Process ONLY savings-type transactions for savings section
    transactions
      .filter((t) => {
        const tDate = new Date(t.date)
        return t.type === 'savings' && tDate.getFullYear() === selectedYear
      })
      .forEach((transaction) => {
        const tDate = new Date(transaction.date)
        const month = tDate.getMonth()
        const category = transaction.category
        const amount = Math.abs(transaction.amount)

        if (category && savingsData[category] && savingsData[category][month] !== undefined) {
          savingsData[category][month] += amount
        } else if (!category) {
          uncategorizedSavingsData[month] += amount
        }
      })

    return {
      income: { categorized: incomeData, uncategorized: uncategorizedIncomeData },
      expense: { categorized: expenseData, uncategorized: uncategorizedExpenseData },
      savings: { categorized: savingsData, uncategorized: uncategorizedSavingsData },
    }
  }, [transactions, selectedYear, incomeCategories, expenseCategories])

  // Calculate uncategorized totals
  const uncategorizedIncomeTotal = Object.values(incomeData.uncategorized).reduce(
    (sum, val) => sum + val,
    0
  )
  const uncategorizedExpenseTotal = Object.values(expenseData.uncategorized).reduce(
    (sum, val) => sum + val,
    0
  )

  // Calculate totals for each month
  // Note: Net Total = Income - Expenses (savings are excluded from this calculation)
  const calculateMonthTotals = () => {
    const totals: Record<number, { income: number; expense: number; net: number }> = {}
    for (let month = 0; month < 12; month++) {
      // Calculate income total (excluding savings categories)
      let incomeTotal = incomeData.uncategorized[month] || 0
      incomeCategories.forEach((category) => {
        incomeTotal += incomeData.categorized[category.value]?.[month] || 0
      })

      // Calculate expense total (excluding savings categories)
      let expenseTotal = expenseData.uncategorized[month] || 0
      expenseCategories.forEach((category) => {
        expenseTotal += expenseData.categorized[category.value]?.[month] || 0
      })

      // Net = Income - Expenses (savings are tracked separately)
      totals[month] = {
        income: incomeTotal,
        expense: expenseTotal,
        net: incomeTotal - expenseTotal,
      }
    }
    return totals
  }

  const monthTotals = calculateMonthTotals()

  // Calculate savings totals for each month
  // Savings = sum of all transactions with type='savings' (by category and uncategorized)
  const calculateSavingsTotals = () => {
    const savingsTotalsByMonth: Record<number, number> = {}
    for (let month = 0; month < 12; month++) {
      let savingsTotal = savingsData.uncategorized[month] || 0
      // Sum all categories that have savings data (from type='savings' transactions)
      Object.keys(savingsData.categorized).forEach((categoryValue) => {
        savingsTotal += savingsData.categorized[categoryValue]?.[month] || 0
      })
      savingsTotalsByMonth[month] = savingsTotal
    }
    return savingsTotalsByMonth
  }

  const savingsTotalsByMonth = calculateSavingsTotals()
  const totalSavingsRaw = Object.values(savingsTotalsByMonth).reduce((sum, val) => sum + val, 0)
  const totalSavings = totalSavingsRaw < 0 ? 0 : totalSavingsRaw

  // Get categories that actually have savings transactions (type='savings')
  const actualSavingsCategories = useMemo(() => {
    const categoryValues = new Set<string>()
    transactions
      .filter((t) => {
        const tDate = new Date(t.date)
        return t.type === 'savings' && tDate.getFullYear() === selectedYear && t.category
      })
      .forEach((t) => {
        if (t.category) categoryValues.add(t.category)
      })

    // Convert to CategoryOption format for display
    return categories.filter((cat) => categoryValues.has(cat.value))
  }, [transactions, selectedYear, categories])

  // Calculate totals for each category
  const calculateCategoryTotals = () => {
    const incomeTotals: Record<string, number> = {}
    const expenseTotals: Record<string, number> = {}
    const savingsTotals: Record<string, number> = {}

    incomeCategories.forEach((category) => {
      incomeTotals[category.value] = 0
      for (let month = 0; month < 12; month++) {
        incomeTotals[category.value] += incomeData.categorized[category.value]?.[month] || 0
      }
    })

    expenseCategories.forEach((category) => {
      expenseTotals[category.value] = 0
      for (let month = 0; month < 12; month++) {
        expenseTotals[category.value] += expenseData.categorized[category.value]?.[month] || 0
      }
    })

    // Only calculate totals for categories that have savings transactions
    actualSavingsCategories.forEach((category) => {
      savingsTotals[category.value] = 0
      for (let month = 0; month < 12; month++) {
        savingsTotals[category.value] += savingsData.categorized[category.value]?.[month] || 0
      }
    })

    return { income: incomeTotals, expense: expenseTotals, savings: savingsTotals }
  }

  const categoryTotals = calculateCategoryTotals()

  // Calculate total income, expenses, and savings for the selected year
  const totalIncomeForYear = Object.values(monthTotals).reduce((sum, val) => sum + val.income, 0)
  const totalExpensesForYear = Object.values(monthTotals).reduce((sum, val) => sum + val.expense, 0)
  // Savings Total = sum of all transactions with type='savings' (from savingsData)
  const totalSavingsForYear = totalSavings
  
  // Calculate percentages
  const expensePercentageForYear = totalIncomeForYear > 0 ? (totalExpensesForYear / totalIncomeForYear) * 100 : 0
  const savingsPercentageForYear = totalIncomeForYear > 0 ? (totalSavingsForYear / totalIncomeForYear) * 100 : 0

  const isCurrentYear = selectedYear === currentYear

  return (
    <div className='space-y-4'>
      <div>
        <h3 className='text-lg font-semibold'>Income & Expenses by Category</h3>
        <p className='text-sm text-muted-foreground'>
          Monthly breakdown of income and expenses by category
        </p>
      </div>

      <div className='overflow-x-auto rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='sticky left-0 z-10 bg-background font-semibold border-r'>
                Category
              </TableHead>
              {months.map((month, index) => {
                const monthDate = new Date(selectedYear, index, 1)
                const isFutureMonth = isCurrentYear && isFuture(monthDate)
                return (
                  <TableHead
                    key={index}
                    className={`text-center ${
                      isFutureMonth ? 'text-muted-foreground' : ''
                    }`}
                  >
                    {month}
                  </TableHead>
                )
              })}
              <TableHead className='text-right font-semibold'>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* SAVINGS SECTION */}
            {/* SAVINGS TOTAL ROW - moved to top */}
            <TableRow className='bg-blue-50/50 dark:bg-blue-950/10 border-b-2 border-blue-200 dark:border-blue-800'>
              <TableCell className='sticky left-0 z-10 bg-blue-50/50 dark:bg-blue-950/10 font-semibold border-r'>
                <div className='flex items-center gap-2'>
                  <PiggyBank className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                  <span className='font-semibold'>Savings</span>
                </div>
              </TableCell>
              {months.map((_, monthIndex) => {
                const monthDate = new Date(selectedYear, monthIndex, 1)
                const isFutureMonth = isCurrentYear && isFuture(monthDate)
                // Savings Total = sum of all type='savings' transactions for that month
                const savings = savingsTotalsByMonth[monthIndex] || 0
                const displaySavings = savings < 0 ? 0 : savings

                return (
                  <TableCell
                    key={monthIndex}
                    className={`text-center font-semibold ${
                      isFutureMonth
                        ? 'text-muted-foreground'
                        : 'text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {isFutureMonth ? '-' : formatCurrency(displaySavings)}
                  </TableCell>
                )
              })}
              <TableCell className='text-right font-semibold text-blue-600 dark:text-blue-400'>
                <div className='flex flex-col items-end'>
                  <div>{totalSavingsForYear > 0 ? formatCurrency(totalSavingsForYear) : '$0'}</div>
                  {totalIncomeForYear > 0 && (
                    <div className='text-xs font-normal text-muted-foreground'>
                      {savingsPercentageForYear.toFixed(1)}% of income
                    </div>
                  )}
                </div>
              </TableCell>
            </TableRow>

            {/* Only show categories that have type='savings' transactions */}
            {actualSavingsCategories.map((category) => {
              const categoryTotal = categoryTotals.savings[category.value] || 0
              return (
                <TableRow key={category.value} className='bg-blue-50/30 dark:bg-blue-950/5'>
                  <TableCell className='sticky left-0 z-10 bg-blue-50/30 dark:bg-blue-950/5 font-medium border-r'>
                    <div className='flex items-center gap-2'>
                      {category.icon && (
                        <category.icon className='h-4 w-4 text-muted-foreground' />
                      )}
                      {category.label}
                    </div>
                  </TableCell>
                  {months.map((_, monthIndex) => {
                    const monthDate = new Date(selectedYear, monthIndex, 1)
                    const isFutureMonth = isCurrentYear && isFuture(monthDate)
                    const amount = savingsData.categorized[category.value]?.[monthIndex] || 0

                    const displayAmount = amount < 0 ? 0 : amount
                    return (
                      <TableCell
                        key={monthIndex}
                        onClick={() =>
                          !isFutureMonth &&
                          handleCellClick(category.value, monthIndex, 'savings')
                        }
                        className={`text-center ${
                          isFutureMonth
                            ? 'text-muted-foreground'
                            : 'text-blue-600 dark:text-blue-400'
                        } ${
                          isFutureMonth ? '' : 'cursor-pointer hover:bg-muted/50'
                        }`}
                      >
                        {isFutureMonth
                          ? '-'
                          : displayAmount > 0
                            ? formatCurrency(displayAmount)
                            : '$0'}
                      </TableCell>
                    )
                  })}
                  <TableCell className='text-right font-medium text-blue-600 dark:text-blue-400'>
                    {categoryTotal > 0 ? formatCurrency(categoryTotal) : '$0'}
                  </TableCell>
                </TableRow>
              )
            })}

            {/* Uncategorized Savings row (if there are uncategorized savings transactions) */}
            {(() => {
              const uncategorizedSavingsTotal = Object.values(savingsData.uncategorized).reduce(
                (sum, val) => sum + val,
                0
              )
              if (uncategorizedSavingsTotal === 0) return null

              return (
                <TableRow className='bg-blue-50/30 dark:bg-blue-950/5'>
                  <TableCell className='sticky left-0 z-10 bg-blue-50/30 dark:bg-blue-950/5 font-medium border-r cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-950/20'>
                    <div className='flex items-center gap-2'>
                      <HelpCircle className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                      <span className='font-semibold'>Uncategorized (Savings)</span>
                    </div>
                  </TableCell>
                  {months.map((_, monthIndex) => {
                    const monthDate = new Date(selectedYear, monthIndex, 1)
                    const isFutureMonth = isCurrentYear && isFuture(monthDate)
                    const amount = savingsData.uncategorized[monthIndex] || 0
                    const displayAmount = amount < 0 ? 0 : amount

                    return (
                      <TableCell
                        key={monthIndex}
                        onClick={() =>
                          !isFutureMonth && handleCellClick(undefined, monthIndex, 'savings')
                        }
                        className={`text-center ${
                          isFutureMonth
                            ? 'text-muted-foreground'
                            : 'text-blue-600 dark:text-blue-400 cursor-pointer hover:bg-muted/50'
                        }`}
                      >
                        {isFutureMonth
                          ? '-'
                          : displayAmount > 0
                            ? formatCurrency(displayAmount)
                            : '$0'}
                      </TableCell>
                    )
                  })}
                  <TableCell className='text-right font-medium text-blue-600 dark:text-blue-400'>
                    {uncategorizedSavingsTotal > 0
                      ? formatCurrency(uncategorizedSavingsTotal)
                      : '$0'}
                  </TableCell>
                </TableRow>
              )
            })()}

            {/* INCOME SECTION */}
            {/* Uncategorized Income row */}
            <TableRow className='bg-green-50/50 dark:bg-green-950/10'>
              <TableCell className='sticky left-0 z-10 bg-green-50/50 dark:bg-green-950/10 font-medium border-r cursor-pointer hover:bg-green-100/50 dark:hover:bg-green-950/20'>
                <div className='flex items-center gap-2'>
                  <HelpCircle className='h-4 w-4 text-green-600 dark:text-green-400' />
                  <span className='font-semibold'>Uncategorized (Income)</span>
                </div>
              </TableCell>
              {months.map((_, monthIndex) => {
                const monthDate = new Date(selectedYear, monthIndex, 1)
                const isFutureMonth = isCurrentYear && isFuture(monthDate)
                const amount = incomeData.uncategorized[monthIndex] || 0

                return (
                  <TableCell
                    key={monthIndex}
                    onClick={() =>
                      !isFutureMonth && handleCellClick(undefined, monthIndex, 'income')
                    }
                    className={`text-center text-green-600 dark:text-green-400 ${
                      isFutureMonth
                        ? 'text-muted-foreground'
                        : 'cursor-pointer hover:bg-green-100/50 dark:hover:bg-green-950/20'
                    }`}
                  >
                    {isFutureMonth
                      ? '-'
                      : amount > 0
                        ? formatCurrency(amount)
                        : '$0'}
                  </TableCell>
                )
              })}
              <TableCell className='text-right font-medium text-green-600 dark:text-green-400'>
                {uncategorizedIncomeTotal > 0
                  ? formatCurrency(uncategorizedIncomeTotal)
                  : '$0'}
              </TableCell>
            </TableRow>
            {/* Income categories */}
            {incomeCategories.map((category) => {
              const categoryTotal = categoryTotals.income[category.value] || 0
              return (
                <TableRow key={category.value}>
                  <TableCell className='sticky left-0 z-10 bg-background font-medium border-r'>
                    <div className='flex items-center gap-2'>
                      {category.icon && (
                        <category.icon className='h-4 w-4 text-muted-foreground' />
                      )}
                      {category.label}
                    </div>
                  </TableCell>
                  {months.map((_, monthIndex) => {
                    const monthDate = new Date(selectedYear, monthIndex, 1)
                    const isFutureMonth = isCurrentYear && isFuture(monthDate)
                    const amount = incomeData.categorized[category.value]?.[monthIndex] || 0

                    return (
                      <TableCell
                        key={monthIndex}
                        onClick={() =>
                          !isFutureMonth &&
                          handleCellClick(category.value, monthIndex, 'income')
                        }
                        className={`text-center text-green-600 dark:text-green-400 ${
                          isFutureMonth
                            ? 'text-muted-foreground'
                            : 'cursor-pointer hover:bg-muted/50'
                        }`}
                      >
                        {isFutureMonth
                          ? '-'
                          : amount > 0
                            ? formatCurrency(amount)
                            : '$0'}
                      </TableCell>
                    )
                  })}
                  <TableCell className='text-right font-medium text-green-600 dark:text-green-400'>
                    {categoryTotal > 0 ? formatCurrency(categoryTotal) : '$0'}
                  </TableCell>
                </TableRow>
              )
            })}

            {/* EXPENSE SECTION */}
            {/* Uncategorized Expense row */}
            <TableRow className='bg-amber-50/50 dark:bg-amber-950/10'>
              <TableCell className='sticky left-0 z-10 bg-amber-50/50 dark:bg-amber-950/10 font-medium border-r cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-950/20'>
                <div className='flex items-center gap-2'>
                  <HelpCircle className='h-4 w-4 text-amber-600 dark:text-amber-400' />
                  <span className='font-semibold'>Uncategorized (Expense)</span>
                </div>
              </TableCell>
              {months.map((_, monthIndex) => {
                const monthDate = new Date(selectedYear, monthIndex, 1)
                const isFutureMonth = isCurrentYear && isFuture(monthDate)
                const amount = expenseData.uncategorized[monthIndex] || 0

                return (
                  <TableCell
                    key={monthIndex}
                    onClick={() =>
                      !isFutureMonth && handleCellClick(undefined, monthIndex, 'expense')
                    }
                    className={`text-center text-red-600 dark:text-red-400 ${
                      isFutureMonth
                        ? 'text-muted-foreground'
                        : 'cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-950/20'
                    }`}
                  >
                    {isFutureMonth
                      ? '-'
                      : amount > 0
                        ? formatCurrency(amount)
                        : '$0'}
                  </TableCell>
                )
              })}
              <TableCell className='text-right font-medium text-red-600 dark:text-red-400'>
                <div className='flex flex-col items-end'>
                  <div>
                    {uncategorizedExpenseTotal > 0
                      ? formatCurrency(uncategorizedExpenseTotal)
                      : '$0'}
                  </div>
                  {totalIncomeForYear > 0 && uncategorizedExpenseTotal > 0 && (
                    <div className='text-xs font-normal text-muted-foreground'>
                      {((uncategorizedExpenseTotal / totalIncomeForYear) * 100).toFixed(1)}% of income
                    </div>
                  )}
                </div>
              </TableCell>
            </TableRow>
            {/* Expense categories */}
            {expenseCategories
              .filter((cat) => {
                // Final safeguard: ensure this is not a savings category
                return !savingsCategories.some((sc) => sc.value === cat.value)
              })
              .map((category) => {
                const categoryTotal = categoryTotals.expense[category.value] || 0
                return (
                <TableRow key={category.value}>
                  <TableCell className='sticky left-0 z-10 bg-background font-medium border-r'>
                    <div className='flex items-center gap-2'>
                      {category.icon && (
                        <category.icon className='h-4 w-4 text-muted-foreground' />
                      )}
                      {category.label}
                    </div>
                  </TableCell>
                  {months.map((_, monthIndex) => {
                    const monthDate = new Date(selectedYear, monthIndex, 1)
                    const isFutureMonth = isCurrentYear && isFuture(monthDate)
                    const amount = expenseData.categorized[category.value]?.[monthIndex] || 0

                    return (
                      <TableCell
                        key={monthIndex}
                        onClick={() =>
                          !isFutureMonth &&
                          handleCellClick(category.value, monthIndex, 'expense')
                        }
                        className={`text-center text-red-600 dark:text-red-400 ${
                          isFutureMonth
                            ? 'text-muted-foreground'
                            : 'cursor-pointer hover:bg-muted/50'
                        }`}
                      >
                        {isFutureMonth
                          ? '-'
                          : amount > 0
                            ? formatCurrency(amount)
                            : '$0'}
                      </TableCell>
                    )
                  })}
                  <TableCell className='text-right font-medium text-red-600 dark:text-red-400'>
                    <div className='flex flex-col items-end'>
                      <div>{categoryTotal > 0 ? formatCurrency(categoryTotal) : '$0'}</div>
                      {totalIncomeForYear > 0 && categoryTotal > 0 && (
                        <div className='text-xs font-normal text-muted-foreground'>
                          {((categoryTotal / totalIncomeForYear) * 100).toFixed(1)}% of income
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}

            {/* NET TOTAL ROW */}
            <TableRow className='bg-muted/50 font-semibold'>
              <TableCell className='sticky left-0 z-10 bg-muted/50 font-semibold border-r'>
                Net Total
              </TableCell>
              {months.map((_, monthIndex) => {
                const monthDate = new Date(selectedYear, monthIndex, 1)
                const isFutureMonth = isCurrentYear && isFuture(monthDate)
                const net = monthTotals[monthIndex]?.net || 0

                return (
                  <TableCell
                    key={monthIndex}
                    className={`text-center font-semibold ${
                      isFutureMonth
                        ? 'text-muted-foreground'
                        : net >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {isFutureMonth
                      ? '-'
                      : formatCurrency(net)}
                  </TableCell>
                )
              })}
              <TableCell className='text-right font-semibold'>
                {formatCurrency(
                  Object.values(monthTotals).reduce((sum, val) => sum + val.net, 0)
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
