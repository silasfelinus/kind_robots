// /server/api/pitches/index.put.ts
import { defineEventHandler, readBody } from 'h3'
import type { Pitch } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!id) throw new Error('Invalid pitch ID.')

    const existingPitch = await prisma.pitch.findUnique({ where: { id } })
    if (!existingPitch) {
      return { success: false, message: 'Pitch not found.' }
    }

    const pitchData: Partial<Pitch> = await readBody(event)
    const updatedPitch = await prisma.pitch.update({
      where: { id },
      data: pitchData,
    })

    return { success: true, pitch: updatedPitch }
  }
  catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to update an existing Pitch by ID
export async function updatePitch(id: number, updatedPitch: Partial<Pitch>): Promise<Pitch | null> {
  try {
    return await prisma.pitch.update({
      where: { id },
      data: updatedPitch,
    })
  }
  catch (error: unknown) {
    throw errorHandler(error)
  }
}
