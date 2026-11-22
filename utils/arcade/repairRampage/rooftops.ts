export const ROOFTOP_KINDS = [
  'billboard',
  'water-tower',
  'radio-mast',
  'lighthouse',
  'roof-garden',
] as const

export type RooftopKind = (typeof ROOFTOP_KINDS)[number]

export function rooftopForTower(city: number, tower: number): RooftopKind {
  const index =
    (Math.max(0, Math.floor(city) - 1) + Math.max(0, tower)) %
    ROOFTOP_KINDS.length
  return ROOFTOP_KINDS[index]!
}
