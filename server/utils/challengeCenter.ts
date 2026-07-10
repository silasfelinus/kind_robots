type ChallengeReaction = {
  reactionType: string
}

type ChallengeSubmissionScoreInput = {
  id: number
  contenderId: number | null
  variantKey: string
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
    score: ChallengeScore
  }>
  score: ChallengeScore
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

  return [...entries.values()]
    .sort(
      (a, b) =>
        b.score.netScore - a.score.netScore ||
        b.score.votes - a.score.votes ||
        a.name.localeCompare(b.name),
    )
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}
