'use client'

import { useState } from 'react'
import { getBrowserSupabase, isSupabaseConfigured } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dumbbell, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Forçar renderização dinâmica (não pré-renderizar durante build)
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Verificar se o Supabase está configurado ANTES de tentar login
      if (!isSupabaseConfigured()) {
        setError('Supabase não está configurado. Verifique as variáveis de ambiente.')
        setLoading(false)
        return
      }

      const supabase = getBrowserSupabase()

      if (!supabase) {
        setError('Cliente Supabase não disponível. Verifique a configuração.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // Verificar se usuário tem perfil
        const { data: profile } = await supabase
          .from('users_profile')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profile) {
          router.push('/')
        } else {
          router.push('/')
        }
      }
    } catch (err: any) {
      // Tratamento específico para erros de rede
      if (err.message?.includes('fetch') || err.message?.includes('Failed to fetch')) {
        setError('Erro de conexão. Verifique sua internet e tente novamente.')
      } else {
        setError(err.message || 'Erro ao fazer login')
      }
    } finally {
      setLoading(false)
    }
  }

  // Verificar se Supabase está configurado ao carregar a página
  const supabaseConfigured = isSupabaseConfigured()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-xl">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-white">MacroFit 360°</h1>
              <p className="text-sm text-slate-400">Treino e Alimentação por IA</p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo de volta</h2>
          <p className="text-slate-400 mb-6">Entre para continuar sua jornada fitness</p>

          {/* Alerta de configuração */}
          {!supabaseConfigured && (
            <div className="bg-orange-500/10 border border-orange-500/50 rounded-lg p-4 mb-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-orange-400 font-semibold mb-1">
                  Configuração Necessária
                </p>
                <p className="text-xs text-orange-300">
                  As variáveis de ambiente do Supabase não estão configuradas. Configure-as para usar o login.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={!supabaseConfigured}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={!supabaseConfigured}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !supabaseConfigured}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                'Entrando...'
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-900 text-slate-400">ou</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-slate-400">
              Não tem uma conta?{' '}
              <Link
                href="/signup"
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
              >
                Cadastre-se grátis
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade
        </p>
      </div>
    </div>
  )
}
