import { defineEventHandler, sendRedirect, setHeader } from 'h3'
import prisma from '~/server/utils/prisma'
import { ADVERT_STUDIO_COVER_SLOT } from '~/utils/adverts/posters'

const FALLBACK_ART = '/images/art/generate.webp'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'public, max-age=120')
  try {
    const slot = await prisma.artSlot.findUnique({
      where: { slotKey: ADVERT_STUDIO_COVER_SLOT },
      select: { selectedArtImageId: true },
    })
    if (slot?.selectedArtImageId) {
      const image = await prisma.artImage.findFirst({
        where: {
          id: slot.selectedArtImageId,
          isPublic: true,
          isMature: false,
          isActive: true,
        },
        select: { id: true },
      })
      if (image)
        return sendRedirect(event, `/api/art/images/${image.id}/file`, 302)
    }
  } catch (error) {
    console.error('Could not resolve Advert Studio cover art:', error)
  }
  return sendRedirect(event, FALLBACK_ART, 302)
})
