import { randomBytes, createHash } from 'crypto'
import prisma from '../utils/prisma' // Adjust this import to your setup

interface SpotifyData {
  accessToken: string
  refreshToken: string
  spotifyID: string
}

export async function getSpotifyData(username: string) {
  const userAuth = await prisma.user.findUnique({
    where: {
      username
    },
    select: {
      spotifyAccessToken: true,
      spotifyRefreshToken: true,
      spotifyID: true
    }
  })
  return userAuth
}

export async function updateSpotifyData(username: string, spotifyData: SpotifyData) {
  const userAuth = await prisma.user.update({
    where: {
      username
    },
    data: {
      spotifyAccessToken: spotifyData.accessToken,
      spotifyRefreshToken: spotifyData.refreshToken,
      spotifyID: spotifyData.spotifyID
    }
  })
  return userAuth
}
