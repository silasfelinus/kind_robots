// /server/api/art/queue/relay-status.get.ts
//
// Admin readout of home-relay poll telemetry recorded by claim.post.ts (see
// relayAgentRegistry.ts). Diagnoses the class of stall from the 2026-07-10
// incident: a relay that never declares `supportsInputImages: true` silently
// skips image-bearing jobs (they sit PENDING forever) with no signal
// reachable from the browser — this endpoint surfaces exactly what each
// relay last declared so that's visible without pm2/server access.
import { defineEventHandler } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireAdminApiUser } from '../../../utils/authGuard'
import { listRelayAgents } from '../../../utils/relayAgentRegistry'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)

    return {
      success: true,
      message: 'Relay agent status.',
      data: { agents: listRelayAgents() },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to load relay status.',
      statusCode,
    }
  }
})
