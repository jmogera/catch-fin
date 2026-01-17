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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTransactions } from '@/hooks/use-transactions'
import { categories } from '@/features/transactions/data/data'
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

export function ExpenseCategoryTable() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const navigate = useNavigate()
  const { transactions } = useTransactions()

  // Get income and expense categories
  const incomeCategories = categories.filter(
    (cat) => cat.value === 'salary' || cat.value === 'investment'
  )
  const expenseCategories = categories.filter(
    (cat) => cat.value !== 'salary' && cat.value !== 'investment'
  )

  const handleCellClick = (
    category: string | undefined,
    monthIndex: number,
    type: 'income' | 'expense'
  ) => {
    const month = monthIndex + 1 // 1-12 for URL
    navigate({
      to: '/transactions',
      search: {
        page: 1,
        pageSize: 10,
        filter: '',
        type: [type],
        category: category ? [category] : undefined, // undefined means uncategorized
        month,
        year: selectedYear,
      },
    })
  }

  // Calculate income and expenses by category and month
  const calculateData = () => {
    const incomeData: Record<string, Record<number, number>> = {}
    const expenseData: Record<string, Record<number, number>> = {}
    const uncategorizedIncomeData: Record<number, number> = {}
    const uncategorizedExpenseData: Record<number, number> = {}

    // Initialize uncategorized
    for (let month = 0; month < 12; month++) {
      uncategorizedIncomeData[month] = 0
      uncategorizedExpenseData[month] = 0
    }

    incomeCategories.forEach((category) => {
      incomeData[category.value] = {}
      for (let month = 0; month < 12; month++) {
        incomeData[category.value][month] = 0
      }
    })

    expenseCategories.forEach((category) => {
      expenseData[category.value] = {}
      for (let month = 0; month < 12; month++) {
        expenseData[category.value][month] = 0
      }
    })

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

    return {
      income: { categorized: incomeData, uncategorized: uncategorizedIncomeData },
      expense: { categorized: expenseData, uncategorized: uncategorizedExpenseData },
    }
  }

  const { income: incomeData, expense: expenseData } = calculateData()

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
  const calculateMonthTotals = () => {
    const totals: Record<number, { income: number; expense: number; net: number }> = {}
    for (let month = 0; month < 12; month++) {
      let incomeTotal = incomeData.uncategorized[month] || 0
      let expenseTotal = expenseData.uncategorized[month] || 0

      incomeCategories.forEach((category) => {
        incomeTotal += incomeData.categorized[category.value]?.[month] || 0
      })

      expenseCategories.forEach((category) => {
        expenseTotal += expenseData.categorized[category.value]?.[month] || 0
      })

      totals[month] = {
        income: incomeTotal,
        expense: expenseTotal,
        net: incomeTotal - expenseTotal,
      }
    }
    return totals
  }

  const monthTotals = calculateMonthTotals()

  // Calculate totals for each category
  const calculateCategoryTotals = () => {
    const incomeTotals: Record<string, number> = {}
    const expenseTotals: Record<string, number> = {}

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

    return { income: incomeTotals, expense: expenseTotals }
  }

  const categoryTotals = calculateCategoryTotals()

  // Get year options (current year and past years from transactions)
  const getYearOptions = () => {
    const years = new Set<number>()
    transactions.forEach((t) => {
      years.add(new Date(t.date).getFullYear())
    })
    years.add(currentYear)
    return Array.from(years).sort((a, b) => b - a)
  }

  const yearOptions = getYearOptions()
  const isCurrentYear = selectedYear === currentYear

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold'>Income & Expenses by Category</h3>
          <p className='text-sm text-muted-foreground'>
            Monthly breakdown of income and expenses by category
          </p>
        </div>
        <Select
          value={selectedYear.toString()}
          onValueChange={(value) => setSelectedYear(parseInt(value, 10))}
        >
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Select year' />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                {uncategorizedExpenseTotal > 0
                  ? formatCurrency(uncategorizedExpenseTotal)
                  : '$0'}
              </TableCell>
            </TableRow>
            {/* Expense categories */}
            {expenseCategories.map((category) => {
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
                    {categoryTotal > 0 ? formatCurrency(categoryTotal) : '$0'}
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
