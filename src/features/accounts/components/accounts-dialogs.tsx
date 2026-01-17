import { useAccounts } from './accounts-provider'
import { AccountsMutateDialog } from './accounts-mutate-dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useAccounts as useAccountsHook } from '@/hooks/use-accounts'
import { toast } from 'sonner'

export function AccountsDialogs() {
  const { open, setOpen, currentRow } = useAccounts()
  const { delete: deleteAccount, isDeleting } = useAccountsHook()

  const handleDelete = () => {
    if (!currentRow) return

    deleteAccount(currentRow.id, {
      onSuccess: () => {
        toast.success('Account deleted successfully')
        setOpen(null)
        setTimeout(() => {
          useAccounts.getState().setCurrentRow(null)
        }, 500)
      },
      onError: (error) => {
        toast.error('Failed to delete account')
        console.error(error)
      },
    })
  }

  return (
    <>
      <AccountsMutateDialog />
      {currentRow && (
        <ConfirmDialog
          key='account-delete'
          destructive
          open={open === 'delete'}
          onOpenChange={(val) => {
            if (!val) {
              setOpen(null)
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }
          }}
          handleConfirm={handleDelete}
          isLoading={isDeleting}
          className='max-w-md'
          title='Delete Account'
          desc={
            <>
              Are you sure you want to delete this account? <br />
              <strong>{currentRow.name}</strong> <br />
              This action cannot be undone. All associated transactions will also be deleted.
            </>
          }
          confirmText='Delete'
        />
      )}
    </>
  )
}
