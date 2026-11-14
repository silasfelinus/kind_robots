import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ENDING_IDS, scene, startRun } from '../zuzuGamebook/adventure'
import { sectionPlate } from '../zuzuGamebook/art'
import { validZuzuAccountSave } from '../zuzuGamebook/accountSave'
import {
  BOOK_ONE_CAST,
  castFromLocalJourney,
  decodeCastCollection,
  newlyEncounteredCast,
} from '../zuzuGamebook/cast'
import {
  SCRAPBOOK_LIMIT,
  addJourney,
  captureJourney,
  decodeScrapbook,
} from '../zuzuGamebook/scrapbook'

for (const ending of ENDING_IDS) {
  assert.ok(
    sectionPlate(scene(ending)).artImageId,
    `${ending} must have a delivered painted plate`,
  )
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
assert.deepEqual(
  decodeScrapbook(JSON.stringify({ version: 999, runs: [memory] })),
  [],
)
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
  memories.reduce(
    (existing, item) => addJourney(existing, item),
    [] as typeof memories,
  ).length,
  SCRAPBOOK_LIMIT,
)

assert.equal(BOOK_ONE_CAST.length, 7)
for (const person of BOOK_ONE_CAST)
  assert.equal(scene(person.sceneId).id, person.sceneId)

const beforeMeeting = startRun(61)
const afterMeeting = {
  ...beforeMeeting,
  sceneId: 'survivors',
  visited: [...beforeMeeting.visited, 'survivors'],
  flags: [...beforeMeeting.flags, 'met:hollis'],
}
assert.deepEqual(newlyEncounteredCast(beforeMeeting, afterMeeting), [
  'ling',
  'bao',
  'hollis',
])
assert.deepEqual(castFromLocalJourney(afterMeeting), ['ling', 'bao', 'hollis'])
assert.deepEqual(newlyEncounteredCast(afterMeeting, afterMeeting), [])
const importedHistory = {
  ...afterMeeting,
  sceneId: 'dust-road',
  visited: [...afterMeeting.visited, 'dust-road'],
}
assert.deepEqual(newlyEncounteredCast(afterMeeting, importedHistory), [])
const afterWren = {
  ...afterMeeting,
  sceneId: 'a5-wren-talk',
  visited: [...afterMeeting.visited, 'a5-wren-talk'],
  flags: [...afterMeeting.flags, 'met:wren'],
}
assert.deepEqual(newlyEncounteredCast(afterMeeting, afterWren), ['wren'])
assert.deepEqual(
  decodeCastCollection({
    version: 1,
    ids: ['ling', 'ling', 'wren', 'invalid'],
  }),
  ['ling', 'wren'],
)
assert.deepEqual(decodeCastCollection({ version: 2, ids: ['ling'] }), [])
assert.deepEqual(decodeCastCollection(['ling']), [])

const firstCoyoteGift = {
  ...beforeMeeting,
  flags: [...beforeMeeting.flags, 'coyote-kindness'],
}
assert.deepEqual(newlyEncounteredCast(beforeMeeting, firstCoyoteGift), [
  'coyote',
])
assert.deepEqual(newlyEncounteredCast(firstCoyoteGift, firstCoyoteGift), [])

const cloud = {
  version: 1,
  run: first,
  recoverable: null,
  endings: ['ending-bell'],
  played: ['ending-bell'],
  cast: ['coyote'],
  scrapbook: [memory],
}
assert.equal(validZuzuAccountSave(cloud), true)
assert.equal(validZuzuAccountSave({ ...cloud, endings: ['unknown'] }), false)
assert.equal(
  validZuzuAccountSave({ ...cloud, cast: ['coyote', 'coyote'] }),
  false,
)
assert.equal(validZuzuAccountSave({ ...cloud, recoverable: {} }), false)
assert.equal(validZuzuAccountSave({ ...cloud, version: 2 }), false)
assert.equal(
  validZuzuAccountSave({
    ...cloud,
    run: { ...first, visited: Array(90_000).fill('coyote') },
  }),
  false,
  'Account backups must be bounded even when a run passes legacy validation',
)

const readAccount = readFileSync('server/api/zuzu-gamebook/save.get.ts', 'utf8')
const writeAccount = readFileSync(
  'server/api/zuzu-gamebook/save.put.ts',
  'utf8',
)
assert.match(readAccount, /requireHumanApiUser/)
assert.match(writeAccount, /requireHumanApiUser/)
assert.match(writeAccount, /expectedRevision/)
assert.match(writeAccount, /updateMany/)
assert.match(writeAccount, /P2002/)

const page = readFileSync('pages/play/zuzu-gamebook.vue', 'utf8')
const front = readFileSync(
  'components/zuzu-gamebook/zuzu-gamebook-front.vue',
  'utf8',
)
const store = readFileSync('stores/zuzuGamebookStore.ts', 'utf8')
assert.match(page, /<zuzu-gamebook-front[\s\S]*?@continue=/)
assert.match(page, /data-testid="zuzu-gamebook-scrapbook"/)
assert.match(page, /data-testid="zuzu-gamebook-cast"/)
assert.match(page, /data-testid="zuzu-gamebook-account-save"/)
assert.match(page, /store\.beginAccountSave\(\)/)
assert.match(page, /store\.restoreAccountCopy\(\)/)
assert.match(store, /accountStatus/)
assert.match(store, /accountRevision/)
assert.match(store, /accountStatus\.value = 'conflict'/)
assert.match(page, /BOOK_ONE_CAST\.length/)
assert.match(store, /newlyEncounteredCast\(before, after\)/)
assert.match(store, /discoveredCast/)
const importStart = store.indexOf('function importCode(')
const importSlice = store.slice(
  importStart,
  store.indexOf('  return {', importStart),
)
assert.doesNotMatch(
  importSlice,
  /rememberCast\(/,
  'foreign save codes must not unlock a cast',
)
assert.match(page, /scene\(ending\)\.title/)
assert.match(page, /sceneArt\(ending\)/)
assert.match(front, /data-testid="zuzu-gamebook-title"/)
assert.match(front, /data-testid="zuzu-gamebook-continue"/)
assert.match(front, /game-achievement-strip game="zuzu-gamebook"/)
assert.match(store, /captureJourney\(run.value/)
console.log(
  'Zuzu title, settings, painted endings and scrapbook contracts passed',
)
