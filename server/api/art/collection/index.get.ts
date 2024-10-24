import { defineEventHandler } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'

export default defineEventHandler(async (_event) => {  // Use `_event` to avoid ESLint error
  try {
    const collections = await fetchAllCollections()
    
    if (!collections || collections.length === 0) {
      return {
        success: false,
        message: 'No art collections found.',
        statusCode: 404
      }
    }

    return { success: true, collections }
  } catch (error) {
    // Use the provided error handler
    return errorHandler(error)
  }
})

// Function to fetch all Art collections
export async function fetchAllCollections() {
  return await prisma.artCollection.findMany({
    include: {
      art: true,  // Include associated art entries
    },
  })
}
