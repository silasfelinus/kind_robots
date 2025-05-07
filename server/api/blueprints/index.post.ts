// /server/api/blueprints/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import type { Prisma, Blueprint } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const modelName = 'blueprint'
  const singularLabel = 'Blueprint'
  const pluralLabel = 'Blueprints'

  try {
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<Partial<Blueprint> | Partial<Blueprint>[]>(
      event,
    )

    const normalizeSingle = (
      entry: Partial<Blueprint>,
    ): Prisma.BlueprintCreateInput => {
      if (!entry.title || typeof entry.title !== 'string') {
        throw createError({
          statusCode: 400,
          message: 'The "title" field is required.',
        })
      }

      return {
        title: entry.title,
        description: entry.description ?? '',
        isPublic: entry.isPublic ?? true,
        isMature: entry.isMature ?? false,
        steps: entry.steps ?? [],
        coverArt: entry.coverArtId
          ? { connect: { id: entry.coverArtId } }
          : undefined,
        User: { connect: { id: user.id } },
        tags: undefined, // Optional: Add logic if tag handling is implemented
      }
    }

    const normalizeBatch = (
      entry: Partial<Blueprint>,
    ): Prisma.BlueprintCreateManyInput => {
      if (!entry.title || typeof entry.title !== 'string') {
        throw createError({
          statusCode: 400,
          message: 'Each entry must have a "title"',
        })
      }

      return {
        title: entry.title,
        description: entry.description ?? '',
        isPublic: entry.isPublic ?? true,
        isMature: entry.isMature ?? false,
        steps: entry.steps ?? [],
        coverArtId: entry.coverArtId ?? null,
        userId: user.id,
        // tags can't be included in createMany
      }
    }

    if (Array.isArray(body)) {
      const entries = body.map(normalizeBatch)
      const data = await prisma[modelName].createMany({
        data: entries,
        skipDuplicates: true,
      })

      event.node.res.statusCode = 201
      return {
        success: true,
        data,
        message: `Created ${data.count} ${pluralLabel}.`,
        statusCode: 201,
      }
    }

    const data = await prisma[modelName].create({
      data: normalizeSingle(body),
    })

    event.node.res.statusCode = 201
    return {
      success: true,
      data,
      message: `${singularLabel} created successfully.`,
      statusCode: 201,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      data: null,
      message: message || `Failed to create ${singularLabel}.`,
      statusCode: event.node.res.statusCode,
    }
  }
})
