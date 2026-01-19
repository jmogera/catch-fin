import React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { transactionCategorySchema } from '../data/schema'
import { type Transaction } from '../data/schema'
import { useTransactions } from './transactions-provider'
import { useTransactions as useTransactionsHook } from '@/hooks/use-transactions'
import { useCategories } from '@/hooks/use-categories'
import { convertCategoriesToOptions } from '../utils/category-helpers'
import { Circle } from 'lucide-react'
import { useMemo } from 'react'

const formSchema = z.object({
  category: transactionCategorySchema.optional(),
})

type TransactionForm = z.infer<typeof formSchema>

export function TransactionsMutateDialog() {
  const { open, setOpen, currentRow } = useTransactions()
  const { update: updateTransaction } = useTransactionsHook()
  const { categories: dbCategories } = useCategories()
  const isUpdate = !!currentRow && open === 'update'

  const categories = useMemo(() => {
    const converted = convertCategoriesToOptions(dbCategories)
    return [
      {
        label: 'Uncategorized',
        value: 'uncategorized',
        icon: Circle,
      },
      ...converted,
    ]
  }, [dbCategories])

  const form = useForm<TransactionForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: currentRow?.category,
    },
  })

  // Update form when currentRow changes
  React.useEffect(() => {
    if (currentRow) {
      form.reset({
        category: currentRow.category,
      })
    }
  }, [currentRow, form])

  const onSubmit = (data: TransactionForm) => {
    if (!currentRow) return

    // Update the transaction in Supabase
    updateTransaction({
      id: currentRow.id,
      updates: {
        category: data.category,
      },
    })

    setOpen(null)
    form.reset()
  }

  if (!isUpdate) return null

  return (
    <Dialog
      open={open === 'update'}
      onOpenChange={(v) => {
        if (!v) {
          setOpen(null)
          form.reset()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>
            Update the category for this transaction.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='category'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === 'uncategorized' ? undefined : value)
                    }
                    value={field.value || 'uncategorized'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a category' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='uncategorized'>Uncategorized</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div className='flex items-center gap-2'>
                            {category.icon && (
                              <category.icon className='h-4 w-4' />
                            )}
                            {category.label}
                          </div>
                        </SelectItem>
                      ))}
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
              >
                Cancel
              </Button>
              <Button type='submit'>Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
