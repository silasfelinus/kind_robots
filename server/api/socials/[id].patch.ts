// /server/api/socials/[id].patch.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { serializeSocialMedia } from '@/server/utils/socialMedia'
import { validateApiKey } from '@/server/utils/validateKey'
import type {
  PostAudience,
  PostStatus,
  Prisma,
  SocialPlatform,
  TargetStatus,
} from '~/prisma/generated/prisma/client'
import { socialPostMutationSelect } from './selects'

type PatchBody = Partial<{
  title: string
  body: string
  mediaUrls: unknown
  isPublic: boolean
  isMature: boolean
  isActive: boolean
  audience: PostAudience
  status: PostStatus
  sourceType: string | null
  sourceId: number | null
  scheduledAt: string | Date | null
  designer: string | null
  platforms: SocialPlatform[]
  targetUpdate: { platform: SocialPlatform; status: TargetStatus }
}>

function normalizeOptionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function normalizeOptionalId(value: unknown): number | null {
  if (value === null || value === '') return null

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
  if (value === null || value === '') return null

  const date = new Date(String(value))

  if (Number.isNaN(date.getTime())) {
    throw createError({
      statusCode: 400,
      message: 'scheduledAt must be a valid date or null when provided.',
    })
  }

  return date
}

export default defineEventHandler(async (event) => {
  let id = 0

  try {
    id = Number(event.context.params?.id)

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid SocialPost ID. It must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const existing = await prisma.socialPost.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!existing) {
      throw createError({ statusCode: 404, message: 'SocialPost not found.' })
    }

    if (existing.userId !== user.id && user.Role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this SocialPost.',
      })
    }

    const patch = await readBody<PatchBody>(event)

    if (!patch || Object.keys(patch).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    const { platforms, targetUpdate } = patch

    if (targetUpdate?.platform && targetUpdate?.status) {
      await prisma.socialTarget.updateMany({
        where: { postId: id, platform: targetUpdate.platform },
        data: { status: targetUpdate.status },
      })
    }

    if (Array.isArray(platforms)) {
      const wanted = Array.from(new Set(platforms))
      const current = await prisma.socialTarget.findMany({
        where: { postId: id },
        select: { platform: true },
      })
      const currentSet = new Set(current.map((target) => target.platform))
      const toAdd = wanted.filter((platform) => !currentSet.has(platform))
      const toRemove = [...currentSet].filter(
        (platform) => !wanted.includes(platform),
      )

      if (toAdd.length) {
        await prisma.socialTarget.createMany({
          data: toAdd.map((platform) => ({
            postId: id,
            platform,
            status: 'PENDING' as const,
          })),
          skipDuplicates: true,
        })
      }

      if (toRemove.length) {
        await prisma.socialTarget.deleteMany({
          where: { postId: id, platform: { in: toRemove } },
        })
      }
    }

    const data: Prisma.SocialPostUpdateInput = {}

    if (patch.title !== undefined) {
      const title = normalizeOptionalText(patch.title)

      if (!title) {
        throw createError({
          statusCode: 400,
          message: 'The "title" field cannot be empty.',
        })
      }

      data.title = title
    }

    if (patch.body !== undefined) {
      const body = normalizeOptionalText(patch.body)

      if (!body) {
        throw createError({
          statusCode: 400,
          message: 'The "body" field cannot be empty.',
        })
      }

      data.body = body
    }

    if (patch.mediaUrls !== undefined) {
      data.mediaUrls = serializeSocialMedia(patch.mediaUrls)
    }

    if (patch.isPublic !== undefined) data.isPublic = patch.isPublic
    if (patch.isMature !== undefined) data.isMature = patch.isMature
    if (patch.isActive !== undefined) data.isActive = patch.isActive
    if (patch.audience !== undefined) data.audience = patch.audience
    if (patch.status !== undefined) data.status = patch.status
    if (patch.sourceType !== undefined) {
      data.sourceType = normalizeOptionalText(patch.sourceType)
    }
    if (patch.sourceId !== undefined) {
      data.sourceId = normalizeOptionalId(patch.sourceId)
    }
    if (patch.scheduledAt !== undefined) {
      data.scheduledAt = normalizeScheduledAt(patch.scheduledAt)
    }
    if (patch.designer !== undefined) {
      data.designer = normalizeOptionalText(patch.designer)
    }

    const updated = await prisma.socialPost.update({
      where: { id },
      data,
      select: socialPostMutationSelect,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'SocialPost updated successfully.',
      data: updated,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode

    return {
      success: false,
      message:
        handled.message || `Failed to update SocialPost with ID ${id || 'unknown'}.`,
      data: null,
      statusCode,
    }
  }
})
