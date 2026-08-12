// /server/api/admin/comment-backfill-preview.get.ts
// Temporary execution surface for kind_robots#1769.
// It is deliberately impossible to run on production: only the named Vercel
// preview branch may enter. Remove this route after the approved backfill.
import { createError, defineEventHandler } from 'h3'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import prisma from '../../utils/prisma'

const BACKFILL_BRANCH = 'gpt/comment-backfill-live'

function assertBackfillPreview(): void {
  if (
    process.env.VERCEL_ENV !== 'preview' ||
    process.env.VERCEL_GIT_COMMIT_REF !== BACKFILL_BRANCH
  ) {
    throw createError({ statusCode: 404, message: 'Not found.' })
  }
}

function archiveFileCount(): number | null {
  try {
    return readdirSync(join(process.cwd(), 'config')).filter((name) =>
      /^wonderlab-voice-polish-batch-\d+\.json$/.test(name),
    ).length
  } catch {
    return null
  }
}

export default defineEventHandler(async () => {
  assertBackfillPreview()

  const [
    rewards,
    reviewableRewards,
    facets,
    reviewableFacets,
    rewardReactions,
    facetReactions,
    firstPartyRewardReactions,
    firstPartyFacetReactions,
  ] = await Promise.all([
    prisma.reward.count({ where: { isPublic: true, isActive: true } }),
    prisma.reward.count({ where: { isPublic: true, isActive: true, allowReviews: true } }),
    prisma.facet.count({ where: { isPublic: true, isActive: true } }),
    prisma.facet.count({ where: { isPublic: true, isActive: true, allowReviews: true } }),
    prisma.reaction.count({ where: { rewardId: { not: null } } }),
    prisma.reaction.count({ where: { facetId: { not: null } } }),
    prisma.reaction.count({
      where: {
        rewardId: { not: null },
        OR: [{ authorBotId: { not: null } }, { authorCharacterId: { not: null } }],
      },
    }),
    prisma.reaction.count({
      where: {
        facetId: { not: null },
        OR: [{ authorBotId: { not: null } }, { authorCharacterId: { not: null } }],
      },
    }),
  ])

  return {
    ok: true,
    executionGuard: {
      vercelEnv: process.env.VERCEL_ENV || null,
      gitBranch: process.env.VERCEL_GIT_COMMIT_REF || null,
    },
    credentials: {
      databaseConfigured: Boolean(process.env.DATABASE_URL),
      openAiConfigured: Boolean(process.env.OPENAI_API_KEY),
    },
    corpus: {
      rewards,
      reviewableRewards,
      facets,
      reviewableFacets,
      rewardReactions,
      facetReactions,
      firstPartyRewardReactions,
      firstPartyFacetReactions,
      archiveFilesOnDisk: archiveFileCount(),
    },
  }
})
