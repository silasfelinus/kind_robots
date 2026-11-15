import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    const selected = await prisma.artSlot.findMany({
      where: {
        slotKey: { startsWith: 'adverts/' },
        selectedArtImageId: { not: null },
      },
      select: { slotKey: true, selectedArtImageId: true },
    })

    const imageIds = selected
      .map((slot) => slot.selectedArtImageId)
      .filter((id): id is number => id !== null)

    const publicImages = await prisma.artImage.findMany({
      where: {
        id: { in: imageIds },
        isPublic: true,
        isMature: false,
        isActive: true,
      },
      select: { id: true },
    })
    const visibleIds = new Set(publicImages.map((image) => image.id))
    const slots = selected
      .filter(
        (slot) =>
          slot.selectedArtImageId !== null &&
          visibleIds.has(slot.selectedArtImageId),
      )
      .map((slot) => ({
        slotKey: slot.slotKey,
        artImageId: slot.selectedArtImageId!,
      }))

    return {
      success: true,
      message: `${slots.length} public advert art selections.`,
      data: { slots },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Could not read public advert artwork.',
      statusCode: event.node.res.statusCode,
    }
  }
})
