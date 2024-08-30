//server/api/games/[id].get.ts 
import { defineEventHandler } from 'h3';
import prisma from '../utils/prisma';
import { errorHandler } from '../utils/error';

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id);

    if (isNaN(id)) {
      return { success: false, message: 'Invalid Game ID', statusCode: 400 };
    }

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        Users: true, // Include related Users
        Art: true, // Include related Art
        ArtPrompt: true, // Include related Art Prompts
      },
    });

    if (!game) {
      return { success: false, message: 'Game not found', statusCode: 404 };
    }

    return { success: true, game };
  } catch (error: unknown) {
    return errorHandler(error);
  }
});
