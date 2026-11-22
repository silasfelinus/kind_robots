export type WindowSurprise = 'snack' | 'toolbox' | 'cake' | 'sparky-wire' | null

export function windowSurprise(
  city: number,
  tower: number,
  index: number,
): WindowSurprise {
  const roll = (city * 37 + tower * 19 + index * 11) % 31
  if (roll === 0 || roll === 1) return 'toolbox'
  if (roll === 2 || roll === 3 || roll === 4) return 'cake'
  if (roll >= 5 && roll <= 10) return 'snack'
  if (roll === 11 || roll === 12) return 'sparky-wire'
  return null
}

export const WINDOW_SURPRISE_REWARDS = {
  snack: { charge: 8, points: 100, label: 'SNACK!' },
  toolbox: { charge: 18, points: 150, label: 'TOOLBOX!' },
  cake: { charge: 4, points: 500, label: 'PARTY!' },
  'sparky-wire': { charge: -12, points: 250, label: 'SPARK!' },
} as const
