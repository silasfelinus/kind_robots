//
// The Table's decks: real entity records mapped into the card shape
// (storybook/t-034).
//
// Silas, 2026-09-12: "All selections before the story begins should be card
// hand based" -- clarified as "that doesn't count reasonable settings, start
// story, etc. I just meant all the flavor bits, including mode select,
// narrator, etc." So everything here is a CARD: mode, genre, place, hero,
// company, narrator, thread, treasures. Title, spark/objective and the length
// dial are ordinary controls and are deliberately absent from this file.
//
// Every deck is a mapping function rather than a component, because
// components/narrative/narrative-ingredient-card.vue already draws a
// NarrativeIngredientOption with its real artwork in the 2:3 card shape. The
// mappings match the ones the outgoing setup screen used, so the Table shows
// the same art the pickers did.

import type { NarrativeIngredientOption } from '@/utils/narrativeIngredients'
import type { StorybookRunMode } from '@/stores/storybookRunStore'

/** Slots on the board, in the order they are dealt. */
export const STORYBOOK_SLOTS = [
  'mode',
  'genre',
  'place',
  'hero',
  'company',
  'narrator',
  'thread',
  'treasures',
] as const

export type StorybookSlot = (typeof STORYBOOK_SLOTS)[number]

/**
 * The spread, in rows (storybook/t-010, 2026-09-13).
 *
 * Silas: "a backdrop that evokes laying out cards on a velvet tablecloth to
 * tell a story like a tarot reading, with different rows and columns." One
 * auto-fill row of eight reads as a toolbar; three named rows read as a
 * spread, and each row answers a different question about the story.
 */
export const STORYBOOK_SLOT_ROWS: {
  title: string
  slots: StorybookSlot[]
}[] = [
  { title: 'The frame', slots: ['mode', 'genre', 'place'] },
  { title: 'The cast', slots: ['hero', 'company', 'narrator'] },
  { title: 'The turn', slots: ['thread', 'treasures'] },
]

export interface StorybookSlotSpec {
  key: StorybookSlot
  label: string
  /** One line under the empty well, so a blank board still explains itself. */
  hint: string
  required: boolean
  /** How many cards the slot holds. */
  capacity: number
  icon: string
}

/**
 * Genre, Place and Hero are the only required slots.
 *
 * Everything else defaults or is genuinely optional -- a story with no
 * treasures and no plot thread is a fine story, and the narrator falls back to
 * the house default. Requiring more than three cards to start turns a table
 * into a form, which is what this screen replaced.
 */
export const STORYBOOK_SLOT_SPECS: StorybookSlotSpec[] = [
  {
    key: 'mode',
    label: 'Mode',
    hint: 'How the story is told',
    required: false,
    capacity: 1,
    icon: 'kind-icon:compass',
  },
  {
    key: 'genre',
    label: 'Genre',
    hint: 'The deck it resolves into',
    required: true,
    capacity: 1,
    icon: 'kind-icon:sparkles',
  },
  {
    key: 'place',
    label: 'Place',
    hint: 'Where it happens',
    required: true,
    capacity: 1,
    icon: 'kind-icon:moon',
  },
  {
    key: 'hero',
    label: 'Hero',
    hint: 'Who you play',
    required: true,
    capacity: 1,
    icon: 'kind-icon:mask',
  },
  {
    key: 'company',
    label: 'Company',
    hint: 'Who else is here',
    required: false,
    capacity: 2,
    icon: 'kind-icon:users',
  },
  {
    key: 'narrator',
    label: 'Narrator',
    hint: 'Whose voice tells it',
    required: false,
    capacity: 1,
    icon: 'kind-icon:feather',
  },
  {
    key: 'thread',
    label: 'Thread',
    hint: 'A plot to follow',
    required: false,
    capacity: 1,
    icon: 'kind-icon:map',
  },
  {
    key: 'treasures',
    label: 'Treasures',
    hint: 'What the story may hand out',
    required: false,
    capacity: 3,
    icon: 'kind-icon:gift',
  },
]

export const MODE_CARDS: (NarrativeIngredientOption & {
  slug: StorybookRunMode
})[] = [
  {
    slug: 'open-ended',
    title: 'Open-ended',
    description: 'A story with no last page. You decide when it ends.',
    flavorText: 'Endless',
    icon: 'kind-icon:refresh',
    badge: 'Mode',
    imagePath: '/images/generated/2026/09/artimage-25835-2d75f596.webp',
  },
  {
    slug: 'episodic',
    title: 'Episodic',
    description: 'A plot thread played out over a set run of scenes.',
    flavorText: 'Scenario-based',
    icon: 'kind-icon:map',
    badge: 'Mode',
    imagePath: '/images/generated/2026/09/artimage-25836-c717deaa.webp',
  },
  {
    slug: 'structured',
    title: 'Structured',
    description:
      'One life told in chapters, weighed across ten hidden dimensions.',
    flavorText: 'Da Vinci mode',
    icon: 'kind-icon:clock',
    badge: 'Mode',
    imagePath: '/images/generated/2026/09/artimage-25837-b524db24.webp',
  },
  {
    slug: 'taskmaster',
    title: 'Taskmaster',
    description:
      'A quest built from your own real work. The story serves the objective.',
    flavorText: 'Real work',
    icon: 'kind-icon:gearhammer',
    badge: 'Mode',
    imagePath: '/images/generated/2026/09/artimage-25838-1a16dfa9.webp',
  },
]

/** The five delivery dials a narrator Bot's voice can be modulated with. */
export const NARRATOR_DELIVERIES = [
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'playful', label: 'Playful' },
  { value: 'storybook', label: 'Storybook' },
  { value: 'mysterious', label: 'Mysterious' },
  { value: 'intimate', label: 'Intimate' },
] as const

/** Turn-budget presets for the length dial. A setting, never a card. */
export const LENGTH_PRESETS = [
  { value: 5, label: 'Short', hint: '5 turns' },
  { value: 8, label: 'Standard', hint: '8 turns' },
  { value: 12, label: 'Long', hint: '12 turns' },
  { value: 20, label: 'Epic', hint: '20 turns' },
] as const

interface CharacterLike {
  id: number
  slug?: string | null
  name?: string | null
  presentation?: string | null
  role?: string | null
  class?: string | null
  species?: string | null
  genre?: string | null
  imagePath?: string | null
  isPublic?: boolean | null
}

export function toHeroCard(character: CharacterLike): NarrativeIngredientOption {
  return {
    id: character.id,
    slug: character.slug || `character-${character.id}`,
    title: character.name || `Character ${character.id}`,
    description: character.presentation || character.role || character.class,
    flavorText: [character.species, character.class, character.genre]
      .filter(Boolean)
      .join(' · '),
    imagePath: character.imagePath,
    icon: 'kind-icon:mask',
  }
}

interface DreamLike {
  id: number
  slug?: string | null
  title?: string | null
  description?: string | null
  flavorText?: string | null
  imagePath?: string | null
  highlightImage?: string | null
  dreamType?: string | null
  isActive?: boolean | null
  ArtImage?: { imagePath?: string | null } | null
}

export function isPlaceDream(dream: DreamLike): boolean {
  return Boolean(
    dream.dreamType === 'LOCATION' && dream.isActive && dream.slug,
  )
}

export function toPlaceCard(dream: DreamLike): NarrativeIngredientOption {
  return {
    id: dream.id,
    slug: dream.slug || String(dream.id),
    title: dream.title || 'Untitled place',
    description: dream.description,
    flavorText: dream.flavorText,
    imagePath:
      dream.imagePath || dream.highlightImage || dream.ArtImage?.imagePath,
    icon: 'kind-icon:moon',
  }
}

interface FacetLike {
  id: number
  slug?: string | null
  title: string
  description?: string | null
  flavorText?: string | null
  imagePath?: string | null
  icon?: string | null
  taxonomy: string
}

/**
 * Only GENRE facets fill the Genre slot.
 *
 * The old setup screen offered six taxonomies at once in a single picker, which
 * is how a reader ended up choosing a mood where a genre was meant. A genre IS
 * the ending deck, so this slot cannot take anything else.
 */
export function isGenreFacet(facet: FacetLike): boolean {
  return facet.taxonomy === 'GENRE' && Boolean(facet.slug)
}

export function toGenreCard(facet: FacetLike): NarrativeIngredientOption {
  return {
    id: facet.id,
    slug: facet.slug || String(facet.id),
    title: facet.title,
    description: facet.description,
    flavorText: facet.flavorText,
    imagePath: facet.imagePath,
    icon: facet.icon || 'kind-icon:sparkles',
  }
}

interface ScenarioLike {
  id: number
  slug?: string | null
  title?: string | null
  description?: string | null
  imagePath?: string | null
  genres?: string | null
}

export function toThreadCard(
  scenario: ScenarioLike,
): NarrativeIngredientOption {
  return {
    id: scenario.id,
    slug: scenario.slug || String(scenario.id),
    title: scenario.title || 'Untitled thread',
    description: scenario.description,
    imagePath: scenario.imagePath,
    icon: 'kind-icon:map',
    badge: scenario.genres || undefined,
  }
}

interface RewardLike {
  id: number
  slug?: string | null
  name?: string | null
  description?: string | null
  effect?: string | null
  flavorText?: string | null
  imagePath?: string | null
  icon?: string | null
  rarity?: string | null
  rewardType?: string | null
  isActive?: boolean | null
}

export function toTreasureCard(
  reward: RewardLike,
): NarrativeIngredientOption {
  const rarity = (reward.rarity || '').toLowerCase()
  const kind = (reward.rewardType || '').toLowerCase()
  return {
    id: reward.id,
    slug: reward.slug || String(reward.id),
    title: reward.name || `Reward ${reward.id}`,
    description: reward.description || reward.effect,
    flavorText: reward.flavorText,
    imagePath: reward.imagePath,
    icon: reward.icon || 'kind-icon:gift',
    badge: [rarity, kind].filter(Boolean).join(' ') || undefined,
  }
}

export interface NarratorLike {
  id: number
  name?: string | null
  slug?: string | null
  subtitle?: string | null
  tagline?: string | null
  voice?: string | null
  imagePath?: string | null
}

export function toNarratorCard(
  narrator: NarratorLike,
): NarrativeIngredientOption {
  return {
    id: narrator.id,
    slug: narrator.slug || `bot-${narrator.id}`,
    title: narrator.name || `Narrator ${narrator.id}`,
    description: narrator.subtitle || narrator.tagline,
    flavorText: narrator.voice,
    imagePath: narrator.imagePath,
    icon: 'kind-icon:feather',
    badge: 'Narrator',
  }
}
