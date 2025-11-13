export type Goal = 'hipertrofia' | 'definicao' | 'perda_gordura'
export type Equipment = 'academia' | 'casa' | 'elasticos' | 'peso_corporal'
export type Gender = 'masculino' | 'feminino'

export interface UserProfile {
  id?: string
  user_id: string
  weight: number
  height: number
  age: number
  gender: Gender
  goal: Goal
  training_days: number
  equipment: Equipment
  weekly_budget: number
  is_premium: boolean
}

export interface MealPlan {
  id?: string
  user_id: string
  day: number
  meal_name: string
  foods: string
  protein: number
  carbs: number
  fats: number
  calories: number
}

export interface WorkoutPlan {
  id?: string
  user_id: string
  day: number
  exercise_name: string
  sets: number
  reps: string
  rest: number
  notes: string
}

export interface ProgressTracking {
  id?: string
  user_id: string
  date: string
  weight: number
  workout_completed: boolean
  protein_intake: number
  carbs_intake: number
  fats_intake: number
  notes: string
}

export interface MacroTargets {
  calories: number
  protein: number
  carbs: number
  fats: number
}
