import { createError } from 'h3'
import type {
  MandarinCurationChange,
  MandarinCurationPayload,
  MandarinCurationRow,
  MandarinCurationSnapshot,
  MandarinCurationUpdate,
} from '~/types/mandarinCuration'
import type { MandarinCard } from '~/utils/mandarin'
import {
  getMandarinCatalog,
  getMandarinSourceCatalog,
  invalidateMandarinCatalog,
} from './mandarinCatalog'
import {
  isMandarinSystemCategory,
  normalizeMandarinCategories,
  type MandarinCardWithUsage,
} from './mandarinCatalogOverrides'
import { prisma } from './prisma'

type OverrideRecord = {
  cardKey: string
  traditional: string | null
  pinyin: string | null
  meaning: string | null
  meanings: string | null
  usageNote: string | null
  categories: string | null
  updatedByUserId: number
  isActive: boolean
  updatedAt: Date
}

type ChangeRecord = {
  id: number
  cardKey: string
  adminUserId: number
  beforeJson: string
  afterJson: string
  note: string | null
  createdAt: Date
}

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function usageNote(card: MandarinCard): string {
  return clean((card as MandarinCardWithUsage).usageNote, 2_000)
}

function snapshot(card: MandarinCard): MandarinCurationSnapshot {
  return {
    cardKey: card.key,
    simplified: card.simplified,
    traditional: card.traditional ?? '',
    pinyin: card.pinyin,
    meaning: card.meaning,
    meanings: [...card.meanings],
    usageNote: usageNote(card),
    categories: [...card.categories],
    hskLevel: card.hskLevel ?? null,
    frequency: card.frequency ?? null,
    sourceLabel: card.source.label,
    sourceVersion: card.source.version,
  }
}

function parseSnapshot(raw: string): MandarinCurationSnapshot | null {
  try {
    const value = JSON.parse(raw) as MandarinCurationSnapshot
    if (!value || typeof value !== 'object' || !value.cardKey) return null
    return value
  } catch {
    return null
  }
}

function changePublic(row: ChangeRecord): MandarinCurationChange | null {
  const before = parseSnapshot(row.beforeJson)
  const after = parseSnapshot(row.afterJson)
  if (!before || !after) return null
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    adminUserId: row.adminUserId,
    note: row.note ?? '',
    before,
    after,
  }
}

function overriddenFields(row: OverrideRecord | null): string[] {
  if (!row?.isActive) return []
  return [
    row.traditional !== null ? 'traditional' : '',
    row.pinyin !== null ? 'pinyin' : '',
    row.meaning !== null ? 'meaning' : '',
    row.meanings !== null ? 'meanings' : '',
    row.usageNote !== null ? 'usageNote' : '',
    row.categories !== null ? 'categories' : '',
  ].filter(Boolean)
}

function rowPublic(input: {
  source: MandarinCard
  effective: MandarinCard
  override: OverrideRecord | null
  audioReady: boolean
  changes: MandarinCurationChange[]
}): MandarinCurationRow {
  return {
    cardKey: input.source.key,
    source: snapshot(input.source),
    effective: snapshot(input.effective),
    hasOverride: Boolean(input.override?.isActive),
    overrideUpdatedAt: input.override?.isActive
      ? input.override.updatedAt.toISOString()
      : null,
    updatedByUserId: input.override?.isActive
      ? input.override.updatedByUserId
      : null,
    overriddenFields: overriddenFields(input.override),
    audioReady: input.audioReady,
    changes: input.changes,
  }
}

export async function getMandarinCurationData(): Promise<MandarinCurationPayload> {
  const [sourceCatalog, effectiveCatalog, overrides, audioAssets, changeRows] =
    await Promise.all([
      getMandarinSourceCatalog(),
      getMandarinCatalog(),
      prisma.mandarinCatalogOverride.findMany(),
      prisma.mandarinAudioAsset.findMany({ select: { cardKey: true } }),
      prisma.mandarinCatalogChange.findMany({
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
    ])

  const effectiveByKey = new Map(
    effectiveCatalog.cards.map((card) => [card.key, card] as const),
  )
  const overrideByKey = new Map(
    overrides.map((row) => [row.cardKey, row] as const),
  )
  const audioKeys = new Set(audioAssets.map((asset) => asset.cardKey))
  const changesByKey = new Map<string, MandarinCurationChange[]>()

  for (const row of changeRows) {
    const parsed = changePublic(row)
    if (!parsed) continue
    const current = changesByKey.get(row.cardKey) ?? []
    if (current.length < 8) current.push(parsed)
    changesByKey.set(row.cardKey, current)
  }

  const rows = sourceCatalog.cards.map((source) =>
    rowPublic({
      source,
      effective: effectiveByKey.get(source.key) ?? source,
      override: overrideByKey.get(source.key) ?? null,
      audioReady: audioKeys.has(source.key),
      changes: changesByKey.get(source.key) ?? [],
    }),
  )
  const categories = [
    ...new Set(rows.flatMap((row) => row.effective.categories)),
  ].sort((a, b) => a.localeCompare(b))

  return {
    rows,
    categories,
    editableCategories: categories.filter(
      (category) => !isMandarinSystemCategory(category),
    ),
    stats: {
      cards: rows.length,
      overridden: rows.filter((row) => row.hasOverride).length,
      withAudio: rows.filter((row) => row.audioReady).length,
      hsk1: rows.filter((row) => row.effective.hskLevel === 1).length,
      hsk2: rows.filter((row) => row.effective.hskLevel === 2).length,
    },
  }
}

export async function getMandarinCurationRow(
  cardKey: string,
): Promise<MandarinCurationRow> {
  const [sourceCatalog, effectiveCatalog, override, audioAsset, changeRows] =
    await Promise.all([
      getMandarinSourceCatalog(),
      getMandarinCatalog(),
      prisma.mandarinCatalogOverride.findUnique({ where: { cardKey } }),
      prisma.mandarinAudioAsset.findFirst({
        where: { cardKey },
        select: { id: true },
      }),
      prisma.mandarinCatalogChange.findMany({
        where: { cardKey },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ])
  const source = sourceCatalog.cards.find((card) => card.key === cardKey)
  if (!source) {
    throw createError({
      statusCode: 404,
      message: 'Mandarin source card not found.',
    })
  }
  const effective =
    effectiveCatalog.cards.find((card) => card.key === cardKey) ?? source
  return rowPublic({
    source,
    effective,
    override,
    audioReady: Boolean(audioAsset),
    changes: changeRows
      .map(changePublic)
      .filter((change): change is MandarinCurationChange => Boolean(change)),
  })
}

function normalizedMeanings(primary: string, values: unknown): string[] {
  const requested = Array.isArray(values) ? values : []
  const cleaned = requested
    .map((value) => clean(value, 500))
    .filter(Boolean)
    .slice(0, 12)
  return [...new Set([primary, ...cleaned])]
}

function sameArray(a: string[], b: string[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function sameCategorySet(a: string[], b: string[]): boolean {
  return JSON.stringify([...a].sort()) === JSON.stringify([...b].sort())
}

function snapshotEqual(
  a: MandarinCurationSnapshot,
  b: MandarinCurationSnapshot,
): boolean {
  return (
    a.traditional === b.traditional &&
    a.pinyin === b.pinyin &&
    a.meaning === b.meaning &&
    sameArray(a.meanings, b.meanings) &&
    a.usageNote === b.usageNote &&
    sameCategorySet(a.categories, b.categories)
  )
}

export async function updateMandarinCuration(input: {
  adminUserId: number
  body: MandarinCurationUpdate
}): Promise<{ row: MandarinCurationRow; changed: boolean }> {
  const cardKey = clean(input.body.cardKey, 255)
  if (!cardKey) {
    throw createError({ statusCode: 400, message: 'Mandarin card key is required.' })
  }

  const [sourceCatalog, effectiveCatalog] = await Promise.all([
    getMandarinSourceCatalog(),
    getMandarinCatalog(),
  ])
  const sourceCard = sourceCatalog.cards.find((card) => card.key === cardKey)
  if (!sourceCard) {
    throw createError({
      statusCode: 404,
      message: 'Only canonical sourced Mandarin cards can be curated here.',
    })
  }
  const currentCard =
    effectiveCatalog.cards.find((card) => card.key === cardKey) ?? sourceCard

  const traditional = clean(input.body.traditional, 255)
  const pinyin = clean(input.body.pinyin, 512)
  const meaning = clean(input.body.meaning, 500)
  const note = clean(input.body.note, 2_000)
  const requestedUsageNote = clean(input.body.usageNote, 2_000)
  if (!pinyin || !meaning) {
    throw createError({
      statusCode: 400,
      message: 'Pinyin and primary meaning cannot be blank.',
    })
  }

  const meanings = normalizedMeanings(meaning, input.body.meanings)
  const categories = normalizeMandarinCategories(
    input.body.categories,
    sourceCard.categories,
  )
  const source = snapshot(sourceCard)
  const before = snapshot(currentCard)
  const desired: MandarinCurationSnapshot = {
    ...source,
    traditional,
    pinyin,
    meaning,
    meanings,
    usageNote: requestedUsageNote,
    categories,
  }

  if (snapshotEqual(before, desired)) {
    return { row: await getMandarinCurationRow(cardKey), changed: false }
  }

  const sourceMeanings = normalizedMeanings(source.meaning, source.meanings)
  const traditionalOverride =
    desired.traditional === source.traditional ? null : desired.traditional
  const pinyinOverride = desired.pinyin === source.pinyin ? null : desired.pinyin
  const meaningOverride = desired.meaning === source.meaning ? null : desired.meaning
  const meaningsOverride = sameArray(desired.meanings, sourceMeanings)
    ? null
    : JSON.stringify(desired.meanings)
  const usageNoteOverride =
    desired.usageNote === source.usageNote ? null : desired.usageNote
  const categoriesOverride = sameCategorySet(desired.categories, source.categories)
    ? null
    : JSON.stringify(desired.categories)
  const hasOverride = Boolean(
    traditionalOverride !== null ||
      pinyinOverride !== null ||
      meaningOverride !== null ||
      meaningsOverride !== null ||
      usageNoteOverride !== null ||
      categoriesOverride !== null,
  )

  await prisma.$transaction(async (tx) => {
    await tx.mandarinCatalogOverride.upsert({
      where: { cardKey },
      create: {
        cardKey,
        traditional: traditionalOverride,
        pinyin: pinyinOverride,
        meaning: meaningOverride,
        meanings: meaningsOverride,
        usageNote: usageNoteOverride,
        categories: categoriesOverride,
        updatedByUserId: input.adminUserId,
        isActive: hasOverride,
      },
      update: {
        traditional: traditionalOverride,
        pinyin: pinyinOverride,
        meaning: meaningOverride,
        meanings: meaningsOverride,
        usageNote: usageNoteOverride,
        categories: categoriesOverride,
        updatedByUserId: input.adminUserId,
        isActive: hasOverride,
      },
    })
    await tx.mandarinCatalogChange.create({
      data: {
        cardKey,
        adminUserId: input.adminUserId,
        beforeJson: JSON.stringify(before),
        afterJson: JSON.stringify(desired),
        note: note || null,
      },
    })
  })

  invalidateMandarinCatalog()
  return { row: await getMandarinCurationRow(cardKey), changed: true }
}
