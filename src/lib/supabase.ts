import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users_profile: {
        Row: {
          id: string
          name: string | null
          email: string | null
          weight: number | null
          height: number | null
          age: number | null
          sex: string | null
          goal: string | null
          training_days: number | null
          equipment: string | null
          budget: number | null
          is_premium: boolean
          created_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          weight?: number | null
          height?: number | null
          age?: number | null
          sex?: string | null
          goal?: string | null
          training_days?: number | null
          equipment?: string | null
          budget?: number | null
          is_premium?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['users_profile']['Insert']>
      }
      meal_plans: {
        Row: {
          id: string
          user_id: string
          day: number
          meal_name: string
          foods: string
          protein: number
          carbs: number
          fats: number
          calories: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['meal_plans']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['meal_plans']['Insert']>
      }
      workout_plans: {
        Row: {
          id: string
          user_id: string
          day: number
          exercise_name: string
          sets: number
          reps: string
          rest: number
          notes: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['workout_plans']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['workout_plans']['Insert']>
      }
      progress_tracking: {
        Row: {
          id: string
          user_id: string
          date: string
          weight: number
          workout_completed: boolean
          protein_intake: number
          carbs_intake: number
          fats_intake: number
          notes: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['progress_tracking']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['progress_tracking']['Insert']>
      }
    }
  }
}
