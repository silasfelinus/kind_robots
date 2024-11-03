// /server/api/random/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import type { Prisma, RandomList } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const randomListData = await readBody(event)

    // Check if randomListData is an array or a single object
    const result = Array.isArray(randomListData)
      ? await addRandomLists(randomListData) // Handle multiple RandomLists
      : await addRandomList(randomListData) // Handle a single RandomList

    return { success: true, ...result }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    return {
      success: false,
      message: 'Failed to create a new random list',
      error: message,
      statusCode: statusCode || 500,
    }
  }
})

// Function to add a single RandomList
export async function addRandomList(
  randomListData: Partial<RandomList>,
): Promise<{ randomList: RandomList | null; error: string | null }> {
  if (!randomListData.title) {
    return { randomList: null, error: 'Title is required.' }
  }

  try {
    const data: Prisma.RandomListCreateInput = {
      title: randomListData.title,
      items: JSON.stringify(randomListData.items || []),
      User: randomListData.userId
        ? { connect: { id: randomListData.userId } }
        : undefined, // Only connect if userId is provided
    }

    const randomList = await prisma.randomList.create({ data })
    return { randomList, error: null }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return { randomList: null, error: errorMessage }
  }
}

// Function to handle adding multiple RandomLists
export async function addRandomLists(
  randomListsData: Partial<RandomList>[],
): Promise<{ randomLists: RandomList[] | null; error: string | null }> {
  const createdRandomLists: RandomList[] = []
  const errors: string[] = []

  for (const randomListData of randomListsData) {
    if (!randomListData.title) {
      errors.push('Title is required.')
      continue
    }

    try {
      const data: Prisma.RandomListCreateInput = {
        title: randomListData.title,
        items: JSON.stringify(randomListData.items || []),
        User: randomListData.userId
          ? { connect: { id: randomListData.userId } }
          : undefined, // Only connect if userId is provided
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
