// /server/api/pitches/index.get.ts
import { defineEventHandler } from 'h3'
import type { Pitch } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async () => {
  try {
    // Fetch all pitches from the database
    const data = await prisma.pitch.findMany()

    return {
      success: true,
      message: 'Pitches fetched successfully.',
      data, // Return pitches in data field
      statusCode: 200,
    }
  } catch (error: unknown) {
    console.error('Error fetching pitches:', error) // Debugging line
    const { success, message, statusCode } = errorHandler(error)

    return {
      success,
      message,
      statusCode,
    }
  }
})

// Function to fetch all Pitches
export async function fetchAllPitches(): Promise<Pitch[]> {
  try {
    const pitches = await prisma.pitch.findMany()
    return pitches
  } catch (error: unknown) {
    console.error('Error in fetchAllPitches:', error) // Debugging line
    throw error
  }
}
