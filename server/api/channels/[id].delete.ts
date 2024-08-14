// servers/api/channels/[id].delete.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const isDeleted = await deleteChannel(id)
    return { success: isDeleted }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to delete a Channel by ID
export async function deleteChannel(id: number): Promise<boolean> {
  try {
    const channelExists = await prisma.channel.findUnique({ where: { id } })

    if (!channelExists) {
      return false
    }

    await prisma.channel.delete({ where: { id } })
    return true
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
