// /server/api/stylist/client/[id]/gallery.get.ts
import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import { requireApiUser } from '../../../../utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const clientId = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(clientId) || clientId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid client id.' })
    }

    const client = await prisma.stylistClient.findUnique({ where: { id: clientId } })
    if (!client || client.userId !== auth.user.id) {
      throw createError({ statusCode: 404, message: `Client ${clientId} not found.` })
    }

    const prefix = `stylist-client:${clientId}:gallery:`
    const rows = await prisma.artImage.findMany({
      where: { userId: auth.user.id, isPublic: false, path: { startsWith: prefix } },
      select: { id: true, fileName: true, fileType: true, artPrompt: true, genres: true, createdAt: true, updatedAt: true },
      orderBy: [{ createdAt: 'desc' }],
    })

    const photos = rows.map((row) => {
      let metadata: { folder?: string; kind?: string; isPrimary?: boolean } = {}
      try { metadata = row.genres ? JSON.parse(row.genres) : {} } catch { metadata = {} }
      return {
        id: row.id,
        fileName: row.fileName,
        fileType: row.fileType,
        caption: row.artPrompt || '',
        folder: metadata.folder || 'general',
        kind: metadata.kind || 'style',
        isPrimary: Boolean(metadata.isPrimary),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        imageUrl: `/api/stylist/client/${clientId}/photo/${row.id}`,
      }
    })

    return { success: true, statusCode: 200, message: `${photos.length} photo(s).`, data: { client, photos } }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, statusCode: handled.statusCode || 500, message: handled.message || 'Failed to load client gallery.' }
  }
})