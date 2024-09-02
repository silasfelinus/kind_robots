// /server/api/pitches/index.post.ts
import { defineEventHandler, readBody } from 'h3';
import { errorHandler } from '../utils/error'; // Import the error handler
import prisma from './../utils/prisma';
import type { Prisma, Pitch } from '@prisma/client';

export default defineEventHandler(async (event) => {
  try {
    const pitchData = await readBody(event);
    const result = await addPitch(pitchData);
    return { success: true, ...result };
  } catch (error) {
    // Use the error handler to process the error
    const { message, statusCode } = errorHandler(error);

    // Return the error response with the processed message and status code
    return {
      success: false,
      message: 'Failed to create a new pitch',
      error: message,
      statusCode: statusCode || 500, // Default to 500 if no status code is provided
    };
  }
});

export async function addPitch(
  pitchData: Partial<Pitch>,
): Promise<{ pitch: Pitch | null; error: string | null }> {
  if (!pitchData.pitch) {
    return { pitch: null, error: 'Pitch content is required.' };
  }

  try {
    const pitch = await prisma.pitch.create({
      data: pitchData as Prisma.PitchCreateInput,
    });
    return { pitch, error: null };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return { pitch: null, error: errorMessage };
  }
}
