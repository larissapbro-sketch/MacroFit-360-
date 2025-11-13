'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Activity, Flame, Apple, Dumbbell } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface DashboardProps {
  userId: string
  isPremium: boolean
}

export default function Dashboard({ userId, isPremium }: DashboardProps) {
  const [profile, setProfile] = useState<any>(null)
  const [weekProgress, setWeekProgress] = useState<any[]>([])
  const [todayProgress, setTodayProgress] = useState({
    protein: 0,
    carbs: 0,
    fats: 0,
    workoutCompleted: false
  })

  useEffect(() => {
    loadDashboardData()
  }, [userId])

  async function loadDashboardData() {
    try {
      // Carregar perfil
      const { data: profileData } = await supabase
        .from('users_profile')
        .select('*')
        .eq('user_id', userId)
        .single()

      setProfile(profileData)

      // Carregar progresso da semana
      const { data: progressData } = await supabase
        .from('progress_tracking')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true })
        .limit(7)

      setWeekProgress(progressData || [])
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    }
  }

  const macroTargets = profile ? {
    protein: 150, // Calculado dinamicamente em produção
    carbs: 200,
    fats: 60,
    calories: 2200
  } : null

  const proteinProgress = macroTargets ? (todayProgress.protein / macroTargets.protein) * 100 : 0
  const carbsProgress = macroTargets ? (todayProgress.carbs / macroTargets.carbs) * 100 : 0
  const fatsProgress = macroTargets ? (todayProgress.fats / macroTargets.fats) * 100 : 0

  const chartData = weekProgress.map((day, index) => ({
    name: `Dia ${index + 1}`,
    peso: day.weight,
    proteina: day.protein_intake,
    carboidratos: day.carbs_intake,
    gorduras: day.fats_intake
  }))

  return (
    <div className="space-y-6">
      {/* Notificação Motivacional */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border-cyan-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500 p-2 rounded-lg">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold">🔥 Você está arrasando!</p>
              <p className="text-slate-400 text-sm">Continue assim para alcançar suas metas!</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Peso Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{profile?.weight || 0} kg</div>
            <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
              <TrendingDown className="w-3 h-3" />
              -2kg esta semana
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Flame className="w-4 h-4" />
              Calorias Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">1850</div>
            <p className="text-xs text-slate-400 mt-1">Meta: {macroTargets?.calories || 0} kcal</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              Treinos Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">4/5</div>
            <p className="text-xs text-cyan-400 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              80% concluído
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Apple className="w-4 h-4" />
              Consistência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">12</div>
            <p className="text-xs text-slate-400 mt-1">dias seguidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Macros Progress */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Macros de Hoje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Proteínas</span>
              <span className="text-white font-semibold">{todayProgress.protein}g / {macroTargets?.protein}g</span>
            </div>
            <Progress value={proteinProgress} className="h-2 bg-slate-800" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Carboidratos</span>
              <span className="text-white font-semibold">{todayProgress.carbs}g / {macroTargets?.carbs}g</span>
            </div>
            <Progress value={carbsProgress} className="h-2 bg-slate-800" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Gorduras</span>
              <span className="text-white font-semibold">{todayProgress.fats}g / {macroTargets?.fats}g</span>
            </div>
            <Progress value={fatsProgress} className="h-2 bg-slate-800" />
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Evolução de Peso</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Line type="monotone" dataKey="peso" stroke="#06b6d4" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Macros Semanais</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Legend />
                <Bar dataKey="proteina" fill="#06b6d4" />
                <Bar dataKey="carboidratos" fill="#8b5cf6" />
                <Bar dataKey="gorduras" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Premium Upsell */}
      {!isPremium && (
        <Card className="bg-gradient-to-r from-orange-500/10 to-pink-600/10 border-orange-500/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <h3 className="text-xl font-bold text-white">Desbloqueie Todo o Potencial</h3>
              <p className="text-slate-400">
                Upgrade para Premium e tenha acesso a planos completos, histórico avançado e muito mais!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
