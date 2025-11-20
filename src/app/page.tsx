'use client'

import { useState, useEffect } from 'react'
import { getBrowserSupabase, isSupabaseConfigured } from '@/lib/supabase'
import { getCurrentUserProfile } from '@/lib/profile'
import { Button } from '@/components/ui/button'
import { Dumbbell, Utensils, TrendingUp, Crown, Bell, LogOut, AlertCircle } from 'lucide-react'
import OnboardingForm from '@/components/onboarding-form'
import Dashboard from '@/components/dashboard'
import PlansView from '@/components/plans-view'
import PremiumModal from '@/components/premium-modal'
import { useRouter } from 'next/navigation'

type View = 'onboarding' | 'dashboard' | 'plans' | 'premium'

export default function Home() {
  const router = useRouter()
  const [view, setView] = useState<View>('onboarding')
  const [userId, setUserId] = useState<string | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [connectionError, setConnectionError] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      setConnectionError(false)

      // Verificar se Supabase está configurado ANTES de qualquer operação
      if (!isSupabaseConfigured()) {
        console.error('⚠️ Supabase não configurado - variáveis de ambiente ausentes!')
        setConnectionError(true)
        setLoading(false)
        return
      }

      // Obter cliente Supabase no browser
      const supabase = getBrowserSupabase()

      if (!supabase) {
        console.error('⚠️ Cliente Supabase não disponível - variáveis de ambiente não configuradas!')
        setConnectionError(true)
        setLoading(false)
        return
      }

      // Verificar se usuário está autenticado com timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      );

      const sessionPromise = supabase.auth.getSession();

      const { data: { session }, error: sessionError } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]) as any;

      if (sessionError) {
        console.error('Erro ao verificar sessão:', sessionError)
        
        // Se for erro de rede, mostrar mensagem apropriada
        if (sessionError.message?.includes('fetch') || sessionError.message?.includes('network')) {
          setConnectionError(true)
          setLoading(false)
          return
        }
        
        router.push('/login')
        return
      }

      if (!session) {
        // Não autenticado, redirecionar para login
        router.push('/login')
        return
      }

      const user = session.user
      setUserId(user.id)
      setUserName(user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário')

      // Usar a função getCurrentUserProfile com tratamento de erro
      const profile = await getCurrentUserProfile()

      if (profile) {
        setIsPremium(profile.is_premium || false)
        setView('dashboard')
      } else {
        // Usuário autenticado mas sem perfil, mostrar onboarding
        setView('onboarding')
      }
    } catch (error: any) {
      console.error('Erro ao verificar autenticação:', error)
      
      // Tratamento específico para erros de timeout e rede
      if (error.message?.includes('Timeout') || error.message?.includes('fetch')) {
        setConnectionError(true)
        setLoading(false)
        return
      }
      
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    try {
      const supabase = getBrowserSupabase()
      if (!supabase) {
        console.error('Cliente Supabase não disponível')
        return
      }
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  function handleOnboardingComplete() {
    setView('dashboard')
  }

  function handleUpgradeToPremium() {
    setShowPremiumModal(true)
  }

  // Tela de erro de conexão
  if (connectionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 text-center">
          <div className="bg-red-500/10 p-4 rounded-xl inline-block mb-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Erro de Conexão</h2>
          <p className="text-slate-400 mb-6">
            Não foi possível conectar ao Supabase. Verifique:
          </p>
          <ul className="text-left text-slate-400 mb-6 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              <span>Sua conexão com a internet</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              <span>Se as variáveis de ambiente estão configuradas</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              <span>Se o projeto Supabase está ativo</span>
            </li>
          </ul>
          <Button
            onClick={() => {
              setLoading(true)
              checkAuth()
            }}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-4 rounded-xl inline-block mb-4 animate-pulse">
            <Dumbbell className="w-12 h-12 text-white" />
          </div>
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-xl">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">MacroFit 360°</h1>
                <p className="text-xs text-slate-400">Treino e Alimentação por IA</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* User Info */}
              <div className="hidden sm:block text-right mr-2">
                <p className="text-sm font-medium text-white">{userName}</p>
                <p className="text-xs text-slate-400">Bem-vindo!</p>
              </div>

              {/* Premium Badge */}
              {isPremium && (
                <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-600 px-4 py-2 rounded-lg">
                  <Crown className="w-4 h-4 text-white" />
                  <span className="text-sm font-semibold text-white">Premium</span>
                </div>
              )}

              {/* Upgrade Button */}
              {!isPremium && view !== 'onboarding' && (
                <Button
                  onClick={handleUpgradeToPremium}
                  className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-semibold"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Upgrade Premium</span>
                  <span className="sm:hidden">Premium</span>
                </Button>
              )}

              {/* Logout Button */}
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      {view !== 'onboarding' && (
        <nav className="border-b border-slate-800 bg-slate-900/50">
          <div className="container mx-auto px-4">
            <div className="flex gap-1">
              <button
                onClick={() => setView('dashboard')}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
                  view === 'dashboard'
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => setView('plans')}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
                  view === 'plans'
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Utensils className="w-4 h-4" />
                Meus Planos
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {view === 'onboarding' && userId && (
          <OnboardingForm userId={userId} onComplete={handleOnboardingComplete} />
        )}
        {view === 'dashboard' && userId && (
          <Dashboard userId={userId} isPremium={isPremium} />
        )}
        {view === 'plans' && userId && (
          <PlansView userId={userId} isPremium={isPremium} />
        )}
      </main>

      {/* Premium Modal */}
      {showPremiumModal && userId && (
        <PremiumModal
          userId={userId}
          onClose={() => setShowPremiumModal(false)}
          onUpgrade={() => {
            setIsPremium(true)
            setShowPremiumModal(false)
          }}
        />
      )}

      {/* Notification Bell (Fixed) */}
      {view !== 'onboarding' && (
        <button className="fixed bottom-6 right-6 bg-gradient-to-br from-cyan-500 to-blue-600 p-4 rounded-full shadow-2xl hover:scale-110 transition-transform">
          <Bell className="w-6 h-6 text-white" />
        </button>
      )}
    </div>
  )
}
