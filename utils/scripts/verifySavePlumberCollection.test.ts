import assert from 'node:assert/strict'
import {
  mergePlumberAlbum,
  readPlumberFile,
  type PlumberSlot,
} from '../arcade/games/savePlumberSave'
import { stageNode } from '../arcade/games/savePlumberOverworld'
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

console.log('Save the Plumber persistent collection and ending gallery contract passed')
