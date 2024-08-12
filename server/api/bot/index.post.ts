// /server/api/bot/index.post.ts
import { defineEventHandler, readBody } from 'h3';
import { addBots } from '../bots';
import { errorHandler } from '../utils/error'; // Import the error handler

export default defineEventHandler(async (event) => {
  try {
    const botsData = await readBody(event);
    const result = await addBots(botsData);
    return { success: true, ...result };
  } catch (error) {
    // Use the error handler to process the error
    const { message, statusCode } = errorHandler(error);

    // Return the error response with the processed message and status code
    return {
      success: false,
      message: 'Failed to create a new bot',
      error: message,
      statusCode: statusCode || 500, // Default to 500 if no status code is provided
    };
  }
});
