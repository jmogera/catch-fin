import { supabase } from '../supabase-client'
import type { Account } from '@/features/accounts/data/schema'
import type { Database } from '../database.types'

type AccountRow = Database['public']['Tables']['accounts']['Row']
type AccountInsert = Database['public']['Tables']['accounts']['Insert']
type AccountUpdate = Database['public']['Tables']['accounts']['Update']

// Helper to convert Supabase row to Account
const rowToAccount = (row: AccountRow): Account => ({
  id: row.id,
  name: row.name,
  type: row.type,
  balance: Number(row.balance),
  currency: row.currency,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
})

// Helper to convert Account to Supabase insert
const accountToInsert = (
  account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): AccountInsert => ({
  name: account.name,
  type: account.type,
  balance: account.balance,
  currency: account.currency,
  user_id: userId,
})

export const accountsApi = {
  // Get all accounts for a user
  async getAll(userId: string): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data.map(rowToAccount)
  },

  // Get account by ID
  async getById(id: string, userId: string): Promise<Account | null> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return rowToAccount(data)
  },

  // Create account
  async create(
    account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string
  ): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .insert(accountToInsert(account, userId))
      .select()
      .single()

    if (error) throw error
    return rowToAccount(data)
  },

  // Update account
  async update(
    id: string,
    updates: Partial<Omit<Account, 'id' | 'createdAt' | 'updatedAt'>>,
    userId: string
  ): Promise<Account> {
    const updateData: AccountUpdate = {
      updated_at: new Date().toISOString(),
    }

    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.type !== undefined) updateData.type = updates.type
    if (updates.balance !== undefined) updateData.balance = updates.balance
    if (updates.currency !== undefined) updateData.currency = updates.currency

    const { data, error } = await supabase
      .from('accounts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return rowToAccount(data)
  },

  // Delete account
  async delete(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
  },
}
