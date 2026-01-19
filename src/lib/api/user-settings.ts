import { supabase } from '../supabase-client'
import type { Database } from '../database.types'

type UserSettingsRow = Database['public']['Tables']['user_settings']['Row']
type UserSettingsInsert = Database['public']['Tables']['user_settings']['Insert']
type UserSettingsUpdate = Database['public']['Tables']['user_settings']['Update']

export type UserSettings = {
  id: string
  userId: string
  savingsPercentage: number
  createdAt: Date
  updatedAt: Date
}

// Helper to convert Supabase row to UserSettings
const rowToUserSettings = (row: UserSettingsRow): UserSettings => ({
  id: row.id,
  userId: row.user_id,
  savingsPercentage: Number(row.savings_percentage),
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
})

// Helper to convert UserSettings to Supabase insert
const userSettingsToInsert = (
  settings: Omit<UserSettings, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): UserSettingsInsert => ({
  user_id: userId,
  savings_percentage: settings.savingsPercentage,
})

export const userSettingsApi = {
  // Get user settings (creates default if doesn't exist)
  async get(userId: string): Promise<UserSettings> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Settings don't exist, create default
        return this.createDefault(userId)
      }
      throw error
    }
    return rowToUserSettings(data)
  },

  // Create default settings
  async createDefault(userId: string): Promise<UserSettings> {
    const { data, error } = await supabase
      .from('user_settings')
      .insert({
        user_id: userId,
        savings_percentage: 20.0, // Default 20%
      })
      .select()
      .single()

    if (error) throw error
    return rowToUserSettings(data)
  },

  // Update user settings
  async update(
    updates: Partial<Pick<UserSettings, 'savingsPercentage'>>,
    userId: string
  ): Promise<UserSettings> {
    const updateData: UserSettingsUpdate = {
      updated_at: new Date().toISOString(),
    }

    if (updates.savingsPercentage !== undefined) {
      updateData.savings_percentage = updates.savingsPercentage
    }

    // First, check if settings exist
    const existing = await this.get(userId)

    const { data, error } = await supabase
      .from('user_settings')
      .update(updateData)
      .eq('id', existing.id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return rowToUserSettings(data)
  },
}
