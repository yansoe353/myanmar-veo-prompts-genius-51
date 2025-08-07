import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          membership_tier: 'free' | 'pro' | 'premium'
          membership_expiry: string | null
          prompts_used: number
          prompts_limit: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          membership_tier?: 'free' | 'pro' | 'premium'
          membership_expiry?: string | null
          prompts_used?: number
          prompts_limit?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          membership_tier?: 'free' | 'pro' | 'premium'
          membership_expiry?: string | null
          prompts_used?: number
          prompts_limit?: number
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