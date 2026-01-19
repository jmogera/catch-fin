import { useMemo } from 'react'
import { type Table } from '@tanstack/react-table'
import { useQueryClient } from '@tanstack/react-query'
import { Tag, Circle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type Transaction } from '../data/schema'
import { useUserId } from '@/hooks/use-user-id'
import { transactionsApi } from '@/lib/api/transactions'
import { useCategories } from '@/hooks/use-categories'
import { convertCategoriesToOptions } from '../utils/category-helpers'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function TransactionsBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const queryClient = useQueryClient()
  const userId = useUserId()
  const { categories: dbCategories } = useCategories()
  
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

  const handleBulkCategoryChange = (category: string | null) => {
    if (!userId) {
      toast.error('User not authenticated')
      return
    }

    const selectedTransactions = selectedRows.map((row) => row.original as Transaction)
    const categoryValue = category === 'uncategorized' || category === null ? undefined : category

    const updatePromises = selectedTransactions.map((transaction) =>
      transactionsApi.update(transaction.id, { category: categoryValue as Transaction['category'] }, userId)
    )

    toast.promise(Promise.all(updatePromises), {
      loading: `Updating category for ${selectedTransactions.length} transaction${selectedTransactions.length > 1 ? 's' : ''}...`,
      success: () => {
        queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
        table.resetRowSelection()
        return `Category updated for ${selectedTransactions.length} transaction${selectedTransactions.length > 1 ? 's' : ''}.`
      },
      error: 'Failed to update category',
    })
  }

  return (
    <BulkActionsToolbar table={table} entityName='transaction'>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                size='icon'
                className='size-8'
                aria-label='Assign category'
                title='Assign category'
              >
                <Tag />
                <span className='sr-only'>Assign category</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Assign category</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent sideOffset={14}>
          <DropdownMenuItem onClick={() => handleBulkCategoryChange('uncategorized')}>
            <Circle className='mr-2 size-4 text-muted-foreground' />
            <span>Uncategorized</span>
          </DropdownMenuItem>
          {categories.map((category) => (
            <DropdownMenuItem
              key={category.value}
              onClick={() => handleBulkCategoryChange(category.value)}
            >
              {category.icon && (
                <category.icon className='mr-2 size-4 text-muted-foreground' />
              )}
              {category.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </BulkActionsToolbar>
  )
}
