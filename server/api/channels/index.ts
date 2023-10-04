import { Channel, Prisma } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

// Function to create a new Channel
export async function createChannel(channel: Partial<Channel>): Promise<Channel> {
  try {
    return await prisma.channel.create({
      data: {
        userId: channel.userId || 0,
        label: channel.label || 'global',
        description: channel.description || null
      }
    })
  } catch (error: any) {
    throw errorHandler(error)
  }
}

// Function to update an existing Channel by ID
export async function updateChannel(
  id: number,
  updatedChannel: Partial<Channel>
): Promise<Channel | null> {
  try {
    return await prisma.channel.update({
      where: { id },
      data: updatedChannel
    })
  } catch (error: any) {
    throw errorHandler(error)
  }
}

// Function to delete a Channel by ID
export async function deleteChannel(id: number): Promise<boolean> {
  try {
    const channelExists = await prisma.channel.findUnique({ where: { id } })

    if (!channelExists) {
      return false
    }

    await prisma.channel.delete({ where: { id } })
    return true
  } catch (error: any) {
    throw errorHandler(error)
  }
}

// Function to fetch all Channels
export async function fetchAllChannels(): Promise<Channel[]> {
  return await prisma.channel.findMany()
}

// Function to fetch a single Channel by ID
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

export type { Channel }
