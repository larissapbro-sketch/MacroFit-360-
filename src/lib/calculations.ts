import { Goal, Gender, MacroTargets } from './types'

export function calculateMacros(
  weight: number,
  height: number,
  age: number,
  gender: Gender,
  goal: Goal
): MacroTargets {
  // Cálculo de TMB (Taxa Metabólica Basal) usando fórmula de Harris-Benedict
  let bmr: number
  
  if (gender === 'masculino') {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
  } else {
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
  }

  // Fator de atividade (moderado)
  const tdee = bmr * 1.55

  let calories: number
  let proteinPerKg: number
  let carbsPercentage: number
  let fatsPercentage: number

  switch (goal) {
    case 'hipertrofia':
      calories = tdee + 300 // Superávit calórico
      proteinPerKg = 2.2
      carbsPercentage = 0.45
      fatsPercentage = 0.25
      break
    case 'definicao':
      calories = tdee - 200 // Déficit leve
      proteinPerKg = 2.5
      carbsPercentage = 0.35
      fatsPercentage = 0.30
      break
    case 'perda_gordura':
      calories = tdee - 500 // Déficit moderado
      proteinPerKg = 2.0
      carbsPercentage = 0.30
      fatsPercentage = 0.30
      break
  }

  const protein = weight * proteinPerKg
  const proteinCalories = protein * 4
  const remainingCalories = calories - proteinCalories
  const carbs = (remainingCalories * carbsPercentage) / 4
  const fats = (remainingCalories * fatsPercentage) / 9

  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fats: Math.round(fats)
  }
}

export function generateMotivationalMessage(completionRate: number): string {
  if (completionRate >= 90) {
    return "🔥 Incrível! Você está arrasando! Continue assim!"
  } else if (completionRate >= 80) {
    return "💪 Ótimo trabalho! Você bateu 80% da meta!"
  } else if (completionRate >= 70) {
    return "👏 Bom progresso! Mantenha o foco!"
  } else if (completionRate >= 50) {
    return "⚡ Você está no caminho certo! Não desista!"
  } else {
    return "🎯 Vamos lá! Cada dia é uma nova oportunidade!"
  }
}

export function shouldIncreaseIntensity(completionRate: number, weeksConsistent: number): boolean {
  return completionRate >= 80 && weeksConsistent >= 2
}
