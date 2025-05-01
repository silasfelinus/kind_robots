// /server/api/[model]/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { Prisma, SampleModel } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const modelName = 'sampleModel' // update this
  const singularLabel = 'SampleModel'
  const pluralLabel = 'SampleModels'

  try {
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({ statusCode: 401, message: 'Invalid or expired token.' })
    }

    const body = await readBody<Partial<SampleModel> | Partial<SampleModel>[]>(event)

    // Normalize single entry
    const normalizeSingle = (entry: Partial<SampleModel>): Prisma.SampleModelCreateInput => {
      if (!entry.title || typeof entry.title !== 'string') {
        throw createError({ statusCode: 400, message: 'The "title" field is required.' })
      }
      if (!entry.type || typeof entry.type !== 'string') {
        throw createError({ statusCode: 400, message: 'The "type" field is required.' })
      }

      return {
        title: entry.title,
        type: entry.type,
        icon: entry.icon || '',
        label: entry.label || '',
        link: entry.link || '',
        component: entry.component || '',
        isPublic: entry.isPublic ?? true,
        designer: entry.designer || '',
        User: { connect: { id: user.id } },
      }
    }

    // Normalize batch entry
    const normalizeBatch = (entry: Partial<SampleModel>): Prisma.SampleModelCreateManyInput => {
      if (!entry.title || typeof entry.title !== 'string') {
        throw createError({ statusCode: 400, message: 'Each entry must have a "title"' })
      }
      if (!entry.type || typeof entry.type !== 'string') {
        throw createError({ statusCode: 400, message: 'Each entry must have a "type"' })
      }

      return {
        title: entry.title,
        type: entry.type,
        icon: entry.icon || '',
        label: entry.label || '',
        link: entry.link || '',
        component: entry.component || '',
        isPublic: entry.isPublic ?? true,
        designer: entry.designer || '',
        userId: user.id,
      }
    }

    // Batch creation
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

    // Single creation
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
