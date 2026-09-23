// /server/api/art/image/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import {
  buildArtImageSelect,
  buildArtImageWhere,
  getArtImageAccessContext,
  type QueryValue,
} from '~/server/utils/artImageAccess'
import { attachGalleryArchiveMediaPaths } from '~/server/utils/artGalleryArchiveMedia'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event) as Record<string, QueryValue>
    const access = await getArtImageAccessContext(event)
    const where = buildArtImageWhere(access)
    const select = buildArtImageSelect(query)

    const data = await prisma.artImage.findMany({
      where,
      select,
      orderBy: { createdAt: 'desc' },
    })

    // An archive-backed row's `path` points inside the private archive root
    // and is not a URL, so the card renders backtree.webp without this. Same
    // helper the collection endpoints use (#3007) -- these endpoints were just
    // never wired to it. The rows have already passed buildArtImageWhere(),
    // which is the gate the byte route itself falls back to, so the signed URL
    // grants nothing the caller did not already have.
    attachGalleryArchiveMediaPaths(
      data as Parameters<typeof attachGalleryArchiveMediaPaths>[0],
    )

    event.node.res.statusCode = 200

    return {
      success: true,
      message: access.isAdmin
        ? 'All accessible art images retrieved for admin.'
        : access.isAuthenticated
          ? `Public and user art images retrieved for user ${access.userId}.`
          : 'Public art images retrieved successfully.',
      data,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to fetch art images.',
      data: [],
    }
  }
})
