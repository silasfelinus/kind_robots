// /server/utils/relayAgentRegistry.ts
//
// In-memory, last-write-wins registry of home-relay poll attempts against
// POST /api/art/queue/claim. Incident (2026-07-10): a relay running an old
// build didn't declare `supportsInputImages: true`, so the server-side
// capability gate in claim.post.ts silently skipped image-bearing jobs (they
// stayed PENDING forever) with zero signal reachable from the browser — only
// pm2/server logs showed it. This registry exists so an admin can see, per
// relay agentId, when it last polled and what it declared, without server
// access.
//
// Deliberately NOT persisted: this is ephemeral operational telemetry (a
// diagnostic snapshot of "what did relays say most recently"), not data that
// needs to survive a restart or sync across installs. It resets on server
// restart — an accepted tradeoff, not a bug. See relayAgentRegistry.test.ts /
// utils/scripts/verifyRelayAgentRegistry.ts for behavior coverage.

export type RelayAgentStatus = {
  agentId: string
  lastSeenAt: Date
  supportsInputImages: boolean
  engines: string[]
  agentVersion: string | null
}

export type RecordRelayClaimAttemptInput = {
  agentId: string
  supportsInputImages: boolean
  engines: string[]
  agentVersion?: string | null
}

const registry = new Map<string, RelayAgentStatus>()

/**
 * Record a claim-attempt poll from a relay agent. Call this on every incoming
 * request to claim.post.ts — regardless of whether a job was actually handed
 * out — so a relay that polls-but-never-claims (e.g. wrong engines, or every
 * candidate skipped by the image-capability gate) still shows up as "alive"
 * with its declared capabilities, rather than looking indistinguishable from
 * a relay that's stopped polling entirely.
 */
export function recordRelayClaimAttempt(
  input: RecordRelayClaimAttemptInput,
): void {
  registry.set(input.agentId, {
    agentId: input.agentId,
    lastSeenAt: new Date(),
    supportsInputImages: input.supportsInputImages,
    engines: input.engines,
    agentVersion: input.agentVersion?.trim() || null,
  })
}

/** All known relay agents, most-recently-seen first. */
export function listRelayAgents(): RelayAgentStatus[] {
  return [...registry.values()].sort(
    (a, b) => b.lastSeenAt.getTime() - a.lastSeenAt.getTime(),
  )
}

/** Test-only: reset registry state between assertions. */
export function __resetRelayAgentRegistry(): void {
  registry.clear()
}
