import { defineEventHandler, readBody, createError } from 'h3'
import prisma from './../utils/prisma'
import { errorHandler } from './../utils/error'
import { validateApiKey } from './../utils/validateKey'
import type { Prisma, SmartIcon } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<Partial<SmartIcon> | Partial<SmartIcon>[]>(
      event,
    )

    // SINGLE: SmartIconCreateInput
    const normalizeSingle = (
      entry: Partial<SmartIcon>,
    ): Prisma.SmartIconCreateInput => {
      if (!entry.title || typeof entry.title !== 'string') {
        throw createError({
          statusCode: 400,
          message: 'The "title" field is required.',
        })
      }
      if (!entry.type || typeof entry.type !== 'string') {
        throw createError({
          statusCode: 400,
          message: 'The "type" field is required.',
        })
      }

      return {
        title: entry.title,
        type: entry.type,
        designer: entry.designer || '',
        icon: entry.icon || '',
        label: entry.label || '',
        description: entry.description || '',
        link: entry.link || '',
        component: entry.component || '',
        isPublic: entry.isPublic ?? true,
        User: { connect: { id: user.id } }, // ✅ for single
      }
    }

    // BATCH: SmartIconCreateManyInput
    const normalizeBatch = (
      entry: Partial<SmartIcon>,
    ): Prisma.SmartIconCreateManyInput => {
      if (!entry.title || typeof entry.title !== 'string') {
        throw createError({
          statusCode: 400,
          message: 'Each entry must have a "title"',
        })
      }
      if (!entry.type || typeof entry.type !== 'string') {
        throw createError({
          statusCode: 400,
          message: 'Each entry must have a "type"',
        })
      }

      return {
        title: entry.title,
        type: entry.type,
        designer: entry.designer || '',
        icon: entry.icon || '',
        label: entry.label || '',
        link: entry.link || '',
        description: entry.description || '',
        component: entry.component || '',
        isPublic: entry.isPublic ?? true,
        userId: user.id, // ✅ for batch
      }
    }

    if (Array.isArray(body)) {
      const entries = body.map(normalizeBatch)
      const data = await prisma.smartIcon.createMany({
        data: entries,
        skipDuplicates: true,
      })

      event.node.res.statusCode = 201
      return {
        success: true,
        data,
        message: `Created ${data.count} SmartIcons.`,
      }
    } else {
      const data = await prisma.smartIcon.create({
        data: normalizeSingle(body),
      })
      event.node.res.statusCode = 201
      return {
        success: true,
        data,
        message: 'SmartIcon created successfully.',
      }
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      data: null,
      message: message || 'Failed to create SmartIcon.',
    }
  }
})
