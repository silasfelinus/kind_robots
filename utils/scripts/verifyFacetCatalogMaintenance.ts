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
const facetVisualPath = path.join(root, 'utils/facetVisualLanguage.ts')
const framingPath = path.join(root, 'utils/entityArtPromptFraming.ts')
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
const facetVisual = fs.readFileSync(facetVisualPath, 'utf8')
const framing = fs.readFileSync(framingPath, 'utf8')
/*
 * The producer script and the module its vocabulary now lives in. The clause
 * bans below are checked against BOTH, so moving a clause between them can
 * never quietly un-ban it -- which is the class of failure this whole file
 * exists to catch.
 */
const facetPromptSources = `${art}\n${facetVisual}`
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
  "const FACET_ART_VERSION = 'facet-coverage-krea2-v6'",
  // Each superseded version stays in the legacy set, or its cohort is never
  // picked up again: v4 is the concrete busts, v5 the headless torsos.
  "'facet-coverage-krea2-v4',",
  "'facet-coverage-krea2-v5',",
  'v4RenderNeedsRepair',
  'v5RenderNeedsRepair',
  'isRepairableLegacyJob',
  // A Facet keeps every job it has ever had, so an old version's job stays a
  // repair target even after a newer version already fixed that slot. On the
  // v6 run that queued 45 duplicate swatch jobs. Ranking versions and skipping
  // any slot already attempted more recently closes it for every future bump.
  // An argv flag that is silently ignored has cost two full queue cycles:
  // --requeue-curated on an older build ran as a plain --write, and --facets on
  // an older build queued all 146. Both printed numbers that looked like
  // success. Unknown flags must refuse, not shrug.
  'const KNOWN_FLAGS',
  'Unrecognized option(s)',
  'process.exit(2)',
  'facetFilterUnmatched',
  'const VERSION_ORDER',
  'newestAttemptRank',
  'repairSkippedNewerAttempt',
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
  // The default retry reason; requeue paths pass their own. What matters is
  // that retry provenance is attached at all -- without it artJobQueueCoverage
  // cancels a replacement before claim, which silently killed all 146 authored
  // prompts on 2026-09-15.
  "reason = 'facet-art-direction-jargon-repair-v5'",
  'retry: repairRetry(repair.sourceJobId, repair.reason)',
  "repairReason: 'art-direction-jargon-rendered-literally'",
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

// The v4 taxonomy and composition clauses. Krea painted them literally --
// "concrete focal subject" as a concrete bust, "unmistakable silhouette" as a
// paper cut-out -- for every Facet with no prose of its own (2026-09-14).
//
// Each is anchored to the point where the producer RETURNS or ASSIGNS it, not
// to the clause text alone: the same sentences still appear in the file's
// comments and, necessarily, in LEGACY_V4_TAXONOMY_TAILS, which is how the
// repair recognizes a stored v4 prompt. Matching bare text would forbid the
// repair from knowing what it repairs.
for (const forbidden of [
  "return 'Iconic scene, concrete focal subject",
  "return 'Single distinctive figure in action",
  "return 'Premium collectible object or emblem",
  "return 'Single clear subject or emblem",
  "composition:\n      'One decisive square composition",
  "'A vertical 2:3 composition with clear foreground",
  "'A cinematic 16:9 composition with the focal subject",
  "'A bold square emblem with a clean silhouette",
  'Crisp subject separation.',
  // v5's occupation clause: "at full height" cropped the head off all 50 of its
  // cards, and "tools of the trade" put generic hammers in every one.
  "return 'A person at full height in the middle of this work",
  "return 'A person at full height doing something only someone like this",
  'room for card chrome',
  'icon logo artwork',
  '`Illustrate the Facet concept “${facet.title}”.`',
  'for Kind Robots ${label}',
  'Scientific identity: ${scientificName}',
  'Catalog category: ${category}',
]) {
  assert.ok(
    !facetPromptSources.includes(forbidden),
    `Facet prompt vocabulary must not contain legacy contextual/format language: ${forbidden}`,
  )
}

for (const required of [
  'Krea 2 is intentionally treated as a caption-conditioned image model here',
  'taxonomyVisualLanguage',
  'Polished fantasy illustration.',
  'Clean unmarked surfaces.',
]) {
  assert.ok(
    art.includes(required),
    `Facet v5 must preserve semantic image-only prompting: ${required}`,
  )
}

for (const required of [
  '`${clean(input.title)}.`',
  'taxonomyVisualLanguage(input.taxonomy)',
  // Card copy is what Krea paints when the prose names nothing visible.
  'readsAsCardCopy',
  'depictableProse',
]) {
  assert.ok(
    facetVisual.includes(required),
    `utils/facetVisualLanguage.ts must preserve semantic image-only prompting: ${required}`,
  )
}

/*
 * The server path (2026-09-21).
 *
 * server/utils/entityArt.ts queues Facet art too, and until this date it could
 * not import a line of the vocabulary above -- it took Facet.artPrompt
 * verbatim, so six versions of producer fixes never reached it and Facets
 * carrying a v4 tail went on rendering v4 art. ArtJobs 29108/29109/29111 are
 * what that looked like: a caption painted across the top of each one.
 *
 * These assertions are the standing guard that the two paths stay joined. A
 * prompt built by the server must go through the same rebuild, drop the
 * superseded prompt it replaced, and carry a medium.
 */
for (const required of [
  'buildFacetIdentityPromptFrom',
  'isLegacyGeneratedFacetPrompt',
  'artStyleTail',
  'supersededArtPrompt',
  'db.facetProfile.findUnique',
]) {
  assert.ok(
    entityArt.includes(required),
    `server/utils/entityArt.ts must build Facet art from the shared vocabulary: ${required}`,
  )
}

for (const required of ['HOUSE_STYLE_TAIL', 'PROMPT_ENHANCEMENT']) {
  assert.ok(
    framing.includes(required),
    `utils/entityArtPromptFraming.ts must carry the house style tail: ${required}`,
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

// Was "must expose canonical icon, card, and hero variants" (256/512/1280),
// then a literal imagePath/1024 slot. Those retired slots are rejected at
// enqueue now, and the editor names no slot at all: its roster comes from the
// entity art endpoint via listEntityArtSlots, which reads the same table the
// enqueue gate reads. entityArt.ts still declares the retired configs above
// because completion and history reads share them.
assert.ok(
  editor.includes('entity-type="facet"') && editor.includes(':entity="facet"'),
  'Facet editor must mount the entity art manager for the Facet.',
)
assert.ok(
  !editor.includes(':slots="['),
  'Facet editor hardcodes an art slot array again; the roster must come from ' +
    'the endpoint so a retired slot cannot outlive the enqueue gate.',
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
