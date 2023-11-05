import { defineEventHandler, readBody } from 'h3';
import { errorHandler } from '../utils/error';
import { type ArtReaction, updateArtReaction } from '.';

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id);
    const updatedReactionData: Partial<ArtReaction> = await readBody(event);
    const updatedReaction = await updateArtReaction(id, updatedReactionData);
    return { success: true, updatedReaction };
  } catch (error: any) {
    return errorHandler(error);
  }
});
