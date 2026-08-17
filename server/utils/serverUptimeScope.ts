// /server/utils/serverUptimeScope.ts
//
// Pure, DB-free default scope for the admin uptime dashboard
// (server/api/server/uptime.get.ts). Split out so it can be unit-tested
// without a Prisma connection (see
// utils/scripts/verifyServerUptimeDefaultScope.ts) the same way
// serverCapabilities.ts is -- importing uptime.get.ts directly would
// transitively pull in ../../utils/prisma, which throws at module-load time
// without a DATABASE_URL (the "Contract verifiers" CI job intentionally
// never sets one for its DB-free static checks).
import type { ServerType } from '~/prisma/generated/prisma/client'

// Every server type the uptime dashboard should surface by default. Before
// text-generation/t-007, the default where-clause only covered A1111/COMFY
// (the original art/GPU servers this panel was built for) -- a text-capable
// server (OPENAI/ANTHROPIC/OLLAMA/CUSTOM) was only visible via a manual
// ?serverType= override that nothing in the UI ever surfaced, so it had no
// uptime/latency visibility in practice once text-generation/t-003 made
// those server types real and resolvable.
export const UPTIME_DEFAULT_SERVER_TYPES: ServerType[] = [
  'A1111',
  'COMFY',
  'OPENAI',
  'ANTHROPIC',
  'OLLAMA',
  'CUSTOM',
]

export function getUptimeDefaultServerTypes(): ServerType[] {
  return UPTIME_DEFAULT_SERVER_TYPES
}
