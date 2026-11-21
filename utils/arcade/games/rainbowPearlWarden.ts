/**
 * Alternate Act C: the Crown Reef's shield cache holds the Pearl Warden.
 * A quiet patrol teaches the low route, then its independent guardian protects
 * the resource chamber until the paths rejoin. Production art remains open.
 */
import type { RainbowGuardianSection } from './rainbowGuardian'
import type { ReefRoute } from './rainbowCrownReef'

export const PEARL_WARDEN = {
  name: 'Pearl Warden',
  guardianFraction: 0.62,
} as const

export function pearlWardenWindow(
  routeStart: number,
  routeEnd: number,
): RainbowGuardianSection {
  if (
    !Number.isInteger(routeStart) ||
    !Number.isInteger(routeEnd) ||
    routeEnd <= routeStart
  )
    throw new Error('The Pearl Warden needs an increasing route window')
  return {
    name: PEARL_WARDEN.name,
    from:
      routeStart +
      Math.floor((routeEnd - routeStart) * PEARL_WARDEN.guardianFraction),
    to: routeEnd,
    kind: 'warden',
  }
}

/** Route patrols stop during the guardian; the relay branch never stops. */
export function pearlWardenAllowsWave(
  frame: number,
  route: ReefRoute | null,
  section: RainbowGuardianSection,
): boolean {
  return route !== 'cache' || frame < section.from || frame >= section.to
}
