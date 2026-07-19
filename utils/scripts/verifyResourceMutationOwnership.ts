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

const createHelper = read('server/api/resources/create.ts')
const createRoute = read('server/api/resources/index.post.ts')
const batchRoute = read('server/api/resources/batch.post.ts')
const patchRoute = read('server/api/resources/[id].patch.ts')
const cypressSpec = read('cypress/e2e/api/resources.cy.ts')

requireText(
  createHelper,
  'assertOwnershipMatchesAuthentication(entry, authenticatedUserId)',
  'Resource create ownership boundary',
)
requireText(
  createHelper,
  'User: { connect: { id: authenticatedUserId } }',
  'Resource create authenticated ownership',
)
forbidText(createHelper, 'canAssignUserId', 'Resource create payload ownership')
forbidText(createHelper, 'fallbackUserId', 'Resource create payload ownership')

requireText(
  createRoute,
  'authenticatedUserId: user.id',
  'Resource create caller identity',
)
forbidText(createRoute, 'kind', 'Resource create elevated identity assignment')

requireText(
  batchRoute,
  'authenticatedUserId: user.id',
  'Resource batch caller identity',
)
forbidText(batchRoute, 'canAssignUserId', 'Resource batch payload ownership')
forbidText(batchRoute, 'fallbackUserId', 'Resource batch payload ownership')

requireText(
  patchRoute,
  'assertOwnershipIsUnchanged(body, existingResource.userId)',
  'Resource patch ownership boundary',
)
requireText(
  patchRoute,
  'userId: _userId',
  'Resource patch ownership stripping',
)
forbidText(patchRoute, '\n      User:', 'Resource patch ownership relation')
forbidText(
  patchRoute,
  'Only admins can reassign Resource ownership',
  'Resource patch admin reassignment',
)

requireText(
  cypressSpec,
  'rejects Resource creation with spoofed ownership',
  'Resource create deployed regression',
)
requireText(
  cypressSpec,
  'rejects spoofed ownership in Resource batches',
  'Resource batch deployed regression',
)
requireText(
  cypressSpec,
  'rejects Resource ownership reassignment on update',
  'Resource patch deployed regression',
)

console.log('Resource mutation ownership contract passed.')
