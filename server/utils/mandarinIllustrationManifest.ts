import { createHash } from 'node:crypto'
import type { MandarinCard, MandarinCatalogPayload } from '~/utils/mandarin'
import { getMandarinCatalog } from './mandarinCatalog'

export const MANDARIN_ILLUSTRATION_RECIPE_VERSION = 'v2'
export const MANDARIN_ART_DIRECTION_ID = 'modern-chinese-picturebook-v2'
export const MANDARIN_ART_DIRECTION_LABEL = 'Modern Chinese picture-book gouache'
export const MANDARIN_ILLUSTRATION_ENGINE = 'krea2'
export const MANDARIN_ILLUSTRATION_SIZE = 768

export type MandarinIllustrationStrategy = 'illustrate' | 'glyph-only'

export type MandarinIllustrationManifestEntry = {
  requestId: string
  cardKey: string
  simplified: string
  traditional?: string
  pinyin: string
  meaning: string
  kind: MandarinCard['kind']
  hskLevel: number | null
  categories: string[]
  strategy: MandarinIllustrationStrategy
  strategyReason: string
  recipeVersion: string
  artDirectionId: string
  engine: string
  width: number
  height: number
  imagePath: string
  imageUrl: string
  prompt: string | null
}

export type MandarinIllustrationManifest = {
  recipeVersion: string
  artDirection: {
    id: string
    label: string
    medium: string
    culturalGrounding: string
    antiAiTells: string[]
    textPolicy: string
  }
  engine: string
  generatedFrom: MandarinCatalogPayload['source']
  selection: {
    setIds: string[]
    totalCards: number
    illustrationCards: number
    glyphOnlyCards: number
  }
  entries: MandarinIllustrationManifestEntry[]
}

const FUNCTION_WORD_PARTS_OF_SPEECH = new Set(['u', 'y', 'c', 'p', 'd', 'r'])

const ART_DIRECTION = {
  id: MANDARIN_ART_DIRECTION_ID,
  label: MANDARIN_ART_DIRECTION_LABEL,
  medium:
    'Hand-painted educational picture-book illustration with Chinese gouache, watercolor, and restrained ink-wash influence; matte pigments on subtly textured paper.',
  culturalGrounding:
    'Use ordinary contemporary Chinese material culture, domestic life, foodways, streets, transit, tableware, textiles, games, and environments when they naturally support the vocabulary. Cultural specificity should come from believable lived details, not tourist shorthand.',
  antiAiTells: [
    'simplified deliberate forms instead of indiscriminate micro-detail',
    'matte pigment and paper texture instead of glossy CGI surfaces',
    'natural asymmetry and hand-painted edge variation instead of mechanical perfection',
    'one clear focal subject instead of decorative filler and object clutter',
    'simple believable anatomy instead of elaborate hand or face poses',
    'restrained lighting instead of cinematic rim-light, lens flare, bokeh, or neon glow',
  ],
  textPolicy:
    'No Hanzi, pinyin, English, numerals, pseudo-writing, captions, signage, logos, speech bubbles, labels, or watermarks inside generated art.',
} as const

function stableToken(cardKey: string): string {
  return createHash('sha256').update(cardKey, 'utf8').digest('hex').slice(0, 24)
}

function compactConcept(meaning: string): string {
  const clean = meaning.replace(/\s+/g, ' ').trim()
  const firstClause = clean.split(';')[0]?.trim() || clean
  return firstClause.slice(0, 240)
}

function illustrationStrategy(card: MandarinCard): {
  strategy: MandarinIllustrationStrategy
  reason: string
} {
  if (card.kind === 'component') {
    return {
      strategy: 'glyph-only',
      reason: 'Character components are taught through their real glyph and sourced role, not an invented picture.',
    }
  }

  const pos = card.partsOfSpeech.map((value) => value.trim().toLowerCase()).filter(Boolean)
  if (pos.length && pos.every((value) => FUNCTION_WORD_PARTS_OF_SPEECH.has(value))) {
    return {
      strategy: 'glyph-only',
      reason: 'This is primarily a grammatical/function word; a literal picture would be more likely to misteach than aid recall.',
    }
  }

  if (
    pos.length === 1 &&
    pos[0] === 'q' &&
    /\b(classifier|measure word)\b/i.test(card.meaning)
  ) {
    return {
      strategy: 'glyph-only',
      reason: 'A pure classifier is better learned with example usage than a decorative standalone image.',
    }
  }

  if (/^(?:\(?(?:modal |grammar )?particle\b|prefix\b|suffix\b)/i.test(card.meaning.trim())) {
    return {
      strategy: 'glyph-only',
      reason: 'This entry is primarily grammatical morphology rather than a concrete visual concept.',
    }
  }

  return {
    strategy: 'illustrate',
    reason: 'A concrete object, action, person, place, quantity, or scene can provide a useful visual memory anchor.',
  }
}

function categoryDirection(card: MandarinCard): string {
  const categories = new Set(card.categories)

  if (categories.has('casino')) {
    return [
      'Use a grounded contemporary Chinese or Chinese-speaking table-game context when it clarifies the concept: believable felt tables, chips, cards, tiles, cash handling, dealer gestures, and player interactions.',
      'Favor the visual language of a real working casino floor over fantasy luxury. Keep equipment physically plausible and brand-neutral.',
      'Do not invent readable table labels, chip denominations, card-face numerals, or gambling signage.',
    ].join(' ')
  }
  if (categories.has('food-drink')) {
    return 'Use recognizable Chinese everyday food culture where natural: ceramic bowls and cups, chopsticks, bamboo steamers, shared dishes, market ingredients, or an ordinary kitchen/table setting. The food or action remains the focal point.'
  }
  if (categories.has('family')) {
    return 'Use a warm contemporary Chinese domestic-life scene: an ordinary apartment, home, courtyard, or neighborhood context with believable everyday clothing and furnishings. Make the relationship obvious through interaction, not labels.'
  }
  if (categories.has('travel-places')) {
    return 'Use a practical contemporary Chinese urban, neighborhood, transit, room, street, or travel setting where it helps. Architecture and objects should feel lived-in and specific, with no readable signage.'
  }
  if (categories.has('greetings')) {
    return 'Use a simple contemporary Chinese social interaction with natural gesture, distance, and body language. Keep faces expressive but lightly rendered rather than uncanny close-up portraits.'
  }
  if (categories.has('time-calendar')) {
    return 'Express time through lighting and recognizable Chinese everyday routines such as breakfast, commuting, school, work, evening meals, or neighborhood activity. Avoid clocks or calendars with readable numerals unless absolutely necessary.'
  }
  if (categories.has('everyday-actions')) {
    return 'Show one person clearly performing the action in an ordinary contemporary Chinese daily-life setting where useful. Use a simple pose, believable hands, and minimal background distraction.'
  }
  if (categories.has('numbers')) {
    return 'Communicate quantity with a clean group of countable everyday objects, preferably familiar Chinese household, food, market, school, or game objects when appropriate. Use objects rather than written digits or number symbols.'
  }
  if (categories.has('colors')) {
    return 'Use one familiar central object or tiny scene whose target color is unmistakable. Chinese ceramics, textiles, food, plants, or ordinary household objects may provide subtle cultural grounding without turning into ornament.'
  }
  if (categories.has('animals')) {
    return 'Center one clearly recognizable animal or a tiny natural scene. Chinese landscape, garden, farm, or neighborhood cues may appear lightly when relevant, but the animal must remain the unmistakable memory anchor.'
  }

  return 'Choose the simplest ordinary object or everyday scene that makes the primary meaning obvious at a glance. When cultural context helps, ground it in contemporary Chinese lived environments and material culture rather than decorative stereotypes.'
}

export function buildMandarinIllustrationPrompt(card: MandarinCard): string {
  const concept = compactConcept(card.meaning)
  return [
    `Create a square educational flashcard illustration for the vocabulary concept: ${concept}.`,
    categoryDirection(card),
    'House style: modern Chinese educational picture-book art, hand-painted gouache with gentle watercolor and restrained ink-wash influence, matte pigments, subtle paper grain, clean shapes, clear silhouettes, limited deliberate detail, warm harmonious color, and generous negative space.',
    'The composition should feel designed by an illustrator: one strong memory anchor or one compact scene, natural asymmetry, modest depth, quiet lighting, and believable object relationships.',
    'Ground Chinese cultural flavor through truthful everyday details such as ceramics, bamboo, wood, textiles, foodways, interiors, markets, streets, transit, games, furnishings, or landscape only when they naturally belong to the concept.',
    'Do not use generic China shorthand as decoration: no gratuitous pagodas, lantern walls, dragons, Great Wall imagery, calligraphy, red-and-gold festival dressing, or historical costume unless that specific thing is genuinely the vocabulary concept.',
    'Avoid characteristic synthetic-image tells: no photorealism, glossy plastic skin, 3D-render surfaces, hyper-detailed microtexture everywhere, perfect symmetry, excessive cinematic rim lighting, lens flare, bokeh, neon glow, decorative filler, implausible anatomy, or crowded hands.',
    'No readable text, no Chinese characters, no pinyin, no English, no Latin letters, no numerals, no pseudo-writing, no captions, no signage, no labels, no speech bubbles, no logos, no watermarks, no collage.',
  ].join(' ')
}

function selectedCardKeys(catalog: MandarinCatalogPayload): string[] {
  const selected: string[] = []
  const seen = new Set<string>()
  for (const setId of ['starter-500', 'casino']) {
    const set = catalog.sets.find((candidate) => candidate.id === setId)
    for (const key of set?.cardKeys ?? []) {
      if (seen.has(key)) continue
      seen.add(key)
      selected.push(key)
    }
  }
  return selected
}

export async function getMandarinIllustrationManifest(): Promise<MandarinIllustrationManifest> {
  const catalog = await getMandarinCatalog()
  const cardByKey = new Map(catalog.cards.map((card) => [card.key, card] as const))
  const entries = selectedCardKeys(catalog)
    .map((key) => cardByKey.get(key))
    .filter((card): card is MandarinCard => Boolean(card))
    .map((card): MandarinIllustrationManifestEntry => {
      const token = stableToken(card.key)
      const decision = illustrationStrategy(card)
      const imagePath = `public/images/mandarin-tutor/cards/${MANDARIN_ILLUSTRATION_RECIPE_VERSION}/${token}.webp`
      return {
        requestId: `mandarin-tutor-${MANDARIN_ILLUSTRATION_RECIPE_VERSION}-${token}`,
        cardKey: card.key,
        simplified: card.simplified,
        ...(card.traditional ? { traditional: card.traditional } : {}),
        pinyin: card.pinyin,
        meaning: card.meaning,
        kind: card.kind,
        hskLevel: card.hskLevel ?? null,
        categories: [...card.categories],
        strategy: decision.strategy,
        strategyReason: decision.reason,
        recipeVersion: MANDARIN_ILLUSTRATION_RECIPE_VERSION,
        artDirectionId: MANDARIN_ART_DIRECTION_ID,
        engine: MANDARIN_ILLUSTRATION_ENGINE,
        width: MANDARIN_ILLUSTRATION_SIZE,
        height: MANDARIN_ILLUSTRATION_SIZE,
        imagePath,
        imageUrl: imagePath.replace(/^public/, ''),
        prompt: decision.strategy === 'illustrate' ? buildMandarinIllustrationPrompt(card) : null,
      }
    })

  return {
    recipeVersion: MANDARIN_ILLUSTRATION_RECIPE_VERSION,
    artDirection: { ...ART_DIRECTION, antiAiTells: [...ART_DIRECTION.antiAiTells] },
    engine: MANDARIN_ILLUSTRATION_ENGINE,
    generatedFrom: catalog.source,
    selection: {
      setIds: ['starter-500', 'casino'],
      totalCards: entries.length,
      illustrationCards: entries.filter((entry) => entry.strategy === 'illustrate').length,
      glyphOnlyCards: entries.filter((entry) => entry.strategy === 'glyph-only').length,
    },
    entries,
  }
}
