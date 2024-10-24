//server/api/art/collection/index.get.ts

import { defineEventHandler } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'

export default defineEventHandler(async () => {
  try {
    const collections = await fetchAllCollections()
    return { success: true, collections }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to fetch all Art collections
export async function fetchAllCollections() {
  return await prisma.artCollection.findMany({
    include: {
      art: true, // Include associated art entries
    },
  })
}
