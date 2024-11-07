// /server/api/tags/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import prisma from '../utils/prisma'
import type { Prisma, Tag } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Use validateApiKey to authenticate
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const authenticatedUserId = user.id
    const tagData = await readBody<Partial<Tag>>(event)

    if (!tagData.title || !tagData.label) {
      event.node.res.statusCode = 400 // Set HTTP status code to 400 for validation error
      return {
        success: false,
        data: null,
        message: '"title" and "label" are required fields.',
      }
    }

    tagData.userId = authenticatedUserId

    // Create the tag and ensure the response contains a 201 status
    const data = await prisma.tag.create({
      data: tagData as Prisma.TagCreateInput,
    })

    event.node.res.statusCode = 201 // Set HTTP status code to 201 for successful creation
    return {
      success: true,
      data,
      message: 'Tag created successfully',
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500 // Set appropriate error status code
    return {
      success: false,
      data: null,
      message: 'Failed to create a new tag',
      error: message || 'An unknown error occurred',
    }
  }
})
