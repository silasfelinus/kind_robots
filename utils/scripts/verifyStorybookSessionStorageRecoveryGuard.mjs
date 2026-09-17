// /utils/scripts/verifyStorybookSessionStorageRecoveryGuard.mjs
// Regression guard for the new server-backed Storybook run resume pointer.
// The old beat-loop store persisted whole sessions and drafts in localStorage;
// storybookRunStore keeps only the active run id. Storage may still be blocked
// (private browsing, browser policy), so both reads and writes must fail soft.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { extractTsFunctionBody } from './lib/extractTsFunctionBody.mjs'

const STORE_PATH = 'stores/storybookRunStore.ts'
const storeContent = readFileSync(resolve(process.cwd(), STORE_PATH), 'utf8')

const readBody = extractTsFunctionBody(storeContent, 'readStoredRunId', {
  path: STORE_PATH,
  notFoundHint: 'If active-run restoration moved, move this recovery guard with it.',
})
const writeBody = extractTsFunctionBody(storeContent, 'writeStoredRunId', {
  path: STORE_PATH,
  notFoundHint: 'If active-run persistence moved, move this recovery guard with it.',
})

assert.match(
  readBody,
  /if\s*\(typeof localStorage === ['"]undefined['"]\) return null/,
  `${STORE_PATH} readStoredRunId() must remain SSR-safe before touching localStorage.`,
)
assert.match(
  readBody,
  /try\s*\{[\s\S]*?localStorage\.getItem\(ACTIVE_RUN_STORAGE_KEY\)[\s\S]*?\}\s*catch\s*\{[\s\S]*?return null[\s\S]*?\}/,
  `${STORE_PATH} readStoredRunId() must fail soft when browser storage cannot be read.`,
)
assert.match(
  writeBody,
  /if\s*\(typeof localStorage === ['"]undefined['"]\) return/,
  `${STORE_PATH} writeStoredRunId() must remain SSR-safe before touching localStorage.`,
)
assert.match(
  writeBody,
  /try\s*\{[\s\S]*?localStorage\.setItem\(ACTIVE_RUN_STORAGE_KEY[\s\S]*?localStorage\.removeItem\(ACTIVE_RUN_STORAGE_KEY\)[\s\S]*?\}\s*catch\s*\{[\s\S]*?\}/,
  `${STORE_PATH} writeStoredRunId() must fail soft when browser storage cannot be written.`,
)

console.log('Storybook active-run storage recovery guard verified.')
