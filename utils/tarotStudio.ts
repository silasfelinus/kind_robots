export type TarotArcana = 'major' | 'minor'
export type TarotSuit = 'wands' | 'cups' | 'swords' | 'pentacles'
export type TarotCardStatus =
  'DRAFT' | 'QUEUED' | 'RENDERED' | 'REVIEW' | 'APPROVED' | 'REJECTED'

export type TarotCatalogCard = {
  key: string
  title: string
  arcana: TarotArcana
  suit: TarotSuit | null
  rank: string
  ordinal: number
  oracleId: string
  oracleTitle: string
  scene: string
}

export type TarotDeckSeed = {
  slug: string
  title: string
  description: string
  styleBible: string
  defaultEngine: string
  defaultCheckpoint: string | null
  defaultLoras: string
  backPrompt: string
  subject: string
}

const MAJORS = [
  [
    'The Fool',
    'the-newly-woken',
    'The Newly Woken',
    'A traveler at the edge of a grassy cliff, a little white dog tugging their scarf',
  ],
  [
    'The Magician',
    'the-tinkerer',
    'The Tinkerer',
    'A craftsperson at a workbench with a wand, bowl, blade and coin arranged under one raised hand',
  ],
  [
    'The High Priestess',
    'the-quiet-archivist',
    'The Quiet Archivist',
    'A scholar seated between two stone pillars, holding a closed blue book beside a moonlit pool',
  ],
  [
    'The Empress',
    'the-gardener',
    'The Gardener',
    'A gardener relaxing in a field of flowers and ripe wheat beneath a leafy tree',
  ],
  [
    'The Emperor',
    'the-lighthouse-keeper',
    'The Lighthouse Keeper',
    'A steadfast guardian seated on a stone throne overlooking a windswept coast',
  ],
  [
    'The Hierophant',
    'the-storyteller',
    'The Storyteller',
    'An elder storyteller beside a campfire, with two attentive learners on a patterned rug',
  ],
  [
    'The Lovers',
    'the-two-bots',
    'The Two Bots',
    'Two companions holding hands under a blooming tree with distant mountains',
  ],
  [
    'The Chariot',
    'the-wayfarer',
    'The Wayfarer',
    'A determined driver standing in a vehicle drawn by two mismatched creatures',
  ],
  [
    'Strength',
    'the-gentle-giant',
    'The Gentle Giant',
    'A calm figure gently opening the mouth of a great lion in a wild garden',
  ],
  [
    'The Hermit',
    'the-lantern-bearer',
    'The Lantern Bearer',
    'A solitary traveler holding a bright lantern on a narrow snow-covered mountain trail',
  ],
  [
    'Wheel of Fortune',
    'the-wheel',
    'The Great Cog Wheel',
    'A huge turning wheel surrounded by four creatures watching from the corners of a cloudscape',
  ],
  [
    'Justice',
    'the-fair-scale',
    'The Fair Scale',
    'A figure seated upright with a balanced scale in one hand and a sword in the other',
  ],
  [
    'The Hanged Man',
    'the-upside-down-bot',
    'The Upside-Down Bot',
    'An untroubled person suspended upside down by one ankle from a living branch',
  ],
  [
    'Death',
    'the-shedding',
    'The Shedding',
    'A traveler leaving old armor beside a river while the sun rises beyond a stone gate',
  ],
  [
    'Temperance',
    'the-mender',
    'The Mender',
    'A winged mender pouring water between two cups while standing with one foot in a stream',
  ],
  [
    'The Devil',
    'the-tangle',
    'The Tangle',
    'Two people loosening the chains tangled around an enormous dark statue',
  ],
  [
    'The Tower',
    'the-short-circuit',
    'The Short Circuit',
    'Lightning striking a high stone tower as its crown breaks apart above the clouds',
  ],
  [
    'The Star',
    'the-night-sky-bot',
    'The Night-Sky Bot',
    'A stargazer beside a pond pouring water onto the grass under seven bright stars',
  ],
  [
    'The Moon',
    'the-moon-pool',
    'The Moon Pool',
    'A winding path between two towers, a dog and wolf near the edge of a moonlit pond',
  ],
  [
    'The Sun',
    'the-sunrise-engine',
    'The Sunrise Engine',
    'A delighted child riding a white horse through giant sunflowers in golden sunlight',
  ],
  [
    'Judgement',
    'the-reboot',
    'The Reboot',
    'A chorus of people rising from sleeping places toward a trumpet sounding above the valley',
  ],
  [
    'The World',
    'the-whole-world',
    'The Whole World',
    'A dancer floating inside a leafy wreath with four animals watching at the corners',
  ],
] as const

const SUITS = [
  {
    key: 'wands',
    oracle: 'sparks',
    motif: 'flowering wooden staff',
    place: 'a hillside workshop',
  },
  {
    key: 'cups',
    oracle: 'currents',
    motif: 'silver cup filled with clear water',
    place: 'a garden beside a river',
  },
  {
    key: 'swords',
    oracle: 'breezes',
    motif: 'polished steel sword',
    place: 'a breezy mountain overlook',
  },
  {
    key: 'pentacles',
    oracle: 'cogs',
    motif: 'engraved golden coin',
    place: 'a courtyard full of green plants',
  },
] as const

const RANKS = [
  ['ace', 'Ace', 'one shining object resting in open hands'],
  ['two', 'Two', 'two matching objects balanced carefully'],
  [
    'three',
    'Three',
    'three makers collaborating on a complicated construction',
  ],
  ['four', 'Four', 'four objects placed around a resting traveler'],
  [
    'five',
    'Five',
    'five objects scattered after a storm as two travelers look for shelter',
  ],
  [
    'six',
    'Six',
    'six objects being shared between a generous giver and a grateful visitor',
  ],
  [
    'seven',
    'Seven',
    'seven objects arranged on a steep staircase leading uphill',
  ],
  [
    'eight',
    'Eight',
    'eight objects lined up beside a focused craftsperson at work',
  ],
  [
    'nine',
    'Nine',
    'nine objects displayed around a person enjoying a quiet victory',
  ],
  ['ten', 'Ten', 'ten objects carried home by a tired but determined family'],
  [
    'page',
    'Page',
    'a curious apprentice inspecting one object for the first time',
  ],
  [
    'knight',
    'Knight',
    'a traveler on horseback carrying one object across open land',
  ],
  [
    'queen',
    'Queen',
    'a thoughtful guardian seated on a carved chair holding one object',
  ],
  [
    'king',
    'King',
    'a seasoned leader seated in a broad chair holding one object',
  ],
] as const

const ORACLE_RANKS: Record<string, string> = {
  page: 'apprentice',
  knight: 'wanderer',
  queen: 'keeper',
  king: 'elder',
}

export const TAROT_CATALOG: TarotCatalogCard[] = [
  ...MAJORS.map(([title, oracleId, oracleTitle, scene], ordinal) => ({
    key: `major-${String(ordinal).padStart(2, '0')}`,
    title,
    arcana: 'major' as const,
    suit: null,
    rank: String(ordinal),
    ordinal,
    oracleId,
    oracleTitle,
    scene,
  })),
  ...SUITS.flatMap((suit, suitIndex) =>
    RANKS.map(([rank, label, setting], rankIndex) => ({
      key: `${rank}-of-${suit.key}`,
      title: `${label} of ${suit.key[0]?.toUpperCase()}${suit.key.slice(1)}`,
      arcana: 'minor' as const,
      suit: suit.key,
      rank,
      ordinal: 22 + suitIndex * 14 + rankIndex,
      oracleId: `${ORACLE_RANKS[rank] ?? rank}-of-${suit.oracle}`,
      oracleTitle: `${ORACLE_RANKS[rank] ?? label} of ${suit.oracle}`,
      scene: `At ${suit.place}, ${setting}, featuring a ${suit.motif}`,
    })),
  ),
]

export const TAROT_DECK_SEEDS: TarotDeckSeed[] = [
  {
    slug: 'superkate',
    title: 'SuperKate Tarot',
    description:
      'A one-of-a-kind private gift deck of color, care, courage and transformation.',
    styleBible:
      'Expressive grown-up fantasy illustration, vivid rainbow hair color and salon artistry, richly textured pigments, confident characters with individual faces and silhouettes, generous warmth and playful symbolism. Each card is its own complete scene. Compose for a vertical tarot card, with important faces and objects away from the trim edge. SuperKate is the inspiration for the deck, not an assumed photographic likeness.',
    defaultEngine: 'krea2',
    defaultCheckpoint: null,
    defaultLoras: '',
    backPrompt:
      'Intricate symmetrical braids of rainbow-colored hair ribbons, iridescent combs, stars and curling leaves surrounding a central luminous jewel, deep plum background, elegant ornamental symmetry, vertical composition',
    subject:
      'An expressive fantasy character with an imaginative hairstyle and beautifully dyed rainbow colors',
  },
  {
    slug: 'kind-robots',
    title: 'Kind Robots Tarot',
    description:
      'The recovered Kind Oracle, with 78 cards and a free authored reading engine.',
    styleBible:
      'Luminous friendly robots and mechanical creatures in expressive storybook landscapes, tactile metal and recycled materials, kindness and ingenuity rendered as physical actions. Bright western animation aesthetic for curious adults, emotionally readable poses, vertical card compositions. Preserve the existing Kind Oracle card names and oracleId mapping for the free reading engine.',
    defaultEngine: 'krea2',
    defaultCheckpoint: null,
    defaultLoras: '',
    backPrompt:
      'A perfectly symmetric botanical gearwork mandala with small fireflies, teal enamel and gold brass details, dark midnight-blue background, vertical composition',
    subject: 'A unique kindhearted robot with visible articulated mechanisms',
  },
  {
    slug: 'zuzu',
    title: 'Zuzu Tarot',
    description:
      'A supernatural, anthropomorphic Zuzu-universe journey through a strange western frontier.',
    styleBible:
      'Weird western fairy-tale world with expressive anthropomorphic animal characters, dusty frontier towns, ruins, dramatic cinematic light, worn cloth, intricate physical props and uncanny mysticism. Every character is clearly animal-headed and humanlike in pose. Distinct personalities in vivid western animation, vertical card compositions.',
    defaultEngine: 'krea2',
    defaultCheckpoint: null,
    defaultLoras: '',
    backPrompt:
      'Symmetrical weathered copper filigree with twin coyote silhouettes, desert wildflowers, small bones and an amber sun, deep indigo background, vertical composition',
    subject:
      'An expressive anthropomorphic frontier animal wearing practical weathered clothing',
  },
]

export function seedTarotCards(deckSlug: string) {
  const deck = TAROT_DECK_SEEDS.find((entry) => entry.slug === deckSlug)
  return TAROT_CATALOG.map((card) => ({
    key: card.key,
    title: deckSlug === 'kind-robots' ? card.oracleTitle : card.title,
    arcana: card.arcana,
    suit: card.suit,
    rank: card.rank,
    ordinal: card.ordinal,
    oracleId: card.oracleId,
    prompt: deck
      ? `${deck.subject}. ${card.scene}. ${deck.styleBible.split('.')[0]}. Portrait 2:3 composition, strong readable silhouette and cinematic lighting.`
      : '',
    checkpoint: deck?.defaultCheckpoint ?? null,
    loras: '',
    status: 'DRAFT',
    upright: '',
    reversed: '',
    notes: '',
  }))
}

export type TarotFilters = {
  arcana?: string
  suit?: string
  rank?: string
  checkpoint?: string
  status?: string
  query?: string
}

export function filterTarotCards<
  T extends {
    key: string
    title: string
    arcana: string
    suit: string | null
    rank: string
    checkpoint: string | null
    status: string
  },
>(cards: readonly T[], filters: TarotFilters): T[] {
  const query = filters.query?.toLocaleLowerCase().trim() ?? ''
  return cards.filter((card) => {
    if (
      filters.arcana &&
      filters.arcana !== 'all' &&
      card.arcana !== filters.arcana
    )
      return false
    if (filters.suit && filters.suit !== 'all' && card.suit !== filters.suit)
      return false
    if (filters.rank && filters.rank !== 'all' && card.rank !== filters.rank)
      return false
    if (
      filters.checkpoint &&
      filters.checkpoint !== 'all' &&
      (card.checkpoint ?? 'default') !== filters.checkpoint
    )
      return false
    if (
      filters.status &&
      filters.status !== 'all' &&
      card.status !== filters.status
    )
      return false
    return (
      !query || `${card.title} ${card.key}`.toLocaleLowerCase().includes(query)
    )
  })
}
