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
import { transactionTypes } from '../data/data'
import { Circle } from 'lucide-react'
import { type Transaction } from '../data/schema'
import { getTransactionsColumns, setTransactionUpdateCallback } from './transactions-columns'
import { useTransactions } from '@/hooks/use-transactions'
import { TransactionsBulkActions } from './transactions-bulk-actions'
import { useCategories } from '@/hooks/use-categories'
import { convertCategoriesToOptions } from '../utils/category-helpers'

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
  const { categories: dbCategories } = useCategories()
  
  // Convert database categories to options format (without uncategorized for cell dropdown)
  const categoriesForCells = useMemo(() => {
    return convertCategoriesToOptions(dbCategories)
  }, [dbCategories])

  // Categories for filter (includes uncategorized at top)
  const categoriesForFilter = useMemo(() => {
    // Check if uncategorized already exists in database categories
    const hasUncategorizedInDb = dbCategories.some(
      (cat) => cat.value === 'uncategorized' || cat.value === '__uncategorized__'
    )
    
    // Filter out uncategorized from converted categories if it exists
    const filteredCells = hasUncategorizedInDb
      ? categoriesForCells.filter((cat) => cat.value !== 'uncategorized' && cat.value !== '__uncategorized__')
      : categoriesForCells
    
    return [
      {
        label: 'Uncategorized',
        value: '__uncategorized__',
        icon: Circle,
      },
      ...filteredCells,
    ]
  }, [categoriesForCells, dbCategories])


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
    // If category is explicitly set to empty array, show uncategorized transactions
    // If category is undefined, show all transactions
    if (Array.isArray(search.category)) {
      if (search.category.length === 0) {
        // Empty array means show only uncategorized
        return !transaction.category
      } else {
        // Array with values means show those categories
        // Handle __uncategorized__ marker
        const hasUncategorized = search.category.includes('__uncategorized__')
        const hasRegularCategories = search.category.some(cat => cat !== '__uncategorized__')
        
        if (hasUncategorized && hasRegularCategories) {
          // Show both uncategorized and selected categories
          return !transaction.category || search.category.includes(transaction.category)
        } else if (hasUncategorized) {
          // Show only uncategorized
          return !transaction.category
        } else {
          // Show only selected categories
          return transaction.category && search.category.includes(transaction.category)
        }
      }
    }
    
    // category is undefined - show all transactions
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

  // Create columns with current categories
  const columns = useMemo(() => getTransactionsColumns(categoriesForCells), [categoriesForCells])

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
            options: categoriesForFilter,
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
      <TransactionsBulkActions table={table} />
    </div>
  )
}
