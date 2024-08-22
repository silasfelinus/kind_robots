// server/api/utils/spotifyToken.ts
import { defineEventHandler, sendError, createError } from 'h3';
import { errorHandler } from './error';

export default defineEventHandler(async (event) => {
  const credentials = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const data = 'grant_type=client_credentials';

  try {
    const spotifyResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: data
    });

    const jsonResponse = await spotifyResponse.json();

    if (!spotifyResponse.ok) {
      // Using h3's sendError function to handle HTTP errors properly
      const error = createError({
        statusCode: spotifyResponse.status,
        statusMessage: jsonResponse.error_description || jsonResponse.error
      });
      sendError(event, error);
      return;
    }

    return { token: jsonResponse.access_token };
  } catch (error) {
    const errorDetails = errorHandler(error);
    const httpError = createError({
      statusCode: errorDetails.statusCode || 500,
      statusMessage: errorDetails.message
    });
    sendError(event, httpError);
  }
});
