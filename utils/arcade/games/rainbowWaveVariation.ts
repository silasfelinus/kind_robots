/**
 * Seeded wave variation for the Rainbow Space Princess campaign (Conductor rainbow t-065, round-1 gameplay
 * critic D9: "the seed changes nothing"). The Acts are authored, so a run keeps every wave, its kind, its
 * formation and its timing. One draw from the game's rng picks this run's variation seed. That seed decides,
 * wave by wave, whether the wave flies its authored lanes or their mirror image across the lane band's
 * centre. A mirror keeps every gap, corridor and spacing the wave was authored with and stays inside the
 * same band, so a wave stays as readable and fair as authored, and the next run still feels different.
 * The same seed always flies the same mirrors, so a seeded replay, the attract demo or a checkpoint
 * continue repeats the run exactly.
 */
import { RAINBOW_LANES } from './rainbowFormations'

/** The lane band's centre line; a mirrored wave reflects across it. */
export const RAINBOW_WAVE_MIRROR_Y = RAINBOW_LANES.top + RAINBOW_LANES.span / 2

/** A whole-number variation seed from one rng draw. */
export function rainbowVariationSeed(rng: () => number): number {
  return Math.floor(rng() * 0x100000000) >>> 0
}

/** Whether this seed mirrors this Act's wave. Pure: the same inputs always give the same answer. */
export function rainbowWaveMirrored(
  seed: number,
  act: number,
  wave: number,
): boolean {
  let h =
    (seed ^
      Math.imul(act + 1, 0x9e3779b1) ^
      Math.imul(wave + 1, 0x85ebca6b)) >>>
    0
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d) >>> 0
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b) >>> 0
  h = (h ^ (h >>> 16)) >>> 0
  return (h & 1) === 1
}

/** An authored spawn's lane after this seed's variation for its wave. */
export function rainbowVariedY(
  y: number,
  seed: number,
  act: number,
  wave: number,
): number {
  return rainbowWaveMirrored(seed, act, wave)
    ? 2 * RAINBOW_WAVE_MIRROR_Y - y
    : y
}
