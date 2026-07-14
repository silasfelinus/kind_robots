// /server/utils/messaging.ts
// Consent gate for direct messages. Enforces block relations and the
// recipient's messagePolicy (EVERYONE / FRIENDS / NONE).
import prisma from './prisma'

export type MessageGate =
  | { ok: true }
  | { ok: false; status: number; reason: string }

async function areFriends(a: number, b: number): Promise<boolean> {
  const row = await prisma.userRelation.findFirst({
    where: {
      type: 'FRIEND',
      status: 'ACCEPTED',
      OR: [
        { userId: a, relatedUserId: b },
        { userId: b, relatedUserId: a },
      ],
    },
    select: { id: true },
  })
  return !!row
}

async function hasBlockBetween(a: number, b: number): Promise<boolean> {
  const row = await prisma.userRelation.findFirst({
    where: {
      type: 'BLOCK',
      OR: [
        { userId: a, relatedUserId: b },
        { userId: b, relatedUserId: a },
      ],
    },
    select: { id: true },
  })
  return !!row
}

/**
 * Can `senderId` open/continue a DM with `recipientId`? Checks existence,
 * blocks (either direction), and the recipient's messagePolicy.
 */
export async function canMessage(
  senderId: number,
  recipientId: number,
): Promise<MessageGate> {
  if (senderId === recipientId) {
    return { ok: false, status: 400, reason: 'You cannot message yourself.' }
  }

  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { id: true, messagePolicy: true },
  })
  if (!recipient) {
    return { ok: false, status: 404, reason: 'Recipient not found.' }
  }

  if (await hasBlockBetween(senderId, recipientId)) {
    return { ok: false, status: 403, reason: 'You cannot message this user.' }
  }

  if (recipient.messagePolicy === 'NONE') {
    return { ok: false, status: 403, reason: 'This user is not accepting messages.' }
  }

  if (recipient.messagePolicy === 'FRIENDS' && !(await areFriends(senderId, recipientId))) {
    return {
      ok: false,
      status: 403,
      reason: 'This user only accepts messages from friends.',
    }
  }

  return { ok: true }
}
