import { defineEventHandler } from 'h3'
import { type Message } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async () => {
  try {
    const messages = await fetchAllMessages()
    return { success: true, messages }
  } catch (error: any) {
    return errorHandler(error)
  }
})

// Function to fetch all Messages
export async function fetchAllMessages(): Promise<Message[]> {
  return await prisma.message.findMany()
}
