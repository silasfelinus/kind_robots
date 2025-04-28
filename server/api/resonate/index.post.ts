// /server/api/resonate/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from './../utils/error'
import { validateApiKey } from './../utils/validateKey'
import prisma from './../utils/prisma'
import type { Prisma, Resonate } from '@prisma/client'

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

    const resonateData = await readBody<Partial<Resonate>>(event)

    // Validate required fields
    if (!resonateData.title || typeof resonateData.title !== 'string') {
      event.node.res.statusCode = 400
      return {
        success: false,
        data: null,
        message: 'The "title" field is required and must be a string.',
      }
    }

    if (!resonateData.imagePath || typeof resonateData.imagePath !== 'string') {
      event.node.res.statusCode = 400
      return {
        success: false,
        data: null,
        message: 'The "imagePath" field is required and must be a string.',
      }
    }

    const fullData: Prisma.ResonateCreateInput = {
      User: { connect: { id: authenticatedUserId } },
      title: resonateData.title,
      description: resonateData.description || '',
      imagePath: resonateData.imagePath,
      audioPath: resonateData.audioPath || '',
      chapterData: resonateData.chapterData || '',
      genres: resonateData.genres || '',
      isPublic: resonateData.isPublic ?? true,
    }

    const data = await prisma.resonate.create({
      data: fullData,
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      data,
      message: 'Resonate created successfully.',
    }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      data: null,
      message: message || 'Failed to create resonate.',
    }
  }
})
