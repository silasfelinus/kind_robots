export type CommentTargetType = 'RESOURCE' | 'REWARD' | 'FACET'
export type CommentSpeakerKind = 'BOT' | 'CHARACTER'

export type CommentTargetProfile = {
  type: CommentTargetType
  id: number
  title: string
  description?: string | null
  flavorText?: string | null
  category?: string | null
  tags?: string[]
}

export type CommentSpeakerCandidate = {
  kind: CommentSpeakerKind
  id: number
  name: string
  relationshipScore?: number
  targetAffinityScore?: number
  voiceEvidenceScore?: number
  noveltyScore?: number
}

export type RankedCommentSpeaker = CommentSpeakerCandidate & {
  score: number
  reasons: string[]
}

const clamp = (value: number | undefined): number =>
  Number.isFinite(value) ? Math.max(0, Math.min(100, Number(value))) : 0

/**
 * Rank speakers for a target object. This deliberately contains no historical
 * WonderLab-pair signal: the museum corpus is voice evidence, not casting
 * history. Target fit and real object relationships win; novelty only breaks
 * otherwise-good ties.
 */
export function rankCommentSpeakers(
  _target: CommentTargetProfile,
  candidates: CommentSpeakerCandidate[],
  limit = 2,
): RankedCommentSpeaker[] {
  const ranked = candidates.map((candidate) => {
    const relationship = clamp(candidate.relationshipScore)
    const affinity = clamp(candidate.targetAffinityScore)
    const voice = clamp(candidate.voiceEvidenceScore)
    const novelty = clamp(candidate.noveltyScore)
    const reasons: string[] = []

    if (relationship >= 60) reasons.push('direct object relationship')
    else if (relationship > 0) reasons.push('weak object relationship')
    if (affinity >= 60) reasons.push('strong target affinity')
    else if (affinity > 0) reasons.push('target affinity')
    if (voice >= 60) reasons.push('strong voice evidence')
    else if (voice > 0) reasons.push('usable voice evidence')
    if (novelty >= 60) reasons.push('fresh pairing opportunity')

    return {
      ...candidate,
      // The weights encode the creative policy: cast for the thing in front of
      // us, not for who happened to share a museum visit years ago.
      score: relationship * 0.4 + affinity * 0.35 + voice * 0.2 + novelty * 0.05,
      reasons,
    }
  })

  return ranked
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.kind.localeCompare(right.kind) ||
        left.id - right.id,
    )
    // Two is the working default. Three exists for the rare object that
    // genuinely earns a crowd, and is never reached without asking for it.
    .slice(0, Math.max(1, Math.min(3, Math.floor(limit))))
}
