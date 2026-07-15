// /server/api/socials/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { serializeSocialMedia } from '@/server/utils/socialMedia'
import { validateApiKey } from '@/server/utils/validateKey'
import type {
  Prisma,
  SocialPlatform,
  PostAudience,
} from '~/prisma/generated/prisma/client'

type IncomingPost = {
  title?: string
  body?: string
  mediaUrls?: unknown
  isPublic?: boolean
  isMature?: boolean
  audience?: PostAudience
  sourceType?: string | null
  sourceId?: number | null
  platforms?: SocialPlatform[]
  designer?: string | null
}

export default defineEventHandler(async (event) => {
  const singularLabel = 'SocialPost'
  const pluralLabel = 'SocialPosts'

  try {
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }
    const userId = user.id

    const body = await readBody<IncomingPost | IncomingPost[]>(event)

    const buildCreate = (entry: IncomingPost): Prisma.SocialPostCreateInput => {
      const {
        title,
        body: postBody,
        mediaUrls,
        isPublic,
        isMature,
        audience,
        sourceType,
        sourceId,
        platforms,
        designer,
      } = entry

      if (!title || typeof title !== 'string') {
        throw createError({
          statusCode: 400,
          message: 'The "title" field is required.',
        })
      }
      if (!postBody || typeof postBody !== 'string') {
        throw createError({
          statusCode: 400,
          message: 'The "body" field is required.',
        })
      }

      const uniquePlatforms = Array.from(new Set(platforms ?? []))

      return {
        title,
        body: postBody,
        mediaUrls: serializeSocialMedia(mediaUrls),
        isPublic: isPublic ?? false,
        isMature: isMature ?? false,
        audience: audience ?? ('SOCIAL' as PostAudience),
        sourceType: sourceType ?? null,
        sourceId: sourceId ?? null,
        designer: designer ?? null,
        status: 'DRAFT',
        User: { connect: { id: userId } },
        targets: uniquePlatforms.length
          ? {
              create: uniquePlatforms.map((platform) => ({
                platform,
                status: 'PENDING' as const,
              })),
            }
          : undefined,
      }
    }

    if (Array.isArray(body)) {
      const created = []
      const skipped: string[] = []
      for (const entry of body) {
        const data = buildCreate(entry)
        try {
          const result = await prisma.socialPost.create({
            data,
            include: { targets: true },
          })
          created.push(result)
        } catch (err: any) {
          if (err.code === 'P2002') skipped.push(data.title)
          else throw err
        }
      }
      event.node.res.statusCode = 201
      return {
        success: true,
        message: `${created.length} ${pluralLabel} created, ${skipped.length} skipped.`,
        data: created,
        skipped,
        count: created.length,
        statusCode: 201,
      }
    }

    const data = await prisma.socialPost.create({
      data: buildCreate(body),
      include: { targets: true },
    })
    event.node.res.statusCode = 201
    return {
      success: true,
      message: `${singularLabel} created successfully.`,
      data,
      statusCode: 201,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || 'Failed to create SocialPost.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
