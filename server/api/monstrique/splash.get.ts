import { defineEventHandler, setHeader } from 'h3'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import { viewerShowsMature } from '~/server/utils/contentAccess'
import { errorHandler } from '~/server/utils/error'
import { MONSTRIQUE_MATURE_SPLASH } from '~/server/utils/monstriqueSplash'
import prisma from '~/server/utils/prisma'

type Splash = { wide: string; tall: string }

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  setHeader(event, 'Vary', 'Authorization')
  try {
    const auth = await getOptionalApiUser(event)
    const mature = auth?.kind === 'jwt' && viewerShowsMature(auth?.user)
    const ids = [MONSTRIQUE_MATURE_SPLASH.wide, MONSTRIQUE_MATURE_SPLASH.tall]
    if (!mature || ids.some((id) => id === null))
      return { success: true, data: { splash: null as Splash | null } }
    const rows = await prisma.artImage.findMany({
      where: { id: { in: ids as number[] }, isMature: true },
      select: { id: true, imagePath: true },
    })
    const path = (id: number | null) =>
      rows.find((row) => row.id === id)?.imagePath ?? null
    const wide = path(MONSTRIQUE_MATURE_SPLASH.wide)
    const tall = path(MONSTRIQUE_MATURE_SPLASH.tall) ?? wide
    return {
      success: true,
      data: { splash: wide && tall ? ({ wide, tall } as Splash) : null },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message }
  }
})
