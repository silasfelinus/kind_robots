// utils/rulerHooked/timingBar.ts
//
// The sliding-marker timing minigame that replaced the button-menu fishing
// panel (Silas, 2026-09-11, twice: "The fishing game aspect should be a
// sliding animation that requires stopping in the green for optimal
// percentage chance. These things should be visual, not text based" / "on
// the line section should be visual experience"). Explicitly not just an
// animated version of the old three buttons -- "Do not simply animate the
// existing buttons. The complaint is that the mechanic is a menu, not that
// the menu lacks motion."
//
// One 0-100 track, divided into three zones:
//
//   [0, bandStart)                    SLACK zone -- stopped early
//   [bandStart, bandStart+bandWidth]  REEL zone  -- the green target band
//   (bandStart+bandWidth, 100]        WAIT zone  -- stopped late
//
// Where the player stops the marker decides BOTH which action fires (which
// zone it landed in) AND how well it lands (`quality`, 0..1, peaking at the
// REEL band's center and tapering across whichever zone the stop landed in)
// -- so a near-miss still does something, not nothing, and a dead-center
// REEL stop is meaningfully better than an edge-of-band one. This is
// deliberately not flavour: `quality` feeds straight into applyFishingStop's
// progress/tension math in encounter.ts.
//
// Band width and marker speed come from the fish's family (the existing
// STANDARD_TENSION / PATIENCE / REVERSE_CONTROL split) and rarity (new --
// rarer fish get a narrower band and a faster sweep, so the 15-fish roster's
// difficulty finally varies by more than draw weight), plus a small
// per-beat tightening so a longer fight gets harder, not easier.
//
// Framework-free and free of wall-clock/animation-frame concerns: this file
// only computes the STATIC profile (band position/width, sweep duration) for
// a given encounter state and resolves a recorded stop position into an
// action + quality. The actual sweeping animation lives client-side in
// ruler-hooked-timing-bar.vue and never influences game state directly --
// only the stop position the player records does, so replay determinism
// (same seed + same recorded stops -> same outcome) holds regardless of
// frame rate, device speed, or how the animation actually looked on screen.

import type { Rarity } from '~/types/ruler-hooked'
import type { FishingAction, FishingFamily } from './encounter'

export interface TimingBarProfile {
  /** Start of the REEL target band, 0-100. */
  bandStart: number
  /** Width of the REEL target band, in the same 0-100 units. */
  bandWidth: number
  /** One-way sweep duration in ms -- how long the marker takes to cross the bar once. Display-only; never affects outcome. */
  sweepMs: number
}

export interface TimingStopResult {
  action: FishingAction
  /** 0 (a clean miss) .. 1 (dead-center in the zone the stop landed in). */
  quality: number
}

const RARITY_DIFFICULTY: Record<Rarity, number> = {
  COMMON: 0,
  UNCOMMON: 1,
  RARE: 2,
  EPIC: 3,
  LEGENDARY: 4,
  MYTHIC: 5,
}

const BASE_BAND_WIDTH = 34 // COMMON, beat 0: a generous, easy-to-land band
const MIN_BAND_WIDTH = 12 // never narrower than this, however hard the fish/beat
const BASE_SWEEP_MS = 1600 // COMMON, beat 0: an easy, readable sweep
const MIN_SWEEP_MS = 650 // never faster than this, however hard the fish/beat

/**
 * The REEL band's center drifts deterministically with the beat number so
 * the bar isn't just "always dead center" -- purely a function of encounter
 * state (rarity/family/beat), never RNG, so the same fish at the same beat
 * always presents the same layout (the same kind of pure derivation as
 * profileForFish() in encounter.ts).
 */
function bandCenterFor(rarity: Rarity, family: FishingFamily, beat: number): number {
  const drift = ((beat * 17 + RARITY_DIFFICULTY[rarity] * 11) % 40) - 20 // -20..+19
  const base = family === 'REVERSE_CONTROL' ? 50 : 46
  return Math.max(20, Math.min(80, base + drift))
}

const MAX_BAND_WIDTH = 70 // gear may widen the band, but never past this -- stays a game, not a rubber stamp
const MAX_SWEEP_MS = 3000 // gear may slow the sweep, but never past this

export function timingProfileFor(state: {
  family: FishingFamily
  rarity: Rarity
  beat: number
  /** Owned-gear bonuses (economy.ts), snapshotted onto the encounter at
   *  buildEncounter() time. Absent for the plain reducer/selftest shape
   *  that predates gear -- treated as 0. */
  gearBandBonus?: number
  gearSweepMsBonus?: number
}): TimingBarProfile {
  const difficulty = RARITY_DIFFICULTY[state.rarity]
  // Difficulty tightens the band and speeds the sweep; a longer fight
  // (higher beat) tightens it further, capped so late beats stay landable.
  const beatPressure = Math.min(state.beat, 6)
  const widthStep = difficulty * 3 + beatPressure * 1.5
  const speedStep = difficulty * 120 + beatPressure * 60

  const bandWidth = Math.min(
    MAX_BAND_WIDTH,
    Math.max(MIN_BAND_WIDTH, BASE_BAND_WIDTH - widthStep) + (state.gearBandBonus ?? 0),
  )
  const sweepMs = Math.min(
    MAX_SWEEP_MS,
    Math.max(MIN_SWEEP_MS, BASE_SWEEP_MS - speedStep) + (state.gearSweepMsBonus ?? 0),
  )
  const center = bandCenterFor(state.rarity, state.family, state.beat)
  const bandStart = Math.max(0, Math.min(100 - bandWidth, center - bandWidth / 2))

  return { bandStart, bandWidth, sweepMs }
}

/**
 * Resolve a recorded stop position (0-100, clamped) against a profile into
 * the action it fires and how well it landed. Quality peaks at the REEL
 * band's center (1.0) and falls off toward either edge of whichever zone
 * the stop actually landed in, reaching 0 at that zone's far boundary (the
 * start of the bar for SLACK, the end of the bar for WAIT).
 */
export function resolveTimingStop(position: number, profile: TimingBarProfile): TimingStopResult {
  const p = Math.max(0, Math.min(100, position))
  const bandEnd = profile.bandStart + profile.bandWidth
  const bandCenter = profile.bandStart + profile.bandWidth / 2

  if (p >= profile.bandStart && p <= bandEnd) {
    const half = Math.max(profile.bandWidth / 2, 0.0001)
    const quality = 1 - Math.abs(p - bandCenter) / half
    return { action: 'REEL', quality: Math.max(0, Math.min(1, quality)) }
  }

  if (p < profile.bandStart) {
    const span = Math.max(profile.bandStart, 0.0001)
    const quality = 1 - (profile.bandStart - p) / span
    return { action: 'SLACK', quality: Math.max(0, Math.min(1, quality)) }
  }

  const span = Math.max(100 - bandEnd, 0.0001)
  const quality = 1 - (p - bandEnd) / span
  return { action: 'WAIT', quality: Math.max(0, Math.min(1, quality)) }
}
