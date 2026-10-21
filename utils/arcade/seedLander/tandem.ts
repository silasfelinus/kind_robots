// /utils/arcade/seedLander/tandem.ts
//
// Seed Lander's two-pod modes (conductor kr-arcade/t-073): Tandem shares one cargo hold and pays a
// bonus for every seed planted by both pods; Relay hands one hold from pod to pod after each
// planting. Pure arithmetic over counts and scores: the game supplies the pods and reads the result.

export type PodMode = 'tandem' | 'relay'

export const POD_MODES: readonly PodMode[] = ['tandem', 'relay']

export const POD_NAMES: Record<PodMode, string> = {
  tandem: 'TANDEM',
  relay: 'RELAY',
}

export const POD_BLURBS: Record<PodMode, string> = {
  tandem: 'SHARED HOLD, DOUBLE-PLANT BONUS',
  relay: 'PASS THE HOLD AFTER EVERY PLANT',
}

export const POD_COUNT = 2

export const PLANT_POINTS = 100

/** Extra points when both pods plant within this many ticks of each other. */
export const DOUBLE_PLANT_WINDOW = 90
export const DOUBLE_PLANT_BONUS = 150

/** A shared hold: cargo is one pool, capped, and never negative. */
export function shareCargo(holds: readonly number[], cap: number): number {
  const total = holds.reduce(
    (n, h) => n + (Number.isFinite(h) ? Math.max(0, Math.floor(h)) : 0),
    0,
  )
  return Math.min(Math.max(0, Math.floor(cap)), total)
}

/** Points for a plant at tick `now`, given the tick the other pod last planted (or null). */
export function plantScore(now: number, otherLast: number | null): number {
  if (otherLast === null) return PLANT_POINTS
  const gap = now - otherLast
  return gap >= 0 && gap <= DOUBLE_PLANT_WINDOW
    ? PLANT_POINTS + DOUBLE_PLANT_BONUS
    : PLANT_POINTS
}

/** The pod that holds the cargo after `plants` plantings in Relay, starting with pod 0. */
export function relayHolder(plants: number): number {
  if (!Number.isFinite(plants) || plants < 0) return 0
  return Math.floor(plants) % POD_COUNT
}

/** The crew score: both pods' points together, so Tandem and Relay are won or lost as a team. */
export function crewScore(scores: readonly number[]): number {
  return scores.reduce(
    (n, s) => n + (Number.isFinite(s) ? Math.max(0, s) : 0),
    0,
  )
}

export type MedalTier = 'gold' | 'silver' | 'bronze' | null

/** Medal-board tier for a crew score against a mission's par. */
export function crewMedal(score: number, par: number): MedalTier {
  if (!(par > 0) || !Number.isFinite(score)) return null
  if (score >= par * 1.5) return 'gold'
  if (score >= par) return 'silver'
  if (score >= par * 0.5) return 'bronze'
  return null
}
