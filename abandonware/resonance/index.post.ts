// /server/api/resonance/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../../server/api/utils/prisma'
import { errorHandler } from '../../server/api/utils/error'
import { validateApiKey } from '../../server/api/utils/validateKey'
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

    const body = await readBody<Partial<Resonance> | Partial<Resonance>[]>(
      event,
    )

    const normalizeSingle = (
      entry: Partial<Resonance>,
    ): Prisma.ResonanceCreateInput => {
      if (!entry.title || typeof entry.title !== 'string') {
        throw createError({
          statusCode: 400,
          message: 'The "title" field is required and must be a string.',
        })
      }

      return {
        User: { connect: { id: user.id } },
        title: entry.title,
        description: entry.description || '',
        instructions: entry.instructions || '',
        seedText: entry.seedText || '',
        genres: entry.genres || '',
        isPublic: entry.isPublic ?? true,
        isPreset: entry.isPreset ?? false,
        isMature: entry.isMature ?? false,
        iteration: entry.iteration ?? 1000,
        imageMask: entry.imageMask ?? 50,
        creativityRate: entry.creativityRate ?? 50,
        useMicrophone: entry.useMicrophone ?? false,
      }
    }

    const normalizeBatch = (
      entry: Partial<Resonance>,
    ): Prisma.ResonanceCreateManyInput => {
      if (!entry.title || typeof entry.title !== 'string') {
        throw createError({
          statusCode: 400,
          message: 'Each entry must have a "title" field.',
        })
      }

      return {
        userId: user.id,
        title: entry.title,
        description: entry.description || '',
        instructions: entry.instructions || '',
        seedText: entry.seedText || '',
        genres: entry.genres || '',
        isPublic: entry.isPublic ?? true,
        isPreset: entry.isPreset ?? false,
        isMature: entry.isMature ?? false,
        iteration: entry.iteration ?? 1000,
        imageMask: entry.imageMask ?? 50,
        creativityRate: entry.creativityRate ?? 50,
        useMicrophone: entry.useMicrophone ?? false,
      }
    }

    if (Array.isArray(body)) {
      const entries = body.map(normalizeBatch)
      const data = await prisma.resonance.createMany({
        data: entries,
        skipDuplicates: true,
      })

      event.node.res.statusCode = 201
      return {
        success: true,
        data,
        message: `Created ${data.count} Resonances.`,
      }
    } else {
      const data = await prisma.resonance.create({
        data: normalizeSingle(body),
      })

      event.node.res.statusCode = 201
      return {
        success: true,
        data,
        message: 'Resonance created successfully.',
      }
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
