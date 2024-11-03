// /server/api/random/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Prisma, RandomList } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Validate authorization token
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
      select: { id: true },
    })

    if (!user) {
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const authenticatedUserId = user.id

    // Read and validate the random list data
    const randomListData = await readBody<Partial<RandomList>>(event)

    // Validate required fields
    if (!randomListData.title || typeof randomListData.title !== 'string') {
      event.node.res.statusCode = 400
      return {
        success: false,
        message: '"title" is a required field and must be a string.',
        statusCode: 400,
      }
    }

    // Verify userId in randomListData matches the authenticated user
    if (
      randomListData.userId &&
      randomListData.userId !== authenticatedUserId
    ) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'User ID in the data does not match the authenticated user.',
      })
    }

    // Create the random list entry, defaulting to the authenticated user's ID
    const newRandomList = await prisma.randomList.create({
      data: {
        title: randomListData.title,
        items: JSON.stringify(randomListData.items || []),
        userId: randomListData.userId ?? authenticatedUserId,
      } as Prisma.RandomListCreateInput,
    })

    event.node.res.statusCode = 201 // Created
    return { success: true, randomList: newRandomList }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: 'Failed to create a new random list',
      error: message || 'An unknown error occurred',
      statusCode: statusCode || 500,
    }
  }
})
