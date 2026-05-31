// /stores/helpers/resourceCompatibility.ts
import type { Resource, Server } from '~/prisma/generated/prisma/client'

type ResourceLike = Partial<Resource> & {
  supportedServer?: string | null
  modelFamily?: string | null
}

function normalize(value: unknown): string {
  return typeof value === 'string' ? value.trim().toUpperCase() : ''
}

export function isResourceCompatibleWithServer(
  resource: ResourceLike | null | undefined,
  server: Server | null | undefined,
): boolean {
  if (!resource || !server) return true

  const supported = normalize(
    resource.supportedServer || resource.modelFamily || '',
  )

  if (!supported || supported === 'GENERIC' || supported === 'UNKNOWN') {
    return true
  }

  if (server.serverType === 'A1111') {
    return (
      supported.includes('SD') ||
      supported.includes('A1111') ||
      supported.includes('FORGE')
    )
  }

  if (server.serverType === 'COMFY') {
    return (
      supported.includes('COMFY') ||
      supported.includes('FLUX') ||
      supported.includes('KONTEXT') ||
      supported.includes('SDXL') ||
      supported.includes('LTX') ||
      supported.includes('HUNYUAN')
    )
  }

  if (server.serverType === 'OPENAI') {
    return supported.includes('OPENAI')
  }

  if (server.serverType === 'ANTHROPIC') {
    return supported.includes('ANTHROPIC')
  }

  return true
}

export function getServerCompatibilityLabel(
  server: Server | null | undefined,
): string {
  if (!server) return 'Any server'

  if (server.serverType === 'A1111') return 'A1111'
  if (server.serverType === 'COMFY') return 'Comfy'
  if (server.serverType === 'OPENAI') return 'OpenAI'
  if (server.serverType === 'ANTHROPIC') return 'Anthropic'

  return 'Custom'
}

export function getResourceCompatibilityLabel(
  resource: ResourceLike | null | undefined,
): string {
  const supported = normalize(
    resource?.supportedServer || resource?.modelFamily || '',
  )

  if (!supported || supported === 'UNKNOWN') return 'Any server'
  if (supported === 'GENERIC') return 'Generic'
  if (supported === 'SD15') return 'Stable Diffusion 1.5'
  if (supported === 'SDXL') return 'SDXL'
  if (supported === 'COMFY') return 'Comfy'
  if (supported === 'FLUX') return 'Flux'
  if (supported === 'KONTEXT') return 'Flux Kontext'
  if (supported === 'OPENAI') return 'OpenAI'

  return supported
}

export function getResourceServerCompatibilityLabel(
  resource: ResourceLike | null | undefined,
  server: Server | null | undefined,
): string {
  if (!resource) return 'Any resource'
  if (!server) return getResourceCompatibilityLabel(resource)

  const resourceLabel = getResourceCompatibilityLabel(resource)
  const serverLabel = getServerCompatibilityLabel(server)
  const compatible = isResourceCompatibleWithServer(resource, server)

  return compatible
    ? `${resourceLabel} works with ${serverLabel}`
    : `${resourceLabel} may not work with ${serverLabel}`
}