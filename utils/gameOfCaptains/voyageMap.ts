import {
  ACT_ONE_BOARDS,
  ACT_ONE_CONSEQUENCES,
  ACT_ONE_ECHOES,
  ACT_ONE_NEMESIS,
  ACT_ONE_ORDERS,
} from './actOne'
import {
  ACT_TWO_ABOARD,
  ACT_TWO_BOARDS,
  ACT_TWO_CONSEQUENCES,
  ACT_TWO_ECHOES,
  ACT_TWO_MOVES,
  ACT_TWO_NEMESIS,
  ACT_TWO_ORDERS,
} from './actTwo'
import type { CrewId } from './rules'

/**
 * The whole voyage as one chart: Act I's three boards, then Act II's three.
 * Chapter n plays board n - 1; the jump gate follows the last board.
 */
export const VOYAGE_BOARDS: readonly (readonly string[])[] = [
  ...ACT_ONE_BOARDS,
  ...ACT_TWO_BOARDS,
]
export const VOYAGE_CHAPTERS = VOYAGE_BOARDS.length
export const ACT_TWO_FIRST_CHAPTER = ACT_ONE_BOARDS.length + 1

export const actOf = (chapter: number) =>
  chapter >= ACT_TWO_FIRST_CHAPTER ? 2 : 1

type Policy = 'aid' | 'observe' | 'intervene'
type Aftermath = { flag: string; text: string }

export const VOYAGE_CONSEQUENCES: Record<string, Record<Policy, Aftermath>> = {
  ...ACT_ONE_CONSEQUENCES,
  ...ACT_TWO_CONSEQUENCES,
}
export const VOYAGE_ECHOES: Record<string, string> = {
  ...ACT_ONE_ECHOES,
  ...ACT_TWO_ECHOES,
}
export const VOYAGE_ORDERS: Record<string, Record<Policy, string>> = {
  ...ACT_ONE_ORDERS,
  ...ACT_TWO_ORDERS,
}

export type NemesisId = keyof typeof ACT_ONE_NEMESIS
/** Every call a seeded nemesis contaminates, across both acts. */
export function nemesisThreats(id: NemesisId) {
  return [ACT_ONE_NEMESIS[id], ACT_TWO_NEMESIS[id]]
}

/** The nemesis's line for a chapter: Act I uses its own three acts, Act II its moves. */
export function nemesisMove(
  antagonist: { id: string; acts: readonly string[] },
  chapter: number,
): string {
  if (chapter < ACT_TWO_FIRST_CHAPTER)
    return antagonist.acts[Math.min(chapter - 1, 2)] ?? ''
  const moves = ACT_TWO_MOVES[antagonist.id as NemesisId]
  return moves?.[Math.min(chapter - ACT_TWO_FIRST_CHAPTER, 2)] ?? ''
}

export type Callback = { flag: string; odds: number; text: string }

/**
 * What earlier decisions do to a call: each listed flag already in the run
 * changes the odds and adds a line to the briefing.
 */
export const MISSION_CALLBACKS: Record<string, readonly Callback[]> = {
  haleth: [
    {
      flag: 'convoy-invited',
      odds: 10,
      text: 'The Hollow Lantern families you helped have sent their sealed patient list ahead, with a note asking the clinic to treat them as people.',
    },
  ],
  nacre: [
    {
      flag: 'ashdock-protected',
      odds: 8,
      text: 'The Ashdock union has vouched for the couch. The Assembly is warmer about it, by roughly two degrees.',
    },
  ],
  gameworld: [
    {
      flag: 'ashdock-exposed',
      odds: 8,
      text: 'The Ashdock ledgers you published name the arena’s labor contractor. The contestants have read them.',
    },
  ],
  rootborne: [
    {
      flag: 'haleth-autonomy',
      odds: 10,
      text: 'The Haleth physicians who now own their cure have sent seedlings and a protocol for asking the orchard first.',
    },
  ],
  bar: [
    {
      flag: 'windglass-broadcast',
      odds: -10,
      text: 'Pirates who heard your Windglass broadcast are drinking at Serendipity. The bar has seated them near the exits, theirs.',
    },
  ],
  'concord-intake': [
    {
      flag: 'nacre-hearing',
      odds: 8,
      text: 'The Nacre delegates you helped have sent a reference. The clerk reads it twice and looks slightly less like furniture.',
    },
    {
      flag: 'ashdock-exposed',
      odds: -6,
      text: 'Concord’s clerks have read about Ashdock. They ask whether you also intend to publish their names.',
    },
    {
      flag: 'convoy-seized',
      odds: -8,
      text: 'Concord keeps a file on the convoy you boarded at Hollow Lantern. It is filed under incidents.',
    },
  ],
  'courtesy-reactor': [
    {
      flag: 'archive-consented',
      odds: 8,
      text: 'The Tellurian Archive has lent both parliaments a very old protocol for accepting help without being seen to.',
    },
    {
      flag: 'windglass-broadcast',
      odds: -6,
      text: 'Both parliaments heard your Windglass broadcast. Neither wishes to be broadcast.',
    },
  ],
  'sesh-backups': [
    {
      flag: 'gameworld-charter',
      odds: 8,
      text: 'The Gameworld performers whose charter you helped draft have mailed the backups a union template.',
    },
    {
      flag: 'archive-appropriated',
      odds: -8,
      text: 'The Foundry heard how the couch saved a library’s memory without asking it. The backups would like to be asked.',
    },
  ],
  'serendipity-tab': [
    {
      flag: 'serendipity-shelter',
      odds: 10,
      text: 'The witness you sheltered at the bar has been quietly paying off one corner of your tab.',
    },
    {
      flag: 'serendipity-betrayed',
      odds: -12,
      text: 'The bar remembers the witness you exposed. Its gravity is noticeably firmer when you sit down.',
    },
  ],
  'insult-compiler': [
    {
      flag: 'courtesy-simultaneous',
      odds: 10,
      text: 'Both Twins remember the reactor. They are inclined to believe your translator made an honest mistake.',
    },
    {
      flag: 'courtesy-inspection',
      odds: -8,
      text: 'Both Twins remember the routine inspection. They are inclined to believe nothing you say.',
    },
  ],
  warranty: [
    {
      flag: 'ashdock-protected',
      odds: 8,
      text: 'The Ashdock union recognizes the couch and offers it a place at the front of the queue, which you now feel obliged to consider refusing.',
    },
    {
      flag: 'ashdock-silenced',
      odds: -8,
      text: 'The dockworkers remember that the couch left Ashdock quietly last time. They let you queue.',
    },
  ],
  hoa: [
    {
      flag: 'windglass-hidden',
      odds: 10,
      text: 'The sanctuary you escorted at Windglass vouches for the couch in person, after dark.',
    },
    {
      flag: 'windglass-broadcast',
      odds: -10,
      text: 'The association found the sanctuary through your earlier broadcast. It was very helpful to them.',
    },
    {
      flag: 'concord-petition',
      odds: 4,
      text: 'Copies of the Concord petitions are circulating at the hearing. Someone has highlighted the appeals procedure.',
    },
  ],
  'season-two': [
    {
      flag: 'gameworld-charter',
      odds: 10,
      text: 'The exit charter you helped draft is still taped inside every dressing-room door.',
    },
    {
      flag: 'gameworld-broken',
      odds: -6,
      text: 'The contestants remember the last time the couch shut the arena down. Several are still looking for their charter.',
    },
    {
      flag: 'sesh-ferried',
      odds: 4,
      text: 'Two former Sesh backups now work the lighting rig. They have agreed to look the other way, together.',
    },
  ],
  'committee-end': [
    {
      flag: 'convoy-invited',
      odds: 10,
      text: 'The families you helped at Hollow Lantern sit on the committee now. They have moved that it stop meeting.',
    },
    {
      flag: 'convoy-unanswered',
      odds: -6,
      text: 'The committee minutes note that the couch passed this way before and did not stop.',
    },
    {
      flag: 'convoy-seized',
      odds: -8,
      text: 'The convoy you boarded last time is the second hull. Its pilot would prefer to be asked this time.',
    },
  ],
  'gig-orchard': [
    {
      flag: 'rootborne-consent',
      odds: 10,
      text: 'The growers who negotiated their own air with you remember the procedure. They have started a picket rota.',
    },
    {
      flag: 'rootborne-severed',
      odds: -8,
      text: 'The growers remember the couch cutting their network. Breathr’s marketing remembers it too.',
    },
    {
      flag: 'haleth-owned',
      odds: -6,
      text: 'Breathr’s terms of service were drafted by the firm that holds the Haleth patent. They recognize the couch.',
    },
  ],
  overdue: [
    {
      flag: 'archive-consented',
      odds: 10,
      text: 'The Archive remembers that you asked it first. It has waived the couch’s late fees, provisionally.',
    },
    {
      flag: 'archive-appropriated',
      odds: -10,
      text: 'The collections agency has an entire department for the couch, staffed by the catalogue you took.',
    },
    {
      flag: 'archive-burned',
      odds: -6,
      text: 'The western reading room is still a crater. The Archive has added it to your account.',
    },
  ],
  merger: [
    {
      flag: 'nacre-hearing',
      odds: 10,
      text: 'The neighborhood you helped seat at the hearing knows the way to the chamber now.',
    },
    {
      flag: 'nacre-denied',
      odds: -8,
      text: 'The Assembly’s last quorum excluded the neighborhood again. The integration team has cited it as precedent.',
    },
    {
      flag: 'twins-engaged',
      odds: 6,
      text: 'The engaged Courtesy Twins have sent the Assembly a strongly worded note on the importance of asking first.',
    },
  ],
}

/** The callbacks a run has earned for a call. */
export function earnedCallbacks(
  missionId: string,
  flags: readonly string[],
): Callback[] {
  return (MISSION_CALLBACKS[missionId] ?? []).filter((c) =>
    flags.includes(c.flag),
  )
}

/** Lines from officers aboard who have something to say about a call. */
export function aboardLines(
  missionId: string,
  crew: readonly CrewId[],
): string[] {
  const lines = (
    ACT_TWO_ABOARD as Record<string, Partial<Record<CrewId, string>>>
  )[missionId]
  return lines ? crew.flatMap((id) => (lines[id] ? [lines[id]!] : [])) : []
}
