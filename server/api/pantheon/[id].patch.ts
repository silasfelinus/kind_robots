// /server/api/pantheon/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'

type UpdatePantheonBody = Partial<{
  name: string
  slug: string | null
  description: string | null
  isPublic: boolean
  isMature: boolean
  coverArtImageId: number | null
  chatId: number | null
  names: string[]
  imageIds: number[]
  galleryIds: number[]
  editorIds: number[]
  tags: string[] | null
}>

export default defineEventHandler(async (event) => {
  const modelName = 'pantheon'
  try {
    const id = Number(event.context.params?.id)
    if (Number.isNaN(id)) {
      event.node.res.statusCode = 400
      return { success: false, message: 'Invalid id' }
    }

    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user?.id) {
      event.node.res.statusCode = 401
      return { success: false, message: 'Unauthorized' }
    }

    const current = await prisma.pantheon.findUnique({ where: { id } })
    if (!current) {
      event.node.res.statusCode = 404
      return { success: false, message: `${modelName} not found` }
    }

    const isOwner = user.id === current.userId
    const isEditor =
      Array.isArray(current.editorIds) &&
      (current.editorIds as number[]).includes(user.id)
    if (!(isOwner || isEditor)) {
      event.node.res.statusCode = 403
      return { success: false, message: 'Forbidden' }
    }

    const body = await readBody<UpdatePantheonBody>(event)
    const data: any = {}
    if (typeof body.name === 'string') data.name = body.name.trim()
    if (typeof body.slug === 'string' || body.slug === null)
      data.slug = body.slug
    if (typeof body.description === 'string' || body.description === null)
      data.description = body.description
    if (typeof body.isPublic === 'boolean') data.isPublic = body.isPublic
    if (typeof body.isMature === 'boolean') data.isMature = body.isMature
    if (body.coverArtImageId !== undefined)
      data.coverArtImageId = body.coverArtImageId
    if (body.chatId !== undefined) data.chatId = body.chatId
    if (Array.isArray(body.names)) data.names = body.names
    if (Array.isArray(body.imageIds)) data.imageIds = body.imageIds
    if (Array.isArray(body.galleryIds)) data.galleryIds = body.galleryIds
    if (Array.isArray(body.editorIds)) data.editorIds = body.editorIds
    if (Array.isArray(body.tags) || body.tags === null) data.tags = body.tags

    const updated = await prisma.pantheon.update({ where: { id }, data })

    event.node.res.statusCode = 200
    return { success: true, message: `${modelName} updated`, data: updated }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to update pantheon',
    }
  }
})
