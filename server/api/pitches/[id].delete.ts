// server/api/pitches/[id].delete.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!id) throw new Error('Invalid tag ID.')

    const existingPitch = await prisma.pitch.findUnique({ where: { id } })
    if (!existingPitch) {
      return { success: false, message: 'Pitch not found.' }
    }

    await prisma.pitch.delete({ where: { id } })
    return { success: true, message: 'Pitch successfully deleted.' }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to delete a Pitch by ID
export async function deletePitch(id: number): Promise<boolean> {
  try {
    const pitchExists = await prisma.pitch.findUnique({ where: { id } })

    if (!pitchExists) {
      throw new Error('Pitch not found')
    }

    await prisma.pitch.delete({ where: { id } })
    return true
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
