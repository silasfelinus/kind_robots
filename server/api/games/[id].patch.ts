// server/api/games/[id].patch.ts
import { defineEventHandler } from 'h3';
import prisma from '../utils/prisma';
import { errorHandler } from '../utils/error';

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id);
    const body = await readBody(event);

    if (isNaN(id)) {
      return { success: false, message: 'Invalid Game ID', statusCode: 400 };
    }

    // Fetch the existing game
    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        Players: true,
      },
    });

    if (!game) {
      return { success: false, message: 'Game not found', statusCode: 404 };
    }

    let updateData = {};

    // Handle updating player points
    if (body.action === 'updatePoints' && body.playerName && typeof body.points === 'number') {
      let existingPlayer = game.Players.find(
        (player) => player.name === body.playerName,
      );

      if (!existingPlayer) {
        // If the player doesn't exist, decide whether to add them or reject the request
        if (body.allowAddPlayer) {
          // Add the player if the option to add is provided
          existingPlayer = await prisma.player.create({
            data: {
              name: body.playerName,
              gameId: id,
              points: body.points,
            },
          });
        } else {
          return { success: false, message: 'Player not found in the game', statusCode: 404 };
        }
      } else {
        // Update the player's points if they exist
        await prisma.player.update({
          where: { id: existingPlayer.id },
          data: { points: existingPlayer.points + body.points },
        });
      }

      return { success: true, message: `Player ${body.playerName} points updated`, game: await prisma.game.findUnique({ where: { id }, include: { Players: true } }) };
    }

    // Handle joining the game
    if (body.action === 'join' && body.playerName) {
      const existingPlayer = game.Players.find(
        (player) => player.name === body.playerName,
      );

      if (existingPlayer) {
        return { success: false, message: 'Player already in the game', statusCode: 400 };
      }

      // Create new player and associate with the game
      const newPlayer = await prisma.player.create({
        data: {
          name: body.playerName,
          gameId: id,
        },
      });

      game.Players.push(newPlayer);
      updateData = {
        Players: {
          connect: { id: newPlayer.id },
        },
      };
    }

    // Handle leaving the game
    if (body.action === 'leave' && body.playerName) {
      const existingPlayer = game.Players.find(
        (player) => player.name === body.playerName,
      );

      if (!existingPlayer) {
        return { success: false, message: 'Player not found in the game', statusCode: 404 };
      }

      await prisma.player.delete({
        where: {
          id: existingPlayer.id,
        },
      });

      return { success: true, message: `${body.playerName} has left the game` };
    }

    // Handle resolving the game
    if (body.action === 'resolve') {
      const winnerName = body.winnerName;

      let winner = winnerName;

      if (!winnerName) {
        if (game.Players.length === 0) {
          return {
            success: false,
            message: 'Cannot resolve game with no players',
            statusCode: 400,
          };
        }

        // Find the player with the most points
        winner = game.Players.reduce(
          (prev, curr) => (curr.points > prev.points ? curr : prev),
          game.Players[0],
        ).name;
      }

      updateData = {
        ...updateData,
        isFinished: true,
        winner,
      };
    }

     // Handle updating game details
     if (body.descriptor || body.category || body.isFinished !== undefined) {
      updateData = {
        ...updateData,
        descriptor: body.descriptor || game.descriptor,
        category: body.category || game.category,
        isFinished: body.isFinished !== undefined ? body.isFinished : game.isFinished,
      };
    }

    // Update the game with the accumulated updateData
    const updatedGame = await prisma.game.update({
      where: { id },
      data: updateData,
    });

    return { success: true, game: updatedGame };
  } catch (error: unknown) {
    console.error('Update Game Error:', error);
    return errorHandler(error);
  }
});