// /utils/scripts/verifyComponentCanonicalClients.ts
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

const [componentsSpec, reactionsSpec, snapshotSource] = await Promise.all([
  readFile('cypress/e2e/api/components.cy.ts', 'utf8'),
  readFile('cypress/e2e/api/component-reactions.cy.ts', 'utf8'),
  readFile('utils/scripts/snapshotFallback.ts', 'utf8'),
])

assert.match(componentsSpec, /status:\s*'WORKING'/)
assert.match(componentsSpec, /status:\s*'NEEDS_CONTEXT'/)
assert.match(componentsSpec, /statusReason:/)
assert.match(componentsSpec, /updatedComponent\.status\)\.to\.eq\('NEEDS_CONTEXT'\)/)
assert.match(componentsSpec, /Rejects legacy Component status fields during creation/)
assert.match(componentsSpec, /Rejects legacy Component status updates/)
assert.match(
  componentsSpec,
  /Legacy Component status fields are no longer supported/,
)
assert.match(componentsSpec, /Use \"status\" instead/)
assert.match(componentsSpec, /Unsupported Component update fields/)
assert.match(componentsSpec, /to\.not\.have\.property\('isWorking'\)/)
assert.match(
  componentsSpec,
  /to\.not\.have\.property\('underConstruction'\)/,
)
assert.match(componentsSpec, /to\.not\.have\.property\('isBroken'\)/)
assert.equal(
  (componentsSpec.match(/\bisBroken:\s*true/g) || []).length,
  2,
  'Only explicit POST and PATCH rejection cases may submit isBroken.',
)
assert.equal(
  (componentsSpec.match(/\bisWorking:\s*(?:true|false)/g) || []).length,
  0,
  'Component clients must not submit isWorking.',
)
assert.equal(
  (componentsSpec.match(/\bunderConstruction:\s*(?:true|false)/g) || []).length,
  0,
  'Component clients must not submit underConstruction.',
)
assert.match(componentsSpec, /sourceKey:\s*'client-owned-source-is-not-allowed'/)

assert.match(reactionsSpec, /status:\s*'WORKING'/)
assert.match(reactionsSpec, /to\.not\.have\.property\('isWorking'\)/)
assert.match(
  reactionsSpec,
  /to\.not\.have\.property\('underConstruction'\)/,
)
assert.match(reactionsSpec, /to\.not\.have\.property\('isBroken'\)/)
assert.doesNotMatch(
  reactionsSpec,
  /\b(?:isWorking|underConstruction|isBroken):\s*(?:true|false)/,
)

const componentSnapshot =
  snapshotSource.match(
    /key: 'components',[\s\S]*?\n\s*\),\n\s*\},\n\s*\{\n\s*key: 'smartIcons'/,
  )?.[0] || ''

for (const canonicalField of [
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
  assert.match(
    componentSnapshot,
    new RegExp(`'${canonicalField}'`),
    `Component fallback snapshot must include ${canonicalField}.`,
  )
}

for (const legacyField of ['isWorking', 'underConstruction', 'isBroken']) {
  assert.doesNotMatch(
    componentSnapshot,
    new RegExp(`'${legacyField}'`),
    `Component fallback snapshot must omit ${legacyField}.`,
  )
}
assert.doesNotMatch(componentSnapshot, /Temporary compatibility fields/)

for (const temporaryPath of [
  '.github/workflows/component-snapshot-fields.yml',
  '.github/scripts/apply-component-snapshot-fields.py',
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

console.log('Canonical-only Component client and fallback snapshot audit passed.')
