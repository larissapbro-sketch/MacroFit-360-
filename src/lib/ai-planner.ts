// src/lib/ai-planner.ts

// Tipos básicos (pode ajustar se já tiver types prontos)
type Macros = {
  calories: number
  protein: number
  carbs: number
  fats: number
}

type Goal = 'hipertrofia' | 'definicao' | 'perda_gordura'
type Equipment = 'academia' | 'casa' | 'elasticos' | 'peso_corporal'

type Meal = {
  day: number
  meal_name: string
  foods: string
  protein: number
  carbs: number
  fats: number
  calories: number
}

type WorkoutExercise = {
  day: number
  exercise_name: string
  sets: number
  reps: string
  rest: string
  notes?: string
}

/**
 * Gera um plano alimentar simples baseado nas macros.
 * NÃO usa IA, é só uma lógica local pra não quebrar o app.
 */
export async function generateMealPlan(
  macros: Macros,
  goal: Goal,
  weeklyBudget: number,
  isPremium: boolean
): Promise<Meal[]> {
  // Dividir calorias e macros em 4 refeições por dia
  const mealsPerDay = 4
  const days = 7

  const caloriesPerMeal = Math.round(macros.calories / mealsPerDay)
  const proteinPerMeal = Math.round(macros.protein / mealsPerDay)
  const carbsPerMeal = Math.round(macros.carbs / mealsPerDay)
  const fatsPerMeal = Math.round(macros.fats / mealsPerDay)

  const baseFoodsByGoal: Record<Goal, string[]> = {
    hipertrofia: [
      'Arroz integral + frango grelhado + legumes',
      'Macarrão integral + carne moída magra + salada',
      'Omelete de ovos + pão integral + frutas',
      'Iogurte grego + aveia + frutas'
    ],
    definicao: [
      'Peito de frango + salada verde + batata doce',
      'Peixe grelhado + legumes no vapor',
      'Ovos mexidos + legumes salteados',
      'Iogurte natural + castanhas + frutas vermelhas'
    ],
    perda_gordura: [
      'Peito de frango + salada verde',
      'Peixe grelhado + legumes cozidos',
      'Ovos mexidos + salada crua',
      'Iogurte desnatado + frutas'
    ]
  }

  const names = ['Café da Manhã', 'Almoço', 'Lanche da Tarde', 'Jantar']

  const meals: Meal[] = []

  for (let day = 1; day <= days; day++) {
    for (let i = 0; i < mealsPerDay; i++) {
      const foods = baseFoodsByGoal[goal][i % baseFoodsByGoal[goal].length]

      meals.push({
        day,
        meal_name: names[i],
        foods,
        protein: proteinPerMeal,
        carbs: carbsPerMeal,
        fats: fatsPerMeal,
        calories: caloriesPerMeal
      })
    }
  }

  return meals
}

/**
 * Gera um plano de treino simples baseado no objetivo e dias de treino.
 * Também sem IA, só lógica local.
 */
export async function generateWorkoutPlan(
  goal: Goal,
  trainingDays: number,
  equipment: Equipment,
  isPremium: boolean
): Promise<WorkoutExercise[]> {
  const baseWorkoutsByGoal: Record<Goal, string[][]> = {
    hipertrofia: [
      ['Supino reto', 'Supino inclinado', 'Crucifixo', 'Tríceps testa'],
      ['Agachamento livre', 'Leg press', 'Cadeira extensora', 'Stiff'],
      ['Puxada frente', 'Remada curvada', 'Rosca direta', 'Rosca martelo']
    ],
    definicao: [
      ['Supino reto', 'Flexão de braço', 'Mergulho em banco'],
      ['Agachamento', 'Afundo', 'Levantamento terra romeno'],
      ['Puxada frente', 'Remada sentada', 'Rosca direta']
    ],
    perda_gordura: [
      ['Circuito corpo inteiro', 'Burpees', 'Polichinelo'],
      ['Agachamento + salto', 'Corrida estacionária', 'Mountain climber'],
      ['Flexões', 'Prancha', 'Abdominais']
    ]
  }

  const selectedWorkouts = baseWorkoutsByGoal[goal]
  const days = Math.min(trainingDays, selectedWorkouts.length)

  const result: WorkoutExercise[] = []

  for (let day = 1; day <= days; day++) {
    const exercises = selectedWorkouts[day - 1]

    for (const exercise of exercises) {
      result.push({
        day,
        exercise_name: exercise,
        sets: goal === 'perda_gordura' ? 3 : 4,
        reps: goal === 'perda_gordura' ? '15–20' : '8–12',
        rest: goal === 'perda_gordura' ? '30–45s' : '60–90s',
        notes:
          equipment === 'casa'
            ? 'Use halteres ou peso corporal se não tiver equipamentos.'
            : undefined
      })
    }
  }

  return result
}
