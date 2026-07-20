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

const boundary = read('server/api/themes/mutation.ts')
const createRoute = read('server/api/themes/index.post.ts')
const patchRoute = read('server/api/themes/[id].patch.ts')
const batchRoute = read('server/api/themes/batch.post.ts')
const store = read('stores/themeStore.ts')
const cypressSpec = read('cypress/e2e/api/theme-input-boundary.cy.ts')

// Boundary exports the caps, allowlists, and the shared assertion.
requireText(boundary, 'export const THEME_VALUES_LIMIT', 'Theme values cap')
requireText(boundary, 'export const THEME_BATCH_LIMIT', 'Theme batch cap')
requireText(boundary, 'export const themeCreateFields', 'Theme create allowlist')
requireText(boundary, 'export const themePatchFields', 'Theme patch allowlist')
requireText(
  boundary,
  'export const themeBatchCreateFields',
  'Theme batch allowlist',
)
requireText(
  boundary,
  'export function assertThemeMutationInput',
  'Theme mutation boundary',
)
requireText(boundary, 'Unsupported Theme fields in', 'Theme unknown-field error')
requireText(
  boundary,
  'Ownership is server-owned',
  'Theme spoofed-ownership error',
)
requireText(
  boundary,
  'Theme ID is immutable and must match the route.',
  'Theme immutable-id error',
)
requireText(
  boundary,
  'serialized characters',
  'Theme values size-limit error',
)

// Batch imports stay strict: no identity or compatibility fields.
requireText(
  boundary,
  'new Set<string>(persistedMutationFields)',
  'Theme strict batch allowlist',
)

// Routes wire the boundary with the correct allowlist before persisting.
requireText(
  createRoute,
  'allowedFields: themeCreateFields',
  'Theme create route wiring',
)
requireText(
  patchRoute,
  'allowedFields: themePatchFields',
  'Theme patch route wiring',
)
requireText(patchRoute, 'routeId: id', 'Theme patch route immutable-id wiring')
requireText(patchRoute, "'artPrompt'", 'Theme patch artPrompt parity')
requireText(
  batchRoute,
  'allowedFields: themeBatchCreateFields',
  'Theme batch route wiring',
)
requireText(
  batchRoute,
  'THEME_BATCH_LIMIT',
  'Theme batch route size cap',
)

// The store no longer sends identity/system fields or falls back to a user id.
forbidText(store, 'id: (src as Partial<Theme>).id', 'Theme store id leak')
forbidText(store, 'userId ??', 'Theme store userId leak')
forbidText(store, '|| 10', 'Theme store fallback user')

// Deployed regression it() blocks are pinned to the contract.
requireText(
  cypressSpec,
  'rejects unknown and spoofed fields on singular Theme creation',
  'Theme create deployed regression',
)
requireText(
  cypressSpec,
  'enforces the serialized values size limit on Theme creation',
  'Theme values-limit deployed regression',
)
requireText(
  cypressSpec,
  'rejects unknown, mismatched ID, and spoofed owner fields on Theme PATCH',
  'Theme patch deployed regression',
)
requireText(
  cypressSpec,
  'applies the same strict boundary to Theme batches',
  'Theme batch deployed regression',
)

console.log('Theme mutation input parity contract passed.')
