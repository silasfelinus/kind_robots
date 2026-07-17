// /utils/scripts/verifyPackManifest.test.ts
import assert from 'node:assert/strict'

import { validatePackManifest } from '../../stores/packStore.js'

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

assert.equal(validatePackManifest(validManifest), null)

assert.equal(
  validatePackManifest({ ...validManifest, title: '' }),
  'Pack "title" is required.',
)

assert.equal(
  validatePackManifest({
    ...validManifest,
    items: [{ ...validManifest.items[0], itemShape: 'invalid' }],
  }),
  'Item "test-location" has unknown itemShape "invalid".',
)

assert.equal(
  validatePackManifest({
    ...validManifest,
    items: [{ ...validManifest.items[0], draftPayload: undefined }],
  }),
  'Item "test-location" needs a draftPayload (or a refId).',
)

console.log(
  'Pack manifest validator verified: accepts schema-v1 input and rejects missing required fields, invalid item shapes, and items without draft payloads or references.',
)
