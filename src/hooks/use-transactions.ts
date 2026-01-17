import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transactionsApi } from '@/lib/api/transactions'
import { useUserId } from './use-user-id'
import type { Transaction } from '@/features/transactions/data/schema'

export function useTransactions() {
  const userId = useUserId()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['transactions', userId],
    queryFn: () => transactionsApi.getAll(userId),
    enabled: !!userId,
  })

  const createMutation = useMutation({
    mutationFn: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) =>
      transactionsApi.create(transaction, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>
    }) => transactionsApi.update(id, updates, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
      queryClient.invalidateQueries({ queryKey: ['accounts', userId] })
    },
  })

  const bulkCreateMutation = useMutation({
    mutationFn: (transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]) =>
      transactionsApi.bulkCreate(transactions, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
    },
  })

  return {
    transactions: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    bulkCreate: bulkCreateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isBulkCreating: bulkCreateMutation.isPending,
  }
}
