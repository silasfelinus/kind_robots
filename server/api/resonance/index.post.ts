// /server/api/resonance/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from './../utils/error'
import { validateApiKey } from './../utils/validateKey'
import prisma from './../utils/prisma'
import type { Prisma, Resonance } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const authenticatedUserId = user.id

    const resonanceData = await readBody<Partial<Resonance>>(event)

    // Validate required fields
    if (!resonanceData.title || typeof resonanceData.title !== 'string') {
      event.node.res.statusCode = 400
      return {
        success: false,
        data: null,
        message: 'The "title" field is required and must be a string.',
      }
    }

    const fullData: Prisma.ResonanceCreateInput = {
      User: { connect: { id: authenticatedUserId } },
      title: resonanceData.title,
      description: resonanceData.description || '',
      instructions: resonanceData.instructions || '',
      seedText: resonanceData.seedText || '',
      genres: resonanceData.genres || '',
      isPublic: resonanceData.isPublic ?? true,
      isPreset: resonanceData.isPreset ?? false,
      isMature: resonanceData.isMature ?? false,
      iteration: resonanceData.iteration ?? 1000,
      imageMask: resonanceData.imageMask ?? 50,
      creativityRate: resonanceData.creativityRate ?? 50,
      useMicrophone: resonanceData.useMicrophone ?? false,
    }

    const data = await prisma.resonance.create({
      data: fullData,
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      data,
      message: 'Resonance created successfully.',
    }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      data: null,
      message: message || 'Failed to create resonance.',
    }
  }
})
