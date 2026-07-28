// /server/utils/artLoraResource.ts
import { createError } from 'h3'
import {
  ResourceType,
  SupportedServer,
} from '~/prisma/generated/prisma/client'
import { resolveMaturityPrivacy } from '~/utils/maturityPrivacy'
import prisma from './prisma'

export type LoraAwareEnqueueBody = {
  loraName?: string | null
  loraResourceIds?: number[] | null
} & Record<string, unknown>

type LoraResourceRecord = {
  id: number
  name: string
  customLabel: string | null
  localPath: string | null
  customUrl: string | null
  civitaiUrl: string | null
  huggingUrl: string | null
  supportedServer: SupportedServer
}

const LORA_TYPES = [ResourceType.LORA, ResourceType.LYCORIS]
const RESOURCE_RESOLVED_ENGINES = new Set([
  'kontext',
  'krea2',
  'flux2',
  'ltx',
  'wan',
])

function normalizeText(value: unknown): string {
  return typeof value === 'string'
    ? value.trim().replaceAll('\\', '/').toLowerCase()
    : ''
}

function pathBasename(value: unknown): string {
  const normalized = normalizeText(value).replace(/^\/+|\/+$/g, '')
  return normalized.split('/').pop() || ''
}

function pathStem(value: unknown): string {
  return pathBasename(value).replace(/\.(safetensors|ckpt|pt|bin)$/i, '')
}

function normalizeIds(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return [
    ...new Set(
      value
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ]
}

function uniqueMatch(
  resources: LoraResourceRecord[],
  predicate: (resource: LoraResourceRecord) => boolean,
): LoraResourceRecord | null {
  const matches = resources.filter(predicate)
  return matches.length === 1 ? matches[0]! : null
}

function matchingResources(
  resources: LoraResourceRecord[],
  requestedName: string,
): LoraResourceRecord[] {
  const requested = normalizeText(requestedName)
  const requestedBase = pathBasename(requestedName)
  const requestedStem = pathStem(requestedName)

  const exactLocal = uniqueMatch(
    resources,
    (resource) => normalizeText(resource.localPath) === requested,
  )
  if (exactLocal) return [exactLocal]

  const exactIdentity = resources.filter((resource) =>
    [resource.name, resource.customLabel].some(
      (value) => normalizeText(value) === requested,
    ),
  )
  if (exactIdentity.length) return exactIdentity

  const exactSource = resources.filter((resource) =>
    [resource.customUrl, resource.civitaiUrl, resource.huggingUrl].some(
      (value) => {
        const normalized = normalizeText(value)
        return normalized === requested || normalized.endsWith(`/${requested}`)
      },
    ),
  )
  if (exactSource.length) return exactSource

  if (requestedBase) {
    const basenameMatches = resources.filter(
      (resource) => pathBasename(resource.localPath) === requestedBase,
    )
    if (basenameMatches.length) return basenameMatches
  }

  if (requestedStem) {
    return resources.filter((resource) => {
      const identities = [
        pathStem(resource.localPath),
        normalizeText(resource.name),
        normalizeText(resource.customLabel),
      ].filter(Boolean)
      return identities.some(
        (identity) =>
          identity === requestedStem ||
          identity.includes(requestedStem) ||
          requestedStem.includes(identity),
      )
    })
  }

  return []
}

function compatibilityRank(
  resource: LoraResourceRecord,
  engine: string,
): number {
  if (engine === 'kontext') {
    if (resource.supportedServer === SupportedServer.KONTEXT) return 30
    if (resource.supportedServer === SupportedServer.FLUX) return 20
    if (resource.supportedServer === SupportedServer.GENERIC) return 10
  }

  if (engine === 'krea2' || engine === 'flux2') {
    if (resource.supportedServer === SupportedServer.FLUX) return 30
    if (resource.supportedServer === SupportedServer.KONTEXT) return 20
    if (resource.supportedServer === SupportedServer.GENERIC) return 10
  }

  if (engine === 'ltx') {
    if (resource.supportedServer === SupportedServer.LTX) return 30
    if (resource.supportedServer === SupportedServer.GENERIC) return 10
  }

  if (engine === 'wan') {
    if (resource.supportedServer === SupportedServer.WAN) return 30
    if (resource.supportedServer === SupportedServer.GENERIC) return 10
  }

  return 0
}

function chooseCompatibleMatch(
  resources: LoraResourceRecord[],
  engine: string,
  requestedName: string,
): LoraResourceRecord | null {
  const matches = matchingResources(resources, requestedName)
  if (!matches.length) return null
  if (matches.length === 1) return matches[0]!

  const ranked = matches
    .map((resource) => ({ resource, rank: compatibilityRank(resource, engine) }))
    .sort((a, b) => b.rank - a.rank || a.resource.id - b.resource.id)

  if (ranked.length > 1 && ranked[0]!.rank === ranked[1]!.rank) {
    throw createError({
      statusCode: 409,
      message: `LoRA "${requestedName}" matches multiple Resources (${ranked
        .map(({ resource }) => resource.id)
        .join(', ')}). Select a Resource explicitly.`,
    })
  }

  return ranked[0]!.resource
}

export async function resolveEnqueueLoraResource(input: {
  body: LoraAwareEnqueueBody
  engine: string
  userId: number
  isAdmin: boolean
}): Promise<{
  body: LoraAwareEnqueueBody
  resourceIds: number[]
  resourceName: string | null
}> {
  const normalizedBody: LoraAwareEnqueueBody = {
    ...input.body,
    ...resolveMaturityPrivacy(input.body),
  }
  const resourceIds = normalizeIds(normalizedBody.loraResourceIds)
  const requestedName = String(normalizedBody.loraName || '').trim()

  if (!RESOURCE_RESOLVED_ENGINES.has(input.engine)) {
    return {
      body: normalizedBody,
      resourceIds,
      resourceName: requestedName || null,
    }
  }

  if (!resourceIds.length && !requestedName) {
    return { body: normalizedBody, resourceIds: [], resourceName: null }
  }

  if (resourceIds.length > 1) {
    throw createError({
      statusCode: 400,
      message: `${input.engine} workflows currently support one LoRA Resource per job.`,
    })
  }

  const visibility = input.isAdmin
    ? {}
    : {
        OR: [{ isPublic: true }, { userId: input.userId }],
      }

  const select = {
    id: true,
    name: true,
    customLabel: true,
    localPath: true,
    customUrl: true,
    civitaiUrl: true,
    huggingUrl: true,
    supportedServer: true,
  } as const

  let resource: LoraResourceRecord | null = null

  if (resourceIds.length) {
    resource = await prisma.resource.findFirst({
      where: {
        AND: [
          {
            id: resourceIds[0],
            isActive: true,
            resourceType: { in: LORA_TYPES },
          },
          visibility,
        ],
      },
      select,
    })

    if (!resource) {
      throw createError({
        statusCode: 404,
        message: `LoRA Resource ${resourceIds[0]} was not found or is not accessible.`,
      })
    }
  } else {
    const resources = await prisma.resource.findMany({
      where: {
        AND: [
          { isActive: true, resourceType: { in: LORA_TYPES } },
          visibility,
        ],
      },
      select,
      orderBy: { id: 'asc' },
    })

    resource = chooseCompatibleMatch(resources, input.engine, requestedName)

    if (!resource) {
      throw createError({
        statusCode: 409,
        message: `LoRA "${requestedName}" does not resolve to an active Resource.`,
      })
    }
  }

  if (
    (input.engine === 'ltx' || input.engine === 'wan') &&
    compatibilityRank(resource, input.engine) === 0
  ) {
    throw createError({
      statusCode: 409,
      message: `LoRA Resource ${resource.id} is marked ${resource.supportedServer}, not ${input.engine.toUpperCase()}-compatible.`,
    })
  }

  const localPath = String(resource.localPath || '').trim()
  if (!localPath) {
    throw createError({
      statusCode: 409,
      message: `LoRA Resource ${resource.id} does not have a localPath for ComfyUI.`,
    })
  }

  return {
    body: {
      ...normalizedBody,
      loraName: localPath,
      loraResourceIds: [resource.id],
    },
    resourceIds: [resource.id],
    resourceName: localPath,
  }
}
