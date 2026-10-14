// /utils/scripts/verifyRelayAgentRegistry.ts
import assert from 'node:assert/strict'
import {
  AUDIO_RELAY_MAX_AGE_MS,
  __resetRelayAgentRegistry,
  audioRelayReadiness,
  listRelayAgents,
  recordRelayClaimAttempt,
  type RelayAgentStatus,
} from '../../server/utils/relayAgentRegistry'

// Empty registry.
__resetRelayAgentRegistry()
assert.deepEqual(listRelayAgents(), [])

// A claim attempt is recorded even when it never won a job — this is the
// "invisible without pm2 access" gap the registry exists to close.
recordRelayClaimAttempt({
  agentId: 'relay-alpha',
  supportsInputImages: false,
  engines: ['A1111'],
  agentVersion: '1.2.3',
})

let agents = listRelayAgents()
assert.equal(agents.length, 1)
assert.equal(agents[0]!.agentId, 'relay-alpha')
assert.equal(agents[0]!.supportsInputImages, false)
assert.deepEqual(agents[0]!.engines, ['A1111'])
assert.equal(agents[0]!.agentVersion, '1.2.3')
assert.ok(agents[0]!.lastSeenAt instanceof Date)

// Missing/blank agentVersion normalizes to null rather than '' — so the UI
// can render an explicit "unknown" instead of a blank version string.
recordRelayClaimAttempt({
  agentId: 'relay-beta',
  supportsInputImages: true,
  engines: ['A1111', 'COMFY'],
  agentVersion: '   ',
})
agents = listRelayAgents()
const beta = agents.find((a) => a.agentId === 'relay-beta')
assert.equal(beta?.agentVersion, null)

recordRelayClaimAttempt({
  agentId: 'relay-gamma',
  supportsInputImages: true,
  engines: ['COMFY'],
})
agents = listRelayAgents()
const gamma = agents.find((a) => a.agentId === 'relay-gamma')
assert.equal(gamma?.agentVersion, null)

// Re-recording the same agentId overwrites in place (last-write-wins) rather
// than accumulating duplicate entries.
recordRelayClaimAttempt({
  agentId: 'relay-alpha',
  supportsInputImages: true,
  engines: ['A1111', 'COMFY'],
  agentVersion: '1.3.0',
})
agents = listRelayAgents()
assert.equal(agents.filter((a) => a.agentId === 'relay-alpha').length, 1)
const alpha = agents.find((a) => a.agentId === 'relay-alpha')
assert.equal(alpha?.supportsInputImages, true)
assert.equal(alpha?.agentVersion, '1.3.0')

// listRelayAgents() sorts most-recently-seen first.
__resetRelayAgentRegistry()
recordRelayClaimAttempt({
  agentId: 'old-relay',
  supportsInputImages: true,
  engines: ['A1111'],
})
await new Promise((resolve) => setTimeout(resolve, 5))
recordRelayClaimAttempt({
  agentId: 'new-relay',
  supportsInputImages: true,
  engines: ['A1111'],
})
agents = listRelayAgents()
assert.deepEqual(
  agents.map((a) => a.agentId),
  ['new-relay', 'old-relay'],
)

// supportsAudio defaults to false and is kept when declared (kind_robots#3606).
assert.equal(agents[0]!.supportsAudio, false)
__resetRelayAgentRegistry()
recordRelayClaimAttempt({
  agentId: 'ace-relay',
  supportsInputImages: true,
  supportsAudio: true,
  engines: ['COMFY'],
})
agents = listRelayAgents()
assert.equal(agents[0]!.supportsAudio, true)

const now = new Date('2026-10-14T12:00:00Z')
const seen = (agoMs: number) => new Date(now.getTime() - agoMs)
const relay = (overrides: Partial<RelayAgentStatus>): RelayAgentStatus => ({
  agentId: 'relay',
  lastSeenAt: seen(1000),
  supportsInputImages: true,
  supportsAudio: true,
  engines: ['COMFY'],
  agentVersion: null,
  ...overrides,
})
assert.deepEqual(audioRelayReadiness([relay({})], now), {
  ready: true,
  agentIds: ['relay'],
  reason: 'A live COMFY relay advertises supportsAudio.',
})
assert.equal(audioRelayReadiness([], now).ready, false)
assert.equal(
  audioRelayReadiness([relay({ supportsAudio: false })], now).ready,
  false,
)
assert.equal(
  audioRelayReadiness([relay({ engines: ['A1111'] })], now).ready,
  false,
)
assert.equal(
  audioRelayReadiness(
    [relay({ lastSeenAt: seen(AUDIO_RELAY_MAX_AGE_MS + 1) })],
    now,
  ).reason,
  'No relay has polled recently.',
)

console.log('Relay agent registry verified.')
