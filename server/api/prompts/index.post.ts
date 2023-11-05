// /server/api/artPrompts/index.post.ts
import { defineEventHandler, readBody } from 'h3';
import { type ArtPrompt } from '@prisma/client';
import { errorHandler } from '../utils/error';
import prisma from '../utils/prisma';

export default defineEventHandler(async (event) => {
  try {
    const artPromptData: Partial<ArtPrompt> = await readBody(event);

    const newArtPrompt = await createArtPrompt(artPromptData);
    return { success: true, newArtPrompt };
  } catch (error: any) {
    return errorHandler(error);
  }
});

// Function to create a new ArtPrompt
export async function createArtPrompt(artPrompt: Partial<ArtPrompt>): Promise<ArtPrompt> {
  try {
    if (!artPrompt.prompt) {
      throw new Error('We need a prompt to make an art prompt');
    }
    return await prisma.artPrompt.create({
      data: {
        userId: artPrompt.userId || 0,
        prompt: artPrompt.prompt,
        galleryId: artPrompt.galleryId || 21,
        pitch: artPrompt.pitch || null,
        pitchId: artPrompt.pitchId || null,
      },
    });
  } catch (error: any) {
    throw errorHandler(error);
  }
}
