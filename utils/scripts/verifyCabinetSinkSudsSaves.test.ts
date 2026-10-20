// /utils/scripts/verifyCabinetSinkSudsSaves.test.ts
//
// Sink Suds earned records through the cabinet's own save path (conductor kr-arcade/t-149): a
// later-room checkpoint with prior medals and times, New Wash, a staged Squeaky Clean basin, then
// the way the cabinet keeps it on leaving (retire -> keepSave -> the store's withSave ->
// localStorage JSON -> sanitizeSaves -> `resume`). The campaign checkpoint resets; the records stay.
//
//   npx tsx utils/scripts/verifyCabinetSinkSudsSaves.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import mod from '../arcade/games/sinkSuds'
import { sanitizeSaves, withSave } from '../arcade/saves'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import { medalKey, modesFor } from '../arcade/sinkSuds/modes'

/* eslint-disable @typescript-eslint/no-explicit-any */

const SLUG = 'sink-suds'
const quiet = { play: () => {} }
const make = (resume?: unknown, seed = 3) =>
  mod.create({
    rng: mulberry32(seed),
    sound: quiet,
    demo: false,
    hiScore: 0,
    resume,
  }) as any

const press = (...buttons: (keyof InputFrame['held'])[]) => {
  const f = emptyInput()
  for (const b of buttons) {
    f.held[b] = true
    f.pressed[b] = true
  }
  return f
}
const idle = () => emptyInput()

/** The player leaves now: the cabinet keeps `save`, the store writes it, the next visit reads it. */
function quitAndReturn(game: any, seed = 4) {
  const save = game.save
  assert.notEqual(save, undefined, 'a real game always offers a save')
  const disk = JSON.parse(JSON.stringify(withSave({}, SLUG, save)))
  const back = sanitizeSaves(disk)[SLUG]
  assert.ok(back, 'the save survives the store')
  return make(back, seed)
}

function chooseSqueaky(g: any) {
  const index = modesFor(1).findIndex((m) => m.id === 'squeaky')
  for (let i = 0; i < index; i++) g.update(press('down'))
  g.update(press('a'))
  assert.equal(g.mode, 'squeaky')
}
function finishStagedBasin(g: any) {
  g.pests = []
  for (let t = 0; t < 120; t++) g.update(idle())
  for (let y = 0; y < 360; y += 4)
    for (let x = 0; x < 420; x += 4) g.grime.scrub(x, y, 6)
  g.update(idle())
  assert.ok(g.result, 'scrubbed 95% clean: the clock stops')
}

const key = medalKey('kitchen', 0)
const checkpoint = {
  v: 1,
  step: 5,
  score: 12_000,
  lives: 2,
  bars: 9,
  puff: true,
  skins: ['starry'],
  skin: 'starry',
  golden: ['kitchen'],
  cleared: true,
  medals: { 'kitchen:1': 7, 'kitchen:3': 1 },
  times: { 'laundry:2': 4_000 },
  reached: 3,
}

// --- New Wash -> Squeaky Clean -> leave -> return: new and old records persist -------------------
{
  const g = make(checkpoint)
  assert.ok(g.offer, 'a later-room checkpoint offers to continue')
  g.update(press('b'))
  assert.ok(g.menu, 'New Wash opens the mode menu')
  chooseSqueaky(g)
  finishStagedBasin(g)
  assert.ok(g.times[key], 'the staged basin has a time')

  const back = quitAndReturn(g)
  assert.equal(
    back.offer,
    null,
    'the campaign checkpoint is gone: nothing to continue',
  )
  assert.ok(back.menu, 'the next visit opens on the menu')
  assert.equal(back.save?.step, 0)
  assert.equal(back.times[key], g.times[key], 'the new best time persisted')
  assert.equal(back.times['laundry:2'], 4_000, 'the older time persisted')
  assert.deepEqual(back.medals, checkpoint.medals, 'medals persisted')
  assert.equal(back.reached, 3, 'rooms reached persisted')
  assert.equal(back.skin, 'starry', 'the skin persisted')
  assert.deepEqual([...back.golden], ['kitchen'], 'golden soaps persisted')
  assert.equal(back.cleared, true, 'the clear persisted')
  assert.equal(back.score, 0, 'the campaign score reset')
  assert.equal(back.bars, 0, 'the campaign bars reset')

  // A second leave-and-return changes nothing.
  const again = quitAndReturn(back, 5)
  assert.equal(again.times[key], g.times[key])
  assert.deepEqual(again.medals, checkpoint.medals)
}

// --- A slower run never replaces a better stored time ---------------------------------------------
{
  const g = make({ ...checkpoint, times: { ...checkpoint.times, [key]: 5 } })
  g.update(press('b'))
  chooseSqueaky(g)
  finishStagedBasin(g)
  assert.equal(g.times[key], 5, 'the better stored time stands')
  const back = quitAndReturn(g)
  assert.equal(back.times[key], 5)
  assert.equal(back.times['laundry:2'], 4_000)
}

// --- Leaving straight after New Wash is its own transition ------------------------------------------
{
  const g = make(checkpoint)
  g.update(press('b'))
  assert.ok(g.menu)
  const back = quitAndReturn(g)
  assert.equal(back.offer, null, 'no checkpoint comes back')
  assert.ok(back.menu)
  assert.equal(back.save?.step, 0)
  assert.deepEqual(back.medals, checkpoint.medals)
  assert.deepEqual(back.times, checkpoint.times)
  assert.equal(back.reached, 3)
  assert.equal(back.skin, 'starry')
  assert.deepEqual([...back.golden], ['kitchen'])
  assert.equal(back.cleared, true)
}

console.log('verifyCabinetSinkSudsSaves: ok')
