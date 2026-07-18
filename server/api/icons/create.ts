import { createError } from 'h3'
import prisma from '../../utils/prisma'
import type { Prisma, SmartIcon } from '~/prisma/generated/prisma/client'

export type SmartIconCreateBody = Partial<SmartIcon>

export type SmartIconBatchSkip = {
  title: string
  type: string
  existingId: number
  reason: string
}

export type SmartIconBatchFailure = {
  title: string
  message: string
}

function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field is required.`,
    })
  }

  const text = value.trim()

  if (text.length > 255) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must be 255 characters or fewer.`,
    })
  }

  return text
}

function nullableText(value: unknown, maxLength = 255): string | null {
  if (typeof value !== 'string' || !value.trim()) return null

  const text = value.trim()

  if (text.length > maxLength) {
    throw createError({
      statusCode: 400,
      message: `Text value must be ${maxLength} characters or fewer.`,
    })
  }

  return text
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function resolveCategory(options: {
  category: unknown
  modelType: unknown
}): { category: string; modelType: string | null } {
  const modelType = nullableText(options.modelType)
  const category =
    nullableText(options.category) ?? (modelType ? 'model' : 'giftshop')

  return { category, modelType }
}

export function fallbackSmartIconTitle(entry: SmartIconCreateBody): string {
  return typeof entry?.title === 'string' && entry.title.trim()
    ? entry.title.trim()
    : 'Untitled SmartIcon'
}

export function buildSmartIconCreateInput(
  entry: SmartIconCreateBody,
  userId: number,
): Prisma.SmartIconUncheckedCreateInput {
  const title = requiredText(entry.title, 'title')
  const type = requiredText(entry.type, 'type')
  const { category, modelType } = resolveCategory(entry)

  return {
    title,
    type,
    designer: nullableText(entry.designer),
    userId,
    icon: nullableText(entry.icon),
    label: nullableText(entry.label),
    link: nullableText(entry.link, 512),
    component: nullableText(entry.component),
    isPublic: booleanValue(entry.isPublic, true),
    description: nullableText(entry.description),
    category,
    modelType,
    isMature: booleanValue(entry.isMature, false),
  }
}

export async function findExistingSmartIcon(options: {
  title: string
  type: string
  userId: number
}) {
  return await prisma.smartIcon.findFirst({
    where: options,
    select: {
      id: true,
      title: true,
      type: true,
    },
  })
}

export function buildSmartIconUpdateInput(
  body: Record<string, unknown>,
): Prisma.SmartIconUpdateInput {
  const data: Prisma.SmartIconUpdateInput = {}

  if (body.title !== undefined) data.title = requiredText(body.title, 'title')
  if (body.type !== undefined) data.type = requiredText(body.type, 'type')
  if (body.designer !== undefined) data.designer = nullableText(body.designer)
  if (body.icon !== undefined) data.icon = nullableText(body.icon)
  if (body.label !== undefined) data.label = nullableText(body.label)
  if (body.link !== undefined) data.link = nullableText(body.link, 512)
  if (body.component !== undefined) data.component = nullableText(body.component)
  if (body.description !== undefined) {
    data.description = nullableText(body.description)
  }
  if (body.isPublic !== undefined) {
    if (typeof body.isPublic !== 'boolean') {
      throw createError({
        statusCode: 400,
        message: '"isPublic" must be a boolean.',
      })
    }
    data.isPublic = body.isPublic
  }
  if (body.isMature !== undefined) {
    if (typeof body.isMature !== 'boolean') {
      throw createError({
        statusCode: 400,
        message: '"isMature" must be a boolean.',
      })
    }
    data.isMature = body.isMature
  }

  if (body.category !== undefined || body.modelType !== undefined) {
    const { category, modelType } = resolveCategory({
      category: body.category,
      modelType: body.modelType,
    })
    data.category = category
    data.modelType = modelType
  }

  return data
}

export function hasSmartIconUpdate(data: Prisma.SmartIconUpdateInput): boolean {
  return Object.keys(data).length > 0
}
