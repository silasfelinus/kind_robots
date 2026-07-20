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

const boundary = read('server/api/characters/mutation.ts')
const compatibility = read('server/api/characters/compatibility.ts')
const createRoute = read('server/api/characters/index.post.ts')
const patchRoute = read('server/api/characters/[id].patch.ts')
const batchRoute = read('server/api/characters/batch.post.ts')
const cypressSpec = read('cypress/e2e/api/character-input-boundary.cy.ts')
const permissionSpec = read(
  'cypress/e2e/api/character-relation-permission.cy.ts',
)

requireText(
  boundary,
  'export const CHARACTER_RELATION_ID_LIMIT = 100',
  'Character relation cap',
)
requireText(
  boundary,
  'export const CHARACTER_BATCH_LIMIT = 100',
  'Character batch cap',
)
requireText(
  boundary,
  'const rarityValues = Object.values(Rarity)',
  'Character generated rarity validation',
)
requireText(
  boundary,
  'legacy number from 1 through 6',
  'Character numeric rarity compatibility',
)
requireText(
  boundary,
  'contains an invalid ID at index ${index}',
  'Character invalid relation rejection',
)
requireText(
  boundary,
  'await assertCharacterRelationsExist({',
  'Character relation existence checks',
)
requireText(
  boundary,
  'buildCharacterUpdateInput(',
  'Character shared update builder',
)
requireText(
  boundary,
  'User: { connect: { id: options.userId } }',
  'Character authenticated create ownership',
)

requireText(
  compatibility,
  'Character create payload cannot assign a persisted ID.',
  'Character create ID boundary',
)
requireText(
  compatibility,
  'Unsupported Character ownership reassignment. Ownership is server-owned.',
  'Character patch ownership boundary',
)
requireText(
  compatibility,
  'stripCharacterCompatibilityFields(',
  'Character compatibility stripping',
)

requireText(
  createRoute,
  'allowedFields: characterSingularCreateFields',
  'Character singular create field boundary',
)
requireText(
  createRoute,
  'stripCharacterCompatibilityFields(rawBody)',
  'Character create compatibility isolation',
)
requireText(
  patchRoute,
  'allowedFields: characterSingularPatchFields',
  'Character singular patch field boundary',
)
requireText(
  patchRoute,
  'assertCharacterPatchCompatibility(rawBody, id, existingCharacter.userId)',
  'Character patch identity validation',
)
requireText(
  batchRoute,
  'characters.length > CHARACTER_BATCH_LIMIT',
  'Character batch cap',
)
requireText(
  batchRoute,
  'select: characterMutationSelect',
  'Character lean batch projection',
)
forbidText(
  batchRoute,
  'include: {',
  'Character heavy batch mutation response',
)
forbidText(
  batchRoute,
  'function normalizeRarity',
  'Character duplicate batch rarity normalizer',
)

requireText(
  cypressSpec,
  'rejects unknown and malformed Character create fields',
  'Character create deployed regression',
)
requireText(
  cypressSpec,
  'ignores legacy create ownership metadata and persists authentication',
  'Character create ownership compatibility regression',
)
requireText(
  cypressSpec,
  'rejects Character ownership and route identity changes on PATCH',
  'Character patch deployed regression',
)
requireText(
  cypressSpec,
  'keeps Character batch imports strict, bounded, and lean',
  'Character batch deployed regression',
)

// Phase 2: relation-connect targets must be public or owned by the caller (admins
// bypass). The gate is wired into create, PATCH, and batch routes.
requireText(
  boundary,
  'export async function assertCharacterRelationsAttachable',
  'Character relation permission gate',
)
requireText(
  boundary,
  'NOT: { OR: [{ userId }, { isPublic: true }] }',
  'Character relation permission clause',
)
requireText(
  createRoute,
  'assertCharacterRelationsAttachable(',
  'Character create relation permission wiring',
)
requireText(
  patchRoute,
  'assertCharacterRelationsAttachable(body, user.id, isAdmin)',
  'Character patch relation permission wiring',
)
requireText(
  batchRoute,
  'assertCharacterRelationsAttachable(',
  'Character batch relation permission wiring',
)
requireText(
  permissionSpec,
  'forbids attaching another user private Reward on Character creation',
  'Character relation permission deployed regression',
)

console.log('Character mutation input parity contract passed.')
