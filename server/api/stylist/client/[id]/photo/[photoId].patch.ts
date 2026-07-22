// /server/api/stylist/client/[id]/photo/[photoId].patch.ts
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '../../../../../utils/prisma'
import { errorHandler } from '../../../../../utils/error'
import { requireApiUser } from '../../../../../utils/authGuard'

function slug(value: unknown, fallback: string): string {
  return (
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || fallback
  )
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const clientId = Number(getRouterParam(event, 'id'))
    const photoId = Number(getRouterParam(event, 'photoId'))
    const prefix = `stylist-client:${clientId}:gallery:`
    const body = (await readBody(event)) as {
      folder?: string
      kind?: string
      caption?: string
      isPrimary?: boolean
    }

    const photo = await prisma.artImage.findFirst({
      where: { id: photoId, userId: auth.user.id, isPublic: false, path: { startsWith: prefix } },
      select: { id: true, genres: true, artPrompt: true },
    })
    if (!photo) throw createError({ statusCode: 404, message: 'Client photo not found.' })

    let metadata: Record<string, unknown> = {}
    try { metadata = photo.genres ? JSON.parse(photo.genres) : {} } catch { metadata = {} }
    const next = {
      ...metadata,
      folder: body.folder === undefined ? metadata.folder || 'general' : slug(body.folder, 'general'),
      kind: body.kind === undefined ? metadata.kind || 'style' : slug(body.kind, 'style'),
      isPrimary: body.isPrimary === undefined ? Boolean(metadata.isPrimary) : Boolean(body.isPrimary),
    }

    if (next.isPrimary) {
      const others = await prisma.artImage.findMany({
        where: { userId: auth.user.id, isPublic: false, path: { startsWith: prefix }, id: { not: photoId } },
        select: { id: true, genres: true },
      })
      await Promise.all(others.map((row) => {
        let other: Record<string, unknown> = {}
        try { other = row.genres ? JSON.parse(row.genres) : {} } catch { other = {} }
        return prisma.artImage.update({ where: { id: row.id }, data: { genres: JSON.stringify({ ...other, isPrimary: false }) } })
      }))
    }

    const updated = await prisma.artImage.update({
      where: { id: photoId },
      data: {
        genres: JSON.stringify(next),
        artPrompt: body.caption === undefined ? photo.artPrompt : String(body.caption || '').trim().slice(0, 500) || null,
      },
      select: { id: true },
    })
    return { success: true, statusCode: 200, message: 'Client photo updated.', data: { photoId: updated.id } }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, statusCode: handled.statusCode || 500, message: handled.message || 'Failed to update client photo.' }
  }
})