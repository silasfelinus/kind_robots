import { createError } from 'h3'
import prisma from '../../utils/prisma'
import { slugify } from '~/utils/slugify'
import type { Achievement, Prisma } from '~/prisma/generated/prisma/client'

export type AchievementDefinitionBody = Partial<Achievement>

export type ValidatedAchievementCreateInput =
  Prisma.AchievementUncheckedCreateInput & {
    label: string
    message: string
    icon: string
    triggerCode: string
  }

export type AchievementBatchFailure = {
  label: string
  message: string
}

export type AchievementBatchSkip = {
  label: string
  triggerCode: string
  existingId: number
  reason: string
}

const allowedDefinitionFields = new Set([
  'label',
  'message',
  'icon',
  'karma',
  'pageHint',
  'subtleHint',
  'triggerCode',
  'tooltip',
  'isActive',
  'isRepeatable',
  'artImageId',
  'artPrompt',
  'imagePath',
])

function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({
      statusCode: 400,
      message: `"${field}" must be a non-empty string.`,
    })
  }

  return value.trim()
}

function nullableText(value: unknown, field: string): string | null {
  if (value === null || value === undefined) return null

  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      message: `"${field}" must be a string or null.`,
    })
  }

  const text = value.trim()
  return text.length ? text : null
}

function optionalBoolean(
  value: unknown,
  field: string,
  fallback?: boolean,
): boolean | undefined {
  if (value === undefined) return fallback

  if (typeof value !== 'boolean') {
    throw createError({
      statusCode: 400,
      message: `"${field}" must be a boolean.`,
    })
  }

  return value
}

function optionalKarma(value: unknown, fallback?: number): number | undefined {
  if (value === undefined) return fallback

  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    throw createError({
      statusCode: 400,
      message: '"karma" must be a non-negative safe integer.',
    })
  }

  return Number(value)
}

function optionalArtImageId(value: unknown): number | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null

  const id = Number(value)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: '"artImageId" must be a positive integer or null.',
    })
  }

  return id
}

function validateObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({
      statusCode: 400,
      message: 'Achievement definition payload must be an object.',
    })
  }

  const record = body as Record<string, unknown>
  const unsupportedFields = Object.keys(record).filter(
    (field) => !allowedDefinitionFields.has(field),
  )

  if (unsupportedFields.length) {
    throw createError({
      statusCode: 400,
      message: `Unsupported Achievement fields: ${unsupportedFields.join(', ')}.`,
    })
  }

  return record
}

async function assertArtImageExists(artImageId?: number | null) {
  if (!artImageId) return

  const artImage = await prisma.artImage.findUnique({
    where: { id: artImageId },
    select: { id: true },
  })

  if (!artImage) {
    throw createError({
      statusCode: 404,
      message: `ArtImage ID not found: ${artImageId}.`,
    })
  }
}

function normalizedTriggerCode(value: unknown): string {
  const triggerCode = slugify(requiredText(value, 'triggerCode'))

  if (!triggerCode) {
    throw createError({
      statusCode: 400,
      message: '"triggerCode" must contain letters or numbers.',
    })
  }

  return triggerCode
}

export function fallbackAchievementLabel(body: unknown): string {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Untitled Achievement'
  }

  const label = (body as Record<string, unknown>).label
  return typeof label === 'string' && label.trim()
    ? label.trim()
    : 'Untitled Achievement'
}

export async function buildAchievementCreateInput(
  body: unknown,
): Promise<ValidatedAchievementCreateInput> {
  const input = validateObject(body)
  const artImageId = optionalArtImageId(input.artImageId)

  await assertArtImageExists(artImageId)

  return {
    label: requiredText(input.label, 'label'),
    message: requiredText(input.message, 'message'),
    icon: requiredText(input.icon, 'icon'),
    karma: optionalKarma(input.karma, 0),
    pageHint: nullableText(input.pageHint, 'pageHint'),
    subtleHint: nullableText(input.subtleHint, 'subtleHint'),
    triggerCode: normalizedTriggerCode(input.triggerCode),
    tooltip: nullableText(input.tooltip, 'tooltip'),
    isActive: optionalBoolean(input.isActive, 'isActive', true),
    isRepeatable: optionalBoolean(input.isRepeatable, 'isRepeatable', false),
    artImageId: artImageId ?? null,
    artPrompt: nullableText(input.artPrompt, 'artPrompt'),
    imagePath: nullableText(input.imagePath, 'imagePath'),
  }
}

export async function buildAchievementUpdateInput(
  body: unknown,
): Promise<Prisma.AchievementUncheckedUpdateInput> {
  const input = validateObject(body)

  if (!Object.keys(input).length) {
    throw createError({
      statusCode: 400,
      message: 'No Achievement update fields were provided.',
    })
  }

  const artImageId = optionalArtImageId(input.artImageId)
  await assertArtImageExists(artImageId)

  const data: Prisma.AchievementUncheckedUpdateInput = {}

  if (input.label !== undefined) data.label = requiredText(input.label, 'label')
  if (input.message !== undefined) {
    data.message = requiredText(input.message, 'message')
  }
  if (input.icon !== undefined) data.icon = requiredText(input.icon, 'icon')
  if (input.karma !== undefined) data.karma = optionalKarma(input.karma)
  if (input.pageHint !== undefined) {
    data.pageHint = nullableText(input.pageHint, 'pageHint')
  }
  if (input.subtleHint !== undefined) {
    data.subtleHint = nullableText(input.subtleHint, 'subtleHint')
  }
  if (input.triggerCode !== undefined) {
    data.triggerCode = normalizedTriggerCode(input.triggerCode)
  }
  if (input.tooltip !== undefined) {
    data.tooltip = nullableText(input.tooltip, 'tooltip')
  }
  if (input.isActive !== undefined) {
    data.isActive = optionalBoolean(input.isActive, 'isActive')
  }
  if (input.isRepeatable !== undefined) {
    data.isRepeatable = optionalBoolean(input.isRepeatable, 'isRepeatable')
  }
  if (input.artImageId !== undefined) data.artImageId = artImageId
  if (input.artPrompt !== undefined) {
    data.artPrompt = nullableText(input.artPrompt, 'artPrompt')
  }
  if (input.imagePath !== undefined) {
    data.imagePath = nullableText(input.imagePath, 'imagePath')
  }

  return data
}

export async function findAchievementByTriggerCode(triggerCode: string) {
  return await prisma.achievement.findUnique({
    where: { triggerCode },
    select: { id: true, label: true, triggerCode: true },
  })
}

export function prismaErrorCode(error: unknown): string | undefined {
  return error && typeof error === 'object' && 'code' in error
    ? String((error as { code?: unknown }).code || '')
    : undefined
}

export function isAchievementInfrastructureError(error: unknown): boolean {
  const code = prismaErrorCode(error)
  return Boolean(code && !['P2002', 'P2003'].includes(code))
}
