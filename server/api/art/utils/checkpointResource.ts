// /server/api/art/utils/checkpointResource.ts
import { createError } from 'h3'
import prisma from '../../../utils/prisma'
import type { Resource, Server } from '~/prisma/generated/prisma/client'

export type ResolvedCheckpointResource = {
  checkpoint: string | null
  checkpointResourceId: number | null
  resource: Pick<
    Resource,
    | 'id'
    | 'name'
    | 'customLabel'
    | 'localPath'
    | 'MediaPath'
    | 'supportedServer'
    | 'resourceType'
  > | null
}

export type CheckpointResourceRequestData = {
  checkpoint?: string | null
  checkpointResourceId?: number | null
  resourceId?: number | null
}

export async function resolveCheckpointResource(input: {
  requestData: CheckpointResourceRequestData
  server?: Server | null
}): Promise<ResolvedCheckpointResource> {
  const resourceId =
    normalizeId(input.requestData.checkpointResourceId) ??
    normalizeId(input.requestData.resourceId)

  const fallbackCheckpoint = normalizeCheckpointName(
    input.requestData.checkpoint,
  )

  if (!resourceId) {
    return {
      checkpoint: fallbackCheckpoint,
      checkpointResourceId: null,
      resource: null,
    }
  }

  const serverId = input.server?.id ?? null

  const resource = await prisma.resource.findFirst({
    where: {
      id: resourceId,
      resourceType: 'CHECKPOINT',
      OR: serverId
        ? [{ Servers: { some: { id: serverId } } }, { Servers: { none: {} } }]
        : [{ Servers: { none: {} } }],
    },
    select: {
      id: true,
      name: true,
      customLabel: true,
      localPath: true,
      MediaPath: true,
      supportedServer: true,
      resourceType: true,
    },
  })

  if (!resource) {
    throw createError({
      statusCode: 404,
      message: `Checkpoint resource ${resourceId} was not found or is not available for this server.`,
    })
  }

  const checkpoint =
    normalizeCheckpointName(resource.localPath) ||
    normalizeCheckpointName(resource.name) ||
    normalizeCheckpointName(resource.customLabel) ||
    fallbackCheckpoint

  if (!checkpoint) {
    throw createError({
      statusCode: 400,
      message: `Checkpoint resource ${resource.id} does not have a usable checkpoint name.`,
    })
  }

  return {
    checkpoint,
    checkpointResourceId: resource.id,
    resource,
  }
}

export function normalizeId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isInteger(parsed) && parsed > 0) return parsed
  }

  return null
}

export function normalizeCheckpointName(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const normalized = value.trim().replace(/^['"]|['"]$/g, '')

  return normalized || null
}
