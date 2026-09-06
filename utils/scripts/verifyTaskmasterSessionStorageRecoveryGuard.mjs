// /utils/scripts/verifyTaskmasterSessionStorageRecoveryGuard.mjs
// Regression guard for Taskmaster session restoration recovery.
// A failed localStorage read can mean storage access itself is unavailable, so
// cleanup in the catch block must also be best-effort rather than another
// unguarded storage operation.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { extractTsFunctionBody } from './lib/extractTsFunctionBody.mjs'

const STORE_PATH = 'stores/taskmasterStore.ts'
const storeContent = readFileSync(resolve(process.cwd(), STORE_PATH), 'utf8')
const restoreBody = extractTsFunctionBody(
  storeContent,
  'restoreFromLocalStorage',
  {
    path: STORE_PATH,
    notFoundHint:
      'If Taskmaster session restoration moved, move this recovery guard with it.',
  },
)

assert.match(
  restoreBody,
  /catch\s*\{[\s\S]*?try\s*\{[\s\S]*?localStorage\.removeItem\(STORAGE_KEY\)[\s\S]*?\}\s*catch\s*\{[\s\S]*?\}/,
  `${STORE_PATH} restoreFromLocalStorage() must keep localStorage.removeItem(STORAGE_KEY) cleanup inside its own try/catch when recovering from a failed read. Storage access failures can make cleanup throw too.`,
)

console.log('Taskmaster session storage recovery guard verified.')
