import { defineEventHandler, readBody } from 'h3';
import prisma from '../utils/prisma';
import { errorHandler } from '../utils/error';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    const newPost = await prisma.post.create({
      data: {
        username: body.username,
        content: body.content,
        title: body.title,
        label: body.label,
        imagePath: body.imagePath,
        isFavorite: body.isFavorite,
        User: body.userId ? { connect: { id: body.userId } } : undefined,  // Connecting the user
        Bot: body.botId ? { connect: { id: body.botId } } : undefined,      // Connecting the bot
        Channel: body.channelId ? { connect: { id: body.channelId } } : undefined, // Connecting the channel
        tags: body.tags?.length > 0 
          ? {
              connect: body.tags.map((tag: string) => ({ name: tag })), // Assuming `name` is the identifier for tags
            }
          : undefined,
      },
    });

    return { success: true, newPost };
  } catch (error: unknown) {
    return errorHandler({
      error,
      context: 'Creating a new post',
    });
  }
});
