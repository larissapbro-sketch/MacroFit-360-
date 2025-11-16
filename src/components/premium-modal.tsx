'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Crown, Check, Sparkles, Copy, Loader2, CreditCard } from 'lucide-react'
import { CreatePaymentResponse } from '@/lib/types/payment'

interface PremiumModalProps {
  userId: string
  onClose: () => void
  onUpgrade: () => void
}

export default function PremiumModal({ userId, onClose, onUpgrade }: PremiumModalProps) {
  const [loading, setLoading] = useState(false)
  const [paymentData, setPaymentData] = useState<CreatePaymentResponse | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<'pix' | 'credit_card' | null>(null)
  const [copied, setCopied] = useState(false)
  const [polling, setPolling] = useState(false)

  // Polling para verificar status do pagamento
  useEffect(() => {
    if (!polling || !paymentData?.subscriptionId) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/subscription-status?userId=${userId}`)
        const data = await response.json()

        if (data.isPremium) {
          setPolling(false)
          onUpgrade() // Atualiza o estado no componente pai
          onClose()
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error)
      }
    }, 3000) // Verifica a cada 3 segundos

    return () => clearInterval(interval)
  }, [polling, paymentData, userId, onUpgrade, onClose])

  const handlePayment = async (method: 'pix' | 'credit_card') => {
    setLoading(true)
    setSelectedMethod(method)

    try {
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          planId: 'premium_monthly',
          paymentMethod: method
        })
      })

      const data: CreatePaymentResponse = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar pagamento')
      }

      setPaymentData(data)

      // Se for PIX, iniciar polling
      if (method === 'pix') {
        setPolling(true)
      }

      // Se for cartão, redirecionar para checkout
      if (method === 'credit_card' && data.checkout_url) {
        window.location.href = data.checkout_url
      }

    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error)
      alert(error.message || 'Erro ao processar pagamento. Tente novamente.')
      setPaymentData(null)
      setSelectedMethod(null)
    } finally {
      setLoading(false)
    }
  }

  const copyPixCode = () => {
    if (paymentData?.copy_paste) {
      navigator.clipboard.writeText(paymentData.copy_paste)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Tela de pagamento PIX
  if (selectedMethod === 'pix' && paymentData) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-slate-900 border-slate-800 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-white">
              Pagamento PIX
            </CardTitle>
            <p className="text-slate-400 text-sm mt-2">
              Escaneie o QR Code ou copie o código
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* QR Code */}
            {paymentData.qr_code_base64 && (
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-xl">
                  <img
                    src={`data:image/png;base64,${paymentData.qr_code_base64}`}
                    alt="QR Code PIX"
                    className="w-64 h-64"
                  />
                </div>
              </div>
            )}

            {/* Código PIX Copia e Cola */}
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Código PIX (Copia e Cola)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={paymentData.copy_paste || ''}
                  readOnly
                  className="flex-1 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-mono"
                />
                <Button
                  onClick={copyPixCode}
                  className="bg-slate-700 hover:bg-slate-600"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Status */}
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 text-center">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-2" />
              <p className="text-white font-medium">Aguardando pagamento...</p>
              <p className="text-slate-400 text-sm mt-1">
                Você será redirecionado automaticamente após a confirmação
              </p>
            </div>

            {/* Expiração */}
            {paymentData.expires_at && (
              <p className="text-xs text-slate-500 text-center">
                Este QR Code expira em 30 minutos
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Tela principal de seleção
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-slate-900 border-slate-800 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-orange-500 to-pink-600 p-4 rounded-2xl">
              <Crown className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-white">
            Upgrade para Premium
          </CardTitle>
          <p className="text-slate-400 mt-2">
            Desbloqueie todo o potencial do MacroFit 360°
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Free Plan */}
            <div className="bg-slate-800/50 p-6 rounded-xl space-y-4">
              <h3 className="text-lg font-semibold text-white">Plano Gratuito</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-slate-400">
                  <Check className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">2 treinos por semana</span>
                </div>
                <div className="flex items-start gap-2 text-slate-400">
                  <Check className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">3 dias de cardápio</span>
                </div>
                <div className="flex items-start gap-2 text-slate-400">
                  <Check className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Dashboard básico</span>
                </div>
              </div>
            </div>

            {/* Premium Plan */}
            <div className="bg-gradient-to-br from-orange-500/20 to-pink-600/20 border-2 border-orange-500/50 p-6 rounded-xl space-y-4 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-orange-500 to-pink-600 text-white border-0">
                  Recomendado
                </Badge>
              </div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-orange-400" />
                Premium
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-white">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">Treinos ilimitados personalizados</span>
                </div>
                <div className="flex items-start gap-2 text-white">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">Cardápio completo de 7 dias</span>
                </div>
                <div className="flex items-start gap-2 text-white">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">Histórico de progresso avançado</span>
                </div>
                <div className="flex items-start gap-2 text-white">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">Gráficos detalhados de evolução</span>
                </div>
                <div className="flex items-start gap-2 text-white">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">Sugestões de suplementos</span>
                </div>
                <div className="flex items-start gap-2 text-white">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">Ajustes automáticos semanais</span>
                </div>
                <div className="flex items-start gap-2 text-white">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">Notificações motivacionais</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-slate-800/50 p-6 rounded-xl text-center space-y-4">
            <div>
              <div className="text-4xl font-bold text-white">R$ 39</div>
              <div className="text-slate-400 text-sm">por mês</div>
            </div>

            {/* Botões de Pagamento */}
            <div className="space-y-3">
              <Button
                onClick={() => handlePayment('pix')}
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold text-lg py-6"
              >
                {loading && selectedMethod === 'pix' ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 mr-2" />
                )}
                Pagar com PIX
              </Button>

              <Button
                onClick={() => handlePayment('credit_card')}
                disabled={loading}
                variant="outline"
                className="w-full border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-lg py-6"
              >
                {loading && selectedMethod === 'credit_card' ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="w-5 h-5 mr-2" />
                )}
                Pagar com Cartão
              </Button>
            </div>

            <p className="text-xs text-slate-500">
              Cancele quando quiser. Sem taxas ocultas.
            </p>
          </div>

          {/* Benefits */}
          <div className="border-t border-slate-800 pt-6">
            <h4 className="text-white font-semibold mb-4 text-center">Por que escolher Premium?</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center space-y-2">
                <div className="bg-cyan-500/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                </div>
                <h5 className="text-white font-medium text-sm">IA Avançada</h5>
                <p className="text-xs text-slate-400">Planos que evoluem com você</p>
              </div>
              <div className="text-center space-y-2">
                <div className="bg-cyan-500/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                  <Crown className="w-6 h-6 text-cyan-400" />
                </div>
                <h5 className="text-white font-medium text-sm">Acesso Total</h5>
                <p className="text-xs text-slate-400">Sem limites, sem restrições</p>
              </div>
              <div className="text-center space-y-2">
                <div className="bg-cyan-500/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 text-cyan-400" />
                </div>
                <h5 className="text-white font-medium text-sm">Resultados Reais</h5>
                <p className="text-xs text-slate-400">Acompanhamento profissional</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${className}`}>
      {children}
    </span>
  )
}
