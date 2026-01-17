import { useSupabaseAuth } from './use-supabase-auth'

export function useUserId() {
  const { user } = useSupabaseAuth()
  return user?.id ?? null
}
