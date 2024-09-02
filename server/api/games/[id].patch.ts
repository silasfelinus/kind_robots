// server/api/games/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from '../utils/prisma'
import type { ErrorHandlerOutput } from '../utils/error';
import { errorHandler } from '../utils/error'
import type { Game, Player } from '@prisma/client';

interface UpdateData {
  descriptor?: string;
  category?: string;
  isFinished?: boolean;
}

export interface ExtendedErrorHandlerOutput extends ErrorHandlerOutput {
  success: boolean;
  message: string;
  statusCode?: number;
  game?: Game;
  player?: Player;
}

async function handleJoinGame(gameId: number, playerName: string): Promise<ExtendedErrorHandlerOutput> {
  try {
    const existingPlayer = await prisma.player.findFirst({
      where: { gameId: gameId, name: playerName }
    });

    if (existingPlayer) {
      return {
        success: false,
        message: 'Player already in the game',
        statusCode: 400,
      };
    }

    const newPlayer = await prisma.player.create({
      data: {
        name: playerName,
        gameId: gameId,
      },
    });

    return { success: true, message: 'Player added to the game', player: newPlayer };
  } catch (error) {
    return errorHandler(error);
  }
}

async function handleUpdatePlayerPoints(playerId: number, points: number): Promise<ExtendedErrorHandlerOutput> {
  try {
    await prisma.player.update({
      where: { id: playerId },
      data: { points },
    });

    return { success: true, message: 'Player points updated' };
  } catch (error) {
    return errorHandler(error);
  }
}

async function handleLeaveGame(playerId: number): Promise<ExtendedErrorHandlerOutput> {
  try {
    // Update the player's status to 'LEFT' instead of deleting the record
    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: { status: 'LEFT' }
    });

    return { success: true, message: 'Player status updated to LEFT', player: updatedPlayer };
  } catch (error) {
    return errorHandler(error);
  }
}


async function handleResolveGame(gameId: number, winnerName: string): Promise<ExtendedErrorHandlerOutput> {
  try {
    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: {
      isFinished: true,
      winner: winnerName,
      },
    });

    return { success: true, message: 'Game resolved', game: updatedGame };
  } catch (error) {
    return errorHandler(error);
  }
}

async function handleGameUpdates(gameId: number, updateData: UpdateData): Promise<ExtendedErrorHandlerOutput> {
  try {
    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: updateData,
    });

    return { success: true, message: 'Game Updated', game: updatedGame };
  } catch (error) {
    return errorHandler(error);
  }
}

export default defineEventHandler(async (event) => {
  try {
    const gameId = Number(event.context.params?.id);
    if (isNaN(gameId)) {
      return { success: false, message: 'Invalid Game ID', statusCode: 400 };
    }

    const body = await readBody(event);
    let response;

    switch (body.action) {
      case 'join': {
        response = await handleJoinGame(gameId, body.playerName);
        break;
      }
      case 'updatePoints': {
        const player = await prisma.player.findFirst({ where: { name: body.playerName, gameId: gameId } });
        if (!player) {
          return { success: false, message: 'Player not found', statusCode: 404 };
        }
        response = await handleUpdatePlayerPoints(player.id, body.points);
        break;
      }
      case 'leave': {
        const playerToLeave = await prisma.player.findFirst({ where: { name: body.playerName, gameId: gameId } });
        if (!playerToLeave) {
          return { success: false, message: 'Player not found', statusCode: 404 };
        }
        response = await handleLeaveGame(playerToLeave.id);
        break;
      }
      case 'resolve': {
        response = await handleResolveGame(gameId, body.winnerName);
        break;
      }
      default: {
        const updateData: UpdateData = {
          descriptor: body.descriptor || undefined,
          category: body.category || undefined,
          isFinished: body.isFinished !== undefined ? body.isFinished : undefined,
        };
        response = await handleGameUpdates(gameId, updateData);
        break;
      }
    }

    return response;
  } catch (error) {
    return errorHandler(error);
  }
});
