// server/middleware/auth.ts
import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const req = event.node.req
  const secretKey = req.headers['x-api-key']

  // Check if the route requires authentication
  if (event.context.route?.auth !== true) {
    console.log('No authentication required for this route');
    return; // No authentication required
  }

  // Validate the API key
  if (!secretKey) {
    console.error('Missing API key');
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' });
  }

  if (secretKey !== process.env.AUTH_SECRET) {
    console.error('Invalid API key');
    throw createError({ statusCode: 401, statusMessage: 'Invalid API Key' });
  }
});
