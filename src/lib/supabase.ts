"use client"

import { createClient } from '@supabase/supabase-js'

// Função para obter variáveis de ambiente de forma segura
function getEnvVar(key: string): string {
  if (typeof window !== 'undefined') {
    // No browser, use process.env
    return process.env[key] || ''
  }
  // Durante SSR/build, retorne string vazia
  return ''
}

// Obter variáveis de ambiente de forma segura
const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')

// Apenas avisar no browser, não durante o build
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('⚠️ Variáveis de ambiente do Supabase não configuradas!')
}

// Criar cliente com configurações otimizadas
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'x-application-name': 'MacroFit360'
      }
    }
  }
)

// Função auxiliar para verificar conexão
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('users_profile').select('count', { count: 'exact', head: true })
    return !error
  } catch (error) {
    console.error('Erro ao verificar conexão com Supabase:', error)
    return false
  }
}

export type Database = {
  public: {
    Tables: {
      users_profile: {
        Row: {
          id: string
          user_id: string
          weight: number
          height: number
          age: number
          gender: string
          goal: string
          training_days: number
          equipment: string
          weekly_budget: number
          is_premium: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          weight: number
          height: number
          age: number
          gender: string
          goal: string
          training_days: number
          equipment: string
          weekly_budget: number
          is_premium?: boolean
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
        Insert: {
          user_id: string
          day: number
          meal_name: string
          foods: string
          protein: number
          carbs: number
          fats: number
          calories: number
        }
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
          notes: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          day: number
          exercise_name: string
          sets: number
          reps: string
          rest: number
          notes?: string | null
        }
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
        Insert: {
          user_id: string
          date: string
          weight: number
          workout_completed: boolean
          protein_intake: number
          carbs_intake: number
          fats_intake: number
          notes: string
        }
        Update: Partial<Database['public']['Tables']['progress_tracking']['Insert']>
      }
    }
  }
}
