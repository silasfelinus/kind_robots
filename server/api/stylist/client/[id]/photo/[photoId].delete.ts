// /server/api/stylist/client/[id]/photo/[photoId].delete.ts
import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '../../../../../utils/prisma'
import { errorHandler } from '../../../../../utils/error'
import { requireApiUser } from '../../../../../utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const clientId = Number(getRouterParam(event, 'id'))
    const photoId = Number(getRouterParam(event, 'photoId'))
    const prefix = `stylist-client:${clientId}:gallery:`
    const photo = await prisma.artImage.findFirst({
      where: { id: photoId, userId: auth.user.id, isPublic: false, path: { startsWith: prefix } },
      select: { id: true, genres: true },
    })
    if (!photo) throw createError({ statusCode: 404, message: 'Client photo not found.' })

    let wasPrimary = false
    try { wasPrimary = Boolean(photo.genres && JSON.parse(photo.genres).isPrimary) } catch { wasPrimary = false }
    await prisma.artImage.delete({ where: { id: photoId } })

    if (wasPrimary) {
      const replacement = await prisma.artImage.findFirst({
        where: { userId: auth.user.id, isPublic: false, path: { startsWith: prefix } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, genres: true },
      })
      if (replacement) {
        let metadata: Record<string, unknown> = {}
        try { metadata = replacement.genres ? JSON.parse(replacement.genres) : {} } catch { metadata = {} }
        await prisma.artImage.update({
          where: { id: replacement.id },
          data: { genres: JSON.stringify({ ...metadata, isPrimary: true }) },
        })
      }
    }

    return { success: true, statusCode: 200, message: 'Client photo deleted.' }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, statusCode: handled.statusCode || 500, message: handled.message || 'Failed to delete client photo.' }
  }
})