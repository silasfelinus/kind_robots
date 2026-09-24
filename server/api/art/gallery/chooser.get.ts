import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { buildArtImageSelect } from '~/server/utils/artImageAccess'
import { attachGalleryArchiveMediaPaths } from '~/server/utils/artGalleryArchiveMedia'

export default defineEventHandler(async (event) => {
  try {
    // Decorative chooser art must always be SFW and public. This endpoint does
    // not discover or count private rows; its only job is to give the two
    // gallery-entry cards harmless artwork without paying the archive query.
    const previews = await prisma.artImage.findMany({
      where: {
        isPublic: true,
        isMature: false,
        isActive: true,
      },
      orderBy: { id: 'desc' },
      take: 2,
      select: buildArtImageSelect(),
    })

    attachGalleryArchiveMediaPaths(previews, 'thumbnail')

    return {
      success: true,
      data: previews,
      message: 'Gallery chooser previews loaded.',
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
