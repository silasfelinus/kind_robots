// server/api/art/user/[id].get.ts

import { defineEventHandler } from 'h3'
import type { ArtImage } from '~/prisma/generated/prisma/client'
import { errorHandler } from '../../../utils/error'
import prisma from '../../../utils/prisma'
import { getOptionalApiUser } from '@/server/utils/authGuard'
import { visibilityWhere } from '@/server/utils/contentAccess'

export default defineEventHandler(async (event) => {
  try {
    const userId = Number(event.context.params?.id) // Ensure the userId is correctly parsed from the URL parameter

    if (isNaN(userId) || userId <= 0) {
      event.node.res.statusCode = 400
      throw new Error('Invalid user ID')
    }

    const auth = await getOptionalApiUser(event)
    const userArt = await fetchArtByUserId(userId, auth)
    return { success: true, data: { art: userArt } }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

/*
 * Art entries by User ID, as the VIEWER may see them.
 *
 * `/api/art/user/5` returned every ArtImage that user owns -- private and
 * mature included -- to any caller. The viewer is threaded in rather than read
 * from a global, so the visibility rule is part of this function's contract and
 * a future caller cannot forget it. See await visibilityWhere().
 */
export async function fetchArtByUserId(
  userId: number,
  auth: Awaited<ReturnType<typeof getOptionalApiUser>>,
): Promise<ArtImage[]> {
  return await prisma.artImage.findMany({
    where: {
      AND: [
        { userId },
        await visibilityWhere(auth?.user, { isPublic: true, isMature: true }, auth?.isAdmin),
      ],
    },
    orderBy: {
      createdAt: 'desc', // Optionally order by most recent first
    },
  })
}
