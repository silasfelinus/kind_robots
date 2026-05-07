// /stores/helpers/resourceCompatibility.ts
import type {
  Server,
  ServerGenerationEngine,
  ServerType,
  SupportedServer,
} from '~/prisma/generated/prisma/client'

export type ServerLike = Partial<
  Pick<
    Server,
    | 'id'
    | 'serverType'
    | 'generationEngine'
    | 'supportsFlux'
    | 'supportsKontext'
    | 'supportsComfyWorkflow'
    | 'supportsTxt2Img'
    | 'supportsImg2Img'
    | 'model'
  >
>

export type ResourceServerLink = {
  id?: number | null
}

export type ResourceLike = {
  supportedServer?: SupportedServer | string | null
  Servers?: ResourceServerLink[] | number[] | null
  generation?: string | null
  name?: string | null
  customLabel?: string | null
}

function safeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function upper(value: unknown): string {
  return safeText(value).toUpperCase()
}

function hasExplicitServerLink(
  resource: ResourceLike,
  serverId?: number | null,
) {
  if (!serverId || !Array.isArray(resource.Servers)) return false

  return resource.Servers.some((entry) => {
    if (typeof entry === 'number') return entry === serverId
    return entry?.id === serverId
  })
}

function hasAnyExplicitServerLink(resource: ResourceLike) {
  return Array.isArray(resource.Servers) && resource.Servers.length > 0
}

export function getSupportedServerForEngine(
  generationEngine?: ServerGenerationEngine | string | null,
): SupportedServer {
  if (generationEngine === 'COMFY') return 'COMFY'
  if (generationEngine === 'FLUX') return 'FLUX'
  if (generationEngine === 'KONTEXT') return 'KONTEXT'
  if (generationEngine === 'OPENAI_IMAGE') return 'OPENAI'
  if (generationEngine === 'A1111') return 'SDXL'

  return 'UNKNOWN'
}

export function getSupportedServersForServer(
  server?: ServerLike | null,
): SupportedServer[] {
  if (!server) return ['GENERIC', 'UNKNOWN']

  const matches = new Set<SupportedServer>(['GENERIC', 'UNKNOWN'])

  const generationEngine = server.generationEngine
  const serverType = server.serverType as ServerType | undefined

  if (generationEngine === 'A1111' || serverType === 'A1111') {
    matches.add('SD15')
    matches.add('SDXL')
  }

  if (
    generationEngine === 'COMFY' ||
    serverType === 'COMFY' ||
    server.supportsComfyWorkflow
  ) {
    matches.add('COMFY')
  }

  if (generationEngine === 'FLUX' || server.supportsFlux) {
    matches.add('FLUX')
    matches.add('COMFY')
  }

  if (generationEngine === 'KONTEXT' || server.supportsKontext) {
    matches.add('KONTEXT')
    matches.add('COMFY')
  }

  if (generationEngine === 'OPENAI_IMAGE') {
    matches.add('OPENAI')
  }

  return Array.from(matches)
}

export function resourceSupportsServer(
  resource: ResourceLike,
  server?: ServerLike | null,
): boolean {
  if (!server) return true

  if (hasExplicitServerLink(resource, server.id)) return true

  const supportedServer = upper(resource.supportedServer)

  if (!supportedServer) return true

  const compatibleKinds = getSupportedServersForServer(server)

  if (compatibleKinds.includes(supportedServer as SupportedServer)) return true

  if (hasAnyExplicitServerLink(resource)) return false

  return supportedServer === 'GENERIC' || supportedServer === 'UNKNOWN'
}

export function getResourceCompatibilityLabel(
  resource: ResourceLike,
  server?: ServerLike | null,
): string {
  if (server && hasExplicitServerLink(resource, server.id)) return 'Linked'

  const supportedServer = upper(resource.supportedServer)

  if (supportedServer && supportedServer !== 'UNKNOWN') {
    return supportedServer
  }

  const generation = safeText(resource.generation)

  if (generation) return generation

  return 'Generic'
}
