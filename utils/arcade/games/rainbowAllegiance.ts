// /utils/arcade/games/rainbowAllegiance.ts
//
// Rainbow Bullet Hell Space Princess, conductor rainbow t-040 (PLOT-MOTHERLAND.md). Silas, 2026-10-23 PT: "having a
// turn when the princesses realize they are supporting the colonizers, and they can choose to attack the empire or
// stay the course for the Motherland". The turn comes at Act V's memorial: the crew puts the evidence together, and
// the choice is flown, not picked from a menu: where the living crew flies when it launches for Act VI decides.

export type RainbowAllegiance = 'rebel' | 'loyal'

/** The memorial's reveal: one line every `lineFrames`, then the two lanes open for the choice. */
export const RAINBOW_TURN = {
  lineFrames: 150,
  /** The lanes split at the screen's middle: above it turns on the empire, below it stays the course. */
  split: 135,
} as const

const PILOTS = ['Maribel', 'Azure', 'Solenne', 'Vivi'] as const

/** The three reveal lines at the memorial, spoken by Lilt-7 and the lead pilot of this crew. */
export function rainbowTurnLines(
  players: number,
): ReadonlyArray<{ speaker: string; text: string }> {
  const lead = PILOTS[0]
  const wing = PILOTS[Math.max(0, Math.min(3, players - 1))]!
  return [
    {
      speaker: 'Lilt-7',
      text: 'The depot logs are open. The collars, the vault hardware, the colony ships behind the convoy: all Motherland make.',
    },
    {
      speaker: players > 1 ? wing : lead,
      text: 'So every creature we pacified was defending its home, and we cleared the road for the colonizers.',
    },
    {
      speaker: 'Lilt-7',
      text: 'I will not choose for you. Fly high to turn on the empire, low to stay the course for the Motherland.',
    },
  ]
}

/** Frames the reveal takes before the lanes open. */
export const RAINBOW_TURN_REVEAL_FRAMES = RAINBOW_TURN.lineFrames * 3

/** The crew's choice from where its living pilots fly: most of them high turns on the empire; a tie stays the course. */
export function allegianceFor(ys: readonly number[]): RainbowAllegiance {
  const high = ys.filter((y) => y < RAINBOW_TURN.split).length
  return high * 2 > ys.length ? 'rebel' : 'loyal'
}

export const RAINBOW_ALLEGIANCE_LABEL: Record<RainbowAllegiance, string> = {
  rebel: 'TURN ON THE EMPIRE',
  loyal: 'STAY THE COURSE',
}

/** The lead pilot's line in each later Act's opening, by the crew's choice (it replaces her usual line). */
export const RAINBOW_ALLEGIANCE_OPENINGS: Readonly<
  Record<6 | 7 | 8, Record<RainbowAllegiance, string>>
> = {
  6: {
    rebel:
      'Then we protect it with them now. Motherland channels can scream all they like.',
    loyal:
      'Orders stand. We finish this for the Motherland, whatever it is protecting.',
  },
  7: {
    rebel:
      'Motherland drones are in the reflections too. Trust nothing wearing a crown.',
    loyal:
      'Command says the reflections lie. Maybe the creatures do too. Keep firing.',
  },
  8: {
    rebel:
      'The palace is the empire’s leash. We cut it, and every collar with it.',
    loyal: 'The Motherland wants this palace taken. Fine. Collars, not ships.',
  },
}

/**
 * The last line of Acts VII and VIII's aftermath, by the crew's choice (conductor rainbow t-012): each road
 * escalates toward the finale. A rebel crew hears the empire go quiet; a loyal crew hears its doubts grow,
 * and Command's order for the Crown's heart arrives before the finale asks for the choice.
 */
export const RAINBOW_ALLEGIANCE_BRIDGES: Readonly<
  Record<7 | 8, Record<RainbowAllegiance, string>>
> = {
  7: {
    rebel: 'Motherland channels just went silent. They know we are coming.',
    loyal: 'Command wants the palace by dawn. I keep hearing that lullaby.',
  },
  8: {
    rebel: 'The heart is open. No Motherland order decides what we do next.',
    loyal: 'The heart is open, and Command wants it under their flag.',
  },
}
