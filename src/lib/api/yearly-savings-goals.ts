import { supabase } from '../supabase-client'
import type { Database } from '../database.types'

type YearlySavingsGoalRow = Database['public']['Tables']['yearly_savings_goals']['Row']
type YearlySavingsGoalInsert = Database['public']['Tables']['yearly_savings_goals']['Insert']
type YearlySavingsGoalUpdate = Database['public']['Tables']['yearly_savings_goals']['Update']

export type YearlySavingsGoal = {
  id: string
  userId: string
  year: number
  savingsPercentage: number
  createdAt: Date
  updatedAt: Date
}

// Helper to convert Supabase row to YearlySavingsGoal
const rowToYearlySavingsGoal = (row: YearlySavingsGoalRow): YearlySavingsGoal => ({
  id: row.id,
  userId: row.user_id,
  year: row.year,
  savingsPercentage: Number(row.savings_percentage),
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
})

export const yearlySavingsGoalsApi = {
  // Get goal for a specific year (creates default if doesn't exist)
  async getByYear(userId: string, year: number): Promise<YearlySavingsGoal> {
    const { data, error } = await supabase
      .from('yearly_savings_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Goal doesn't exist, create default
        return this.createDefault(userId, year)
      }
      throw error
    }
    return rowToYearlySavingsGoal(data)
  },

  // Get all goals for a user
  async getAll(userId: string): Promise<YearlySavingsGoal[]> {
    const { data, error } = await supabase
      .from('yearly_savings_goals')
      .select('*')
      .eq('user_id', userId)
      .order('year', { ascending: false })

    if (error) throw error
    return data.map(rowToYearlySavingsGoal)
  },

  // Create default goal for a year
  async createDefault(userId: string, year: number): Promise<YearlySavingsGoal> {
    const { data, error } = await supabase
      .from('yearly_savings_goals')
      .insert({
        user_id: userId,
        year,
        savings_percentage: 20.0, // Default 20%
      })
      .select()
      .single()

    if (error) throw error
    return rowToYearlySavingsGoal(data)
  },

  // Update or create goal for a year
  async upsert(
    userId: string,
    year: number,
    savingsPercentage: number
  ): Promise<YearlySavingsGoal> {
    const { data, error } = await supabase
      .from('yearly_savings_goals')
      .upsert(
        {
          user_id: userId,
          year,
          savings_percentage: savingsPercentage,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,year',
        }
      )
      .select()
      .single()

    if (error) throw error
    return rowToYearlySavingsGoal(data)
  },
}
