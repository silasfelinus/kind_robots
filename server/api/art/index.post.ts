// /server/api/art/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import prisma from '../utils/prisma'
import type { Prisma, Art } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Authenticate the user
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const authenticatedUserId = user.id
    const artData = await readBody<Partial<Art>>(event)

    // Validate required "promptString" field
    if (!artData.promptString || typeof artData.promptString !== 'string') {
      event.node.res.statusCode = 400 // Bad Request
      return {
        success: false,
        message: '"promptString" is a required field and must be a string.',
      }
    }

    // Build the data object for Prisma with conditional inclusion of fields
    const data: Prisma.ArtCreateInput = {
      promptString: artData.promptString,
      User: { connect: { id: authenticatedUserId } },
      path: artData.path || 'UNDEFINED',
      createdAt: artData.createdAt || new Date(),
      updatedAt: artData.updatedAt || new Date(),
      steps: artData.steps,
      seed: artData.seed ?? -1,
      cfg: artData.cfg ?? 3,
      isPublic: artData.isPublic ?? false,
      isMature: artData.isMature ?? false,
      cfgHalf: artData.cfgHalf ?? false,
      checkpoint: artData.checkpoint || null,
      sampler: artData.sampler || null,
      designer: artData.designer || null,
      ...(artData.galleryId
        ? { Gallery: { connect: { id: artData.galleryId } } }
        : {}),
      ...(artData.promptId
        ? { Prompt: { connect: { id: artData.promptId } } }
        : {}),
      ...(artData.pitchId
        ? { Pitch: { connect: { id: artData.pitchId } } }
        : {}),
      ...(artData.artImageId
        ? { ArtImage: { connect: { id: artData.artImageId } } }
        : {}),
    }

    // Create the art entry in the database
    const createdArt = await prisma.art.create({ data })

    // Successful response
    event.node.res.statusCode = 201
    return {
      success: true,
      data: createdArt,
      message: 'Art created successfully.',
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: 'Failed to create a new art object.',
      error: message || 'An unknown error occurred',
    }
  }
})
