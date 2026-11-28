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
  /** Palace captives freed, named apart from the six rescues (story critic S15). */
  captives = 0,
): string[] {
  const region = RAINBOW_REGIONS[Math.max(1, Math.min(9, act)) - 1]!
  // The same tally as the finale verdict: the six route rescues, with any palace captives named on their own.
  const tally = [
    rescues > 0 ? `${rescues} of our six rescues` : '',
    captives > 0
      ? `${captives} palace captive${captives === 1 ? '' : 's'}`
      : '',
  ]
    .filter(Boolean)
    .join(' and ')
  return [
    `LILT-7: I've lost every signal over ${region}. Aurora Mercy is pulling back.`,
    tally
      ? `LILT-7: ${tally} made it home because of you. They'll keep the lights on.`
      : act <= 2
        ? `LILT-7: No one out over ${region} is lost for good. We will come back for them.`
        : 'LILT-7: No one is lost for good while the Eclipse still sings. We will come back for them.',
    savedAct === null
      ? 'LILT-7: Pinkwake waits for the next crew. Rest, then fly again.'
      : `LILT-7: The flight log keeps ${savedAct === 9 ? 'the finale' : `Act ${ACT_NAMES[savedAct - 1]}`}. Continue from there next time.`,
  ]
}

/**
 * Lilt-7 on the CONTINUE? screen, one line per Act (independent story critic S16: going down and coming back had
 * no writing). Short enough for one line of the 8 px caption at 480 px.
 */
export const RAINBOW_CONTINUE_LINES: readonly string[] = [
  'Pinkwake still needs us. Breathe, pilots, and take the wake again.',
  'The jelly lights are still on. They are waiting for us to come back.',
  'The trench keeps its secrets, not its pilots. Up, and again.',
  'The Express will not wait, but I will. One more run at the rails.',
  'Every wreck here was somebody once. Do not join them. Again.',
  'The reef remembers who came back. Let it remember us.',
  'Glass breaks; you do not. Find the true current and fly it.',
  'The palace is counting on us giving up. Let us count on not.',
  'The Crown is listening for whether we return. Answer it.',
]

/** Lilt's line for a continue in this Act (1-9); a lone pilot is not called "pilots" (story critic R2-7). */
export function rainbowContinueLine(act: number, players = 2): string {
  const line = RAINBOW_CONTINUE_LINES[Math.max(1, Math.min(9, act)) - 1]!
  return players === 1 ? line.replace(/\bpilots\b/, 'pilot') : line
}
