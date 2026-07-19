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

const index = read('server/api/projects/index.ts')
const createRoute = read('server/api/projects/index.post.ts')
const patchRoute = read('server/api/projects/[id].patch.ts')
const cypressSpec = read('cypress/e2e/api/project-input-boundary.cy.ts')

// The shared allowlist is exported and used by both mutation routes.
requireText(
  index,
  'export const projectMutationFields',
  'Project mutation allowlist',
)

requireText(
  createRoute,
  'assertOnlyFields(body, projectMutationFields',
  'Project create route wiring',
)
requireText(
  patchRoute,
  'assertOnlyFields(body, projectMutationFields',
  'Project patch route wiring',
)

// Deployed regression it() blocks are pinned to the contract.
requireText(
  cypressSpec,
  'rejects unknown fields on Project creation',
  'Project create deployed regression',
)
requireText(
  cypressSpec,
  'rejects unknown fields on Project PATCH',
  'Project patch deployed regression',
)
requireText(
  cypressSpec,
  'tolerates round-tripped system fields on Project PATCH',
  'Project compatibility deployed regression',
)

console.log('Project mutation input parity contract passed.')
