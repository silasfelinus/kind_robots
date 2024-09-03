// /server/api/resources/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Resource } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!id) throw new Error('Invalid resource ID.')

    const existingResource = await prisma.resource.findUnique({ where: { id } })
    if (!existingResource) {
      return { success: false, message: 'Resource not found.' }
    }

    const resourceData: Partial<Resource> = await readBody(event)
    const updatedResource = await prisma.resource.update({
      where: { id },
      data: resourceData,
    })

    return { success: true, resource: updatedResource }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to update an existing Resource by ID
export async function updateResource(
  id: number,
  updatedResource: Partial<Resource>,
): Promise<Resource | null> {
  try {
    return await prisma.resource.update({
      where: { id },
      data: updatedResource,
    })
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
