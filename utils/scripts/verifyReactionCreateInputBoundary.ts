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

const createRoute = read('server/api/reactions/index.post.ts')
const cypressSpec = read('cypress/e2e/api/reactions.cy.ts')

requireText(
  createRoute,
  'const REACTION_CREATE_FIELDS = new Set([',
  'Reaction create allowlist',
)
requireText(
  createRoute,
  "'artId',",
  'Reaction legacy art target alias',
)
requireText(
  createRoute,
  'assertReactionCreateFields(body)',
  'Reaction unsupported-field rejection',
)
requireText(
  createRoute,
  'assertReactionOwnershipMatchesAuthentication(body.userId, user.id)',
  'Reaction ownership-match boundary',
)
requireText(
  createRoute,
  'userId: user.id',
  'Reaction authenticated ownership write',
)
forbidText(
  createRoute,
  'userId: body.userId',
  'Reaction payload ownership write',
)
forbidText(
  createRoute,
  'userId: requestedUserId',
  'Reaction requested ownership write',
)

requireText(
  cypressSpec,
  'rejects spoofed Reaction ownership',
  'Reaction ownership deployed regression',
)
requireText(
  cypressSpec,
  'rejects unsupported Reaction create fields',
  'Reaction allowlist deployed regression',
)
requireText(
  cypressSpec,
  'creates a Reaction under the authenticated owner',
  'Reaction valid create regression',
)

console.log('Reaction create input boundary contract passed.')
