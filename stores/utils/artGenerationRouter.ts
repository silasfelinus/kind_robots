import type { Server } from '~/prisma/generated/prisma/client'

export type ArtGenerationMode = 'browser' | 'backend'

export function getArtGenerationMode(server: Server): ArtGenerationMode {
  if (!server.isActive) {
    throw new Error(`Server "${server.title}" is not active.`)
  }

  if (server.serverType !== 'A1111') {
    throw new Error(
      `Server "${server.title}" is ${server.serverType}. This generator currently supports A1111 only.`,
    )
  }

  if (!server.supportsTxt2Img) {
    throw new Error(`Server "${server.title}" does not support txt2img.`)
  }

  const shouldUseBrowser =
    server.allowBrowserRequests &&
    (server.requiresClientSideCheck ||
      server.isPrivateNetwork ||
      server.accessMode === 'LOCAL')

  if (shouldUseBrowser) {
    return 'browser'
  }

  return 'backend'
}
