import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useAccounts } from '@/hooks/use-accounts'
import { accountTypes } from '@/features/accounts/data/data'
import { useTransactions } from '@/hooks/use-transactions'
import { toast } from 'sonner'

const formSchema = z.object({
  file: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, {
      message: 'Please upload a file',
    })
    .refine(
      (files) => ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(files?.[0]?.type) || files?.[0]?.name.endsWith('.csv'),
      'Please upload CSV format.'
    ),
  accountId: z.string().min(1, 'Please select an account'),
})

type TransactionsImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransactionsImportDialog({
  open,
  onOpenChange,
}: TransactionsImportDialogProps) {
  const { accounts } = useAccounts()
  const { bulkCreate, isBulkCreating } = useTransactions()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { file: undefined, accountId: '' },
  })

  const fileRef = form.register('file')

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const file = data.file

    if (file && file[0]) {
      try {
        // TODO: Parse CSV file and extract transactions
        // For now, just show a message
        toast.info('CSV parsing not yet implemented. File selected:', {
          description: `Account: ${accounts.find((a) => a.id === data.accountId)?.name || data.accountId}`,
        })
        // Example of how to use bulkCreate once CSV is parsed:
        // const parsedTransactions = parseCSV(file[0])
        // bulkCreate(parsedTransactions.map(t => ({ ...t, accountId: data.accountId })))
      } catch (error) {
        toast.error('Failed to import transactions')
        console.error(error)
      }
    }
    onOpenChange(false)
    form.reset()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val)
        form.reset()
      }}
    >
      <DialogContent className='gap-2 sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>Import Transactions</DialogTitle>
          <DialogDescription>
            Import transactions quickly from a CSV file.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id='transactions-import-form' onSubmit={form.handleSubmit(onSubmit)}>
            <div className='space-y-4'>
              <FormField
                control={form.control}
                name='accountId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select an account' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((account) => {
                          const accountType = accountTypes.find(
                            (type) => type.value === account.type
                          )
                          return (
                            <SelectItem key={account.id} value={account.id}>
                              <div className='flex items-center gap-2'>
                                {accountType?.icon && (
                                  <accountType.icon className='h-4 w-4' />
                                )}
                                <span>{account.name}</span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='file'
                render={() => (
                  <FormItem>
                    <FormLabel>File</FormLabel>
                    <FormControl>
                      <Input
                        type='file'
                        accept='.csv'
                        {...fileRef}
                        className='h-8 py-0'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
        <DialogFooter className='gap-2'>
          <DialogClose asChild>
            <Button variant='outline'>Close</Button>
          </DialogClose>
          <Button type='submit' form='transactions-import-form' disabled={isBulkCreating}>
            {isBulkCreating ? 'Importing...' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
