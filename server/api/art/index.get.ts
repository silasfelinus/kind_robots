import { defineEventHandler } from 'h3'
import type { Art } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const artEntries = await fetchAllArt()

    // Wrap the fetched art entries in a data object
    return { success: true, data: { artEntries } }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    return {
      success: false,
      message: handledError.message || 'Failed to fetch art entries.',
    }
  }
})

// Function to fetch all Art entries
export async function fetchAllArt(): Promise<Art[]> {
  return await prisma.art.findMany()
}
