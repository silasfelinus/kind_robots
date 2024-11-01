import { createError } from 'h3'
import { verifyJwtToken } from '../auth'
import prisma from '../utils/prisma'

export function extractTokenFromHeader(
  authorizationHeader: string | undefined,
): string {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message:
        'Authorization token is required in the format "Bearer <token>".',
    })
  }
  return authorizationHeader.split(' ')[1] // Extract token after "Bearer "
}

export async function getUserIdFromToken(token: string): Promise<number> {
  const verificationResult = await verifyJwtToken(token)
  if (!verificationResult || !verificationResult.userId) {
    throw createError({ statusCode: 401, message: 'Invalid or expired token.' })
  }

  // Fetch userId using apiKey (if needed)
  const user = await prisma.user.findFirst({
    where: { apiKey: token },
    select: { id: true },
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'User not found for the provided token.',
    })
  }

  return user.id
}

export async function authorizeUserForArtEntry(
  userId: number,
  artId: number,
): Promise<void> {
  const artEntry = await prisma.art.findUnique({
    where: { id: artId },
    select: { userId: true },
  })

  if (!artEntry) {
    throw createError({
      statusCode: 404,
      message: `Art entry with ID ${artId} does not exist.`,
    })
  }

  if (artEntry.userId !== userId) {
    throw createError({
      statusCode: 403,
      message: 'User is not authorized to access this art entry.',
    })
  }
}
