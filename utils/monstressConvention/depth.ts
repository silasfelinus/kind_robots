/**
 * MONSTRIQUE case depth: the shared notebook. Iris and Norb keep one
 * notebook, so either of them can lay two clues side by side and draw a
 * deduction from them. Norb, who never touches anything, has one deduction
 * of his own in every Chapter One room: he only has to look. The two ghosts
 * react to each other's testimony in shared topics, and a topic reads as
 * spent once everyone who can answer it has.
 *
 * Deductions are unscored, so Chapter One keeps its 205 and Chapter Two its
 * 64. Every line here is written for both editions and never names the
 * killer. Like chapterTwo.ts, this module has no runtime import from
 * prologue.ts, so the engine can pull it in without an import cycle.
 */
import type { CaseState } from './prologue'
import { CHAPTER_TWO_EVIDENCE } from './chapterTwo'

export type DeductionKind = 'compare' | 'norb' | 'reactive'

/** What a deduction adds to the case besides itself. */
export interface DeductionGrants {
  evidence?: string[]
  flags?: string[]
  topics?: string[]
}

export interface ClueComparison {
  id: string
  label: string
  clues: readonly [string, string]
  line: string
  grants?: DeductionGrants
}

export interface NorbDeduction {
  id: string
  label: string
  /** The hotspot Norb looks at. Looking is all he ever does. */
  hotspot: string
  /** Notebook entries he needs first; empty means just being there. */
  needs: readonly string[]
  line: string
  grants?: DeductionGrants
}

export type ChapterOneRoomId =
  | 'motel-exterior'
  | 'front-office'
  | 'ice-alcove'
  | 'balcony'
  | 'investigators-room'
  | 'neighbor-room'
  | 'odette-room'
  | 'city-map'
  | 'convention-center'

export const CHAPTER_ONE_ROOM_IDS: readonly ChapterOneRoomId[] = [
  'motel-exterior',
  'front-office',
  'ice-alcove',
  'balcony',
  'investigators-room',
  'neighbor-room',
  'odette-room',
  'city-map',
  'convention-center',
]

/**
 * Two clues from the shared notebook, compared. Order never matters, and
 * either investigator may do it: comparing is thinking, not touching.
 */
export const CLUE_COMPARISONS: readonly ClueComparison[] = [
  {
    id: 'ice-then-knife',
    label: 'The ice came first, then the knife',
    clues: ['ice-timing', 'ghost-violet'],
    line: 'Iris: The double clank, then Violet’s door that never opened after the ice. Norb: So the ice arrived first and the knife moved second, inside a room nobody else entered. Underline “nobody else”. Twice.',
  },
  {
    id: 'beach-hex-knife',
    label: 'The knife fits the shrine’s empty dent',
    clues: ['knife-prop-mark', 'shrine-photo'],
    line: 'Iris: BEACH HEX, 1964 on the knife, and a Beach Hex shrine downstairs with five dents and four knives. Norb: The knife in 205 is exactly the shape of the empty dent. I measured it. From the doorway.',
  },
  {
    id: 'fangs-in-bucket',
    label: 'Violet’s fangs left with the ice bucket',
    clues: ['ice-ring', 'violet-photo'],
    line: 'Iris: In my photo Violet’s gums are bare, and her fangs aren’t on the bed. Norb: And the ice bucket is now a wet ring. Wherever that bucket went, her fangs went with it.',
    grants: { flags: ['fangs-lost'], topics: ['missing-fangs'] },
  },
  {
    id: 'dressing-room',
    label: 'Greasepaint on, cold cream off',
    clues: ['makeup-smear', 'violet-scent'],
    line: 'Iris: Tan greasepaint on the bucket, cold cream in the air. Norb: Greasepaint goes on, cold cream takes it off. Somebody took their face off in the dark, Iris, and carried the bucket out bare.',
  },
  {
    id: 'two-halves',
    label: 'Two ghosts, two halves of one minute',
    clues: ['odette-floating', 'ghost-violet'],
    line: 'Norb: Odette watched the knife and saw it move. Violet watched the door and saw it stay shut. Two halves of one minute, Iris, and neither ghost is lying. That is the part I dislike.',
  },
  {
    id: 'nobody-signed',
    label: 'Nobody came past the desk or the door',
    clues: ['guest-ledger', 'neighbor-testimony'],
    line: 'Iris: Nobody signed the register after ten, and Dolores heard nobody knock. Norb: So whoever finished the evening in 205 never came past the front desk or the front door. Marta will be thrilled.',
  },
  {
    id: 'contract-knife',
    label: 'The weapon came from the first contract',
    clues: ['harker-file', 'knife-prop-mark'],
    line: 'Norb: Harker File One is the Beach Hex contracts. The knife is a Beach Hex prop. Odette spent sixty years cheating these women, Iris, and the weapon came from the first picture she cheated them on.',
  },
  {
    id: 'unpaid-maker',
    label: 'The woman on the reel was never paid',
    clues: ['reel-1964', 'prop-invoice'],
    line: 'Iris: On the reel, Francesca hands out the knives. On the invoice, F. Stein made five and was never paid. Norb: The woman who made the props is the woman they forgot to pay. That is not a coincidence. That is an accounts department.',
  },
  {
    id: 'sold-drawings',
    label: 'The replicas are Francesca’s blueprint',
    clues: ['merch-license', 'five-blueprint'],
    line: 'Norb: Harker Licensing’s replicas match Francesca’s numbered blueprint line for line. Odette did not buy the design, Iris. She photocopied it.',
  },
  {
    id: 'fifth-knife',
    label: 'Five knives made, four on the velvet',
    clues: ['shrine-photo', 'empty-case'],
    line: 'Iris: Five empty slots in Francesca’s case, four knives in the motel shrine. Norb: Five made, four on velvet, one in Room 205. The arithmetic is the only clean thing in this city.',
  },
]

/**
 * Norb's own deduction in each Chapter One room. He looks; Iris could look
 * at the same thing all night and only see it.
 */
export const NORB_DEDUCTIONS: Record<ChapterOneRoomId, NorbDeduction> = {
  'motel-exterior': {
    id: 'long-lens',
    label: 'Gavin shoots through glass',
    hotspot: 'gavin',
    needs: [],
    line: 'Norb: Six hundred millimetres of lens, aimed at the second floor. From that kerb it reaches Room 205’s window and nothing else. Mr. Gavin photographs through glass, Iris. Ask him where he was.',
    grants: { topics: ['fan-alibi'] },
  },
  'front-office': {
    id: 'fountain-pen',
    label: 'Room 205 was signed in fountain pen',
    hotspot: 'guest-ledger',
    needs: [],
    line: 'Norb: Every guest signs in ballpoint. Room 205 is in fountain pen, in Marta’s hand, with a flourish nobody has taught since 1964. She checked them in herself, and she wanted it to look nice.',
    grants: { evidence: ['guest-ledger'], topics: ['room-access'] },
  },
  'ice-alcove': {
    id: 'lid-left-open',
    label: 'Somebody opened the ice machine after the clank',
    hotspot: 'maintenance-log',
    needs: ['ice-timing'],
    line: 'Norb: Pip logs every cycle, clank-clank, eleven minutes apart. Last night, after the double clank, one extra line: “LID LEFT OPEN. Not me.” Somebody put something in that machine, Iris. You will be the one to take it out.',
    grants: { flags: ['bucket-traced'], topics: ['ice-clank'] },
  },
  balcony: {
    id: 'bucket-trail',
    label: 'The bucket’s drips lead to the ice machine',
    hotspot: 'footprints',
    needs: ['ice-ring'],
    line: 'Norb: Beside the prints, a line of drips, round as a bucket rim, from 205 to the top of the alcove stairs. Nobody throws an ice bucket away, Iris. They put it back where ice comes from.',
    grants: { flags: ['bucket-traced'] },
  },
  'investigators-room': {
    id: 'gavin-cleared',
    label: 'Gavin was out front at the clank',
    hotspot: 'desk',
    needs: ['fan-photo', 'ice-timing'],
    line: 'Norb: Pin Mr. Gavin’s time stamps beside the double clank. At the minute the knife moved, his lens was on the billboard. A creep, yes. A murderer, no. I will say so in print, with reluctance.',
    grants: { evidence: ['fan-exonerated'] },
  },
  'neighbor-room': {
    id: 'fast-clock',
    label: 'Dolores’s clock, corrected',
    hotspot: 'wall-clock',
    needs: ['neighbor-testimony'],
    line: 'Norb: Mrs. Dolores says her clock runs five minutes fast. Correct for it and the thump she heard came one minute after the double clank. Ice, then the knife, then silence. We have a clock.',
    grants: { evidence: ['ice-timing'] },
  },
  'odette-room': {
    id: 'watched-door',
    label: 'Violet never took her eyes off the door',
    hotspot: 'violet-ghost',
    needs: [],
    line: 'Norb: Miss Wisp, you have watched that door since we arrived. Violet: Professional habit, honey. After the ice came I watched it in the mirror the whole time, and it never opened. Norb: Thank you. That is the most useful thing anyone has said to me without touching me.',
    grants: { evidence: ['ghost-violet'], topics: ['ice-clank'] },
  },
  'city-map': {
    id: 'starlite-on-map',
    label: 'The knife’s studio is on the map',
    hotspot: 'drive-in',
    needs: ['knife-prop-mark'],
    line: 'Norb: STARLITE PICTURES, stamped on the knife. The Starlite Drive-In, on the map at Hexwater Beach. Not tonight, Iris. Tonight we earn the convention lead. But write it down, in pen.',
  },
  'convention-center': {
    id: 'cheap-motive',
    label: 'Motive is cheap at a convention',
    hotspot: 'mummy-actress',
    needs: ['ghost-odette'],
    line: 'Norb: Miss Pappatra hated Odette and tells anyone holding a pen. People who did it do not advertise a motive at a signing table. Motive is cheap at a convention, Iris. The clock is not.',
  },
}

/** The ghosts' shared topics: each one reacts to what the other said. */
export const REACTIVE_TOPICS: Record<string, string> = {
  'floating-knife': 'What Odette saw float',
  'unopened-door': 'What Violet saw at the door',
}

/** The testimony that opens each shared topic. */
export const REACTIVE_TOPIC_SOURCES: Record<string, string> = {
  'floating-knife': 'odette-floating',
  'unopened-door': 'ghost-violet',
}

/** Who answers the shared topics. */
export const REACTIVE_TOPIC_TARGETS: Record<string, string[]> = {
  'odette-ghost': ['floating-knife', 'unopened-door'],
  'violet-ghost': ['floating-knife', 'unopened-door'],
  nico: ['floating-knife', 'unopened-door'],
}

/** Flags each ghost sets when she vouches for the other's half. */
export const VIOLET_BACKS_ODETTE = 'violet-backs-odette'
export const ODETTE_BACKS_VIOLET = 'odette-backs-violet'

export const GHOSTS_AGREE: { id: string; label: string } = {
  id: 'ghosts-agree',
  label: 'Odette and Violet vouch for each other',
}

/**
 * The shared-topic answers. Each ghost's line changes once the other has
 * reacted, and Norb notices when both have.
 */
export function reactiveLine(
  state: CaseState,
  target: string,
  topic: string,
): { line: string; flag?: string } | null {
  const violetBacked = state.flags.includes(VIOLET_BACKS_ODETTE)
  const odetteBacked = state.flags.includes(ODETTE_BACKS_VIOLET)
  switch (target + ':' + topic) {
    case 'violet-ghost:floating-knife':
      return {
        flag: VIOLET_BACKS_ODETTE,
        line: odetteBacked
          ? 'Violet: She called me a terrible liar and then backed me up? Then I’ll back her. Nobody crossed that room to the nightstand, so if the knife moved, it moved on its own. Don’t tell her I said so.'
          : 'Violet: She says it FLOATED? Honey, I was watching the door, not the knife. But nobody walked past me to that nightstand, and I’d have seen them. Fine. It floated. Don’t tell her I said so.',
      }
    case 'odette-ghost:floating-knife':
      return {
        line: violetBacked
          ? 'Odette: She agrees with me? Write the date down, darling. In forty years of business nobody has ever agreed with me for free.'
          : 'Odette: Floated, darling. I saw it over her shoulder. I have sat through forty years of Monstrique special effects, and that was not wires.',
      }
    case 'odette-ghost:unopened-door':
      return {
        flag: ODETTE_BACKS_VIOLET,
        line: violetBacked
          ? 'Odette: She backed my floating knife, so I’ll back her door. Professional courtesy, darling. Don’t get used to it.'
          : 'Odette: She watched the DOOR? I paid for a performance and she watched the door. Still, she’s a terrible liar, darling. It’s why I booked her. If she says it never opened, it never opened.',
      }
    case 'violet-ghost:unopened-door':
      return {
        line: odetteBacked
          ? 'Violet: A terrible liar? From her, that’s a love letter. Yes. The door never opened.'
          : 'Violet: One door, one chain, one mirror to watch it in. It never opened, honey. I’d stake my deposit on it.',
      }
    case 'nico:floating-knife':
    case 'nico:unopened-door':
      return {
        line:
          violetBacked && odetteBacked
            ? 'Norb: Each ghost now vouches for the other’s half. That is corroboration, Iris. I will allow myself one small, sterile smile.'
            : topic === 'floating-knife'
              ? 'Norb: A knife that moves with no visible hand. I decline to believe in floating cutlery. I do believe in two witnesses who both saw no hand. Ask Miss Wisp what she makes of it.'
              : 'Norb: A door watched in a mirror by a professional. I trust a mirror more than most people, and Miss Wisp more than the mirror. Ask Odette whether she agrees.',
      }
  }
  return null
}

/** Every deduction the notebook can hold, with its kind and chapter. */
export const DEDUCTIONS: Record<
  string,
  { label: string; kind: DeductionKind; chapter: 1 | 2; room?: string }
> = {
  ...Object.fromEntries(
    CLUE_COMPARISONS.map((comparison) => [
      comparison.id,
      {
        label: comparison.label,
        kind: 'compare' as const,
        chapter: comparison.clues.some((clue) => clue in CHAPTER_TWO_EVIDENCE)
          ? (2 as const)
          : (1 as const),
      },
    ]),
  ),
  ...Object.fromEntries(
    Object.entries(NORB_DEDUCTIONS).map(([room, deduction]) => [
      deduction.id,
      {
        label: deduction.label,
        kind: 'norb' as const,
        chapter: 1 as const,
        room,
      },
    ]),
  ),
  [GHOSTS_AGREE.id]: {
    label: GHOSTS_AGREE.label,
    kind: 'reactive',
    chapter: 1,
  },
}

/** True for a deduction id the notebook knows, for save validation. */
export function isDeduction(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(DEDUCTIONS, id)
}

export function deductionsOf(state: Pick<CaseState, 'deductions'>): string[] {
  return state.deductions ?? []
}

export function findComparison(
  first: string,
  second: string,
): ClueComparison | null {
  return (
    CLUE_COMPARISONS.find(
      ({ clues: [a, b] }) =>
        (a === first && b === second) || (a === second && b === first),
    ) ?? null
  )
}

/**
 * Norb's deduction waiting in this room: it is Chapter One, he has not made
 * it yet and the notebook holds what he needs. Only Norb can make it, by
 * looking at its hotspot; the stage uses this to say he has a hunch.
 */
export function norbHunch(state: CaseState): NorbDeduction | null {
  if (state.chapter === 2) return null
  const deduction = NORB_DEDUCTIONS[state.room as ChapterOneRoomId]
  if (!deduction || deductionsOf(state).includes(deduction.id)) return null
  const known = (key: string) =>
    state.evidence.includes(key) || state.flags.includes(key)
  return deduction.needs.every(known) ? deduction : null
}

/** Misses get a joke, never a penalty. */
export const COMPARE_MISSES = [
  'Norb: Those two clues have nothing to say to each other. Yet.',
  'Iris lays the two notes side by side. They sit there like strangers at a bus stop.',
  'Norb: A comparison needs a common factor, Iris. Those two share only your handwriting.',
]
