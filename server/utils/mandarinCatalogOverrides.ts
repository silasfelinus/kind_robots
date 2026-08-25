import type { MandarinCard } from '~/utils/mandarin'
import { prisma } from './prisma'

type MandarinOverrideRow = {
  cardKey: string
  traditional: string | null
  pinyin: string | null
  meaning: string | null
  meanings: string | null
  usageNote: string | null
  categories: string | null
  isActive: boolean
}

export type MandarinCardWithUsage = MandarinCard & {
  usageNote?: string
}

function cleanText(value: unknown, max = 2_000): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export function parseMandarinStringArray(
  raw: string | null | undefined,
  maxItems = 40,
  maxLength = 240,
): string[] | null {
  if (raw === null || raw === undefined) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return [
      ...new Set(
        parsed
          .map((value) => cleanText(value, maxLength))
          .filter(Boolean)
          .slice(0, maxItems),
      ),
    ]
  } catch {
    return []
  }
}

export function isMandarinSystemCategory(category: string): boolean {
  return category === 'beginner' || /^hsk-\d+$/i.test(category)
}

export function normalizeMandarinCategories(
  categories: unknown,
  sourceCategories: string[] = [],
): string[] {
  const requested = Array.isArray(categories) ? categories : []
  const topical = requested
    .map((value) =>
      cleanText(value, 80)
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, ''),
    )
    .filter((value) => value && !isMandarinSystemCategory(value))
  const locked = sourceCategories.filter(isMandarinSystemCategory)
  return [...new Set([...locked, ...topical])]
}

function cloneCard(card: MandarinCard): MandarinCardWithUsage {
  return {
    ...card,
    meanings: [...card.meanings],
    partsOfSpeech: [...card.partsOfSpeech],
    classifiers: [...card.classifiers],
    categories: [...card.categories],
    components: card.components.map((component) => ({ ...component })),
    source: { ...card.source },
  }
}

export function applyMandarinOverride(
  card: MandarinCard,
  override: MandarinOverrideRow | null | undefined,
): MandarinCardWithUsage {
  const next = cloneCard(card)
  if (!override?.isActive) return next

  if (override.traditional !== null) {
    const traditional = cleanText(override.traditional, 255)
    if (traditional && traditional !== next.simplified) next.traditional = traditional
    else delete next.traditional
  }

  if (override.pinyin !== null) {
    const pinyin = cleanText(override.pinyin, 512)
    if (pinyin) next.pinyin = pinyin
  }

  if (override.meaning !== null) {
    const meaning = cleanText(override.meaning, 500)
    if (meaning) next.meaning = meaning
  }

  const meanings = parseMandarinStringArray(override.meanings, 12, 500)
  if (meanings !== null) {
    const combined = [next.meaning, ...meanings].map((value) => cleanText(value, 500)).filter(Boolean)
    next.meanings = [...new Set(combined)]
  }

  const categories = parseMandarinStringArray(override.categories, 40, 80)
  if (categories !== null) {
    next.categories = normalizeMandarinCategories(categories, card.categories)
  }

  if (override.usageNote !== null) {
    const usageNote = cleanText(override.usageNote, 2_000)
    if (usageNote) next.usageNote = usageNote
    else delete next.usageNote
  }

  return next
}

export async function getMandarinCatalogOverrides(): Promise<MandarinOverrideRow[]> {
  return await prisma.mandarinCatalogOverride.findMany({
    where: { isActive: true },
    select: {
      cardKey: true,
      traditional: true,
      pinyin: true,
      meaning: true,
      meanings: true,
      usageNote: true,
      categories: true,
      isActive: true,
    },
  })
}

export async function applyMandarinCatalogOverrides(
  cards: MandarinCard[],
): Promise<MandarinCard[]> {
  try {
    const overrides = await getMandarinCatalogOverrides()
    if (!overrides.length) return cards.map(cloneCard)
    const byKey = new Map(overrides.map((override) => [override.cardKey, override] as const))
    return cards.map((card) => applyMandarinOverride(card, byKey.get(card.key)))
  } catch (error: unknown) {
    console.warn('[mandarin] catalog overrides unavailable; serving immutable source catalog', {
      message: error instanceof Error ? error.message : String(error),
    })
    return cards.map(cloneCard)
  }
}
