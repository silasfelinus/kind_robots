// /server/utils/notify.ts
// Create in-app notifications. Best-effort: a notification failure must never
// break the action that triggered it (a sent message, an accepted friend).
import prisma from './prisma'
import type { NotificationType } from '~/prisma/generated/prisma/client'

export async function createNotification(input: {
  userId: number
  type: NotificationType
  title: string
  body?: string | null
  linkPath?: string | null
  actorId?: number | null
  entityId?: number | null
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        linkPath: input.linkPath ?? null,
        actorId: input.actorId ?? null,
        entityId: input.entityId ?? null,
      },
    })
  } catch (err) {
    console.error('[notify] failed to create notification:', err)
  }
}
