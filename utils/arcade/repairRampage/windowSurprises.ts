export type WindowSurprise = 'snack' | 'toolbox' | 'cake' | null

export function windowSurprise(
  city: number,
  tower: number,
  index: number,
): WindowSurprise {
  const roll = (city * 37 + tower * 19 + index * 11) % 31
  if (roll === 0 || roll === 1) return 'toolbox'
  if (roll === 2 || roll === 3 || roll === 4) return 'cake'
  if (roll >= 5 && roll <= 10) return 'snack'
  return null
}

export const WINDOW_SURPRISE_REWARDS = {
  snack: { charge: 8, points: 100, label: 'SNACK!' },
  toolbox: { charge: 18, points: 150, label: 'TOOLBOX!' },
  cake: { charge: 4, points: 500, label: 'PARTY!' },
} as const
