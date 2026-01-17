import { ConfirmDialog } from '@/components/confirm-dialog'
import { useTransactions } from './transactions-provider'
import { TransactionsMutateDialog } from './transactions-mutate-dialog'
import { TransactionsImportDialog } from './transactions-import-dialog'
import { useTransactions as useTransactionsHook } from '@/hooks/use-transactions'
import { toast } from 'sonner'

export function TransactionsDialogs() {
  const { open, setOpen, currentRow } = useTransactions()
  const { delete: deleteTransaction, isDeleting } = useTransactionsHook()

  const handleDelete = () => {
    if (!currentRow) return

    deleteTransaction(currentRow.id, {
      onSuccess: () => {
        toast.success('Transaction deleted successfully')
        setOpen(null)
        setTimeout(() => {
          useTransactions.getState().setCurrentRow(null)
        }, 500)
      },
      onError: (error) => {
        toast.error('Failed to delete transaction')
        console.error(error)
      },
    })
  }

  return (
    <>
      <TransactionsMutateDialog />
      <TransactionsImportDialog
        key='transactions-import'
        open={open === 'import'}
        onOpenChange={(val) => {
          if (!val) {
            setOpen(null)
          }
        }}
      />
      {currentRow && (
        <ConfirmDialog
          key='transaction-delete'
          destructive
          open={open === 'delete'}
          onOpenChange={(val) => {
            if (!val) {
              setOpen(null)
              setTimeout(() => {
                useTransactions.getState().setCurrentRow(null)
              }, 500)
            }
          }}
          handleConfirm={handleDelete}
          isLoading={isDeleting}
          className='max-w-md'
          title='Delete Transaction'
          desc={
            <>
              Are you sure you want to delete this transaction? <br />
              <strong>{currentRow.description}</strong> <br />
              This action cannot be undone.
            </>
          }
          confirmText='Delete'
        />
      )}
    </>
  )
}
