// /server/api/stylist/suite.get.ts
// Hair by Superkate suite: owner-scoped client book, galleries, and appointments.
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)

    const [clients, appointments, photos] = await Promise.all([
      prisma.stylistClient.findMany({
        where: { userId: auth.user.id },
        orderBy: { name: 'asc' },
      }),
      prisma.stylistAppointment.findMany({
        where: { userId: auth.user.id },
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
      }),
      prisma.artImage.findMany({
        where: {
          userId: auth.user.id,
          isPublic: false,
          path: { startsWith: 'stylist-client:' },
        },
        select: { id: true, path: true, genres: true, updatedAt: true, createdAt: true },
        orderBy: [{ createdAt: 'desc' }],
      }),
    ])

    const galleries = new Map<number, Array<{ id: number; isPrimary: boolean; version: string }>>()
    for (const photo of photos) {
      const match = photo.path?.match(/^stylist-client:(\d+):gallery:/)
      if (!match) continue
      const clientId = Number(match[1])
      if (!Number.isInteger(clientId)) continue
      let isPrimary = false
      try { isPrimary = Boolean(photo.genres && JSON.parse(photo.genres).isPrimary) } catch { isPrimary = false }
      const list = galleries.get(clientId) || []
      list.push({
        id: photo.id,
        isPrimary,
        version: (photo.updatedAt ?? photo.createdAt).toISOString(),
      })
      galleries.set(clientId, list)
    }

    const clientsWithPhotos = clients.map((client) => {
      const gallery = galleries.get(client.id) || []
      const primary = gallery.find((photo) => photo.isPrimary) || gallery[0]
      return {
        ...client,
        photoCount: gallery.length,
        hasPhoto: gallery.length > 0,
        primaryPhotoId: primary?.id ?? null,
        photoUrl: primary
          ? `/api/stylist/client/${client.id}/photo/${primary.id}?v=${encodeURIComponent(primary.version)}`
          : null,
      }
    })

    return {
      success: true,
      message: `${clients.length} client(s), ${appointments.length} appointment(s).`,
      statusCode: 200,
      data: { clients: clientsWithPhotos, appointments },
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to load the stylist suite.',
    }
  }
})