// /server/api/resources/[id].delete.ts
import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!id) throw new Error('Invalid resource ID.')

    const existingResource = await prisma.resource.findUnique({ where: { id } })
    if (!existingResource) {
      return { success: false, message: 'Resource not found.' }
    }

    await prisma.resource.delete({ where: { id } })
    return { success: true, message: 'Resource successfully deleted.' }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to delete a Resource by ID
export async function deleteResource(id: number): Promise<boolean> {
  try {
    const resourceExists = await prisma.resource.findUnique({ where: { id } })

    if (!resourceExists) {
      throw new Error('Resource not found')
    }

    await prisma.resource.delete({ where: { id } })
    return true
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
