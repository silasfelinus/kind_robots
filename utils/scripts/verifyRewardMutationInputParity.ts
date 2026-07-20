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

const boundary = read('server/api/rewards/mutation.ts')
const index = read('server/api/rewards/index.ts')
const createRoute = read('server/api/rewards/index.post.ts')
const patchRoute = read('server/api/rewards/[id].patch.ts')
const batchRoute = read('server/api/rewards/batch.post.ts')
const cypressSpec = read('cypress/e2e/api/reward-input-boundary.cy.ts')

// Boundary exports caps, allowlists, the assertion, and the existence check.
requireText(
  boundary,
  'export const REWARD_RELATION_ID_LIMIT = 100',
  'Reward relation cap',
)
requireText(
  boundary,
  'export const REWARD_BATCH_LIMIT = 100',
  'Reward batch cap',
)
requireText(boundary, 'export const rewardCreateFields', 'Reward create allowlist')
requireText(boundary, 'export const rewardPatchFields', 'Reward patch allowlist')
requireText(
  boundary,
  'export const rewardBatchCreateFields',
  'Reward batch allowlist',
)
requireText(
  boundary,
  'export function assertRewardMutationInput',
  'Reward mutation boundary',
)
requireText(
  boundary,
  'export async function assertRewardRelationsAttachable',
  'Reward relation existence + permission check',
)
requireText(
  boundary,
  'row.userId !== userId && row.isPublic !== true',
  'Reward relation permission rule',
)
requireText(boundary, 'Unsupported Reward fields in', 'Reward unknown-field error')
requireText(
  boundary,
  'Reward ID is immutable and must match the route.',
  'Reward immutable-id error',
)
requireText(
  boundary,
  'may contain at most ${REWARD_RELATION_ID_LIMIT} entries',
  'Reward relation cap error',
)
requireText(
  boundary,
  'contains an invalid ID at index',
  'Reward invalid-relation-id error',
)
requireText(boundary, 'must be a valid ${label}', 'Reward enum error')

// Batch allowlist stays strict: only persisted + create-relation fields.
requireText(
  boundary,
  'export const rewardBatchCreateFields = new Set<string>([\n  ...persistedMutationFields,\n  ...createRelationFields,\n])',
  'Reward strict batch allowlist',
)

// The builders run the existence + permission check before every write, so
// singular and batch both reject nonexistent and non-attachable relation targets.
requireText(
  index,
  'await assertRewardRelationsAttachable(input, authenticatedUserId, isAdmin)',
  'Reward relation check wiring',
)

// Routes wire the boundary with the correct allowlist.
requireText(
  createRoute,
  'allowedFields: rewardCreateFields',
  'Reward create route wiring',
)
requireText(
  patchRoute,
  'allowedFields: rewardPatchFields',
  'Reward patch route wiring',
)
requireText(patchRoute, 'routeId: rewardId', 'Reward patch immutable-id wiring')
requireText(
  batchRoute,
  'allowedFields: rewardBatchCreateFields',
  'Reward batch route wiring',
)
requireText(batchRoute, 'REWARD_BATCH_LIMIT', 'Reward batch size cap wiring')

// Deployed regression it() blocks are pinned to the contract.
requireText(
  cypressSpec,
  'rejects unknown fields on singular Reward creation',
  'Reward create deployed regression',
)
requireText(
  cypressSpec,
  'rejects oversized and invalid relation arrays on Reward creation',
  'Reward relation deployed regression',
)
requireText(
  cypressSpec,
  'rejects nonexistent relation targets on Reward creation',
  'Reward existence deployed regression',
)
requireText(
  cypressSpec,
  'forbids attaching another user private Character on Reward creation',
  'Reward relation permission deployed regression',
)
requireText(
  cypressSpec,
  'rejects unknown, mismatched ID, and invalid enum fields on Reward PATCH',
  'Reward patch deployed regression',
)
requireText(
  cypressSpec,
  'applies the same strict boundary to Reward batches',
  'Reward batch deployed regression',
)

console.log('Reward mutation input parity contract passed.')
