import { defineEventHandler } from 'h3';
import { type Pitch } from '@prisma/client';
import { errorHandler } from '../utils/error';
import prisma from '../utils/prisma';

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id);

    if (!id) throw new Error('Invalid tag ID.');

    if (isNaN(id)) {
      return { success: false, message: 'Invalid ID', statusCode: 400 };
    }

    const pitch = await fetchPitchById(id);

    return { success: true, pitch };
  } catch (error: any) {
    return errorHandler(error);
  }
});

export async function fetchPitchById(
  id: number,
): Promise<{ success: boolean; pitch?: Pitch; message?: string; statusCode?: number }> {
  try {
    // Validate the ID
    if (!id || isNaN(id)) {
      return { success: false, message: 'Invalid ID', statusCode: 400 };
    }

    // Fetch the pitch by ID along with its related Art, ArtPrompt, and Channel
    const pitch = await prisma.pitch.findUnique({
      where: { id },
      include: {
        Art: true,
        Channel: true,
      },
    });

    // Check if the pitch exists
    if (!pitch) {
      return { success: false, message: 'Pitch not found', statusCode: 404 };
    }
    return { success: true, pitch };
  } catch (error: any) {
    const handledError = errorHandler(error);
    return {
      success: false,
      message: handledError.message,
      statusCode: handledError.statusCode || 500,
    };
  }
}
