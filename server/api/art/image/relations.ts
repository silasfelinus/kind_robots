// /server/api/art/image/relations.ts
import { createError } from 'h3'
import { ResourceType } from '~/prisma/generated/prisma/client'
import prisma from '../../../utils/prisma'

type OwnableRow = {
  id: number
  userId: number | null
  isPublic: boolean | null
}

type LoraRow = OwnableRow & {
  resourceType: ResourceType
}

export type ArtImageRelationAttachInput = {
  serverId?: number | null
  checkpointResourceId?: number | null
  loraResourceIds?: number[]
}

function normalizeIds(value: unknown): number[] {
  if (!Array.isArray(value)) return []

  return [
    ...new Set(
      value
        .map((entry) => Number(entry))
        .filter((entry) => Number.isInteger(entry) && entry > 0),
    ),
  ]
}

function assertOwnedOrPublic(
  row: OwnableRow,
  label: string,
  userId: number,
  isAdmin: boolean,
): void {
  if (isAdmin) return

  if (row.userId !== userId && row.isPublic !== true) {
    throw createError({
      statusCode: 403,
      message: `You do not have permission to attach this ${label} to an ArtImage.`,
    })
  }
}

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

  assertOwnedOrPublic(row, label, userId, isAdmin)
}

async function assertLoraResourcesAccessible(
  ids: number[],
  userId: number,
  isAdmin: boolean,
): Promise<void> {
  const loraResourceIds = normalizeIds(ids)
  if (!loraResourceIds.length) return

  const rows: LoraRow[] = await prisma.resource.findMany({
    where: {
      id: { in: loraResourceIds },
      resourceType: { in: [ResourceType.LORA, ResourceType.LYCORIS] },
    },
    select: {
      id: true,
      userId: true,
      isPublic: true,
      resourceType: true,
    },
  })

  const foundIds = new Set(rows.map((row) => row.id))
  const missingIds = loraResourceIds.filter((id) => !foundIds.has(id))

  if (missingIds.length) {
    throw createError({
      statusCode: 404,
      message: `LoRA Resources not found or incompatible: ${missingIds.join(', ')}.`,
    })
  }

  rows.forEach((row) =>
    assertOwnedOrPublic(row, 'LoRA Resource', userId, isAdmin),
  )
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
        prisma.resource.findFirst({
          where: { id, resourceType: ResourceType.CHECKPOINT },
          select: { id: true, userId: true, isPublic: true },
        }),
      'checkpoint Resource',
      userId,
      isAdmin,
    ),
    assertLoraResourcesAccessible(
      input.loraResourceIds ?? [],
      userId,
      isAdmin,
    ),
  ])
}
