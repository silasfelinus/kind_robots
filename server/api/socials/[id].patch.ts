// /server/api/socials/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type {
  Prisma,
  SocialPlatform,
  TargetStatus,
} from '~/prisma/generated/prisma/client'

type PatchBody = Partial<{
  title: string
  body: string
  mediaUrls: unknown
  isPublic: boolean
  status: string
  sourceType: string | null
  sourceId: number | null
  designer: string | null
  platforms: SocialPlatform[]
  targetUpdate: { platform: SocialPlatform; status: TargetStatus }
}>

function serializeMediaUrls(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    return JSON.stringify(
      value.filter((item): item is string => typeof item === 'string'),
    )
  }

  throw createError({
    statusCode: 400,
    message: 'The "mediaUrls" field must be a string or an array of strings.',
  })
}

export default defineEventHandler(async (event) => {
  let id: number | undefined
  let response

  try {
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid SocialPost ID. It must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({ statusCode: 401, message: 'Invalid or expired token.' })
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
      throw createError({ statusCode: 400, message: 'No data provided for update.' })
    }

    const { platforms, targetUpdate, mediaUrls, ...scalarRaw } = patch

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
            postId: id!,
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

    const scalarData = scalarRaw as Prisma.SocialPostUpdateInput
    if (mediaUrls !== undefined) {
      scalarData.mediaUrls = serializeMediaUrls(mediaUrls)
    }

    const data = await prisma.socialPost.update({
      where: { id },
      data: scalarData,
      include: { targets: true },
    })

    event.node.res.statusCode = 200
    response = {
      success: true,
      message: 'SocialPost updated successfully.',
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    response = {
      success: false,
      message: handled.message || `Failed to update SocialPost with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
