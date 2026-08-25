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
import { enrichMandarinCharacterData } from './mandarinCharacterData'

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
  const entries = await $fetch<SourceEntry[], string>(
    `${SOURCE_BASE}/${level}.min.json`,
    {
      retry: 2,
      timeout: 20_000,
    },
  )
  if (!Array.isArray(entries)) throw new Error(`HSK level ${level} source was not an array.`)
  return entries
    .map((entry) => normalizeSourceEntry(entry, level))
    .filter((card): card is MandarinCard => Boolean(card))
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
  const bySimplified = new Map(cards.map((card) => [card.simplified, card]))
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

  for (const [id, terms] of Object.entries(BUILT_IN_SET_TERMS)) {
    const meta = BUILT_IN_SET_META[id]
    if (!meta) continue
    sets.push({
      id,
      label: meta.label,
      description: meta.description,
      cardKeys: [...new Set(terms.map((term) => bySimplified.get(term)?.key).filter(Boolean))] as string[],
    })
  }

  return sets.filter((set) => set.cardKeys.length > 0)
}

async function createCatalog(): Promise<MandarinCatalogPayload> {
  const [levelOne, levelTwo] = await Promise.all([fetchLevel(1), fetchLevel(2)])
  const baseCards = mergeCards([...levelOne, ...levelTwo])
  if (baseCards.length < MINIMUM_CARD_COUNT) {
    throw new Error(
      `Mandarin starter catalog only normalized ${baseCards.length} cards; expected at least ${MINIMUM_CARD_COUNT}.`,
    )
  }

  // Character formation data is a separate provenance layer from lexical
  // meanings. Enrich only after the vocabulary catalog is normalized so a
  // character source can never silently replace a word's dictionary meaning.
  const cards = await enrichMandarinCharacterData(baseCards)

  return {
    cards,
    sets: buildSets(cards),
    source: MANDARIN_SOURCE,
  }
}

export function getMandarinCatalog(): Promise<MandarinCatalogPayload> {
  catalogPromise ??= createCatalog().catch((error) => {
    catalogPromise = null
    throw error
  })
  return catalogPromise
}
