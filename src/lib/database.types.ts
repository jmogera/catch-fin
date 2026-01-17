export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string
          name: string
          type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash' | 'other'
          balance: number
          currency: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash' | 'other'
          balance: number
          currency?: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'checking' | 'savings' | 'credit' | 'investment' | 'cash' | 'other'
          balance?: number
          currency?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          description: string
          amount: number
          type: 'income' | 'expense' | 'transfer'
          category: 'food' | 'transportation' | 'shopping' | 'bills' | 'entertainment' | 'healthcare' | 'education' | 'salary' | 'investment' | 'other' | 'uncategorized' | null
          account_id: string
          date: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          description: string
          amount: number
          type: 'income' | 'expense' | 'transfer'
          category?: 'food' | 'transportation' | 'shopping' | 'bills' | 'entertainment' | 'healthcare' | 'education' | 'salary' | 'investment' | 'other' | 'uncategorized' | null
          account_id: string
          date: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          description?: string
          amount?: number
          type?: 'income' | 'expense' | 'transfer'
          category?: 'food' | 'transportation' | 'shopping' | 'bills' | 'entertainment' | 'healthcare' | 'education' | 'salary' | 'investment' | 'other' | 'uncategorized' | null
          account_id?: string
          date?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
