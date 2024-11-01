import { createError } from 'h3'
import prisma from '../utils/prisma'

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
