// /server/api/dreams/index.ts
import { createError } from 'h3'

export type DreamAccessAction = 'view' | 'chat' | 'mutate'

type DreamAccessInput = {
  dream: {
    userId: number
    isPublic: boolean
  }
  userId?: number | null
  userRole?: string | null
  action?: DreamAccessAction
}

/**
 * Server-side access for Dreams is intentionally simple: public/private plus
 * owner/admin. Anything finer-grained (codes, solo sessions, room privacy) is
 * handled on the front end now that the chatroom layer lives there.
 */
export function assertDreamAccess({
  dream,
  userId,
  userRole,
  action = 'view',
}: DreamAccessInput) {
  const isOwner = Boolean(userId && dream.userId === userId)
  const isAdmin = userRole === 'ADMIN'

  if (isOwner || isAdmin) return

  if (action === 'mutate' || action === 'chat') {
    throw createError({
      statusCode: 403,
      message:
        action === 'mutate'
          ? 'Only the Dream owner can reshape this Dream.'
          : 'You do not have permission to contribute to this Dream.',
    })
  }

  // action === 'view'
  if (dream.isPublic) return

  throw createError({
    statusCode: 403,
    message: 'You do not have permission to view this Dream.',
  })
}
