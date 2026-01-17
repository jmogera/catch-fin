import { useEffect, useState, useMemo, useCallback } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import {
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { useTableUrlState } from '@/hooks/use-table-url-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { categories, transactionTypes } from '../data/data'
import { type Transaction } from '../data/schema'
import { transactionsColumns as columns, setTransactionUpdateCallback } from './transactions-columns'
import { useTransactions } from '@/hooks/use-transactions'

const route = getRouteApi('/_authenticated/transactions/')

type DataTableProps = {
  data: Transaction[]
}

export function TransactionsTable({ data }: DataTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [localData, setLocalData] = useState(data)
  const search = route.useSearch()
  const { update: updateTransactionMutation } = useTransactions()

  // Update local data when prop changes
  useEffect(() => {
    setLocalData(data)
  }, [data])

  // Callback to update a transaction
  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    // Optimistically update local data
    setLocalData((prev) => {
      return prev.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
      )
    })
    // Update in Supabase
    updateTransactionMutation({ id, updates })
  }, [updateTransactionMutation])

  // Export update function for columns to use
  useEffect(() => {
    setTransactionUpdateCallback(updateTransaction)
    return () => {
      setTransactionUpdateCallback(null)
    }
  }, [updateTransaction])

  // Filter data by month/year and category if provided
  const filteredData = useMemo(() => {
    return localData.filter((transaction) => {
    // Filter by month/year
    if (search.month || search.year) {
      const tDate = new Date(transaction.date)
      if (search.year && tDate.getFullYear() !== search.year) {
        return false
      }
      if (search.month && tDate.getMonth() + 1 !== search.month) {
        return false
      }
    }
    
    // Handle category filter
    // If category is undefined or empty array, show uncategorized transactions
    if (search.category === undefined || (Array.isArray(search.category) && search.category.length === 0)) {
      return !transaction.category
    }
    
    // If category is specified, match it
    if (Array.isArray(search.category) && search.category.length > 0) {
      return transaction.category && search.category.includes(transaction.category)
    }
    
      return true
    })
  }, [localData, search.month, search.year, search.category])

  const {
    globalFilter,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search: route.useSearch(),
    navigate: route.useNavigate(),
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'filter' },
    columnFilters: [
      { columnId: 'type', searchKey: 'type', type: 'array' },
      { columnId: 'category', searchKey: 'category', type: 'array' },
    ],
  })

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row, _columnId, filterValue) => {
      const description = String(row.getValue('description')).toLowerCase()
      const searchValue = String(filterValue).toLowerCase()

      return description.includes(searchValue)
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onPaginationChange,
    onGlobalFilterChange,
    onColumnFiltersChange,
  })

  const pageCount = table.getPageCount()
  useEffect(() => {
    ensurePageInRange(pageCount)
  }, [pageCount, ensurePageInRange])

  return (
    <div
      className={cn(
        'max-sm:has-[div[role="toolbar"]]:mb-16',
        'flex flex-1 flex-col gap-4'
      )}
    >
      <DataTableToolbar
        table={table}
        searchPlaceholder='Filter by description...'
        filters={[
          {
            columnId: 'type',
            title: 'Type',
            options: transactionTypes,
          },
          {
            columnId: 'category',
            title: 'Category',
            options: categories,
          },
        ]}
      />
      <div className='overflow-hidden rounded-md border'>
        <Table className='min-w-xl'>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        header.column.columnDef.meta?.className,
                        header.column.columnDef.meta?.thClassName
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        cell.column.columnDef.meta?.className,
                        cell.column.columnDef.meta?.tdClassName
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} className='mt-auto' />
    </div>
  )
}
