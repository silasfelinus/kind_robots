import { rebelRandom } from './rebelButtonStage'

export type RebelEncounterKind = 'cannon' | 'decoys'

export const REBEL_CANNON_MIN_PRESS = 11
export const REBEL_CANNON_MAX_PRESS = 55
export const REBEL_DECOY_MIN_PRESS = 56
export const REBEL_DECOY_MAX_PRESS = 99
export const REBEL_DECOY_COUNT = 9
export const REBEL_CANNON_TOLERANCE = 6

function pick(seed: number, lane: number, min: number, max: number): number {
  return min + Math.floor(rebelRandom(seed, 1000, lane) * (max - min + 1))
}

export function rebelEncounterPresses(
  seed: number,
): Record<RebelEncounterKind, number> {
  return {
    cannon: pick(seed, 20, REBEL_CANNON_MIN_PRESS, REBEL_CANNON_MAX_PRESS),
    decoys: pick(seed, 21, REBEL_DECOY_MIN_PRESS, REBEL_DECOY_MAX_PRESS),
  }
}

export function rebelEncounterFor(
  press: number,
  seed: number,
): RebelEncounterKind | null {
  const presses = rebelEncounterPresses(seed)
  if (press === presses.cannon) return 'cannon'
  if (press === presses.decoys) return 'decoys'
  return null
}

export function rebelArchPosition(seed: number): number {
  return 15 + Math.round(rebelRandom(seed, 1001, 22) * 70)
}

export function rebelCannonHit(aim: number, seed: number): boolean {
  return Math.abs(aim - rebelArchPosition(seed)) <= REBEL_CANNON_TOLERANCE
}

export function rebelRealDecoyIndex(seed: number): number {
  return Math.floor(rebelRandom(seed, 1002, 23) * REBEL_DECOY_COUNT)
}

export function rebelDecoyIsReal(index: number, seed: number): boolean {
  return index === rebelRealDecoyIndex(seed)
}
