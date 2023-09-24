import { Message, Prisma } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

// Function to create a new Message
export async function createMessage(message: Partial<Message>): Promise<Message> {
  try {
    return await prisma.message.create({
      data: {
        sender: message.sender || 'user',
        recipient: message.recipient || 'prompt',
        content: message.content,
        channelId: message.channelId
      }
    })
  } catch (error: any) {
    throw errorHandler(error)
  }
}

// Function to update an existing Message by ID
export async function updateMessage(
  id: number,
  updatedMessage: Partial<Message>
): Promise<Message | null> {
  try {
    return await prisma.message.update({
      where: { id },
      data: updatedMessage
    })
  } catch (error: any) {
    throw errorHandler(error)
  }
}

// Function to delete a Message by ID
export async function deleteMessage(id: number): Promise<boolean> {
  try {
    const messageExists = await prisma.message.findUnique({ where: { id } })

    if (!messageExists) {
      return false
    }

    await prisma.message.delete({ where: { id } })
    return true
  } catch (error: any) {
    throw errorHandler(error)
  }
}

// Function to fetch all Messages
export async function fetchAllMessages(): Promise<Message[]> {
  return await prisma.message.findMany()
}

// Function to fetch a single Message by ID
export async function fetchMessageById(id: number): Promise<Message | null> {
  return await prisma.message.findUnique({
    where: { id }
  })
}

// Function to fetch Messages by Channel ID
export async function fetchMessagesByChannelId(channelId: number): Promise<Message[]> {
  return await prisma.message.findMany({
    where: { channelId }
  })
}

export type { Message }
