import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriesApi, type Category } from '@/lib/api/categories'
import { useUserId } from './use-user-id'

export function useCategories() {
  const userId = useUserId()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['categories', userId],
    queryFn: () => categoriesApi.getAll(userId!),
    enabled: !!userId,
  })

  const createMutation = useMutation({
    mutationFn: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) =>
      categoriesApi.create(category, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>
    }) => categoriesApi.update(id, updates, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] })
    },
  })

  const seedDefaultsMutation = useMutation({
    mutationFn: () => categoriesApi.seedDefaults(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] })
    },
  })

  return {
    categories: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    seedDefaults: seedDefaultsMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSeeding: seedDefaultsMutation.isPending,
  }
}
