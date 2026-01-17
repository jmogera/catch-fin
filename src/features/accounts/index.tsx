import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { AccountsDialogs } from './components/accounts-dialogs'
import { AccountsPrimaryButtons } from './components/accounts-primary-buttons'
import { AccountsProvider } from './components/accounts-provider'
import { AccountsTable } from './components/accounts-table'
import { useAccounts } from '@/hooks/use-accounts'

export function Accounts() {
  const { accounts, isLoading, isError, error } = useAccounts()

  return (
    <AccountsProvider>
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
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Accounts</h2>
            <p className='text-muted-foreground'>
              Manage your financial accounts and track balances.
            </p>
          </div>
          <AccountsPrimaryButtons />
        </div>
        {isLoading ? (
          <div className='flex items-center justify-center py-12'>
            <p className='text-muted-foreground'>Loading accounts...</p>
          </div>
        ) : isError ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <p className='text-destructive font-medium'>Error loading accounts</p>
              <p className='text-sm text-muted-foreground mt-2'>
                {error instanceof Error ? error.message : 'An unexpected error occurred'}
              </p>
            </div>
          </div>
        ) : (
          <AccountsTable data={accounts} />
        )}
      </Main>

      <AccountsDialogs />
    </AccountsProvider>
  )
}
