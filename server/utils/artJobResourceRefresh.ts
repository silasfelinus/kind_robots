// /server/utils/artJobResourceRefresh.ts
import { createError } from 'h3'
import { ResourceType } from '~/prisma/generated/prisma/client'
import {
  parseArtJobPayload,
  type ArtJobPayloadRecord,
} from './artJobPayload'
import { applyArtJobOverrides } from './artJobRetry'

const LORA_TYPES = [ResourceType.LORA, ResourceType.LYCORIS]
const LORA_NODE_TYPES = new Set(['LoraLoaderModelOnly', 'LoraLoader'])

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

function normalizeResourceId(value: unknown): number | null {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function normalizeLocalPath(value: unknown): string {
  return typeof value === 'string'
    ? value.trim().replaceAll('\\', '/')
    : ''
}

function normalizeIdentity(value: unknown): string {
  return normalizeLocalPath(value).toLowerCase()
}

function pathBasename(value: unknown): string {
  const normalized = normalizeIdentity(value).replace(/^\/+|\/+$/g, '')
  return normalized.split('/').pop() || ''
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

function currentCheckpointResourceId(
  payload: ArtJobPayloadRecord,
): number | null {
  const resources = asRecord(payload.resources)
  return (
    normalizeResourceId(resources.checkpointResourceId) ||
    normalizeResourceId(payload.checkpointResourceId)
  )
}

function currentCheckpointName(payload: ArtJobPayloadRecord): string | null {
  const resources = asRecord(payload.resources)
  return (
    normalizeLocalPath(resources.checkpointName) ||
    normalizeLocalPath(payload.checkpoint) ||
    null
  )
}

export type ResolvedCheckpointResource = {
  id: number
  localPath: string
}

export async function resolveActiveCheckpointResourceReference(input: {
  resourceId?: unknown
  names?: unknown[]
}): Promise<ResolvedCheckpointResource | null> {
  const { default: prisma } = await import('./prisma')
  const resourceId = normalizeResourceId(input.resourceId)

  if (resourceId) {
    const exact = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        isActive: true,
        resourceType: ResourceType.CHECKPOINT,
      },
      select: { id: true, localPath: true },
    })

    if (exact) {
      const localPath = normalizeLocalPath(exact.localPath)
      if (!localPath) {
        throw createError({
          statusCode: 409,
          message: `Checkpoint Resource ${resourceId} does not have a localPath for ComfyUI.`,
        })
      }
      return { id: exact.id, localPath }
    }
  }

  const requested = [
    ...new Set((input.names || []).map(normalizeIdentity).filter(Boolean)),
  ]
  if (!requested.length) return null

  const requestedBasenames = new Set(requested.map(pathBasename).filter(Boolean))
  const resources = await prisma.resource.findMany({
    where: {
      isActive: true,
      resourceType: ResourceType.CHECKPOINT,
    },
    select: {
      id: true,
      name: true,
      customLabel: true,
      localPath: true,
    },
    orderBy: { id: 'asc' },
  })

  const exactMatches = resources.filter((resource) => {
    const identities = [
      resource.localPath,
      resource.name,
      resource.customLabel,
    ]
      .map(normalizeIdentity)
      .filter(Boolean)
    return identities.some((identity) => requested.includes(identity))
  })

  const basenameMatches = resources.filter((resource) => {
    const basename = pathBasename(resource.localPath || resource.name)
    return basename && requestedBasenames.has(basename)
  })

  const matches = exactMatches.length ? exactMatches : basenameMatches
  const distinctMatches = [...new Map(matches.map((item) => [item.id, item])).values()]

  if (distinctMatches.length > 1) {
    throw createError({
      statusCode: 409,
      message: `Checkpoint reference matches multiple active Resources (${distinctMatches
        .map((resource) => resource.id)
        .join(', ')}). Repair the Resource catalog instead of guessing.`,
    })
  }

  const match = distinctMatches[0]
  if (!match) return null

  const localPath = normalizeLocalPath(match.localPath)
  if (!localPath) {
    throw createError({
      statusCode: 409,
      message: `Checkpoint Resource ${match.id} does not have a localPath for ComfyUI.`,
    })
  }

  return { id: match.id, localPath }
}

export type ArtJobCheckpointResourceRefresh = {
  payload: ArtJobPayloadRecord
  changed: boolean
  checkpointResourceId: number | null
  checkpointName: string | null
}

export function applyResolvedCheckpointResourceToArtJobPayload(
  rawPayload: unknown,
  resource: ResolvedCheckpointResource,
): ArtJobCheckpointResourceRefresh {
  if (!Number.isInteger(resource.id) || resource.id <= 0) {
    throw createError({
      statusCode: 409,
      message: 'Invalid checkpoint Resource id.',
    })
  }

  const localPath = normalizeLocalPath(resource.localPath)
  if (!localPath) {
    throw createError({
      statusCode: 409,
      message: `Checkpoint Resource ${resource.id} does not have a localPath for ComfyUI.`,
    })
  }

  const payload = structuredClone(parseArtJobPayload(rawPayload))
  const before = JSON.stringify(payload)
  applyArtJobOverrides(payload, { checkpoint: localPath })

  const resources = asRecord(payload.resources)
  resources.checkpointResourceId = resource.id
  resources.checkpointName = localPath
  payload.resources = resources
  payload.checkpointResourceId = resource.id

  return {
    payload,
    changed: before !== JSON.stringify(payload),
    checkpointResourceId: resource.id,
    checkpointName: localPath,
  }
}

export async function refreshArtJobCheckpointResource(
  rawPayload: unknown,
): Promise<ArtJobCheckpointResourceRefresh> {
  const payload = structuredClone(parseArtJobPayload(rawPayload))
  const checkpointResourceId = currentCheckpointResourceId(payload)
  const checkpointName = currentCheckpointName(payload)

  if (!checkpointResourceId) {
    return {
      payload,
      changed: false,
      checkpointResourceId: null,
      checkpointName,
    }
  }

  const resource = await resolveActiveCheckpointResourceReference({
    resourceId: checkpointResourceId,
    names: checkpointName ? [checkpointName] : [],
  })

  if (!resource) {
    throw createError({
      statusCode: 409,
      message: `Checkpoint Resource ${checkpointResourceId} is missing, inactive, or no longer a checkpoint Resource.`,
    })
  }

  return applyResolvedCheckpointResourceToArtJobPayload(payload, resource)
}

export type ArtJobLoraResourceRefresh = {
  payload: ArtJobPayloadRecord
  changed: boolean
  loraResourceIds: number[]
  loraNames: string[]
}

export type ResolvedLoraResource = {
  id: number
  localPath: string
}

function applyIndexedLoraPaths(
  payload: ArtJobPayloadRecord,
  localPaths: string[],
): void {
  const workflow = asRecord(payload.workflow)
  const matchedIndexes = new Set<number>()

  for (const node of Object.values(workflow)) {
    const record = asRecord(node)
    const classType = String(record.class_type || '')
    if (!LORA_NODE_TYPES.has(classType)) continue

    const meta = asRecord(record._meta)
    const chainIndex = Number(meta.krLoraIndex)
    if (
      !Number.isInteger(chainIndex) ||
      chainIndex < 0 ||
      chainIndex >= localPaths.length
    ) {
      continue
    }

    const inputs = asRecord(record.inputs)
    if (!('lora_name' in inputs)) continue
    inputs.lora_name = localPaths[chainIndex]!
    record.inputs = inputs
    matchedIndexes.add(chainIndex)
  }

  if (matchedIndexes.size !== localPaths.length) {
    throw createError({
      statusCode: 409,
      message: `ArtJob references ${localPaths.length} LoRA Resources, but its workflow exposes only ${matchedIndexes.size} indexed LoRA links. Rebuild the job instead of guessing the stack order.`,
    })
  }

  payload.workflow = workflow
}

export function applyResolvedLoraResourcesToArtJobPayload(
  rawPayload: unknown,
  resolvedResources: ResolvedLoraResource[],
): ArtJobLoraResourceRefresh {
  const normalized = resolvedResources.map((resource) => {
    if (!Number.isInteger(resource.id) || resource.id <= 0) {
      throw createError({
        statusCode: 409,
        message: 'Invalid LoRA Resource id.',
      })
    }

    const localPath = normalizeLocalPath(resource.localPath)
    if (!localPath) {
      throw createError({
        statusCode: 409,
        message: `LoRA Resource ${resource.id} does not have a localPath for ComfyUI.`,
      })
    }

    return { id: resource.id, localPath }
  })

  const payload = structuredClone(parseArtJobPayload(rawPayload))
  const before = JSON.stringify(payload)
  const localPaths = normalized.map((resource) => resource.localPath)
  const resourceIds = normalized.map((resource) => resource.id)

  if (normalized.length === 1) {
    applyArtJobOverrides(payload, { loraName: localPaths[0]! })
  } else if (normalized.length > 1) {
    applyIndexedLoraPaths(payload, localPaths)
    payload.loraName = localPaths[0]!
  }

  const resources = asRecord(payload.resources)
  resources.loraResourceIds = resourceIds
  resources.loraNames = localPaths
  payload.resources = resources

  if (Array.isArray(payload.loraResourceIds)) {
    payload.loraResourceIds = resourceIds
  }

  return {
    payload,
    changed: before !== JSON.stringify(payload),
    loraResourceIds: resourceIds,
    loraNames: localPaths,
  }
}

export function applyResolvedLoraResourceToArtJobPayload(
  rawPayload: unknown,
  resource: ResolvedLoraResource,
): ArtJobLoraResourceRefresh {
  return applyResolvedLoraResourcesToArtJobPayload(rawPayload, [resource])
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

  const { default: prisma } = await import('./prisma')
  const resources = await prisma.resource.findMany({
    where: {
      id: { in: loraResourceIds },
      isActive: true,
      resourceType: { in: LORA_TYPES },
    },
    select: {
      id: true,
      localPath: true,
    },
  })
  const byId = new Map(resources.map((resource) => [resource.id, resource]))

  const resolvedResources = loraResourceIds.map((resourceId) => {
    const resource = byId.get(resourceId)
    if (!resource) {
      throw createError({
        statusCode: 409,
        message: `LoRA Resource ${resourceId} is missing, inactive, or no longer a LoRA Resource.`,
      })
    }
    return {
      id: resource.id,
      localPath: String(resource.localPath || ''),
    }
  })

  return applyResolvedLoraResourcesToArtJobPayload(payload, resolvedResources)
}

export type ArtJobResourceRefresh = {
  payload: ArtJobPayloadRecord
  changed: boolean
  checkpointResourceId: number | null
  checkpointName: string | null
  loraResourceIds: number[]
  loraNames: string[]
}

export async function refreshArtJobResources(
  rawPayload: unknown,
): Promise<ArtJobResourceRefresh> {
  const checkpoint = await refreshArtJobCheckpointResource(rawPayload)
  const lora = await refreshArtJobLoraResources(checkpoint.payload)

  return {
    payload: lora.payload,
    changed: checkpoint.changed || lora.changed,
    checkpointResourceId: checkpoint.checkpointResourceId,
    checkpointName: checkpoint.checkpointName,
    loraResourceIds: lora.loraResourceIds,
    loraNames: lora.loraNames,
  }
}
