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
        const errorOutput = errorHandler(new Error(`Spotify API error: ${jsonResponse.error}`));
        res.writeHead(errorOutput.statusCode || 500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(errorOutput));
        return;
      }
  
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ token: jsonResponse.access_token }));
    } catch (error) {
      const errorOutput = errorHandler(error);
      res.writeHead(errorOutput.statusCode || 500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(errorOutput));
    }
  };
  