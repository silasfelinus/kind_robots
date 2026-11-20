/**
 * Alternate Act B: the Motherland's armory behind the Blossom Wreckyard fork.
 * The ordinary armory gauntlet teaches heavy hammerheads, then the Siren
 * replaces its final volleys with a solo, telegraphed guardian encounter.
 * This is a live branch within Act V, not a separate save checkpoint slot.
 */
import type { RainbowGuardianSection } from './rainbowGuardian'

export const ARMORY_SIREN = {
  name: 'Armory Siren',
  /** Reserve 40% of the route's clock for an independent boss encounter. */
  guardianFraction: 0.6,
} as const

export function armorySirenWindow(
  routeStart: number,
  routeEnd: number,
): RainbowGuardianSection {
  if (
    !Number.isInteger(routeStart) ||
    !Number.isInteger(routeEnd) ||
    routeEnd <= routeStart
  )
    throw new Error('The Armory Siren needs an increasing route window')
  return {
    name: ARMORY_SIREN.name,
    from:
      routeStart +
      Math.floor((routeEnd - routeStart) * ARMORY_SIREN.guardianFraction),
    to: routeEnd,
    kind: 'siren',
  }
}

/** The armory's ordinary craft clear out before its guardian is telegraphed. */
export function armorySirenAllowsWave(
  frame: number,
  route: 'depot' | 'armory' | null,
  section: RainbowGuardianSection,
): boolean {
  return route !== 'armory' || frame < section.from || frame >= section.to
}
