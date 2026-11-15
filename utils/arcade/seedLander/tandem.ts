// /utils/arcade/seedLander/tandem.ts
//
// Seed Lander's two-pod modes (conductor kr-arcade/t-073): Tandem flies two pods on one island,
// either pod can winch the other's crate, and a bed planted by both pays a bonus; Relay hands one
// pod from player to player after each planting or bonk. Pure arithmetic over counts and scores,
// plus the crew medals for the medal board and the buddy vine that keeps two pods on one screen:
// the game supplies the pods and reads the result.

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

/** Who flies: one pod (player 1), or a crew of two in Tandem or Relay. */
export type Crew = 'solo' | PodMode

/** The order the mode card's CREW picker steps through (two seated). */
export const CREW_ORDER: readonly Crew[] = ['tandem', 'relay', 'solo']

export const CREW_NAMES: Record<Crew, string> = {
  ...POD_NAMES,
  solo: 'SOLO',
}

export const CREW_BLURBS: Record<Crew, string> = {
  ...POD_BLURBS,
  solo: 'ONE POD, PLAYER ONE FLIES',
}

/** A crew medal as a number for the save and the board (0 for none). */
export const TIER_VALUE: Record<'gold' | 'silver' | 'bronze', number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
}

export function tierFromValue(v: number): MedalTier {
  return v >= 3 ? 'gold' : v === 2 ? 'silver' : v === 1 ? 'bronze' : null
}

/**
 * A mission's crew par: what a tidy crew run is worth. Each goal (a bed, a crate, a lantern, a
 * ring, a boss phase) is worth about a thousand, later islands pay bigger medals, and a boss set-
 * piece adds its own big prize.
 */
export function crewPar(goals: number, level: number, boss: boolean): number {
  const g = Number.isFinite(goals) ? Math.max(1, Math.floor(goals)) : 1
  const l = Number.isFinite(level) ? Math.max(1, Math.min(10, level)) : 1
  return 1000 * g + 375 * l + (boss ? 16000 : 0)
}

/** Saved best crew medals by mission id, checked field by field. */
export function readCrewMedals(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out
  for (const [id, v] of Object.entries(raw)) {
    if (!/^[a-z0-9-]{1,32}$/.test(id)) continue
    if (v !== 1 && v !== 2 && v !== 3) continue
    out[id] = v
    if (Object.keys(out).length >= 64) break
  }
  return out
}

/** The buddy vine: Tandem's two pods may drift this far apart across before it pulls tight. */
export const LEASH = 300

/** A bed must be this wide for two pods to stand on it side by side (a double plant). */
export const DOUBLE_WIDE = 20

type Body = { x: number; vx: number }

/**
 * Keep two pods within the buddy vine. Whichever pod is pulling away is held back to the vine's
 * length and loses its outward speed; a pod already still (resting, or drifting inward) is never
 * moved. Returns how taut the vine is (1 at full stretch), for the telegraph.
 */
export function leash(a: Body, b: Body, limit = LEASH): number {
  const dx = b.x - a.x
  const over = Math.abs(dx) - limit
  if (over > 0) {
    const dir = Math.sign(dx)
    const ua = Math.max(0, -dir * a.vx)
    const ub = Math.max(0, dir * b.vx)
    const total = ua + ub
    if (total > 0) {
      a.x += dir * over * (ua / total)
      b.x -= dir * over * (ub / total)
      if (ua > 0) a.vx = 0
      if (ub > 0) b.vx = 0
    }
  }
  return Math.abs(b.x - a.x) / limit
}
