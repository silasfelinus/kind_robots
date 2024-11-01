import { createError } from 'h3'
import prisma from '../utils/prisma'

export async function authorizeUserForChannelEntry(
  userId: number,
  channelId: number,
): Promise<void> {
  // Query the channel entry based on the provided channelId
  const channelEntry = await prisma.channel.findUnique({
    where: { id: channelId },
    select: { userId: true },
  })

  // Check if the channel entry exists
  if (!channelEntry) {
    throw createError({
      statusCode: 404,
      message: `Channel with ID ${channelId} does not exist.`,
    })
  }

  // Check if the user is authorized to access the channel
  if (channelEntry.userId !== userId) {
    throw createError({
      statusCode: 403,
      message: 'User is not authorized to access this channel entry.',
    })
  }
}
