import { defineEventHandler } from 'h3'
import type { Message } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const message = await fetchMessageById(id)
    return { success: true, message }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to fetch a single Message by ID
export async function fetchMessageById(id: number): Promise<Message | null> {
  return await prisma.message.findUnique({
    where: { id },
  })
}
