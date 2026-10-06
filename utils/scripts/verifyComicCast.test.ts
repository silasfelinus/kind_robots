// /utils/scripts/verifyComicCast.test.ts
//
// Contract test for the Comic Studio cast sheets (utils/comicCast.ts).
// What it protects: cast-* slots group into one sheet per character in turnaround order;
// a sheet shows the final pick (else the newest liked render); "shown mirrored" and
// "Same render as cast-…" notes draw the card flipped, the latter borrowing the other
// slot's render; non-angle cast slots (the coyote's stump states) land in extras; and
// aspect helpers turn "2:3" or a render's pixel size into a CSS aspect-ratio.
import assert from 'node:assert/strict'

import {
  castPick,
  comicAspectRatio,
  buildComicCastSheets,
  comicRenderAspect,
  parseCastKey,
} from '../comicCast.js'

const slot = (
  id: number,
  key: string,
  title: string,
  notes: string | null = null,
  sortOrder = id,
) => ({ id, entityId: 1, key, title, notes, sortOrder })

const slots = [
  slot(3, 'cast-zuzu-back', 'Zuzu: back'),
  slot(1, 'cast-zuzu-front', 'Zuzu: front'),
  slot(2, 'cast-zuzu-profile-left', 'Zuzu: profile left'),
  slot(
    4,
    'cast-zuzu-profile-right',
    'Zuzu: profile right',
    'Locked pick ArtImage 7, shown mirrored. Same render as cast-zuzu-profile-left.',
  ),
  slot(10, 'cast-coyote-front', 'The coyote: front', null, 10),
  slot(
    11,
    'cast-coyote-stump-fresh',
    'The coyote: fresh stump (chapter 1, after the croc)',
    null,
    11,
  ),
  slot(20, 'r3-komodo-maw', 'Not cast'),
]
const attempts = [
  { id: 100, slotId: 1, verdict: 'selected', artImageId: 900 },
  { id: 101, slotId: 1, verdict: 'liked', artImageId: 901 },
  { id: 102, slotId: 2, verdict: 'liked', artImageId: 902 },
  { id: 103, slotId: 2, verdict: 'liked', artImageId: 903 },
  { id: 104, slotId: 3, verdict: 'none', artImageId: 904 },
  { id: 105, slotId: 10, verdict: 'selected', artImageId: null },
  { id: 106, slotId: 11, verdict: 'selected', artImageId: 906 },
]

assert.deepEqual(parseCastKey('cast-zuzu-front'), {
  character: 'zuzu',
  rest: 'front',
})
assert.equal(parseCastKey('r3-komodo-maw'), null)
assert.equal(parseCastKey('cast-zuzu'), null)

assert.equal(castPick(attempts, 1)?.id, 100, 'the final pick wins over liked')
assert.equal(castPick(attempts, 2)?.id, 103, 'else the newest liked render')
assert.equal(castPick(attempts, 3), null, 'an unjudged render is not a pick')
assert.equal(castPick(attempts, 10), null, 'a pick with no image is not shown')

const sheets = buildComicCastSheets(slots, attempts)
assert.deepEqual(
  sheets.map((sheet) => sheet.key),
  ['zuzu', 'coyote'],
  'one sheet per character, in sort order; non-cast slots are ignored',
)
const zuzu = sheets[0]!
assert.equal(zuzu.name, 'Zuzu')
assert.deepEqual(
  zuzu.cards.map((card) => card.angle),
  ['front', 'profile-left', 'back', 'profile-right'],
  'cards follow turnaround order, not slot order',
)
const right = zuzu.cards.find((card) => card.angle === 'profile-right')
assert.equal(right?.attemptId, 103, 'a reused render borrows the source pick')
assert.equal(right?.mirrored, true)
assert.equal(zuzu.cards.find((card) => card.angle === 'front')?.mirrored, false)
assert.equal(zuzu.cards.find((card) => card.angle === 'back')?.attemptId, null)

const coyote = sheets[1]!
assert.equal(coyote.cards.length, 1)
assert.equal(coyote.extras.length, 1)
assert.equal(coyote.extras[0]?.attemptId, 106)
assert.equal(
  coyote.extras[0]?.label,
  'fresh stump (chapter 1, after the croc)',
  'extras are labelled with the title after the character name',
)

assert.equal(comicAspectRatio('2:3'), '2 / 3')
assert.equal(comicAspectRatio('16:9'), '16 / 9')
assert.equal(comicAspectRatio('nonsense'), '4 / 3')
assert.equal(comicAspectRatio(null), '4 / 3')
assert.equal(comicRenderAspect(832, 1216, '1:1'), '832 / 1216')
assert.equal(comicRenderAspect(null, null, '2:3'), '2 / 3')

console.log('comic cast contract: ok')
