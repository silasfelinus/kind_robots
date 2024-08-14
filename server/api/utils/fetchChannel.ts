// server/api/utils/fetchChannel.ts
import { errorHandler } from './error'
import prisma from './prisma'
import type { Channel } from '@prisma/client'

export async function fetchChannel(channelId: number): Promise<Channel | null> {
  try {
    return (await prisma.channel.findUnique({
      where: { id: channelId },
    })) as Channel | null
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
