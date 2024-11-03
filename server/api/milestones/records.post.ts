// /server/api/milestones/records.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  let response

  try {
    // Validate the authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
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
      select: { id: true, username: true },
    })

    if (!user) {
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const authenticatedUserId = user.id
    const username = user.username

    // Read and validate the request body
    const recordData = await readBody(event)

    // Validate required fields for milestone creation
    const missingFields = []
    if (typeof recordData?.milestoneId !== 'number')
      missingFields.push('milestoneId')
    if (typeof recordData?.userId !== 'number') missingFields.push('userId')

    if (missingFields.length > 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: `Missing required fields: ${missingFields.join(', ')}.`,
      })
    }

    const { milestoneId, userId } = recordData

    // Verify that userId matches the authenticated user
    if (userId !== authenticatedUserId) {
      event.node.res.statusCode = 403
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
      event.node.res.statusCode = 409 // Conflict
      return {
        success: false,
        message: 'Milestone already awarded to this user.',
        statusCode: 409,
      }
    }

    // Create a new milestone record
    const newRecord = await prisma.milestoneRecord.create({
      data: {
        milestoneId,
        userId,
        username,
      },
    })

    event.node.res.statusCode = 201 // Created
    response = { success: true, record: newRecord, statusCode: 201 }
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to create milestone record.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
