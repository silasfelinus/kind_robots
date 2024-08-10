// /server/api/random/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const { title, items } = await readBody(event)

    // Validate title and items
    if (!title || typeof title !== 'string') {
      throw new Error('Title is required and must be a string.')
    }

    if (!Array.isArray(items)) {
      throw new TypeError('Items must be an array.')
    }

    // Check if title already exists
    const existingList = await prisma.randomList.findFirst({
      where: { title },
    })

    if (existingList) {
      throw new Error('Title already exists.')
    }

    // Create new list
    const newList = await prisma.randomList.create({
      data: {
        title,
        items: JSON.stringify(items),
      },
    })

    return { success: true, newList }
  }
  catch (error: any) {
    return errorHandler(error)
  }
})
