//server/api/games/[id].resolve.post.ts 
import { defineEventHandler } from 'h3';
import prisma from '../utils/prisma';
import { errorHandler } from '../utils/error';

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id);

    if (isNaN(id)) {
      return { success: false, message: 'Invalid Game ID', statusCode: 400 };
    }

    const resolvedGame = await prisma.game.update({
      where: { id },
      data: {
        isFinished: true,
      },
    });

    return { success: true, game: resolvedGame };
  } catch (error: unknown) {
    return errorHandler(error);
  }
});
