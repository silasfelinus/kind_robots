// /stores/utils/artGenerationRouter.ts
import type { Server } from '~/prisma/generated/prisma/client'

export type ArtGenerationEngine =
  | 'a1111'
  | 'comfy'
  | 'flux'
  | 'kontext'
  | 'openai'

export type ArtGenerationTransport = 'browser' | 'backend'

export type ArtGenerationRoute = {
  engine: ArtGenerationEngine
  transport: ArtGenerationTransport
}

export function getArtGenerationRoute(
  server: Server | null | undefined,
  requestedEngine?: ArtGenerationEngine | null,
): ArtGenerationRoute {
  if (requestedEngine) {
    return {
      engine: requestedEngine,
      transport:
        requestedEngine === 'a1111' && isBrowserServer(server)
          ? 'browser'
          : 'backend',
    }
  }

  if (!server) {
    return {
      engine: 'openai',
      transport: 'backend',
    }
  }

  if (server.serverType === 'A1111') {
    return {
      engine: 'a1111',
      transport: isBrowserServer(server) ? 'browser' : 'backend',
    }
  }

  if (server.serverType === 'COMFY') {
    return {
      engine: 'comfy',
      transport: 'backend',
    }
  }

  if (server.serverType === 'OPENAI') {
    return {
      engine: 'openai',
      transport: 'backend',
    }
  }

  return {
    engine: 'openai',
    transport: 'backend',
  }
}

function isBrowserServer(server: Server | null | undefined): boolean {
  return (
    server?.accessMode === 'BROWSER' ||
    server?.accessMode === 'LOCAL' ||
    server?.accessMode === 'TAILSCALE'
  )
}
