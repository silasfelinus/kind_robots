// server/middleware/auth.ts
import { defineEventHandler, createError } from 'h3';
import { errorHandler } from './../api/utils/error';

export default defineEventHandler((event) => {
  const req = event.node.req;
  const secretKey = req.headers['x-api-key'];

  // Check if the route requires authentication
  if (event.context.route?.auth !== true) {
    console.log('No authentication required for this route');
    return; // Continue since no authentication is required
  }

  try {
    // Validate the API key
    if (!secretKey) {
      throw new Error('Authentication required: API Key is missing.');
    }

    if (secretKey !== process.env.AUTH_SECRET) {
      throw new Error('Invalid API Key provided.');
    }

    console.log('Authentication successful');
  } catch (error) {
    const handledError = errorHandler(error as Error);
    // Correctly use createError by passing a single object
    throw createError({
      statusCode: handledError.statusCode || 401,
      statusMessage: handledError.message
    });
  }
});
