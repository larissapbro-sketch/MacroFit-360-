import OpenAI from 'openai'

type Goal = 'perder_peso' | 'ganhar_massa' | 'manter_peso' | 'hipertrofia' | 'definicao' | 'perda_gordura'
type Equipment = 'academia' | 'casa' | 'elasticos' | 'peso_corporal'

// Função helper para criar cliente OpenAI apenas quando necessário
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
  
  if (!apiKey) {
    throw new Error('Configure sua chave da OpenAI nas variáveis de ambiente')
  }
  
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  })
}

export async function generateMealPlan(
  macros: { calories: number; protein: number; carbs: number; fats: number },
  goal: Goal,
  weeklyBudget: number,
  isPremium: boolean
): Promise<any[]> {
  const daysToGenerate = isPremium ? 7 : 3

  const goalMap: Record<Goal, string> = {
    perder_peso: 'perda de peso com déficit calórico',
    ganhar_massa: 'ganho de massa muscular com superávit calórico',
    manter_peso: 'manutenção de peso com calorias balanceadas',
    hipertrofia: 'ganho de massa muscular com superávit calórico',
    definicao: 'definição muscular com déficit calórico moderado',
    perda_gordura: 'perda de gordura com déficit calórico'
  }

  const prompt = `Você é um nutricionista especializado. Crie um plano alimentar de ${daysToGenerate} dias com as seguintes especificações:

Objetivo: ${goalMap[goal]}
Meta calórica diária: ${macros.calories} kcal
Proteínas: ${macros.protein}g
Carboidratos: ${macros.carbs}g
Gorduras: ${macros.fats}g
Orçamento semanal: R$ ${weeklyBudget}

Regras:
1. Crie refeições balanceadas e nutritivas
2. Respeite o orçamento fornecido
3. Inclua café da manhã, almoço, jantar e 2 lanches
4. Especifique quantidades e calorias aproximadas
5. Adapte ao objetivo nutricional

Retorne APENAS um JSON válido no formato:
[
  {
    "day": 1,
    "meal_name": "Café da manhã",
    "foods": "Aveia 50g, Banana 1 unidade, Whey protein 30g",
    "protein": 35,
    "carbs": 60,
    "fats": 8,
    "calories": 450
  },
  {
    "day": 1,
    "meal_name": "Lanche da manhã",
    "foods": "Iogurte grego 150g, Castanhas 20g",
    "protein": 15,
    "carbs": 12,
    "fats": 15,
    "calories": 230
  }
]`

  try {
    const openai = getOpenAIClient()
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7
    })

    const content = response.choices[0].message.content
    if (!content) throw new Error('Resposta vazia da IA')

    const parsed = JSON.parse(content)
    return parsed.plan || parsed.meals || parsed
  } catch (error: any) {
    console.error('Erro detalhado em generateMealPlan:', error)
    
    // Erro específico de API key
    if (error?.message?.includes('OPENAI_API_KEY') || error?.message?.includes('Configure sua chave')) {
      throw new Error('Configure sua chave da OpenAI nas variáveis de ambiente')
    }
    
    // Erro de API key inválida
    if (error?.status === 401 || error?.message?.includes('Invalid API key')) {
      throw new Error('Chave da OpenAI inválida. Verifique se você configurou a chave correta.')
    }
    
    throw new Error('Falha ao gerar plano alimentar: ' + (error?.message || 'Erro desconhecido'))
  }
}

export async function generateWorkoutPlan(
  goal: Goal,
  trainingDays: number,
  equipment: Equipment,
  isPremium: boolean
): Promise<any[]> {
  const daysToGenerate = isPremium ? trainingDays : Math.min(trainingDays, 2)

  const equipmentMap = {
    academia: 'academia completa com máquinas e pesos livres',
    casa: 'equipamentos básicos de casa (halteres, barras)',
    elasticos: 'elásticos de resistência',
    peso_corporal: 'apenas peso corporal (calistenia)'
  }

  const goalMap: Record<Goal, string> = {
    perder_peso: 'perda de peso',
    ganhar_massa: 'ganho de massa muscular',
    manter_peso: 'manutenção de peso',
    hipertrofia: 'hipertrofia muscular',
    definicao: 'definição muscular',
    perda_gordura: 'perda de gordura'
  }

  const prompt = `Você é um personal trainer especializado. Crie um plano de treino de ${daysToGenerate} dias com as seguintes especificações:

Objetivo: ${goalMap[goal]}
Equipamentos disponíveis: ${equipmentMap[equipment]}
Dias de treino por semana: ${trainingDays}

Regras:
1. Crie treinos completos e balanceados
2. Inclua aquecimento e alongamento
3. Especifique séries, repetições e tempo de descanso
4. Adapte os exercícios ao equipamento disponível
5. Progressão adequada ao objetivo

Retorne APENAS um JSON válido no formato:
[
  {
    "day": 1,
    "exercise_name": "Supino reto",
    "sets": 4,
    "reps": "8-12",
    "rest": 90,
    "notes": "Controle a descida, explosão na subida"
  },
  {
    "day": 1,
    "exercise_name": "Crucifixo inclinado",
    "sets": 3,
    "reps": "10-15",
    "rest": 60,
    "notes": "Foco na contração do peitoral"
  }
]`

  try {
    const openai = getOpenAIClient()
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7
    })

    const content = response.choices[0].message.content
    if (!content) throw new Error('Resposta vazia da IA')

    const parsed = JSON.parse(content)
    return parsed.plan || parsed.exercises || parsed
  } catch (error: any) {
    console.error('Erro detalhado em generateWorkoutPlan:', error)
    
    // Erro específico de API key
    if (error?.message?.includes('OPENAI_API_KEY') || error?.message?.includes('Configure sua chave')) {
      throw new Error('Configure sua chave da OpenAI nas variáveis de ambiente')
    }
    
    // Erro de API key inválida
    if (error?.status === 401 || error?.message?.includes('Invalid API key')) {
      throw new Error('Chave da OpenAI inválida. Verifique se você configurou a chave correta.')
    }
    
    throw new Error('Falha ao gerar plano de treino: ' + (error?.message || 'Erro desconhecido'))
  }
}
