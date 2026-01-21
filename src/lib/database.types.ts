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
      categories: {
        Row: {
          id: string
          label: string
          value: string
          icon: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          label: string
          value: string
          icon: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          label?: string
          value?: string
          icon?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
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
          type: 'income' | 'expense' | 'transfer' | 'savings'
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
          type: 'income' | 'expense' | 'transfer' | 'savings'
          category?: string | null
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
          type?: 'income' | 'expense' | 'transfer' | 'savings'
          category?: string | null
          account_id?: string
          date?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          savings_percentage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          savings_percentage?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          savings_percentage?: number
          created_at?: string
          updated_at?: string
        }
      }
      yearly_savings_goals: {
        Row: {
          id: string
          user_id: string
          year: number
          savings_percentage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          year: number
          savings_percentage?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          year?: number
          savings_percentage?: number
          created_at?: string
          updated_at?: string
        }
      }
      budget_plans: {
        Row: {
          id: string
          user_id: string
          year: number
          custom_cuts: unknown
          locked_categories: string[]
          category_budgets: unknown
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          year: number
          custom_cuts?: unknown
          locked_categories?: string[]
          category_budgets?: unknown
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          year?: number
          custom_cuts?: unknown
          locked_categories?: string[]
          category_budgets?: unknown
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
