// /utils/scripts/verifyComponentCanonicalRuntime.ts
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

const schema = await readFile('prisma/schema.prisma', 'utf8')
const createRoute = await readFile('server/api/components/index.post.ts', 'utf8')
const patchRoute = await readFile('server/api/components/[id].patch.ts', 'utf8')
const reconcileRoute = await readFile(
  'server/api/components/reconcile.post.ts',
  'utf8',
)
const reconcileUtility = await readFile(
  'server/utils/wonderlabComponentReconcile.ts',
  'utf8',
)
const statusUtility = await readFile(
  'utils/wonderlab/componentStatus.ts',
  'utf8',
)
const componentHelper = await readFile(
  'stores/helpers/componentHelper.ts',
  'utf8',
)
const labUi = await readFile('components/wonderlab/lab-interact.vue', 'utf8')
const cardUi = await readFile('components/wonderlab/component-card.vue', 'utf8')
const syncUi = await readFile(
  'components/wonderlab/component-sync.vue',
  'utf8',
)
const museumQuery = await readFile('utils/wonderlab/museumQuery.ts', 'utf8')

const componentBlock =
  schema.match(/model Component \{[\s\S]*?\n\}/)?.[0] || ''
assert.ok(componentBlock, 'Prisma Component model must exist.')

const statuses = [
  'UNREVIEWED',
  'WORKING',
  'NEEDS_CONTEXT',
  'UNDER_CONSTRUCTION',
  'BROKEN',
  'RETIRED',
  'PREVIEW_UNSUPPORTED',
]

for (const status of statuses) {
  assert.match(schema, new RegExp(status))
  assert.match(labUi, new RegExp(status))
  assert.match(cardUi, new RegExp(status))
}

for (const field of [
  'slug',
  'sourcePath',
  'sourceKey',
  'sourceHash',
  'status',
  'statusReason',
  'description',
  'category',
  'tags',
  'previewMode',
  'previewConfig',
  'lastSeenAt',
  'isDiscovered',
]) {
  assert.match(componentBlock, new RegExp(`^\\s*${field}\\s+`, 'm'))
}

for (const legacyField of [
  'isWorking',
  'underConstruction',
  'isBroken',
]) {
  assert.doesNotMatch(
    componentBlock,
    new RegExp(`^\\s*${legacyField}\\s+`, 'm'),
    `${legacyField} must be absent from the canonical Component model.`,
  )
}

assert.match(createRoute, /status:\s*createStatus/)
assert.match(createRoute, /requestedStatus\(componentData\.status\)/)
assert.match(createRoute, /Legacy Component status fields are no longer supported/)
assert.match(createRoute, /Use \"status\" instead/)
assert.doesNotMatch(
  createRoute.match(/const commonData = \{[\s\S]*?\n\s*\}/)?.[0] || '',
  /isWorking|underConstruction|isBroken/,
)
assert.doesNotMatch(
  createRoute.match(/const createData:[\s\S]*?\n\s*\}/)?.[0] || '',
  /isWorking|underConstruction|isBroken/,
)
assert.match(createRoute, /Invalid canonical Component status/)

const allowedPatchFields =
  patchRoute.match(/const allowedPatchFields = new Set\(\[[\s\S]*?\]\)/)?.[0] || ''
assert.match(patchRoute, /status:\s*canonicalStatus/)
assert.match(patchRoute, /statusReason/)
assert.match(patchRoute, /description/)
assert.match(patchRoute, /previewMode/)
for (const protectedField of [
  'sourceKey',
  'sourcePath',
  'sourceHash',
  'slug',
  'isWorking',
  'underConstruction',
  'isBroken',
]) {
  assert.doesNotMatch(
    allowedPatchFields,
    new RegExp(`['\"]${protectedField}['\"]`),
    `${protectedField} must not be accepted by Component PATCH.`,
  )
}
assert.doesNotMatch(
  patchRoute.match(/const updateData:[\s\S]*?\n\s*\}/)?.[0] || '',
  /isWorking|underConstruction|isBroken/,
)

for (const canonicalField of [
  'slug',
  'sourcePath',
  'sourceKey',
  'sourceHash',
  'lastSeenAt',
  'isDiscovered',
]) {
  assert.match(reconcileRoute, new RegExp(`${canonicalField}:`))
  assert.match(reconcileUtility, new RegExp(canonicalField))
}

assert.match(
  reconcileUtility,
  /exactSourceKey \?\? exactSourcePath \?\? uniqueHashMatch/,
)
assert.match(reconcileUtility, /changes: \{ isDiscovered: false \}/)
assert.match(reconcileRoute, /status:\s*'UNREVIEWED'/)
assert.doesNotMatch(reconcileRoute, /isWorking|underConstruction|isBroken/)
assert.doesNotMatch(reconcileRoute, /\bdelete(?:Many)?\s*\(/i)
assert.doesNotMatch(reconcileUtility, /\bdelete(?:Many)?\s*\(/i)

assert.doesNotMatch(
  statusUtility,
  /getLegacyComponentStatus|legacyFieldsForComponentStatus|resolveLegacyStatusUpdate|hasLegacyStatusUpdate/,
)
assert.match(statusUtility, /return isComponentStatus\(component\.status\)/)
assert.match(statusUtility, /'UNREVIEWED'/)

const helperPayload =
  componentHelper.match(/body: JSON\.stringify\(\{[\s\S]*?\}\),/)?.[0] || ''
assert.match(helperPayload, /status:\s*component\.status/)
assert.match(helperPayload, /statusReason:\s*component\.statusReason/)
assert.match(helperPayload, /description:\s*component\.description/)
assert.doesNotMatch(helperPayload, /isWorking|underConstruction|isBroken/)

assert.match(labUi, /getComponentStatus/)
assert.match(labUi, /selectedComponent\.value\.status = status/)
assert.match(labUi, /component\.description/)
assert.match(labUi, /component\.sourcePath/)
assert.match(cardUi, /getComponentStatus/)
assert.match(museumQuery, /componentStatuses/)
assert.match(syncUi, /Record<string, ReconcileValue>/)
assert.match(syncUi, /never deletes records or\s+reactions/i)

for (const temporaryPath of [
  '.github/workflows/component-schema-adopt.yml',
  '.github/scripts/apply-component-schema-adoption.py',
  '.github/workflows/component-status-ui-adopt.yml',
  '.github/scripts/apply-component-status-ui.py',
  '.github/workflows/prisma-component-contract-once.yml',
]) {
  let exists = true
  try {
    await access(temporaryPath)
  } catch {
    exists = false
  }
  assert.equal(exists, false, `${temporaryPath} must be removed`)
}

console.log('Canonical-only Component runtime adoption contract passed.')
