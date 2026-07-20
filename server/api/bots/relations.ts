// /server/api/bots/relations.ts
import { createError } from 'h3'
import prisma from '../../utils/prisma'

export const BOT_RELATION_ID_LIMIT = 100

type OwnableRow = { id: number; userId: number | null; isPublic: boolean | null }

export type BotRelationAttachInput = {
  serverIds?: number[]
  artImageIds?: number[]
  dreamIds?: number[]
}

// Verifies existence (404 for missing) and permission (403 for a private target
// owned by someone else) for every connect/set relation target on a Bot. A
// non-admin may only attach public or self-owned rows; admins (and trusted
// server keys) skip the permission check but still get the existence check.
// Disconnect (removeDreamIds / null) targets are not checked because
// disconnecting a missing relation is a no-op.
async function assertRelationAccessible(
  ids: number[],
  find: (idsIn: number[]) => Promise<OwnableRow[]>,
  label: string,
  userId: number,
  isAdmin: boolean,
): Promise<void> {
  if (!ids.length) return

  const rows = await find(ids)
  const foundIds = new Set(rows.map((row) => row.id))
  const missing = ids.filter((id) => !foundIds.has(id))

  if (missing.length) {
    throw createError({
      statusCode: 404,
      message: `${label} not found: ${missing.join(', ')}.`,
    })
  }

  if (isAdmin) return

  const forbidden = rows.filter(
    (row) => row.userId !== userId && row.isPublic !== true,
  )

  if (forbidden.length) {
    throw createError({
      statusCode: 403,
      message: `You do not have permission to attach one or more ${label} records to this Bot.`,
    })
  }
}

export async function assertBotRelationsAttachable(
  input: BotRelationAttachInput,
  userId: number,
  isAdmin: boolean,
): Promise<void> {
  const dedupe = (ids: number[] = []) =>
    Array.from(new Set(ids.filter((id) => Number.isInteger(id) && id > 0)))

  const serverIds = dedupe(input.serverIds)
  const artImageIds = dedupe(input.artImageIds)
  const dreamIds = dedupe(input.dreamIds)

  await Promise.all([
    assertRelationAccessible(
      serverIds,
      (idsIn) =>
        prisma.server.findMany({
          where: { id: { in: idsIn } },
          select: { id: true, userId: true, isPublic: true },
        }),
      'Bot Server relation',
      userId,
      isAdmin,
    ),
    assertRelationAccessible(
      artImageIds,
      (idsIn) =>
        prisma.artImage.findMany({
          where: { id: { in: idsIn } },
          select: { id: true, userId: true, isPublic: true },
        }),
      'Bot ArtImage relation',
      userId,
      isAdmin,
    ),
    assertRelationAccessible(
      dreamIds,
      (idsIn) =>
        prisma.dream.findMany({
          where: { id: { in: idsIn } },
          select: { id: true, userId: true, isPublic: true },
        }),
      'Bot Dream relation',
      userId,
      isAdmin,
    ),
  ])
}
