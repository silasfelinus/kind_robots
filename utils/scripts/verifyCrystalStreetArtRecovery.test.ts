import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import receipts from '../crystalStreet/renderedArtReceipts.json'
import {
  renderedArtImageId,
  renderedArtReceiptCount,
} from '../crystalStreet/renderedArt'

const file = (path: string) => fileURLToPath(new URL(path, import.meta.url))

assert.equal(renderedArtReceiptCount, 3040)
assert.equal(
  renderedArtImageId('/crystal-street/endings/frieda-krueger-good.webp'),
  270461,
)
assert.equal(
  renderedArtImageId(
    '/crystal-street/outcomes/frieda-krueger-clue-microfiche--read-the-reel-success.webp',
  ),
  262576,
)
assert.equal(
  renderedArtImageId('/crystal-street/scenes/frieda-krueger-clue-microfiche.webp'),
  null,
  'explicitly rejected scene is not linked',
)
assert.equal(
  renderedArtImageId('/crystal-street/scenes/frieda-krueger-clue-wig-room.webp'),
  null,
  'already delivered artwork remains on its static path',
)
for (const [asset, id] of Object.entries(receipts)) {
  assert.ok(Number.isSafeInteger(id) && id > 0)
  assert.match(asset, /^(scenes|outcomes|endings|items)\/[a-z0-9-]+$/)
  assert.equal(renderedArtImageId(`/crystal-street/${asset}.webp`), id)
  assert.ok(
    !existsSync(file(`../../public/crystal-street/${asset}.webp`)),
    `existing files must not be overridden: ${asset}`,
  )
}
for (const invalid of [
  '',
  '/crystal-street/../secret.webp',
  '/crystal-street/scenes/constructor.webp',
  '/crystal-street/endings/frieda-krueger-good.webp?x=1',
  'https://elsewhere.invalid/crystal-street/endings/frieda-krueger-good.webp',
])
  assert.equal(renderedArtImageId(invalid), null)
const store = readFileSync(file('../../stores/crystalStreetArtStore.ts'), 'utf8')
assert.match(store, /user\.isAdmin && !!sessionToken\.value/)
assert.match(store, /\/api\/art\/images\/\$\{id\}\/file/)
assert.match(store, /watch\(\[sessionToken, canLoad\], clear/)
assert.match(store, /URL\.revokeObjectURL/)
const art = readFileSync(
  file('../../components/crystal-street/crystal-street-art.vue'),
  'utf8',
)
assert.match(art, /art\.sourceFor\(props\.src\)/)
const encounter = readFileSync(
  file('../../components/crystal-street/crystal-street-encounter.vue'),
  'utf8',
)
assert.match(encounter, /image: art\.sourceFor\(choiceArtPath/)
console.log('Crystal Street: 3,040 existing render links; known rejects excluded.')
