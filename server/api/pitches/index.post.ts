// /server/api/pitches/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import type { Prisma, Pitch } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { generateSillyName } from '../../../utils/useRandomName' // Adjusted import if needed

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<Pitch>(event);
    const validationError = validatePitchData(body);
    if (validationError) {
      return errorHandler({ message: validationError, statusCode: 400 });
    }

    // Adjusted to use 'creator' correctly
    const pitch = await prisma.pitch.create({
      data: {
        title: body.title || 'Untitled',
        pitch: body.pitch || 'No details provided.',
        creator: body.creator || generateSillyName() || 'Anonymous',
        userId: body.userId || 0,
        channelId: body.channelId || 0,
        isPublic: body.isPublic !== undefined ? body.isPublic : true,
        isMature: body.isMature || false,
        flavorText: body.flavorText || '',
        highlightImage: body.highlightImage || '',
        claps: body.claps || 0,
        boos: body.boos || 0,
        PitchType: body.PitchType || 'ARTPITCH', // Ensure this matches the enum and is valid
      }
    });
    return { success: true, pitch };
  } catch (error) {
    return errorHandler(error);
  }
});

function validatePitchData(data: Partial<Pitch>): string | null {
  if (!data.title || !data.pitch) {
    return 'Title and pitch content are required.';
  }
  // You might want to add more validations as needed
  return null;
}
