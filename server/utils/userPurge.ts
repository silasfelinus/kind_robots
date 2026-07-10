// /server/utils/userPurge.ts
import prisma from './prisma'

export type UserPurgeCounts = Record<string, number>

// Deletes a user together with every owned row that would otherwise block the
// delete. Required relations with no explicit onDelete rule (ArtCollection,
// Character, Dream, Scenario, SocialPost, Challenge, Reaction, UserRelation,
// Referral, ManaTransaction, KarmaTransaction, MilestoneRecord) default to
// ON DELETE RESTRICT in MySQL, so a user who still owns any of those rows can
// never be deleted — that is how residual test fixtures piled up ~1000
// undeletable cypress users. ArtImages are optional (SET NULL) and would not
// block, but they are deleted too so an account wipe doesn't strand orphaned
// image rows.
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

      // ChallengeSubmission -> Challenge is RESTRICT: clear submissions on the
      // user's challenges before the challenges themselves.
      const challenges = await tx.challenge.findMany({
        where: { userId },
        select: { id: true },
      })
      if (challenges.length > 0) {
        track(
          'challengeSubmissions',
          await tx.challengeSubmission.deleteMany({
            where: { challengeId: { in: challenges.map((c) => c.id) } },
          }),
        )
      }
      track('challenges', await tx.challenge.deleteMany({ where: { userId } }))

      track(
        'artCollections',
        await tx.artCollection.deleteMany({ where: { userId } }),
      )
      track('dreams', await tx.dream.deleteMany({ where: { userId } }))
      track('characters', await tx.character.deleteMany({ where: { userId } }))
      track('scenarios', await tx.scenario.deleteMany({ where: { userId } }))
      track(
        'socialPosts',
        await tx.socialPost.deleteMany({ where: { userId } }),
      )
      track('artImages', await tx.artImage.deleteMany({ where: { userId } }))
      track(
        'manaTransactions',
        await tx.manaTransaction.deleteMany({ where: { userId } }),
      )
      track(
        'karmaTransactions',
        await tx.karmaTransaction.deleteMany({ where: { userId } }),
      )
      track(
        'milestoneRecords',
        await tx.milestoneRecord.deleteMany({ where: { userId } }),
      )

      await tx.user.delete({ where: { id: userId } })

      return counts
    },
    { timeout: 30000 },
  )
}
