import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import { categories, transactionTypes } from '../data/data'
import { type Transaction } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

// Callback to update transactions
let updateTransactionCallback: ((id: string, updates: Partial<Transaction>) => void) | null = null

export function setTransactionUpdateCallback(
  callback: ((id: string, updates: Partial<Transaction>) => void) | null
) {
  updateTransactionCallback = callback
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export const transactionsColumns: ColumnDef<Transaction>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-[2px]'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'date',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Date' />
    ),
    cell: ({ row }) => {
      return (
        <div className='w-[100px]'>
          {format(row.getValue('date'), 'MMM dd, yyyy')}
        </div>
      )
    },
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Description' />
    ),
    meta: {
      className: 'ps-1 max-w-0 w-2/3',
      tdClassName: 'ps-4',
    },
    cell: ({ row }) => {
      return (
        <span className='truncate font-medium'>
          {row.getValue('description')}
        </span>
      )
    },
  },
  {
    accessorKey: 'category',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Category' />
    ),
    meta: { className: 'ps-1', tdClassName: 'ps-4' },
    cell: ({ row }) => {
      const transaction = row.original
      const currentValue = transaction.category || 'uncategorized'

      const handleValueChange = (newValue: string) => {
        const categoryValue = newValue === 'uncategorized' ? undefined : newValue
        
        // Update the transaction using the callback
        if (updateTransactionCallback) {
          updateTransactionCallback(transaction.id, {
            category: categoryValue,
          })
        }
      }

      const selectedCategory = transaction.category
        ? categories.find((cat) => cat.value === transaction.category)
        : null

      return (
        <Select value={currentValue} onValueChange={handleValueChange}>
          <SelectTrigger className='h-8 w-[180px]'>
            <SelectValue>
              {selectedCategory ? (
                <div className='flex items-center gap-2'>
                  {selectedCategory.icon && (
                    <selectedCategory.icon className='h-3 w-3' />
                  )}
                  {selectedCategory.label}
                </div>
              ) : (
                <Badge variant='outline' className='gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-0'>
                  Uncategorized
                </Badge>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='uncategorized'>
              <div className='flex items-center gap-2'>
                <span>Uncategorized</span>
              </div>
            </SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                <div className='flex items-center gap-2'>
                  {category.icon && <category.icon className='h-3 w-3' />}
                  {category.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    },
  },
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Type' />
    ),
    meta: { className: 'ps-1', tdClassName: 'ps-4' },
    cell: ({ row }) => {
      const type = transactionTypes.find(
        (t) => t.value === row.getValue('type')
      )

      if (!type) {
        return null
      }

      return (
        <div className='flex w-[100px] items-center gap-2'>
          {type.icon && (
            <type.icon className='size-4 text-muted-foreground' />
          )}
          <span>{type.label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Amount' />
    ),
    meta: { className: 'ps-1', tdClassName: 'ps-4' },
    cell: ({ row }) => {
      const amount = row.getValue('amount') as number
      return (
        <div
          className={`font-medium ${
            amount >= 0 ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {formatCurrency(amount)}
        </div>
      )
    },
  },
  {
    accessorKey: 'accountId',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Account' />
    ),
    meta: { className: 'ps-1', tdClassName: 'ps-4' },
    cell: ({ row }) => {
      return <div className='text-sm'>{row.getValue('accountId')}</div>
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
