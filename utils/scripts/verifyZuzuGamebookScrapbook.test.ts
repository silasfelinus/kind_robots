import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ENDING_IDS, startRun } from '../zuzuGamebook/adventure'
import { SECTION_PLATES } from '../zuzuGamebook/sectionArt'
import {
  SCRAPBOOK_LIMIT,
  addJourney,
  captureJourney,
  decodeScrapbook,
} from '../zuzuGamebook/scrapbook'

for (const ending of ENDING_IDS) {
  assert.ok(SECTION_PLATES[ending]?.artImageId, `${ending} needs its own registered painted ending plate`)
}

const first = startRun(719)
first.sceneId = 'ending-bell'
first.visited = ['the-crossing', 'coyote', 'ending-bell']
first.flags = ['coyote-kindness', 'sister-free']
first.health = 4
const memory = captureJourney(first, '2026-11-12T08:00:00Z')
assert.equal(memory.ending, 'ending-bell')
assert.equal(memory.pages, 3)
assert.deepEqual(memory.flags, ['coyote-kindness', 'sister-free'])
assert.deepEqual(memory.trail, first.visited)

const text = JSON.stringify({ version: 1, runs: [memory] })
assert.deepEqual(decodeScrapbook(text), [memory])
assert.deepEqual(decodeScrapbook('broken json'), [])
assert.deepEqual(decodeScrapbook(JSON.stringify({ version: 999, runs: [memory] })), [])
assert.deepEqual(
  decodeScrapbook(
    JSON.stringify({
      version: 1,
      runs: [{ ...memory, sceneId: 'nonexistent-scene' }, memory],
    }),
  ),
  [memory],
)
assert.equal(addJourney([memory], memory).length, 1)

const memories = Array.from({ length: SCRAPBOOK_LIMIT + 6 }, (_, index) => ({
  ...memory,
  id: 'journey-' + index,
}))
assert.equal(
  memories.reduce((existing, item) => addJourney(existing, item), [] as typeof memories)
    .length,
  SCRAPBOOK_LIMIT,
)

const page = readFileSync('pages/play/zuzu-gamebook.vue', 'utf8')
const front = readFileSync(
  'components/zuzu-gamebook/zuzu-gamebook-front.vue',
  'utf8',
)
const store = readFileSync('stores/zuzuGamebookStore.ts', 'utf8')
assert.match(page, /<zuzu-gamebook-front[\s\S]*?@continue=/)
assert.match(page, /data-testid="zuzu-gamebook-scrapbook"/)
assert.match(page, /scene\(ending\)\.title/)
assert.match(page, /sceneArt\(ending\)/)
assert.match(front, /data-testid="zuzu-gamebook-title"/)
assert.match(front, /data-testid="zuzu-gamebook-continue"/)
assert.match(front, /game-achievement-strip game="zuzu-gamebook"/)
assert.match(store, /captureJourney\(run.value/)
console.log('Zuzu title, settings, painted endings and scrapbook contracts passed')
