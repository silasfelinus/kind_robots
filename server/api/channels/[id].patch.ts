// /server/api/channels/[id].patch.ts
import { defineEventHandler, readBody } from 'h3';
import { type Channel } from '@prisma/client';
import { errorHandler } from '../utils/error';
import prisma from '../utils/prisma';

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id);
    const updatedChannelData: Partial<Channel> = await readBody(event);
    const updatedChannel = await updateChannel(id, updatedChannelData);
    return { success: true, updatedChannel };
  } catch (error: any) {
    return errorHandler(error);
  }
});

// Function to update an existing Channel by ID
export async function updateChannel(id: number, updatedChannel: Partial<Channel>): Promise<Channel | null> {
  try {
    return await prisma.channel.update({
      where: { id },
      data: updatedChannel,
    });
  } catch (error: any) {
    throw errorHandler(error);
  }
}
