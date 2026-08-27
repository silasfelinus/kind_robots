// utils/rulerHooked/compositor.ts
//
// The scene compositor (compositing.md §3–§5). Pure function of the save:
//   - resolveScene(save, manifest) → the committed visual state per region + the
//     time-of-day, deterministic so the same save always renders the same frame.
//   - rampState() maps a slider value to a region state by even thresholding.
//   - cyclePosition() advances a cosmetic day/night cycle by TURNS, never a clock.
//   - assetPath() resolves {region}-{state}-{time} with the graceful fallback
//     ladder (compositing.md §4.2) so the variant matrix never has to be exhaustive.

import type {
  RegionKey,
  RegionState,
  RegionsManifest,
  RunSave,
  SceneState,
  TimeKey,
} from '~/types/ruler-hooked'
import { HERO_RULER_PRESET_ID } from '~/utils/rulerHooked/rulerPresets'

/** Even-threshold a 0..100 slider value across an ordered ramp (compositing.md §3). */
export function rampState(value: number, ramp: RegionState[]): RegionState {
  if (ramp.length === 0) return ''
  const band = 100 / ramp.length
  const idx = Math.max(0, Math.min(ramp.length - 1, Math.floor(value / band)))
  return ramp[idx] ?? ramp[0] ?? ''
}

/**
 * A cosmetic cycle position derived from turnCount. Pure presentation — NOTHING
 * keys off it (data-model.md time pillar). Sequence: day → golden → dusk → night
 * → dawn → (day). Treats (golden/dawn/dusk) occupy one step each.
 */
const CYCLE: TimeKey[] = ['day', 'golden', 'dusk', 'night', 'dawn']
export function cyclePosition(turnCount: number): number {
  return ((turnCount % CYCLE.length) + CYCLE.length) % CYCLE.length
}
export function cycleTime(turnCount: number): TimeKey {
  return CYCLE[cyclePosition(turnCount)] ?? 'day'
}

/**
 * Resolve the committed scene: each region's state = its event override (if pinned)
 * else its ramp state from the driver slider; plus the time and any active fx.
 */
export function resolveScene(
  save: RunSave,
  manifest: RegionsManifest,
): SceneState {
  const regionStates: Partial<Record<RegionKey, RegionState>> = {}
  for (const key of Object.keys(manifest.regions) as RegionKey[]) {
    const def = manifest.regions[key]
    if (!def) continue
    if (key === 'ruler') {
      // Cosmetic axis (t-021): the ruler region's "state" is the player's
      // chosen preset id, not a ramp/event-driven state. A custom portrait
      // (handled separately by the stage/portraitStore) still needs a preset
      // id underneath it for save-index display and as the degrade target if
      // the custom image is ever unreadable, so this always resolves to one.
      regionStates[key] = save.ruler.cosmetics?.presetId ?? HERO_RULER_PRESET_ID
      continue
    }
    const override = save.regionOverrides[key]
    if (override !== undefined) {
      regionStates[key] = override
    } else if (def.driver) {
      const val = save.kingdomHealth[def.driver.slider] ?? 0
      regionStates[key] = rampState(val, def.driver.ramp)
    } else if (def.states.length > 0) {
      // single/first-state region (e.g. sky/lake are time-led)
      regionStates[key] = save.regionStates[key] ?? def.states[0]
    }
  }
  const fx: string[] = []
  return { regionStates, time: cycleTime(save.turnCount), fx }
}

/**
 * Asset filename for a resolved (region, state, time), following the naming
 * contract {region}-{state}[-{time}].webp (compositing.md §4.3). Returns the
 * ordered fallback candidates (exact → settle-neighbour → base) so the caller's
 * <img> onError ladder can degrade gracefully instead of showing a hole.
 */
const SETTLE: Record<TimeKey, TimeKey> = {
  day: 'day',
  night: 'night',
  dawn: 'day',
  golden: 'day',
  dusk: 'night',
}
export function assetCandidates(
  region: RegionKey,
  state: RegionState | undefined,
  time: TimeKey,
  dir = '/images/ruler-hooked',
  /**
   * A second state to fall back to (all three time rungs) if `state`'s own
   * files don't exist — e.g. the ruler region falls back to its one
   * already-rendered layer (RULER_LAYER_FALLBACK_STATE = 'fishing') until a
   * given cosmetic preset gets its own dedicated file (t-021). Never used for
   * any other region today.
   */
  fallbackState?: RegionState,
): string[] {
  const settle = SETTLE[time]
  const rungs = (s: RegionState | undefined): string[] => {
    const base = s ? `${region}-${s}` : `${region}`
    return [`${base}-${time}`, `${base}-${settle}`, base]
  }
  const names = rungs(state)
  if (fallbackState !== undefined && fallbackState !== state) {
    names.push(...rungs(fallbackState))
  }
  // de-dupe while preserving order
  const seen = new Set<string>()
  return names
    .filter((n) => (seen.has(n) ? false : (seen.add(n), true)))
    .map((n) => `${dir}/${n}.webp`)
}
