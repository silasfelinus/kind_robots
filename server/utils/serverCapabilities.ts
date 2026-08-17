// /server/utils/serverCapabilities.ts
//
// Pure, DB-free mapping from a resolveServer() capability to the Server.
// serverType values allowed to serve it. Split out of serverResolver.ts so
// it can be unit-tested without a Prisma connection (see
// utils/scripts/verifyServerCapabilityRouting.ts) -- serverResolver.ts (and
// its own ./prisma import) throws at module-load time when DATABASE_URL
// isn't set, which the "Contract verifiers" CI job intentionally never sets
// for its DB-free static checks. Only type-only Prisma imports here, so this
// module carries zero runtime Prisma dependency.
import type { ServerType } from '~/prisma/generated/prisma/client'

export type ResolveServerCapability = 'art' | 'text' | 'chat' | 'comfy'

// `null` means "no serverType restriction" (the caller's where-clause omits
// a serverType filter entirely).
export function getCapabilityServerTypes(
  capability?: ResolveServerCapability,
): ServerType[] | null {
  if (capability === 'art') {
    return ['A1111', 'COMFY', 'OPENAI']
  }

  if (capability === 'comfy') {
    return ['COMFY']
  }

  if (capability === 'chat' || capability === 'text') {
    // Every server type with a working text-generation request path. OLLAMA
    // has a real, working native chat route (server/api/chats/ollama/
    // stream.post.ts) — excluding it here silently broke resolution for any
    // Ollama server (explicit serverId/serverName/preferredTextServerId
    // included, since they all AND against this same where-clause) even
    // though the route itself worked. Fixed for text-generation/t-003.
    return ['OPENAI', 'ANTHROPIC', 'OLLAMA', 'CUSTOM']
  }

  return null
}
