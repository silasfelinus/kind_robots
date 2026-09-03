// /utils/scripts/verifyStorybookSessionStorageRecoveryGuard.mjs
// Regression guard for Storybook session/draft restoration recovery.
// Sibling of verifyStorybookLibraryStorageRecoveryGuard.mjs (storybook/t-010,
// cycle 55): stores/storybookStore.ts's restoreFromLocalStorage() has the
// same shape of bug as storybookLibraryHelper.ts's initialize() once did — a
// failed localStorage read can mean storage access itself is forbidden, so
// cleanup in the catch block must be best-effort rather than another
// throwing storage operation.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { extractTsFunctionBody } from './lib/extractTsFunctionBody.mjs'

const STORE_PATH = 'stores/storybookStore.ts'
const storeContent = readFileSync(resolve(process.cwd(), STORE_PATH), 'utf8')
const restoreBody = extractTsFunctionBody(
  storeContent,
  'restoreFromLocalStorage',
  {
    path: STORE_PATH,
    notFoundHint:
      'If session restoration moved, move this recovery guard with it.',
  },
)

assert.match(
  restoreBody,
  /catch\s*\{[\s\S]*?try\s*\{[\s\S]*?localStorage\.removeItem\(DRAFT_STORAGE_KEY\)[\s\S]*?localStorage\.removeItem\(STORAGE_KEY\)[\s\S]*?\}\s*catch\s*\{[\s\S]*?\}/,
  `${STORE_PATH} restoreFromLocalStorage() must keep its localStorage.removeItem(DRAFT_STORAGE_KEY)/removeItem(STORAGE_KEY) cleanup inside its own try/catch when recovering from a failed read. Storage access failures can make cleanup throw too.`,
)

console.log('Storybook session storage recovery guard verified.')
