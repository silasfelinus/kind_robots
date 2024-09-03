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
        tags: {
          connect: body.tags.map((tag: string) => ({ name: tag })), // Assuming your Tag model uses a 'name' field
        },
        User: {
          connect: { id: body.userId }, // Use the correct relation
        },
        Bot: body.botId ? { connect: { id: body.botId } } : undefined, // Optional relation
        Channel: body.channelId ? { connect: { id: body.channelId } } : undefined, // Optional relation
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
