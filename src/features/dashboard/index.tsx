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
import { Wallet, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react'

export function Dashboard() {
  const { accounts, isLoading: accountsLoading } = useAccounts()
  const { transactions, isLoading: transactionsLoading } = useTransactions()

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = Math.abs(
    transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  )
  const netIncome = totalIncome - totalExpenses

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
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
        </div>
        <div className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Total Balance
                </CardTitle>
                <Wallet className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(totalBalance)}
                </div>
                <p className='text-xs text-muted-foreground'>
                  Across {accounts.length} accounts
                </p>
              </CardContent>
            </Card>
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
                  This month
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
                  This month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Net Income</CardTitle>
                <ArrowUpDown className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(netIncome)}
                </div>
                <p className='text-xs text-muted-foreground'>
                  Income - Expenses
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
              <ExpenseCategoryTable />
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
