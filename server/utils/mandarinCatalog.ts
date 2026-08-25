import {
  BUILT_IN_SET_META,
  BUILT_IN_SET_TERMS,
  CURATED_MANDARIN_CARDS,
  MANDARIN_SOURCE,
  STARTER_COMPONENT_GUIDES,
  type MandarinCard,
  type MandarinCatalogPayload,
  type MandarinStudySet,
} from '~/utils/mandarin'
import {
  CASINO_MANDARIN_CARDS,
  CASINO_STUDY_SET_META,
  type MandarinCasinoCard,
} from '~/utils/mandarinCasino'
import { CASINO_MANDARIN_ADDITIONS } from '~/utils/mandarinCasinoAdditions'
import { enrichMandarinCharacterData } from './mandarinCharacterData'
import { applyMandarinCatalogOverrides } from './mandarinCatalogOverrides'

type SourcePronunciation = {
  y?: string
  n?: string
}

type SourceForm = {
  t?: string
  i?: SourcePronunciation
  m?: string[]
  c?: string[]
}

type SourceEntry = {
  s?: string
  r?: string
  q?: number
  p?: string[]
  f?: SourceForm[]
}

const SOURCE_COMMIT = 'a66fd30b9580da2c2af7eb19e4b9d8099a29c061'
const SOURCE_BASE = `https://raw.githubusercontent.com/jelleverheyen/hsk-vocabulary/${SOURCE_COMMIT}/wordlists/inclusive/new`
const MINIMUM_CARD_COUNT = 500
let sourceCatalogPromise: Promise<MandarinCatalogPayload> | null = null
let catalogPromise: Promise<MandarinCatalogPayload> | null = null

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function pedagogicalMeaning(value: string): boolean {
  const lower = value.toLowerCase()
  return !(
    lower.startsWith('surname ') ||
    lower.startsWith('variant of ') ||
    lower.startsWith('old variant of ') ||
    lower.startsWith('archaic variant of ')
  )
}

function scoreForm(form: SourceForm): number {
  const meanings = Array.isArray(form.m) ? form.m.filter(Boolean) : []
  const pinyin = cleanText(form.i?.y)
  const usefulMeanings = meanings.filter(pedagogicalMeaning)
  let score = usefulMeanings.length * 4 + meanings.length
  if (pinyin && pinyin[0] === pinyin[0]?.toLowerCase()) score += 3
  if (meanings.some((meaning) => meaning.toLowerCase().startsWith('surname '))) score -= 8
  if (meanings.every((meaning) => !pedagogicalMeaning(meaning))) score -= 20
  return score
}

function chooseForm(forms: SourceForm[]): SourceForm | null {
  return (
    [...forms]
      .filter((form) => cleanText(form.i?.y) && Array.isArray(form.m) && form.m.length)
      .sort((a, b) => scoreForm(b) - scoreForm(a))[0] ?? null
  )
}

function normalizeSourceEntry(entry: SourceEntry, level: number): MandarinCard | null {
  const simplified = cleanText(entry.s)
  if (!simplified) return null
  const forms = Array.isArray(entry.f) ? entry.f : []
  const form = chooseForm(forms)
  if (!form) return null

  const meanings = (form.m ?? []).map(cleanText).filter(Boolean)
  const usefulMeanings = meanings.filter(pedagogicalMeaning)
  const selectedMeanings = usefulMeanings.length ? usefulMeanings : meanings
  const meaning = selectedMeanings[0]
  const pinyin = cleanText(form.i?.y)
  if (!meaning || !pinyin) return null

  const traditional = cleanText(form.t)
  const radical = cleanText(entry.r)
  const guide = STARTER_COMPONENT_GUIDES[simplified]
  const components = guide
    ? guide.components
    : radical && radical !== simplified
      ? [
          {
            glyph: radical,
            role: 'radical' as const,
            label: 'dictionary radical',
            note: 'Useful for indexing and pattern recognition, but not by itself a complete etymology.',
          },
        ]
      : []

  return {
    key: `hsk:${level}:${simplified}`,
    simplified,
    ...(traditional && traditional !== simplified ? { traditional } : {}),
    pinyin,
    meaning,
    meanings: selectedMeanings.slice(0, 6),
    kind: [...simplified].length === 1 ? 'character' : 'word',
    ...(radical ? { radical } : {}),
    ...(typeof entry.q === 'number' && Number.isFinite(entry.q)
      ? { frequency: entry.q }
      : {}),
    hskLevel: level,
    partsOfSpeech: Array.isArray(entry.p) ? entry.p.filter(Boolean) : [],
    classifiers: Array.isArray(form.c) ? form.c.filter(Boolean) : [],
    categories: ['beginner', `hsk-${level}`],
    components,
    ...(guide ? { history: guide.history } : {}),
    historyStatus: guide ? 'starter' : 'pending',
    source: MANDARIN_SOURCE,
  }
}

async function fetchLevel(level: number): Promise<MandarinCard[]> {
  // GitHub serves raw .json content as `text/plain; charset=utf-8`, not
  // `application/json`. ofetch's default JSON auto-parsing keys off the
  // response's Content-Type header, so without an explicit `parseResponse`
  // it silently returns the raw response text instead of a parsed array
  // whenever that header disagrees with the file extension. Forcing
  // JSON.parse here makes parsing independent of what the upstream host
  // decides to label the response as.
  const entries = await $fetch<SourceEntry[], string>(
    `${SOURCE_BASE}/${level}.min.json`,
    {
      retry: 2,
      timeout: 20_000,
      parseResponse: (responseText) => JSON.parse(responseText),
    },
  )
  if (!Array.isArray(entries)) throw new Error(`HSK level ${level} source was not an array.`)
  return entries
    .map((entry) => normalizeSourceEntry(entry, level))
    .filter((card): card is MandarinCard => Boolean(card))
}

function appendUsageNote(card: MandarinCard, usageNote?: string): MandarinCasinoCard {
  const current = (card as MandarinCasinoCard).usageNote?.trim()
  const incoming = usageNote?.trim()
  const combined = [...new Set([current, incoming].filter((value): value is string => Boolean(value)))]
  return {
    ...card,
    ...(combined.length ? { usageNote: combined.join(' ') } : {}),
  }
}

function mergeCasinoCard(existing: MandarinCard, specialist: MandarinCasinoCard): MandarinCard {
  const categories = [...new Set([...existing.categories, ...specialist.categories])]
  const withUsage = appendUsageNote(existing, specialist.usageNote)

  // A specialist curriculum may add table context to an ordinary HSK word, but it must
  // not turn the canonical everyday card for 大, 小, 客人, 谢谢, etc. into a casino-only
  // definition. Dedicated curated casino terms have no HSK level and intentionally take
  // the sharper specialist gloss/pinyin/source below.
  if (existing.hskLevel !== undefined) {
    return {
      ...withUsage,
      categories,
    }
  }

  return {
    ...withUsage,
    ...(specialist.traditional ? { traditional: specialist.traditional } : {}),
    pinyin: specialist.pinyin,
    meaning: specialist.meaning,
    meanings: [...specialist.meanings],
    kind: specialist.kind,
    categories,
    source: { ...specialist.source },
  }
}

function mergeCards(sourceCards: MandarinCard[]): MandarinCard[] {
  const bySimplified = new Map<string, MandarinCard>()

  for (const card of sourceCards) {
    if (!bySimplified.has(card.simplified)) bySimplified.set(card.simplified, card)
  }

  for (const curated of CURATED_MANDARIN_CARDS) {
    const existing = bySimplified.get(curated.simplified)
    if (!existing) {
      bySimplified.set(curated.simplified, curated)
      continue
    }
    existing.categories = [...new Set([...existing.categories, ...curated.categories])]
  }

  for (const specialist of [...CASINO_MANDARIN_CARDS, ...CASINO_MANDARIN_ADDITIONS]) {
    const existing = bySimplified.get(specialist.simplified)
    if (!existing) {
      bySimplified.set(specialist.simplified, specialist)
      continue
    }
    bySimplified.set(specialist.simplified, mergeCasinoCard(existing, specialist))
  }

  for (const [setId, terms] of Object.entries(BUILT_IN_SET_TERMS)) {
    for (const term of terms) {
      const card = bySimplified.get(term)
      if (card && !card.categories.includes(setId)) card.categories.push(setId)
    }
  }

  return [...bySimplified.values()].sort((a, b) => {
    const levelA = a.hskLevel ?? 99
    const levelB = b.hskLevel ?? 99
    if (levelA !== levelB) return levelA - levelB
    return (a.frequency ?? 1_000_000) - (b.frequency ?? 1_000_000)
  })
}

function buildSets(cards: MandarinCard[]): MandarinStudySet[] {
  const starterKeys = cards
    .filter((card) => card.hskLevel === 1 || card.hskLevel === 2)
    .slice(0, 500)
    .map((card) => card.key)

  const sets: MandarinStudySet[] = [
    {
      id: 'starter-500',
      label: 'Starter 500',
      description: 'A frequency-aware first 500 drawn from the beginner HSK vocabulary pool.',
      cardKeys: starterKeys,
    },
    {
      id: 'hsk-1',
      label: 'HSK 1 vocabulary',
      description: 'Words tagged in the pinned HSK level 1 source.',
      cardKeys: cards.filter((card) => card.hskLevel === 1).map((card) => card.key),
    },
    {
      id: 'hsk-2',
      label: 'HSK 1–2 vocabulary',
      description: 'The cumulative beginner vocabulary through HSK level 2.',
      cardKeys: cards
        .filter((card) => (card.hskLevel ?? 99) <= 2)
        .map((card) => card.key),
    },
  ]

  for (const [id, meta] of Object.entries(BUILT_IN_SET_META)) {
    sets.push({
      id,
      label: meta.label,
      description: meta.description,
      cardKeys: cards
        .filter((card) => card.categories.includes(id))
        .map((card) => card.key),
    })
  }

  for (const [id, meta] of Object.entries(CASINO_STUDY_SET_META)) {
    sets.push({
      id,
      label: meta.label,
      description: meta.description,
      cardKeys: cards
        .filter((card) => card.categories.includes(id))
        .map((card) => card.key),
    })
  }

  return sets.filter((set) => set.cardKeys.length > 0)
}

async function enrichCharacterDataSafely(cards: MandarinCard[]): Promise<MandarinCard[]> {
  try {
    return await enrichMandarinCharacterData(cards)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn('[mandarin] character-analysis enrichment unavailable; serving lexical catalog without it', {
      message,
    })
    return cards
  }
}

async function createSourceCatalog(): Promise<MandarinCatalogPayload> {
  const [levelOne, levelTwo] = await Promise.all([fetchLevel(1), fetchLevel(2)])
  const baseCards = mergeCards([...levelOne, ...levelTwo])
  if (baseCards.length < MINIMUM_CARD_COUNT) {
    throw new Error(
      `Mandarin starter catalog only normalized ${baseCards.length} cards; expected at least ${MINIMUM_CARD_COUNT}.`,
    )
  }

  // Character formation is source-backed enrichment, still part of the
  // immutable underlying curriculum snapshot. Administrative lexical/category
  // overrides are deliberately applied only after this stage.
  const cards = await enrichCharacterDataSafely(baseCards)
  return {
    cards,
    sets: buildSets(cards),
    source: MANDARIN_SOURCE,
  }
}

async function createCatalog(): Promise<MandarinCatalogPayload> {
  const sourceCatalog = await getMandarinSourceCatalog()
  const cards = await applyMandarinCatalogOverrides(sourceCatalog.cards)
  return {
    cards,
    sets: buildSets(cards),
    source: sourceCatalog.source,
  }
}

export function getMandarinSourceCatalog(): Promise<MandarinCatalogPayload> {
  sourceCatalogPromise ??= createSourceCatalog().catch((error) => {
    sourceCatalogPromise = null
    throw error
  })
  return sourceCatalogPromise
}

export function getMandarinCatalog(): Promise<MandarinCatalogPayload> {
  catalogPromise ??= createCatalog().catch((error) => {
    catalogPromise = null
    throw error
  })
  return catalogPromise
}

export function invalidateMandarinCatalog(): void {
  catalogPromise = null
}
