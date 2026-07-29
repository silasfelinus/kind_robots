// /server/utils/artJobResourceRefresh.ts
import { createError } from 'h3'
import { ResourceType } from '~/prisma/generated/prisma/client'
import {
  parseArtJobPayload,
  type ArtJobPayloadRecord,
} from './artJobPayload'
import { applyArtJobOverrides } from './artJobRetry'
import prisma from './prisma'

const LORA_TYPES = [ResourceType.LORA, ResourceType.LYCORIS]

function asRecord(value: unknown): ArtJobPayloadRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as ArtJobPayloadRecord
}

function normalizeResourceIds(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return [
    ...new Set(
      value
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ]
}

function normalizeLocalPath(value: unknown): string {
  return typeof value === 'string'
    ? value.trim().replaceAll('\\', '/')
    : ''
}

function currentLoraResourceIds(payload: ArtJobPayloadRecord): number[] {
  const resources = asRecord(payload.resources)
  const resourceIds = normalizeResourceIds(resources.loraResourceIds)
  return resourceIds.length
    ? resourceIds
    : normalizeResourceIds(payload.loraResourceIds)
}

function currentLoraNames(payload: ArtJobPayloadRecord): string[] {
  const resources = asRecord(payload.resources)
  if (!Array.isArray(resources.loraNames)) return []
  return resources.loraNames
    .map(normalizeLocalPath)
    .filter((name): name is string => Boolean(name))
}

export type ArtJobLoraResourceRefresh = {
  payload: ArtJobPayloadRecord
  changed: boolean
  loraResourceIds: number[]
  loraNames: string[]
}

export function applyResolvedLoraResourceToArtJobPayload(
  rawPayload: unknown,
  resource: { id: number; localPath: string },
): ArtJobLoraResourceRefresh {
  if (!Number.isInteger(resource.id) || resource.id <= 0) {
    throw createError({ statusCode: 409, message: 'Invalid LoRA Resource id.' })
  }

  const localPath = normalizeLocalPath(resource.localPath)
  if (!localPath) {
    throw createError({
      statusCode: 409,
      message: `LoRA Resource ${resource.id} does not have a localPath for ComfyUI.`,
    })
  }

  const payload = structuredClone(parseArtJobPayload(rawPayload))
  const before = JSON.stringify(payload)
  applyArtJobOverrides(payload, { loraName: localPath })

  const resources = asRecord(payload.resources)
  resources.loraResourceIds = [resource.id]
  resources.loraNames = [localPath]
  payload.resources = resources

  if (Array.isArray(payload.loraResourceIds)) {
    payload.loraResourceIds = [resource.id]
  }

  return {
    payload,
    changed: before !== JSON.stringify(payload),
    loraResourceIds: [resource.id],
    loraNames: [localPath],
  }
}

export async function refreshArtJobLoraResources(
  rawPayload: unknown,
): Promise<ArtJobLoraResourceRefresh> {
  const payload = structuredClone(parseArtJobPayload(rawPayload))
  const loraResourceIds = currentLoraResourceIds(payload)

  if (!loraResourceIds.length) {
    return {
      payload,
      changed: false,
      loraResourceIds: [],
      loraNames: currentLoraNames(payload),
    }
  }

  if (loraResourceIds.length > 1) {
    throw createError({
      statusCode: 409,
      message: `ArtJob references multiple LoRA Resources (${loraResourceIds.join(', ')}), but queued workflows currently support one.`,
    })
  }

  const resourceId = loraResourceIds[0]!
  const resource = await prisma.resource.findFirst({
    where: {
      id: resourceId,
      isActive: true,
      resourceType: { in: LORA_TYPES },
    },
    select: {
      id: true,
      localPath: true,
    },
  })

  if (!resource) {
    throw createError({
      statusCode: 409,
      message: `LoRA Resource ${resourceId} is missing, inactive, or no longer a LoRA Resource.`,
    })
  }

  return applyResolvedLoraResourceToArtJobPayload(payload, {
    id: resource.id,
    localPath: String(resource.localPath || ''),
  })
}
