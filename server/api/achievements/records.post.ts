// /server/api/achievements/records.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'
import { requireApiUser } from '../../utils/authGuard'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)
    const authenticatedUserId = user.id
    const username = user.username
    const recordData = await readBody(event)

    const missingFields = []
    if (typeof recordData?.achievementId !== 'number') {
      missingFields.push('achievementId')
    }
    if (typeof recordData?.userId !== 'number') {
      missingFields.push('userId')
    }

    if (missingFields.length > 0) {
      throw createError({
        statusCode: 400,
        message: `Missing required fields: ${missingFields.join(', ')}.`,
      })
    }

    const { achievementId, userId } = recordData

    if (userId !== authenticatedUserId) {
      throw createError({
        statusCode: 403,
        message: 'User ID does not match the authenticated user.',
      })
    }

    const existingRecord = await prisma.achievementRecord.findFirst({
      where: {
        achievementId,
        userId,
      },
    })

    if (existingRecord) {
      return {
        success: false,
        message: 'Achievement already awarded to this user.',
        statusCode: 409,
      }
    }

    const data = await prisma.achievementRecord.create({
      data: {
        achievementId,
        userId,
        username,
      },
    })

    response = {
      success: true,
      message: 'Achievement record created successfully.',
      data,
      statusCode: 201,
    }
    event.node.res.statusCode = 201
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to create achievement record.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
