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
  'userId: user.id',
  'Reaction authenticated ownership write',
)
// The #560 matching-userId compatibility path is fully removed: ownership is now
// exclusively authentication-derived and a supplied userId is an unsupported field.
forbidText(
  createRoute,
  "'userId',",
  'Reaction userId create allowlist entry',
)
forbidText(
  createRoute,
  'assertReactionOwnershipMatchesAuthentication',
  'Reaction ownership-match compatibility boundary',
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
  'rejects a supplied userId as an unsupported Reaction create field',
  'Reaction supplied-userId deployed regression',
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

// Full per-category target access model: content targets gate on public-or-owned,
// chats on participant-or-public, components are open, and admins bypass.
requireText(
  createRoute,
  'async function assertReactionTargetAccessible',
  'Reaction target access gate',
)
requireText(
  createRoute,
  'isAdmin || row.isPublic === true || row.userId === userId',
  'Reaction content target access rule',
)
requireText(
  createRoute,
  'chat.userId === userId ||\n      chat.recipientId === userId',
  'Reaction chat participant access rule',
)
forbidText(
  createRoute,
  'async function assertReactionTargetExists',
  'Reaction existence-only target check replaced',
)
requireText(
  cypressSpec,
  'forbids reacting to another user private Theme',
  'Reaction target permission deployed regression',
)

console.log('Reaction create input boundary contract passed.')
