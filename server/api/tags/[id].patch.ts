// /server/api/tags/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Tag } from '@prisma/client'

export default defineEventHandler(async (event) => {
  let response
  let tagId: number | null = null

  try {
    // Parse and validate the Tag ID from the URL params
    tagId = Number(event.context.params?.id)
    if (isNaN(tagId) || tagId <= 0) {
      console.error(`Invalid tag ID provided: ${tagId}`)
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Invalid tag ID. It must be a positive integer.',
      })
    }

    // Extract and validate the authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      console.error('Authorization token is missing or incorrectly formatted.')
      event.node.res.statusCode = 401
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
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id
    console.log(`User ID from token: ${userId}`)

    // Fetch the existing tag to verify ownership
    const existingTag = await prisma.tag.findUnique({
      where: { id: tagId },
      select: { userId: true },
    })

    if (!existingTag) {
      console.error(`Tag with ID ${tagId} does not exist.`)
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: `Tag with ID ${tagId} does not exist.`,
      })
    }

    // Verify ownership of the tag
    if (existingTag.userId !== userId) {
      console.error(
        `User ID ${userId} does not match tag owner ID ${existingTag.userId}`,
      )
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this tag.',
      })
    }

    // Parse and validate request body
    const tagData: Partial<Tag> = await readBody(event)
    if (!tagData || Object.keys(tagData).length === 0) {
      console.error('No data provided for tag update.')
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Update the tag in the database
    const updatedTag = await prisma.tag.update({
      where: { id: tagId },
      data: tagData,
    })

    // Successful update response
    response = {
      success: true,
      tag: updatedTag,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error(`Error updating tag with ID ${tagId}:`, handledError)

    // Set the appropriate status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || `Failed to update tag with ID ${tagId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
