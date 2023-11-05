// /server/api/pitches/index.get.ts
import { defineEventHandler } from 'h3'
import { type Pitch } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async () => {
  try {
    const pitches = await prisma.pitch.findMany()
    return { success: true, pitches }
  } catch (error: any) {
    return errorHandler(error)
  }
})

// Function to fetch all Pitches
export async function fetchAllPitches(): Promise<Pitch[]> {
  return await prisma.pitch.findMany()
}
