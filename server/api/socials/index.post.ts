// /server/api/socials/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { serializeSocialMedia } from '@/server/utils/socialMedia'
import { validateApiKey } from '@/server/utils/validateKey'
import type {
  PostAudience,
  Prisma,
  SocialPlatform,
} from '~/prisma/generated/prisma/client'
import { socialPostMutationSelect } from './selects'

type IncomingPost = {
  title?: unknown
  body?: unknown
  mediaUrls?: unknown
  isPublic?: unknown
  isMature?: unknown
  isActive?: unknown
  audience?: PostAudience
  sourceType?: unknown
  sourceId?: unknown
  platforms?: SocialPlatform[]
  designer?: unknown
  scheduledAt?: unknown
}

function normalizeOptionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function normalizeOptionalId(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null

  const id = Number(value)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: 'sourceId must be a positive integer or null when provided.',
    })
  }

  return id
}

function normalizeScheduledAt(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null

  const date = new Date(String(value))

  if (Number.isNaN(date.getTime())) {
    throw createError({
      statusCode: 400,
      message: 'scheduledAt must be a valid date when provided.',
    })
  }

  return date
}

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<IncomingPost | IncomingPost[]>(event)

    if (Array.isArray(body)) {
      throw createError({
        statusCode: 400,
        message:
          'POST /api/socials creates one SocialPost. Coordinate multiple creates through socialStore.',
      })
    }

    const title = normalizeOptionalText(body?.title)
    const postBody = normalizeOptionalText(body?.body)

    if (!title) {
      throw createError({
        statusCode: 400,
        message: 'The "title" field is required.',
      })
    }

    if (!postBody) {
      throw createError({
        statusCode: 400,
        message: 'The "body" field is required.',
      })
    }

    const platforms = Array.isArray(body.platforms)
      ? Array.from(new Set(body.platforms))
      : []
    const data: Prisma.SocialPostCreateInput = {
      title,
      body: postBody,
      mediaUrls: serializeSocialMedia(body.mediaUrls),
      isPublic: body.isPublic === true,
      isMature: body.isMature === true,
      isActive: body.isActive !== false,
      audience: body.audience ?? ('SOCIAL' as PostAudience),
      sourceType: normalizeOptionalText(body.sourceType),
      sourceId: normalizeOptionalId(body.sourceId),
      designer: normalizeOptionalText(body.designer),
      scheduledAt: normalizeScheduledAt(body.scheduledAt),
      status: 'DRAFT',
      User: { connect: { id: user.id } },
      targets: platforms.length
        ? {
            create: platforms.map((platform) => ({
              platform,
              status: 'PENDING' as const,
            })),
          }
        : undefined,
    }

    const created = await prisma.socialPost.create({
      data,
      select: socialPostMutationSelect,
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'SocialPost created successfully.',
      data: created,
      statusCode: 201,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to create SocialPost.',
      data: null,
      statusCode,
    }
  }
})
