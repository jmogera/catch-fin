import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accountsApi } from '@/lib/api/accounts'
import { useUserId } from './use-user-id'
import type { Account } from '@/features/accounts/data/schema'

export function useAccounts() {
  const userId = useUserId()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['accounts', userId],
    queryFn: () => accountsApi.getAll(userId),
    enabled: !!userId,
  })

  const createMutation = useMutation({
    mutationFn: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) =>
      accountsApi.create(account, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', userId] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Omit<Account, 'id' | 'createdAt' | 'updatedAt'>>
    }) => accountsApi.update(id, updates, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', userId] })
      // Also invalidate transactions since account balance might affect calculations
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => accountsApi.delete(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', userId] })
    },
  })

  return {
    accounts: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
