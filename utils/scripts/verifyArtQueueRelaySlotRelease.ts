// /utils/scripts/verifyArtQueueRelaySlotRelease.ts
//
// Regression guard for the "two jobs shown as running" dashboard symptom
// (2026-09-12: ArtJob #21788, attempt 2, sat RUNNING for 63 minutes next to
// the live #21803 — its earlier "timed out" error still on the card).
//
// The home relay is one slot: claim → render → report → poll again. A claim
// poll from an agent that still holds a RUNNING row therefore proves the row
// was abandoned (relay restart, lost /complete POST, crash in process()), and
// claim.post.ts must release it — PENDING with attempts intact, FAILED once
// the budget is spent — BEFORE the paused check and the idle fast path, so
// the released row is visible to both. Source-text assertions, matching
// verifyArtQueueClaimFastPath.ts, plus a pure check of the error message the
// release stamps so a prior attempt's error is kept rather than overwritten.
import { readFileSync } from 'node:fs'
import {
  RELAY_CLAIM_RELEASE_REASON,
  relayClaimReleaseError,
} from '../../server/utils/artJobRelaySlot'

const route = readFileSync('server/api/art/queue/claim.post.ts', 'utf8')
const util = readFileSync('server/utils/artJobRelaySlot.ts', 'utf8')
const card = readFileSync('components/art/artjob-queue-card.vue', 'utf8')

function assertIncludes(source: string, name: string, required: string) {
  if (!source.includes(required)) {
    throw new Error(`${name} is missing: ${required}`)
  }
}

for (const required of [
  "import { releaseAbandonedRelayClaims } from '../../../utils/artJobRelaySlot'",
  'singleSlot?: boolean | null',
  'const singleSlot = body?.singleSlot !== false',
  'await releaseAbandonedRelayClaims(claimedBy, MAX_ATTEMPTS)',
]) {
  assertIncludes(route, 'Art queue claim relay-slot release', required)
}

const releaseAt = route.indexOf('await releaseAbandonedRelayClaims(')
const pausedAt = route.indexOf('if (await isQueuePaused())')
const fastPathAt = route.indexOf(
  'const queueSignal = await prisma.artJob.findFirst',
)
if (releaseAt < 0 || pausedAt < 0 || fastPathAt < 0) {
  throw new Error(
    'Art queue claim route lost a landmark the release ordering depends on.',
  )
}
if (!(releaseAt < pausedAt && releaseAt < fastPathAt)) {
  throw new Error(
    'releaseAbandonedRelayClaims must run before the paused check and the idle fast path.',
  )
}

for (const required of [
  "where: { status: 'RUNNING', claimedBy }",
  "where: { id: job.id, status: 'RUNNING', claimedAt: job.claimedAt }",
  "const status = job.attempts >= maxAttempts ? 'FAILED' : 'PENDING'",
  'claimedAt: null,',
  'claimedBy: null,',
]) {
  assertIncludes(util, 'artJobRelaySlot release', required)
}

if (util.includes('attempts: 0') || util.includes('attempts: { set: 0 }')) {
  throw new Error(
    'Releasing an abandoned claim must keep the attempt count (mirrors requeue resetAttempts=false).',
  )
}

if (relayClaimReleaseError(null) !== RELAY_CLAIM_RELEASE_REASON) {
  throw new Error(
    'Release error without a prior error should be the bare reason.',
  )
}
const kept = relayClaimReleaseError(
  '  ComfyUI image job timed out after 600s  ',
)
if (
  !kept.startsWith(RELAY_CLAIM_RELEASE_REASON) ||
  !kept.endsWith('Previous error: ComfyUI image job timed out after 600s')
) {
  throw new Error(
    `Release error must keep the prior attempt's error, got: ${kept}`,
  )
}
if (relayClaimReleaseError('x'.repeat(5000)).length !== 4000) {
  throw new Error('Release error must be capped at the 4000-char error column.')
}

for (const required of [
  'v-if="errorIsFromEarlierAttempt"',
  "props.job.status === 'RUNNING' || props.job.status === 'PENDING'",
]) {
  assertIncludes(
    card,
    'ArtJob queue card earlier-attempt error label',
    required,
  )
}

console.log('Art queue relay-slot release verified.')
