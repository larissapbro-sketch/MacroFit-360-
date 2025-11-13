'use server'

import OpenAI from 'openai'
import { Goal, Equipment, MacroTargets } from '@/lib/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function generateMealPlan(
  macros: MacroTargets,
  goal: Goal,
  weeklyBudget: number,
  isPremium: boolean
): Promise<any[]> {
  const daysToGenerate = isPremium ? 7 : 3

  const prompt = `Você é um nutricionista especializado. Crie um plano alimentar de ${daysToGenerate} dias com as seguintes especificações:

Meta diária:
- Calorias: ${macros.calories} kcal
- Proteínas: ${macros.protein}g
- Carboidratos: ${macros.carbs}g
- Gorduras: ${macros.fats}g

Objetivo: ${goal}
Orçamento semanal: R$ ${weeklyBudget}

Regras:
1. Crie 5 refeições por dia (café, lanche manhã, almoço, lanche tarde, jantar)
2. Use alimentos acessíveis e disponíveis no Brasil
3. Respeite o orçamento fornecido
4. Forneça substituições inteligentes quando possível
5. Seja prático e realista

Retorne APENAS um JSON válido no formato:
[
  {
    "day": 1,
    "meals": [
      {
        "name": "Café da Manhã",
        "foods": "2 ovos mexidos + 2 fatias de pão integral + 1 banana",
        "protein": 20,
        "carbs": 45,
        "fats": 12,
        "calories": 360
      }
    ]
  }
]`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7
    })

    const content = response.choices[0].message.content
    if (!content) throw new Error('Resposta vazia da IA')

    const parsed = JSON.parse(content)
    return parsed.plan || parsed.days || parsed
  } catch (error) {
    console.error('Erro ao gerar plano alimentar:', error)
    throw new Error('Falha ao gerar plano alimentar')
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

  const prompt = `Você é um personal trainer especializado. Crie um plano de treino de ${daysToGenerate} dias com as seguintes especificações:

Objetivo: ${goal}
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
    "name": "Treino A - Peito e Tríceps",
    "exercises": [
      {
        "name": "Supino reto",
        "sets": 4,
        "reps": "8-12",
        "rest": 90,
        "notes": "Controle a descida, explosão na subida"
      }
    ]
  }
]`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7
    })

    const content = response.choices[0].message.content
    if (!content) throw new Error('Resposta vazia da IA')

    const parsed = JSON.parse(content)
    return parsed.plan || parsed.days || parsed
  } catch (error) {
    console.error('Erro ao gerar plano de treino:', error)
    throw new Error('Falha ao gerar plano de treino')
  }
}
