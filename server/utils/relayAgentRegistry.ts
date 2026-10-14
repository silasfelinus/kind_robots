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
  /** Declared supportsAudio: may claim ACE-Step (payload.media 'audio') jobs. */
  supportsAudio: boolean
  engines: string[]
  agentVersion: string | null
}

export type RecordRelayClaimAttemptInput = {
  agentId: string
  supportsInputImages: boolean
  supportsAudio?: boolean
  engines: string[]
  agentVersion?: string | null
}

/** A relay counts as live for audio only if it polled this recently. */
export const AUDIO_RELAY_MAX_AGE_MS = 5 * 60 * 1000

export type AudioRelayReadiness = {
  ready: boolean
  agentIds: string[]
  reason: string
}

/**
 * Whether some relay could claim an audio ArtJob right now: it polled within
 * `maxAgeMs`, takes COMFY jobs and declared supportsAudio. Existing ACE-Step
 * code is not proof of a worker; this is the poll-time declaration.
 */
export function audioRelayReadiness(
  agents: readonly RelayAgentStatus[],
  now: Date = new Date(),
  maxAgeMs: number = AUDIO_RELAY_MAX_AGE_MS,
): AudioRelayReadiness {
  const live = agents.filter(
    (agent) => now.getTime() - agent.lastSeenAt.getTime() <= maxAgeMs,
  )
  const ready = live.filter(
    (agent) => agent.supportsAudio && agent.engines.includes('COMFY'),
  )
  if (ready.length)
    return {
      ready: true,
      agentIds: ready.map((agent) => agent.agentId),
      reason: 'A live COMFY relay advertises supportsAudio.',
    }
  return {
    ready: false,
    agentIds: [],
    reason: live.length
      ? 'No live relay advertises supportsAudio with the COMFY engine.'
      : 'No relay has polled recently.',
  }
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
    supportsAudio: input.supportsAudio === true,
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
