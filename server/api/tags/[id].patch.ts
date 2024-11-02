// /server/api/tags/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Tag } from '@prisma/client'

export default defineEventHandler(async (event) => {
  let response
  const tagId = Number(event.context.params?.id)

  try {
    // Validate Tag ID
    if (isNaN(tagId) || tagId <= 0) {
      console.error(`Invalid tag ID provided: ${tagId}`)
      throw createError({
        statusCode: 400,
        message: 'Invalid tag ID. It must be a positive integer.',
      })
    }

    // Extract and Validate Authorization Token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader?.startsWith('Bearer ')) {
      console.error('Authorization token is missing or incorrectly formatted.')
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
      console.error(`Invalid or expired token: ${token}`)
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
      console.error(`Tag with ID ${tagId} does not exist.`)
      throw createError({
        statusCode: 404,
        message: `Tag with ID ${tagId} does not exist.`,
      })
    }
    if (existingTag.userId !== user.id) {
      console.error(
        `User ${user.id} does not have permission to update tag ${tagId}`,
      )
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this tag.',
      })
    }

    // Read and Validate Update Data
    const tagData: Partial<Tag> = await readBody(event)
    if (!tagData || Object.keys(tagData).length === 0) {
      console.error('No data provided for tag update.')
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
      tag: updatedTag,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    // Process Error with Error Handler
    const handledError = errorHandler(error)
    console.error(`Error updating tag with ID ${tagId}:`, handledError)

    // Set Response with Error Information
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || `Failed to update tag with ID ${tagId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
