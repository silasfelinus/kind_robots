import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import receipts from '../crystalStreet/renderedArtReceipts.json'
import {
  renderedArtImageId,
  renderedArtReceiptCount,
} from '../crystalStreet/renderedArt'

import {
  CRYSTAL_STREET_TOWN_PAINTING,
  weekEndingArt,
} from '../crystalStreet/artPresentation'

import { allArtPrompts } from '../crystalStreet/artPrompts'
import {
  ARCHETYPES,
  AVATARS,
  CHARACTERS,
  COMPANIONS,
  DECKS,
  ITEMS,
  LOCATIONS,
  SPECIAL_ENDINGS,
  TITLE_ART,
  VILLAINS,
  allEncounters,
} from '../crystalStreet/rules'

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
  renderedArtImageId(
    '/crystal-street/scenes/frieda-krueger-clue-microfiche.webp',
  ),
  null,
  'explicitly rejected scene is not linked',
)
assert.equal(
  renderedArtImageId(
    '/crystal-street/scenes/frieda-krueger-clue-wig-room.webp',
  ),
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
const store = readFileSync(
  file('../../stores/crystalStreetArtStore.ts'),
  'utf8',
)
assert.match(store, /user\.isAdmin && !!sessionToken\.value/)
assert.match(store, /\/api\/art\/images\/\$\{id\}\/file/)
assert.match(store, /watch\(\[sessionToken, canLoad\], clear/)
assert.match(store, /URL\.revokeObjectURL/)
const art = readFileSync(
  file('../../components/crystal-street/crystal-street-art.vue'),
  'utf8',
)
assert.match(art, /art\.sourceFor\(props\.src\)/)
assert.doesNotMatch(art, /crystal-street-scene|<svg/)
assert.ok(existsSync(file(`../../public${CRYSTAL_STREET_TOWN_PAINTING}`)))
const portraits = readFileSync(
  file('../../components/crystal-street/crystal-street-portrait.vue'),
  'utf8',
)
assert.doesNotMatch(portraits, /<svg/)
assert.match(portraits, /-neutral\.webp/)
const weeks = readFileSync(
  file('../../components/crystal-street/crystal-street-weeks.vue'),
  'utf8',
)
assert.match(weeks, /:src="weekEndingArt\(entry\)"/)
assert.equal(
  weekEndingArt({ villain: 'frieda-krueger', tier: 'good' }),
  '/crystal-street/endings/frieda-krueger-good.webp',
)
assert.equal(
  weekEndingArt({ villain: 'frieda-krueger', tier: 'bad', special: 'family' }),
  '/crystal-street/endings/special-family.webp',
)
assert.equal(
  weekEndingArt({
    villain: 'frieda-krueger',
    tier: 'best',
    special: 'final-girl',
  }),
  '/crystal-street/endings/frieda-krueger-best.webp',
)
const encounter = readFileSync(
  file('../../components/crystal-street/crystal-street-encounter.vue'),
  'utf8',
)
assert.match(encounter, /image: art\.sourceFor\(choiceArtPath/)
console.log(
  'Crystal Street: 3,040 existing render links; known rejects excluded.',
)

const prompts = allArtPrompts({
  villains: VILLAINS,
  companions: COMPANIONS,
  locations: LOCATIONS,
  decks: DECKS,
  items: ITEMS,
  avatars: AVATARS,
  cliques: ARCHETYPES,
  characters: CHARACTERS,
  specialEndings: SPECIAL_ENDINGS,
  title: TITLE_ART,
})
const keys = new Set(prompts.map(({ key }) => key))
assert.equal(keys.size, prompts.length, 'unique authored art paths')
for (const encounter of allEncounters()) {
  assert.ok(keys.has(`scenes/${encounter.id}`), encounter.id)
  for (const choice of encounter.choices) {
    for (const result of ['success', 'failure']) {
      const key = `outcomes/${encounter.id}--${choice.id}-${result}`
      assert.ok(keys.has(key), key)
    }
  }
}
assert.equal(COMPANIONS.flatMap((companion) => companion.arc ?? []).length, 66)
