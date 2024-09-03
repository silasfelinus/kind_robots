// /server/api/pitches/batch.get.ts
import { defineEventHandler } from 'h3'
import type { Pitch } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async () => {
  try {
    const pitches = await prisma.pitch.findMany()
    console.log('Fetched pitches:', pitches) // Debugging line
    return { success: true, pitches }
  } catch (error: unknown) {
    console.error('Error fetching pitches:', error) // Debugging line
    return errorHandler(error)
  }
})

// Function to fetch all Pitches
export async function fetchAllPitches(): Promise<Pitch[]> {
  try {
    const pitches = await prisma.pitch.findMany()
    console.log('Fetched pitches from fetchAllPitches:', pitches) // Debugging line
    return pitches
  } catch (error: unknown) {
    console.error('Error in fetchAllPitches:', error) // Debugging line
    throw error
  }
}
