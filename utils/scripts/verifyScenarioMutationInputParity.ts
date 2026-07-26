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

const boundary = read('server/api/scenarios/mutation.ts')
const createHelper = read('server/api/scenarios/create.ts')
const createRoute = read('server/api/scenarios/index.post.ts')
const patchRoute = read('server/api/scenarios/[id].patch.ts')
const batchCreateRoute = read('server/api/scenarios/batch.post.ts')
const batchPatchRoute = read('server/api/scenarios/batch.patch.ts')
const genreSync = read('server/utils/scenarioGenreFacetSync.ts')
const cypressSpec = read('cypress/e2e/api/scenario-input-boundary.cy.ts')
const permissionSpec = read(
  'cypress/e2e/api/scenario-relation-permission.cy.ts',
)

requireText(
  boundary,
  'export const SCENARIO_RELATION_ID_LIMIT = 100',
  'Scenario relation cap',
)
requireText(
  boundary,
  'export const SCENARIO_BATCH_LIMIT = 100',
  'Scenario batch cap',
)
requireText(
  boundary,
  'const scenarioStoreCompatibilityFields = [',
  'Scenario singular store compatibility stage',
)
requireText(
  boundary,
  "'facetIds',",
  'Scenario Facet compatibility field',
)
requireText(
  boundary,
  'no writable ScenarioCreateInput/ScenarioUpdateInput relation',
  'Scenario Facet write limitation documentation',
)
requireText(
  boundary,
  'export const scenarioBatchCreateFields = new Set<string>(scenarioMutationFields)',
  'Scenario strict batch create fields',
)
requireText(
  boundary,
  'Unsupported Scenario ownership assignment. Ownership is server-owned.',
  'Scenario ownership-match boundary',
)
requireText(
  boundary,
  'Scenario ID is immutable and must match the route.',
  'Scenario route ID boundary',
)
requireText(
  boundary,
  'contains an invalid ID at index ${index}',
  'Scenario invalid relation rejection',
)
forbidText(
  boundary,
  'data.Facets =',
  'Unsupported Scenario Facet update write',
)
forbidText(
  createHelper,
  'Facets:',
  'Unsupported Scenario Facet create write',
)

requireText(
  createHelper,
  'allowedFields: options.batch',
  'Scenario singular/batch field selection',
)
requireText(
  createHelper,
  'Characters: characterIds?.length',
  'Scenario Character create persistence',
)
requireText(
  createRoute,
  'await buildScenarioCreateInput(body, user.id)',
  'Scenario singular create boundary',
)
requireText(
  patchRoute,
  'allowedFields: scenarioPatchFields',
  'Scenario singular patch boundary',
)
requireText(
  patchRoute,
  'routeId: id',
  'Scenario singular route ID validation',
)
requireText(
  batchCreateRoute,
  '{ batch: true }',
  'Scenario strict batch create boundary',
)
requireText(
  batchCreateRoute,
  'body.length > SCENARIO_BATCH_LIMIT',
  'Scenario batch create cap',
)
requireText(
  batchPatchRoute,
  'allowedFields: scenarioBatchPatchFields',
  'Scenario batch patch item boundary',
)
requireText(
  batchPatchRoute,
  'record.updates.length > SCENARIO_BATCH_LIMIT',
  'Scenario batch patch cap',
)
forbidText(
  patchRoute,
  'function normalizePositiveIdArray',
  'Scenario duplicate singular normalizer',
)
forbidText(
  batchPatchRoute,
  'function normalizePositiveIdArray',
  'Scenario duplicate batch normalizer',
)

requireText(
  cypressSpec,
  'rejects unknown and spoofed fields on singular Scenario creation',
  'Scenario singular deployed regression',
)
requireText(
  cypressSpec,
  'keeps singular ScenarioStore compatibility explicit and auth-bound',
  'Scenario compatibility deployed regression',
)
requireText(
  cypressSpec,
  'rejects unknown, mismatched ID, and oversized PATCH fields',
  'Scenario patch deployed regression',
)
requireText(
  cypressSpec,
  'keeps Scenario batch create and patch imports strict and bounded',
  'Scenario batch deployed regression',
)

requireText(
  boundary,
  'export async function assertScenarioRelationsAttachable',
  'Scenario relation permission gate',
)
requireText(
  boundary,
  'NOT: { OR: [{ userId }, { isPublic: true }] }',
  'Scenario relation permission clause',
)
for (const [source, label] of [
  [createRoute, 'Scenario create relation permission wiring'],
  [patchRoute, 'Scenario patch relation permission wiring'],
  [batchCreateRoute, 'Scenario batch create relation permission wiring'],
  [batchPatchRoute, 'Scenario batch patch relation permission wiring'],
] as const) {
  requireText(source, 'assertScenarioRelationsAttachable(', label)
}
requireText(
  permissionSpec,
  'forbids attaching another user private Character on Scenario creation',
  'Scenario relation permission deployed regression',
)

// Genre strings remain compatibility fields, while canonical ScenarioFacet links
// are synchronized in the same transaction on every mutation path.
requireText(
  genreSync,
  'export async function syncScenarioGenreFacetsInTransaction',
  'Scenario Genre Facet synchronizer',
)
requireText(
  genreSync,
  "where: { taxonomy: 'GENRE' }",
  'Scenario Genre taxonomy boundary',
)
requireText(
  genreSync,
  'facetId: { in: genreFacetIds }',
  'Scenario Genre-only replacement boundary',
)
for (const [source, label] of [
  [createRoute, 'Scenario create Genre transaction'],
  [patchRoute, 'Scenario patch Genre transaction'],
  [batchCreateRoute, 'Scenario batch create Genre transaction'],
  [batchPatchRoute, 'Scenario batch patch Genre transaction'],
] as const) {
  requireText(source, 'prisma.$transaction', label)
  requireText(source, 'syncScenarioGenreFacetsInTransaction', label)
}
requireText(
  patchRoute,
  "if ('genres' in data)",
  'Scenario patch conditional Genre sync',
)
requireText(
  batchPatchRoute,
  "if ('genres' in data)",
  'Scenario batch patch conditional Genre sync',
)

console.log('Scenario mutation input parity contract passed.')
