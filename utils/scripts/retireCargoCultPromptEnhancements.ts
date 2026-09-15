// /utils/scripts/retireCargoCultPromptEnhancements.ts
//
// Withdraws the quality-incantation half of the "✨ Make Pretty Enhancements"
// pack: "masterpiece", "4k render", "trending on ArtStation" and the ten others
// listed in utils/promptEnhancementPolicy.ts.
//
// They depict nothing, so every render of one was an arbitrary picture wearing
// a label -- but the reason to withdraw them is not only the art. They are
// cargo-cult in the PROMPT too: appended last to a composed Krea prompt, where
// the contract's whole lesson is that a caption-conditioned model paints the
// nouns it is given. facetCatalogAudit has been flagging three of them as
// prompt-cargo-cult -> suppress-random; this applies that hint to the group.
//
// NOT A DELETE. RewardFacet links, ArtImage facet snapshots and saved Builder
// sheets reference these rows; deleting them would orphan that history to save
// nothing. Each row is deactivated, de-randomized, and released from the art
// requirement, which is reversible by flipping the same three flags back.
// cleanupRetiredFacetShells.ts is the tool for genuinely removing a row, and it
// exists precisely because removal needs edge migration first.
//
// Usage:
//   npx tsx utils/scripts/retireCargoCultPromptEnhancements.ts
//   npx tsx utils/scripts/retireCargoCultPromptEnhancements.ts --apply
//   npx tsx utils/scripts/retireCargoCultPromptEnhancements.ts --apply --restore

import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import { isRetiredPromptEnhancement } from '../promptEnhancementPolicy'
import {
  createScriptPrismaClient,
  withDatabaseRetry,
} from '../../scripts/lib/databaseRetry'

const APPLY = process.argv.includes('--apply')
const RESTORE = process.argv.includes('--restore')
const BATCH_ID = '2026-09-15-retire-cargo-cult-prompt-enhancements'

type Outcome = {
  id: number
  slug: string | null
  title: string
  wasRandomizable: boolean
  wasActive: boolean
  cancelledJobs: number
}

export async function main(): Promise<void> {
  const prisma = createScriptPrismaClient()
  try {
    const result = await withDatabaseRetry(
      'Retire cargo-cult prompt enhancements',
      async () => {
        const profiles = await prisma.facetProfile.findMany({
          where: { taxonomy: 'PROMPT_ENHANCEMENT' },
          select: { facetId: true, isRandomizable: true, artRequired: true },
        })
        const profileByFacet = new Map(profiles.map((p) => [p.facetId, p]))
        const facets = await prisma.facet.findMany({
          where: { id: { in: profiles.map((p) => p.facetId) } },
          select: { id: true, slug: true, title: true, isActive: true },
        })

        const targets = facets.filter((facet) =>
          isRetiredPromptEnhancement(facet),
        )
        const outcomes: Outcome[] = []

        for (const facet of targets) {
          const profile = profileByFacet.get(facet.id)
          let cancelledJobs = 0

          if (APPLY) {
            // A pending render for a row being withdrawn is wasted GPU time on
            // an image nothing will show. Cancelled before the flags flip, so a
            // crash between the two leaves a job that the next run re-cancels
            // rather than a live job for an inactive Facet.
            if (!RESTORE) {
              const cancelled = await prisma.artJob.updateMany({
                where: {
                  status: { in: ['PENDING', 'RUNNING'] },
                  payload: {
                    contains: `"entityType":"facet","entityId":${facet.id},`,
                  },
                },
                data: {
                  status: 'CANCELLED',
                  // Released with the status, matching the producer's own
                  // cancellation shape: a CANCELLED job still holding a claim
                  // reads as work in flight to anything scanning the queue.
                  claimedAt: null,
                  claimedBy: null,
                  error: `Cancelled by ${BATCH_ID}: this Facet is a quality incantation with nothing to depict and is being withdrawn from the catalog.`,
                },
              })
              cancelledJobs = cancelled.count
            }

            await prisma.facet.update({
              where: { id: facet.id },
              data: { isActive: RESTORE },
            })
            await prisma.facetProfile.updateMany({
              where: { facetId: facet.id },
              data: { isRandomizable: RESTORE, artRequired: RESTORE },
            })
          }

          outcomes.push({
            id: facet.id,
            slug: facet.slug,
            title: facet.title,
            wasRandomizable: Boolean(profile?.isRandomizable),
            wasActive: facet.isActive,
            cancelledJobs,
          })
        }

        return {
          packSize: facets.length,
          kept: facets.length - targets.length,
          outcomes,
        }
      },
    )

    console.log(
      JSON.stringify(
        {
          mode: APPLY ? (RESTORE ? 'restore' : 'apply') : 'dry-run',
          batchId: BATCH_ID,
          totals: {
            promptEnhancementFacets: result.packSize,
            retired: result.outcomes.length,
            keptAsSwatches: result.kept,
            jobsCancelled: result.outcomes.reduce(
              (sum, row) => sum + row.cancelledJobs,
              0,
            ),
          },
          retired: result.outcomes,
          policy: {
            action:
              'Deactivate, de-randomize, and release the art requirement. Rows are preserved so RewardFacet links, ArtImage facet snapshots, and saved Builder sheets keep resolving.',
            reversal:
              'Re-run with --apply --restore to put every listed row back exactly as it was found.',
            remainder:
              'The rest of the pack are real visual techniques and keep their art, rendered as a fixed-subject swatch by scripts/generate_facet_art.ts.',
          },
        },
        null,
        2,
      ),
    )
  } finally {
    await prisma.$disconnect()
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
