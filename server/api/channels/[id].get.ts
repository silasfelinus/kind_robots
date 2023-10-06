// /server/api/channels/[id].get.ts
import { Channel, Message } from '@prisma/client'
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Extract the ID from the event context and validate it
    const id = Number(event.context.params?.id)
    if (!id) {
      throw new Error('Invalid ID.')
    }

    // Fetch the channel by ID, including its messages
    const channel = await prisma.channel.findUnique({
      where: { id },
      include: {
        Message: true // Include messages related to the channel
      }
    })

    // If the channel is not found, throw an error
    if (!channel) {
      throw new Error('Channel not found.')
    }

    return {
      success: true,
      channel
    }
  } catch (error: any) {
    // Use your custom error handler
    const { success, message, statusCode } = errorHandler(error)
    return {
      success,
      message,
      statusCode
    }
  }
})

// Function to fetch Messages by Channel ID
export async function fetchMessagesByChannelId(channelId: number): Promise<Message[]> {
  return await prisma.message.findMany({
    where: { channelId }
  })
}

// Function to fetch a single Channel by ID
// these should be functionally redundant
export async function fetchChannelById(id: number): Promise<Channel | null> {
  return await prisma.channel.findUnique({
    where: { id }
  })
}

export async function fetchChannelWithMessages(channelId: number): Promise<Channel | null> {
  try {
    return await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        Message: true // Include messages
      }
    })
  } catch (error: any) {
    throw errorHandler(error)
  }
}
