import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { format } from 'date-fns'
import { accountTypes } from '../data/data'
import { type Account } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export const accountsColumns: ColumnDef<Account>[] = [
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
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    meta: {
      className: 'ps-1 max-w-0 w-2/3',
      tdClassName: 'ps-4',
    },
    cell: ({ row }) => {
      const accountType = accountTypes.find(
        (type) => type.value === row.original.type
      )

      return (
        <div className='flex space-x-2'>
          {accountType && (
            <Badge variant='outline' className='gap-1'>
              {accountType.icon && <accountType.icon className='h-3 w-3' />}
              {accountType.label}
            </Badge>
          )}
          <span className='truncate font-medium'>{row.getValue('name')}</span>
        </div>
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
      const type = accountTypes.find((t) => t.value === row.getValue('type'))

      if (!type) {
        return null
      }

      return (
        <div className='flex w-[120px] items-center gap-2'>
          {type.icon && <type.icon className='size-4 text-muted-foreground' />}
          <span>{type.label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'balance',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Balance' />
    ),
    meta: { className: 'ps-1', tdClassName: 'ps-4' },
    cell: ({ row }) => {
      const balance = row.getValue('balance') as number
      return (
        <div
          className={`font-medium ${
            balance >= 0 ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {formatCurrency(balance)}
        </div>
      )
    },
  },
  {
    accessorKey: 'currency',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Currency' />
    ),
    meta: { className: 'ps-1', tdClassName: 'ps-4' },
    cell: ({ row }) => {
      return <div className='text-sm uppercase'>{row.getValue('currency')}</div>
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created' />
    ),
    cell: ({ row }) => {
      return (
        <div className='w-[100px]'>
          {format(row.getValue('createdAt'), 'MMM dd, yyyy')}
        </div>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
