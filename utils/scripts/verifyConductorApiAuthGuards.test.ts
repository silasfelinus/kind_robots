// /utils/scripts/verifyConductorApiAuthGuards.test.ts
//
// Self-test for verifyConductorApiAuthGuards.ts (conductor-app/t-011).
// Exercises the real exported detection functions against fixture files in
// a temp directory -- not a reimplementation of the scan logic -- covering
// the two legitimate guard shapes (requireAdminApiUser and the manual
// validateApiKey + userIsAdmin pattern) plus an unguarded file and a
// read-only (.get.ts) file that must be ignored entirely.
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  fileHasRecognizedAuthGuard,
  findUnguardedConductorWriteEndpoints,
  listConductorWriteEndpoints,
} from './verifyConductorApiAuthGuards.js'

let failures = 0

function check(label: string, fn: () => void): void {
  try {
    fn()
    console.log(`ok - ${label}`)
  } catch (error) {
    failures += 1
    console.error(`FAIL - ${label}`)
    console.error(error instanceof Error ? error.message : error)
  }
}

check('fileHasRecognizedAuthGuard accepts requireAdminApiUser', () => {
  assert.equal(
    fileHasRecognizedAuthGuard(
      'await requireAdminApiUser(event)\nexport default defineEventHandler(async (event) => {})',
    ),
    true,
  )
})

check('fileHasRecognizedAuthGuard accepts requireApiUser', () => {
  assert.equal(
    fileHasRecognizedAuthGuard('const auth = await requireApiUser(event)'),
    true,
  )
})

check('fileHasRecognizedAuthGuard accepts validateApiKey + userIsAdmin', () => {
  assert.equal(
    fileHasRecognizedAuthGuard(
      'const { isValid, user } = await validateApiKey(event)\nif (!userIsAdmin(user)) throw createError({ statusCode: 403 })',
    ),
    true,
  )
})

check(
  'fileHasRecognizedAuthGuard rejects validateApiKey alone with no admin check',
  () => {
    assert.equal(
      fileHasRecognizedAuthGuard(
        'const { isValid } = await validateApiKey(event)',
      ),
      false,
    )
  },
)

check(
  'fileHasRecognizedAuthGuard rejects a file with no guard call at all',
  () => {
    assert.equal(
      fileHasRecognizedAuthGuard(
        'export default defineEventHandler(async (event) => { return { ok: true } })',
      ),
      false,
    )
  },
)

const fixtureDir = mkdtempSync(join(tmpdir(), 'conductor-api-auth-guard-test-'))

try {
  writeFileSync(
    join(fixtureDir, 'guarded.post.ts'),
    'export default defineEventHandler(async (event) => { await requireAdminApiUser(event) })',
  )
  writeFileSync(
    join(fixtureDir, 'manual-guard.post.ts'),
    'export default defineEventHandler(async (event) => {\n  const { user } = await validateApiKey(event)\n  if (!userIsAdmin(user)) throw createError({ statusCode: 403 })\n})',
  )
  writeFileSync(
    join(fixtureDir, 'unguarded.post.ts'),
    'export default defineEventHandler(async (event) => { return { ok: true } })',
  )
  writeFileSync(
    join(fixtureDir, 'unguarded-write.put.ts'),
    'export default defineEventHandler(async (event) => { return { ok: true } })',
  )
  // Read-only endpoints are out of scope for this contract and must be
  // ignored even though this one has no guard.
  writeFileSync(
    join(fixtureDir, 'readonly.get.ts'),
    'export default defineEventHandler(async () => ({ ok: true }))',
  )

  check('listConductorWriteEndpoints finds only write-method files', () => {
    const files = listConductorWriteEndpoints(fixtureDir).map((f) =>
      f.slice(fixtureDir.length + 1),
    )
    assert.deepEqual(files.sort(), [
      'guarded.post.ts',
      'manual-guard.post.ts',
      'unguarded-write.put.ts',
      'unguarded.post.ts',
    ])
  })

  check(
    'findUnguardedConductorWriteEndpoints flags exactly the two unguarded write files',
    () => {
      const unguarded = findUnguardedConductorWriteEndpoints(fixtureDir).map(
        (f) => f.split('/').pop(),
      )
      assert.deepEqual(unguarded.sort(), [
        'unguarded-write.put.ts',
        'unguarded.post.ts',
      ])
    },
  )

  check(
    'listConductorWriteEndpoints on a missing directory returns empty, not a throw',
    () => {
      assert.deepEqual(
        listConductorWriteEndpoints(join(fixtureDir, 'does-not-exist')),
        [],
      )
    },
  )
} finally {
  rmSync(fixtureDir, { recursive: true, force: true })
}

if (failures > 0) {
  console.error(`\n${failures} failure(s).`)
  process.exitCode = 1
} else {
  console.log('\nAll conductor API auth-guard self-tests passed.')
}
