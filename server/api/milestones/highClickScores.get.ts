// /server/api/milestones/highClickScores.get.ts

import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async () => {
  let response

  try {
    // Fetch users with a clickRecord greater than 0, ordered by clickRecord descending
    const data = await prisma.user.findMany({
      where: {
        clickRecord: {
          gt: 0,
        },
      },
      orderBy: {
        clickRecord: 'desc',
      },
      select: {
        id: true,
        username: true,
        clickRecord: true,
      },
    })

    // Return success response with user data
    response = {
      success: true,
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    // Handle error and set appropriate response
    const handledError = errorHandler(error)
    console.error('Error fetching high click scores:', handledError)

    response = {
      success: false,
      message: handledError.message || 'Failed to fetch high click scores.',
      statusCode: handledError.statusCode || 500,
    }
  }

  return response
})
