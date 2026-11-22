import { repairTownForCity } from './towns'

export type RepairHazardKind =
  | 'gust'
  | 'gull-flock'
  | 'pigeon'
  | 'paparazzi-blimp'

export type RepairHazard = {
  kind: RepairHazardKind
  tower: number
  col: number
  row: number
  dir: -1 | 1
  ticks: number
}

const HAZARD_KINDS: readonly RepairHazardKind[] = [
  'gust',
  'gull-flock',
  'pigeon',
  'paparazzi-blimp',
]

export function repairHazardForCity(
  city: number,
  sequence: number,
  towerCount: number,
): RepairHazard | null {
  const town = repairTownForCity(city)
  const available = HAZARD_KINDS.filter((kind) =>
    town.threats.includes(kind),
  )
  if (!available.length || towerCount <= 0) return null
  const turn = Math.max(0, Math.floor(sequence))
  const kind = available[turn % available.length]!
  return {
    kind,
    tower: (turn * 3 + Math.max(0, city)) % towerCount,
    col: (turn + Math.max(0, city)) % 3,
    row: (turn * 2 + Math.max(0, city)) % town.maxRows,
    dir: turn % 2 === 0 ? 1 : -1,
    ticks: 75,
  }
}
