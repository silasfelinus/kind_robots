import { defineEventHandler } from 'h3'
import { Art } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async () => {
  try {
    const artEntries = await fetchAllArt()
    return { success: true, artEntries }
  } catch (error: any) {
    return errorHandler(error)
  }
})

// Function to fetch all Art entries
export async function fetchAllArt(): Promise<Art[]> {
  return await prisma.art.findMany()
}
