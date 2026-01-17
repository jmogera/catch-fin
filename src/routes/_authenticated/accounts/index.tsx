import { createFileRoute } from '@tanstack/react-router'
import { Accounts } from '@/features/accounts'

export const Route = createFileRoute('/_authenticated/accounts/')({
  component: Accounts,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      page: Number(search.page) || 1,
      pageSize: Number(search.pageSize) || 10,
      filter: (search.filter as string) || '',
      type: (search.type as string[]) || [],
    }
  },
})
