// /server/api/reactions/access.ts
import { createError } from 'h3'

type OwnableRow = { userId: number | null; isPublic: boolean | null }

// A content reaction target (ArtImage, Dream, ...) must exist and be public or
// owned by the reacting user; admins bypass. Used by the per-target reaction
// sub-routes so they enforce the same visibility rule as POST /api/reactions
// (audit F-2 residual).
export async function assertReactionContentTargetAccessible(options: {
  find: () => Promise<OwnableRow | null>
  label: string
  targetId: number
  userId: number
  isAdmin: boolean
}): Promise<void> {
  const { find, label, targetId, userId, isAdmin } = options

  const row = await find()

  if (!row) {
    throw createError({
      statusCode: 404,
      message: `${label} #${targetId} not found.`,
    })
  }

  if (isAdmin) return

  if (row.userId !== userId && row.isPublic !== true) {
    throw createError({
      statusCode: 403,
      message: `You do not have permission to react to this ${label}.`,
    })
  }
}
