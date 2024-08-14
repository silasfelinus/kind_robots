// server/utils/fetchMessages.ts
import { errorHandler } from './error'
import prisma from './prisma'
import type { Message } from '@prisma/client'

export async function fetchMessagesByChannelId(
  channelId: number,
): Promise<Message[]> {
  try {
    return (await prisma.message.findMany({
      where: { channelId },
    })) as Message[]
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
