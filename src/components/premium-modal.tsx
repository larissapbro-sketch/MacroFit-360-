'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Crown, Check, Sparkles } from 'lucide-react'

interface PremiumModalProps {
  onClose: () => void
  onUpgrade: () => void
}

export default function PremiumModal({ onClose, onUpgrade }: PremiumModalProps) {
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
            <Button
              onClick={onUpgrade}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-semibold text-lg py-6"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Assinar Agora
            </Button>
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
