import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const isDeleted = await deleteArt(id)
    return { success: isDeleted }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to delete an Art entry by ID
export async function deleteArt(id: number): Promise<boolean> {
  try {
    const artExists = await prisma.art.findUnique({ where: { id } })

    if (!artExists) {
      return false
    }

    await prisma.art.delete({ where: { id } })
    return true
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
