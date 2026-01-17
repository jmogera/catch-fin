import React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
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
import { accountTypeSchema } from '../data/schema'
import { accountTypes } from '../data/data'
import { useAccounts } from './accounts-provider'
import { useAccounts as useAccountsHook } from '@/hooks/use-accounts'

const formSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  type: accountTypeSchema,
  balance: z.coerce.number().default(0),
  currency: z.string().default('USD'),
})

type AccountForm = z.infer<typeof formSchema>

export function AccountsMutateDialog() {
  const { open, setOpen, currentRow } = useAccounts()
  const { create: createAccount, update: updateAccount, isCreating, isUpdating } = useAccountsHook()
  const isUpdate = !!currentRow && open === 'update'
  const isCreate = open === 'create'

  const form = useForm<AccountForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentRow?.name || '',
      type: currentRow?.type || 'checking',
      balance: currentRow?.balance || 0,
      currency: currentRow?.currency || 'USD',
    },
  })

  // Update form when currentRow changes
  React.useEffect(() => {
    if (currentRow) {
      form.reset({
        name: currentRow.name,
        type: currentRow.type,
        balance: currentRow.balance,
        currency: currentRow.currency,
      })
    } else if (isCreate) {
      form.reset({
        name: '',
        type: 'checking',
        balance: 0,
        currency: 'USD',
      })
    }
  }, [currentRow, isCreate, form])

  const onSubmit = (data: AccountForm) => {
    if (isUpdate && currentRow) {
      // Update account
      updateAccount(
        {
          id: currentRow.id,
          updates: data,
        },
        {
          onSuccess: () => {
            toast.success('Account updated successfully')
            setOpen(null)
            form.reset()
          },
          onError: (error) => {
            toast.error('Failed to update account')
            console.error(error)
          },
        }
      )
    } else if (isCreate) {
      // Create account
      createAccount(data, {
        onSuccess: () => {
          toast.success('Account created successfully')
          setOpen(null)
          form.reset()
        },
        onError: (error) => {
          toast.error('Failed to create account')
          console.error(error)
        },
      })
    }
  }

  if (!isCreate && !isUpdate) return null

  return (
    <Dialog
      open={isCreate || isUpdate}
      onOpenChange={(v) => {
        if (!v) {
          setOpen(null)
          form.reset()
        }
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{isUpdate ? 'Edit Account' : 'Add Account'}</DialogTitle>
          <DialogDescription>
            {isUpdate
              ? 'Update your account information.'
              : 'Create a new account to track your finances.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g., Primary Checking' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='type'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select account type' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accountTypes.map((accountType) => (
                        <SelectItem key={accountType.value} value={accountType.value}>
                          <div className='flex items-center gap-2'>
                            {accountType.icon && (
                              <accountType.icon className='h-4 w-4' />
                            )}
                            {accountType.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='balance'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Balance</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      step='0.01'
                      placeholder='0.00'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='currency'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select currency' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='USD'>USD - US Dollar</SelectItem>
                      <SelectItem value='EUR'>EUR - Euro</SelectItem>
                      <SelectItem value='GBP'>GBP - British Pound</SelectItem>
                      <SelectItem value='JPY'>JPY - Japanese Yen</SelectItem>
                      <SelectItem value='CAD'>CAD - Canadian Dollar</SelectItem>
                      <SelectItem value='AUD'>AUD - Australian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setOpen(null)
                  form.reset()
                }}
                disabled={isCreating || isUpdating}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? 'Saving...' : isUpdate ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
