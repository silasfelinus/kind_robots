import { CREW_COMBAT_ART } from './crewCombatArt'
import { CREW_TELL_ART, type CrewTellReceipt } from './crewTelegraphArt'

export type CrewReviewDecision = 'approved' | 'rejected'

export type CrewArtReview = {
  asset: string
  artJobId: number
  artImageId: number
  decision: CrewReviewDecision
  note: string
  reviewedAt: string
  source: 'browser-local-art-qa'
  productionApproved: false
}

/** The immutable production receipts shared with gameplay. */
export const CREW_REVIEW_RECEIPTS: readonly CrewTellReceipt[] = [
  ...Object.values(CREW_TELL_ART).flatMap((crew) => Object.values(crew.beats)),
  ...Object.values(CREW_COMBAT_ART).flatMap((crew) => Object.values(crew)),
]

/**
 * Local visual QA is a handoff, never a public release or production approval.
 * Require a decoded image, an authorized reviewer and an explicit rationale.
 */
export function makeCrewArtReview(
  receipt: CrewTellReceipt,
  decision: CrewReviewDecision,
  note: string,
  canReview: boolean,
  decoded: boolean,
  reviewedAt: string,
): CrewArtReview | null {
  if (!canReview || !decoded || !note.trim()) return null
  if (decision !== 'approved' && decision !== 'rejected') return null
  if (!Number.isFinite(Date.parse(reviewedAt))) return null
  const known = CREW_REVIEW_RECEIPTS.find(
    (entry) =>
      entry.artKey === receipt.artKey &&
      entry.jobId === receipt.jobId &&
      entry.imageId === receipt.imageId,
  )
  if (!known) return null
  return {
    asset: known.artKey,
    artJobId: known.jobId,
    artImageId: known.imageId,
    decision,
    note: note.trim().slice(0, 500),
    reviewedAt,
    source: 'browser-local-art-qa',
    productionApproved: false,
  }
}
