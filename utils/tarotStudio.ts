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
  /** The one character every face centers on (the scene recipe's opening). */
  figure: string
  /** The deck's world in one sentence, phrased around a single scene. */
  world: string
  isPublic: boolean
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

const titleCase = (value: string) =>
  `${value[0]?.toUpperCase() ?? ''}${value.slice(1)}`

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
      oracleTitle: `${titleCase(ORACLE_RANKS[rank] ?? label)} of ${titleCase(suit.oracle)}`,
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
    figure:
      'An expressive adult fantasy character with an imaginative hairstyle and beautifully dyed rainbow colors',
    world:
      'Grown-up fantasy illustration with vivid rainbow hair color, salon artistry and richly textured pigments',
    isPublic: false,
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
    figure: 'A unique kindhearted robot with visible articulated mechanisms',
    world:
      'A gentle storybook landscape of tactile metal and recycled materials, kindness shown through physical actions',
    isPublic: true,
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
    figure:
      'An expressive anthropomorphic frontier animal wearing practical weathered clothing',
    world:
      'A weird western fairy-tale frontier of open dusty plains and distant ruins under dramatic cinematic light',
    isPublic: false,
  },
]

/**
 * Staging shared by every face. The first style samples (2026-11-28) filled
 * Kind Robots and Zuzu backgrounds with crowds, because the old recipe ended
 * on the deck's plural style lead ("friendly robots and mechanical
 * creatures", "animal characters, dusty frontier towns").
 */
const SCENE_STAGING =
  'Only the figures named in this scene appear, with calm open space around them.'

function seedScenePrompt(deck: TarotDeckSeed, card: TarotCatalogCard) {
  return `${deck.figure}. ${card.scene}. ${deck.world}. ${SCENE_STAGING}`
}

/** Recipes earlier seeds wrote, oldest first; matching rows count as untouched. */
const PRIOR_SEED_RECIPES: ((
  deck: TarotDeckSeed,
  card: TarotCatalogCard,
) => string)[] = [
  // 2026-11-20 seed.
  (deck, card) =>
    `${deck.subject}. ${card.scene}. ${deck.styleBible.split('.')[0]}. Portrait 2:3 composition, strong readable silhouette and cinematic lighting.`,
  // 2026-11-27 production bootstrap (the first style samples).
  (deck, card) =>
    `${deck.subject}. ${card.scene}. ${deck.styleBible.split('.')[0]}.`,
]

function findSeed(deckSlug: string, cardKey: string) {
  const deck = TAROT_DECK_SEEDS.find((entry) => entry.slug === deckSlug)
  const card = TAROT_CATALOG.find((entry) => entry.key === cardKey)
  return deck && card ? { deck, card } : null
}

/** Every prompt an earlier seed wrote for this card, so untouched rows can be upgraded. */
export function priorSeedPrompts(deckSlug: string, cardKey: string) {
  const found = findSeed(deckSlug, cardKey)
  if (!found) return []
  return PRIOR_SEED_RECIPES.map((recipe) => recipe(found.deck, found.card))
}

/** The prompt the 2026-11-20 seed wrote (the oldest prior seed). */
export function legacySeedPrompt(deckSlug: string, cardKey: string) {
  return priorSeedPrompts(deckSlug, cardKey)[0] ?? null
}

/** The current seed recipe for a catalog card, or null for an unknown deck/card. */
export function currentSeedPrompt(deckSlug: string, cardKey: string) {
  const found = findSeed(deckSlug, cardKey)
  return found ? seedScenePrompt(found.deck, found.card) : null
}

/** The card's scene recipe: its edited prompt, or the current seed if untouched. */
export function cardScenePrompt(
  deckSlug: string,
  card: { key: string; prompt: string },
) {
  const prompt = card.prompt.trim()
  const current = currentSeedPrompt(deckSlug, card.key)
  if (
    current &&
    (!prompt || priorSeedPrompts(deckSlug, card.key).includes(prompt))
  ) {
    return current
  }
  return prompt
}

export type TarotDesignPreset = {
  key: string
  title: string
  stylePrompt: string
  backMedium: string
}

export const TAROT_DESIGN_PRESETS: TarotDesignPreset[] = [
  {
    key: 'gilded-nouveau',
    title: 'Gilded Art Nouveau',
    stylePrompt:
      'Art nouveau illustration with flowing gold linework, ornamental vines and halos, rich jewel-toned inks on warm cream paper, soft gilded highlights.',
    backMedium:
      'rendered as gold leaf art nouveau metalwork with flowing vine borders',
  },
  {
    key: 'storybook-watercolor',
    title: 'Storybook Watercolor',
    stylePrompt:
      'Loose watercolor and ink storybook painting on textured cotton paper, gentle color washes, delicate pen linework, airy morning light.',
    backMedium:
      'painted in soft watercolor washes and fine ink lines on textured cotton paper',
  },
  {
    key: 'neon-cosmos',
    title: 'Neon Cosmos',
    stylePrompt:
      'Luminous neon illustration beneath a deep violet starfield, glowing magenta and cyan rim light, iridescent haze, crisp airbrushed shading.',
    backMedium:
      'glowing in neon magenta and cyan light lines over a deep violet starfield',
  },
  {
    key: 'woodcut-classic',
    title: 'Classic Woodcut',
    stylePrompt:
      'Hand-carved woodcut print with bold black linework, flat hand-tinted color in ochre, crimson and indigo, visible paper grain, antique engraving style.',
    backMedium:
      'carved as a bold black woodcut print hand-tinted in ochre, crimson and indigo',
  },
  {
    key: 'stained-glass',
    title: 'Stained Glass',
    stylePrompt:
      'Radiant stained glass window with thick leaded outlines, saturated translucent color panes, sunlight glowing through ruby, cobalt and amber glass.',
    backMedium:
      'built from leaded stained glass panes in ruby, cobalt and amber with sunlight glowing through',
  },
]

export const TAROT_DESIGN_ENGINES = [
  'krea2',
  'comfy',
  'flux',
  'flux2',
  'zimage',
] as const

/** One major, one more major, one pip and one court: a fair style preview. */
export const TAROT_SAMPLE_CARD_KEYS = [
  'major-00',
  'major-17',
  'ace-of-cups',
  'queen-of-swords',
] as const

export const TAROT_ART_WIDTH = 832
export const TAROT_ART_HEIGHT = 1248

export function designBackPrompt(deckBackPrompt: string, backMedium: string) {
  const motif =
    deckBackPrompt.trim().replace(/[.\s]+$/, '') ||
    'A perfectly symmetrical ornamental emblem with stars, leaves and a central jewel'
  return `${motif}, ${backMedium}.`
}

export function seedTarotDesigns(deckSlug: string) {
  const deck = TAROT_DECK_SEEDS.find((entry) => entry.slug === deckSlug)
  return TAROT_DESIGN_PRESETS.map((preset) => ({
    key: preset.key,
    title: preset.title,
    stylePrompt: preset.stylePrompt,
    backPrompt: designBackPrompt(deck?.backPrompt ?? '', preset.backMedium),
    engine: deck?.defaultEngine ?? 'krea2',
    checkpoint: null,
    loras: '',
    status: 'EXPLORING',
    notes: '',
  }))
}

export function composeFacePrompt(scene: string, stylePrompt: string) {
  const base = scene.trim().replace(/\s+$/, '')
  const style = stylePrompt.trim()
  return [
    base,
    style,
    'Tall vertical framing with the figure centered and generous margins.',
  ]
    .filter(Boolean)
    .join(' ')
}

export function tarotArtRequestKey(artId: number) {
  return `tarot-art:${artId}`
}

/** "name" or "name:0.8" per line, the format the editors use. */
export function parseLoraLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = /^(.*?)(?::\s*(-?\d+(?:\.\d+)?))?$/.exec(line)
      const name = (match?.[1] ?? line).trim()
      const strength = match?.[2] ? Number(match[2]) : 1
      return { name, strength }
    })
    .filter((entry) => entry.name)
}

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
    prompt: deck ? seedScenePrompt(deck, card) : '',
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
