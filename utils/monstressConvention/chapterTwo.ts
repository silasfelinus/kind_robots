/**
 * MONSTRIQUE, Chapter 2: Beach Hex. The Beach Hex stamp on the knife leads
 * Iris and Norb to the Starlite Drive-In at Hexwater Beach, where the 1964
 * films still play, and on to Francesca Stein's midnight science-cinema on
 * Bolt Street. Francesca, cut from Monstrique in 1964, built the Hexblades;
 * Odette sold her designs as merchandise. Three required clues (the 1964
 * reel, Francesca's prop invoice and the scratched-out sleeve) each have two
 * routes, and the chapter ends when Francesca admits "I made five knives".
 *
 * Clem (the Starlite's projectionist since 1964) and Dee Dee (a bat-woman
 * carhop) are supporting witnesses proposed for this chapter. Everyone is an
 * adult. Story canon: conductor projects/monstress-convention/STORY-BIBLE.md.
 *
 * This module has no runtime import from prologue.ts, so the engine can pull
 * its rooms and rules in without an import cycle.
 */
import type {
  CaseEnding,
  CaseResult,
  CaseState,
  HotelRoom,
  Verb,
} from './prologue'

export type ChapterTwoRoomId =
  | 'drive-in'
  | 'projection-booth'
  | 'snack-bar'
  | 'starlite-office'
  | 'science-cinema'
  | 'francesca-lab'

export type ChapterTwoEnding = 'five-knives'

export const CHAPTER_TWO_ENDING: ChapterTwoEnding = 'five-knives'

/** Chapter One endings that earn the drive-in lead. */
export const CHAPTER_TWO_OPENERS: readonly CaseEnding[] = [
  'lead-earned',
  'fifth-hexblade',
]

/** The three clues Francesca must see before she talks about the knives. */
export const CHAPTER_TWO_REQUIRED = [
  'reel-1964',
  'prop-invoice',
  'sleeve-face',
] as const

export const CHAPTER_TWO_ROOM_IDS: readonly ChapterTwoRoomId[] = [
  'drive-in',
  'projection-booth',
  'snack-bar',
  'starlite-office',
  'science-cinema',
  'francesca-lab',
]

export const CHAPTER_TWO_ROOMS: Record<ChapterTwoRoomId, HotelRoom> = {
  'drive-in': {
    id: 'drive-in',
    label: 'Starlite Drive-In',
    district: 'HEXWATER BEACH',
    floor: 0,
    caption:
      'The Starlite Drive-In, Hexwater Beach. A forty-foot screen flickers over the surf with a 1964 beach-party picture, a shooting-star sign buzzes pink and gold, and rows of clip-on speakers wait for cars that stopped coming in 1979.',
    exits: ['city-map', 'projection-booth', 'snack-bar', 'starlite-office'],
    hotspots: [
      {
        id: 'starlite-screen',
        label: 'The forty-foot screen',
        x: 50,
        y: 30,
        verbs: ['look', 'photograph'],
      },
      {
        id: 'starlite-sign',
        label: 'Shooting-star neon sign',
        x: 50,
        y: 14,
        verbs: ['look', 'photograph'],
      },
      {
        id: 'speaker-post',
        label: 'Clip-on speaker post',
        x: 40,
        y: 64,
        verbs: ['look', 'use'],
      },
      {
        id: 'convertible',
        label: 'Rusty finned convertible',
        x: 14,
        y: 62,
        verbs: ['look', 'use'],
      },
      {
        id: 'gravel-path',
        label: 'Gravel path behind the screen',
        x: 84,
        y: 80,
        verbs: ['look', 'use'],
      },
    ],
  },
  'projection-booth': {
    id: 'projection-booth',
    label: 'Starlite Projection Booth',
    district: 'HEXWATER BEACH',
    floor: 1,
    caption:
      'A plywood booth that smells of hot carbon and percolated coffee. Two green projectors aim through the ports, loose film coils on the floor, and one dented can on the rack has 1964 written on masking tape.',
    exits: ['drive-in'],
    hotspots: [
      {
        id: 'clem',
        label: 'Clem, projectionist since 1964',
        x: 38,
        y: 74,
        verbs: ['look', 'talk', 'ask', 'flirt'],
      },
      {
        id: 'projector',
        label: 'Carbon-arc projector',
        x: 15,
        y: 42,
        verbs: ['look', 'use'],
      },
      {
        id: 'reel-can',
        label: 'Film can marked 1964',
        x: 83,
        y: 46,
        verbs: ['look', 'take', 'photograph'],
      },
      {
        id: 'rewind-bench',
        label: 'Rewind bench and light box',
        x: 56,
        y: 60,
        verbs: ['look', 'use'],
      },
      {
        id: 'booth-schedules',
        label: 'Faded studio call sheets',
        x: 63,
        y: 24,
        verbs: ['look', 'photograph'],
      },
    ],
  },
  'snack-bar': {
    id: 'snack-bar',
    label: 'Starlite Snack Bar',
    district: 'HEXWATER BEACH',
    floor: 0,
    caption:
      'Chrome, turquoise and fifty years of fryer oil. A popcorn machine glows, a hot dog rolls forever, and a glass memorabilia case above the jukebox holds a surf-record sleeve with one face scratched away.',
    exits: ['drive-in'],
    hotspots: [
      {
        id: 'deedee',
        label: 'Dee Dee, carhop on roller skates',
        x: 46,
        y: 74,
        verbs: ['look', 'talk', 'ask', 'flirt'],
      },
      {
        id: 'sleeve-case',
        label: 'The 1964 Beach Hex sleeve',
        x: 82,
        y: 26,
        verbs: ['look', 'photograph', 'use'],
      },
      {
        id: 'jukebox',
        label: 'Jukebox',
        x: 84,
        y: 62,
        verbs: ['look', 'use'],
      },
      {
        id: 'popcorn-machine',
        label: 'Glowing popcorn machine',
        x: 28,
        y: 42,
        verbs: ['look', 'use'],
      },
      {
        id: 'hotdog-cutout',
        label: 'Dancing hot dog cut-out',
        x: 9,
        y: 50,
        verbs: ['look'],
      },
    ],
  },
  'starlite-office': {
    id: 'starlite-office',
    label: 'Starlite Pictures Office',
    district: 'BEHIND THE SCREEN',
    floor: 1,
    caption:
      'Starlite Pictures went bust in 1965 and nobody cleaned out the desk. The back of the screen glows overhead, a banker’s lamp burns green, and a spike of yellow carbon invoices leans on the blotter.',
    exits: ['drive-in'],
    hotspots: [
      {
        id: 'invoice-spike',
        label: 'Spike of carbon invoices',
        x: 24,
        y: 44,
        verbs: ['look', 'take', 'photograph'],
      },
      {
        id: 'filing-cabinet',
        label: 'Open filing cabinet',
        x: 40,
        y: 40,
        verbs: ['look', 'photograph'],
      },
      {
        id: 'prop-crate',
        label: 'Crate of beach-party props',
        x: 80,
        y: 58,
        verbs: ['look', 'use'],
      },
      {
        id: 'publicity-stills',
        label: 'Wall of publicity stills',
        x: 58,
        y: 24,
        verbs: ['look', 'photograph'],
      },
      {
        id: 'office-safe',
        label: 'Squat iron safe',
        x: 66,
        y: 62,
        verbs: ['look', 'use'],
      },
    ],
  },
  'science-cinema': {
    id: 'science-cinema',
    label: 'Bolt Street Science-Cinema',
    district: 'BOLT STREET',
    floor: 0,
    caption:
      'A tiny art deco movie house where it is always the midnight show. A Tesla coil crackles in a bell jar on the candy counter, lobby cards promise giant ants and brains in jars, and a velvet rope guards the purple curtains.',
    exits: ['city-map', 'francesca-lab'],
    hotspots: [
      {
        id: 'ticket-window',
        label: 'Brass ticket window',
        x: 9,
        y: 50,
        verbs: ['look', 'use'],
      },
      {
        id: 'tesla-jar',
        label: 'Tesla coil in a bell jar',
        x: 50,
        y: 46,
        verbs: ['look', 'use', 'photograph'],
      },
      {
        id: 'lobby-cards',
        label: 'Science-horror lobby cards',
        x: 30,
        y: 28,
        verbs: ['look', 'photograph'],
      },
      {
        id: 'midnight-curtain',
        label: 'Midnight Show curtains',
        x: 86,
        y: 50,
        verbs: ['look', 'use'],
      },
    ],
  },
  'francesca-lab': {
    id: 'francesca-lab',
    label: 'Francesca’s Lab',
    district: 'BOLT STREET',
    floor: 1,
    caption:
      'Behind the cinema screen, a prop workshop hums between two Tesla coils. A blueprint of five jewelled daggers hangs over a workbench, and beneath it lies a velvet case with five dagger-shaped hollows, all empty.',
    exits: ['science-cinema'],
    hotspots: [
      {
        id: 'francesca',
        label: 'Francesca Stein, stitched and impatient',
        x: 58,
        y: 74,
        verbs: ['look', 'talk', 'ask', 'flirt'],
      },
      {
        id: 'five-blueprint',
        label: 'Blueprint of five daggers',
        x: 36,
        y: 28,
        verbs: ['look', 'photograph'],
      },
      {
        id: 'knife-case',
        label: 'Empty five-slot knife case',
        x: 40,
        y: 62,
        verbs: ['look', 'photograph'],
      },
      {
        id: 'robot-costume',
        label: 'Half-built tin robot costume',
        x: 78,
        y: 52,
        verbs: ['look', 'use'],
      },
      {
        id: 'tesla-coil',
        label: 'Crackling Tesla coil',
        x: 8,
        y: 34,
        verbs: ['look', 'use'],
      },
    ],
  },
}

export const CHAPTER_TWO_TOPICS: Record<string, string> = {
  'reel-1964': 'The 1964 reel',
  'starlite-office': 'The office behind the screen',
  'scratched-sleeve': 'The scratched-out sleeve',
  francesca: 'Francesca Stein',
  hexblades: 'Who made the Hexblades',
  'beach-hex-1964': 'Shooting Beach Hex in 1964',
  'merch-royalties': 'Hexblade replicas and royalties',
  'harker-file-two': 'Harker File #2',
  'starlite-findings': 'What the Starlite turned up',
}

export const CHAPTER_TWO_EVIDENCE: Record<string, string> = {
  'reel-1964':
    '1964 reel: Francesca hands out jewelled knives, and passes one off-camera',
  'prop-invoice':
    'Starlite invoice: five jewelled stage daggers by F. Stein, never paid',
  'sleeve-face': 'The face scratched off the 1964 sleeve is Francesca’s',
  'call-sheet': '1964 call sheet: props by F. Stein, Bolt Street',
  'remaster-credit': 'The Beach Hex remaster drops Francesca’s props credit',
  'merch-license':
    'Harker Licensing sold Hexblade replicas from Francesca’s drawings',
  'five-blueprint': 'Francesca’s blueprint: five Hexblades, numbered 1 to 5',
  'empty-case': 'Francesca’s presentation case: five slots, all empty',
  'harker-file-2': 'Harker File #2: the Hexblade replica royalties',
  'pommel-five': 'Violet: the knife in 205 had a 5 on the pommel',
}

export const CHAPTER_TWO_ITEMS: Record<string, string> = {
  'reel-can': 'The 1964 reel',
  'invoice-sheet': 'Francesca’s 1964 invoice',
}

export const CHAPTER_TWO_GRACES: Record<string, { name: string; max: number }> =
  {
    francesca: { name: 'Francesca Stein', max: 2 },
  }

/** Who answers which Chapter Two topic (merged into availableTopics). */
export const CHAPTER_TWO_TOPIC_TARGETS: Record<string, string[]> = {
  clem: [
    'reel-1964',
    'starlite-office',
    'francesca',
    'beach-hex-1964',
    'iris-neck',
  ],
  deedee: [
    'scratched-sleeve',
    'starlite-office',
    'francesca',
    'iris-neck',
    'iris-tattoo',
  ],
  francesca: [
    'hexblades',
    'merch-royalties',
    'scratched-sleeve',
    'reel-1964',
    'iris-neck',
  ],
  'odette-ghost': ['harker-file-two', 'starlite-findings', 'merch-royalties'],
  'violet-ghost': ['starlite-findings'],
  nico: ['hexblades', 'starlite-findings'],
}

/** Hotspots and flags that only the mature edition shows or sets. */
export const CHAPTER_TWO_MATURE_HOTSPOTS = ['convertible'] as const
export const CHAPTER_TWO_MATURE_FLAGS = ['back-seat', 'francesca-spark']

/**
 * Chapter Two's own Sierra score: sixty-four points in the mature edition,
 * for 1964. Like Chapter One's, it is derived from evidence and flags.
 */
export const CHAPTER_TWO_SCORE_TABLE: Array<{
  key: string
  points: number
  mature?: true
}> = [
  { key: 'reel-1964', points: 8 },
  { key: 'prop-invoice', points: 8 },
  { key: 'sleeve-face', points: 8 },
  { key: 'bolt-street-lead', points: 3 },
  { key: 'office-access', points: 2 },
  { key: 'lab-access', points: 3 },
  { key: 'reel-running', points: 3 },
  { key: 'call-sheet', points: 1 },
  { key: 'remaster-credit', points: 3 },
  { key: 'merch-license', points: 3 },
  { key: 'five-blueprint', points: 1 },
  { key: 'empty-case', points: 2 },
  { key: 'harker-file-2', points: 4 },
  { key: 'pommel-five', points: 3 },
  { key: 'invoice-returned', points: 3 },
  { key: 'chapter-two-filed', points: 5 },
  { key: 'back-seat', points: 2, mature: true },
  { key: 'francesca-spark', points: 2, mature: true },
]

export function chapterTwoMaxScore(
  audience: 'general' | 'mature' = 'mature',
): number {
  return CHAPTER_TWO_SCORE_TABLE.filter(
    (row) => audience === 'mature' || !row.mature,
  ).reduce((sum, row) => sum + row.points, 0)
}

export function chapterTwoScore(
  state: CaseState,
  audience: 'general' | 'mature' = 'mature',
): number {
  return CHAPTER_TWO_SCORE_TABLE.reduce(
    (sum, row) =>
      (audience === 'mature' || !row.mature) &&
      (state.evidence.includes(row.key) || state.flags.includes(row.key))
        ? sum + row.points
        : sum,
    0,
  )
}

/** The sleeve, the reel and the invoice, in the words Norb uses. */
const REQUIRED_NAMES: Record<(typeof CHAPTER_TWO_REQUIRED)[number], string> = {
  'reel-1964': 'the 1964 reel',
  'prop-invoice': 'her prop invoice',
  'sleeve-face': 'the face on the scratched sleeve',
}

export function missingChapterTwoClues(state: CaseState): string[] {
  return CHAPTER_TWO_REQUIRED.filter(
    (clue) => !state.evidence.includes(clue),
  ).map((clue) => REQUIRED_NAMES[clue])
}

/** Every wrong combination gets a joke, Chapter Two edition. */
export const CHAPTER_TWO_WRONG_ITEM: Record<string, Record<string, string>> = {
  'reel-can': {
    deedee:
      'Dee Dee: A film can? Hon, I serve clam rolls. Take that up to Clem before he has a heart attack.',
    francesca:
      'Francesca: I do not need to watch it. I was there. I was standing in it.',
    nico: 'Norb: Sixty years of carbon dust and nitrate. Do not hand me the past, Iris.',
    'odette-ghost':
      'Odette: Home movies, darling? I only watch footage I own. Which is most of it.',
  },
  'invoice-sheet': {
    clem: 'Clem: Starlite never paid anybody. Don’t look at me, I’m still owed for 1971.',
    deedee:
      'Dee Dee: Ooh, old paperwork. My Aunt Bea would frame that. Then gossip about it.',
    'odette-ghost':
      'Odette: An unpaid invoice? Darling, that is not evidence. That is my business model.',
    nico: 'Norb: Carbon paper stains. Read it to me from over there.',
  },
}

const NARRATOR_TAKE =
  'Iris reaches for it. Norb clears his throat at a frequency only guilty assistants can hear.'

function copy(state: CaseState): CaseState {
  return {
    ...state,
    flags: [...state.flags],
    evidence: [...state.evidence],
    topics: [...state.topics],
    inventory: [...state.inventory],
    asked: [...state.asked],
    transcript: [...state.transcript],
    gratitude: { ...state.gratitude },
    filed: state.filed ? [...state.filed] : state.filed,
  }
}
function add(list: string[], value: string): void {
  if (!list.includes(value)) list.push(value)
}
function drop(list: string[], value: string): void {
  const index = list.indexOf(value)
  if (index >= 0) list.splice(index, 1)
}
function has(state: CaseState, value: string): boolean {
  return (
    state.evidence.includes(value) ||
    state.flags.includes(value) ||
    state.inventory.includes(value)
  )
}
function done(state: CaseState, line: string): CaseResult {
  return {
    state: { ...state, transcript: [...state.transcript, line] },
    line,
    changed: true,
  }
}
function refuse(state: CaseState, line: string): CaseResult {
  return { state, line, changed: false }
}
function thankFrancesca(state: CaseState): void {
  const max = CHAPTER_TWO_GRACES.francesca!.max
  state.gratitude.francesca = Math.min(
    max,
    (state.gratitude.francesca ?? 0) + 1,
  )
}

/** Any Chapter Two clue the ghosts can react to. */
function hasStarliteFindings(state: CaseState): boolean {
  return [
    'reel-1964',
    'prop-invoice',
    'sleeve-face',
    'five-blueprint',
    'merch-license',
  ].some((clue) => state.evidence.includes(clue))
}

/** Topics that open whenever a Chapter Two clue lands in the notebook. */
function noteFindings(state: CaseState): void {
  if (hasStarliteFindings(state)) add(state.topics, 'starlite-findings')
  if (state.evidence.includes('sleeve-face'))
    add(state.topics, 'scratched-sleeve')
  if (state.evidence.includes('reel-1964')) add(state.topics, 'reel-1964')
}

function finish(state: CaseState, line: string): CaseResult {
  noteFindings(state)
  return done(state, line)
}

/**
 * Chapter Two answers to Ask. Returns null for a target/topic pair this
 * chapter does not own, so the Chapter One interview can answer instead.
 */
export function chapterTwoInterview(
  state: CaseState,
  next: CaseState,
  target: string,
  topic: string,
): CaseResult | null {
  const iris = state.actor === 'iris'
  switch (target + ':' + topic) {
    case 'clem:reel-1964': {
      if (has(next, 'reel-can') || has(next, 'reel-running'))
        return finish(
          next,
          'Clem: That’s the one. Nobody’s run her since the sponsor pulled the picture in ’64. Put her on the projector, gentle, and I’ll show you why.',
        )
      add(next.inventory, 'reel-can')
      add(next.flags, 'reel-can-taken')
      return finish(
        next,
        'Clem: The ’64 reel? Middle shelf, the can with the tape. Nobody’s run her since the sponsor pulled the picture. He lifts it down and hands it to Iris like a newborn. Thread her on the projector and I’ll show you why.',
      )
    }
    case 'clem:starlite-office':
      add(next.flags, 'office-access')
      return finish(
        next,
        iris
          ? 'Clem: The office behind the screen? Starlite went bust in ’65 and nobody cleaned out the desk. Gate’s round the gravel path. He unhooks a key from a nail. Bring it back. And don’t touch the safe, it bites.'
          : 'Clem: I’ll give the key to the lady, pal. You asked if I’d sterilised it.',
      )
    case 'clem:francesca':
      add(next.flags, 'bolt-street-lead')
      return finish(
        next,
        'Clem: Stein? The stitched gal with the beehive. Built every prop in those pictures, then the sponsor cut her before the record came out. She runs a midnight picture house on Bolt Street now. Science pictures. Good ones.',
      )
    case 'clem:beach-hex-1964':
      add(next.topics, 'francesca')
      return finish(
        next,
        'Clem: They shot the beach scenes right out there, summer of ’64. I was sixteen, threading reels. Everybody remembers the girls on the poster. Nobody remembers who made the props.',
      )
    case 'clem:iris-neck':
      return finish(
        next,
        'Clem: That a bite? We had a fella at the Starlite in ’72 who only came to the vampire pictures. Never bought popcorn. Never left before dawn. Iris: He works nights. Clem: That’s what we said about Gerald.',
      )
    case 'deedee:scratched-sleeve':
      add(next.evidence, 'sleeve-face')
      add(next.topics, 'francesca')
      return finish(
        next,
        'Dee Dee: Oh, that’s an ORIGINAL pressing, hon. My Aunt Bea worked the press in ’64. The sponsor made them scratch one girl off every sleeve by hand. The stitched one with the beehive, lightning streaks and all. Took her a week. She said the girl looked smarter than the sponsor, and that was the problem.',
      )
    case 'deedee:starlite-office':
      add(next.flags, 'office-access')
      return finish(
        next,
        'Dee Dee: Behind the screen? Third plank left of the gate is loose. Not that I’d know. Not that I take my break back there. Clem yells.',
      )
    case 'deedee:francesca':
      add(next.flags, 'bolt-street-lead')
      return finish(
        next,
        'Dee Dee: Dr. Stein? Comes in for clam rolls every full moon. Bolt Street, the little picture house with the lightning sign. She tips in vacuum tubes. I have a drawer of them.',
      )
    case 'deedee:iris-neck':
      return finish(
        next,
        'Dee Dee: Hon, I’m a bat. I know a bite when I see one. Is he cute? Is he pale? Does he hate garlic? Iris: Yes, yes and he says he’s allergic. Dee Dee: Mm-HM.',
      )
    case 'deedee:iris-tattoo':
      return finish(
        next,
        'Dee Dee: Is that the Monstrique logo on your back? I have the same one! On a wing. Iris: Midnight High? Dee Dee: Class of ’19! Go Gargoyles!',
      )
    case 'francesca:hexblades': {
      const missing = missingChapterTwoClues(next)
      if (missing.length) {
        const list =
          missing.length === 1
            ? missing[0]!
            : missing.slice(0, -1).join(', ') + ' and ' + missing.at(-1)!
        return refuse(
          state,
          'Francesca: You walk into my lab with gossip and a germophobe. Bring me proof I was ever there. Norb: We still need ' +
            list +
            '.',
        )
      }
      next.ending = CHAPTER_TWO_ENDING
      add(next.flags, 'chapter-two-filed')
      add(next.topics, 'hexblades')
      return done(
        next,
        has(next, 'pommel-five')
          ? 'Francesca: The reel, the invoice and my own scratched face. Fine. Sit. Not there, that’s live. They cut me for being too much science, but I had already made the props. I made five knives. Four went on the poster. The fifth went to a girl nobody ever photographed, and I never saw it again. Norb: And Violet saw a 5 on the pommel of the one in Room 205. Chapter Two is filed, Iris. Tomorrow we find the girl nobody photographed.'
          : 'Francesca: The reel, the invoice and my own scratched face. Fine. Sit. Not there, that’s live. They cut me for being too much science, but I had already made the props. I made five knives. Four went on the poster. The fifth went to a girl nobody ever photographed, and I never saw it again. Norb: Then the knife in Room 205 has four sisters and one stranger. Chapter Two is filed, Iris.',
      )
    }
    case 'francesca:merch-royalties':
      add(next.evidence, 'merch-license')
      add(next.flags, 'grudge-heard')
      return finish(
        next,
        'Francesca: In 1999 Odette Harker sold my drawings as letter openers. Official Hexblade replicas, twenty-nine ninety-five. I sent forty lawyer’s letters. She sent one fruit basket. I would have killed her for the fruit basket alone. Norb: Please do not say that to a journalist. Francesca: I am saying it to you. You are a blog.',
      )
    case 'francesca:scratched-sleeve':
      return finish(
        next,
        'Francesca: They scratched me off with a nail file, one sleeve at a time. Sixty years later I still feel it in my stitches. The remaster finished the job and took my credit too.',
      )
    case 'francesca:reel-1964':
      return finish(
        next,
        'Francesca: Clem kept the reel? Bless him, he keeps everything. That was the last day they let me on the sand. I handed out my knives and the sponsor said, very kindly, that science was not what the boys came to the beach for.',
      )
    case 'francesca:iris-neck':
      return finish(
        next,
        'Francesca: Two punctures, three centimetres apart, healing nicely. Iris: New boyfriend. Real necker. Francesca: Tell him to sterilise. I say that to all the boys with fangs.',
      )
    case 'odette-ghost:harker-file-two':
      add(next.evidence, 'harker-file-2')
      add(next.flags, 'bolt-street-lead')
      return finish(
        next,
        iris
          ? 'Odette: File Two, darling: the Hexblade replicas. Francesca Stein’s drawings, my licence, and forty letters from her lawyer on Bolt Street. I kept every one. I framed my favourite. Violet: She did. It’s over the toilet at her office.'
          : 'Odette: File Two, little man. Replica knives, a stitched woman’s drawings and her lawyer’s letters from Bolt Street. Don’t pull that face. Royalties are a love language.',
      )
    case 'odette-ghost:starlite-findings':
      if (has(next, 'prop-invoice'))
        return finish(
          next,
          'Odette: I never signed that invoice, darling. I inherited it. Inheriting is not a crime. Violet: Selling it is a business model. Odette: Thank you, Violet, that is exactly what I meant.',
        )
      return finish(
        next,
        'Odette: A 1964 reel? I own the rights to that, darling. Probably. I own the rights to most things that flicker.',
      )
    case 'odette-ghost:merch-royalties':
      return finish(
        next,
        'Odette: Royalties are a feeling, darling. Francesca felt very strongly about them. I felt rich. We were both very passionate women.',
      )
    case 'violet-ghost:starlite-findings':
      add(next.evidence, 'pommel-five')
      return finish(
        next,
        'Violet: Numbered knives? Funny. The one on the nightstand had a little 5 on the pommel. I noticed because I count things, honey. Exits, knives, tips. Odette: You count tips? Violet: I count the ones I never got.',
      )
    case 'nico:hexblades': {
      const missing = missingChapterTwoClues(next)
      return finish(
        next,
        missing.length
          ? 'Norb: A woman who built the knives will not discuss them with a blog on hearsay. We need ' +
              missing.join(', ') +
              '. Then we ask her who she made them for.'
          : 'Norb: The reel, the invoice and the sleeve. That is proof she was there and proof she was erased. Go and ask Francesca Stein about the Hexblades, Iris. From the doorway, in my case.',
      )
    }
    case 'nico:starlite-findings':
      return finish(
        next,
        'Norb: A props designer cut in 1964, her credit scratched off by hand and her drawings sold as letter openers in 1999. That is a motive with a filing system. It is not yet a murderer.',
      )
  }
  return null
}

const CHAPTER_TWO_HOTSPOTS = new Set(
  Object.values(CHAPTER_TWO_ROOMS).flatMap((room) =>
    room.hotspots.map((hotspot) => hotspot.id),
  ),
)

/** Chapter Two answers to Look, Take, Use, Photograph and Talk. */
export function chapterTwoVerb(
  state: CaseState,
  next: CaseState,
  verb: Verb,
  target: string,
): CaseResult | null {
  if (!CHAPTER_TWO_HOTSPOTS.has(target)) return null
  const iris = state.actor === 'iris'
  const running = has(state, 'reel-running')
  if (verb === 'look') {
    switch (target) {
      case 'starlite-screen':
        if (running) {
          add(next.topics, 'reel-1964')
          if (!iris) {
            add(next.evidence, 'reel-1964')
            return finish(
              next,
              'Norb: Count with me. Four starlets on the sand. Francesca Stein hands each a jewelled knife: one, two, three, four. Then she hands a fifth to someone just outside the frame, and the camera never turns. Somebody was in that picture who was never in that picture.',
            )
          }
          return finish(
            next,
            'Iris: The 1964 reel, forty feet high: surfboards, a rubber sea monster and a stitched woman with a beehive handing out jewelled knives. I should get this on film before the carbon burns out.',
          )
        }
        return finish(
          next,
          iris
            ? 'Iris: A beach-party picture on a loop: bonfire, surfboards, rubber sea monster. Somebody up in that booth still threads film by hand.'
            : 'Norb: The same reel, looped, for nobody. Whoever runs this booth runs it out of love, which is the least hygienic motive there is.',
        )
      case 'starlite-sign':
        return finish(
          next,
          'Iris: A neon shooting star that has been falling since 1958. Half the bulbs are out, so it reads STAR TE. Norb: Do not put that in the headline either.',
        )
      case 'speaker-post':
        return finish(
          next,
          'Iris: A clip-on speaker on a post, the old drive-in way. You hang it on your car window and pretend the movie is the reason you came.',
        )
      case 'convertible':
        return finish(
          next,
          'Iris: A rusty finned convertible, abandoned in the back row. The back seat has seen things. Norb: The back seat of a drive-in convertible is the most contaminated surface in America. I have read the literature.',
        )
      case 'gravel-path':
        return finish(
          next,
          has(state, 'office-access')
            ? 'Iris: The gate behind the screen is open now. The old Starlite Pictures office is through there.'
            : 'Iris: A gravel path behind the screen to a padlocked gate. Clem must have a key, and a carhop on her break always knows a way round.',
        )
      case 'clem':
        return finish(
          next,
          'Iris: Pompadour, bowling shirt, carpet slippers and a squint from sixty years of projector light. He’s holding a film reel like it might cry.',
        )
      case 'projector':
        return finish(
          next,
          running
            ? 'Iris: The 1964 reel is clattering through the gate. Out on the lot, the screen has changed pictures.'
            : 'Iris: A hulking carbon-arc projector, older than Clem and better maintained. Its twin is threading the beach-party loop.',
        )
      case 'reel-can':
        add(next.topics, 'reel-1964')
        return finish(
          next,
          has(state, 'reel-can') || running
            ? 'Iris: The rack has a gap where the 1964 can used to sit.'
            : 'Iris: One dented can stands apart on the middle shelf, masking tape on the lid: 1964 in red marker.',
        )
      case 'rewind-bench':
        return finish(
          next,
          'Iris: A rewind bench with hand cranks, a splicer and a little light box. You could read a reel frame by frame here, if you had one.',
        )
      case 'booth-schedules':
        add(next.topics, 'francesca')
        add(next.topics, 'beach-hex-1964')
        return finish(
          next,
          'Iris: Faded call sheets from 1964. BEACH HEX, DAY 12. Cast, crew, catering, and at the bottom, PROPS AND EFFECTS: F. STEIN. Somebody has drawn a little lightning bolt next to it.',
        )
      case 'deedee':
        return finish(
          next,
          'Iris: Lilac fur, bat ears, two tiny fangs and roller skates. She balances a tray of root-beer floats one-handed and has already clocked everything about us.',
        )
      case 'sleeve-case':
        add(next.topics, 'scratched-sleeve')
        if (!iris)
          return finish(
            next,
            'Norb: Somebody scratched that face away with a sharp point, not a solvent. Scratches have depth, and depth casts a shadow. Shoot it with the flash held low and sideways, Iris.',
          )
        return finish(
          next,
          'Iris: An original 1964 Beach Hex sleeve: four starlets on a moonlit beach beside a drive-in screen, and a fifth face at the end of the line scraped down to bare grey cardboard.',
        )
      case 'jukebox':
        return finish(
          next,
          'Iris: A chrome jukebox loaded with surf records. B7 is “Beach Hex (Remastered)”.',
        )
      case 'popcorn-machine':
        return finish(
          next,
          'Iris: Popcorn, glowing like a sacred relic. Norb: That butter has not been changed since the Nixon administration.',
        )
      case 'hotdog-cutout':
        return finish(
          next,
          'Iris: A cardboard hot dog doing the twist. He has the best attitude of anybody we’ve met this week.',
        )
      case 'invoice-spike':
        add(next.topics, 'hexblades')
        return finish(
          next,
          'Iris: A spike of yellowed carbon invoices. The top sheet curls up like it wants to be read: STARLITE PICTURES, BEACH HEX, PROPS.',
        )
      case 'filing-cabinet':
        return finish(
          next,
          'Iris: Grey cabinets, one drawer hanging open, stuffed with 1965 bankruptcy papers and the carbon copies of everything Starlite never paid.',
        )
      case 'prop-crate':
        return finish(
          next,
          'Iris: A papier-mache sea monster head, rubber tentacles, a striped surfboard and a coconut bra on a hook. Beach Hex had a budget, and the budget was this crate.',
        )
      case 'publicity-stills':
        add(next.topics, 'beach-hex-1964')
        return finish(
          next,
          'Iris: Publicity stills of surfers and monster starlets. On every group shot, someone has cropped the right-hand edge with scissors.',
        )
      case 'office-safe':
        return finish(
          next,
          has(state, 'merch-license')
            ? 'Iris: The safe hangs open. Empty except for a box of plastic letter openers.'
            : 'Iris: A squat iron safe with a four-digit dial. Clem says it bites. Everything here is stuck in one year.',
        )
      case 'ticket-window':
        return finish(
          next,
          'Iris: A brass ticket window with a bell and a card: RING FOR DR. STEIN. MIDNIGHT SHOW. IT IS ALWAYS MIDNIGHT.',
        )
      case 'tesla-jar':
        if (!iris)
          return finish(
            next,
            'Norb: The coil’s cable runs along the skirting board and under the curtain. Whoever built it will come running the moment it stops. I am not suggesting anything. I am observing.',
          )
        return finish(
          next,
          'Iris: A miniature Tesla coil crackling inside a glass bell jar, between the licorice and the glowing punch. Concessions with a lightning budget.',
        )
      case 'lobby-cards':
        return finish(
          next,
          'Iris: Giant ants, flying saucers, brains in jars, robots with ray guns. In the corner of every card, tiny print: PROPS BY F. STEIN.',
        )
      case 'midnight-curtain':
        return finish(
          next,
          has(state, 'lab-access')
            ? 'Iris: The curtains are drawn back. The lab is behind the screen.'
            : 'Iris: Heavy purple curtains and a velvet rope. A sign says MIDNIGHT SHOW. Somebody is working behind them; the lights dim every time something sparks.',
        )
      case 'francesca':
        return finish(
          next,
          'Iris: Pale green patchwork skin, neat stitches, neck bolts and a black beehive with white lightning streaks. Lab coat over a purple cocktail dress. She looks at us like we are a badly soldered joint.',
        )
      case 'five-blueprint':
        add(next.topics, 'hexblades')
        return finish(
          next,
          'Iris: A big faded blueprint: five ornate jewelled stage daggers drawn side by side, numbered one to five, signed F. STEIN 1964.',
        )
      case 'knife-case':
        add(next.topics, 'hexblades')
        return finish(
          next,
          'Iris: A walnut presentation case lined with red velvet. Five dagger-shaped hollows, all five empty.',
        )
      case 'robot-costume':
        return finish(
          next,
          'Iris: A half-built tin robot costume on an operating slab. It has better posture than Norb.',
        )
      case 'tesla-coil':
        return finish(
          next,
          'Iris: A Tesla coil taller than me, throwing blue arcs at the ceiling. Norb is standing behind the robot costume. For insulation, he says.',
        )
    }
    return null
  }
  if (verb === 'take') {
    if (target === 'reel-can') {
      if (has(state, 'reel-can') || running)
        return refuse(
          state,
          'Iris: Already got it. Clem is watching me like I’m carrying his firstborn.',
        )
      add(next.inventory, 'reel-can')
      add(next.flags, 'reel-can-taken')
      add(next.topics, 'reel-1964')
      return finish(
        next,
        'Iris pockets the 1964 can. Clem: HEY. ...Fine. Don’t drop her. She’s older than you and twice as flammable.',
      )
    }
    if (target === 'invoice-spike') {
      if (has(state, 'invoice-sheet') || has(state, 'invoice-returned'))
        return refuse(state, 'Iris: One stolen invoice per bankrupt studio.')
      add(next.inventory, 'invoice-sheet')
      add(next.topics, 'hexblades')
      return finish(
        next,
        'Iris slides the top invoice off the spike: FIVE (5) JEWELLED STAGE DAGGERS, DESIGN AND MANUFACTURE, F. STEIN. UNPAID. Somebody, somewhere, is still owed for this.',
      )
    }
    return refuse(state, NARRATOR_TAKE)
  }
  if (verb === 'photograph') {
    switch (target) {
      case 'starlite-screen':
        if (running) {
          add(next.evidence, 'reel-1964')
          return finish(
            next,
            'Iris shoots the 1964 reel off the screen, frame after frame. Francesca hands out four jewelled knives on the sand, then passes a fifth to someone outside the frame. Norb: The camera never turns. Somebody was in that picture who was never in that picture.',
          )
        }
        add(next.flags, 'starlite-shot')
        return finish(
          next,
          'Iris: Click. A rubber sea monster forty feet tall over an empty lot. Norb: A metaphor for our readership.',
        )
      case 'starlite-sign':
        add(next.flags, 'starlite-shot')
        return finish(
          next,
          'Iris: STAR TE, in pink neon, over the surf. Norb: Crop the missing letters. We are a serious publication.',
        )
      case 'reel-can':
        return finish(
          next,
          'Iris: One dented can, one strip of tape, one year. The can is evidence of a can. The film inside is the story.',
        )
      case 'booth-schedules':
        add(next.evidence, 'call-sheet')
        add(next.flags, 'bolt-street-lead')
        add(next.topics, 'francesca')
        return finish(
          next,
          'Iris: Call sheet, Beach Hex, day twelve. PROPS AND EFFECTS: F. STEIN, and a forwarding address on Bolt Street pencilled under it. Norb: A lead with a postcode. My favourite kind.',
        )
      case 'sleeve-case':
        add(next.evidence, 'sleeve-face')
        add(next.topics, 'francesca')
        return finish(
          next,
          'Iris kills the overheads and holds the flash low and sideways. In the raking light the scratches stop being scratches: a towering beehive, two neck bolts and a neat line of stitches. Norb: Lightning streaks in the hair. The face they scratched off the 1964 sleeve is Francesca Stein’s.',
        )
      case 'invoice-spike':
        add(next.evidence, 'prop-invoice')
        add(next.flags, 'bolt-street-lead')
        add(next.topics, 'hexblades')
        add(next.topics, 'francesca')
        return finish(
          next,
          'Iris photographs the top invoice on the spike: FIVE (5) JEWELLED STAGE DAGGERS, DESIGN AND MANUFACTURE, F. STEIN, BOLT STREET. UNPAID. Norb: Five, Iris. The shrine at the motel only ever held four.',
        )
      case 'filing-cabinet':
        add(next.evidence, 'prop-invoice')
        add(next.topics, 'hexblades')
        return finish(
          next,
          'Iris finds the carbon copy in the open drawer and photographs it: five jewelled stage daggers by F. Stein, stamped UNPAID and, in red, SPONSOR OBJECTS TO SCREEN CREDIT. Norb: Erased twice, then. Once on the sleeve, once in the ledger.',
        )
      case 'publicity-stills':
        add(next.topics, 'beach-hex-1964')
        return finish(
          next,
          'Iris: Every group still cropped on the right with scissors. Whoever stood there was cut out before the photos were even printed.',
        )
      case 'tesla-jar':
        return finish(
          next,
          'Iris: Click. The flash and the coil go off together and every bulb in the lobby blinks. Somewhere behind the curtain, someone swears in German.',
        )
      case 'lobby-cards':
        add(next.topics, 'francesca')
        return finish(
          next,
          'Iris: PROPS BY F. STEIN, on every card, in print so small you’d need a sleuth. Luckily we brought one.',
        )
      case 'five-blueprint':
        add(next.evidence, 'five-blueprint')
        add(next.topics, 'hexblades')
        return finish(
          next,
          'Iris photographs the blueprint: five Hexblades, numbered one to five, signed F. STEIN 1964. Norb: Numbered. Somebody planned for each knife to be told apart.',
        )
      case 'knife-case':
        add(next.evidence, 'empty-case')
        add(next.topics, 'hexblades')
        return finish(
          next,
          'Iris: Five velvet hollows, all empty, each one stencilled with a number. Francesca: Put that camera down or I will wire it to the coil.',
        )
    }
    return null
  }
  if (verb === 'talk') {
    switch (target) {
      case 'clem':
        add(next.flags, 'clem-met')
        add(next.topics, 'reel-1964')
        add(next.topics, 'starlite-office')
        add(next.topics, 'beach-hex-1964')
        add(next.topics, 'iris-neck')
        return finish(
          next,
          iris
            ? 'Clem: Booth’s closed to the public. You the public? You look like the public. Iris: We’re the press. Clem: Worse. Ask your questions and don’t touch the carbon rods.'
            : 'Clem: You’re the fella from the blog that won’t touch anything? Good. Neither will I, and I’ve been here since 1964.',
        )
      case 'deedee':
        add(next.flags, 'deedee-met')
        add(next.topics, 'scratched-sleeve')
        add(next.topics, 'starlite-office')
        add(next.topics, 'francesca')
        add(next.topics, 'iris-neck')
        add(next.topics, 'iris-tattoo')
        return finish(
          next,
          'Dee Dee: Welcome to the Starlite, hon! Clam roll? Root-beer float? Gossip? The gossip’s free and it’s the only thing here that’s fresh.',
        )
      case 'francesca':
        add(next.flags, 'francesca-met')
        add(next.topics, 'hexblades')
        add(next.topics, 'merch-royalties')
        add(next.topics, 'iris-neck')
        return finish(
          next,
          iris
            ? 'Francesca: You are standing on my good cable. Odette Harker’s detectives? Odette Harker is dead. I read it twice to be sure. Ask your questions, and touch nothing that hums.'
            : 'Francesca: A man in two pairs of gloves. Finally, a visitor who respects a laboratory.',
        )
    }
    return null
  }
  if (verb === 'use') {
    switch (target) {
      case 'speaker-post':
        if (running) {
          add(next.topics, 'hexblades')
          return finish(
            next,
            'Iris hangs the speaker on her shoulder. Surf guitar, waves, and a woman’s voice on the 1964 soundtrack: “Careful, girls, they’re sharp. I made them that way.”',
          )
        }
        return finish(
          next,
          'Iris holds the speaker to her ear: surf guitar, a scream and a cash register, on a loop since 1979.',
        )
      case 'convertible':
        add(next.flags, 'back-seat')
        return finish(
          next,
          'Iris climbs into the back seat and pats the cracked leather. Iris: Drive-in, back row, a convertible. Boss, this is the most romantic crime scene we’ve ever had. Norb: I am waiting by the speaker post. The speaker post has been disinfected by sixty years of salt air.',
        )
      case 'gravel-path':
        return finish(
          next,
          has(state, 'office-access')
            ? 'Iris: The gate’s open. The Starlite office is on the map now.'
            : 'Iris rattles the gate. Padlocked. Somebody with keys, or somebody with gossip, could get her through.',
        )
      case 'projector':
        return refuse(
          state,
          running
            ? 'Clem: She’s running. Don’t touch her while she’s running.'
            : 'Clem: Hands off my baby. You want something run, bring me a can.',
        )
      case 'rewind-bench':
        return refuse(
          state,
          'Iris: A crank, a splicer and a light box. All I need is a reel to crank.',
        )
      case 'sleeve-case':
        return refuse(
          state,
          'Iris tries the case. Locked. Dee Dee: That’s Aunt Bea’s sleeve, hon. Look all you like. Touch it and I’ll bite you.',
        )
      case 'jukebox':
        add(next.evidence, 'remaster-credit')
        return finish(
          next,
          'Iris punches B7. “Beach Hex (Remastered)” crackles out, and the title card reads: REMASTERED 2004, PRODUCTION: HARKER LICENSING. The 1964 props credit is gone. Norb: Erased three times. She is becoming a pattern.',
        )
      case 'popcorn-machine':
        return finish(
          next,
          'Iris helps herself to a fistful of popcorn. Dee Dee: That’ll be a dollar. Iris: Put it on the blog. Norb: The blog does not have an expense account. The blog has me.',
        )
      case 'prop-crate':
        return finish(
          next,
          'Iris tries on the papier-mache sea monster head. Norb: Remove that at once. It has been worn by sixty years of sweating extras. Iris: Rawr. Norb: I am leaving.',
        )
      case 'office-safe':
        if (has(state, 'merch-license'))
          return refuse(state, 'Iris: Already open. Already empty.')
        if (
          !['reel-1964', 'prop-invoice', 'sleeve-face', 'call-sheet'].some(
            (clue) => has(state, clue),
          )
        )
          return refuse(
            state,
            'Iris spins the dial. Nothing. Norb: A four-digit combination, in a place that never got over one particular year. Find out which year first.',
          )
        add(next.evidence, 'merch-license')
        return finish(
          next,
          'Iris dials 1-9-6-4. The safe clunks open: the Starlite design rights, sold in 1999 to Harker Licensing, and a box of plastic Hexblade letter openers. AFTER DRAWINGS BY F. STEIN, says the box. NO ROYALTY, says the contract.',
        )
      case 'ticket-window':
        if (has(state, 'lab-access'))
          return refuse(
            state,
            'Iris rings again. Francesca, from behind the screen: You have tickets. Use them.',
          )
        add(next.flags, 'lab-access')
        return finish(
          next,
          'Iris rings the bell. A stitched green hand slides out two tickets and a pamphlet on electrical safety. A voice: Midnight show. If you are from the papers, backstage is through the curtain. You smell like the papers.',
        )
      case 'tesla-jar':
        if (has(state, 'lab-access'))
          return refuse(
            state,
            'Francesca, from behind the curtain: Touch my coil again and I will put you in a jar.',
          )
        add(next.flags, 'lab-access')
        return finish(
          next,
          'Iris lifts the bell jar and the coil sputters out. Thirty seconds later the curtains fly apart. Francesca: WHO is touching my coil? ...Fine. Come through. Touch nothing else.',
        )
      case 'midnight-curtain':
        return finish(
          next,
          has(state, 'lab-access')
            ? 'Iris holds the curtain for Norb, who goes through it sideways so it cannot touch him. The lab is on the map now.'
            : 'Iris lifts the velvet rope. A sign swings round: TICKETS, OR A VERY GOOD REASON. Ring the window, or make somebody come out.',
        )
      case 'robot-costume':
        return finish(
          next,
          'Iris knocks on the tin robot. It knocks back. Francesca: That one is a prototype. Do not encourage it.',
        )
      case 'tesla-coil':
        return finish(
          next,
          'Iris reaches toward the arc. Francesca slaps her hand away without looking up. Francesca: I lost a sister act that way. Metaphorically.',
        )
    }
    return null
  }
  return null
}

/** Using an inventory item on a Chapter Two hotspot. */
export function chapterTwoItem(
  state: CaseState,
  next: CaseState,
  item: string,
  target: string,
): CaseResult | null {
  if (item === 'reel-can' && (target === 'projector' || target === 'clem')) {
    drop(next.inventory, 'reel-can')
    add(next.flags, 'reel-running')
    add(next.topics, 'reel-1964')
    return finish(
      next,
      'Clem threads the 1964 reel with shaking hands and strikes the arc. The beam changes colour. Clem: Sixty years, and she still runs sweet. Go look at the screen, kid. That’s the day they cut her.',
    )
  }
  if (item === 'reel-can' && target === 'rewind-bench') {
    if (has(state, 'reel-1964'))
      return refuse(
        state,
        'Iris already has the frames she needs. Clem: Stop cranking my reel, kid.',
      )
    add(next.evidence, 'reel-1964')
    return finish(
      next,
      'Iris cranks the 1964 reel across the light box, frame by frame. Four starlets on the sand. A stitched woman with a beehive hands out jewelled knives: one, two, three, four. Then a fifth, passed off the edge of the frame to someone the camera never caught. Iris photographs every frame.',
    )
  }
  if (item === 'invoice-sheet' && target === 'francesca') {
    drop(next.inventory, 'invoice-sheet')
    add(next.flags, 'invoice-returned')
    add(next.evidence, 'prop-invoice')
    add(next.topics, 'hexblades')
    thankFrancesca(next)
    return finish(
      next,
      'Francesca reads her own handwriting for a long moment. Francesca: Sixty years, and nobody paid it. But somebody finally kept it. She pins the invoice beside the blueprint. Thank you. Ask me about the knives when you have the rest.',
    )
  }
  const joke = CHAPTER_TWO_WRONG_ITEM[item]?.[target]
  if (joke) return refuse(state, joke)
  return null
}

/** Combining two pocket items; null when Chapter Two has nothing to say. */
export function chapterTwoCombine(
  state: CaseState,
  first: string,
  second: string,
): CaseResult | null {
  const pair = [first, second].sort().join('+')
  if (pair === 'camera+invoice-sheet') {
    if (has(state, 'prop-invoice'))
      return refuse(state, 'Iris already has the invoice on film.')
    const next = copy(state)
    add(next.evidence, 'prop-invoice')
    add(next.flags, 'bolt-street-lead')
    add(next.topics, 'hexblades')
    return finish(
      next,
      'Iris photographs the invoice against her colour card: five jewelled stage daggers, F. Stein, Bolt Street, unpaid. Norb: Five. The shrine only ever held four.',
    )
  }
  if (pair === 'camera+reel-can')
    return refuse(
      state,
      'Iris photographs the closed can. Norb: A picture of a box of pictures. Open it on the rewind bench, or give it to the projectionist.',
    )
  if (pair === 'invoice-sheet+reel-can')
    return refuse(
      state,
      'Iris tucks the invoice into the film can. Norb: You have invented a filing cabinet. It is worse than the old one.',
    )
  return null
}

/** Flirting with the Chapter Two cast (mature edition only). */
export function chapterTwoFlirt(
  state: CaseState,
  next: CaseState,
  target: string,
): CaseResult | null {
  if (target === 'francesca') {
    const level = next.gratitude.francesca ?? 0
    if (level >= 1 && !has(next, 'francesca-spark')) {
      add(next.flags, 'francesca-spark')
      return done(
        next,
        'Francesca: You kept my invoice. Come here, then. She pulls her goggles down and kisses Iris like she is testing a circuit. Every Tesla coil in the lab arcs at once, the lights blow, and in the dark Norb says, very clearly, I am standing inside the robot costume.',
      )
    }
    if (level >= 1)
      return done(
        next,
        'Francesca: Again? My fuses cost money, Miss Quill. Come back after the midnight show.',
      )
    return done(
      next,
      'Francesca: I have been reassembled four times and courted by two of the Universal monsters. You will need more than eyelashes.',
    )
  }
  const lines: Record<string, string> = {
    clem: 'Clem: Kid, I’ve been married to that projector since 1964. She’s jealous, and she runs at three thousand degrees.',
    deedee:
      'Dee Dee: Hon, I’m flattered, but I date strictly nocturnal. Come back when you can hang upside down.',
  }
  return lines[target] ? done(next, lines[target]!) : null
}

/** What Norb says when Iris tries to reach a Chapter Two room too soon. */
export const CHAPTER_TWO_LOCKED: Record<ChapterTwoRoomId, string> = {
  'drive-in':
    'Norb: The drive-in is a later lead. Tonight we follow the one we have earned.',
  'projection-booth': 'Norb: First the drive-in, Iris.',
  'snack-bar': 'Norb: First the drive-in, Iris.',
  'starlite-office':
    'Iris: The gate behind the screen is padlocked. Clem has keys, and Dee Dee knows a way round.',
  'science-cinema':
    'Norb: We do not have an address for Francesca Stein yet. Somebody at the drive-in will.',
  'francesca-lab':
    'Iris: Velvet rope, MIDNIGHT SHOW. We need a ticket, or a reason for somebody to come out.',
}

/** The flag each Chapter Two room needs, beyond being in Chapter Two. */
export const CHAPTER_TWO_GATES: Record<
  ChapterTwoRoomId,
  { flag: string; fallback: string }
> = {
  'drive-in': { flag: 'beach-lead', fallback: 'city-map' },
  'projection-booth': { flag: 'beach-lead', fallback: 'drive-in' },
  'snack-bar': { flag: 'beach-lead', fallback: 'drive-in' },
  'starlite-office': { flag: 'office-access', fallback: 'drive-in' },
  'science-cinema': { flag: 'bolt-street-lead', fallback: 'city-map' },
  'francesca-lab': { flag: 'lab-access', fallback: 'science-cinema' },
}

export function isChapterTwoRoom(room: string): room is ChapterTwoRoomId {
  return (CHAPTER_TWO_ROOM_IDS as readonly string[]).includes(room)
}
