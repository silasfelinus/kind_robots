// /server/api/icons/index.post.ts
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

    const iconData = await readBody<Partial<SmartIcon>>(event)

    if (!iconData.title || typeof iconData.title !== 'string') {
      event.node.res.statusCode = 400
      return {
        success: false,
        data: null,
        message: 'The "title" field is required and must be a string.',
      }
    }

    if (!iconData.type || typeof iconData.type !== 'string') {
      event.node.res.statusCode = 400
      return {
        success: false,
        data: null,
        message: 'The "type" field is required and must be a string.',
      }
    }

    const fullData: Prisma.SmartIconCreateInput = {
      title: iconData.title,
      type: iconData.type,
      designer: iconData.designer || '',
      icon: iconData.icon || '',
      label: iconData.label || '',
      link: iconData.link || '',
      component: iconData.component || '',
      isPublic: iconData.isPublic ?? true,
      User: { connect: { id: user.id } },
    }

    const data = await prisma.smartIcon.create({ data: fullData })

    event.node.res.statusCode = 201
    return {
      success: true,
      data,
      message: 'SmartIcon created successfully.',
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
