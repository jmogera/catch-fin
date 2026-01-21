import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { budgetPlansApi, type CustomCut } from '@/lib/api/budget-plans'
import { useUserId } from './use-user-id'
import { toast } from 'sonner'

export function useBudgetPlan(year: number) {
  const userId = useUserId()
  const queryClient = useQueryClient()

  const {
    data: plan,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['budget-plan', userId, year],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated')
      return budgetPlansApi.getByYear(userId, year)
    },
    enabled: !!userId,
  })

  const updateMutation = useMutation({
    mutationFn: ({
      customCuts,
      lockedCategories,
      categoryBudgets,
      savingsAllocations,
      customSavingsAccounts,
      baseMonthlySavingsGoal,
    }: {
      customCuts: CustomCut[]
      lockedCategories: string[]
      categoryBudgets?: Record<string, number>
      savingsAllocations?: { category: string; percentage: number }[]
      customSavingsAccounts?: string[]
      baseMonthlySavingsGoal?: number
    }) => {
      if (!userId) throw new Error('User not authenticated')
      return budgetPlansApi.upsert(userId, year, customCuts, lockedCategories, categoryBudgets, savingsAllocations, customSavingsAccounts, baseMonthlySavingsGoal)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-plan', userId, year] })
    },
    onError: (error) => {
      toast.error('Failed to save budget plan')
      console.error('Failed to save budget plan:', error)
    },
  })

  return {
    plan,
    isLoading,
    error,
    updatePlan: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  }
}
