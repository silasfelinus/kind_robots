// /server/api/random/title/[title].get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Extract the title from the URL parameters
    const title = event.context.params?.title
    if (!title) {
      throw new Error('Title is required.')
    }

    // Find the random list by title
    const list = await prisma.randomList.findUnique({
      where: { title },
    })

    if (!list) {
      throw new Error('List not found.')
    }

    return { success: true, list }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
