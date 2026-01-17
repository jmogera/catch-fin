import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { transactions } from '@/features/transactions/data/transactions'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

// Generate data for last 12 months
const generateMonthlyData = () => {
  const months = []
  const now = new Date()

  for (let i = 11; i >= 0; i--) {
    const monthDate = subMonths(now, i)
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)

    const monthTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date)
      return tDate >= monthStart && tDate <= monthEnd
    })

    const income = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const expenses = Math.abs(
      monthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
    )

    months.push({
      name: format(monthDate, 'MMM'),
      income,
      expenses,
    })
  }

  return months
}

const data = generateMonthlyData()

export function Overview() {
  return (
    <ResponsiveContainer width='100%' height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey='name'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          direction='ltr'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Bar
          dataKey='income'
          fill='#22c55e'
          radius={[4, 4, 0, 0]}
          name='Income'
        />
        <Bar
          dataKey='expenses'
          fill='#ef4444'
          radius={[4, 4, 0, 0]}
          name='Expenses'
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
