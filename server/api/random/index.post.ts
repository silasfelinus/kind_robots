// /server/api/random/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import type { Prisma, RandomList } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Validate authorization token
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
    const randomListData = await readBody(event)

    // Handle multiple or single RandomList creation
    const result = Array.isArray(randomListData)
      ? await addRandomLists(randomListData, authenticatedUserId)
      : await addRandomList(randomListData, authenticatedUserId)

    event.node.res.statusCode = 201 // Created
    return { success: true, ...result }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || 'Failed to create a new random list',
      statusCode: statusCode || 500,
    }
  }
})

// Function to add a single RandomList
async function addRandomList(
  randomListData: Partial<RandomList>,
  authenticatedUserId: number,
): Promise<{ randomList: RandomList | null; error: string | null }> {
  if (!randomListData.title) {
    throw createError({ statusCode: 400, message: 'Title is required.' })
  }

  // Verify userId matches authenticated user if provided
  if (randomListData.userId && randomListData.userId !== authenticatedUserId) {
    throw createError({
      statusCode: 403,
      message: 'User ID does not match the authenticated user.',
    })
  }

  try {
    const data: Prisma.RandomListCreateInput = {
      title: randomListData.title,
      items: JSON.stringify(randomListData.items || []),
      User: { connect: { id: authenticatedUserId } },
    }

    const randomList = await prisma.randomList.create({ data })
    return { randomList, error: null }
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

// Function to handle adding multiple RandomLists
async function addRandomLists(
  randomListsData: Partial<RandomList>[],
  authenticatedUserId: number,
): Promise<{ randomLists: RandomList[] | null; error: string | null }> {
  const createdRandomLists: RandomList[] = []
  const errors: string[] = []

  for (const randomListData of randomListsData) {
    if (!randomListData.title) {
      errors.push('Title is required.')
      continue
    }

    if (
      randomListData.userId &&
      randomListData.userId !== authenticatedUserId
    ) {
      errors.push('User ID does not match the authenticated user.')
      continue
    }

    try {
      const data: Prisma.RandomListCreateInput = {
        title: randomListData.title,
        items: JSON.stringify(randomListData.items || []),
        User: { connect: { id: authenticatedUserId } },
      }

      const randomList = await prisma.randomList.create({ data })
      createdRandomLists.push(randomList)
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      errors.push(errorMessage)
    }
  }

  if (errors.length > 0) {
    return {
      randomLists: createdRandomLists.length > 0 ? createdRandomLists : null,
      error: errors.join(', '),
    }
  }

  return { randomLists: createdRandomLists, error: null }
}
