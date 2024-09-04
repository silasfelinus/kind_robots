import { defineEventHandler, readBody } from 'h3';
import type { Channel } from '@prisma/client';
import { errorHandler } from '../utils/error';
import prisma from '../utils/prisma';
import { Prisma } from '@prisma/client';

export default defineEventHandler(async (event) => {
  try {
    const channelData: Partial<Channel> = await readBody(event);
    
    // Log the incoming channel data to debug
    console.log("Parsed channel data:", channelData);

    // Validate required fields
    if (!channelData.userId || !channelData.label || !channelData.title) {
      return { success: false, message: 'Missing required fields: userId, label, or title', statusCode: 400 };
    }

    // Create the channel
    const newChannel = await createChannel(channelData);
    return { success: true, newChannel };

  } catch (error: unknown) {
    // Check for Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002' && (error.meta as { target: string[] }).target.includes('label')) {
        return { success: false, message: 'Channel label already exists. Please choose a different label.', statusCode: 409 };
      }
    }

    // Log and return a generic error
    console.error("Error creating channel:", error);
    return errorHandler(error);
  }
});

export async function createChannel(channel: Partial<Channel>): Promise<Channel> {
  return prisma.channel.create({
    data: {
      userId: channel.userId ?? 0, // Provide a default value for userId
      label: channel.label ?? 'default-label', // Ensure label is always a string
      description: channel.description ?? null, // If description is not provided, default to null
      title: channel.title ?? 'Untitled Channel', // Ensure title is always a string
    },
  });
}
