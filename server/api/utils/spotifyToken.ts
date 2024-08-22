// server/api/utils/spotifyToken.ts
import type { Response } from 'express';
import { errorHandler } from './error';

export default async (res: Response) => {
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
      // Handle Spotify API errors using the centralized error handler
      const errorOutput = errorHandler(new Error(`Spotify API error: ${jsonResponse.error}`));
      res.status(errorOutput.statusCode || 500).json(errorOutput);
      return;
    }

    res.json({ token: jsonResponse.access_token });
  } catch (error) {
    // Catch fetch and other unexpected errors
    const errorOutput = errorHandler(error);
    res.status(errorOutput.statusCode || 500).json(errorOutput);
  }
};
