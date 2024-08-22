//server/api/utils/spotifyToken
import type { Request, Response } from 'express';
import { errorHandler } from './error';

// Function to fetch Spotify access token
export default async (req: Request, res: Response) => {
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
      throw new Error(`Spotify API error: ${jsonResponse.error}`);
    }

    res.json({ token: jsonResponse.access_token });
  } catch (error) {
    const { success, message, statusCode } = errorHandler({ error });
    res.status(500).json({ message, statusCode, success });
    console.error(`Spotify Token Fetch Error: ${message}, Status Code: ${statusCode}, Success: ${success}`);
  }
};
