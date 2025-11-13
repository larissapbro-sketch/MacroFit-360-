'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { calculateMacros } from '@/lib/calculations'
import { generateMealPlan, generateWorkoutPlan } from '@/lib/ai-planner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Sparkles } from 'lucide-react'
import { Goal, Equipment, Gender } from '@/lib/types'

interface OnboardingFormProps {
  userId: string
  onComplete: () => void
}

export default function OnboardingForm({ userId, onComplete }: OnboardingFormProps) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    age: '',
    gender: '' as Gender,
    goal: '' as Goal,
    training_days: '',
    equipment: '' as Equipment,
    weekly_budget: ''
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // 1) Verificar autenticação
      const { data: userData, error: userErr } = await supabase.auth.getUser()
      if (userErr || !userData?.user) {
        throw new Error('NOT_AUTHENTICATED')
      }
      const currentUserId = userData.user.id
      const userEmail = userData.user.email || ''
      const userName = userData.user.user_metadata?.name || userEmail.split('@')[0] || 'Usuário'

      console.log('🔐 Usuário autenticado:', currentUserId)

      // 2) Calcular macros baseado nos dados do usuário
      const macros = calculateMacros(
        Number(formData.weight),
        Number(formData.height),
        Number(formData.age),
        formData.gender,
        formData.goal
      )

      console.log('📊 Macros calculados:', macros)

      // 3) Salvar perfil do usuário no Supabase (payload simplificado e alinhado)
      const profilePayload = {
        id: currentUserId,
        weight: Number(formData.weight),
        height: Number(formData.height),
        age: Number(formData.age),
        sex: formData.gender, // Campo correto: 'sex'
        goal: formData.goal,
        training_days: Number(formData.training_days),
        equipment: formData.equipment,
        budget: Number(formData.weekly_budget) // Campo correto: 'budget'
      }

      console.log('💾 Salvando perfil:', profilePayload)

      const { data: profileData, error: profileError } = await supabase
        .from('users_profile')
        .upsert(profilePayload, { onConflict: 'id' })
        .select()

      if (profileError) {
        console.error('❌ Erro ao salvar perfil:', profileError)
        throw new Error(`Erro ao salvar perfil: ${profileError.message}`)
      }

      console.log('✅ Perfil salvo com sucesso:', profileData)

      // 4) Gerar plano alimentar com IA
      console.log('🍽️ Gerando plano alimentar...')
      const mealPlan = await generateMealPlan(
        macros,
        formData.goal,
        Number(formData.weekly_budget),
        false // versão gratuita
      )

      // 5) Salvar plano alimentar no Supabase
      if (mealPlan && mealPlan.length > 0) {
        const mealPlanData = mealPlan.map((meal: any) => ({
          user_id: currentUserId,
          day: meal.day,
          meal_name: meal.meal_name,
          foods: meal.foods,
          protein: meal.protein,
          carbs: meal.carbs,
          fats: meal.fats,
          calories: meal.calories
        }))

        const { error: mealError } = await supabase
          .from('meal_plans')
          .insert(mealPlanData)

        if (mealError) {
          console.error('⚠️ Erro ao salvar plano alimentar:', mealError)
        } else {
          console.log('✅ Plano alimentar salvo com sucesso')
        }
      }

      // 6) Gerar plano de treino com IA
      console.log('💪 Gerando plano de treino...')
      const workoutPlan = await generateWorkoutPlan(
        formData.goal,
        Number(formData.training_days),
        formData.equipment,
        false // versão gratuita
      )

      // 7) Salvar plano de treino no Supabase
      if (workoutPlan && workoutPlan.length > 0) {
        const workoutPlanData = workoutPlan.map((exercise: any) => ({
          user_id: currentUserId,
          day: exercise.day,
          exercise_name: exercise.exercise_name,
          sets: exercise.sets,
          reps: exercise.reps,
          rest: exercise.rest,
          notes: exercise.notes || ''
        }))

        const { error: workoutError } = await supabase
          .from('workout_plans')
          .insert(workoutPlanData)

        if (workoutError) {
          console.error('⚠️ Erro ao salvar plano de treino:', workoutError)
        } else {
          console.log('✅ Plano de treino salvo com sucesso')
        }
      }

      // 8) Completar onboarding e redirecionar
      console.log('🎉 Onboarding completo!')
      
      // Redirecionar para a tela de planos
      window.location.href = '/meus-planos'
    } catch (err: any) {
      console.error('❌ Erro no onboarding:', err)
      alert(`Erro ao salvar seus dados: ${err.message || 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-2xl">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-white">Bem-vindo ao MacroFit 360°</CardTitle>
          <CardDescription className="text-slate-400 text-lg">
            Vamos criar seu plano personalizado em minutos
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Dados Físicos */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white mb-4">📊 Seus Dados Físicos</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-slate-300">Peso (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="Ex: 75"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="height" className="text-slate-300">Altura (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="Ex: 175"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-slate-300">Idade</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="Ex: 28"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-slate-300">Sexo</Label>
                    <Select value={formData.gender} onValueChange={(value: Gender) => setFormData({ ...formData, gender: value })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold"
                  disabled={!formData.weight || !formData.height || !formData.age || !formData.gender}
                >
                  Próximo
                </Button>
              </div>
            )}

            {/* Step 2: Objetivos e Treino */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white mb-4">🎯 Seus Objetivos</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="goal" className="text-slate-300">Objetivo Principal</Label>
                    <Select value={formData.goal} onValueChange={(value: Goal) => setFormData({ ...formData, goal: value })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Selecione seu objetivo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hipertrofia">💪 Hipertrofia (Ganhar Massa)</SelectItem>
                        <SelectItem value="definicao">✨ Definição Muscular</SelectItem>
                        <SelectItem value="perda_gordura">🔥 Perda de Gordura</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="training_days" className="text-slate-300">Dias de Treino por Semana</Label>
                    <Select value={formData.training_days} onValueChange={(value) => setFormData({ ...formData, training_days: value })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Quantos dias?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 dias</SelectItem>
                        <SelectItem value="3">3 dias</SelectItem>
                        <SelectItem value="4">4 dias</SelectItem>
                        <SelectItem value="5">5 dias</SelectItem>
                        <SelectItem value="6">6 dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="equipment" className="text-slate-300">Equipamentos Disponíveis</Label>
                    <Select value={formData.equipment} onValueChange={(value: Equipment) => setFormData({ ...formData, equipment: value })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Onde você treina?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="academia">🏋️ Academia Completa</SelectItem>
                        <SelectItem value="casa">🏠 Casa (Halteres/Barras)</SelectItem>
                        <SelectItem value="elasticos">🎗️ Elásticos de Resistência</SelectItem>
                        <SelectItem value="peso_corporal">💪 Apenas Peso Corporal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weekly_budget" className="text-slate-300">Orçamento Semanal para Alimentação (R$)</Label>
                    <Input
                      id="weekly_budget"
                      type="number"
                      placeholder="Ex: 200"
                      value={formData.weekly_budget}
                      onChange={(e) => setFormData({ ...formData, weekly_budget: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando seu plano...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Criar Meu Plano
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
