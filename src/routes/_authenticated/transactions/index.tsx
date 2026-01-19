import { createFileRoute } from '@tanstack/react-router'
import { Transactions } from '@/features/transactions'

export const Route = createFileRoute('/_authenticated/transactions/')({
  component: Transactions,
  validateSearch: (search: Record<string, unknown>) => {
    // Handle category: preserve undefined, empty array, or array with values
    // '__uncategorized__' is a special marker from dashboard navigation
    let category: string[] | undefined
    if (search.category === '__uncategorized__') {
      // Special marker for uncategorized - convert to empty array
      category = []
    } else if (Array.isArray(search.category)) {
      // Array from table toolbar - preserve as-is (empty array or with values)
      category = search.category
    } else if (!('category' in search)) {
      // Param not in URL at all - undefined means no filter
      category = undefined
    } else {
      // Param exists but is not array or marker - default to undefined
      category = undefined
    }

    return {
      page: Number(search.page) || 1,
      pageSize: Number(search.pageSize) || 10,
      filter: (search.filter as string) || '',
      type: (search.type as string[]) || [],
      category,
      month: search.month ? Number(search.month) : undefined,
      year: search.year ? Number(search.year) : undefined,
    }
  },
})
