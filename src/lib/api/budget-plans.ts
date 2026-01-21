import { supabase } from '../supabase-client'
import type { Database } from '../database.types'

type BudgetPlanRow = Database['public']['Tables']['budget_plans']['Row']

export type CustomCut = {
  value: string
  cutPct: number
}

export type CategoryBudget = {
  category: string
  amount: number
}

export type SavingsAllocation = {
  category: string
  percentage: number
}

export type BudgetPlan = {
  id: string
  userId: string
  year: number
  customCuts: CustomCut[]
  lockedCategories: string[]
  categoryBudgets: Record<string, number> // category value -> budget amount
  savingsAllocations: SavingsAllocation[]
  customSavingsAccounts: string[]
  baseMonthlySavingsGoal: number // User's target monthly savings amount
  createdAt: Date
  updatedAt: Date
}

// Helper to convert Supabase row to BudgetPlan
const rowToBudgetPlan = (row: BudgetPlanRow): BudgetPlan => ({
  id: row.id,
  userId: row.user_id,
  year: row.year,
  customCuts: (row.custom_cuts as CustomCut[]) || [],
  lockedCategories: row.locked_categories || [],
  categoryBudgets: (row.category_budgets as Record<string, number>) || {},
  savingsAllocations: (row.savings_allocations as SavingsAllocation[]) || [],
  customSavingsAccounts: (row.custom_savings_accounts as string[]) || [],
  baseMonthlySavingsGoal: (row.base_monthly_savings_goal as number) || 0,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
})

export const budgetPlansApi = {
  // Get plan for a specific year (returns null if doesn't exist)
  async getByYear(userId: string, year: number): Promise<BudgetPlan | null> {
    const { data, error } = await supabase
      .from('budget_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Plan doesn't exist, return null
        return null
      }
      throw error
    }
    return rowToBudgetPlan(data)
  },

  // Get all plans for a user
  async getAll(userId: string): Promise<BudgetPlan[]> {
    const { data, error } = await supabase
      .from('budget_plans')
      .select('*')
      .eq('user_id', userId)
      .order('year', { ascending: false })

    if (error) throw error
    return data.map(rowToBudgetPlan)
  },

  // Update or create plan for a year
  async upsert(
    userId: string,
    year: number,
    customCuts: CustomCut[],
    lockedCategories: string[],
    categoryBudgets?: Record<string, number>,
    savingsAllocations?: SavingsAllocation[],
    customSavingsAccounts?: string[],
    baseMonthlySavingsGoal?: number
  ): Promise<BudgetPlan> {
    const updateData: any = {
      user_id: userId,
      year,
      custom_cuts: customCuts,
      locked_categories: lockedCategories,
      updated_at: new Date().toISOString(),
    }

    // Only update category_budgets if provided (to allow partial updates)
    if (categoryBudgets !== undefined) {
      updateData.category_budgets = categoryBudgets
    }

    // Only update savings_allocations if provided
    if (savingsAllocations !== undefined) {
      updateData.savings_allocations = savingsAllocations
    }

    // Only update custom_savings_accounts if provided
    if (customSavingsAccounts !== undefined) {
      updateData.custom_savings_accounts = customSavingsAccounts
    }

    // Only update base_monthly_savings_goal if provided
    if (baseMonthlySavingsGoal !== undefined) {
      updateData.base_monthly_savings_goal = baseMonthlySavingsGoal
    }

    const { data, error } = await supabase
      .from('budget_plans')
      .upsert(updateData, {
        onConflict: 'user_id,year',
      })
      .select()
      .single()

    if (error) throw error
    return rowToBudgetPlan(data)
  },

  // Delete plan for a year
  async delete(userId: string, year: number): Promise<void> {
    const { error } = await supabase
      .from('budget_plans')
      .delete()
      .eq('user_id', userId)
      .eq('year', year)

    if (error) throw error
  },
}
