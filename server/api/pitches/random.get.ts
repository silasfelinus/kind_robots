// /server/api/pitches/random.get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Extract count from query parameters
    const count = Number(event.context.query?.count) || 5

    // Fetch random pitches
    const pitches = await prisma.pitch.findMany({
      take: count, // Limit to the count requested
      orderBy: { createdAt: 'desc' }, // Optional: Order by createdAt or any other field
    })

    return { success: true, pitches }
  } catch (error: unknown) {
    console.error('Error fetching random pitches:', error)
    return errorHandler(error)
  }
})
