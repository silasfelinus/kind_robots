// /server/api/tags/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import type { Tag } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const tagId = Number(event.context.params?.id)

  try {
    // Validate Tag ID
    if (isNaN(tagId) || tagId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid tag ID. It must be a positive integer.',
      })
    }

    // Use validateApiKey to authenticate
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      event.node.res.statusCode = 401 // Set HTTP status code to 401 Unauthorized
      return {
        success: false,
        message: 'Invalid or expired token.',
      }
    }

    // Verify Tag Ownership
    const existingTag = await prisma.tag.findUnique({
      where: { id: tagId },
      select: { userId: true },
    })
    if (!existingTag) {
      event.node.res.statusCode = 404 // Set HTTP status code to 404 Not Found
      return {
        success: false,
        message: `Tag with ID ${tagId} does not exist.`,
      }
    }
    if (existingTag.userId !== user.id) {
      event.node.res.statusCode = 403 // Set HTTP status code to 403 Forbidden
      return {
        success: false,
        message: 'You do not have permission to update this tag.',
      }
    }

    // Read and Validate Update Data
    const tagData: Partial<Tag> = await readBody(event)
    if (!tagData || Object.keys(tagData).length === 0) {
      event.node.res.statusCode = 400 // Set HTTP status code to 400 Bad Request
      return {
        success: false,
        message: 'No data provided for update.',
      }
    }

    // Perform Update
    const updatedTag = await prisma.tag.update({
      where: { id: tagId },
      data: tagData,
    })

    // Set Success Response Status Code to 200
    event.node.res.statusCode = 200
    return {
      success: true,
      data: updatedTag,
    }
  } catch (error: unknown) {
    // Process Error with Error Handler
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500 // Set appropriate error status code
    return {
      success: false,
      message: message || `Failed to update tag with ID ${tagId}.`,
    }
  }
})
