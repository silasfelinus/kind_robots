// /server/utils/artLoraResource.ts
import { createError } from 'h3'
import { ResourceType, SupportedServer } from '~/prisma/generated/prisma/client'
import { resolveMaturityPrivacy } from '~/utils/maturityPrivacy'
import { MAX_LORAS_PER_JOB } from '~/server/api/comfy/utils/loraChain'
import prisma from './prisma'

export type LoraAwareEnqueueBody = {
  loraName?: string | null
  loraStrength?: number | null
  loraResourceIds?: number[] | null
  /**
   * The multi-LoRA form. Each entry names a Resource by id (preferred -- it is
   * unambiguous) or by name/path, with its own strength. Supersedes the
   * singular loraName/loraStrength pair, which is still accepted so callers
   * that predate stacking keep working.
   */
  loras?: Array<{
    resourceId?: number | null
    name?: string | null
    strength?: number | null
  }> | null
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
  defaultTrigger: string | null
  triggerWords: string | null
}

const LORA_TYPES = [ResourceType.LORA, ResourceType.LYCORIS]
const RESOURCE_RESOLVED_ENGINES = new Set([
  'kontext',
  'krea2',
  'flux2',
  'ltx',
  'wan',
  'sdxl-img2img',
  'comfy',
])
const STRICT_COMPATIBILITY_ENGINES = new Set([
  'kontext',
  'krea2',
  'flux2',
  'ltx',
  'wan',
  'sdxl-img2img',
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
      value.map(Number).filter((id) => Number.isInteger(id) && id > 0),
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

  if (engine === 'sdxl-img2img') {
    if (resource.supportedServer === SupportedServer.SDXL) return 30
    if (resource.supportedServer === SupportedServer.COMFY) return 15
    if (resource.supportedServer === SupportedServer.GENERIC) return 10
  }

  // The named-checkpoint lane can host either SDXL or SD1.5 checkpoints. The
  // browser has enough checkpoint metadata to filter that distinction exactly;
  // the server only knows the Resource class here, so it accepts both families
  // plus explicitly generic Comfy LoRAs and leaves cross-family prevention to
  // the checkpoint-aware picker.
  if (engine === 'comfy') {
    if (resource.supportedServer === SupportedServer.COMFY) return 20
    if (resource.supportedServer === SupportedServer.SDXL) return 15
    if (resource.supportedServer === SupportedServer.SD15) return 15
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
    .map((resource) => ({
      resource,
      rank: compatibilityRank(resource, engine),
    }))
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

type LoraRequest = {
  resourceId: number | null
  name: string
  strength: number
}

function readLoraRequests(body: LoraAwareEnqueueBody): LoraRequest[] {
  const requests: LoraRequest[] = []

  if (Array.isArray(body.loras)) {
    for (const entry of body.loras) {
      if (!entry || typeof entry !== 'object') continue
      const resourceId = Number(entry.resourceId)
      const name = String(entry.name || '').trim()
      if (!Number.isInteger(resourceId) && !name) continue
      requests.push({
        resourceId:
          Number.isInteger(resourceId) && resourceId > 0 ? resourceId : null,
        name,
        strength: Number.isFinite(Number(entry.strength))
          ? Number(entry.strength)
          : 1,
      })
    }
  }

  if (!requests.length) {
    const ids = normalizeIds(body.loraResourceIds)
    const name = String(body.loraName || '').trim()
    const strength = Number.isFinite(Number(body.loraStrength))
      ? Number(body.loraStrength)
      : 1

    if (ids.length) {
      for (const id of ids) {
        requests.push({ resourceId: id, name: '', strength })
      }
    } else if (name) {
      requests.push({ resourceId: null, name, strength })
    }
  }

  const seen = new Set<string>()
  return requests
    .filter((request) => {
      const key = request.resourceId
        ? `id:${request.resourceId}`
        : `name:${request.name.toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, MAX_LORAS_PER_JOB)
}

function triggerTerms(resource: LoraResourceRecord): string[] {
  const preferred = String(resource.defaultTrigger || '').trim()
  if (preferred) return [preferred]
  return String(resource.triggerWords || '')
    .split(/[,;\n]+/)
    .map((value) => value.trim())
    .filter(Boolean)
}

function appendResolvedTriggers(
  body: LoraAwareEnqueueBody,
  resources: LoraResourceRecord[],
): string | null {
  const base = String(
    body.basePromptString || body.promptString || body.artPrompt || body.prompt || '',
  ).trim()
  if (!base) return null

  const seen = new Set<string>()
  const haystack = base.toLowerCase()
  const additions: string[] = []

  for (const resource of resources) {
    for (const term of triggerTerms(resource)) {
      const key = term.toLowerCase()
      if (!key || seen.has(key) || haystack.includes(key)) continue
      seen.add(key)
      additions.push(term)
    }
  }

  return additions.length ? [base, ...additions].join(', ') : base
}

export async function resolveEnqueueLoraResource(input: {
  body: LoraAwareEnqueueBody
  engine: string
  userId: number
  isAdmin: boolean
}): Promise<{
  body: LoraAwareEnqueueBody
  resourceIds: number[]
  resourceNames: string[]
  resourceName: string | null
}> {
  const normalizedBody: LoraAwareEnqueueBody = {
    ...input.body,
    ...resolveMaturityPrivacy(input.body),
  }
  const requests = readLoraRequests(normalizedBody)

  if (!requests.length) {
    return {
      body: normalizedBody,
      resourceIds: [],
      resourceNames: [],
      resourceName: null,
    }
  }

  if (!RESOURCE_RESOLVED_ENGINES.has(input.engine)) {
    const named = requests.filter((request) => Boolean(request.name))
    return {
      body: {
        ...normalizedBody,
        loras: named.map((request) => ({
          name: request.name,
          strength: request.strength,
        })),
        loraName: named[0]?.name ?? normalizedBody.loraName ?? null,
        loraStrength: named[0]?.strength ?? normalizedBody.loraStrength ?? null,
        loraResourceIds: normalizeIds(normalizedBody.loraResourceIds),
      },
      resourceIds: normalizeIds(normalizedBody.loraResourceIds),
      resourceNames: named.map((request) => request.name),
      resourceName: named[0]?.name ?? null,
    }
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
    defaultTrigger: true,
    triggerWords: true,
  } as const

  const candidates = await prisma.resource.findMany({
    where: {
      AND: [{ isActive: true, resourceType: { in: LORA_TYPES } }, visibility],
    },
    select,
    orderBy: { id: 'asc' },
  })

  const byId = new Map(candidates.map((resource) => [resource.id, resource]))
  const resolved: Array<{ resource: LoraResourceRecord; strength: number }> = []

  for (const request of requests) {
    let resource: LoraResourceRecord | null

    if (request.resourceId) {
      resource = byId.get(request.resourceId) ?? null
      if (!resource) {
        throw createError({
          statusCode: 404,
          message: `LoRA Resource ${request.resourceId} was not found or is not accessible.`,
        })
      }
    } else {
      resource = chooseCompatibleMatch(candidates, input.engine, request.name)
      if (!resource) {
        throw createError({
          statusCode: 409,
          message: `LoRA "${request.name}" does not resolve to an active Resource.`,
        })
      }
    }

    if (
      STRICT_COMPATIBILITY_ENGINES.has(input.engine) &&
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

    resolved.push({ resource, strength: request.strength })
  }

  const seenIds = new Set<number>()
  const unique = resolved.filter(({ resource }) => {
    if (seenIds.has(resource.id)) return false
    seenIds.add(resource.id)
    return true
  })

  const loras = unique.map(({ resource, strength }) => ({
    name: String(resource.localPath || '').trim(),
    strength,
  }))
  const basePromptString = appendResolvedTriggers(
    normalizedBody,
    unique.map(({ resource }) => resource),
  )

  return {
    body: {
      ...normalizedBody,
      ...(basePromptString ? { basePromptString } : {}),
      loras,
      loraName: loras[0]?.name ?? null,
      loraStrength: loras[0]?.strength ?? null,
      loraResourceIds: unique.map(({ resource }) => resource.id),
    },
    resourceIds: unique.map(({ resource }) => resource.id),
    resourceNames: loras.map((lora) => lora.name),
    resourceName: loras[0]?.name ?? null,
  }
}
