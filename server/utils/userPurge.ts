// /server/utils/userPurge.ts
import prisma from './prisma'

export type UserPurgeCounts = Record<string, number>

// Deletes a user together with their owned content. Since the explicit
// onDelete pass, the schema itself no longer blocks user deletion: content
// relations (ArtCollection, Code, Dream, ...) orphan via SET NULL and
// user-scoped rows (reactions, ledgers, relations, referrals) cascade. This
// helper exists so an account wipe removes the content outright instead of
// stranding orphans — that orphan pile-up is exactly the test-fixture bloat
// this was built to stop. The explicit deletes on cascading tables are
// redundant with the DB but kept for the per-table counts they report.
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
      track('codes', await tx.code.deleteMany({ where: { userId } }))
      track('projects', await tx.project.deleteMany({ where: { userId } }))
      track('facets', await tx.facet.deleteMany({ where: { userId } }))
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
        'achievementRecords',
        await tx.achievementRecord.deleteMany({ where: { userId } }),
      )

      await tx.user.delete({ where: { id: userId } })

      return counts
    },
    { timeout: 30000 },
  )
}
