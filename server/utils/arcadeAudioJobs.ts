// /server/utils/arcadeAudioJobs.ts
//
// Admin approval path for Arcade soundtrack renders (kind_robots#3606).
// Pure and DB-free: turns a manifest brief into the ACE-Step request that
// POST /api/arcade/audio-jobs sends to /api/art/enqueue, and decides whether
// an approval may enqueue at all. Nothing here enqueues by itself.
//
// Gates, in order: an explicit per-cue approval, the server-side
// ARCADE_AUDIO_JOBS_ENABLED authorization, a live COMFY relay that advertises
// supportsAudio, and no existing PENDING/RUNNING/DONE job for the same key.

import {
  ACESTEP_MAX_SECONDS,
  ACESTEP_MIN_SECONDS,
} from '../api/comfy/acestep/utils/workflow'
import {
  arcadeAudioBrief,
  arcadeAudioJobKey,
  isArcadeAudioGame,
  isArcadeEventCue,
  isArcadeMusicScene,
  type ArcadeAudioCue,
  type ArcadeAudioOwner,
} from '../../utils/arcade/soundtrackBriefs'
import type { AudioRelayReadiness } from './relayAgentRegistry'

export const ARCADE_AUDIO_PROJECT_SLUG = 'kr-arcade'
export const ARCADE_AUDIO_DESIGNER_PREFIX = 'arcade-audio:'
export const ARCADE_AUDIO_ENABLE_ENV = 'ARCADE_AUDIO_JOBS_ENABLED'
/** Job states that already cover a cue, so approving it again reuses that job. */
export const ARCADE_AUDIO_LIVE_STATUSES = [
  'PENDING',
  'RUNNING',
  'DONE',
] as const

export type ArcadeAudioEnqueueRequest = {
  engine: 'acestep'
  promptString: string
  lyrics: ''
  durationSeconds: number
  bpm: number | null
  seed: number
  isPublic: false
  designer: string
  projectSlug: string
}

export function arcadeAudioGenerationEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env[ARCADE_AUDIO_ENABLE_ENV]?.trim().toLowerCase() === 'true'
}

export function parseArcadeAudioTarget(
  game: unknown,
  cue: unknown,
): { owner: ArcadeAudioOwner; cue: ArcadeAudioCue } | null {
  if (typeof game !== 'string' || typeof cue !== 'string') return null
  const owner =
    game === 'shared' ? 'shared' : isArcadeAudioGame(game) ? game : null
  if (!owner || !(isArcadeMusicScene(cue) || isArcadeEventCue(cue))) return null
  return arcadeAudioBrief(owner, cue) ? { owner, cue } : null
}

/** A stable 31-bit seed per job key, so a re-render reproduces the take. */
export function arcadeAudioSeed(jobKey: string): number {
  let hash = 2166136261
  for (let i = 0; i < jobKey.length; i++) {
    hash ^= jobKey.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) % 2_147_483_647
}

/**
 * The /api/art/enqueue body for a cue. Event cues are shorter than ACE-Step's
 * minimum render, so they request the minimum and are trimmed at ingestion.
 */
export function buildArcadeAudioEnqueueRequest(
  owner: ArcadeAudioOwner,
  cue: ArcadeAudioCue,
): ArcadeAudioEnqueueRequest | null {
  const brief = arcadeAudioBrief(owner, cue)
  if (!brief) return null
  const jobKey = arcadeAudioJobKey(owner, cue)
  return {
    engine: 'acestep',
    promptString: brief.prompt,
    lyrics: '',
    durationSeconds: Math.min(
      ACESTEP_MAX_SECONDS,
      Math.max(ACESTEP_MIN_SECONDS, Math.ceil(brief.seconds)),
    ),
    bpm: brief.bpm ?? null,
    seed: arcadeAudioSeed(jobKey),
    isPublic: false,
    designer: jobKey,
    projectSlug: ARCADE_AUDIO_PROJECT_SLUG,
  }
}

/** The payload substring that finds an earlier job for the same key. */
export function arcadeAudioDedupeNeedle(jobKey: string): string {
  return `"designer":"${jobKey}"`
}

export type ArcadeAudioDecision =
  | { action: 'enqueue'; request: ArcadeAudioEnqueueRequest }
  | { action: 'reuse'; jobId: number; status: string }
  | { action: 'refuse'; statusCode: number; message: string }

export function decideArcadeAudioJob(input: {
  owner: ArcadeAudioOwner
  cue: ArcadeAudioCue
  approved: boolean
  enabled: boolean
  readiness: AudioRelayReadiness
  existing: { id: number; status: string } | null
}): ArcadeAudioDecision {
  if (!input.approved)
    return {
      action: 'refuse',
      statusCode: 400,
      message: 'Approve this cue explicitly (approve: true) to enqueue it.',
    }
  if (input.existing)
    return {
      action: 'reuse',
      jobId: input.existing.id,
      status: input.existing.status,
    }
  if (!input.enabled)
    return {
      action: 'refuse',
      statusCode: 403,
      message: `Arcade audio generation is not authorized here (${ARCADE_AUDIO_ENABLE_ENV}).`,
    }
  if (!input.readiness.ready)
    return {
      action: 'refuse',
      statusCode: 409,
      message: input.readiness.reason,
    }
  const request = buildArcadeAudioEnqueueRequest(input.owner, input.cue)
  if (!request)
    return { action: 'refuse', statusCode: 400, message: 'Unknown arcade cue.' }
  return { action: 'enqueue', request }
}
