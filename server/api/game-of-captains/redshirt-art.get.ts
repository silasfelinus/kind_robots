import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { renderableArtPath } from '~/utils/artImageSrc'
import { galleryThumbnailUrl } from '~/server/utils/artGalleryArchiveMedia'
import {
  curatedRedshirtArtKey,
  isApprovedRedshirtSelection,
} from '~/utils/gameOfCaptains/curatedRedshirtArt'

/**
 * Runtime delivery only, not a candidate review API.
 * An ArtJob marked DONE cannot make its render public. Curators must first
 * select the candidate and mark it liked, and the image must be active,
 * non-mature and public. The static approved portrait stays the fallback.
 */
export default defineEventHandler(async (event) => {
  try {
    const slots = await prisma.artSlot.findMany({
      where: {
        selectedArtImageId: { not: null },
        OR: [
          { slotKey: { startsWith: 'game-of-captains/redshirts/' } },
          {
            projectSlug: 'game-of-captains',
            slotKey: { startsWith: 'redshirts/' },
          },
        ],
      },
      select: {
        slotKey: true,
        selectedArtImageId: true,
        Candidates: {
          select: { artImageId: true, verdict: true },
        },
      },
    })
    const selected = slots
      .map((slot) => ({
        key: curatedRedshirtArtKey(slot.slotKey),
        artImageId: slot.selectedArtImageId,
        liked: isApprovedRedshirtSelection(
          slot.selectedArtImageId,
          slot.Candidates,
        ),
      }))
      .filter(
        (slot): slot is { key: string; artImageId: number; liked: true } =>
          slot.key !== null && slot.artImageId !== null && slot.liked,
      )

    if (!selected.length) return { success: true, data: {} }

    const images = await prisma.artImage.findMany({
      where: {
        id: { in: selected.map((slot) => slot.artImageId) },
        isPublic: true,
        isMature: false,
        isActive: true,
      },
      select: { id: true, imagePath: true, path: true },
    })
    const byId = new Map(images.map((image) => [image.id, image]))
    const sources: Record<string, string> = {}
    for (const slot of selected) {
      const image = byId.get(slot.artImageId)
      if (!image) continue
      sources[slot.key] =
        renderableArtPath(image.imagePath) ||
        renderableArtPath(image.path) ||
        galleryThumbnailUrl(image.id)
    }
    return { success: true, data: sources }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, data: {}, message: handled.message }
  }
})
