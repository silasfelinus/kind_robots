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
assert.match(componentsSpec, /response\.body\.data\.status\)\.to\.eq\('BROKEN'\)/)
assert.match(componentsSpec, /Keeps one explicit legacy status-write compatibility path/)
assert.equal(
  (componentsSpec.match(/\bisBroken:\s*true/g) || []).length,
  1,
  'Only the named legacy compatibility case may write isBroken directly.',
)
assert.equal(
  (componentsSpec.match(/\bisWorking:\s*(?:true|false)/g) || []).length,
  0,
  'Normal Component test clients must not write isWorking directly.',
)
assert.equal(
  (componentsSpec.match(/\bunderConstruction:\s*(?:true|false)/g) || []).length,
  0,
  'Normal Component test clients must not write underConstruction directly.',
)
assert.match(componentsSpec, /sourceKey:\s*'client-owned-source-is-not-allowed'/)

assert.match(reactionsSpec, /status:\s*'WORKING'/)
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
  assert.match(componentSnapshot, new RegExp(`'${legacyField}'`))
}
assert.match(componentSnapshot, /Temporary compatibility fields/)

for (const temporaryPath of [
  '.github/workflows/component-snapshot-fields.yml',
  '.github/scripts/apply-component-snapshot-fields.py',
]) {
  let exists = true
  try {
    await access(temporaryPath)
  } catch {
    exists = false
  }
  assert.equal(exists, false, `${temporaryPath} must be removed`)
}

console.log('Canonical Component client and fallback snapshot audit passed.')
