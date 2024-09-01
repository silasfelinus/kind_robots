// /server/api/pitches/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import type { Pitch } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { generateSillyName } from '../../../utils/useRandomName' // Adjusted import if needed

// Assuming imports are set correctly and Prisma model is confirmed.

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<Pitch>(event);

    // Validation
    const validationError = validatePitchData(body);
    if (validationError) {
      return errorHandler({ message: validationError, statusCode: 400 });
    }

    // Ensure creator is set either from body or generated
    const creatorName = body.creator || generateSillyName() || 'Anonymous';

    // Pitch creation with checks for each property
    const pitch = await prisma.pitch.create({
      data: {
        title: body.title || 'Untitled',
        pitch: body.pitch || 'No details provided.',
        creator: creatorName,
        userId: body.userId || 0,
        channelId: body.channelId || 0,
        isPublic: body.isPublic !== undefined ? body.isPublic : true,
        isMature: body.isMature || false,
        flavorText: body.flavorText || '',
        highlightImage: body.highlightImage || '',
        claps: body.claps || 0,
        boos: body.boos || 0,
        // Assuming PitchType is an actual enum in your Prisma model
        PitchType: body.PitchType || 'ARTPITCH',
      }
    });

    return { success: true, pitch };
  } catch (error) {
    return errorHandler(error);
  }
});

function validatePitchData(data: Partial<Pitch>): string | null {
  // Validation logic here
  if (!data.title || !data.pitch) {
    return 'Title and pitch content are required.';
  }
  // Additional validations can be added here
  return null;
}