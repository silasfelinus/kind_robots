// server/api/art/prompts/[id].get.ts
import { defineEventHandler } from 'h3';
import { errorHandler } from '../utils/error';
import { fetchArtByPromptId, fetchArtPromptById } from './artQueries'

// Event handler for fetching ArtPrompt and related Art by ID
export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id);

    if (isNaN(id)) {
      return errorHandler({
        success: false,
        message: 'Invalid ID format.',
        statusCode: 400, // Bad Request
      });
    }

    // Fetch ArtPrompt by ID
    const artPrompt = await fetchArtPromptById(id);

    if (!artPrompt) {
      return errorHandler({
        success: false,
        message: 'ArtPrompt not found',
        statusCode: 404, // Not Found
      });
    }

    // Fetch related Art by ArtPrompt ID
    const art = await fetchArtByPromptId(id);

    // Extract Art IDs
    const artIds = art.map(a => a.id);

    return { success: true, prompt: artPrompt.prompt, artIds };
  } catch (error: unknown) {
    // Use the errorHandler to process the error
    return errorHandler(error);
  }
});

