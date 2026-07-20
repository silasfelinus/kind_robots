// /server/api/art/image/relations.ts
import { createError } from 'h3'
import prisma from '../../../utils/prisma'

type OwnableRow = { id: number; userId: number | null; isPublic: boolean | null }

export type ArtImageRelationAttachInput = {
  serverId?: number | null
  checkpointResourceId?: number | null
}

// Verifies existence (404 for missing) and permission (403 for a private target
// owned by someone else) for the Server / checkpoint Resource an ArtImage patch
// connects. A non-admin may only attach public or self-owned rows; admins skip
// the permission check but keep existence. Disconnects (null) are not checked.
async function assertRelationAccessible(
  id: number | null | undefined,
  find: (id: number) => Promise<OwnableRow | null>,
  label: string,
  userId: number,
  isAdmin: boolean,
): Promise<void> {
  if (typeof id !== 'number' || id <= 0) return

  const row = await find(id)

  if (!row) {
    throw createError({
      statusCode: 404,
      message: `${label} not found: ${id}.`,
    })
  }

  if (isAdmin) return

  if (row.userId !== userId && row.isPublic !== true) {
    throw createError({
      statusCode: 403,
      message: `You do not have permission to attach this ${label} to an ArtImage.`,
    })
  }
}

export async function assertArtImageRelationsAttachable(
  input: ArtImageRelationAttachInput,
  userId: number,
  isAdmin: boolean,
): Promise<void> {
  await Promise.all([
    assertRelationAccessible(
      typeof input.serverId === 'number' ? input.serverId : undefined,
      (id) =>
        prisma.server.findUnique({
          where: { id },
          select: { id: true, userId: true, isPublic: true },
        }),
      'Server',
      userId,
      isAdmin,
    ),
    assertRelationAccessible(
      typeof input.checkpointResourceId === 'number'
        ? input.checkpointResourceId
        : undefined,
      (id) =>
        prisma.resource.findUnique({
          where: { id },
          select: { id: true, userId: true, isPublic: true },
        }),
      'checkpoint Resource',
      userId,
      isAdmin,
    ),
  ])
}
