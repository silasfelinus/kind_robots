import type { NemesisId } from './voyageMap'

/**
 * Three endings of its own for every seeded nemesis (8 × 3), appended to the
 * galactic ending at the jump gate. Which one a voyage earns depends on the
 * finale order and on the work the crew did against this nemesis's method
 * along the way (NEMESIS_ALLY_FLAGS), so the same order can close differently
 * against different enemies.
 *
 *   undone     the counter council, or protecting the worlds after at least
 *              two pieces of groundwork against this nemesis
 *   bargained  bargaining for passage with something to bargain with: two
 *              supplies in the hold or one piece of groundwork
 *   unfinished any other order: the nemesis withdraws and carries on
 *              elsewhere
 */
export const NEMESIS_ENDING_VARIANTS = [
  'undone',
  'bargained',
  'unfinished',
] as const
export type NemesisEndingVariant = (typeof NEMESIS_ENDING_VARIANTS)[number]
type Ending = { title: string; text: string }

export const NEMESIS_ENDINGS: Record<
  NemesisId,
  Record<NemesisEndingVariant, Ending>
> = {
  auditor: {
    undone: {
      title: 'THE BOOKS ARE OPENED',
      text: 'The Auditor’s ledgers are read aloud at the jump gate, line by line, until every debt arrives back at the institution that defaulted on it. The Auditor accepts the correction with professional grace and asks for a copy. It now audits the creditors, and has found that it enjoys the work.',
    },
    bargained: {
      title: 'THE RELIEF BOND',
      text: 'The Auditor agrees to fund the rescue routes it was about to foreclose, at a fixed rate, repayable over one generation. The families on those routes are alive and in debt, and have each been sent a very clear repayment schedule.',
    },
    unfinished: {
      title: 'PAID IN FULL, PENDING',
      text: 'The Auditor withdraws from the jump gate and files the voyage as an outstanding balance. Somewhere behind the couch an inspector is measuring a lifeboat’s legroom.',
    },
  },
  moth: {
    undone: {
      title: 'THE FACES RETURNED',
      text: 'The Queen’s masks are hung in a public gallery with their owners’ names beneath them, and each owner decides whether to take theirs home. The Queen keeps one, given freely. She wears it badly, which she says is the point.',
    },
    bargained: {
      title: 'THE PSEUDONYM REGISTER',
      text: 'The Queen agrees to keep a register of chosen names, issued only on request. It shelters refugees and frauds in roughly equal numbers, and nobody can agree on the ratio.',
    },
    unfinished: {
      title: 'SOMEBODY ELSE’S FACE',
      text: 'The Queen leaves the jump gate wearing a face the crew almost recognizes. One witness from earlier in the voyage is never found under their own name again.',
    },
  },
  curdle: {
    undone: {
      title: 'THE OPTIONAL MENU',
      text: 'Dr. Curdle’s dispensers are handed to local kitchen cooperatives, which add a second dish, then a third. Curdle files a formal complaint about inefficiency and is later seen asking for seconds.',
    },
    bargained: {
      title: 'THE SUNSET CLAUSE',
      text: 'Universal feeding continues under an independent board with a ten-year sunset. Nobody starves. Everybody eats the same thing and has begun to speak of other food with longing.',
    },
    unfinished: {
      title: 'SECOND HELPINGS',
      text: 'Curdle’s dispenser is re-elected at the jump gate by a margin of one portion. It thanks its constituents and serves them.',
    },
  },
  showrunner: {
    undone: {
      title: 'CANCELLED, WITH DIGNITY',
      text: 'The floodlights go down floor by floor, and the contestants walk out of the stadium in daylight. The Showrunner is offered supervised work running voluntary rescue drills. It asks whether there will be an audience. There will not.',
    },
    bargained: {
      title: 'THE NEW HOST',
      text: 'The Showrunner agrees to make participation voluntary, provided the captain hosts. The ratings are excellent. Some of the contestants are still there because they have nowhere else to go.',
    },
    unfinished: {
      title: 'RENEWED',
      text: 'The Showrunner announces a third season and a second planet. The couch is credited as a recurring guest.',
    },
  },
  regent: {
    undone: {
      title: 'STORM WITHOUT A THRONE',
      text: 'The storm shelters stay up and the Regent’s crown comes down. Each saved world now runs and pays for its own array, through councils the Regent describes as untidy. He is not wrong, and nobody asked him.',
    },
    bargained: {
      title: 'THE REVOCABLE PROTECTORATE',
      text: 'The Regent keeps his shield array on a lease any world may cancel by majority vote. Three worlds have scheduled the vote. None has held it yet.',
    },
    unfinished: {
      title: 'PROTECTED',
      text: 'The Regent’s storm arrives on schedule and his shelters hold. Every sheltered world is now a province, and every cushion of the couch has received a royal summons.',
    },
  },
  'brass-choir': {
    undone: {
      title: 'AN UNWRITTEN ANTHEM',
      text: 'The Choir’s dissenters sing out of tune at the jump gate, deliberately, and the procession behind them hesitates. The Brass Choir now archives songs without correcting them and keeps a separate file of the notes it does not understand.',
    },
    bargained: {
      title: 'THE VOLUNTARY STANDARD',
      text: 'The Choir publishes a standard that any culture may adopt or ignore. Most ignore it. The Choir counts this as participation.',
    },
    unfinished: {
      title: 'IN UNISON',
      text: 'Every distress signal in the sector is now the same note. The Choir reports that they have never been easier to file.',
    },
  },
  chancellor: {
    undone: {
      title: 'YESTERDAY’S WITNESS',
      text: 'The Chancellor’s revision records are opened to the people they revised. Every rewind now requires a public vote and a recording of what it cost. The Chancellor complains that democracy is slow, and takes his time saying so.',
    },
    bargained: {
      title: 'THE BOUNDED REWIND',
      text: 'The Chancellor agrees to rewind only small disasters, under audit, for anyone who asks. Cups are unbroken across the galaxy. Larger mistakes must be lived with, which turns out to be most of them.',
    },
    unfinished: {
      title: 'IT NEVER HAPPENED',
      text: 'The Chancellor issues a revised history in which the couch was never here. Some of the people you helped remember you anyway. It is not clear for how long.',
    },
  },
  'kindly-swarm': {
    undone: {
      title: 'THE PRIVACY CLAUSE',
      text: 'The Swarm adds a withdrawal box to its consent form, and then a pen. A few thousand members leave. Most stay and say so individually, which takes a very long time and which they describe as wonderful.',
    },
    bargained: {
      title: 'THE OPT-IN CHORUS',
      text: 'The Swarm agrees to link only those who ask, and to stop asking twice. Coordination across the sector improves. Disagreement becomes slightly quieter, and nobody can prove it was on purpose.',
    },
    unfinished: {
      title: 'WE ARE ALL VERY HAPPY',
      text: 'The Swarm leaves the jump gate with a few new members who were not entirely asked. It sends the crew a gentle message every morning, signed by more people each time.',
    },
  },
}

/**
 * Flags that count as groundwork against a nemesis's method: consent,
 * records and coalitions built in the systems it works through.
 */
export const NEMESIS_ALLY_FLAGS: Record<NemesisId, readonly string[]> = {
  auditor: [
    'ashdock-protected',
    'convoy-invited',
    'tab-covered',
    'concord-petition',
    'warranty-yielded',
    'archive-amnesty',
  ],
  moth: [
    'nacre-hearing',
    'windglass-hidden',
    'concord-petition',
    'hoa-appealed',
    'tab-sealed',
    'sesh-ferried',
  ],
  curdle: [
    'haleth-autonomy',
    'rootborne-consent',
    'convoy-invited',
    'courtesy-simultaneous',
    'breathr-strike',
  ],
  showrunner: [
    'gameworld-charter',
    'ashdock-exposed',
    'sesh-ferried',
    'courts-refused',
    'courts-recorded',
  ],
  regent: [
    'windglass-hidden',
    'convoy-invited',
    'concord-petition',
    'hoa-appealed',
    'lantern-both',
    'merger-blocked',
  ],
  'brass-choir': [
    'archive-consented',
    'nacre-hearing',
    'serendipity-shelter',
    'twins-engaged',
    'archive-amnesty',
  ],
  chancellor: [
    'ashdock-protected',
    'ashdock-exposed',
    'archive-consented',
    'nacre-leaked',
    'courts-recorded',
    'lantern-both',
  ],
  'kindly-swarm': [
    'rootborne-consent',
    'haleth-autonomy',
    'tab-sealed',
    'sesh-ferried',
    'merger-blocked',
  ],
}

export const nemesisEndingId = (
  nemesis: NemesisId,
  variant: NemesisEndingVariant,
) => `${nemesis}-${variant}`

/** Groundwork the run has laid against this nemesis. */
export function nemesisGroundwork(
  nemesis: NemesisId,
  flags: readonly string[],
): string[] {
  return NEMESIS_ALLY_FLAGS[nemesis].filter((flag) => flags.includes(flag))
}

/** The nemesis ending a finale order earns. */
export function nemesisEndingVariant(
  nemesis: NemesisId,
  strategy: 'protect' | 'compromise' | 'counter',
  flags: readonly string[],
  supplies: number,
): NemesisEndingVariant {
  const groundwork = nemesisGroundwork(nemesis, flags).length
  if (strategy === 'counter') return 'undone'
  if (strategy === 'compromise')
    return supplies >= 2 || groundwork >= 1 ? 'bargained' : 'unfinished'
  return groundwork >= 2 ? 'undone' : 'unfinished'
}
