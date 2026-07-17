// /server/utils/restriction.ts
// Admin "shadow-restrict" ("block"): a restricted user can still sign in, but
// all of their content is forced private and they are hidden from public
// listings. Two layers:
//   1. privatizeUserContent(): one-time bulk flip of isPublic=false on restrict.
//   2. getRestrictedUserIds()/notInRestricted(): read-time safety net so the
//      public directory & feeds hide restricted users even for content created
//      after the flip.
import prisma from './prisma'

/** IDs of users currently shadow-restricted. */
export async function getRestrictedUserIds(): Promise<number[]> {
  const rows = await prisma.user.findMany({
    where: { isRestricted: true },
    select: { id: true },
  })
  return rows.map((r) => r.id)
}

/**
 * Prisma `where` fragment excluding restricted users by a userId column.
 * Usage: prisma.artImage.findMany({ where: { isPublic: true, ...(await notInRestricted()) } })
 * Returns `{}` when nobody is restricted (avoids a needless `notIn: []`).
 */
export async function notInRestricted(
  field = 'userId',
): Promise<Record<string, unknown>> {
  const ids = await getRestrictedUserIds()
  if (ids.length === 0) return {}
  return { [field]: { notIn: ids } }
}

/**
 * Force every piece of content this user owns to private. Best-effort across
 * the main public-facing content models; each runs as its own updateMany inside
 * a single transaction so a restrict is atomic.
 */
export async function privatizeUserContent(userId: number): Promise<void> {
  await prisma.$transaction([
    prisma.artImage.updateMany({
      where: { userId },
      data: { isPublic: false },
    }),
    prisma.chat.updateMany({ where: { userId }, data: { isPublic: false } }),
    prisma.socialPost.updateMany({
      where: { userId },
      data: { isPublic: false },
    }),
    prisma.dream.updateMany({ where: { userId }, data: { isPublic: false } }),
    prisma.prompt.updateMany({ where: { userId }, data: { isPublic: false } }),
    prisma.scenario.updateMany({
      where: { userId },
      data: { isPublic: false },
    }),
    prisma.character.updateMany({
      where: { userId },
      data: { isPublic: false },
    }),
    prisma.theme.updateMany({ where: { userId }, data: { isPublic: false } }),
    prisma.bot.updateMany({ where: { userId }, data: { isPublic: false } }),
    prisma.reward.updateMany({ where: { userId }, data: { isPublic: false } }),
    prisma.resource.updateMany({
      where: { userId },
      data: { isPublic: false },
    }),
  ])
}
