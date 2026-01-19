import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userSettingsApi, type UserSettings } from '@/lib/api/user-settings'
import { useUserId } from './use-user-id'
import { toast } from 'sonner'

export function useUserSettings() {
  const userId = useUserId()
  const queryClient = useQueryClient()

  const {
    data: settings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user-settings', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated')
      return userSettingsApi.get(userId)
    },
    enabled: !!userId,
  })

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<Pick<UserSettings, 'savingsPercentage'>>) => {
      if (!userId) throw new Error('User not authenticated')
      return userSettingsApi.update(updates, userId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings', userId] })
      toast.success('Settings updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update settings')
      console.error('Failed to update settings:', error)
    },
  })

  return {
    settings,
    isLoading,
    error,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  }
}
