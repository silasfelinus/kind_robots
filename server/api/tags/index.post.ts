// /server/api/tags/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import type { Prisma, Tag } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })

    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const authenticatedUserId = user.id
    const tagData = await readBody<Partial<Tag>>(event)

    if (!tagData.title || !tagData.label) {
      return {
        success: false,
        data: null,
        message: '"title" and "label" are required fields.',
        statusCode: 400,
      }
    }

    tagData.userId = authenticatedUserId

    // Consolidate the tag creation here and set status code to 201
    const tag = await prisma.tag.create({
      data: tagData as Prisma.TagCreateInput,
    })
    return {
      success: true,
      data: tag,
      message: 'Tag created successfully',
      statusCode: 201, // Ensure 201 status for successful creation
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    return {
      success: false,
      data: null,
      message: 'Failed to create a new tag',
      error: message || 'An unknown error occurred',
      statusCode: statusCode || 500,
    }
  }
})
