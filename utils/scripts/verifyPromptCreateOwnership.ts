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

const createRoute = read('server/api/prompts/index.post.ts')
const cypressSpec = read('cypress/e2e/api/prompt-ownership.cy.ts')

requireText(
  createRoute,
  'assertOwnershipMatchesAuthentication(promptData, authenticatedUserId)',
  'Prompt create ownership boundary',
)
requireText(
  createRoute,
  'connect: { id: authenticatedUserId }',
  'Prompt authenticated owner connection',
)
requireText(
  createRoute,
  'userId: authenticatedUserId',
  'Prompt karma authenticated owner',
)
forbidText(createRoute, 'const userId =', 'Prompt payload ownership selection')
forbidText(createRoute, 'isServerKey', 'Prompt server-key ownership selection')
forbidText(createRoute, 'const isAdmin', 'Prompt admin ownership selection')
forbidText(createRoute, 'where: { id: userId }', 'Prompt requested-user lookup')

requireText(
  cypressSpec,
  'does not let elevated credentials assign Prompt ownership',
  'Prompt elevated deployed regression',
)
requireText(
  cypressSpec,
  'adminHeaders(adminToken)',
  'Prompt elevated credential coverage',
)

// Create-path input boundary (audit F-4): unknown fields are rejected.
requireText(
  createRoute,
  'const promptCreateFields = new Set<string>([',
  'Prompt create allowlist',
)
requireText(
  createRoute,
  "assertOnlyFields(promptData, promptCreateFields, 'Prompt')",
  'Prompt create field boundary wiring',
)
requireText(
  cypressSpec,
  'rejects unknown fields on Prompt creation',
  'Prompt create input boundary deployed regression',
)

console.log('Prompt create ownership contract passed.')
