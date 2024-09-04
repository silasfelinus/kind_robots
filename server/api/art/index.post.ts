import { defineEventHandler, readBody } from 'h3';
import { errorHandler } from '../utils/error'; // Import the error handler
import prisma from './../utils/prisma';
import type { Prisma, Art } from '@prisma/client';

export default defineEventHandler(async (event) => {
  try {
    const artData = await readBody(event);

    // Set a default value for the 'path' if it's not provided
    if (!artData.path) {
      artData.path = generateDefaultPath();
    }

    const result = await addArt(artData);
    return { success: true, ...result };
  } catch (error) {
    // Use the error handler to process the error
    const { message, statusCode } = errorHandler(error);

    // Return the error response with the processed message and status code
    return {
      success: false,
      message: 'Failed to create a new art object',
      error: message,
      statusCode: statusCode || 500, // Default to 500 if no status code is provided
    };
  }
});

export async function addArt(
  artData: Partial<Art>,
): Promise<{ art: Art | null; error: string | null }> {
  // Validate required fields
  if (!artData.promptString || !artData.path) {
    return {
      art: null,
      error: 'Both "promptString" and "path" are required fields.',
    };
  }

  try {
    const art = await prisma.art.create({
      data: artData as Prisma.ArtCreateInput,
    });
    return { art, error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { art: null, error: errorMessage };
  }
}

// Helper function to generate a default path
function generateDefaultPath(): string {
  // Generate a placeholder path for testing purposes, this can be modified
  return ` `;
}
