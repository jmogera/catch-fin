import { getRouteApi } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { TransactionsDialogs } from './components/transactions-dialogs'
import { TransactionsPrimaryButtons } from './components/transactions-primary-buttons'
import { TransactionsProvider } from './components/transactions-provider'
import { TransactionsTable } from './components/transactions-table'
import { useTransactions } from '@/hooks/use-transactions'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const route = getRouteApi('/_authenticated/transactions/')

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function Transactions() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { transactions, isLoading, isError, error } = useTransactions()

  const hasFilters = search.month || search.year || (Array.isArray(search.category) && search.category.length === 0)

  const clearFilters = () => {
    navigate({
      replace: true,
      search: {
        page: 1,
        pageSize: 10,
        filter: '',
        type: [],
        // Don't include category, month, year - let them be undefined
      },
    })
  }

  const clearUncategorized = () => {
    navigate({
      replace: true,
      search: (prev) => {
        const next = { ...prev }
        delete next.category
        return next
      },
    })
  }

  return (
    <TransactionsProvider>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div className='flex-1'>
            <h2 className='text-2xl font-bold tracking-tight'>Transactions</h2>
            <p className='text-muted-foreground'>
              View and manage all your financial transactions.
            </p>
            {hasFilters && (
              <div className='mt-2 flex flex-wrap items-center gap-2'>
                {search.month && (
                  <Badge variant='secondary' className='gap-1'>
                    {months[search.month - 1]}
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-4 w-4 p-0 hover:bg-transparent'
                      onClick={() => {
                        navigate({
                          search: (prev) => ({
                            ...prev,
                            month: undefined,
                          }),
                        })
                      }}
                    >
                      <X className='h-3 w-3' />
                    </Button>
                  </Badge>
                )}
                {search.year && (
                  <Badge variant='secondary' className='gap-1'>
                    {search.year}
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-4 w-4 p-0 hover:bg-transparent'
                      onClick={() => {
                        navigate({
                          search: (prev) => ({
                            ...prev,
                            year: undefined,
                          }),
                        })
                      }}
                    >
                      <X className='h-3 w-3' />
                    </Button>
                  </Badge>
                )}
                {Array.isArray(search.category) && search.category.length === 0 && (
                  <Badge variant='secondary' className='gap-1'>
                    Uncategorized
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-4 w-4 p-0 hover:bg-transparent'
                      onClick={clearUncategorized}
                    >
                      <X className='h-3 w-3' />
                    </Button>
                  </Badge>
                )}
                {hasFilters && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={clearFilters}
                    className='h-6 text-xs'
                  >
                    Clear all
                  </Button>
                )}
              </div>
            )}
          </div>
          <TransactionsPrimaryButtons />
        </div>
        {isLoading ? (
          <div className='flex items-center justify-center py-12'>
            <p className='text-muted-foreground'>Loading transactions...</p>
          </div>
        ) : isError ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <p className='text-destructive font-medium'>Error loading transactions</p>
              <p className='text-sm text-muted-foreground mt-2'>
                {error instanceof Error ? error.message : 'An unexpected error occurred'}
              </p>
            </div>
          </div>
        ) : (
          <TransactionsTable data={transactions} />
        )}
      </Main>

      <TransactionsDialogs />
    </TransactionsProvider>
  )
}
