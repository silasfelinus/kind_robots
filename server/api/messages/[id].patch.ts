import { defineEventHandler, readBody } from 'h3'
import type { Message } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const updatedMessageData: Partial<Message> = await readBody(event)
    const updatedMessage = await updateMessage(id, updatedMessageData)
    return { success: true, updatedMessage }
  }
  catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to update an existing Message by ID
export async function updateMessage(id: number, updatedMessage: Partial<Message>): Promise<Message | null> {
  try {
    return await prisma.message.update({
      where: { id },
      data: updatedMessage,
    })
  }
  catch (error: unknown) {
    throw errorHandler(error)
  }
}
