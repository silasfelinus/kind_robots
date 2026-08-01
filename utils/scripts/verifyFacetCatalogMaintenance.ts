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
const buildPath = path.join(root, 'scripts/vercel-build.mjs')

const cleanup = fs.readFileSync(cleanupPath, 'utf8')
const art = fs.readFileSync(artPath, 'utf8')
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
  "action: 'migrated-and-deleted'",
  'await prisma.facet.delete',
  'remainingMergedShells',
  'remainingRecipeProfiles',
  'stripRetiredMergeMetadata',
]) {
  assert.ok(cleanup.includes(required), `Missing cleanup contract: ${required}`)
}

assert.ok(
  cleanup.includes('Retired Facet shells are migration scaffolding, not historical records.'),
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
  art.includes('status: { in: [\'PENDING\', \'RUNNING\'] }'),
  'Current-version queued or running jobs must be reused.',
)

const directivesHook =
  "['utils/scripts/applyFacetCatalogDirectives.ts', '--apply']"
const cleanupHook =
  "['utils/scripts/cleanupRetiredFacetShells.ts', '--apply']"
const auditHook = "['utils/scripts/auditFacetCatalogOddities.ts', '--top=60']"
const artHook = "['scripts/generate_facet_art.ts', '--write']"

for (const hook of [directivesHook, cleanupHook, auditHook, artHook]) {
  assert.ok(build.includes(hook), `Production build is missing ${hook}.`)
}

assert.ok(
  build.indexOf(directivesHook) < build.indexOf(cleanupHook),
  'Final curation directives must run before retired shell cleanup.',
)
assert.ok(
  build.indexOf(cleanupHook) < build.indexOf(auditHook),
  'Retired shell cleanup must finish before the whole-catalog audit.',
)
assert.ok(
  build.indexOf(auditHook) < build.indexOf(artHook),
  'The whole-catalog audit must run before Facet artwork is queued.',
)

console.log('Facet catalog maintenance and artwork queue contract verified.')
