// server/api/games/players/[id].get.ts
import { defineEventHandler } from 'h3';
import prisma from '../../utils/prisma';
import { errorHandler } from '../../utils/error';

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id);

    if (isNaN(id)) {
      return { success: false, message: 'Invalid Player ID', statusCode: 400 };
    }

    // Fetch the player by ID, including their related game and other fields
    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        Game: true,  // Include related game information
        User: true,
      },
    });

    if (!player) {
      return { success: false, message: 'Player not found', statusCode: 404 };
    }

    // Return the player details
    return { success: true, player };
  } catch (error: unknown) {
    console.error('Get Player Error:', error);
    return errorHandler(error);
  }
});
