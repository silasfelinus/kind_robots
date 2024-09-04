import { defineEventHandler, readBody } from 'h3';
import { errorHandler } from '../utils/error'; // Import the error handler
import prisma from './../utils/prisma';
import type { Prisma, Art } from '@prisma/client';

export default defineEventHandler(async (event) => {
  try {
    const artData = await readBody<Partial<Art>>(event);

    // Validate required fields
    if (!artData.promptString) {
      return {
        success: false,
        message: '"promptString" is a required field.',
        statusCode: 400, // Bad Request
      };
    }

    const result = await addArt(artData);

    if (result.error) {
      throw new Error(result.error);
    }

    return { success: true, art: result.art };
  } catch (error) {
    // Use the error handler to process the error
    const { message, statusCode } = errorHandler(error);

    // Return the error response with the processed message and status code
    return {
      success: false,
      message: 'Failed to create a new art object',
      error: message || 'An unknown error occurred',
      statusCode: statusCode || 500, // Default to 500 if no status code is provided
    };
  }
});

export async function addArt(
  artData: Partial<Art>,
): Promise<{ art: Art | null; error: string | null }> {
  try {
    const art = await prisma.art.create({
      data: artData as Prisma.ArtCreateInput,
    });
    return { art, error: null };
  } catch (error: unknown) {
    // Enhanced error messaging, sending along the specific error
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    return { art: null, error: `Failed to create art: ${errorMessage}` };
  }
}
