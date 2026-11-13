import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  SHARED_ENDING_IDS,
  SHARED_ENDING_PLATES,
  emptySharedEndingsRecord,
  readSharedEndingsRecord,
  sharedEndingId,
  sharedEndingPlate,
  sharedScrapbook,
  withSharedEnding,
} from '../shiftingLands/endingPlates'
import {
  PERSONAL_ROAD_IDS,
  emptyPersonalEndingsRecord,
  personalScrapbook,
} from '../shiftingLands/personalEndings'
import { PREMADE_CHARACTERS } from '../shiftingLands/characters'

const file = (path: string) => fileURLToPath(new URL(path, import.meta.url))
const read = (path: string) => readFileSync(file(path), 'utf8')

// 1. The shared-endings record: junk reads as empty, unknown ids drop out,
// adding is idempotent, and ids always sit in catalog order.
for (const junk of [
  null,
  undefined,
  'found',
  42,
  [],
  ['open-door'],
  {},
  { version: 2, found: ['open-door'] },
  { version: 1, found: 'open-door' },
  { version: 1, found: { 'open-door': true } },
]) {
  assert.deepEqual(
    readSharedEndingsRecord(junk),
    emptySharedEndingsRecord(),
    `junk ${JSON.stringify(junk)} reads as an empty record`,
  )
}
assert.deepEqual(
  readSharedEndingsRecord({
    version: 1,
    found: ['tribute', 'not-an-ending', 7, null, 'open-door', 'open-door'],
  }),
  { version: 1, found: ['open-door', 'tribute'] },
  'unknown ids drop and the rest come back once each, in catalog order',
)

const empty = emptySharedEndingsRecord()
const once = withSharedEnding(empty, 'commons')
assert.notEqual(once, empty)
assert.deepEqual(once.found, ['commons'])
assert.deepEqual(empty.found, [], 'adding never mutates the old record')
assert.equal(withSharedEnding(once, 'commons'), once, 'adding is idempotent')
assert.equal(
  withSharedEnding(once, 'not-an-ending'),
  once,
  'an unknown id changes nothing',
)
const several = [
  'restitution',
  'shared-well',
  'commons',
  'unnamed-road',
].reduce(withSharedEnding, emptySharedEndingsRecord())
assert.deepEqual(several.found, [
  'shared-well',
  'unnamed-road',
  'commons',
  'restitution',
])
assert.deepEqual(
  readSharedEndingsRecord(JSON.parse(JSON.stringify(several))),
  several,
  'a stored record round-trips',
)

assert.equal(sharedEndingId('The Door Held Open'), 'open-door')
assert.equal(sharedEndingId('A Title Nobody Wrote'), null)
assert.equal(sharedEndingId(null), null)
assert.equal(sharedEndingId('toString'), null, 'no prototype keys')

const page = sharedScrapbook(several)
assert.equal(page.total, 19)
assert.equal(page.found, 4)
assert.deepEqual(
  page.endings.map((ending) => ending.id),
  SHARED_ENDING_IDS,
)
for (const ending of page.endings) {
  assert.equal(ending.plate, sharedEndingPlate(ending.title))
  assert.equal(ending.found, several.found.includes(ending.id))
}
assert.equal(sharedScrapbook(emptySharedEndingsRecord()).found, 0)

// 2. Every plate title is a real shared ending title, and every shared ending
// title has a plate: the ten mark endings, the two V7 retitles and the seven
// moral constellations.
const titles = (source: string, pattern: RegExp) =>
  [...source.matchAll(pattern)].map((match) => match[1] ?? match[2]!)
const markTitles = titles(
  read('../shiftingLands/endingsV6.ts'),
  /title:\s*(?:'([^']+)'|"([^"]+)")/g,
)
const retitles = titles(
  read('../shiftingLands/endingsV7.ts'),
  /title:\s*[^,]*?\?\s*(?:'([^']+)'|"([^"]+)")/g,
)
const constellationTitles = titles(
  read('../shiftingLands/endingsConstellationsV7.ts'),
  /title:\s*(?:'([^']+)'|"([^"]+)")/g,
)
assert.equal(markTitles.length, 10)
assert.deepEqual(retitles, [
  'The Debt Carried Open',
  'A Road Wide Enough for Everyone',
])
assert.equal(constellationTitles.length, 7)
const sharedTitles = [...markTitles, ...retitles, ...constellationTitles]
assert.equal(new Set(sharedTitles).size, 19)
assert.deepEqual(
  Object.keys(SHARED_ENDING_PLATES).toSorted(),
  sharedTitles.toSorted(),
  'the plate catalog lists exactly the shared ending titles',
)
assert.equal(new Set(SHARED_ENDING_IDS).size, 19, 'plate ids are distinct')
for (const id of SHARED_ENDING_IDS)
  assert.ok(
    existsSync(file(`../../public/shifting-lands/endings/${id}.webp`)),
    `${id}.webp ships`,
  )

// 3. Traveler pages: one per premade with a personal road, three endings
// each, in roster order.
const travelers = personalScrapbook(emptyPersonalEndingsRecord())
assert.deepEqual(
  travelers.map((traveler) => traveler.characterId),
  PREMADE_CHARACTERS.map((entry) => entry.id).filter((id) =>
    PERSONAL_ROAD_IDS.includes(id),
  ),
)
assert.ok(travelers.length > 0)
for (const traveler of travelers) {
  assert.equal(traveler.total, 3)
  assert.equal(traveler.found, 0)
}

// 4. The store owns the record; components only read it.
const store = read('../../stores/shiftingLandsJourneyStore.ts')
assert.match(
  store,
  /const SHARED_ENDINGS_KEY = 'kr\.shiftingLands\.sharedEndings\.v1'/,
)
assert.match(
  store,
  /function noteSharedEnding\(\) \{\s+if \(!finished\.value\) return/,
)
assert.match(store, /sharedEndingId\(sharedEnding\.value\?\.title\)/)
assert.match(
  store,
  /notePersonalEnding\(\)\s+noteSharedEnding\(\)\s+persist\(\)/,
)
assert.match(store, /readSharedEndingsRecord\(JSON\.parse\(found\)\)/)

const board = read('../../components/shifting-lands-journey-board.vue')
const title = read('../../components/shifting-lands-title.vue')
const scrapbook = read('../../components/shifting-lands-scrapbook.vue')
assert.match(
  board,
  /const titleOpen = ref\(true\)/,
  'each visit opens on the title',
)
assert.match(board, /<ShiftingLandsTitle/)
assert.match(board, /<ShiftingLandsScrapbook v-if="scrapbookOpen"/)
assert.match(board, /data-testid="shifting-lands-title-menu"/)
assert.match(board, /data-testid="shifting-lands-scrapbook-menu"/)
assert.match(
  board,
  /askNewJourney\(\)/,
  'a journey in progress still asks first',
)
for (const source of [board, title, scrapbook])
  assert.doesNotMatch(source, /\b(?:localStorage|\$fetch|fetch\()\b/)
assert.match(title, /characterPortrait\(game\.character\)/)
assert.doesNotMatch(title, /Zuzu walks|Zuzu's|as Zuzu/)
assert.match(scrapbook, /class="kr-scroll/)
assert.match(scrapbook, /game\.personalScrapbookPages/)
assert.match(scrapbook, /game\.sharedScrapbookPage\.endings/)
assert.match(scrapbook, /\?\?\?/)

const workflow = read('../../.github/workflows/shifting-lands-gameplay.yml')
assert.match(
  workflow,
  /run: npx tsx utils\/scripts\/verifyShiftingScrapbook\.test\.ts/,
)
assert.match(workflow, /components\/shifting-lands-title\.vue/)
assert.match(workflow, /components\/shifting-lands-scrapbook\.vue/)

console.log(
  `verifyShiftingScrapbook: ${SHARED_ENDING_IDS.length} shared endings, ${travelers.length} traveler pages`,
)
