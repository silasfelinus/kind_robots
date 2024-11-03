// /server/api/milestones/records.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Validate authorization token
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
      select: { id: true, username: true },
    })

    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const authenticatedUserId = user.id
    const username = user.username

    // Read and validate the request body
    const recordData = await readBody(event)

    if (
      !recordData ||
      typeof recordData.milestoneId !== 'number' ||
      typeof recordData.userId !== 'number'
    ) {
      throw createError({
        statusCode: 400,
        message:
          'Invalid data. "milestoneId" and "userId" must be provided as integers.',
      })
    }

    const { milestoneId, userId } = recordData

    // Verify that the userId in the recordData matches the authenticated user
    if (userId !== authenticatedUserId) {
      throw createError({
        statusCode: 403,
        message: 'User ID does not match the authenticated user.',
      })
    }

    // Check if the milestone record already exists for the user
    const existingRecord = await prisma.milestoneRecord.findFirst({
      where: {
        milestoneId,
        userId,
      },
    })

    if (existingRecord) {
      return {
        success: false,
        message: 'Milestone already awarded to this user.',
        statusCode: 409, // Conflict
      }
    }

    // Create a new milestone record, including the username for readability
    const newRecord = await prisma.milestoneRecord.create({
      data: {
        milestoneId,
        userId,
        username,
      },
    })

    event.node.res.statusCode = 201 // Created
    return { success: true, record: newRecord }
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    return {
      success: false,
      message: 'Failed to create milestone record.',
      error: handledError.message,
      statusCode: handledError.statusCode || 500,
    }
  }
})
