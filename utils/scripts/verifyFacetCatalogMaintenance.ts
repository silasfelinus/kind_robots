// /utils/scripts/verifyFacetCatalogMaintenance.ts
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const cleanupPath = path.join(
  root,
  'utils/scripts/cleanupRetiredFacetShells.ts',
)
const artPath = path.join(root, 'scripts/generate_facet_art_v4.ts')
const legacyArtPath = path.join(root, 'scripts/generate_facet_art.ts')
const runnerPath = path.join(root, 'scripts/run_facet_catalog_maintenance.ts')
const publishWorkflowPath = path.join(
  root,
  '.github/workflows/publish-container.yml',
)
const schemaPath = path.join(root, 'prisma/schema.prisma')
const managerPath = path.join(root, 'components/facets/facet-manager.vue')
const editorPath = path.join(root, 'components/facets/facet-editor.vue')
const galleryPath = path.join(root, 'components/facets/facet-gallery.vue')
const entityArtPath = path.join(root, 'server/utils/entityArt.ts')
const queueCoveragePath = path.join(root, 'server/utils/artJobQueueCoverage.ts')
const queueSettingsPath = path.join(root, 'server/utils/artJobQueueSettings.ts')
const queueClaimPath = path.join(root, 'server/api/art/queue/claim.post.ts')

const cleanup = fs.readFileSync(cleanupPath, 'utf8')
const art = fs.readFileSync(artPath, 'utf8')
const legacyArt = fs.readFileSync(legacyArtPath, 'utf8')
const runner = fs.readFileSync(runnerPath, 'utf8')
const publishWorkflow = fs.readFileSync(publishWorkflowPath, 'utf8')
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
  "const FACET_ART_VERSION = 'facet-coverage-krea2-v4'",
  "'facet-multi-art-krea2-v2'",
  "'facet-coverage-krea2-v3'",
  "const ALL_VARIANTS = process.argv.includes('--all-variants')",
  "const REPAIR_TAINTED = process.argv.includes('--repair-tainted')",
  "const NEGATIVE_PROMPT = ''",
  'assertArtPromptContract',
  "engine: 'krea2'",
  'buildKrea2WorkflowFromRequest',
  "entityType: 'facet'",
  'field: variant.field',
  'requireCompletionProof: true',
  'facets: [facetSnapshot',
  'priorityFor',
  'repairPriority',
  'artPrompt: entry.identityPrompt',
  "coverageMode: ALL_VARIANTS ? 'all-variants' : 'baseline'",
  'payload: { contains: \'"entityType":"facet"\' }',
  'variant: ART_VARIANTS[0]',
  'isLegacyGeneratedFacetPrompt',
  'legacyPendingIds',
  "status: 'CANCELLED'",
  "reason: 'facet-krea-context-prompt-repair-v4'",
  "repairReason: 'krea-context-prompt-text'",
  "mode: 'NEW_OUTPUT'",
]) {
  assert.ok(art.includes(required), `Missing Facet art contract: ${required}`)
}

assert.ok(
  legacyArt.includes("from './generate_facet_art_v4'") &&
    legacyArt.includes("export * from './generate_facet_art_v4'") &&
    legacyArt.includes('main().catch'),
  'The stable generate_facet_art.ts entrypoint must delegate to the audited v4 producer.',
)

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
  'Reuse ANY active Facet ArtJob during ordinary coverage',
]) {
  assert.ok(
    art.includes(required),
    `Missing coverage-first producer contract: ${required}`,
  )
}

for (const forbidden of [
  'portrait card artwork',
  'room for card chrome',
  'icon logo artwork',
  '`Illustrate the Facet concept “${facet.title}”.`',
  'for Kind Robots ${label}',
  'Scientific identity: ${scientificName}',
  'Catalog category: ${category}',
]) {
  assert.ok(
    !art.includes(forbidden),
    `Facet prompt vocabulary must not contain legacy contextual/format language: ${forbidden}`,
  )
}

for (const required of [
  'Krea 2 is intentionally treated as a caption-conditioned image model here',
  '`${facet.title}.`',
  'taxonomyVisualLanguage',
  'Polished fantasy illustration.',
  'Clean unmarked surfaces.',
]) {
  assert.ok(
    art.includes(required),
    `Facet v4 must preserve semantic image-only prompting: ${required}`,
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

// This required iconPath/cardPath/heroPath on Facet. The slot collapse dropped
// them, and the old check would have kept passing anyway -- it searched the
// whole schema text, and Project still carries all three. Assert their absence
// from the Facet model specifically, which is what it was always trying to say.
const facetModel = schema.match(/^model Facet \{([\s\S]*?)^\}/m)?.[1] ?? ''
assert.ok(facetModel, 'prisma/schema.prisma: model Facet not found')
for (const retired of ['iconPath', 'cardPath', 'heroPath']) {
  assert.ok(
    !new RegExp(`^\\s*${retired}\\s+String`, 'm').test(facetModel),
    `Facet re-added ${retired}. The secondary art slots were dropped in the ` +
      'slot collapse; supplemental art belongs in EntityArtImage.',
  )
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

// Was "must expose canonical icon, card, and hero variants" (256/512/1280).
// Those slots are rejected at enqueue now, so the editor offers the primary
// alone; entityArt.ts still declares the retired configs above because
// completion and history reads share them.
assert.ok(
  editor.includes("field: 'imagePath'") && editor.includes('width: 1024'),
  'Facet editor must expose the primary art slot.',
)
for (const retired of ["field: 'iconPath'", "field: 'cardPath'", "field: 'heroPath'"]) {
  assert.ok(
    !editor.includes(retired),
    `Facet editor still offers ${retired}, which the enqueue gate rejects.`,
  )
}
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
  "const artOnly = process.argv.includes('--art-only')",
  "const repairTainted = process.argv.includes('--repair-tainted')",
  "args: ['--write', ...(repairTainted ? ['--repair-tainted'] : [])]",
  'const steps: Step[] = artOnly ? [artStep] : fullMaintenanceSteps',
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
const fullMaintenanceStart = runner.indexOf('const fullMaintenanceSteps')
const artStepReference = runner.indexOf('\n  artStep,\n', fullMaintenanceStart)

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
  artStepReference >= 0 && runner.indexOf(auditHook) < artStepReference,
  'The whole-catalog audit must run before Facet artwork is queued in full maintenance mode.',
)

assert.ok(
  !publishWorkflow.includes('run_facet_catalog_maintenance'),
  'Production image publication must not run long-lived Facet catalog mutations.',
)
assert.ok(
  !publishWorkflow.includes('runFacetCatalogSeed'),
  'Production image publication must not bypass the explicit Facet maintenance runner.',
)
assert.ok(
  !publishWorkflow.includes('generate_facet_art'),
  'Production image publication must not queue Facet artwork.',
)
assert.ok(
  fs.existsSync(
    path.join(root, '.github/workflows/facet-catalog-maintenance.yml'),
  ),
  'An out-of-band Facet catalog maintenance workflow must exist because production image publication does not own maintenance.',
)

console.log(
  'Facet catalog maintenance, semantic Krea prompting, and repair queue contract verified.',
)
