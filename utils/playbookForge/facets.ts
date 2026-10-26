import type { AdditionKind } from './adjust'

// Kind Robots Facets as design material. GENRE Facets widen the genre shelf
// (each one starts from the loadout of the playbook closest to it); the other
// taxonomies are dealt as sparks into the slots a design needs, so a pitch
// arrives with a tone, a world, a question, a cast and a look already named.
// The same pools draw named elements for an existing game's ledger.

/** The fields of a Facet catalog entry the forge reads. */
export type FacetCard = {
  id: number
  title: string
  taxonomy: string
  description: string | null
  flavorText: string | null
  artPrompt: string | null
  imagePath: string | null
  randomWeight: number
  isRandomizable: boolean
}

export type SparkSlot =
  | 'tone'
  | 'world'
  | 'question'
  | 'hero'
  | 'companion'
  | 'quirk'
  | 'villain'
  | 'artifact'
  | 'look'

export const SPARK_SLOTS: {
  id: SparkSlot
  label: string
  taxonomies: string[]
  feeds: string
}[] = [
  {
    id: 'tone',
    label: 'Tone',
    taxonomies: ['MOOD'],
    feeds: 'How every scene and ending reads',
  },
  {
    id: 'world',
    label: 'World',
    taxonomies: ['SETTING'],
    feeds: 'Where it happens: the map and its places',
  },
  {
    id: 'question',
    label: 'Question',
    taxonomies: ['THEME'],
    feeds: 'What the endings argue about',
  },
  {
    id: 'hero',
    label: 'Hero',
    taxonomies: ['ARCHETYPE', 'ROLE'],
    feeds: 'Who you play',
  },
  {
    id: 'companion',
    label: 'Companion',
    taxonomies: ['OCCUPATION', 'SPECIES'],
    feeds: 'Who travels with you',
  },
  {
    id: 'quirk',
    label: 'Quirk',
    taxonomies: ['QUIRK', 'PERSONALITY'],
    feeds: 'What makes the cast memorable',
  },
  {
    id: 'villain',
    label: 'Villain',
    taxonomies: ['BACKSTORY', 'ALIGNMENT'],
    feeds: 'What the villain wants',
  },
  {
    id: 'artifact',
    label: 'Artifact',
    taxonomies: ['MATERIAL'],
    feeds: 'The thing everyone is after',
  },
  {
    id: 'look',
    label: 'Look',
    taxonomies: ['ART_DIRECTION', 'STYLE', 'COLOR'],
    feeds: 'Art direction for every render',
  },
]

export const SPARK_TAXONOMIES = [
  'GENRE',
  ...new Set(SPARK_SLOTS.flatMap((slot) => slot.taxonomies)),
]

export type Spark = {
  slot: SparkSlot | 'genre'
  facetId: number
  taxonomy: string
  title: string
  description: string
  artPrompt?: string
  locked?: boolean
}

export type FacetPool = Record<string, FacetCard[]>

/** Groups catalog rows by taxonomy, keeping only ones that can be dealt. */
export function facetPool(cards: FacetCard[]): FacetPool {
  const pool: FacetPool = {}
  for (const card of cards) {
    if (!card.title) continue
    ;(pool[card.taxonomy] ??= []).push(card)
  }
  for (const list of Object.values(pool))
    list.sort((a, b) => a.title.localeCompare(b.title))
  return pool
}

/** Which loadout a genre Facet starts from, by the words in its name and blurb. */
const GENRE_HINTS: [RegExp, string][] = [
  [
    /space|galac|star|cosmic|sci-?fi|science fiction|planet|alien/,
    'space-comedy',
  ],
  [/super|hero|academy|school|campus|teen|coming of age/, 'hero-academy'],
  [
    /court|empire|throne|king|queen|political|histor|war|epic/,
    'court-intrigue',
  ],
  [/office|corporate|bureau|dystop|cyber|satire|workplace/, 'office-dystopia'],
  [/mystery|detective|noir|crime|whodunit|cozy/, 'cozy-mystery'],
  [
    /horror|gothic|weird|eldritch|haunt|creep|dark comedy|monster/,
    'comedy-horror',
  ],
  [
    /fable|fairy|myth|fantasy|folk|adventure|quest|journey|western|wonder/,
    'fable-journey',
  ],
]

export function presetForGenre(
  card: Pick<FacetCard, 'title' | 'description'>,
): string {
  const text = `${card.title} ${card.description ?? ''}`.toLowerCase()
  return GENRE_HINTS.find(([pattern]) => pattern.test(text))?.[1] ?? 'open'
}

function blurb(card: FacetCard): string {
  return (card.flavorText || card.description || '').trim().slice(0, 240)
}

function toSpark(slot: Spark['slot'], card: FacetCard): Spark {
  return {
    slot,
    facetId: card.id,
    taxonomy: card.taxonomy,
    title: card.title,
    description: blurb(card),
    ...(card.artPrompt ? { artPrompt: card.artPrompt.slice(0, 400) } : {}),
  }
}

export function genreSpark(card: FacetCard): Spark {
  return toSpark('genre', card)
}

/** A weighted pick from the slot's taxonomies, avoiding Facets already dealt. */
function pick(
  pool: FacetPool,
  taxonomies: string[],
  rand: () => number,
  exclude: Set<number>,
): FacetCard | null {
  const cards = taxonomies
    .flatMap((t) => pool[t] ?? [])
    .filter((card) => card.isRandomizable && !exclude.has(card.id))
  const total = cards.reduce(
    (sum, c) => sum + Math.max(0.01, c.randomWeight),
    0,
  )
  let roll = rand() * total
  for (const card of cards) {
    roll -= Math.max(0.01, card.randomWeight)
    if (roll <= 0) return card
  }
  return cards[cards.length - 1] ?? null
}

/** Deals a spark into every unlocked slot; locked sparks stay. */
export function dealSparks(
  pool: FacetPool,
  current: Spark[],
  rand: () => number = Math.random,
  only?: SparkSlot,
): Spark[] {
  const used = new Set(current.map((s) => s.facetId))
  return SPARK_SLOTS.flatMap((slot) => {
    const held = current.find((s) => s.slot === slot.id)
    if (held && (held.locked || (only && only !== slot.id))) return [held]
    if (!held && only && only !== slot.id) return []
    const card = pick(pool, slot.taxonomies, rand, used)
    if (!card) return held ? [held] : []
    used.add(card.id)
    return [toSpark(slot.id, card)]
  })
}

/** Title Case Facet names read as ordinary words in a sentence; acronyms stay. */
const lower = (text: string) =>
  text
    .split(' ')
    .map((word) => (/^[A-Z][a-z'-]*$/.test(word) ? word.toLowerCase() : word))
    .join(' ')

const capital = (text: string) => text[0]!.toUpperCase() + text.slice(1)
const an = (word: string) =>
  /^[aeiou]/i.test(word) ? `an ${word}` : `a ${word}`

/** The plain-words idea the sparks suggest. A starting draft, not copy. */
export function composeIdea(sparks: Spark[], genreLabel?: string): string {
  const get = (slot: Spark['slot']) => {
    const title = sparks.find((s) => s.slot === slot)?.title
    return title ? lower(title) : ''
  }
  const genre = get('genre') || lower(genreLabel ?? '') || 'story'
  const tone = get('tone')
  const world = get('world')
  const question = get('question')
  const hero = get('hero')
  const companion = get('companion')
  const quirk = get('quirk')
  const villain = get('villain')
  const artifact = get('artifact')
  const look = get('look')
  const sentences = [
    `${capital(an(tone ? `${tone} ${genre}` : genre))}${world ? ` set in the ${world}` : ''}${question ? `, about ${question}` : ''}.`,
  ]
  if (hero || companion)
    sentences.push(
      `You play ${hero ? `the ${hero}` : 'the lead'}${companion ? `, with ${an(companion)} at your side` : ''}${quirk ? ` (quirk: ${quirk})` : ''}.`,
    )
  if (villain) sentences.push(`The villain: ${villain}.`)
  if (artifact) sentences.push(`Everyone is after the ${artifact}.`)
  if (look) sentences.push(`Painted as ${look}.`)
  return sentences.join(' ')
}

/** Readable lines for a pitch or brief: what each spark is and what it feeds. */
export function sparkLines(sparks: Spark[]): string[] {
  if (!sparks.length) return []
  const label = (slot: Spark['slot']) =>
    slot === 'genre'
      ? 'Genre'
      : (SPARK_SLOTS.find((s) => s.id === slot)?.label ?? slot)
  return [
    'Sparks from Kind Robots Facets:',
    ...sparks.map(
      (s) =>
        `- ${label(s.slot)}: ${s.title} (${s.taxonomy.toLowerCase().replace(/_/g, ' ')} Facet #${s.facetId})${s.description ? ` — ${s.description}` : ''}`,
    ),
    ...sparks
      .filter((s) => s.slot === 'look' && s.artPrompt)
      .map((s) => `Art direction from ${s.title}: ${s.artPrompt}`),
  ]
}

/**
 * Which taxonomies a new element of each kind is drawn from, and how its name
 * is made. `name` gets one title per row, or '' when that row had no Facet.
 */
const ELEMENT_RECIPES: Record<
  AdditionKind,
  { taxonomies: string[][]; name: (t: string[]) => string }
> = {
  // Quirk goes in the note: "The Otter Lighthouse Keeper", not a pile-up.
  follower: {
    taxonomies: [['SPECIES'], ['OCCUPATION', 'ROLE'], ['QUIRK', 'PERSONALITY']],
    name: ([species, job]) => `The ${[species, job].filter(Boolean).join(' ')}`,
  },
  villain: {
    taxonomies: [['ARCHETYPE'], ['BACKSTORY', 'ALIGNMENT']],
    name: ([archetype, backstory]) => `The ${archetype || backstory}`,
  },
  quest: {
    taxonomies: [['MATERIAL'], ['THEME'], ['SETTING']],
    name: ([material, theme]) =>
      material ? `The ${material} Errand` : `A Question of ${theme}`,
  },
  encounter: {
    taxonomies: [['MOOD'], ['SETTING'], ['OCCUPATION', 'SPECIES']],
    name: ([mood, setting]) =>
      [mood, setting ? `at the ${setting}` : ''].filter(Boolean).join(' '),
  },
  place: {
    taxonomies: [['SETTING'], ['MOOD'], ['COLOR', 'MATERIAL']],
    name: ([setting, mood]) =>
      `The ${[mood, setting].filter(Boolean).join(' ')}`,
  },
  ending: {
    taxonomies: [['THEME'], ['MOOD']],
    name: ([theme, mood]) =>
      [mood ? `A ${mood}` : 'An', theme || 'Ending'].join(' '),
  },
  other: {
    taxonomies: [['THEME'], ['MATERIAL']],
    name: (t) => t.filter(Boolean).join(' and '),
  },
}

/** A named element for a ledger, drawn from Facets: a name, a note built from the cards, and its source. */
export function elementFromFacets(
  kind: AdditionKind,
  pool: FacetPool,
  rand: () => number = Math.random,
): { title: string; note: string; source: string } | null {
  const used = new Set<number>()
  const drawn = ELEMENT_RECIPES[kind].taxonomies.map((taxonomies) => {
    const card = pick(pool, taxonomies, rand, used)
    if (card) used.add(card.id)
    return card
  })
  const cards = drawn.filter((card): card is FacetCard => !!card)
  if (!cards.length) return null
  return {
    title: ELEMENT_RECIPES[kind]
      .name(drawn.map((card) => card?.title ?? ''))
      .trim(),
    note: cards
      .map((c) => {
        const text = blurb(c)
        if (!text) return `${c.title}.`
        return text.toLowerCase().includes(c.title.toLowerCase())
          ? text
          : `${c.title}: ${text}`
      })
      .join(' '),
    source: `Facets: ${cards.map((c) => `${c.title} (#${c.id})`).join(', ')}`,
  }
}
