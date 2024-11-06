// /server/api/tags/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Tag } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const tagId = Number(event.context.params?.id)
  let response

  try {
    // Validate Tag ID
    if (isNaN(tagId) || tagId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid tag ID. It must be a positive integer.',
      })
    }

    // Extract and Validate Authorization Token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader?.startsWith('Bearer ')) {
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

    // Verify Tag Ownership
    const existingTag = await prisma.tag.findUnique({
      where: { id: tagId },
      select: { userId: true },
    })
    if (!existingTag) {
      throw createError({
        statusCode: 404,
        message: `Tag with ID ${tagId} does not exist.`,
      })
    }
    if (existingTag.userId !== user.id) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this tag.',
      })
    }

    // Read and Validate Update Data
    const tagData: Partial<Tag> = await readBody(event)
    if (!tagData || Object.keys(tagData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Perform Update
    const updatedTag = await prisma.tag.update({
      where: { id: tagId },
      data: tagData,
    })

    // Return Success Response
    response = {
      success: true,
      data: { tag: updatedTag },
      statusCode: 200,
    }
  } catch (error: unknown) {
    // Process Error with Error Handler
    const handledError = errorHandler(error)
    response = {
      success: false,
      message: handledError.message || `Failed to update tag with ID ${tagId}.`,
      statusCode: handledError.statusCode || 500,
    }
  }

  return response
})
