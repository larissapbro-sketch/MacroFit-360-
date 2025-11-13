'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Utensils, Dumbbell, Lock, CheckCircle2, Clock } from 'lucide-react'

interface PlansViewProps {
  userId: string
  isPremium: boolean
}

export default function PlansView({ userId, isPremium }: PlansViewProps) {
  const [mealPlans, setMealPlans] = useState<any[]>([])
  const [workoutPlans, setWorkoutPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlans()
  }, [userId])

  async function loadPlans() {
    try {
      const { data: meals } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', userId)
        .order('day', { ascending: true })

      const { data: workouts } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', userId)
        .order('day', { ascending: true })

      setMealPlans(meals || [])
      setWorkoutPlans(workouts || [])
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mock data para demonstração
  const mockMealPlan = [
    {
      day: 1,
      meals: [
        { name: 'Café da Manhã', foods: '3 ovos mexidos + 2 fatias de pão integral + 1 banana', protein: 25, carbs: 45, fats: 15, calories: 410 },
        { name: 'Lanche da Manhã', foods: 'Iogurte grego + granola', protein: 15, carbs: 30, fats: 8, calories: 250 },
        { name: 'Almoço', foods: '150g frango grelhado + 200g arroz integral + salada', protein: 45, carbs: 60, fats: 10, calories: 510 },
        { name: 'Lanche da Tarde', foods: 'Whey protein + 1 maçã', protein: 25, carbs: 20, fats: 2, calories: 200 },
        { name: 'Jantar', foods: '150g peixe + 200g batata doce + brócolis', protein: 40, carbs: 45, fats: 8, calories: 420 }
      ]
    },
    { day: 2, meals: [] },
    { day: 3, meals: [] }
  ]

  const mockWorkoutPlan = [
    {
      day: 1,
      name: 'Treino A - Peito e Tríceps',
      exercises: [
        { name: 'Supino reto', sets: 4, reps: '8-12', rest: 90, notes: 'Controle a descida' },
        { name: 'Supino inclinado', sets: 3, reps: '10-12', rest: 75, notes: 'Foco na contração' },
        { name: 'Crucifixo', sets: 3, reps: '12-15', rest: 60, notes: 'Amplitude completa' },
        { name: 'Tríceps testa', sets: 3, reps: '10-12', rest: 60, notes: 'Cotovelos fixos' },
        { name: 'Tríceps corda', sets: 3, reps: '12-15', rest: 60, notes: 'Extensão completa' }
      ]
    },
    {
      day: 2,
      name: 'Treino B - Costas e Bíceps',
      exercises: [
        { name: 'Barra fixa', sets: 4, reps: '6-10', rest: 90, notes: 'Pegada pronada' },
        { name: 'Remada curvada', sets: 4, reps: '8-12', rest: 75, notes: 'Costas retas' },
        { name: 'Pulldown', sets: 3, reps: '10-12', rest: 60, notes: 'Puxar até o peito' },
        { name: 'Rosca direta', sets: 3, reps: '10-12', rest: 60, notes: 'Sem balanço' },
        { name: 'Rosca martelo', sets: 3, reps: '12-15', rest: 60, notes: 'Controle total' }
      ]
    }
  ]

  const maxDays = isPremium ? 7 : 3
  const maxWorkouts = isPremium ? 7 : 2

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
          {mockMealPlan.slice(0, maxDays).map((dayPlan) => (
            <Card key={dayPlan.day} className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-cyan-400" />
                    Dia {dayPlan.day}
                  </CardTitle>
                  <Badge variant="outline" className="border-cyan-500 text-cyan-400">
                    {dayPlan.meals.reduce((acc, m) => acc + m.calories, 0)} kcal
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {dayPlan.meals.map((meal, idx) => (
                  <div key={idx} className="bg-slate-800/50 p-4 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-white">{meal.name}</h4>
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
          ))}

          {/* Locked Days */}
          {!isPremium && mockMealPlan.length > maxDays && (
            <Card className="bg-slate-900/30 border-slate-800 border-dashed">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <Lock className="w-12 h-12 text-slate-600 mx-auto" />
                  <h3 className="text-lg font-semibold text-slate-400">
                    Mais {mockMealPlan.length - maxDays} dias bloqueados
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
        </TabsContent>

        {/* Workout Plans */}
        <TabsContent value="workouts" className="space-y-4 mt-6">
          {mockWorkoutPlan.slice(0, maxWorkouts).map((dayPlan) => (
            <Card key={dayPlan.day} className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-cyan-400" />
                    {dayPlan.name}
                  </CardTitle>
                  <Badge variant="outline" className="border-cyan-500 text-cyan-400">
                    {dayPlan.exercises.length} exercícios
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {dayPlan.exercises.map((exercise, idx) => (
                  <div key={idx} className="bg-slate-800/50 p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-white">{exercise.name}</h4>
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
          ))}

          {/* Locked Workouts */}
          {!isPremium && mockWorkoutPlan.length > maxWorkouts && (
            <Card className="bg-slate-900/30 border-slate-800 border-dashed">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <Lock className="w-12 h-12 text-slate-600 mx-auto" />
                  <h3 className="text-lg font-semibold text-slate-400">
                    Mais {mockWorkoutPlan.length - maxWorkouts} treinos bloqueados
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
