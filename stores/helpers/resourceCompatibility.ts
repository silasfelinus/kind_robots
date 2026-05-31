// /stores/helpers/resourceCompatibility.ts
import type { Server, Resource } from '~/prisma/generated/prisma/client'

type ResourceLike = Partial<Resource> & {
  supportedServer?: string | null
  modelFamily?: string | null
}

export function isResourceCompatibleWithServer(
  resource: ResourceLike | null | undefined,
  server: Server | null | undefined,
): boolean {
  if (!resource || !server) return true

  const supported = String(
    resource.supportedServer || resource.modelFamily || '',
  ).toUpperCase()

  if (!supported) return true

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