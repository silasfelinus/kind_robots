export type BrainstormRiffFlavor = 'list' | 'persona' | 'yes-but' | 'crossover'

export type BrainstormRiffFlavorInfo = {
  id: BrainstormRiffFlavor
  label: string
  icon: string
  blurb: string
  titlePlaceholder: string
  stemPlaceholder: string
  stemHint: string
}

export const BRAINSTORM_RIFF_FLAVORS: BrainstormRiffFlavorInfo[] = [
  {
    id: 'list',
    label: 'Top of the List',
    icon: '🍦',
    blurb: 'Name a category. Everyone piles on.',
    titlePlaceholder: 'Terrible ice cream flavors',
    stemPlaceholder: '',
    stemHint: 'Every answer is one item on the list.',
  },
  {
    id: 'persona',
    label: 'Who Is This Person',
    icon: '🎩',
    blurb: 'Invent a person. Everyone adds a fact.',
    titlePlaceholder: 'Vanderbuilt Lacrosse',
    stemPlaceholder: 'Vanderbuilt Lacrosse',
    stemHint: 'Every answer finishes a sentence about them.',
  },
  {
    id: 'yes-but',
    label: 'Yes, But',
    icon: '🙃',
    blurb: 'Start nice. Swerve hard.',
    titlePlaceholder: 'I like Obama, but…',
    stemPlaceholder: "I don't like how he",
    stemHint: 'Every answer finishes the swerve.',
  },
  {
    id: 'crossover',
    label: 'Crossover',
    icon: '🤝',
    blurb: 'Two characters. One shared truth.',
    titlePlaceholder: 'Trashcan Jones × Vanderbuilt Lacrosse',
    stemPlaceholder: 'Neither Trashcan Jones nor Vanderbuilt Lacrosse',
    stemHint: 'Every answer is true of all of them.',
  },
]

export const BRAINSTORM_RIFF_LIMITS = {
  title: 160,
  stem: 240,
  vibe: 600,
  line: 600,
  authorName: 60,
  spark: 240,
} as const

export type BrainstormRiffStarter = {
  key: string
  flavor: BrainstormRiffFlavor
  title: string
  stem?: string
  vibe: string
  crossoverKeys?: string[]
  lines: string[]
}

export const BRAINSTORM_ORIGINAL_TABLE = 'The original table'

export const BRAINSTORM_RIFF_STARTERS: BrainstormRiffStarter[] = [
  {
    key: 'vanderbuilt-lacrosse',
    flavor: 'persona',
    title: 'Vanderbuilt Lacrosse',
    stem: 'Vanderbuilt Lacrosse',
    vibe: 'An absurdly, cosmically wealthy man.',
    lines: [
      'owns a time share on Venus.',
      "once got a unicorn for his birthday but returned it because he didn't like the color.",
    ],
  },
  {
    key: 'trashcan-jones',
    flavor: 'persona',
    title: 'Trashcan Jones',
    stem: 'Trashcan Jones',
    vibe: "Vanderbuilt's brother. He has nothing and makes it work.",
    lines: ["has a cardboard box he sleeps in when he's feeling fancy."],
  },
  {
    key: 'robert-smith',
    flavor: 'persona',
    title: 'Robert Smith',
    stem: 'Robert Smith',
    vibe: 'The most normal person in the world.',
    lines: [
      'has 2.3 children.',
      'has one gay black friend.',
      '\'s favorite song is "Macarena".',
    ],
  },
  {
    key: 'jones-lacrosse-crossover',
    flavor: 'crossover',
    title: 'Trashcan Jones × Vanderbuilt Lacrosse',
    stem: 'Neither Trashcan Jones nor Vanderbuilt Lacrosse',
    vibe: 'Rare crossovers: one fact that is true of both brothers.',
    crossoverKeys: ['trashcan-jones', 'vanderbuilt-lacrosse'],
    lines: ['has ever paid income tax.'],
  },
  {
    key: 'terrible-ice-cream',
    flavor: 'list',
    title: 'Terrible ice cream flavors',
    vibe: 'Flavors no shop should ever scoop.',
    lines: ['Uncooked bacon swirl', 'Broken glass'],
  },
  {
    key: 'i-like-obama-but',
    flavor: 'yes-but',
    title: 'I like Obama, but…',
    stem: "I don't like how he",
    vibe: 'Blame him for things he obviously never did. The more impossible, the better.',
    lines: [
      'killed all those women of the night in 1800s London.',
      'flew that second plane into the twin towers.',
      'created global warming.',
    ],
  },
  {
    key: 'captain-overreaction',
    flavor: 'persona',
    title: 'Captain Overreaction',
    stem: 'Captain Overreaction',
    vibe: 'Treats every tiny thing like a five-alarm emergency.',
    lines: [],
  },
  {
    key: 'grandma-thunderbolt',
    flavor: 'persona',
    title: 'Grandma Thunderbolt',
    stem: 'Grandma Thunderbolt',
    vibe: 'The most extreme grandmother alive. Knits at 90 miles per hour.',
    lines: [],
  },
  {
    key: 'useless-superpowers',
    flavor: 'list',
    title: 'Superpowers nobody wants',
    vibe: 'Technically powers. Practically curses.',
    lines: [],
  },
  {
    key: 'rejected-olympic-sports',
    flavor: 'list',
    title: 'Rejected Olympic sports',
    vibe: 'Pitched to the committee. Laughed out of the room.',
    lines: [],
  },
  {
    key: 'threatening-fortunes',
    flavor: 'list',
    title: 'Fortune cookie fortunes that are just threats',
    vibe: 'Crack it open. Regret it.',
    lines: [],
  },
  {
    key: 'i-love-puppies-but',
    flavor: 'yes-but',
    title: 'I love puppies, but…',
    stem: "I don't love how they",
    vibe: 'Frame the goodest boys for crimes against humanity.',
    lines: [],
  },
]

export type BrainstormLineReaction = 'LOVED' | 'CLAPPED' | 'BOOED'
export type BrainstormLineReactionWithFlag = BrainstormLineReaction | 'FLAGGED'

export const BRAINSTORM_LINE_REACTIONS: Array<{
  type: BrainstormLineReaction
  icon: string
  label: string
  points: number
}> = [
  { type: 'LOVED', icon: '❤️', label: 'Love it', points: 3 },
  { type: 'CLAPPED', icon: '😂', label: 'LOL', points: 2 },
  { type: 'BOOED', icon: '🍅', label: 'Groan', points: 1 },
]

export const BRAINSTORM_FLAGS_TO_HIDE = 3

export type BrainstormReactionCounts = Record<
  BrainstormLineReactionWithFlag,
  number
>

export function emptyReactionCounts(): BrainstormReactionCounts {
  return { LOVED: 0, CLAPPED: 0, BOOED: 0, FLAGGED: 0 }
}

export function isBrainstormLineReaction(
  value: unknown,
): value is BrainstormLineReactionWithFlag {
  return (
    value === 'LOVED' ||
    value === 'CLAPPED' ||
    value === 'BOOED' ||
    value === 'FLAGGED'
  )
}

export function reactionPoints(counts: BrainstormReactionCounts): number {
  return BRAINSTORM_LINE_REACTIONS.reduce(
    (total, entry) => total + entry.points * (counts[entry.type] ?? 0),
    0,
  )
}

export function lineHeat(
  counts: BrainstormReactionCounts,
  createdAt: Date | string,
  now: Date = new Date(),
): number {
  const ageHours = Math.max(
    0,
    (now.getTime() - new Date(createdAt).getTime()) / 3_600_000,
  )
  return (1 + reactionPoints(counts)) / Math.pow(ageHours + 2, 1.2)
}

export type BrainstormLineSort = 'hot' | 'top' | 'new'

export function sortLines<
  T extends {
    counts: BrainstormReactionCounts
    createdAt: Date | string
    id: number
  },
>(lines: T[], sort: BrainstormLineSort, now: Date = new Date()): T[] {
  const copy = [...lines]
  const newest = (a: T, b: T) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ||
    b.id - a.id
  if (sort === 'new') return copy.sort(newest)
  if (sort === 'top') {
    return copy.sort(
      (a, b) =>
        reactionPoints(b.counts) - reactionPoints(a.counts) || newest(a, b),
    )
  }
  return copy.sort(
    (a, b) =>
      lineHeat(b.counts, b.createdAt, now) -
        lineHeat(a.counts, a.createdAt, now) || newest(a, b),
  )
}

export function cleanRiffText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

export function normalizeRiffFlavor(value: unknown): BrainstormRiffFlavor {
  return BRAINSTORM_RIFF_FLAVORS.some((entry) => entry.id === value)
    ? (value as BrainstormRiffFlavor)
    : 'list'
}

function stripTrailingEllipsis(text: string): string {
  return text.replace(/\s*(?:…|\.{2,})\s*$/, '').trim()
}

export function fullLineText(
  riff: { stem?: string | null },
  text: string,
): string {
  const stem = stripTrailingEllipsis(cleanRiffText(riff.stem, 240))
  const body = cleanRiffText(text, 600)
  if (!stem) return body
  const rest = body.replace(/^\.{3}|^…/, '').trim()
  return /^['’]s\b/.test(rest) ? `${stem}${rest}` : `${stem} ${rest}`
}

export function buildLineArtPrompt(
  riff: { title: string; flavor: string; stem?: string | null },
  text: string,
): string {
  const line = stripTrailingEllipsis(fullLineText(riff, text)).replace(
    /[.!?]+$/,
    '',
  )
  const topic = stripTrailingEllipsis(cleanRiffText(riff.title, 160))
  const scene =
    riff.flavor === 'list'
      ? `${line}, pictured as one of the ${topic.toLowerCase()}`
      : line
  return [
    `A playful, brightly colored storybook illustration of this joke: ${scene}.`,
    'Expressive cartoon faces, comic timing, bold saturated colors, soft painterly lighting, wide shot with room around the subject.',
    'Every surface bare and unmarked.',
  ].join(' ')
}

export const BRAINSTORM_SPARK_COUNT = 4

export function buildCoachRequest(input: {
  riff: {
    title: string
    flavor: string
    stem?: string | null
    vibe?: string | null
  }
  favorites: string[]
  recent: string[]
}): { premise: string; constraints: string; count: number } {
  const flavor =
    BRAINSTORM_RIFF_FLAVORS.find((entry) => entry.id === input.riff.flavor) ??
    BRAINSTORM_RIFF_FLAVORS[0]
  const stem = stripTrailingEllipsis(cleanRiffText(input.riff.stem, 240))
  const premiseLines = [
    `A group of humans is playing an improv party game: "${cleanRiffText(input.riff.title, 160)}".`,
    `Game style: ${flavor.label}. ${flavor.blurb} ${flavor.stemHint}`,
    stem ? `Every answer finishes the sentence: "${stem} ___".` : '',
    input.riff.vibe ? `Vibe: ${cleanRiffText(input.riff.vibe, 600)}` : '',
    input.favorites.length
      ? `The table's favorite answers so far (rated highest): ${input.favorites
          .slice(0, 6)
          .map((line) => `"${line}"`)
          .join('; ')}.`
      : '',
    input.recent.length
      ? `Already said (do not repeat or rephrase): ${input.recent
          .slice(0, 20)
          .map((line) => `"${line}"`)
          .join('; ')}.`
      : '',
    'You are the table coach, not a player. Your job is to help a stuck human find their OWN next answer.',
  ].filter(Boolean)

  const constraints = [
    'Each candidate is a SPARK for a human, never a finished answer or joke.',
    'title: a 1-4 word angle to explore, like "His pets", "Tax season" or "Childhood trauma".',
    'text: one short provocative question or nudge (under 20 words) that points at an unexplored corner of the premise and leaves the punchline for the human.',
    'Steer toward the kind of answers the table rated highest, but into territory nobody has covered.',
    'Make every spark point somewhere different.',
  ].join(' ')

  return {
    premise: premiseLines.join('\n'),
    constraints,
    count: BRAINSTORM_SPARK_COUNT,
  }
}

export const BRAINSTORM_CHEERS = [
  'Oh no. Oh YES.',
  'That one is going on the fridge.',
  'The table felt that.',
  'Bold. Unhinged. Correct.',
  'Somebody screenshot this.',
  'You can not take that back. Good.',
  'Escalate! The table demands more.',
  'Instant classic.',
]

export function pickCheer(seed: number): string {
  const index = Math.abs(Math.floor(seed)) % BRAINSTORM_CHEERS.length
  return BRAINSTORM_CHEERS[index] ?? BRAINSTORM_CHEERS[0]!
}

export function parseCrossoverIds(value: string | null | undefined): number[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((entry) => Number(entry))
      .filter((entry) => Number.isInteger(entry) && entry > 0)
      .slice(0, 4)
  } catch {
    return []
  }
}
