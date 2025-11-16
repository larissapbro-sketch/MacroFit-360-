'use client'

import { useState, useEffect } from 'react'
import { getBrowserSupabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Utensils, Dumbbell, Lock, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

interface PlansViewProps {
  userId: string
  isPremium: boolean
}

interface MealPlan {
  day: number
  meal_name: string
  foods: string
  protein: number
  carbs: number
  fats: number
  calories: number
}

interface WorkoutPlan {
  day: number
  exercise_name: string
  sets: number
  reps: string
  rest: number
  notes: string | null
}

export default function PlansView({ userId, isPremium }: PlansViewProps) {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPlans()
  }, [userId])

  async function loadPlans() {
    try {
      setLoading(true)
      setError(null)
      
      const supabase = getBrowserSupabase()
      
      if (!supabase) {
        console.error('Cliente Supabase não disponível')
        setError('Erro de conexão com o banco de dados')
        setLoading(false)
        return
      }

      const { data: meals, error: mealsError } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', userId)
        .order('day', { ascending: true })

      if (mealsError) {
        console.error('Erro ao carregar planos de refeição:', mealsError)
        setError('Erro ao carregar planos de refeição')
      } else {
        setMealPlans(meals || [])
      }

      const { data: workouts, error: workoutsError } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', userId)
        .order('day', { ascending: true })

      if (workoutsError) {
        console.error('Erro ao carregar planos de treino:', workoutsError)
        setError('Erro ao carregar planos de treino')
      } else {
        setWorkoutPlans(workouts || [])
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-4 rounded-xl inline-block mb-4 animate-pulse">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-400">Carregando planos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-500/10 border-red-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <div>
              <p className="text-red-400 font-semibold">Erro ao carregar planos</p>
              <p className="text-slate-400 text-sm">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Agrupar refeições por dia
  const mealsByDay = mealPlans.reduce((acc, meal) => {
    if (!acc[meal.day]) acc[meal.day] = []
    acc[meal.day].push(meal)
    return acc
  }, {} as Record<number, MealPlan[]>)

  // Agrupar treinos por dia
  const workoutsByDay = workoutPlans.reduce((acc, workout) => {
    if (!acc[workout.day]) acc[workout.day] = []
    acc[workout.day].push(workout)
    return acc
  }, {} as Record<number, WorkoutPlan[]>)

  const maxDays = isPremium ? 7 : 3
  const maxWorkouts = isPremium ? 7 : 2

  const availableMealDays = Object.keys(mealsByDay).map(Number).sort((a, b) => a - b)
  const availableWorkoutDays = Object.keys(workoutsByDay).map(Number).sort((a, b) => a - b)

  return (
    <div className="space-y-6">
      <Tabs defaultValue="meals" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-900/50 border border-slate-800">
          <TabsTrigger value="meals" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
            <Utensils className="w-4 h-4 mr-2" />
            Alimentação
          </TabsTrigger>
          <TabsTrigger value="workouts" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
            <Dumbbell className="w-4 h-4 mr-2" />
            Treinos
          </TabsTrigger>
        </TabsList>

        {/* Meal Plans */}
        <TabsContent value="meals" className="space-y-4 mt-6">
          {availableMealDays.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Utensils className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Nenhum plano de alimentação disponível</p>
                  <p className="text-slate-500 text-sm mt-1">Complete o onboarding para gerar seus planos</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {availableMealDays.slice(0, maxDays).map((day) => {
                const dayMeals = mealsByDay[day]
                const totalCalories = dayMeals.reduce((sum, meal) => sum + Number(meal.calories), 0)
                
                return (
                  <Card key={day} className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white flex items-center gap-2">
                          <Utensils className="w-5 h-5 text-cyan-400" />
                          Dia {day}
                        </CardTitle>
                        <Badge variant="outline" className="border-cyan-500 text-cyan-400">
                          {totalCalories} kcal
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {dayMeals.map((meal, idx) => (
                        <div key={idx} className="bg-slate-800/50 p-4 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-white">{meal.meal_name}</h4>
                            <Clock className="w-4 h-4 text-slate-400" />
                          </div>
                          <p className="text-slate-300 text-sm">{meal.foods}</p>
                          <div className="flex gap-4 text-xs text-slate-400">
                            <span>🥩 {meal.protein}g proteína</span>
                            <span>🍚 {meal.carbs}g carbs</span>
                            <span>🥑 {meal.fats}g gordura</span>
                            <span>🔥 {meal.calories} kcal</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )
              })}

              {/* Locked Days */}
              {!isPremium && availableMealDays.length > maxDays && (
                <Card className="bg-slate-900/30 border-slate-800 border-dashed">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-3">
                      <Lock className="w-12 h-12 text-slate-600 mx-auto" />
                      <h3 className="text-lg font-semibold text-slate-400">
                        Mais {availableMealDays.length - maxDays} dias bloqueados
                      </h3>
                      <p className="text-sm text-slate-500">
                        Upgrade para Premium e tenha acesso ao cardápio completo de 7 dias
                      </p>
                      <Button className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white">
                        Desbloquear Agora
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Workout Plans */}
        <TabsContent value="workouts" className="space-y-4 mt-6">
          {availableWorkoutDays.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Dumbbell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Nenhum plano de treino disponível</p>
                  <p className="text-slate-500 text-sm mt-1">Complete o onboarding para gerar seus planos</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {availableWorkoutDays.slice(0, maxWorkouts).map((day) => {
                const dayWorkouts = workoutsByDay[day]
                
                return (
                  <Card key={day} className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white flex items-center gap-2">
                          <Dumbbell className="w-5 h-5 text-cyan-400" />
                          Dia {day}
                        </CardTitle>
                        <Badge variant="outline" className="border-cyan-500 text-cyan-400">
                          {dayWorkouts.length} exercícios
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {dayWorkouts.map((exercise, idx) => (
                        <div key={idx} className="bg-slate-800/50 p-4 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-white">{exercise.exercise_name}</h4>
                            <CheckCircle2 className="w-5 h-5 text-slate-600" />
                          </div>
                          <div className="flex gap-4 text-sm text-slate-400">
                            <span>{exercise.sets} séries</span>
                            <span>{exercise.reps} reps</span>
                            <span>{exercise.rest}s descanso</span>
                          </div>
                          {exercise.notes && (
                            <p className="text-xs text-slate-500 mt-2 italic">{exercise.notes}</p>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )
              })}

              {/* Locked Workouts */}
              {!isPremium && availableWorkoutDays.length > maxWorkouts && (
                <Card className="bg-slate-900/30 border-slate-800 border-dashed">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-3">
                      <Lock className="w-12 h-12 text-slate-600 mx-auto" />
                      <h3 className="text-lg font-semibold text-slate-400">
                        Mais {availableWorkoutDays.length - maxWorkouts} treinos bloqueados
                      </h3>
                      <p className="text-sm text-slate-500">
                        Upgrade para Premium e tenha acesso a todos os treinos personalizados
                      </p>
                      <Button className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white">
                        Desbloquear Agora
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
