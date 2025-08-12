// /server/api/pantheon/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'

type CreatePantheonBody = {
  name: string
  slug?: string
  description?: string
  isPublic?: boolean
  isMature?: boolean
  coverArtImageId?: number | null
  chatId?: number | null
  names?: string[]
  imageIds?: number[]
  galleryIds?: number[]
  editorIds?: number[]
  tags?: string[]
}

export default defineEventHandler(async (event) => {
  const modelName = 'pantheon'
  try {
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user?.id) {
      event.node.res.statusCode = 401
      return { success: false, message: 'Unauthorized' }
    }

    const body = await readBody<CreatePantheonBody>(event)
    if (!body?.name?.trim()) {
      event.node.res.statusCode = 400
      return { success: false, message: 'Name is required' }
    }

    const created = await prisma.pantheon.create({
      data: {
        name: body.name.trim(),
        slug: body.slug?.trim() || null,
        description: body.description?.trim() || null,
        isPublic: !!body.isPublic,
        isMature: !!body.isMature,
        userId: user.id,
        coverArtImageId: body.coverArtImageId ?? null,
        chatId: body.chatId ?? null,
        names: Array.isArray(body.names) ? body.names : [],
        imageIds: Array.isArray(body.imageIds) ? body.imageIds : [],
        galleryIds: Array.isArray(body.galleryIds) ? body.galleryIds : [],
        editorIds: Array.isArray(body.editorIds) ? body.editorIds : [],
        tags: Array.isArray(body.tags) ? body.tags : null,
      } as any,
    })

    event.node.res.statusCode = 200
    return { success: true, message: `${modelName} created`, data: created }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to create pantheon',
    }
  }
})
