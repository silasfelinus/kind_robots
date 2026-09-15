// /utils/scripts/applyCuratedFacetArtPrompts.ts
//
// Writes utils/seeds/facetArtPrompts.ts onto Facet.artPrompt.
//
// Git is the source of truth for this text, not the database: these are 146
// authored prompts and they should be reviewable in a diff. This script only
// pushes them out.
//
// It never overwrites a prompt that is already curated and DIFFERENT from the
// seed, unless --force is given. If someone has edited a prompt in the app, the
// seed file is the stale copy and clobbering it silently would be the worst of
// the failure modes this work has already produced -- an edit that disappears
// with nothing to show for it.
//
// Usage:
//   npx tsx utils/scripts/applyCuratedFacetArtPrompts.ts
//   npx tsx utils/scripts/applyCuratedFacetArtPrompts.ts --apply
//   npx tsx utils/scripts/applyCuratedFacetArtPrompts.ts --apply --force

import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import { CURATED_FACET_ART_PROMPTS } from '../seeds/facetArtPrompts'
import { checkArtPromptContract } from '../../server/utils/artPromptContract'
import { isLegacyGeneratedFacetPrompt } from '../../scripts/generate_facet_art_v4'
import {
  createScriptPrismaClient,
  withDatabaseRetry,
} from '../../scripts/lib/databaseRetry'

const APPLY = process.argv.includes('--apply')
const FORCE = process.argv.includes('--force')

export async function main(): Promise<void> {
  const prisma = createScriptPrismaClient()
  try {
    const result = await withDatabaseRetry(
      'Apply curated Facet art prompts',
      async () => {
        const slugs = Object.keys(CURATED_FACET_ART_PROMPTS)
        const facets = await prisma.facet.findMany({
          where: { slug: { in: slugs } },
          select: { id: true, slug: true, title: true, artPrompt: true },
        })
        const bySlug = new Map(facets.map((f) => [f.slug ?? '', f]))

        const missing: string[] = []
        const unchanged: string[] = []
        const held: Array<{ slug: string; reason: string }> = []
        const updates: Array<{ id: number; slug: string; prompt: string }> = []

        for (const slug of slugs) {
          const prompt = CURATED_FACET_ART_PROMPTS[slug] as string
          const facet = bySlug.get(slug)
          if (!facet) {
            missing.push(slug)
            continue
          }
          const identity = `${facet.title}. ${prompt}`

          // The same gate the enqueue boundary applies, run here so a bad
          // prompt is caught while it is still only a row edit.
          const violations = checkArtPromptContract({
            prompt: identity,
            engine: 'krea2',
            steps: 8,
            cfg: 1,
          })
          if (violations.length) {
            held.push({ slug, reason: violations.map((v) => v.rule).join(', ') })
            continue
          }
          if (isLegacyGeneratedFacetPrompt(identity)) {
            held.push({ slug, reason: 'reads as generator output; would be rewritten' })
            continue
          }

          const current = (facet.artPrompt ?? '').trim()
          if (current === identity) {
            unchanged.push(slug)
            continue
          }
          if (current && !isLegacyGeneratedFacetPrompt(current) && !FORCE) {
            held.push({ slug, reason: 'already curated and differs; --force to replace' })
            continue
          }
          updates.push({ id: facet.id, slug, prompt: identity })
        }

        if (APPLY) {
          for (const update of updates) {
            await prisma.facet.update({
              where: { id: update.id },
              data: { artPrompt: update.prompt },
            })
          }
        }
        return { slugs, missing, unchanged, held, updates }
      },
    )

    console.log(
      JSON.stringify(
        {
          mode: APPLY ? (FORCE ? 'apply-force' : 'apply') : 'dry-run',
          totals: {
            seedPrompts: result.slugs.length,
            written: APPLY ? result.updates.length : 0,
            wouldWrite: result.updates.length,
            alreadyCurrent: result.unchanged.length,
            held: result.held.length,
            missingFacet: result.missing.length,
          },
          held: result.held.slice(0, 40),
          missingFacet: result.missing.slice(0, 40),
          next: 'npx tsx scripts/generate_facet_art.ts --write --requeue-curated',
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
