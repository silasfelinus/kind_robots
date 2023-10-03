// /server/api/pitches/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const pitchesData = await readBody(event)

    if (!Array.isArray(pitchesData)) {
      return { success: false, message: 'Invalid JSON body. Expected an array of pitches.' }
    }

    // Create pitches in a batch and skip duplicates
    const result = await prisma.pitch.createMany({
      data: pitchesData,
      skipDuplicates: true
    })

    return { success: true, count: result.count }
  } catch (error: any) {
    return errorHandler(error)
  }
})
