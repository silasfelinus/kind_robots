import {
  updateReviewDraft,
  type ReviewDraftRecord,
} from '@/server/utils/reviewDraftRepository'
import {
  assertWonderLabReviewGrounding,
  resolveWonderLabReviewSourceEvidence,
  type WonderLabReviewGroundingResult,
} from '@/utils/wonderlab/reviewDraftGrounding'

export type GroundableWonderLabReviewResult = {
  draft: ReviewDraftRecord
  generated: boolean
  observations: string[]
}

export type GroundedWonderLabReviewResult<T extends GroundableWonderLabReviewResult> =
  T & {
    grounding: WonderLabReviewGroundingResult | null
  }

function promptSourcePath(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
  const provenance = (payload as { provenance?: unknown }).provenance
  if (!provenance || typeof provenance !== 'object' || Array.isArray(provenance)) {
    return null
  }
  const sourcePath = (provenance as { exhibitSourcePath?: unknown })
    .exhibitSourcePath
  return typeof sourcePath === 'string' && sourcePath.trim()
    ? sourcePath.trim()
    : null
}

async function failGrounding<T extends GroundableWonderLabReviewResult>(
  result: T,
  actorUserId: number,
  reason: string,
): Promise<GroundedWonderLabReviewResult<T>> {
  const draft = await updateReviewDraft({
    id: result.draft.id,
    actorUserId,
    status: 'FAILED',
    failureReason: `Grounding validation failed: ${reason}`,
  })
  return { ...result, draft, grounding: null }
}

export async function enforceWonderLabReviewGrounding<
  T extends GroundableWonderLabReviewResult,
>(
  result: T,
  actorUserId: number,
): Promise<GroundedWonderLabReviewResult<T>> {
  if (!result.generated || result.draft.status === 'FAILED') {
    return { ...result, grounding: null }
  }

  const sourcePath = promptSourcePath(result.draft.promptPayload)
  if (!sourcePath) {
    return failGrounding(
      result,
      actorUserId,
      'The generated draft has no Component source-path provenance.',
    )
  }

  try {
    const evidence = resolveWonderLabReviewSourceEvidence(sourcePath)
    const grounding = assertWonderLabReviewGrounding(
      result.draft.generatedComment,
      result.observations,
      evidence,
    )
    return { ...result, grounding }
  } catch (error) {
    return failGrounding(
      result,
      actorUserId,
      error instanceof Error ? error.message : 'Source grounding could not be verified.',
    )
  }
}
