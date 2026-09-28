// /utils/tzaddikRecheck.ts
import type { TzaddikRecheckRequest } from '~/prisma/generated/prisma/client'

/**
 * The human-readable reason a recheck landed in NEEDS_REVIEW -- e.g. a
 * changed Wikipedia page id -- or the error a FAILED recheck recorded.
 * Shared by the detail sheet (t-019) and the review-queue card (t-029) so
 * the two surfaces never drift on how they parse `resultJson`.
 */
export function recheckReasonLabel(
  request: TzaddikRecheckRequest | null | undefined,
): string {
  if (!request) return ''
  if (request.status === 'FAILED') return request.error ?? ''
  if (request.status === 'NEEDS_REVIEW' && request.resultJson) {
    try {
      const parsed = JSON.parse(request.resultJson) as { reason?: unknown }
      return typeof parsed.reason === 'string' ? parsed.reason : ''
    } catch {
      return ''
    }
  }
  return ''
}
