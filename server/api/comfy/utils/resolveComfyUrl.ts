// /server/api/comfy/utils/resolveComfyUrl.ts
import { createError } from 'h3'
import prisma from '../../../utils/prisma'

interface ResolveComfyUrlOptions {
  endpointPath?: string
  preferBackend?: boolean
}

interface ServerLike {
  id: number
  title: string
  baseUrl: string
  backendBaseUrl?: string | null
  browserBaseUrl?: string | null
  endpointPath?: string | null
  isActive: boolean
  serverType?: string | null
  generationEngine?: string | null
  supportsComfyWorkflow?: boolean | null
}

export async function resolveComfyBase(
  serverId?: number | string | null,
  options: Omit<ResolveComfyUrlOptions, 'endpointPath'> = {},
) {
  const parsedServerId = Number(serverId)

  if (!Number.isInteger(parsedServerId) || parsedServerId <= 0) {
    throw createError({
      statusCode: 400,
      message: 'A valid Comfy serverId is required.',
    })
  }

  const server = await prisma.server.findUnique({
    where: { id: parsedServerId },
    select: {
      id: true,
      title: true,
      baseUrl: true,
      backendBaseUrl: true,
      browserBaseUrl: true,
      endpointPath: true,
      isActive: true,
      serverType: true,
      generationEngine: true,
      supportsComfyWorkflow: true,
    },
  })

  if (!server) {
    throw createError({
      statusCode: 404,
      message: `Comfy server ${parsedServerId} was not found.`,
    })
  }

  if (!server.isActive) {
    throw createError({
      statusCode: 400,
      message: `Comfy server "${server.title}" is not active.`,
    })
  }

  if (!isComfyServer(server)) {
    throw createError({
      statusCode: 400,
      message: `Server "${server.title}" is not configured as a Comfy server.`,
    })
  }

  const baseUrl =
    options.preferBackend === false
      ? normalizeBaseUrl(server.browserBaseUrl || server.baseUrl)
      : normalizeBaseUrl(
          server.backendBaseUrl || server.baseUrl || server.browserBaseUrl,
        )

  if (!baseUrl) {
    throw createError({
      statusCode: 400,
      message: `Comfy server "${server.title}" does not have a usable base URL.`,
    })
  }

  return baseUrl
}

const normalizeBaseUrl = (value?: string | null) => {
  return value?.trim().replace(/\/+$/, '') || ''
}

const normalizePath = (value?: string | null) => {
  if (!value?.trim()) return ''

  const trimmed = value.trim()
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

const joinUrl = (baseUrl: string, path: string) => {
  const cleanBase = normalizeBaseUrl(baseUrl)
  const cleanPath = normalizePath(path)

  if (!cleanBase) return ''
  return `${cleanBase}${cleanPath}`
}

const isComfyServer = (server: ServerLike) => {
  return (
    server.serverType === 'COMFY' ||
    server.generationEngine === 'COMFY' ||
    Boolean(server.supportsComfyWorkflow)
  )
}

export async function resolveComfyUrl(
  serverId?: number | string | null,
  options: ResolveComfyUrlOptions = {},
) {
  const parsedServerId = Number(serverId)

  if (!Number.isInteger(parsedServerId) || parsedServerId <= 0) {
    throw createError({
      statusCode: 400,
      message: 'A valid Comfy serverId is required.',
    })
  }

  const server = await prisma.server.findUnique({
    where: { id: parsedServerId },
    select: {
      id: true,
      title: true,
      baseUrl: true,
      backendBaseUrl: true,
      browserBaseUrl: true,
      endpointPath: true,
      isActive: true,
      serverType: true,
      generationEngine: true,
      supportsComfyWorkflow: true,
    },
  })

  if (!server) {
    throw createError({
      statusCode: 404,
      message: `Comfy server ${parsedServerId} was not found.`,
    })
  }

  if (!server.isActive) {
    throw createError({
      statusCode: 400,
      message: `Comfy server "${server.title}" is not active.`,
    })
  }

  if (!isComfyServer(server)) {
    throw createError({
      statusCode: 400,
      message: `Server "${server.title}" is not configured as a Comfy server.`,
    })
  }

  const baseUrl =
    options.preferBackend === false
      ? normalizeBaseUrl(server.browserBaseUrl || server.baseUrl)
      : normalizeBaseUrl(
          server.backendBaseUrl || server.baseUrl || server.browserBaseUrl,
        )

  if (!baseUrl) {
    throw createError({
      statusCode: 400,
      message: `Comfy server "${server.title}" does not have a usable base URL.`,
    })
  }

  const endpointPath = options.endpointPath ?? server.endpointPath ?? '/prompt'
  const resolvedUrl = joinUrl(baseUrl, endpointPath)

  if (!resolvedUrl) {
    throw createError({
      statusCode: 400,
      message: `Could not resolve Comfy URL for server "${server.title}".`,
    })
  }

  return resolvedUrl
}
