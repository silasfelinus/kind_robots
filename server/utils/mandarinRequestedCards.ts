import { createError } from 'h3'
import type { MandarinCard } from '~/utils/mandarin'
import { enrichMandarinCharacterData } from './mandarinCharacterData'
import {
  buildMandarinIllustrationPrompt,
  MANDARIN_ILLUSTRATION_RECIPE_VERSION,
} from './mandarinIllustrationManifest'
import { prisma } from './prisma'

export const MANDARIN_REQUEST_RECIPE_VERSION = 'v1'
export const MANDARIN_REQUEST_ART_VERSION = MANDARIN_ILLUSTRATION_RECIPE_VERSION
const MAX_REQUEST_LENGTH = 120
const MAX_TEXT_RESPONSE_LENGTH = 20_000

type GeneratedMandarinFields = {
  simplified: string
  traditional: string | null
  pinyin: string
  meaning: string
  meanings: string[]
  usageNote: string | null
}

type RequestedCardRow = {
  id: number
  userId: number
  requestText: string
  normalizedRequest: string
  simplified: string
  traditional: string | null
  pinyin: string
  meaning: string
  meanings: string
  usageNote: string | null
  provider: string
  model: string
  recipeVersion: string
  generationProvenance: string
  artPrompt: string
  artPromptVersion: string
  artJobId: number | null
  artImageId: number | null
}

function clean(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function stripMarkdownFence(text: string): string {
  const trimmed = text.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return fenced?.[1]?.trim() || trimmed
}

function parseJsonObject(text: string): Record<string, unknown> {
  const stripped = stripMarkdownFence(text)
  const first = stripped.indexOf('{')
  const last = stripped.lastIndexOf('}')
  const candidate = first >= 0 && last > first ? stripped.slice(first, last + 1) : stripped
  try {
    const parsed = JSON.parse(candidate) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('not an object')
    }
    return parsed as Record<string, unknown>
  } catch {
    throw createError({
      statusCode: 502,
      message: 'The language model did not return a valid requested-word card.',
    })
  }
}

function usefulMeanings(value: unknown, fallback: string): string[] {
  const raw = Array.isArray(value) ? value : []
  const meanings = raw
    .map((item) => clean(item, 240))
    .filter(Boolean)
    .slice(0, 6)
  if (!meanings.length && fallback) meanings.push(fallback)
  return [...new Set(meanings)]
}

function containsHan(value: string): boolean {
  return /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/u.test(value)
}

export function normalizeMandarinRequest(value: unknown): {
  requestText: string
  normalizedRequest: string
} {
  const requestText = clean(value, MAX_REQUEST_LENGTH)
  if (!requestText) {
    throw createError({ statusCode: 400, message: 'Enter a word or short phrase to add.' })
  }
  const normalizedRequest = requestText
    .normalize('NFKC')
    .toLocaleLowerCase('en-US')
    .replace(/\s+/g, ' ')
    .trim()
  return { requestText, normalizedRequest }
}

export function parseGeneratedMandarinCard(text: string): GeneratedMandarinFields {
  if (!text || text.length > MAX_TEXT_RESPONSE_LENGTH) {
    throw createError({
      statusCode: 502,
      message: 'The generated Mandarin card response had an invalid size.',
    })
  }

  const parsed = parseJsonObject(text)
  const simplified = clean(parsed.simplified, 255)
  const traditionalRaw = clean(parsed.traditional, 255)
  const traditional = traditionalRaw && traditionalRaw !== simplified ? traditionalRaw : null
  const pinyin = clean(parsed.pinyin, 512)
  const meaning = clean(parsed.meaning, 500)
  const meanings = usefulMeanings(parsed.meanings, meaning)
  const usageNote = clean(parsed.usageNote, 1200) || null

  if (!simplified || !containsHan(simplified) || !pinyin || !meaning) {
    throw createError({
      statusCode: 502,
      message: 'The generated card was missing Hanzi, tone-marked pinyin, or a meaning.',
    })
  }

  return { simplified, traditional, pinyin, meaning, meanings, usageNote }
}

export function requestedCardSystemPrompt(): string {
  return [
    'You create concise beginner Mandarin Chinese learning cards.',
    'Return exactly one JSON object and no markdown.',
    'Use Standard Mandarin and simplified Chinese as the primary written form.',
    'Pinyin MUST use tone marks (for example nǐ hǎo), not tone numbers.',
    'If the input is already Chinese, explain that Chinese expression rather than translating it into a different concept.',
    'If the input is English or another language, choose the most ordinary useful Mandarin equivalent rather than a rare literary synonym.',
    'Do not invent historical etymology or character-component explanations.',
    'When usage is regional, formal, colloquial, casino-specific, or context-sensitive, say so briefly in usageNote.',
    'JSON schema: {"simplified":string,"traditional":string|null,"pinyin":string,"meaning":string,"meanings":string[],"usageNote":string|null}.',
  ].join(' ')
}

export function requestedCardPrompt(requestText: string): string {
  return `Create a Mandarin learning card for this requested word or short phrase: ${JSON.stringify(requestText)}`
}

function requestedArtCategories(fields: GeneratedMandarinFields): string[] {
  const context = `${fields.meaning} ${fields.usageNote || ''}`
  if (/casino|gambl|wager|bet|dealer|banker|chip|baccarat|blackjack|roulette|poker/i.test(context)) {
    return ['requested', 'casino']
  }
  if (/food|drink|tea|coffee|meal|rice|noodle|bread|restaurant|eat|cook/i.test(context)) {
    return ['requested', 'food-drink']
  }
  return ['requested']
}

export function requestedArtPrompt(fields: GeneratedMandarinFields): string {
  const promptCard: MandarinCard = {
    // The key seeds the per-card style draw in buildMandarinIllustrationPrompt,
    // so it has to name the actual word -- a constant here would give every
    // requested card in the deck the same framing, light, and palette.
    key: `requested:${fields.simplified}`,
    simplified: fields.simplified,
    ...(fields.traditional ? { traditional: fields.traditional } : {}),
    pinyin: fields.pinyin,
    meaning: fields.meaning,
    meanings: fields.meanings,
    kind: [...fields.simplified].length === 1 ? 'character' : 'phrase',
    partsOfSpeech: [],
    classifiers: [],
    categories: requestedArtCategories(fields),
    components: [],
    historyStatus: 'pending',
    source: {
      label: 'Requested Mandarin card',
      version: MANDARIN_REQUEST_ART_VERSION,
    },
  }
  return buildMandarinIllustrationPrompt(promptCard)
}

function rowGeneratedFields(row: RequestedCardRow): GeneratedMandarinFields {
  return {
    simplified: row.simplified,
    traditional: row.traditional,
    pinyin: row.pinyin,
    meaning: row.meaning,
    meanings: parseStoredMeanings(row.meanings, row.meaning),
    usageNote: row.usageNote,
  }
}

export async function ensureRequestedArtRecipe<T extends RequestedCardRow>(row: T): Promise<T> {
  if (row.artPromptVersion === MANDARIN_REQUEST_ART_VERSION) return row

  const artPrompt = requestedArtPrompt(rowGeneratedFields(row))
  await prisma.mandarinRequestedCard.update({
    where: { id: row.id },
    data: {
      artPrompt,
      artPromptVersion: MANDARIN_REQUEST_ART_VERSION,
      artJobId: null,
      artImageId: null,
    },
  })

  return {
    ...row,
    artPrompt,
    artPromptVersion: MANDARIN_REQUEST_ART_VERSION,
    artJobId: null,
    artImageId: null,
  }
}

function parseStoredMeanings(raw: string, fallback: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      const values = parsed.map((item) => clean(item, 240)).filter(Boolean).slice(0, 6)
      if (values.length) return values
    }
  } catch {
    // Older/corrupt generated metadata should not break the entire tutor.
  }
  return [fallback]
}

export function requestedRowToCard(row: RequestedCardRow): MandarinCard {
  return {
    key: `requested:${row.id}`,
    simplified: row.simplified,
    ...(row.traditional && row.traditional !== row.simplified
      ? { traditional: row.traditional }
      : {}),
    pinyin: row.pinyin,
    meaning: row.meaning,
    meanings: parseStoredMeanings(row.meanings, row.meaning),
    kind: [...row.simplified].length === 1 ? 'character' : 'phrase',
    partsOfSpeech: [],
    classifiers: [],
    categories: ['requested'],
    components: [],
    historyStatus: 'pending',
    source: {
      label: 'AI-generated requested card · not dictionary-sourced',
      version: `${row.provider}:${row.model} · recipe ${row.recipeVersion}`,
      licenseNote: row.generationProvenance,
    },
  }
}

async function enrichRequestedCard(card: MandarinCard): Promise<MandarinCard> {
  try {
    const enriched = await enrichMandarinCharacterData([card])
    return enriched[0] ?? card
  } catch (error: unknown) {
    console.warn('[mandarin] requested-card character enrichment unavailable', {
      cardKey: card.key,
      message: error instanceof Error ? error.message : String(error),
    })
    return card
  }
}

export async function reconcileRequestedCardArt<T extends RequestedCardRow>(
  row: T,
): Promise<T> {
  if (row.artImageId || !row.artJobId) return row

  const job = await prisma.artJob.findUnique({
    where: { id: row.artJobId },
    select: { userId: true, status: true, artImageId: true },
  })
  if (!job || job.userId !== row.userId) return row

  const artImageId = Number(job.artImageId)
  if (job.status !== 'DONE' || !Number.isInteger(artImageId) || artImageId <= 0) {
    return row
  }

  await prisma.mandarinRequestedCard.update({
    where: { id: row.id },
    data: { artImageId },
  })
  return { ...row, artImageId }
}

export function requestedCardPublicData(row: RequestedCardRow) {
  const artIsCurrent = row.artPromptVersion === MANDARIN_REQUEST_ART_VERSION
  return {
    id: row.id,
    card: requestedRowToCard(row),
    requestText: row.requestText,
    usageNote: row.usageNote,
    generated: true as const,
    provenance: {
      provider: row.provider,
      model: row.model,
      recipeVersion: row.recipeVersion,
      note: row.generationProvenance,
    },
    art: {
      prompt: row.artPrompt,
      promptVersion: row.artPromptVersion,
      jobId: artIsCurrent ? row.artJobId : null,
      imageId: artIsCurrent ? row.artImageId : null,
      imageUrl: artIsCurrent && row.artImageId ? `/api/art/images/${row.artImageId}/file` : null,
    },
  }
}

export async function requestedCardPublicDataEnriched(row: RequestedCardRow) {
  const base = requestedCardPublicData(row)
  return {
    ...base,
    card: await enrichRequestedCard(base.card),
  }
}
