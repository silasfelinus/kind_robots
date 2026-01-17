// @ts-nocheck
/* eslint-disable */
// test-ignore

// /server/api/[model]/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { Prisma, SampleModel } from '~/prisma/generated/prisma/client'

export default defineEventHandler(async (event) => {
  const modelName = 'sampleModel' // Prisma model name
  const singularLabel = 'SampleModel'
  const pluralLabel = 'SampleModels'

  try {
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<Partial<SampleModel> | Partial<SampleModel>[]>(
      event,
    )
    const userId = user.id

    const normalize = (
      entry: Partial<SampleModel>,
    ): Prisma.SampleModelCreateInput => {
      const { title, type, icon, label, link, component, isPublic, designer } =
        entry

      if (!title || typeof title !== 'string') {
        throw createError({
          statusCode: 400,
          message: 'The "title" field is required.',
        })
      }
      if (!type || typeof type !== 'string') {
        throw createError({
          statusCode: 400,
          message: 'The "type" field is required.',
        })
      }

      return {
        title,
        type,
        icon: icon || '',
        label: label || '',
        link: link || '',
        component: component || '',
        isPublic: isPublic ?? true,
        designer: designer || '',
        User: { connect: { id: userId } },
      }
    }

    // Handle batch creation
    if (Array.isArray(body)) {
      const created: SampleModel[] = []
      const skipped: string[] = []

      for (const entry of body) {
        const data = normalize(entry)

        try {
          const result = await prisma[modelName].create({ data })
          created.push(result)
        } catch (err: any) {
          if (err.code === 'P2002') {
            skipped.push(data.title)
          } else {
            throw err
          }
        }
      }

      event.node.res.statusCode = 201
      return {
        success: true,
        message: `${created.length} ${pluralLabel} created, ${skipped.length} skipped.`,
        data: created,
        skipped,
        count: created.length,
        statusCode: 201,
      }
    }

    // Single creation
    const data = await prisma[modelName].create({
      data: normalize(body),
    })

    event.node.res.statusCode = 201
    return {
      success: true,
      message: `${singularLabel} created successfully.`,
      data,
      statusCode: 201,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || `Failed to create ${singularLabel}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
