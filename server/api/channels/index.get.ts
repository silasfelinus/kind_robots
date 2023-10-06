// /server/api/channels/index.get.ts
import { defineEventHandler } from 'h3'
import { Channel } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async () => {
  try {
    const channels = await fetchAllChannels()
    return { success: true, channels }
  } catch (error: any) {
    return errorHandler(error)
  }
})

// Function to fetch all Channels
export async function fetchAllChannels(): Promise<Channel[]> {
  return await prisma.channel.findMany()
}
