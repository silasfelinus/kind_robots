// /server/api/comfy/test/resolveComfyRun.ts
import { createError } from 'h3'
import prisma from '../../../utils/prisma'

export type ResolvedComfyRun = {
  serverId: number
  checkpointId: number
  baseUrl: string
  promptUrl: string
  checkpointName: string
  server: {
    id: number
    title: string
    baseUrl: string
    backendBaseUrl: string | null
    endpointPath: string | null
    defaultWidth: number
    defaultHeight: number
    defaultSteps: number | null
    defaultCfg: number | null
    defaultSampler: string | null
    defaultScheduler: string | null
  }
  checkpoint: {
    id: number
    name: string
    localPath: string | null
    customLabel: string | null
  }
}

function cleanPath(path?: string | null) {
  const value = String(path || '').trim()

  if (!value) {
    return ''
  }

  return value.startsWith('/') ? value : `/${value}`
}

function normalizeBaseUrl(value?: string | null) {
  const url = String(value || '').trim()

  if (!url) {
    return ''
  }

  return url
    .replace(/\/+$/, '')
    .replace(/\/prompt$/, '')
    .replace(/\/queue$/, '')
    .replace(/\/system_stats$/, '')
    .replace(/\/history\/?$/, '')
}

function buildPromptUrl(baseUrl: string, endpointPath?: string | null) {
  const cleanBaseUrl = normalizeBaseUrl(baseUrl)
  const cleanEndpointPath = cleanPath(endpointPath)

  if (!cleanEndpointPath) {
    return `${cleanBaseUrl}/prompt`
  }

  if (cleanEndpointPath.endsWith('/prompt')) {
    return `${cleanBaseUrl}${cleanEndpointPath}`
  }

  return `${cleanBaseUrl}${cleanEndpointPath}/prompt`
}

function getCheckpointName(resource: {
  name: string
  localPath: string | null
  customLabel: string | null
}) {
  return resource.localPath || resource.name || resource.customLabel || ''
}

export async function resolveComfyRun(input: {
  serverId?: number
  checkpointId?: number
}): Promise<ResolvedComfyRun> {
  const serverId = Number(input.serverId)
  const checkpointId = Number(input.checkpointId)

  if (!Number.isFinite(serverId) || serverId <= 0) {
    throw createError({
      statusCode: 400,
      message: 'serverId is required.',
    })
  }

  if (!Number.isFinite(checkpointId) || checkpointId <= 0) {
    throw createError({
      statusCode: 400,
      message: 'checkpointId is required.',
    })
  }

  const server = await prisma.server.findUnique({
    where: { id: serverId },
    select: {
      id: true,
      title: true,
      baseUrl: true,
      backendBaseUrl: true,
      endpointPath: true,
      isActive: true,
      serverType: true,
      generationEngine: true,
      supportsComfyWorkflow: true,
      supportsFlux: true,
      supportsTxt2Img: true,
      defaultWidth: true,
      defaultHeight: true,
      defaultSteps: true,
      defaultCfg: true,
      defaultSampler: true,
      defaultScheduler: true,
      Resources: {
        where: {
          id: checkpointId,
          isActive: true,
        },
        select: {
          id: true,
        },
      },
    },
  })

  if (!server || !server.isActive) {
    throw createError({
      statusCode: 404,
      message: `No active server found for serverId ${serverId}.`,
    })
  }

  const checkpoint = await prisma.resource.findUnique({
    where: { id: checkpointId },
    select: {
      id: true,
      name: true,
      localPath: true,
      customLabel: true,
      resourceType: true,
      supportedServer: true,
      isActive: true,
      Servers: {
        where: {
          id: serverId,
        },
        select: {
          id: true,
        },
      },
    },
  })

  if (!checkpoint || !checkpoint.isActive) {
    throw createError({
      statusCode: 404,
      message: `No active checkpoint found for checkpointId ${checkpointId}.`,
    })
  }

  if (checkpoint.resourceType !== 'CHECKPOINT') {
    throw createError({
      statusCode: 400,
      message: `Resource ${checkpointId} is not a CHECKPOINT.`,
    })
  }

  if (!checkpoint.Servers.length && !server.Resources.length) {
    throw createError({
      statusCode: 400,
      message: `Checkpoint ${checkpointId} is not attached to server ${serverId}.`,
    })
  }

  const baseUrl = normalizeBaseUrl(server.backendBaseUrl || server.baseUrl)
  const checkpointName = getCheckpointName(checkpoint)

  if (!baseUrl) {
    throw createError({
      statusCode: 400,
      message: `Server ${serverId} does not have a usable base URL.`,
    })
  }

  if (!checkpointName) {
    throw createError({
      statusCode: 400,
      message: `Checkpoint ${checkpointId} does not have a usable name or localPath.`,
    })
  }

  return {
    serverId,
    checkpointId,
    baseUrl,
    promptUrl: buildPromptUrl(baseUrl, server.endpointPath),
    checkpointName,
    server: {
      id: server.id,
      title: server.title,
      baseUrl: server.baseUrl,
      backendBaseUrl: server.backendBaseUrl,
      endpointPath: server.endpointPath,
      defaultWidth: server.defaultWidth,
      defaultHeight: server.defaultHeight,
      defaultSteps: server.defaultSteps,
      defaultCfg: server.defaultCfg,
      defaultSampler: server.defaultSampler,
      defaultScheduler: server.defaultScheduler,
    },
    checkpoint: {
      id: checkpoint.id,
      name: checkpoint.name,
      localPath: checkpoint.localPath,
      customLabel: checkpoint.customLabel,
    },
  }
}
