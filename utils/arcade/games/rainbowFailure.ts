// /utils/arcade/games/rainbowFailure.ts
//
// Rainbow Bullet Hell Space Princess's failure ending (conductor rainbow t-012): when the CONTINUE? countdown
// runs out, Lilt-7 closes the run in three lines (where the crew fell, what its rescues meant, and where the
// flight log will pick up) before the run ends. A skips it after a beat; it closes by itself otherwise.

export const RAINBOW_FAILURE = {
  /** Each line holds this long before the next joins it. */
  lineFrames: 120,
  /** A closes the run from here on. */
  minFrames: 90,
  /** The run closes by itself here. */
  holdFrames: 600,
} as const

/** Where each Act's battle is fought, as Lilt names it. */
export const RAINBOW_REGIONS = [
  'Pinkwake Estuary',
  'Moonjelly Fields',
  'the Chromatic Trench',
  'the Rosefin Express',
  'the Blossom Wreckyard',
  'the Crown Reef',
  'the Glass Current',
  'the Eclipse Palace',
  'the Eclipse Crown',
] as const

const ACT_NAMES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']

/**
 * Lilt's three lines for a fallen crew: the Act it fell in (1 to 9), how many rescues it made, and the Act the
 * flight log will continue from (null when nothing is saved).
 */
export function failureLines(
  act: number,
  rescues: number,
  savedAct: number | null,
): string[] {
  const region = RAINBOW_REGIONS[Math.max(1, Math.min(9, act)) - 1]!
  return [
    `LILT-7: I've lost every signal over ${region}. Aurora Mercy is pulling back.`,
    rescues > 0
      ? `LILT-7: ${rescues} rescue${rescues === 1 ? '' : 's'} made it home because of you. They'll keep the lights on.`
      : 'LILT-7: No one is lost for good while the Eclipse still sings. We will come back for them.',
    savedAct === null
      ? 'LILT-7: Pinkwake waits for the next crew. Rest, then fly again.'
      : `LILT-7: The flight log keeps ${savedAct === 9 ? 'the finale' : `Act ${ACT_NAMES[savedAct - 1]}`}. Continue from there next time.`,
  ]
}
