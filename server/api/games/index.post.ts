//server/api/games/index.post.ts 
import { defineEventHandler } from 'h3';
import prisma from '../utils/prisma';
import { errorHandler } from '../utils/error';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    const newGame = await prisma.game.create({
      data: {
        ...body,
      },
    });

    return { success: true, game: newGame };
  } catch (error: unknown) {
    return errorHandler(error);
  }
});


