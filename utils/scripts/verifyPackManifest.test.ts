// /utils/scripts/verifyPackManifest.test.ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

import ts from 'typescript'

const storeSource = readFileSync(
  new URL('../../stores/packStore.ts', import.meta.url),
  'utf8',
)
const validatorStart = storeSource.indexOf('const ITEM_SHAPES')
const validatorEnd = storeSource.indexOf('export const usePackStore')

assert.ok(validatorStart >= 0, 'packStore.ts must define ITEM_SHAPES')
assert.ok(validatorEnd > validatorStart, 'packStore.ts must export usePackStore')

const validatorSource = storeSource
  .slice(validatorStart, validatorEnd)
  .replace('export function validatePackManifest', 'function validatePackManifest')

const compiled = ts.transpileModule(
  `${validatorSource}\nvalidationResult = validatePackManifest(input)`,
  {
    compilerOptions: {
      module: ts.ModuleKind.None,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText

function validate(input: unknown): string | null {
  const context: { input: unknown; validationResult: string | null } = {
    input,
    validationResult: null,
  }
  runInNewContext(compiled, context)
  return context.validationResult
}

const validManifest = {
  schemaVersion: 1,
  id: 'test-pack',
  title: 'Test Pack',
  description: 'A focused manifest-validator fixture.',
  owner: 'silas',
  visibility: 'draft',
  price: { hook: 'dlc' },
  items: [
    {
      id: 'test-location',
      type: 'location',
      itemShape: 'dream',
      draftPayload: {
        title: 'Test Location',
        description: 'A place used only by this regression test.',
      },
    },
  ],
}

assert.equal(validate(validManifest), null)
assert.equal(validate({ ...validManifest, title: '' }), 'Pack "title" is required.')
assert.equal(
  validate({
    ...validManifest,
    items: [{ ...validManifest.items[0], itemShape: 'invalid' }],
  }),
  'Item "test-location" has unknown itemShape "invalid".',
)
assert.equal(
  validate({
    ...validManifest,
    items: [{ ...validManifest.items[0], draftPayload: undefined }],
  }),
  'Item "test-location" needs a draftPayload (or a refId).',
)

console.log(
  'Pack manifest validator verified from packStore.ts source: accepts schema-v1 input and rejects missing required fields, invalid item shapes, and items without draft payloads or references.',
)
