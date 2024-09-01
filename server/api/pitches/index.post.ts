// /server/api/pitches/index.post.ts
import { defineEventHandler, readBody } from 'h3';
import type { Pitch } from '@prisma/client';
import { errorHandler } from '../utils/error';
import prisma from '../utils/prisma';
import { generateSillyName } from '../../../utils/useRandomName';

export default defineEventHandler(async (event) => {
  try {
    // Attempt to read and parse the body of the request
    const body = await readBody<Pitch>(event);
    console.log('Received body:', body); // Log the received body for debugging

    // Ensure pitch content is provided and not empty
    if (!body.pitch || body.pitch.trim() === '') {
      return errorHandler({ message: "Pitch content is required.", statusCode: 400 });
    }

    const creatorName = body.creator || generateSillyName() || 'Anonymous';

    // Process the creation of a new pitch
    const pitch = await prisma.pitch.create({
      data: {
        title: body.title || null,
        pitch: body.pitch,
        creator: creatorName,
        userId: body.userId || 0,
        channelId: body.channelId || 0,
        isPublic: body.isPublic !== undefined ? body.isPublic : true,
        isMature: body.isMature || false,
        flavorText: body.flavorText || '',
        highlightImage: body.highlightImage || '',
        claps: body.claps || 0,
        boos: body.boos || 0,
        PitchType: body.PitchType || 'ARTPITCH',
      }
    });

    return { success: true, pitch };
  } catch (error) {
    console.error("Error creating pitch:", error);
    return errorHandler({ error, statusCode: 500 });
  }
});
