// server/api/games/players/index.get.ts
import { defineEventHandler } from 'h3';
import prisma from '../../utils/prisma';
import { errorHandler } from '../../utils/error';

export default defineEventHandler(async () => {
  try {
    // Fetch all players across all games
    const players = await prisma.player.findMany({
      include: {
        Game: true,  // Include related game information
      },
    });

    if (!players.length) {
      return { success: true, message: 'No players found', players: [] };
    }

    // Return the list of players
    return { success: true, players };
  } catch (error: unknown) {
    console.error('Get All Players Error:', error);
    return errorHandler(error);
  }
});
