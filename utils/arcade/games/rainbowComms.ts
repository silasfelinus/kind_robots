// /utils/arcade/games/rainbowComms.ts
//
// Rainbow Bullet Hell Space Princess, conductor rainbow t-044 (main-game standard: settings). How much crew
// chatter the comms box shows, and the high-contrast pellet palette. Both only change what is drawn: no setting
// here touches a hitbox, a timer or the seeded run, so a flight replays identically under any choice.
import type { ArcadeComms } from '../types'

/**
 * The comms line to show this frame.
 * - full: story scenes and every in-flight callout.
 * - essential: story scenes only; in-flight callouts stay quiet.
 * - off: nothing, except the ending's own lines, which carry the ending plate and its A prompt.
 */
export function rainbowCommsLine<T>(
  level: ArcadeComms,
  said: T | null,
  callout: T | null,
  sceneId: string | null,
): T | null {
  if (level === 'full') return said ?? callout
  if (level === 'essential') return said
  return sceneId === RAINBOW_ENDING_SCENE ? said : null
}

/** The ending scene, whose comms box also frames the ending plate. */
export const RAINBOW_ENDING_SCENE = 'A09.AFTER'

/**
 * High-contrast pellets: an opaque black disc under every solid hostile pellet with a bright ring at its edge,
 * so a pellet separates from any scenery, painted or doodled, whatever its family's colours.
 */
export const RAINBOW_CONTRAST_PELLET = {
  halo: '#000000',
  ring: '#ffffff',
  ringWidth: 1.5,
} as const

/**
 * The default (not bold) pellet backing: a firmer dark halo and a faint light ring, so pink-cored pellets read
 * on pink seas without the bold switch (presentation critic P-11). Bold stays the stronger option above.
 */
export const RAINBOW_DEFAULT_PELLET = {
  halo: '#05030fb0',
  ring: '#ffffff73',
  ringWidth: 1,
} as const
