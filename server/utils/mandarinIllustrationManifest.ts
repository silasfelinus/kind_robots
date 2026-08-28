import type { MandarinCard, MandarinCatalogPayload } from '~/utils/mandarin'
import { getMandarinCatalog } from './mandarinCatalog'
import {
  buildMandarinIllustrationPrompt,
  mandarinCardToken,
  mandarinStyleVariant,
  type MandarinStyleVariant,
} from './mandarinIllustrationStyle'

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
  /**
   * The per-card framing/light/palette/handling/ground draw baked into `prompt`.
   * Present only for illustrated entries. Batch producers read this to tell a
   * varied manifest from the original uniform one, and QA reads it to check
   * whether a weak render is a bad concept or a bad style draw.
   */
  styleVariant: MandarinStyleVariant | null
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
      const token = mandarinCardToken(card.key)
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
        styleVariant: decision.strategy === 'illustrate' ? mandarinStyleVariant(token) : null,
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

// The prompt recipe lives in the pure module; re-exported so callers that think
// of it as "the manifest's prompt" keep working.
export { buildMandarinIllustrationPrompt, mandarinCardToken } from './mandarinIllustrationStyle'
