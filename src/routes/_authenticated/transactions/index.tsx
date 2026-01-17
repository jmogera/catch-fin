import { createFileRoute } from '@tanstack/react-router'
import { Transactions } from '@/features/transactions'

export const Route = createFileRoute('/_authenticated/transactions/')({
  component: Transactions,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      page: Number(search.page) || 1,
      pageSize: Number(search.pageSize) || 10,
      filter: (search.filter as string) || '',
      type: (search.type as string[]) || [],
      category: (search.category as string[]) || [],
      month: search.month ? Number(search.month) : undefined,
      year: search.year ? Number(search.year) : undefined,
    }
  },
})
