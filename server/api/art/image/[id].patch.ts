// server/api/art/image/[id].patch.ts
// EXTENDED version — replaces the existing stub-only implementation.
// Now accepts the full ArtImage metadata payload needed by art-doctor.vue.

import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'

// Fields that art-doctor is allowed to sync from Art into ArtImage.
// imageData and thumbnailData are handled separately (they're bulk data).
const ALLOWED_META_FIELDS = new Set([
  'imageData', // still allowed for direct image updates
  'thumbnailData', // art-doctor thumbnail generation
  'fileName',
  'fileType',
  'imagePath',
  'promptString',
  'negativePrompt',
  'checkpoint',
  'sampler',
  'seed',
  'steps',
  'cfg',
  'cfgHalf',
  'designer',
  'genres',
  'serverId',
  'serverName',
  'serverUrl',
  'isPublic',
  'isMature',
  'galleryId',
  'artId',
  'rarity',
])

export default defineEventHandler(async (event) => {
  let response
  let imageId: number | null = null

  try {
    imageId = Number(event.context.params?.id)
    if (isNaN(imageId) || imageId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid image ID.' })
    }

    // Auth
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message: 'Authorization token required.',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true, Role: true },
    })

    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const artImage = await prisma.artImage.findUnique({
      where: { id: imageId },
    })
    if (!artImage) {
      throw createError({
        statusCode: 404,
        message: `ArtImage #${imageId} not found.`,
      })
    }

    // Admins can patch any image; others must own it
    const isAdmin = user.Role === 'ADMIN' || user.Role === 'SYSTEM'
    if (!isAdmin && artImage.userId !== user.id) {
      throw createError({ statusCode: 403, message: 'Permission denied.' })
    }

    const body = await readBody(event)

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      throw createError({ statusCode: 400, message: 'Request body is empty.' })
    }

    // Filter to only allowed fields
    const updateData: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(body)) {
      if (ALLOWED_META_FIELDS.has(key)) {
        updateData[key] = value
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No valid fields provided.',
      })
    }

    const data = await prisma.artImage.update({
      where: { id: imageId },
      data: updateData,
    })

    response = { success: true, data, message: 'ArtImage updated.' }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || `Failed to update ArtImage #${imageId}.`,
    }
  }

  return response
})
