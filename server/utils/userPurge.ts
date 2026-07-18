// /server/utils/userPurge.ts
import prisma from './prisma'

export type UserPurgeCounts = Record<string, number>

// Delete the account and the content it owns instead of relying on SET NULL,
// which turns disposable Cypress fixtures into permanent orphan records.
export async function deleteUserWithOwnedData(
  userId: number,
): Promise<UserPurgeCounts> {
  return prisma.$transaction(
    async (tx) => {
      const counts: UserPurgeCounts = {}
      const track = (label: string, result: { count: number }) => {
        if (result.count > 0) counts[label] = result.count
      }

      track(
        'userRelations',
        await tx.userRelation.deleteMany({
          where: { OR: [{ userId }, { relatedUserId: userId }] },
        }),
      )
      track(
        'referrals',
        await tx.referral.deleteMany({
          where: { OR: [{ referrerId: userId }, { referredId: userId }] },
        }),
      )
      track('reactions', await tx.reaction.deleteMany({ where: { userId } }))

      const challenges = await tx.challenge.findMany({
        where: { userId },
        select: { id: true },
      })
      if (challenges.length > 0) {
        track(
          'challengeSubmissions',
          await tx.challengeSubmission.deleteMany({
            where: {
              challengeId: { in: challenges.map((challenge) => challenge.id) },
            },
          }),
        )
      }
      track('challenges', await tx.challenge.deleteMany({ where: { userId } }))

      // Delete dependent conversational rows before their bots.
      track('chats', await tx.chat.deleteMany({ where: { userId } }))
      track('bots', await tx.bot.deleteMany({ where: { userId } }))
      track('rewards', await tx.reward.deleteMany({ where: { userId } }))

      track(
        'artCollections',
        await tx.artCollection.deleteMany({ where: { userId } }),
      )
      track('projects', await tx.project.deleteMany({ where: { userId } }))
      track('facets', await tx.facet.deleteMany({ where: { userId } }))
      track('dreams', await tx.dream.deleteMany({ where: { userId } }))
      track('characters', await tx.character.deleteMany({ where: { userId } }))
      track('scenarios', await tx.scenario.deleteMany({ where: { userId } }))

      // ArtImages may reference prompts and servers, so remove them first.
      track('artImages', await tx.artImage.deleteMany({ where: { userId } }))
      track('prompts', await tx.prompt.deleteMany({ where: { userId } }))
      track('servers', await tx.server.deleteMany({ where: { userId } }))

      track(
        'manaTransactions',
        await tx.manaTransaction.deleteMany({ where: { userId } }),
      )
      track(
        'karmaTransactions',
        await tx.karmaTransaction.deleteMany({ where: { userId } }),
      )
      track(
        'achievementRecords',
        await tx.achievementRecord.deleteMany({ where: { userId } }),
      )

      await tx.user.delete({ where: { id: userId } })
      return counts
    },
    { timeout: 30000 },
  )
}
