import { defineEventHandler, readBody } from 'h3';
import type { Channel } from '@prisma/client';
import { errorHandler } from '../utils/error';
import prisma from '../utils/prisma';
import { Prisma } from '@prisma/client';

export default defineEventHandler(async (event) => {
  try {
    const channelData: Partial<Channel> = await readBody(event);

    if (!channelData.userId || !channelData.label || !channelData.title) {
      return { success: false, message: 'Missing required fields: userId, label, or title', statusCode: 400 };
    }

    const newChannel = await createChannel(channelData);
    return { success: true, newChannel };

  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002' && (error.meta as { target: string[] }).target.includes('label')) {
        return { success: false, message: 'Channel label already exists. Please choose a different label.', statusCode: 409 };
      }
    }
    return errorHandler(error);
  }
});

// Function to create a new Channel
export async function createChannel(channel: Partial<Channel>): Promise<Channel> {
  return prisma.channel.create({
    data: {
      userId: channel.userId || 0,
      label: channel.label || 'global',
      description: channel.description || null,
      title: channel.title || 'Untitled Channel',
    },
  });
}
