//server/api/games/index.post.ts 
import { defineEventHandler, readBody } from 'h3';
import prisma from '../utils/prisma';
import { errorHandler } from '../utils/error';

export default defineEventHandler(async (event) => {
  try {
    const { descriptor, category, creator, isPrivate, players } = await readBody(event);

    // Validate required fields
    if (!descriptor || typeof descriptor !== 'string') {
      throw new Error('Descriptor is required and must be a string.');
    }

    if (!category || typeof category !== 'string') {
      throw new Error('Category is required and must be a string.');
    }

    if (!creator || typeof creator !== 'string') {
      throw new Error('Creator is required and must be a string.');
    }

    if (typeof isPrivate !== 'boolean') {
      throw new Error('isPrivate is required and must be a boolean.');
    }

    if (!players || typeof players !== 'string') {
      throw new Error('Players is required and must be a string.');
    }

    // Create new game
    const newGame = await prisma.game.create({
      data: {
        descriptor,
        category,
        creator,
        isPrivate,
        players,
      },
    });

    return { success: true, game: newGame };
  } catch (error: unknown) {
    return errorHandler(error);
  }
});
