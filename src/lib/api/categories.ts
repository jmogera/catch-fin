import { supabase } from '../supabase-client'
import type { Database } from '../database.types'

type CategoryRow = Database['public']['Tables']['categories']['Row']
type CategoryInsert = Database['public']['Tables']['categories']['Insert']
type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export type Category = {
  id: string
  label: string
  value: string
  icon: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

// Helper to convert Supabase row to Category
const rowToCategory = (row: CategoryRow): Category => ({
  id: row.id,
  label: row.label,
  value: row.value,
  icon: row.icon,
  userId: row.user_id,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
})

// Helper to convert Category to Supabase insert
const categoryToInsert = (
  category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): CategoryInsert => ({
  label: category.label,
  value: category.value,
  icon: category.icon,
  user_id: userId,
})

// Default categories to seed
const defaultCategories = [
  { label: 'Food', value: 'food', icon: 'Utensils' },
  { label: 'Transportation', value: 'transportation', icon: 'Car' },
  { label: 'Shopping', value: 'shopping', icon: 'ShoppingBag' },
  { label: 'Bills', value: 'bills', icon: 'Receipt' },
  { label: 'Entertainment', value: 'entertainment', icon: 'Film' },
  { label: 'Healthcare', value: 'healthcare', icon: 'Heart' },
  { label: 'Education', value: 'education', icon: 'GraduationCap' },
  { label: 'Salary', value: 'salary', icon: 'DollarSign' },
  { label: 'Investment', value: 'investment', icon: 'TrendingUp' },
  { label: 'Other', value: 'other', icon: 'Circle' },
]

export const categoriesApi = {
  // Get all categories for a user
  async getAll(userId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('label', { ascending: true })

    if (error) throw error
    return data.map(rowToCategory)
  },

  // Get category by ID
  async getById(id: string, userId: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return rowToCategory(data)
  },

  // Seed default categories for a user
  async seedDefaults(userId: string): Promise<Category[]> {
    // First, get existing categories to avoid duplicates
    const existing = await this.getAll(userId)
    const existingValues = new Set(existing.map((cat) => cat.value))

    // Filter out categories that already exist
    const categoriesToInsert = defaultCategories.filter(
      (cat) => !existingValues.has(cat.value)
    )

    if (categoriesToInsert.length === 0) {
      // All categories already exist
      return existing
    }

    // Insert only new categories
    const { data, error } = await supabase
      .from('categories')
      .insert(
        categoriesToInsert.map((cat) => categoryToInsert(cat, userId))
      )
      .select()

    if (error) throw error

    // Return all categories (existing + newly inserted)
    return [...existing, ...data.map(rowToCategory)]
  },

  // Create category
  async create(
    category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string
  ): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert(categoryToInsert(category, userId))
      .select()
      .single()

    if (error) throw error
    return rowToCategory(data)
  },

  // Update category
  async update(
    id: string,
    updates: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>,
    userId: string
  ): Promise<Category> {
    const updateData: CategoryUpdate = {
      updated_at: new Date().toISOString(),
    }

    if (updates.label !== undefined) updateData.label = updates.label
    if (updates.value !== undefined) updateData.value = updates.value
    if (updates.icon !== undefined) updateData.icon = updates.icon

    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return rowToCategory(data)
  },

  // Delete category
  async delete(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
  },
}
