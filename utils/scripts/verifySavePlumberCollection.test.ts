import assert from 'node:assert/strict'
import {
  PLUMBER_ENDINGS,
  PLUMBER_ENDING_COPY,
  earnedPlumberEndings,
  mergePlumberAlbum,
  plumberFinaleEnding,
  readPlumberFile,
  type PlumberSlot,
} from '../arcade/games/savePlumberSave'
import {
  SECRET_EXITS_READY,
  stageNode,
} from '../arcade/games/savePlumberOverworld'
import { GEAR_COURSE_CODES } from '../arcade/games/savePlumberLevels'
import { createSavePlumberPreview } from '../arcade/games/savePlumberPreview'
import { rosterIndex } from '../arcade/games/savePlumberRoster'

const start: PlumberSlot = {
  heroine: 11,
  stage: 0,
  score: 450,
  lives: 3,
  tokens: 20,
  done: [stageNode('1-1')!.id],
  gears: ['1-1'],
  deaths: 2,
  time: 140,
}
const finale: PlumberSlot = {
  ...start,
  heroine: 22,
  stage: 31,
  done: [stageNode('8-4')!.id],
  gears: ['8-4'],
  cleared: true,
}
const first = readPlumberFile({
  v: 3,
  active: 0,
  slots: [start, null, finale],
  endlessBest: 90,
})
assert.deepEqual(first.album.gears, ['1-1', '8-4'])
assert.deepEqual(first.album.done, [stageNode('1-1')!.id, stageNode('8-4')!.id])
assert.ok(first.album.heroines.includes(rosterIndex(11)))
assert.ok(first.album.heroines.includes(rosterIndex(22)))
assert.deepEqual(first.album.endings, ['rivers-run-home'])
assert.equal(first.endlessBest, 90)

const slotsReplaced = readPlumberFile({
  ...first,
  slots: [null, null, null],
})
assert.deepEqual(
  slotsReplaced.album,
  first.album,
  'replacing local save files cannot delete collection memories',
)

const reopened = createSavePlumberPreview({
  rng: () => 0.5,
  sound: { play() {} },
  demo: false,
  hiScore: 0,
  resume: slotsReplaced,
})
assert.deepEqual(
  readPlumberFile(reopened.save).album,
  first.album,
  'the cabinet must serialize the album even with no remaining run slots',
)

const later = mergePlumberAlbum(slotsReplaced.album, [
  { ...start, gears: ['2-1'], done: [stageNode('2-1')!.id] },
  null,
  null,
])
assert.deepEqual(later.gears, ['1-1', '8-4', '2-1'])
assert.ok(later.done.includes(stageNode('2-1')!.id))
assert.deepEqual(later.endings, ['rivers-run-home'])

const tampered = readPlumberFile({
  v: 3,
  active: 0,
  slots: [null, null, null],
  album: {
    done: ['not-a-node'],
    secrets: ['not-a-node'],
    gears: ['fake-stage'],
    heroines: [-1, 99],
    endings: ['not-a-real-ending'],
  },
})
assert.deepEqual(tampered.album, {
  done: [],
  secrets: [],
  gears: [],
  heroines: [],
  endings: [],
})

const legacy = readPlumberFile({
  v: 1,
  heroine: 11,
  stage: 2,
  score: 100,
  lives: 3,
  tokens: 2,
  gears: ['1-1'],
})
assert.equal(legacy.v, 3)
assert.deepEqual(legacy.album.gears, ['1-1'])
assert.ok(legacy.album.done.includes(stageNode('1-1')!.id))
assert.deepEqual(legacy.album.endings, [])

// Multiple endings (conductor save-the-plumber t-028): every clear earns the base ending; every Golden Gear and
// every playable secret exit each add their own, and the finale shows the rarest.
const allGears = [...GEAR_COURSE_CODES]
const allSecrets = [...SECRET_EXITS_READY]
assert.ok(allSecrets.length > 0, 'at least one secret exit is playable')
assert.deepEqual(
  earnedPlumberEndings({ gears: allGears, secrets: allSecrets }),
  [],
)
assert.deepEqual(earnedPlumberEndings({ cleared: true }), ['rivers-run-home'])
assert.deepEqual(
  earnedPlumberEndings({ cleared: true, gears: allGears.slice(1) }),
  ['rivers-run-home'],
  'one missing gear withholds the clockwork gift',
)
assert.deepEqual(earnedPlumberEndings({ cleared: true, gears: allGears }), [
  'rivers-run-home',
  'clockwork-gift',
])
assert.deepEqual(earnedPlumberEndings({ cleared: true, secrets: allSecrets }), [
  'rivers-run-home',
  'open-tap',
])
assert.equal(plumberFinaleEnding({}), 'rivers-run-home')
assert.equal(plumberFinaleEnding({ gears: allGears }), 'clockwork-gift')
assert.equal(
  plumberFinaleEnding({ gears: allGears, secrets: allSecrets }),
  'open-tap',
)
const completionist = readPlumberFile({
  v: 3,
  active: 0,
  slots: [
    { ...finale, gears: allGears },
    { ...finale, secrets: allSecrets },
    null,
  ],
  endlessBest: 0,
})
assert.deepEqual(completionist.album.endings, [...PLUMBER_ENDINGS])
assert.deepEqual(
  readPlumberFile({ ...completionist, slots: [null, null, null] }).album
    .endings,
  [...PLUMBER_ENDINGS],
  'erasing the files keeps every discovered ending',
)
for (const key of PLUMBER_ENDINGS) {
  const copy = PLUMBER_ENDING_COPY[key]
  assert.ok(copy.title && copy.gallery && copy.hint && copy.plate, key)
  assert.ok(
    copy.lines.every(
      (line) => line.replace('{name}', 'Marigold-Spark').length <= 70,
    ),
    `${key} finale lines fit the canvas`,
  )
}
const finaleRun = createSavePlumberPreview({
  rng: () => 0.5,
  sound: { play() {} },
  demo: false,
  hiScore: 0,
  resume: completionist,
})
assert.equal(
  (finaleRun as unknown as { finaleEnding: string }).finaleEnding,
  'clockwork-gift',
  'the finale reads the active file: slot 1 holds every gear',
)

console.log(
  'Save the Plumber persistent collection and ending gallery contract passed',
)
