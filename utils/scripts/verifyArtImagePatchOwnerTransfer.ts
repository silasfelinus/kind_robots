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

const patchRoute = read('server/api/art/image/[id].patch.ts')
const cypressSpec = read('cypress/e2e/api/art-image-create-contract.cy.ts')

// Owner transfer is confined to a dedicated endpoint: `userId` must not be a
// member of the general patch allowlist, and the old admin-only userId
// passthrough branch must be gone.
forbidText(
  patchRoute,
  "  'userId',\n  'imageData'",
  'ArtImage patch allowlist still contains userId',
)
forbidText(
  patchRoute,
  "key === 'userId'",
  'ArtImage patch userId reassignment branch',
)

// Ownership is still enforced before any write.
requireText(
  patchRoute,
  '!user.isAdmin && existing.userId !== user.id',
  'ArtImage patch ownership guard',
)

// Deployed regression pins the behavior.
requireText(
  cypressSpec,
  'ignores userId owner-transfer on ArtImage PATCH',
  'ArtImage patch owner-transfer deployed regression',
)

// Relation attach gate (audit F-2 residual): connected Server / checkpoint
// Resource must exist and be public-or-owned-or-admin.
const relations = read('server/api/art/image/relations.ts')
requireText(
  relations,
  'export async function assertArtImageRelationsAttachable',
  'ArtImage relation attach gate',
)
requireText(
  relations,
  'row.userId !== userId && row.isPublic !== true',
  'ArtImage relation permission predicate',
)
requireText(
  patchRoute,
  'assertArtImageRelationsAttachable(',
  'ArtImage patch relation gate wiring',
)
requireText(
  cypressSpec,
  'rejects a missing Server relation on ArtImage PATCH',
  'ArtImage relation gate deployed regression',
)

console.log('ArtImage patch owner-transfer contract passed.')
