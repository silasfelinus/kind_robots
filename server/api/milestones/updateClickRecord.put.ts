// /server/api/milestones/updateClickRecord.put.ts

import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  let response

  try {
    const recordData = await readBody(event)

    // Check if recordData, newScore, and userId exist and are in the correct format
    if (
      !recordData ||
      typeof recordData.newScore !== 'number' ||
      typeof recordData.userId !== 'number'
    ) {
      throw createError({
        statusCode: 400,
        message: 'Invalid JSON body. Ensure newScore and userId are provided.',
      })
    }

    // Update the user's click record score
    const updatedUser = await prisma.user.update({
      where: { id: recordData.userId },
      data: { clickRecord: recordData.newScore },
    })

    // Return success response
    response = {
      success: true,
      message: 'Click record updated successfully.',
      data: { userId: updatedUser.id, newScore: updatedUser.clickRecord },
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error updating click record:', handledError)

    // Set the response and status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to update click record.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
