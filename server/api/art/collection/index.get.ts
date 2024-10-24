// server/api/art/collection/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'

export default defineEventHandler(async () => { 
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
    return errorHandler(error) // Do not concatenate error with string
  }
})

export async function fetchAllCollections() {
  return await prisma.artCollection.findMany({
    include: {
      art: true,  
    },
  })
}
