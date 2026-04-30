// /server/api/comfy/extras/resolveComfyUrl.ts
import { prisma } from '~/server/utils/prisma'

export async function resolveComfyUrl(
  serverId?: number | null,
): Promise<string> {
  if (serverId) {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { baseUrl: true, endpointPath: true, isPublic: true },
    })

    if (!server) throw new Error(`Server ID ${serverId} not found`)
    if (!server.baseUrl) throw new Error(`Server ID ${serverId} has no baseUrl`)

    const path = server.endpointPath ?? '/prompt'
    return `${server.baseUrl}${path}`
  }

  const envUrl = process.env.COMFY_URL
  if (envUrl) return `${envUrl}/prompt`

  throw new Error('No serverId provided and COMFY_URL is not set')
}

export async function resolveComfyBase(
  serverId?: number | null,
): Promise<string> {
  const full = await resolveComfyUrl(serverId)
  return full.replace(/\/prompt$/, '')
}
