// /utils/scripts/verifyStorybookLibraryStorageRecoveryGuard.mjs
// Regression guard for Storybook library initialization recovery.
// A failed localStorage read can mean storage access itself is forbidden, so
// cleanup in the catch block must be best-effort rather than another throwing
// storage operation.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { extractTsFunctionBody } from './lib/extractTsFunctionBody.mjs'

const HELPER_PATH = 'stores/helpers/storybookLibraryHelper.ts'
const helperContent = readFileSync(resolve(process.cwd(), HELPER_PATH), 'utf8')
const initializeBody = extractTsFunctionBody(helperContent, 'initialize', {
  path: HELPER_PATH,
  notFoundHint: 'If library initialization moved, move this recovery guard with it.',
})

assert.match(
  initializeBody,
  /catch\s*\{[\s\S]*?try\s*\{[\s\S]*?localStorage\.removeItem\(LIBRARY_STORAGE_KEY\)[\s\S]*?\}\s*catch\s*\{[\s\S]*?\}/,
  `${HELPER_PATH} initialize() must keep localStorage.removeItem(LIBRARY_STORAGE_KEY) inside its own try/catch when recovering from a failed read. Storage access failures can make cleanup throw too.`,
)

console.log('Storybook library storage recovery guard verified.')
