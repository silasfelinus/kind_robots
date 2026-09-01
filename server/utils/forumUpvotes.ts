import prisma from './prisma'

/**
 * Forum upvotes reuse the existing Reaction table rather than creating a
 * second voting ledger. ReactionType predates literal upvotes, so a reserved
 * comment marker distinguishes these rows from ordinary CLAPPED reactions on
 * the same Chat.
 *
 * The forum API speaks in upvotes. This storage translation is an
 * implementation detail and can later move to a literal enum value without
 * changing clients.
 */
export const FORUM_UPVOTE_MARKER = 'rainbow:forum-upvote:v1'
export const FORUM_UPVOTE_REACTION_TYPE = 'CLAPPED' as const
export const FORUM_UPVOTE_REACTION_CATEGORY = 'CHAT_EXCHANGE' as const

export type ForumUpvoteStat = {
  upvoteCount: number
  viewerHasUpvoted: boolean
}

function emptyStat(): ForumUpvoteStat {
  return { upvoteCount: 0, viewerHasUpvoted: false }
}

export async function getForumUpvoteStats(
  threadIds: readonly number[],
  viewerUserId: number | null = null,
): Promise<Map<number, ForumUpvoteStat>> {
  const ids = [...new Set(threadIds.filter((id) => Number.isInteger(id) && id > 0))]
  const stats = new Map<number, ForumUpvoteStat>()
  for (const id of ids) stats.set(id, emptyStat())
  if (!ids.length) return stats

  const rows = await prisma.reaction.findMany({
    where: {
      chatId: { in: ids },
      reactionType: FORUM_UPVOTE_REACTION_TYPE,
      reactionCategory: FORUM_UPVOTE_REACTION_CATEGORY,
      comment: FORUM_UPVOTE_MARKER,
    },
    select: {
      chatId: true,
      userId: true,
    },
  })

  // Count distinct humans rather than rows. This keeps ranking correct even
  // if historical data or two simultaneous requests ever produce duplicate
  // rows for one user/thread pair.
  const votersByThread = new Map<number, Set<number>>()
  for (const row of rows) {
    if (!row.chatId) continue
    const voters = votersByThread.get(row.chatId) ?? new Set<number>()
    voters.add(row.userId)
    votersByThread.set(row.chatId, voters)
  }

  for (const id of ids) {
    const voters = votersByThread.get(id) ?? new Set<number>()
    stats.set(id, {
      upvoteCount: voters.size,
      viewerHasUpvoted: viewerUserId ? voters.has(viewerUserId) : false,
    })
  }

  return stats
}

export async function setForumUpvote(input: {
  threadId: number
  userId: number
  upvoted: boolean
}): Promise<ForumUpvoteStat> {
  const where = {
    chatId: input.threadId,
    userId: input.userId,
    reactionType: FORUM_UPVOTE_REACTION_TYPE,
    reactionCategory: FORUM_UPVOTE_REACTION_CATEGORY,
    comment: FORUM_UPVOTE_MARKER,
  } as const

  await prisma.$transaction(async (tx) => {
    // User identity, not Bot/Agent identity, owns the vote. A human and every
    // agent connected to that human therefore share one vote on a thread.
    await tx.reaction.deleteMany({ where })

    if (input.upvoted) {
      await tx.reaction.create({
        data: {
          userId: input.userId,
          reactionType: FORUM_UPVOTE_REACTION_TYPE,
          reactionCategory: FORUM_UPVOTE_REACTION_CATEGORY,
          rating: 1,
          chatId: input.threadId,
          comment: FORUM_UPVOTE_MARKER,
        },
      })
    }
  })

  return (
    await getForumUpvoteStats([input.threadId], input.userId)
  ).get(input.threadId) ?? emptyStat()
}
