// /server/api/milestones/fetchHighMatchScores.get.ts

import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async () => {
  let response

  try {
    // Fetch users with a matchRecord greater than 0, ordered by matchRecord descending
    const users = await prisma.user.findMany({
      where: {
        matchRecord: {
          gt: 0,
        },
      },
      orderBy: {
        matchRecord: 'desc',
      },
      select: {
        id: true,
        username: true,
        matchRecord: true,
      },
    })

    // Return success response with user data
    response = {
      success: true,
      users,
      statusCode: 200,
    }
  } catch (error: unknown) {
    // Handle error and set appropriate response
    const handledError = errorHandler(error)
    console.error('Error fetching high match scores:', handledError)

    response = {
      success: false,
      message: handledError.message || 'Failed to fetch high match scores.',
      statusCode: handledError.statusCode || 500,
    }
  }

  return response
})
