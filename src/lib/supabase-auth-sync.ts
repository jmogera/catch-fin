import { supabase } from './supabase-client'
import { useAuthStore } from '@/stores/auth-store'

// Sync Supabase auth state with Zustand store
export function syncAuthState() {
  supabase.auth.onAuthStateChange((_event, session) => {
    const { auth } = useAuthStore.getState()

    if (session?.user && session?.access_token) {
      // Update store with Supabase user
      auth.setUser({
        accountNo: session.user.id,
        email: session.user.email ?? '',
        role: ['user'],
        exp: session.expires_at ?? Date.now() + 24 * 60 * 60 * 1000,
      })
      auth.setAccessToken(session.access_token)
    } else {
      // Clear store if no session
      auth.reset()
    }
  })
}

// Initialize auth sync on app load
if (typeof window !== 'undefined') {
  syncAuthState()
}
