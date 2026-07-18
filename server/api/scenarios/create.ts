import { createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { normalizeSlugInput } from '~/utils/slugify'
import type {
  Prisma,
  ScenarioOutputType,
} from '~/prisma/generated/prisma/client'

export type ScenarioPostInput = {
  title?: unknown
  slug?: unknown
  description?: unknown
  intros?: unknown
  outputType?: unknown
  cast?: unknown
  dreamIds?: unknown
  artImageId?: unknown
  imagePath?: unknown
  locations?: unknown
  artPrompt?: unknown
  genres?: unknown
  inspirations?: unknown
  isMature?: unknown
  isPublic?: unknown
  isActive?: unknown
  difficulty?: unknown
  tier?: unknown
  group?: unknown
  secretNotes?: unknown
}

export type SkippedScenario = {
  title: string
  reason: string
  existingId?: number
}

export type FailedScenario = {
  title: string
  message: string
}

const scenarioOutputTypes: ScenarioOutputType[] = [
  'STORY',
  'ART',
  'CHARACTER',
  'REWARD',
  'DREAM',
  'SCENARIO',
  'MIXED',
]

function normalizeOutputType(value: unknown): ScenarioOutputType {
  return scenarioOutputTypes.includes(value as ScenarioOutputType)
    ? (value as ScenarioOutputType)
    : 'STORY'
}

function normalizeIdArray(value: unknown): number[] {
  if (!Array.isArray(value)) return []

  const ids = value
    .map((entry) => Number(entry))
    .filter((entry) => Number.isInteger(entry) && entry > 0)

  return [...new Set(ids)]
}

function normalizeRequiredString(
  value: unknown,
  field: string,
  maxLength = 191,
): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field is required and must be a string.`,
    })
  }

  const trimmed = value.trim()
  if (trimmed.length > maxLength) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must be ${maxLength} characters or fewer.`,
    })
  }

  return trimmed
}

function normalizeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback
}

function normalizeNullableString(value: unknown): string | null | undefined {
  if (value === null) return null
  if (value === undefined) return undefined
  if (typeof value !== 'string') return undefined

  const trimmed = value.trim()
  return trimmed || null
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }

  return fallback
}

function normalizeNullableInteger(value: unknown): number | null | undefined {
  if (value === null) return null
  if (value === undefined || value === '') return undefined

  const parsed = Number(value)
  if (!Number.isInteger(parsed)) {
    throw createError({
      statusCode: 400,
      message: 'difficulty must be an integer when provided.',
    })
  }

  return parsed
}

function normalizeIntros(value: unknown): string {
  if (!value) return '[]'

  if (Array.isArray(value)) {
    return JSON.stringify(
      value.map((entry) => String(entry).trim()).filter(Boolean),
    )
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return '[]'

    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return JSON.stringify(
          parsed.map((entry) => String(entry).trim()).filter(Boolean),
        )
      }
      return JSON.stringify([trimmed])
    } catch {
      return JSON.stringify(
        trimmed
          .split('\n')
          .map((entry) => entry.trim())
          .filter(Boolean),
      )
    }
  }

  return '[]'
}

function normalizeOptionalJsonString(
  value: unknown,
): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null

    try {
      JSON.parse(trimmed)
      return trimmed
    } catch {
      return JSON.stringify(trimmed)
    }
  }

  try {
    return JSON.stringify(value)
  } catch {
    throw createError({
      statusCode: 400,
      message: 'The "cast" field must be JSON-serializable.',
    })
  }
}

function normalizeOptionalId(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined

  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: 'artImageId must be a positive integer when provided.',
    })
  }

  return id
}

export function fallbackScenarioTitle(input: ScenarioPostInput): string {
  return typeof input.title === 'string' && input.title.trim()
    ? input.title.trim()
    : 'Untitled scenario'
}

export function getScenarioErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown scenario seed error.'
}

export function isScenarioInfrastructureError(error: unknown): boolean {
  const handled = errorHandler(error)
  return Number(handled.statusCode) >= 500
}

export function buildScenarioCreateInput(
  scenarioData: ScenarioPostInput,
  authenticatedUserId: number,
): Prisma.ScenarioCreateInput {
  const title = normalizeRequiredString(scenarioData.title, 'title')
  const artImageId = normalizeOptionalId(scenarioData.artImageId)
  const difficulty = normalizeNullableInteger(scenarioData.difficulty)
  const dreamIds = normalizeIdArray(scenarioData.dreamIds)

  return {
    User: { connect: { id: authenticatedUserId } },
    title,
    slug: normalizeSlugInput(scenarioData.slug) ?? undefined,
    description: normalizeString(scenarioData.description),
    intros: normalizeIntros(scenarioData.intros),
    outputType: normalizeOutputType(scenarioData.outputType),
    cast: normalizeOptionalJsonString(scenarioData.cast),
    imagePath: normalizeNullableString(scenarioData.imagePath),
    locations: normalizeNullableString(scenarioData.locations),
    artPrompt: normalizeNullableString(scenarioData.artPrompt),
    genres: normalizeNullableString(scenarioData.genres),
    inspirations: normalizeNullableString(scenarioData.inspirations),
    isMature: normalizeBoolean(scenarioData.isMature, false),
    isPublic: normalizeBoolean(scenarioData.isPublic, true),
    isActive: normalizeBoolean(scenarioData.isActive, true),
    difficulty,
    tier: normalizeNullableString(scenarioData.tier),
    group: normalizeNullableString(scenarioData.group),
    secretNotes: normalizeNullableString(scenarioData.secretNotes),
    ArtImage: artImageId ? { connect: { id: artImageId } } : undefined,
    ...(dreamIds.length
      ? { Dreams: { connect: dreamIds.map((id) => ({ id })) } }
      : {}),
  }
}

export async function findExistingScenario(title: string, userId: number) {
  return await prisma.scenario.findFirst({
    where: { title, userId },
    select: { id: true, title: true },
  })
}
