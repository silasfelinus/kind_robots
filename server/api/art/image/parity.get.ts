// /server/api/art/image/parity.get.ts
//
// Read-only parity audit for ArtImages: how far are we from "every image has a
// home"? Reports counts for the gaps the reverse-sync will close — images with
// no collection, no path to a file, no data at all, or no thumbnail. Pure
// counts (no LongText fetched), so it's cheap even on a large table.
//
// This is the inverse of the folders sync (which guarantees every FILE has a
// row); this measures how many ROWS still lack a location/collection.
// Machine-auth, read-only — safe to run anywhere (including Vercel).
import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireMachineUser } from '~/server/utils/authGuard'

// "empty" = null or the empty string (some legacy rows store '').
const isBlank = (field: 'imagePath' | 'path' | 'imageData' | 'thumbnailData' | 'thumbnailPath') => ({
  OR: [{ [field]: null }, { [field]: '' }],
})

export default defineEventHandler(async (event) => {
  try {
    await requireMachineUser(event)

    const [
      total,
      withoutCollection,
      withoutImagePath,
      withoutAnyPath,
      withoutData,
      unreachable,
      withoutThumbnail,
    ] = await Promise.all([
      prisma.artImage.count(),
      prisma.artImage.count({ where: { ArtCollections: { none: {} } } }),
      prisma.artImage.count({ where: isBlank('imagePath') }),
      prisma.artImage.count({ where: { AND: [isBlank('imagePath'), isBlank('path')] } }),
      prisma.artImage.count({ where: isBlank('imageData') }),
      // No file path AND no bytes in the DB: can't be displayed by anything.
      prisma.artImage.count({
        where: { AND: [isBlank('imagePath'), isBlank('path'), isBlank('imageData')] },
      }),
      prisma.artImage.count({
        where: { AND: [isBlank('thumbnailData'), isBlank('thumbnailPath')] },
      }),
    ])

    return {
      success: true,
      message: `${total} ArtImage(s): ${withoutCollection} without a collection, ${withoutImagePath} without imagePath, ${unreachable} unreachable (no path + no data), ${withoutThumbnail} without a thumbnail.`,
      data: {
        total,
        withoutCollection,
        withCollection: total - withoutCollection,
        withoutImagePath,
        withoutAnyPath,
        withoutData,
        unreachable,
        withoutThumbnail,
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to audit ArtImage parity.',
      statusCode,
    }
  }
})
