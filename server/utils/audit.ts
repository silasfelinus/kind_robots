// /server/utils/audit.ts
// Thin helper for admin-action audit trails, written to the existing Log model.
// Best-effort: an audit-log failure must never break the action it records.
import prisma from './prisma'

export async function logAdminAction(
  actor: { id: number; username?: string | null },
  message: string,
): Promise<void> {
  try {
    await prisma.log.create({
      data: {
        message,
        username: actor.username ?? `user#${actor.id}`,
        userId: actor.id,
        timestamp: new Date(),
      },
    })
  } catch (err) {
    console.error('[audit] failed to write admin log:', err)
  }
}

/** Same audit trail, for an action the system took automatically rather
 * than one a human admin performed (e.g. auto-hiding a post that crossed
 * the health-claim flag-escalation threshold -- see forumApi.ts). Log.userId
 * is nullable specifically so these system entries don't have to borrow a
 * real admin's identity. */
export async function logSystemAction(message: string): Promise<void> {
  try {
    await prisma.log.create({
      data: {
        message,
        username: 'system',
        userId: null,
        timestamp: new Date(),
      },
    })
  } catch (err) {
    console.error('[audit] failed to write system log:', err)
  }
}
