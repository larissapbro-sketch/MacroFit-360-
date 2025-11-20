'use client'

import { useState } from 'react'
import { getBrowserSupabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dumbbell, User, Target, TrendingUp, Loader2, Upload, Camera, Sparkles, AlertCircle } from 'lucide-react'

interface OnboardingFormProps {
  userId: string
  onComplete: () => void
}

export default function OnboardingForm({ userId, onComplete }: OnboardingFormProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    age: '',
    gender: 'male',
    weight: '',
    height: '',
    goal: 'muscle_gain',
    training_days: '3',
    equipment: 'full_gym',
    weekly_budget: '300'
  })

  // Função para fazer upload da imagem e obter URL pública
  async function uploadImage(file: File): Promise<string | null> {
    try {
      const supabase = getBrowserSupabase()
      if (!supabase) {
        setErrorMessage('Erro: Supabase não configurado')
        return null
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `profile-images/${fileName}`

      console.log('Iniciando upload:', { filePath, fileType: file.type, fileSize: file.size })

      const { error: uploadError, data } = await supabase.storage
        .from('user-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        })

      if (uploadError) {
        console.error('Erro detalhado no upload:', {
          message: uploadError.message,
          name: uploadError.name,
          stack: uploadError.stack
        })
        setErrorMessage(`Erro no upload: ${uploadError.message}`)
        return null
      }

      console.log('Upload bem-sucedido:', data)

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('user-images')
        .getPublicUrl(filePath)

      console.log('URL pública gerada:', publicUrl)

      return publicUrl
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error)
      setErrorMessage(`Erro ao fazer upload: ${error.message}`)
      return null
    }
  }

  // Função para analisar imagem com OpenAI
  async function analyzeImage(imageUrl: string) {
    try {
      setAnalyzing(true)
      setErrorMessage(null)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 55000) // 55 segundos timeout

      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.hint || errorData.error || 'Erro ao analisar imagem')
      }

      const result = await response.json()
      
      if (result.success && result.analysis) {
        setAiAnalysis(result.analysis)
        
        // Preencher formulário automaticamente com dados da análise
        if (result.analysis.peso_estimado) {
          setFormData(prev => ({ ...prev, weight: result.analysis.peso_estimado.toString() }))
        }
        if (result.analysis.altura_estimada) {
          setFormData(prev => ({ ...prev, height: result.analysis.altura_estimada.toString() }))
        }
        if (result.analysis.idade_estimada) {
          setFormData(prev => ({ ...prev, age: result.analysis.idade_estimada.toString() }))
        }
        if (result.analysis.sexo) {
          const gender = result.analysis.sexo.toLowerCase().includes('masc') ? 'male' : 'female'
          setFormData(prev => ({ ...prev, gender }))
        }
        if (result.analysis.objetivo_recomendado) {
          const goalMap: any = {
            'perda de peso': 'weight_loss',
            'ganho de massa': 'muscle_gain',
            'definição': 'maintenance',
            'manutenção': 'maintenance'
          }
          const goalKey = Object.keys(goalMap).find(key => 
            result.analysis.objetivo_recomendado.toLowerCase().includes(key)
          )
          if (goalKey) {
            setFormData(prev => ({ ...prev, goal: goalMap[goalKey] }))
          }
        }
        if (result.analysis.frequencia_semanal) {
          setFormData(prev => ({ ...prev, training_days: result.analysis.frequencia_semanal.toString() }))
        }
        if (result.analysis.equipamento_sugerido) {
          const equipMap: any = {
            'academia': 'full_gym',
            'casa': 'home_basic',
            'peso corporal': 'home_minimal',
            'ar livre': 'outdoor'
          }
          const equipKey = Object.keys(equipMap).find(key => 
            result.analysis.equipamento_sugerido.toLowerCase().includes(key)
          )
          if (equipKey) {
            setFormData(prev => ({ ...prev, equipment: equipMap[equipKey] }))
          }
        }
        if (result.analysis.orcamento_mensal) {
          setFormData(prev => ({ ...prev, weekly_budget: result.analysis.orcamento_mensal.toString() }))
        }

        return true
      }
      
      return false
    } catch (error: any) {
      console.error('Erro na análise:', error)
      
      if (error.name === 'AbortError') {
        setErrorMessage('Tempo limite excedido. A imagem pode ser muito grande. Tente com uma imagem menor ou preencha manualmente.')
      } else {
        setErrorMessage(error.message || 'Erro ao analisar imagem. Preencha manualmente.')
      }
      
      return false
    } finally {
      setAnalyzing(false)
    }
  }

  // Handler para seleção de imagem
  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorMessage(null)

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, selecione uma imagem válida (JPG, PNG, etc)')
      return
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Imagem muito grande. Máximo 5MB. Tente comprimir a imagem.')
      return
    }

    setImageFile(file)
    
    // Criar preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Processar análise da imagem
  async function processImageAnalysis() {
    if (!imageFile) {
      setErrorMessage('Por favor, selecione uma imagem primeiro')
      return
    }

    setAnalyzing(true)
    setErrorMessage(null)

    try {
      // 1. Upload da imagem
      const imageUrl = await uploadImage(imageFile)
      
      if (!imageUrl) {
        setErrorMessage('Erro ao fazer upload da imagem. Verifique sua conexão.')
        return
      }

      // 2. Analisar com OpenAI
      const success = await analyzeImage(imageUrl)
      
      if (success) {
        // Avançar para próximo step automaticamente
        nextStep()
      }
    } catch (error: any) {
      console.error('Erro no processamento:', error)
      setErrorMessage('Erro ao processar imagem. Tente novamente ou preencha manualmente.')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleSubmit() {
    try {
      setLoading(true)
      setErrorMessage(null)
      const supabase = getBrowserSupabase()

      if (!supabase) {
        setErrorMessage('Erro: Supabase não configurado')
        return
      }

      // Validar dados antes de enviar
      if (!formData.age || !formData.weight || !formData.height) {
        setErrorMessage('Por favor, preencha todos os campos obrigatórios (idade, peso e altura)')
        return
      }

      const age = parseInt(formData.age)
      const weight = parseFloat(formData.weight)
      const height = parseFloat(formData.height)
      const training_days = parseInt(formData.training_days)
      const weekly_budget = parseFloat(formData.weekly_budget)

      // Validar valores numéricos
      if (isNaN(age) || age < 10 || age > 120) {
        setErrorMessage('Idade inválida. Deve estar entre 10 e 120 anos.')
        return
      }

      if (isNaN(weight) || weight < 30 || weight > 300) {
        setErrorMessage('Peso inválido. Deve estar entre 30 e 300 kg.')
        return
      }

      if (isNaN(height) || height < 100 || height > 250) {
        setErrorMessage('Altura inválida. Deve estar entre 100 e 250 cm.')
        return
      }

      if (isNaN(training_days) || training_days < 1 || training_days > 7) {
        setErrorMessage('Dias de treino inválidos. Deve estar entre 1 e 7.')
        return
      }

      if (isNaN(weekly_budget) || weekly_budget < 0) {
        setErrorMessage('Orçamento inválido. Deve ser um valor positivo.')
        return
      }

      console.log('Criando perfil com dados:', {
        user_id: userId,
        age,
        gender: formData.gender,
        weight,
        height,
        goal: formData.goal,
        training_days,
        equipment: formData.equipment,
        weekly_budget,
        is_premium: false
      })

      // Criar perfil do usuário com TODOS os campos obrigatórios
      const { data: profileData, error: profileError } = await supabase
        .from('users_profile')
        .insert({
          user_id: userId,
          age,
          gender: formData.gender,
          weight,
          height,
          goal: formData.goal,
          training_days,
          equipment: formData.equipment,
          weekly_budget,
          is_premium: false
        })
        .select()

      if (profileError) {
        console.error('Erro detalhado ao criar perfil:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        })
        
        let errorMsg = 'Erro ao criar perfil: '
        if (profileError.message) {
          errorMsg += profileError.message
        }
        if (profileError.hint) {
          errorMsg += ` (Dica: ${profileError.hint})`
        }
        if (profileError.details) {
          errorMsg += ` - Detalhes: ${profileError.details}`
        }
        
        setErrorMessage(errorMsg)
        return
      }

      console.log('Perfil criado com sucesso:', profileData)

      // Inserir dados de exemplo de progresso (últimos 7 dias)
      const progressData = []
      const today = new Date()
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        
        progressData.push({
          user_id: userId,
          weight: weight - (i * 0.2),
          protein_intake: 120 + Math.floor(Math.random() * 30),
          carbs_intake: 180 + Math.floor(Math.random() * 40),
          fats_intake: 50 + Math.floor(Math.random() * 15),
          workout_completed: Math.random() > 0.3,
          created_at: date.toISOString()
        })
      }

      const { error: progressError } = await supabase
        .from('progress')
        .insert(progressData)

      if (progressError) {
        console.error('Erro ao inserir progresso:', progressError)
      }

      // Inserir planos de refeição de exemplo (7 dias)
      const mealPlans = []
      const meals = [
        { name: 'Café da Manhã', foods: '3 ovos mexidos + 2 fatias de pão integral + 1 banana', protein: 25, carbs: 45, fats: 15, calories: 410 },
        { name: 'Lanche da Manhã', foods: 'Iogurte grego + granola', protein: 15, carbs: 30, fats: 8, calories: 250 },
        { name: 'Almoço', foods: '150g frango grelhado + 200g arroz integral + salada', protein: 45, carbs: 60, fats: 10, calories: 510 },
        { name: 'Lanche da Tarde', foods: 'Whey protein + 1 maçã', protein: 25, carbs: 20, fats: 2, calories: 200 },
        { name: 'Jantar', foods: '150g peixe + 200g batata doce + brócolis', protein: 40, carbs: 45, fats: 8, calories: 420 }
      ]

      for (let day = 1; day <= 7; day++) {
        for (const meal of meals) {
          mealPlans.push({
            user_id: userId,
            day: day,
            meal_name: meal.name,
            foods: meal.foods,
            protein: meal.protein,
            carbs: meal.carbs,
            fats: meal.fats,
            calories: meal.calories
          })
        }
      }

      const { error: mealError } = await supabase
        .from('meal_plans')
        .insert(mealPlans)

      if (mealError) {
        console.error('Erro ao inserir planos de refeição:', mealError)
      }

      // Inserir planos de treino de exemplo (5 dias)
      const workoutPlans = [
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
        },
        {
          day: 3,
          name: 'Treino C - Pernas',
          exercises: [
            { name: 'Agachamento livre', sets: 4, reps: '8-12', rest: 120, notes: 'Profundidade completa' },
            { name: 'Leg press', sets: 4, reps: '10-15', rest: 90, notes: 'Pés na largura dos ombros' },
            { name: 'Cadeira extensora', sets: 3, reps: '12-15', rest: 60, notes: 'Contração no topo' },
            { name: 'Mesa flexora', sets: 3, reps: '12-15', rest: 60, notes: 'Controle o movimento' },
            { name: 'Panturrilha em pé', sets: 4, reps: '15-20', rest: 45, notes: 'Amplitude máxima' }
          ]
        },
        {
          day: 4,
          name: 'Treino D - Ombros e Abdômen',
          exercises: [
            { name: 'Desenvolvimento com barra', sets: 4, reps: '8-12', rest: 90, notes: 'Pegada média' },
            { name: 'Elevação lateral', sets: 3, reps: '12-15', rest: 60, notes: 'Cotovelos levemente flexionados' },
            { name: 'Elevação frontal', sets: 3, reps: '12-15', rest: 60, notes: 'Alternado' },
            { name: 'Crucifixo inverso', sets: 3, reps: '12-15', rest: 60, notes: 'Foco no deltoide posterior' },
            { name: 'Abdominal supra', sets: 4, reps: '15-20', rest: 45, notes: 'Contração máxima' }
          ]
        },
        {
          day: 5,
          name: 'Treino E - Full Body',
          exercises: [
            { name: 'Supino reto', sets: 3, reps: '10-12', rest: 75, notes: 'Carga moderada' },
            { name: 'Remada curvada', sets: 3, reps: '10-12', rest: 75, notes: 'Foco nas costas' },
            { name: 'Agachamento', sets: 3, reps: '10-12', rest: 90, notes: 'Técnica perfeita' },
            { name: 'Desenvolvimento', sets: 3, reps: '10-12', rest: 75, notes: 'Controle total' },
            { name: 'Rosca direta', sets: 3, reps: '12-15', rest: 60, notes: 'Sem balanço' }
          ]
        }
      ]

      const workoutInserts = []
      for (const workout of workoutPlans) {
        for (const exercise of workout.exercises) {
          workoutInserts.push({
            user_id: userId,
            day: workout.day,
            exercise_name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            rest: exercise.rest,
            notes: exercise.notes
          })
        }
      }

      const { error: workoutError } = await supabase
        .from('workout_plans')
        .insert(workoutInserts)

      if (workoutError) {
        console.error('Erro ao inserir planos de treino:', workoutError)
      }

      // Sucesso! Completar onboarding
      onComplete()
    } catch (error: any) {
      console.error('Erro ao salvar dados:', error)
      setErrorMessage('Erro ao salvar dados: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  function nextStep() {
    if (step < 4) setStep(step + 1)
  }

  function prevStep() {
    if (step > 1) setStep(step - 1)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-xl">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl text-white">Bem-vindo ao MacroFit 360°</CardTitle>
              <CardDescription className="text-slate-400">
                Vamos personalizar sua experiência com IA
              </CardDescription>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-all ${
                  s <= step ? 'bg-gradient-to-r from-cyan-500 to-blue-600' : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-400">{errorMessage}</p>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          )}

          {/* Step 1: Upload de Imagem e Análise IA */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 mb-4">
                <Camera className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Análise Corporal com IA</h3>
              </div>

              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="text-sm text-slate-300">
                      <strong className="text-cyan-400">Tecnologia GPT-4o Vision</strong> - A IA mais avançada da OpenAI irá analisar sua foto e extrair:
                    </p>
                    <ul className="text-xs text-slate-400 space-y-1 ml-4">
                      <li>• Peso, altura e idade estimados</li>
                      <li>• Tipo corporal e percentual de gordura</li>
                      <li>• Objetivo ideal (ganho de massa, perda de peso, etc)</li>
                      <li>• Frequência de treino recomendada</li>
                      <li>• Equipamento sugerido</li>
                      <li>• Orçamento nutricional estimado</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Upload Area */}
              <div className="space-y-4">
                <Label className="text-slate-300">Foto Corporal (Opcional mas Recomendado)</Label>
                
                {!imagePreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-cyan-500 transition-colors bg-slate-800/50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-12 h-12 text-slate-500 mb-3" />
                      <p className="mb-2 text-sm text-slate-400">
                        <span className="font-semibold text-cyan-400">Clique para fazer upload</span> ou arraste
                      </p>
                      <p className="text-xs text-slate-500">PNG, JPG ou JPEG (máx. 5MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-xl"
                    />
                    <Button
                      onClick={() => {
                        setImagePreview(null)
                        setImageFile(null)
                        setAiAnalysis(null)
                        setErrorMessage(null)
                      }}
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                    >
                      Remover
                    </Button>
                  </div>
                )}

                {aiAnalysis && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <p className="text-sm text-green-400 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Análise concluída! Seus dados foram preenchidos automaticamente.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Informações Pessoais */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 mb-4">
                <User className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Informações Pessoais</h3>
              </div>

              {aiAnalysis && (
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 mb-4">
                  <p className="text-xs text-cyan-400">
                    ✨ Dados preenchidos automaticamente pela IA. Você pode ajustar se necessário.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-slate-300">Idade</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="25"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Gênero</Label>
                  <RadioGroup
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    className="flex gap-4 pt-2"
                  >
                    <div className="flex items-center space-x-2 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 hover:border-cyan-500 transition-colors cursor-pointer">
                      <RadioGroupItem value="male" id="male" className="border-slate-600" />
                      <Label htmlFor="male" className="text-slate-300 cursor-pointer font-normal">Masculino</Label>
                    </div>
                    <div className="flex items-center space-x-2 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 hover:border-cyan-500 transition-colors cursor-pointer">
                      <RadioGroupItem value="female" id="female" className="border-slate-600" />
                      <Label htmlFor="female" className="text-slate-300 cursor-pointer font-normal">Feminino</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-slate-300">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="75.0"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height" className="text-slate-300">Altura (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    placeholder="175"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Objetivos */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 mb-4">
                <Target className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Seus Objetivos</h3>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Objetivo Principal</Label>
                <Select
                  value={formData.goal}
                  onValueChange={(value) => setFormData({ ...formData, goal: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weight_loss">Perder Peso</SelectItem>
                    <SelectItem value="muscle_gain">Ganhar Massa Muscular</SelectItem>
                    <SelectItem value="maintenance">Manter Forma</SelectItem>
                    <SelectItem value="performance">Melhorar Performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Dias de Treino por Semana</Label>
                <Select
                  value={formData.training_days}
                  onValueChange={(value) => setFormData({ ...formData, training_days: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 dias</SelectItem>
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="4">4 dias</SelectItem>
                    <SelectItem value="5">5 dias</SelectItem>
                    <SelectItem value="6">6 dias</SelectItem>
                    <SelectItem value="7">7 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 4: Equipamento e Orçamento */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 mb-4">
                <TrendingUp className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Equipamento e Orçamento</h3>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Onde você treina?</Label>
                <Select
                  value={formData.equipment}
                  onValueChange={(value) => setFormData({ ...formData, equipment: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_gym">Academia Completa</SelectItem>
                    <SelectItem value="home_basic">Casa (Equipamento Básico)</SelectItem>
                    <SelectItem value="home_minimal">Casa (Sem Equipamento)</SelectItem>
                    <SelectItem value="outdoor">Treino ao Ar Livre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget" className="text-slate-300">Orçamento Semanal para Alimentação (R$)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.weekly_budget}
                  onChange={(e) => setFormData({ ...formData, weekly_budget: e.target.value })}
                  placeholder="300"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4 mt-6">
                <p className="text-sm text-cyan-400">
                  ✨ Estamos criando seu plano personalizado com base nas suas informações!
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-4">
            {step > 1 && (
              <Button
                onClick={prevStep}
                variant="outline"
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                disabled={analyzing || loading}
              >
                Voltar
              </Button>
            )}
            
            {step === 1 && imageFile && !aiAnalysis ? (
              <Button
                onClick={processImageAnalysis}
                disabled={analyzing}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analisando com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analisar com IA
                  </>
                )}
              </Button>
            ) : step < 4 ? (
              <Button
                onClick={nextStep}
                disabled={analyzing || loading}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold"
              >
                {step === 1 && !imageFile ? 'Pular Análise IA' : 'Próximo'}
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading || !formData.age || !formData.weight || !formData.height}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando seu plano...
                  </>
                ) : (
                  'Começar Jornada'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
