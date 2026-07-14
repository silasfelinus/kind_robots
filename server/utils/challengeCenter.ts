type ChallengeReaction = {
  reactionType: string
}

type ChallengeSubmissionScoreInput = {
  id: number
  contenderId: number | null
  variantKey: string
  promptUsed?: string | null
  randomSelections?: unknown
  Reactions: ChallengeReaction[]
}

export type ChallengeScore = {
  loved: number
  clapped: number
  booed: number
  hated: number
  votes: number
  netScore: number
}

export type ChallengeLeaderboardEntry = {
  contenderId: number
  slug: string
  name: string
  avatarImageId: number | null
  submissions: number
  variants: Array<{
    submissionId: number
    variantKey: string
    promptUsed: string | null
    randomSelections: unknown
    rank: number
    score: ChallengeScore
  }>
  bestVariantKey: string | null
  score: ChallengeScore
}

/** The Contender fields that facet grouping can key on. */
export type ContenderFacetKey = 'kind' | 'provider' | 'model' | 'generator'

export type FacetLeaderboardEntry = {
  facet: ContenderFacetKey
  value: string
  contenderSlugs: string[]
  submissions: number
  score: ChallengeScore
  rank: number
}

type FacetSubmissionInput = {
  contenderId: number | null
  Reactions: ChallengeReaction[]
  Contender: {
    slug: string
    kind: string
    provider: string | null
    model: string | null
    generator: string | null
  } | null
}

export function scoreChallengeReactions(
  reactions: ChallengeReaction[],
): ChallengeScore {
  const score: ChallengeScore = {
    loved: 0,
    clapped: 0,
    booed: 0,
    hated: 0,
    votes: 0,
    netScore: 0,
  }

  for (const reaction of reactions) {
    if (reaction.reactionType === 'LOVED') score.loved += 1
    if (reaction.reactionType === 'CLAPPED') score.clapped += 1
    if (reaction.reactionType === 'BOOED') score.booed += 1
    if (reaction.reactionType === 'HATED') score.hated += 1
  }

  score.votes = score.loved + score.clapped + score.booed + score.hated
  score.netScore = score.loved + score.clapped - score.booed - score.hated

  return score
}

export function buildChallengeLeaderboard(
  submissions: Array<
    ChallengeSubmissionScoreInput & {
      Contender: {
        id: number
        slug: string
        name: string
        avatarImageId: number | null
      } | null
    }
  >,
): ChallengeLeaderboardEntry[] {
  const entries = new Map<number, ChallengeLeaderboardEntry>()

  for (const submission of submissions) {
    if (!submission.Contender || !submission.contenderId) continue

    const variantScore = scoreChallengeReactions(submission.Reactions)
    const current = entries.get(submission.contenderId) ?? {
      contenderId: submission.Contender.id,
      slug: submission.Contender.slug,
      name: submission.Contender.name,
      avatarImageId: submission.Contender.avatarImageId,
      submissions: 0,
      variants: [],
      bestVariantKey: null,
      score: {
        loved: 0,
        clapped: 0,
        booed: 0,
        hated: 0,
        votes: 0,
        netScore: 0,
      },
    }

    current.submissions += 1
    current.variants.push({
      submissionId: submission.id,
      variantKey: submission.variantKey,
      promptUsed: submission.promptUsed ?? null,
      randomSelections: submission.randomSelections ?? null,
      rank: 0,
      score: variantScore,
    })
    current.score.loved += variantScore.loved
    current.score.clapped += variantScore.clapped
    current.score.booed += variantScore.booed
    current.score.hated += variantScore.hated
    current.score.votes += variantScore.votes
    current.score.netScore += variantScore.netScore

    entries.set(submission.contenderId, current)
  }

  for (const entry of entries.values()) {
    entry.variants.sort(
      (a, b) =>
        b.score.netScore - a.score.netScore ||
        b.score.votes - a.score.votes ||
        a.variantKey.localeCompare(b.variantKey),
    )
    entry.variants.forEach((variant, index) => {
      variant.rank = index + 1
    })
    entry.bestVariantKey =
      entry.variants.length > 1 ? entry.variants[0]!.variantKey : null
  }

  return [...entries.values()]
    .sort(
      (a, b) =>
        b.score.netScore - a.score.netScore ||
        b.score.votes - a.score.votes ||
        a.name.localeCompare(b.name),
    )
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}

/**
 * Groups submissions by a Contender facet (kind/provider/model/generator)
 * instead of by individual contender, so e.g. "all Comfy-backed art
 * generators" or "all Claude models" can be ranked as one weight class.
 * Submissions from a contender that doesn't declare the requested facet
 * are skipped (there's nothing meaningful to group them under).
 */
export function buildFacetLeaderboard(
  submissions: FacetSubmissionInput[],
  facet: ContenderFacetKey,
): FacetLeaderboardEntry[] {
  const entries = new Map<
    string,
    FacetLeaderboardEntry & { contenderSlugSet: Set<string> }
  >()

  for (const submission of submissions) {
    if (!submission.Contender) continue

    const rawValue = submission.Contender[facet]
    const value = rawValue && String(rawValue).trim() ? String(rawValue) : null
    if (!value) continue

    const variantScore = scoreChallengeReactions(submission.Reactions)
    const current = entries.get(value) ?? {
      facet,
      value,
      contenderSlugs: [],
      contenderSlugSet: new Set<string>(),
      submissions: 0,
      score: {
        loved: 0,
        clapped: 0,
        booed: 0,
        hated: 0,
        votes: 0,
        netScore: 0,
      },
      rank: 0,
    }

    current.submissions += 1
    current.contenderSlugSet.add(submission.Contender.slug)
    current.score.loved += variantScore.loved
    current.score.clapped += variantScore.clapped
    current.score.booed += variantScore.booed
    current.score.hated += variantScore.hated
    current.score.votes += variantScore.votes
    current.score.netScore += variantScore.netScore

    entries.set(value, current)
  }

  return [...entries.values()]
    .sort(
      (a, b) =>
        b.score.netScore - a.score.netScore ||
        b.score.votes - a.score.votes ||
        a.value.localeCompare(b.value),
    )
    .map(({ contenderSlugSet, ...entry }, index) => ({
      ...entry,
      contenderSlugs: [...contenderSlugSet].sort(),
      rank: index + 1,
    }))
}
