import { supabase } from '../supabase-client'
import type { Transaction } from '@/features/transactions/data/schema'
import type { Database } from '../database.types'

type TransactionRow = Database['public']['Tables']['transactions']['Row']
type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

// Helper to convert Supabase row to Transaction
const rowToTransaction = (row: TransactionRow): Transaction => ({
  id: row.id,
  description: row.description,
  amount: Number(row.amount),
  type: row.type,
  category: row.category ?? undefined,
  accountId: row.account_id,
  date: new Date(row.date),
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
})

// Helper to convert Transaction to Supabase insert
const transactionToInsert = (
  transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): TransactionInsert => ({
  description: transaction.description,
  amount: transaction.amount,
  type: transaction.type,
  category: transaction.category ?? null,
  account_id: transaction.accountId,
  date: transaction.date.toISOString(),
  user_id: userId,
})

export const transactionsApi = {
  // Get all transactions for a user
  async getAll(userId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) throw error
    return data.map(rowToTransaction)
  },

  // Get transaction by ID
  async getById(id: string, userId: string): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return rowToTransaction(data)
  },

  // Create transaction
  async create(
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string
  ): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionToInsert(transaction, userId))
      .select()
      .single()

    if (error) throw error
    return rowToTransaction(data)
  },

  // Update transaction
  async update(
    id: string,
    updates: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>,
    userId: string
  ): Promise<Transaction> {
    const updateData: TransactionUpdate = {
      updated_at: new Date().toISOString(),
    }

    if (updates.description !== undefined)
      updateData.description = updates.description
    if (updates.amount !== undefined) updateData.amount = updates.amount
    if (updates.type !== undefined) updateData.type = updates.type
    if (updates.category !== undefined)
      updateData.category = updates.category ?? null
    if (updates.accountId !== undefined)
      updateData.account_id = updates.accountId
    if (updates.date !== undefined)
      updateData.date = updates.date.toISOString()

    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return rowToTransaction(data)
  },

  // Delete transaction
  async delete(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
  },

  // Bulk create transactions (for import)
  async bulkCreate(
    transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[],
    userId: string
  ): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .insert(
        transactions.map((t) => transactionToInsert(t, userId))
      )
      .select()

    if (error) throw error
    return data.map(rowToTransaction)
  },
}
