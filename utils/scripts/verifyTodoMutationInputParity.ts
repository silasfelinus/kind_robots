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

const boundary = read('server/api/todos/mutation.ts')
const createRoute = read('server/api/todos/index.post.ts')
const patchRoute = read('server/api/todos/[id].patch.ts')
const deleteRoute = read('server/api/todos/[id].delete.ts')
const cypressSpec = read('cypress/e2e/api/todo-input-boundary.cy.ts')

requireText(boundary, 'export const todoMutationFields', 'Todo mutation allowlist')

requireText(
  createRoute,
  'assertOnlyFields(body as Record<string, unknown>, todoMutationFields',
  'Todo create route wiring',
)
requireText(
  patchRoute,
  'assertOnlyFields(body as Record<string, unknown>, todoMutationFields',
  'Todo patch route wiring',
)

// Deployed regression it() blocks are pinned to the contract.
requireText(
  cypressSpec,
  'rejects unknown fields on Todo creation',
  'Todo create deployed regression',
)
requireText(
  cypressSpec,
  'rejects unknown fields on Todo PATCH',
  'Todo patch deployed regression',
)

// Phase 3: every Todo route returns the standard { success, message, data,
// statusCode } envelope, and errors no longer re-throw H3Errors as Nuxt's default
// error shape (which previously bypassed the envelope and left errors at HTTP 200).
for (const [route, name] of [
  [createRoute, 'create'],
  [patchRoute, 'patch'],
  [deleteRoute, 'delete'],
] as const) {
  requireText(route, 'data: null,', `Todo ${name} error envelope data`)
  requireText(
    route,
    'statusCode: event.node.res.statusCode,',
    `Todo ${name} error envelope statusCode`,
  )
  forbidText(
    route,
    'if (error instanceof H3Error) throw error',
    `Todo ${name} H3Error re-throw`,
  )
  forbidText(route, 'return errorHandler(error)', `Todo ${name} bare error return`)
}

console.log('Todo mutation input parity contract passed.')
