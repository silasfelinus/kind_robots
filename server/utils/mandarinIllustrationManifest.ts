import { createHash } from 'node:crypto'
import type { MandarinCard, MandarinCatalogPayload } from '~/utils/mandarin'
import { getMandarinCatalog } from './mandarinCatalog'

export const MANDARIN_ILLUSTRATION_RECIPE_VERSION = 'v1'
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
  engine: string
  width: number
  height: number
  imagePath: string
  imageUrl: string
  prompt: string | null
}

export type MandarinIllustrationManifest = {
  recipeVersion: string
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

  if (
    /^(?:\(?(?:modal |grammar )?particle\b|prefix\b|suffix\b)/i.test(card.meaning.trim())
  ) {
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
      'Use a professional modern table-game or casino-service setting only when it helps express the concept.',
      'Cards, chips, table layouts, dealer/player actions, cash handling, and suits should look physically plausible and brand-neutral.',
      'Do not invent readable table labels, betting text, chip denominations, or card-face numerals.',
    ].join(' ')
  }
  if (categories.has('animals')) {
    return 'Center one clearly recognizable animal or small natural animal scene; make species identity unmistakable.'
  }
  if (categories.has('colors')) {
    return 'Use one familiar central object or tiny scene whose dominant named color is unmistakable; communicate the color without swatches, labels, or text.'
  }
  if (categories.has('numbers')) {
    return 'Communicate quantity with a clean group of countable everyday objects; use objects rather than written digits or number symbols.'
  }
  if (categories.has('food-drink')) {
    return 'Make the food, drink, meal, vessel, or eating action immediately recognizable and appetizing without packaging text.'
  }
  if (categories.has('family')) {
    return 'Use a warm contemporary everyday people scene that makes the relationship or person concept clear without relying on labels.'
  }
  if (categories.has('everyday-actions')) {
    return 'Show the action unmistakably in progress with a clear subject, readable body language, and minimal background distraction.'
  }
  if (categories.has('travel-places')) {
    return 'Use a recognizable contemporary vehicle, destination, room, street, or travel situation with no readable signage.'
  }
  if (categories.has('time-calendar')) {
    return 'Express the time-of-day, date, duration, or temporal idea through lighting and ordinary activity, avoiding clocks or calendars with readable numerals unless essential.'
  }
  if (categories.has('greetings')) {
    return 'Use a simple contemporary social interaction whose gesture and situation communicate the phrase without speech bubbles or written language.'
  }

  return 'Choose the simplest ordinary object or everyday scene that makes the primary meaning visually obvious at a glance.'
}

export function buildMandarinIllustrationPrompt(card: MandarinCard): string {
  const concept = compactConcept(card.meaning)
  return [
    `Educational flashcard illustration for the vocabulary concept: ${concept}.`,
    categoryDirection(card),
    'One memorable focal subject or compact everyday scene, square composition, polished educational editorial illustration, friendly but not childish, crisp silhouette, natural light, tactile detail, uncluttered background.',
    'Use contemporary everyday Chinese context only when the vocabulary itself makes location or culture relevant; otherwise keep the scene universal.',
    'Avoid generic cultural shorthand such as decorative pagodas, lanterns, calligraphy, dragons, or historical costume unless that object is genuinely the vocabulary concept.',
    'No readable text, no Chinese characters, no Latin letters, no numerals, no captions, no signage, no labels, no speech bubbles, no logos, no watermarks, no collage.',
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
        engine: MANDARIN_ILLUSTRATION_ENGINE,
        width: MANDARIN_ILLUSTRATION_SIZE,
        height: MANDARIN_ILLUSTRATION_SIZE,
        imagePath,
        imageUrl: imagePath.replace(/^public/, ''),
        prompt:
          decision.strategy === 'illustrate'
            ? buildMandarinIllustrationPrompt(card)
            : null,
      }
    })

  return {
    recipeVersion: MANDARIN_ILLUSTRATION_RECIPE_VERSION,
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
