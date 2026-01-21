import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { yearlySavingsGoalsApi, type YearlySavingsGoal } from '@/lib/api/yearly-savings-goals'
import { useUserId } from './use-user-id'
import { toast } from 'sonner'

export function useYearlySavingsGoal(year: number) {
  const userId = useUserId()
  const queryClient = useQueryClient()

  const {
    data: goal,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['yearly-savings-goal', userId, year],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated')
      return yearlySavingsGoalsApi.getByYear(userId, year)
    },
    enabled: !!userId,
  })

  const updateMutation = useMutation({
    mutationFn: (savingsPercentage: number) => {
      if (!userId) throw new Error('User not authenticated')
      return yearlySavingsGoalsApi.upsert(userId, year, savingsPercentage)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yearly-savings-goal', userId, year] })
      toast.success('Savings goal updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update savings goal')
      console.error('Failed to update savings goal:', error)
    },
  })

  return {
    goal,
    isLoading,
    error,
    updateGoal: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  }
}
