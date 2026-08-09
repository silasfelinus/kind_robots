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
const schemaPath = path.join(root, 'prisma/schema.prisma')
const managerPath = path.join(root, 'components/facets/facet-manager.vue')
// Art variants live with the per-Facet editor since facet-manager's Library
// grid was retired -- one Facet is chosen in the gallery, then edited here.
const editorPath = path.join(root, 'components/facets/facet-editor.vue')
const galleryPath = path.join(root, 'components/facets/facet-gallery.vue')
const entityArtPath = path.join(root, 'server/utils/entityArt.ts')
const queueCoveragePath = path.join(root, 'server/utils/artJobQueueCoverage.ts')
const queueSettingsPath = path.join(root, 'server/utils/artJobQueueSettings.ts')
const queueClaimPath = path.join(root, 'server/api/art/queue/claim.post.ts')

const cleanup = fs.readFileSync(cleanupPath, 'utf8')
const art = fs.readFileSync(artPath, 'utf8')
const runner = fs.readFileSync(runnerPath, 'utf8')
const build = fs.readFileSync(buildPath, 'utf8')
const schema = fs.readFileSync(schemaPath, 'utf8')
const manager = fs.readFileSync(managerPath, 'utf8')
const editor = fs.readFileSync(editorPath, 'utf8')
const gallery = fs.readFileSync(galleryPath, 'utf8')
const entityArt = fs.readFileSync(entityArtPath, 'utf8')
const queueCoverage = fs.readFileSync(queueCoveragePath, 'utf8')
const queueSettings = fs.readFileSync(queueSettingsPath, 'utf8')
const queueClaim = fs.readFileSync(queueClaimPath, 'utf8')

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
  'primaryLinked',
  'const ART_VARIANTS = [',
  "field: 'imagePath'",
  "field: 'iconPath'",
  "field: 'cardPath'",
  "field: 'heroPath'",
  'width: 256',
  'height: 256',
  'width: 512',
  'height: 768',
  'width: 1280',
  'height: 720',
  "const PROJECT_SLUG = 'facet-catalog'",
  "const FACET_ART_VERSION = 'facet-coverage-krea2-v3'",
  "const ALL_VARIANTS = process.argv.includes('--all-variants')",
  "const NEGATIVE_PROMPT = ''",
  'assertArtPromptContract',
  "engine: 'krea2'",
  'buildKrea2WorkflowFromRequest',
  "entityType: 'facet'",
  'field: variant.field',
  'requireCompletionProof: true',
  'facets: [facetSnapshot',
  'priorityFor',
  'artPrompt: entry.identityPrompt',
  "coverageMode: ALL_VARIANTS ? 'all-variants' : 'baseline'",
  'payload: { contains: \'"entityType":"facet"\' }',
  'variant: ART_VARIANTS[0]',
]) {
  assert.ok(art.includes(required), `Missing Facet art contract: ${required}`)
}

/*
 * Baseline coverage policy, 2026-08-08.
 *
 * Facets can still own four purpose-built slots, and the editor still exposes
 * them for intentional curation. The automatic backlog is different: its job is
 * to make every displayable object have something usable before spending three
 * more renders improving the same object. Both the producer and claim-time
 * reconciliation use this exact order. RUNNING work is never cancelled and
 * cancelled ArtJob rows remain as provenance.
 */
const producerImagePathOrder = art.indexOf("field: 'imagePath'")
const producerCardPathOrder = art.indexOf("field: 'cardPath'")
const producerHeroPathOrder = art.indexOf("field: 'heroPath'")
const producerIconPathOrder = art.indexOf("field: 'iconPath'")
assert.ok(
  producerImagePathOrder >= 0 &&
    producerImagePathOrder < producerCardPathOrder &&
    producerCardPathOrder < producerHeroPathOrder &&
    producerHeroPathOrder < producerIconPathOrder,
  'Facet producer order must be imagePath -> cardPath -> heroPath -> iconPath.',
)

for (const required of [
  'if (!ALL_VARIANTS)',
  'const hasDisplayArt = Boolean(',
  'const pendingVariant = ART_VARIANTS.find',
  'variant: ART_VARIANTS[0]',
  'Explicit enhancement mode',
  "ALL_VARIANTS ? 'all-variants' : 'baseline'",
  'Reuse any PENDING or RUNNING Facet ArtJob regardless of artwork-version marker',
]) {
  assert.ok(
    art.includes(required),
    `Missing coverage-first producer contract: ${required}`,
  )
}

// Card/hero/icon remain available when explicitly requested, but image-model
// prompts must describe the desired crop rather than asking Krea to paint a
// physical card or UI frame.
for (const forbidden of [
  'portrait card artwork',
  'room for card chrome',
  'icon logo artwork',
]) {
  assert.ok(
    !art.includes(forbidden),
    `Facet prompt vocabulary must not contain legacy format language: ${forbidden}`,
  )
}

for (const required of [
  'FACET_COVERAGE_FIELD_ORDER',
  "'imagePath'",
  "'cardPath'",
  "'heroPath'",
  "'iconPath'",
  "candidate.projectSlug !== 'facet-catalog'",
  "status: { in: ['PENDING', 'RUNNING'] }",
  "status: 'CANCELLED'",
  'hasDisplayArt',
  'selectFacetCoverageKeeper',
  'payload.retry',
  'duplicate static delivery',
]) {
  assert.ok(
    queueCoverage.includes(required),
    `Missing queue coverage contract: ${required}`,
  )
}

// The payload readers and the claim-time assertion moved to
// artJobQueueSettings.ts (2026-08-09) so they stay reachable without a
// database — artJobQueueCoverage imports prisma, which throws at import time
// without DATABASE_URL, and that put the claim-time guard out of reach of the
// DB-free contract-tests workflow. Same contract, asserted at its new home.
for (const required of [
  'inferQueuedArtEngine',
  'queuedArtSamplerSettings',
  'assertQueuedArtPromptContract',
]) {
  assert.ok(
    queueSettings.includes(required),
    `Missing queued-art settings contract: ${required}`,
  )
}

const imagePathOrder = queueCoverage.indexOf("'imagePath'")
const cardPathOrder = queueCoverage.indexOf("'cardPath'")
const heroPathOrder = queueCoverage.indexOf("'heroPath'")
const iconPathOrder = queueCoverage.indexOf("'iconPath'")
assert.ok(
  imagePathOrder >= 0 &&
    imagePathOrder < cardPathOrder &&
    cardPathOrder < heroPathOrder &&
    heroPathOrder < iconPathOrder,
  'Baseline coverage fallback order must be imagePath -> cardPath -> heroPath -> iconPath.',
)

for (const required of [
  'reconcileQueuedArtJobCoverage',
  'assertQueuedArtPromptContract',
  'const coverage = await reconcileQueuedArtJobCoverage',
  'payload: serializeArtJobPayload(candidate.payload)',
  'if (coverage.skipCandidate)',
  'ArtJob validation failed before claim',
]) {
  assert.ok(
    queueClaim.includes(required),
    `ArtJob claim must enforce queue coverage/quality guard: ${required}`,
  )
}

assert.ok(
  queueCoverage.includes("job.status === 'PENDING'") &&
    !queueCoverage.includes("status: 'RUNNING',\n      claimedAt: null"),
  'Coverage cleanup may cancel PENDING jobs but must never rewrite a RUNNING job to CANCELLED.',
)

for (const required of [
  'iconPath           String?',
  'cardPath           String?',
  'heroPath           String?',
]) {
  assert.ok(schema.includes(required), `Facet schema is missing ${required}`)
}

for (const required of [
  'iconPath: {',
  'cardPath: {',
  'heroPath: {',
  'width: 256',
  'width: 512',
  'width: 1280',
]) {
  assert.ok(entityArt.includes(required), `Entity art is missing ${required}`)
}

assert.ok(
  editor.includes("field: 'iconPath'") &&
    editor.includes('width: 256') &&
    editor.includes('width: 512') &&
    editor.includes('width: 1280'),
  'Facet editor must expose canonical icon, card, and hero variants.',
)
assert.ok(
  !manager.includes('useFacetArtRequestStore') &&
    !editor.includes('useFacetArtRequestStore') &&
    !gallery.includes('useFacetArtRequestStore'),
  'Facet surfaces must use the ArtJob-backed entity manager, not YAML art requests.',
)
assert.ok(
  art.includes("status: { in: ['PENDING', 'RUNNING'] }"),
  'Pending or running Facet artwork must be reused.',
)

for (const required of [
  "const LOCK_NAME = 'kind-robots:facet-catalog-maintenance'",
  'SELECT GET_LOCK(?, ?) AS acquired',
  'SELECT RELEASE_LOCK(?) AS released',
  'SELECT CONNECTION_ID() AS connectionId, IS_USED_LOCK(?) AS ownerId',
  'createFacetMaintenanceLockGuard',
  'runSerializedFacetMaintenanceSteps',
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

assert.ok(
  !runner.includes('Continuing without the lock'),
  'Facet maintenance must stop immediately when the named-lock session is lost.',
)
assert.ok(
  runner.includes('signal: abortSignal'),
  'Lock loss must abort the currently running child mutation process.',
)

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
