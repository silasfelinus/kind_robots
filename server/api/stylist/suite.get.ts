// /server/api/stylist/suite.get.ts
//
// Hair by Superkate suite: load the authed user's client book and appointment
// history in one call. Private business data — owner-scoped, never public.
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'

const CLIENT_PHOTO_PREFIX = 'stylist-client:'

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
          path: { startsWith: CLIENT_PHOTO_PREFIX },
        },
        select: { id: true, path: true, updatedAt: true, createdAt: true },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      }),
    ])

    const photoByClientId = new Map<number, { id: number; version: string }>()

    for (const photo of photos) {
      const match = photo.path?.match(/^stylist-client:(\d+):profile$/)
      if (!match) continue

      const clientId = Number(match[1])
      if (!Number.isInteger(clientId) || photoByClientId.has(clientId)) continue

      photoByClientId.set(clientId, {
        id: photo.id,
        version: (photo.updatedAt ?? photo.createdAt).toISOString(),
      })
    }

    const clientsWithPhotos = clients.map((client) => {
      const photo = photoByClientId.get(client.id)

      return {
        ...client,
        hasPhoto: Boolean(photo),
        photoId: photo?.id ?? null,
        photoUrl: photo
          ? `/api/stylist/client/${client.id}/photo?v=${encodeURIComponent(photo.version)}`
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