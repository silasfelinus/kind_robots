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

    const normalize = (
      entry: Partial<SmartIcon>,
    ): Prisma.SmartIconCreateInput => {
      if (!entry.title || typeof entry.title !== 'string') {
        throw createError({
          statusCode: 400,
          message: 'The "title" field is required and must be a string.',
        })
      }
      if (!entry.type || typeof entry.type !== 'string') {
        throw createError({
          statusCode: 400,
          message: 'The "type" field is required and must be a string.',
        })
      }

      return {
        title: entry.title,
        type: entry.type,
        designer: entry.designer || '',
        icon: entry.icon || '',
        label: entry.label || '',
        link: entry.link || '',
        component: entry.component || '',
        isPublic: entry.isPublic ?? true,
        User: { connect: { id: user.id } },
      }
    }

    let data

    if (Array.isArray(body)) {
      const entries = body.map(normalize)
      data = await prisma.smartIcon.createMany({
        data: entries.map((entry) => ({
          ...entry,
          userId: user.id, // Prisma createMany doesn't support relation objects
        })),
        skipDuplicates: true,
      })
      event.node.res.statusCode = 201
      return {
        success: true,
        data,
        message: `Batch created ${entries.length} SmartIcons.`,
      }
    } else {
      const icon = normalize(body)
      const created = await prisma.smartIcon.create({ data: icon })
      event.node.res.statusCode = 201
      return {
        success: true,
        data: created,
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
