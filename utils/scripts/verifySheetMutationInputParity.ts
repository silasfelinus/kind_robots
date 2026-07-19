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

const boundary = read('server/utils/pitchSheets/payload.ts')
const createRoute = read('server/api/sheets/index.post.ts')
const patchRoute = read('server/api/sheets/[id].patch.ts')
const byDreamRoute = read('server/api/sheets/by-dream/[dreamId].post.ts')
const cypressSpec = read('cypress/e2e/api/sheet-input-boundary.cy.ts')

// The payload helper now exports an explicit reject boundary + a size cap.
requireText(
  boundary,
  'export const PITCHSHEET_EXTRA_DATA_LIMIT',
  'PitchSheet extraData cap',
)
requireText(
  boundary,
  'export function assertPitchSheetMutationInput',
  'PitchSheet mutation boundary',
)
requireText(
  boundary,
  'Unsupported PitchSheet fields in',
  'PitchSheet unknown-field error',
)
requireText(
  boundary,
  'must be a positive integer or null',
  'PitchSheet artImageId validation',
)
requireText(
  boundary,
  'must be a serialized JSON string or null',
  'PitchSheet extraData validation',
)

// Every single-record mutation route runs the boundary before persisting.
requireText(
  createRoute,
  'assertPitchSheetMutationInput(body',
  'PitchSheet create route wiring',
)
requireText(
  patchRoute,
  'assertPitchSheetMutationInput(body',
  'PitchSheet patch route wiring',
)
requireText(
  byDreamRoute,
  'assertPitchSheetMutationInput(body',
  'PitchSheet by-dream route wiring',
)

// Deployed regression it() blocks are pinned to the contract.
requireText(
  cypressSpec,
  'rejects unknown fields on standalone PitchSheet creation',
  'PitchSheet create deployed regression',
)
requireText(
  cypressSpec,
  'rejects an invalid artImageId and non-string extraData on PitchSheet creation',
  'PitchSheet field-validation deployed regression',
)
requireText(
  cypressSpec,
  'rejects unknown fields on PitchSheet PATCH',
  'PitchSheet patch deployed regression',
)

console.log('PitchSheet mutation input parity contract passed.')
