// /utils/scripts/verifyFacetCatalogMaintenance.ts
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const cleanupPath = path.join(
  root,
  'utils/scripts/cleanupRetiredFacetShells.ts',
)
const artPath = path.join(root, 'scripts/generate_facet_art.ts')
const runnerPath = path.join(root, 'scripts/run_facet_catalog_maintenance.ts')
const buildPath = path.join(root, 'scripts/vercel-build.mjs')

const cleanup = fs.readFileSync(cleanupPath, 'utf8')
const art = fs.readFileSync(artPath, 'utf8')
const runner = fs.readFileSync(runnerPath, 'utf8')
const build = fs.readFileSync(buildPath, 'utf8')

for (const required of [
  "designer: 'facet-catalog-merged'",
  "groupKey: 'genre-recipe'",
  'mergedIntoFacetId',
  'canonicalFacetId',
  'characterFacet.createMany',
  'botFacet.createMany',
  'rewardFacet.createMany',
  'dreamFacet.createMany',
  'scenarioFacet.createMany',
  'facetArtImage.createMany',
  'facetArtCollection.createMany',
  'facetRelation.createMany',
  'reaction.updateMany',
  'migrateArtJobs',
  "'migrated-and-deleted'",
  'await prisma.facet.delete',
  'remainingMergedShells',
  'remainingRecipeProfiles',
  'stripRetiredMergeMetadata',
]) {
  assert.ok(cleanup.includes(required), `Missing cleanup contract: ${required}`)
}

assert.ok(
  cleanup.includes(
    'Retired Facet shells are migration scaffolding, not historical records.',
  ),
  'Cleanup policy must reject inactive merge shells as stored history.',
)
assert.ok(
  !cleanup.includes('preservedForArt'),
  'Artwork must be migrated to the canonical Facet, not used to preserve a retired shell.',
)

for (const required of [
  'auditFacetCatalog',
  'BLOCKING_REASON_CODES',
  "'duplicate-title'",
  "'composite-genre'",
  "'unreviewed-legacy-record'",
  'profile.artRequired',
  'primaryArtBacked',
  "const PRIMARY_FIELD = 'imagePath'",
  "const PROJECT_SLUG = 'facet-catalog'",
  "const FACET_ART_VERSION = 'facet-primary-krea2-v1'",
  'buildKrea2WorkflowFromRequest',
  "entityType: 'facet'",
  'field: PRIMARY_FIELD',
  'requireCompletionProof: true',
  'facets: [facetSnapshot',
  'priorityFor',
  'artPrompt: entry.identityPrompt',
]) {
  assert.ok(art.includes(required), `Missing Facet art contract: ${required}`)
}

assert.ok(
  art.includes('Card, hero, and icon variants wait for the multi-art schema.'),
  'Current queue must remain primary-image-only until the multi-art schema lands.',
)
assert.ok(
  art.includes("status: { in: ['PENDING', 'RUNNING'] }"),
  'Current-version queued or running jobs must be reused.',
)

for (const required of [
  "const LOCK_NAME = 'kind-robots:facet-catalog-maintenance'",
  'SELECT GET_LOCK(?, ?) AS acquired',
  'SELECT RELEASE_LOCK(?) AS released',
  'connection?.ping()',
  "script: 'utils/scripts/runFacetCatalogSeed.ts'",
  "script: 'utils/scripts/applyFacetCatalogDirectives.ts'",
  "script: 'utils/scripts/cleanupRetiredFacetShells.ts'",
  "script: 'utils/scripts/auditFacetCatalogOddities.ts'",
  "script: 'scripts/generate_facet_art.ts'",
]) {
  assert.ok(
    runner.includes(required),
    `Missing serialized runner contract: ${required}`,
  )
}

const seedHook = "script: 'utils/scripts/runFacetCatalogSeed.ts'"
const directivesHook = "script: 'utils/scripts/applyFacetCatalogDirectives.ts'"
const cleanupHook = "script: 'utils/scripts/cleanupRetiredFacetShells.ts'"
const auditHook = "script: 'utils/scripts/auditFacetCatalogOddities.ts'"
const artHook = "script: 'scripts/generate_facet_art.ts'"

assert.ok(
  runner.indexOf(seedHook) < runner.indexOf(directivesHook),
  'Canonical seed must run before final catalog directives.',
)
assert.ok(
  runner.indexOf(directivesHook) < runner.indexOf(cleanupHook),
  'Final curation directives must run before retired shell cleanup.',
)
assert.ok(
  runner.indexOf(cleanupHook) < runner.indexOf(auditHook),
  'Retired shell cleanup must finish before the whole-catalog audit.',
)
assert.ok(
  runner.indexOf(auditHook) < runner.indexOf(artHook),
  'The whole-catalog audit must run before Facet artwork is queued.',
)

assert.ok(
  !build.includes("'scripts/run_facet_catalog_maintenance.ts'"),
  'Production deployment must not run long-lived Facet catalog mutations.',
)
assert.ok(
  build.includes('Skipping Facet catalog maintenance during deployment'),
  'Production build must explain how explicit Facet maintenance is separated from application delivery.',
)
assert.ok(
  !build.includes("['utils/scripts/runFacetCatalogSeed.ts', '--apply']"),
  'Production build must not bypass the explicit Facet maintenance runner.',
)

/*
 * kind-robots/t-051. The production build deliberately no longer runs Facet
 * catalog maintenance (see the two assertions above) -- it was blocking deploys:
 * nine consecutive production builds died there on 2026-08-01, and because
 * `nuxt build` runs last in vercel-build.mjs the application was never compiled.
 *
 * But "the build must not run it" only makes sense paired with something that
 * does. Without this workflow the build's own log line -- "run
 * scripts/run_facet_catalog_maintenance.ts explicitly" -- points at nothing, and
 * the catalog silently stops being maintained at all.
 */
assert.ok(
  fs.existsSync(
    path.join(root, '.github/workflows/facet-catalog-maintenance.yml'),
  ),
  'An out-of-band Facet catalog maintenance workflow must exist, because the production build no longer runs the maintenance itself.',
)

console.log('Facet catalog maintenance and artwork queue contract verified.')
