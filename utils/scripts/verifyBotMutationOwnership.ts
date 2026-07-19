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

const createRoute = read('server/api/bots/index.post.ts')
const patchRoute = read('server/api/bots/[id].patch.ts')
const batchRoute = read('server/api/bots/batch.post.ts')
const clientHelper = read('stores/helpers/botHelper.ts')
const cypressSpec = read('cypress/e2e/api/bots.cy.ts')

requireText(
  createRoute,
  'assertOwnershipIsServerManaged(botData)',
  'Bot create ownership rejection',
)
requireText(
  createRoute,
  'connect: { id: user.id }',
  'Bot create authenticated ownership',
)
forbidText(createRoute, 'requestedUserId', 'Bot create payload ownership')
forbidText(createRoute, 'botData.userId', 'Bot create payload ownership')

requireText(
  patchRoute,
  'assertOwnershipIsServerManaged(body)',
  'Bot patch ownership rejection',
)
forbidText(patchRoute, 'requestedUserId', 'Bot patch ownership reassignment')
forbidText(patchRoute, '\n      User:', 'Bot patch ownership relation')

requireText(
  batchRoute,
  'assertOwnershipIsServerManaged(bots)',
  'Bot batch ownership rejection',
)
forbidText(batchRoute, 'requestedUserId', 'Bot batch ownership reassignment')
forbidText(batchRoute, 'userIds', 'Bot batch ownership lookup')
forbidText(batchRoute, '\n    User:', 'Bot batch ownership relation')

requireText(
  clientHelper,
  "Reflect.deleteProperty(sanitized, 'userId')",
  'Bot client ownership stripping',
)
requireText(
  clientHelper,
  'withoutBotOwnership(botData)',
  'Bot create client sanitizer',
)
requireText(
  clientHelper,
  'const payload = withoutBotOwnership({',
  'Bot patch client sanitizer',
)

requireText(
  cypressSpec,
  'rejects client-supplied ownership during Bot creation',
  'Bot create deployed regression',
)
requireText(
  cypressSpec,
  'rejects ownership reassignment during singular and batch updates',
  'Bot update deployed regression',
)

console.log('Bot mutation ownership contract passed.')
