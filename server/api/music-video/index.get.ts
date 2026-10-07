import { defineEventHandler } from 'h3'
import prisma from '@/server/utils/prisma'
import { getArtImageAccessContext } from '@/server/utils/artImageAccess'
import { errorHandler } from '@/server/utils/error'
import { loadMusicVideoFinals } from '@/server/utils/musicVideo'
import {
  canPlayMusicVideoFinal,
  canViewMusicVideo,
  isMusicVideoOwner,
} from '@/utils/musicVideoAccess'

// Silas, 2026-10-07: the Play tab opens on a gallery. A signed-in viewer gets
// their own videos (drafts and private ones included) plus everyone's public
// finished ones; a visitor gets the public finished ones.
export default defineEventHandler(async (event) => {
  try {
    const viewer = await getArtImageAccessContext(event)
    const shared = { isPublic: true, finalArtImageId: { not: null } }
    const rows = await prisma.musicVideo.findMany({
      where: viewer.userId
        ? { OR: [{ userId: viewer.userId }, shared] }
        : shared,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        userId: true,
        title: true,
        status: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        finalArtImageId: true,
      },
      take: 200,
    })
    const finals = await loadMusicVideoFinals(
      rows.map((row) => row.finalArtImageId),
    )
    const finalOf = (id: number | null) => (id ? finals.get(id) : null) ?? null
    const visible = rows.filter((row) =>
      canViewMusicVideo(row, finalOf(row.finalArtImageId), viewer),
    )
    const owners = await prisma.user.findMany({
      where: { id: { in: [...new Set(visible.map((row) => row.userId))] } },
      select: { id: true, username: true },
    })
    const names = new Map(owners.map((owner) => [owner.id, owner.username]))
    return {
      success: true,
      statusCode: 200,
      message: 'Music videos loaded.',
      data: visible.map((row) => ({
        ...row,
        ownerName: names.get(row.userId) ?? null,
        isOwner: isMusicVideoOwner(row, viewer),
        hasFinal: canPlayMusicVideoFinal(
          row,
          finalOf(row.finalArtImageId),
          viewer,
        ),
      })),
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
