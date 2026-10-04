// /utils/musicVideoKeyframes.ts
//
// Comic art as music video and comic film keyframes (music-video/t-025). Pure
// and DB-free.
//
// A scene can take its still from a Comic Studio attempt Silas already vetted
// instead of a fresh render: character fidelity is the weakest link in an
// animated piece until the character LoRAs exist, and a picked panel is the
// strongest anchor there is. Clips crop the image to the video's aspect
// (t-026), so a sheet or a portrait panel loses a lot in a 16:9 video; the
// route reports that rather than refusing it.
import type { MusicVideoAspect } from './musicVideoDoc'

export type KeyframeAttemptLike = {
  id: number
  artImageId: number | null
  verdict: string
  createdAt: string | Date
  width?: number | null
  height?: number | null
}

export const KEYFRAME_MAX_ASSIGNMENTS = 200

/** The newest attempt Silas selected, else the newest one he liked; never a rejection. */
export function chooseKeyframeAttempt<T extends KeyframeAttemptLike>(
  attempts: T[],
): T | null {
  const usable = attempts
    .filter((attempt) => attempt.artImageId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ||
        b.id - a.id,
    )
  return (
    usable.find((attempt) => attempt.verdict === 'selected') ??
    usable.find((attempt) => attempt.verdict === 'liked') ??
    null
  )
}

const ASPECT_RATIO: Record<MusicVideoAspect, number> = {
  '16:9': 16 / 9,
  '9:16': 9 / 16,
  '1:1': 1,
}

/**
 * How much of the image a centre crop to the video's aspect throws away, as a
 * fraction (0 when the shapes match). Unknown sizes report 0.
 */
export function keyframeCropLoss(
  size: { width?: number | null; height?: number | null },
  aspect: MusicVideoAspect,
): number {
  const width = Number(size.width)
  const height = Number(size.height)
  if (!(width > 0) || !(height > 0)) return 0
  const image = width / height
  const target = ASPECT_RATIO[aspect] ?? ASPECT_RATIO['16:9']
  const kept = image > target ? target / image : image / target
  return Math.round((1 - kept) * 1000) / 1000
}

export type KeyframeAssignment = {
  sceneId: string
  attemptId?: number
  slotId?: number
}

export function normalizeKeyframeAssignments(raw: unknown): {
  assignments: KeyframeAssignment[]
  errors: string[]
} {
  const errors: string[] = []
  const assignments: KeyframeAssignment[] = []
  const list = Array.isArray(raw) ? raw : []
  if (!list.length) errors.push('Send at least one assignment.')
  if (list.length > KEYFRAME_MAX_ASSIGNMENTS) {
    errors.push(`At most ${KEYFRAME_MAX_ASSIGNMENTS} assignments per request.`)
  }
  list.slice(0, KEYFRAME_MAX_ASSIGNMENTS).forEach((item, index) => {
    const record =
      item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
    const sceneId = typeof record.sceneId === 'string' ? record.sceneId : ''
    const attemptId = Number(record.attemptId)
    const slotId = Number(record.slotId)
    const hasAttempt = Number.isInteger(attemptId) && attemptId > 0
    const hasSlot = Number.isInteger(slotId) && slotId > 0
    if (!sceneId || hasAttempt === hasSlot) {
      errors.push(
        `assignments[${index}] needs a sceneId and exactly one of attemptId or slotId.`,
      )
      return
    }
    assignments.push(hasAttempt ? { sceneId, attemptId } : { sceneId, slotId })
  })
  return { assignments, errors }
}
