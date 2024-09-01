// /server/api/pitches/index.post.ts
import { defineEventHandler, readBody } from 'h3';
import type { Pitch } from '@prisma/client';
import { errorHandler } from '../utils/error';
import prisma from '../utils/prisma';
import { generateSillyName } from '../../../utils/useRandomName';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<Pitch>(event);

    // Basic validation
    if (!body.pitch) {
      return errorHandler({ message: "Pitch content is required.", statusCode: 400 });
    }

    const creatorName = body.creator || generateSillyName() || 'Anonymous';

    
    const pitch = await prisma.pitch.create({
      data: {
        title: body.title || 'Untitled',
        pitch: body.pitch,
        creator: creatorName,
        userId: body.userId,
        channelId: body.channelId,
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
