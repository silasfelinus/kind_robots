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

const serverApi = read('server/utils/serverApi.ts')
const createRoute = read('server/api/server/index.post.ts')
const batchRoute = read('server/api/server/batch.post.ts')
const patchRoute = read('server/api/server/[id].patch.ts')
const cypressSpec = read('cypress/e2e/api/server-ownership.cy.ts')

requireText(
  serverApi,
  'assertServerCreateOwnership(input, user.id)',
  'Server create ownership boundary',
)
requireText(
  serverApi,
  'userId: user.id',
  'Server authenticated owner assignment',
)
requireText(
  serverApi,
  'export function assertServerOwnershipUnchanged(',
  'Server update ownership boundary',
)
forbidText(
  serverApi,
  'user.isAdmin && cleanInt(input.userId)',
  'Server elevated create ownership selection',
)
forbidText(
  serverApi,
  'data.userId =',
  'Server ownership reassignment write',
)

requireText(
  createRoute,
  'buildServerCreateData(safeBody, user)',
  'Server singular create shared boundary',
)
requireText(
  batchRoute,
  'buildServerCreateData(safeBody, user)',
  'Server batch create shared boundary',
)
requireText(
  patchRoute,
  'assertServerOwnershipUnchanged(safeBody, server.userId)',
  'Server patch ownership rejection',
)

requireText(
  cypressSpec,
  'does not let elevated credentials assign Server ownership on create',
  'Server create deployed regression',
)
requireText(
  cypressSpec,
  'does not let elevated credentials assign Server ownership in batches',
  'Server batch deployed regression',
)
requireText(
  cypressSpec,
  'does not let elevated credentials reassign Server ownership',
  'Server patch deployed regression',
)
requireText(
  cypressSpec,
  'adminHeaders(adminToken)',
  'Server elevated credential coverage',
)

console.log('Server mutation ownership contract passed.')
