import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

function read(path: string): string {
  return readFileSync(resolve(root, path), 'utf8')
}

function requireText(source: string, text: string, label: string): void {
  if (!source.includes(text)) {
    throw new Error(`${label}: expected to find ${JSON.stringify(text)}`)
  }
}

function forbidText(source: string, text: string, label: string): void {
  if (source.includes(text)) {
    throw new Error(`${label}: forbidden text found ${JSON.stringify(text)}`)
  }
}

const boundary = read('server/api/dreams/mutation.ts')
const createRoute = read('server/api/dreams/index.post.ts')
const patchRoute = read('server/api/dreams/[id].patch.ts')
const batchRoute = read('server/api/dreams/batch.post.ts')
const cypressSpec = read('cypress/e2e/api/dream-input-boundary.cy.ts')

requireText(
  boundary,
  'export const DREAM_RELATION_ID_LIMIT = 100',
  'Dream relation bound',
)
requireText(
  boundary,
  "const compatibilityFields = ['userId', 'tagIds', 'promptIds']",
  'Dream compatibility stage',
)
requireText(
  boundary,
  'export const dreamBatchCreateFields',
  'Dream batch strict field set',
)
requireText(
  boundary,
  'assertDreamMutationInput(',
  'Dream shared input boundary',
)
requireText(
  boundary,
  'Unsupported Dream ownership assignment. Ownership is server-owned.',
  'Dream ownership-match boundary',
)
requireText(
  boundary,
  'Dream ID is immutable and must match the route.',
  'Dream route ID boundary',
)
requireText(
  boundary,
  'may contain at most ${DREAM_RELATION_ID_LIMIT} entries',
  'Dream relation array cap',
)
requireText(
  boundary,
  'contains an invalid ID at index ${index}',
  'Dream invalid relation rejection',
)

requireText(
  createRoute,
  'allowedFields: dreamCreateFields',
  'Dream singular create boundary',
)
requireText(
  createRoute,
  'normalizeBoundedDreamIdArray(',
  'Dream singular relation normalization',
)
requireText(
  patchRoute,
  'allowedFields: dreamPatchFields',
  'Dream patch boundary',
)
requireText(
  patchRoute,
  'routeId: id',
  'Dream patch immutable ID check',
)
requireText(
  patchRoute,
  'No valid Dream update fields provided.',
  'Dream patch compatibility-only rejection',
)
requireText(
  batchRoute,
  'const DREAM_BATCH_LIMIT = 100',
  'Dream batch cap',
)
requireText(
  batchRoute,
  'allowedFields: dreamBatchCreateFields',
  'Dream batch item boundary',
)
forbidText(
  batchRoute,
  'const dreamBatchCreateFields = new Set([',
  'Dream duplicate batch allowlist',
)

requireText(
  cypressSpec,
  'rejects unknown and spoofed fields on singular Dream creation',
  'Dream singular deployed regression',
)
requireText(
  cypressSpec,
  'rejects unknown, mismatched ID, and oversized relation fields on PATCH',
  'Dream patch deployed regression',
)
requireText(
  cypressSpec,
  'applies the same strict boundary to Dream batches',
  'Dream batch deployed regression',
)
requireText(
  cypressSpec,
  'keeps the current matching-owner store compatibility fields explicit',
  'Dream compatibility deployed regression',
)

console.log('Dream mutation input parity contract passed.')
