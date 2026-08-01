// /scripts/vercel-build.mjs
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { resolveFacetCatalogSeedDecision } from './lib/facetCatalogSeedPolicy.mjs'

const binExtension = process.platform === 'win32' ? '.cmd' : ''
const prismaBinary = path.resolve(`node_modules/.bin/prisma${binExtension}`)
const tsxBinary = path.resolve(`node_modules/.bin/tsx${binExtension}`)
const nuxtBinary = path.resolve('node_modules/.bin/nuxt')

function run(command, args, label) {
  console.log(`[vercel-build] ${label}`)

  const result = spawnSync(command, args, {
    env: process.env,
    stdio: 'inherit',
  })

  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`${label} exited with code ${result.status ?? 'unknown'}`)
  }
}

const isVercelBuild = process.env.VERCEL === '1'
const isProductionDeployment = process.env.VERCEL_ENV === 'production'

run(prismaBinary, ['generate'], 'Generating Prisma client')

if (!isVercelBuild || isProductionDeployment) {
  run(
    process.execPath,
    ['scripts/prisma-migrate-deploy.mjs'],
    'Applying production migrations',
  )

  const facetSeedDecision = resolveFacetCatalogSeedDecision()
  if (facetSeedDecision.run) {
    // runFacetCatalogSeed.ts normalizes source synonyms before importing
    // seedFacetCatalog.ts; the latter remains the canonical catalog writer.
    run(
      tsxBinary,
      ['utils/scripts/runFacetCatalogSeed.ts', '--apply'],
      `Seeding canonical Facet catalog and Character assignments (${facetSeedDecision.reason})`,
    )
  } else {
    console.log(
      `[vercel-build] Skipping unchanged canonical Facet catalog seed: ${facetSeedDecision.reason}`,
    )
  }

  // RewardFacet is stored outside the legacy canonical merge script. Move those
  // links first so retiring a duplicate Facet can never cascade-delete item traits.
  run(
    tsxBinary,
    ['utils/scripts/mergeRewardFacetDuplicateLinks.ts', '--apply'],
    'Preserving Reward Facets across canonical merges',
  )

  // Cheap and idempotent: retain this on every production build so any partial
  // historical cleanup converges even when the 1,300-record catalog seed is skipped.
  run(
    tsxBinary,
    ['utils/scripts/mergeCanonicalFacetDuplicates.ts', '--apply'],
    'Merging legacy duplicate Facets into canonical records',
  )

  // Apply the reviewed taxonomy last. The source seeders retain historical Builder
  // vocabulary and otherwise re-promote entries to random GENRE weight 1.
  run(
    tsxBinary,
    ['utils/scripts/curateFacetCatalog.ts', '--apply'],
    'Applying durable Facet curation batches',
  )

  // Keep art-backed house genres as distinct authored concepts. Relate them to
  // broader reusable genres instead of flattening their tone into false aliases.
  run(
    tsxBinary,
    ['utils/scripts/curateFacetHouseGenres.ts', '--apply'],
    'Curating art-backed house genres and related genre families',
  )

  // Refine broad or invented cultural labels after the structural genre passes.
  // Renames happen only when no art is attached; legacy labels remain aliases.
  run(
    tsxBinary,
    ['utils/scripts/curateFacetCulturalGenres.ts', '--apply'],
    'Refining cultural genre labels and distinct speculative traditions',
  )

  // Merge only genuine synonyms after all profile and alias curation. The merge
  // migrates every assignment and artwork link into the art-backed canonical row.
  run(
    tsxBinary,
    ['utils/scripts/mergeFacetPersonalitySynonyms.ts', '--apply'],
    'Merging exact Personality Facet synonyms',
  )

  // Repair high-confidence classification leaks and remove prompt cargo cult from
  // random selection without deleting manually useful legacy records.
  run(
    tsxBinary,
    ['utils/scripts/curateFacetTaxonomyLeaks.ts', '--apply'],
    'Repairing Facet taxonomy leaks and low-value random controls',
  )

  // Separate subject and cast controls from narrative form, then decompose the
  // remaining scenario-list hybrids into reusable genre, mood, setting, and theme.
  run(
    tsxBinary,
    ['utils/scripts/curateFacetGenreLeaks.ts', '--apply'],
    'Repairing subject themes and remaining genre hybrids',
  )

  // Near-neighbor Personality Facets remain distinct, but share explicit semantic
  // families and reduced secondary weights so crowded wording does not dominate.
  run(
    tsxBinary,
    ['utils/scripts/curateFacetPersonalityFamilies.ts', '--apply'],
    'Organizing related Personality Facets without false aliases',
  )

  // Read the entire post-curation catalog and print a ranked next-batch queue.
  // This never mutates data or blocks deployment while cleanup is still in motion.
  run(
    tsxBinary,
    ['utils/scripts/auditFacetCatalogOddities.ts', '--top=60'],
    'Auditing the complete Facet catalog for remaining oddities',
  )

  run(
    tsxBinary,
    ['scripts/seed_contenders.ts', '--write'],
    'Seeding Challenge Center contenders',
  )
} else {
  console.log(
    `[vercel-build] Skipping migrations and database seeds for Vercel ${process.env.VERCEL_ENV || 'unknown'} deployment`,
  )
}

run(
  process.execPath,
  ['--max-old-space-size=8192', nuxtBinary, 'build'],
  'Building Nuxt application',
)
