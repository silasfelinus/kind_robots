// /server/api/random/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Prisma, RandomList } from '@prisma/client'

export default defineEventHandler(async (event) => {
  let response

  try {
    // Validate the authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      event.node.res.statusCode = 401 // Unauthorized
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
      event.node.res.statusCode = 401 // Unauthorized
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const authenticatedUserId = user.id

    // Read and validate the random list data from the request body
    const randomListData: Partial<RandomList> = await readBody(event)

    // Check for required fields
    if (!randomListData.title || typeof randomListData.title !== 'string') {
      event.node.res.statusCode = 400 // Bad Request
      throw createError({
        statusCode: 400,
        message: '"title" is a required field and must be a string.',
      })
    }

    // Ensure the provided userId matches the authenticated user's ID, if specified
    if (
      randomListData.userId &&
      randomListData.userId !== authenticatedUserId
    ) {
      event.node.res.statusCode = 403 // Forbidden
      throw createError({
        statusCode: 403,
        message: 'User ID in the data does not match the authenticated user.',
      })
    }

    // Prepare data for new random list creation
    const newRandomListData: Prisma.RandomListCreateInput = {
      title: randomListData.title,
      items: JSON.stringify(randomListData.items || []),
      User: { connect: { id: authenticatedUserId } },
    }

    // Create the new random list
    const newRandomList = await prisma.randomList.create({
      data: newRandomListData,
    })

    // Set status code to 201 Created
    event.node.res.statusCode = 201
    response = { success: true, randomList: newRandomList, statusCode: 201 }
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to create a new random list.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
