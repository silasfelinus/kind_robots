// /utils/scripts/verifyCabinetRescueRallySaves.test.ts
//
// Rescue Rally's saves survive a quit at any moment (conductor kr-arcade t-038): whatever a player has
// earned (friends home, golden chips, the clear, medals, Time Attack bests, the furthest district) is
// on `save` the tick it is earned, the way the cabinet keeps it (retire -> keepSave -> the store's
// withSave -> localStorage JSON -> sanitizeSaves -> `resume`). The campaign clear is kept the moment
// the ending starts; every mode keeps its records, including after a new rally from a checkpoint.
//
//   npx tsx utils/scripts/verifyCabinetRescueRallySaves.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import mod from '../arcade/games/rescueRally'
import { DISTRICTS, districtStart } from '../arcade/rescueRally/districts'
import { medalKey } from '../arcade/rescueRally/modes'
import { sanitizeSaves, withSave } from '../arcade/saves'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'

/* eslint-disable @typescript-eslint/no-explicit-any */

const SLUG = 'rescue-rally'
const quiet = { play: () => {} }
const make = (resume?: unknown, seed = 3) =>
  mod.create({
    rng: mulberry32(seed),
    sound: quiet,
    demo: false,
    hiScore: 0,
    resume,
  }) as any

/** The player quits now: the cabinet keeps `save`, the store writes it, the next visit reads it back. */
function quitAndReturn(game: any, seed = 4) {
  const save = game.save
  assert.notEqual(save, undefined, 'a real game always offers a save')
  const stored = withSave({}, SLUG, save)
  const disk = JSON.parse(JSON.stringify(stored))
  const back = sanitizeSaves(disk)[SLUG]
  assert.ok(back, 'the save survives the store')
  return make(back, seed)
}

const press = (...buttons: (keyof InputFrame['held'])[]) => {
  const f = emptyInput()
  for (const b of buttons) {
    f.held[b] = true
    f.pressed[b] = true
  }
  return f
}
const idle = (game: any, ticks: number) => {
  for (let t = 0; t < ticks; t++) game.update(emptyInput())
}
function emptyArena(game: any) {
  Object.assign(game, {
    foes: [],
    family: [],
    arrivals: [],
    bolts: [],
    shots: [],
    pickups: [],
    boss: null,
    banner: null,
    ventPower: true,
  })
}
function rescue(game: any) {
  const h = game.heroes[0]
  game.family.push({
    id: 999,
    kind: 'cat',
    x: h.x + 4,
    y: h.y,
    vx: 0,
    vy: 0,
    turn: 999,
    color: '#fff',
    skin: '#fff',
    state: 'calm',
    clock: 0,
    immune: 0,
    seat: 0,
    slot: 0,
  })
}

// --- a medal, kept the moment it is won ------------------------------------------------------------
{
  const game = make()
  game.begin('campaign')
  game.startWave(2)
  emptyArena(game)
  game.familyTotal = 0
  game.update(emptyInput())
  assert.ok(game.medals[medalKey(0, 1)] > 0)
  // Quit before the next wave even starts.
  const back = quitAndReturn(game)
  assert.equal(
    back.medals[medalKey(0, 1)],
    game.medals[medalKey(0, 1)],
    'the medal survives',
  )
}

// --- friends home, kept as they come home ------------------------------------------------------------
{
  const game = make()
  game.begin('campaign')
  emptyArena(game)
  game.arrivals = [{ tick: 1e9, kind: 'drone', count: 1, from: 'vents' }]
  rescue(game)
  game.update(emptyInput())
  assert.equal(game.friends, 1)
  const back = quitAndReturn(game)
  assert.equal(back.friends, 1, 'the friend is still at the Shelter')
}

// --- a golden chip, kept mid-district ---------------------------------------------------------------
{
  const game = make()
  game.begin('campaign')
  game.startWave(3)
  emptyArena(game)
  game.familyTotal = 1
  game.familySaved = 1
  game.update(emptyInput())
  assert.ok(game.chips.has('plaza'))
  const back = quitAndReturn(game)
  assert.ok(
    back.chips.has('plaza'),
    'the chip survives a quit before the next checkpoint',
  )
  // And a new rally keeps it too: chips are earned for good.
  const fresh = quitAndReturn(back)
  assert.ok(fresh.chips.has('plaza'))
}

// --- the clear, kept when the ending starts (credits watched or not) ------------------------------
{
  const game = make()
  game.begin('campaign')
  game.startWave(districtStart(DISTRICTS.length - 1) + 7)
  game.boss.down = 2
  game.foes = []
  game.arrivals = []
  for (let t = 0; t < 300 && !game.ending; t++) game.update(emptyInput())
  assert.ok(game.ending, 'the credits are rolling')
  // Quit during the credits.
  const back = quitAndReturn(game)
  assert.equal(back.cleared, true, 'the clear survives')
  assert.equal(back.save.cleared, true)
  // And the rally comes back past the Core, at the start of the next time round the city.
  assert.ok(back.offer, 'offered')
  assert.equal(back.offer.district, 0)
  assert.equal(back.offer.loop, 2)
  back.update(press('a'))
  assert.equal(back.level, districtStart(0, 2), 'not the Glitch Core again')
  // A new rally from there keeps the clear and the chips.
  const anew = quitAndReturn(back)
  anew.update(press('down'))
  anew.update(press('a'))
  assert.equal(anew.cleared, true, 'a new rally keeps the clear')
  assert.equal(anew.save.cleared, true)
}

// --- the Reunion and the true ending survive a quit ---------------------------------------------
{
  const game = make()
  game.begin('campaign')
  game.startWave(districtStart(DISTRICTS.length - 1))
  // The fifth chip is found in the last district, after its checkpoint.
  for (const d of DISTRICTS) game.chips.add(d.id)
  game.keepRecords()
  game.startWave(districtStart(DISTRICTS.length - 1) + 7)
  game.boss.down = 2
  game.foes = []
  game.arrivals = []
  for (let t = 0; t < 300 && !game.script.reunion; t++)
    game.update(emptyInput())
  assert.equal(game.script.reunion, true)
  // Quit on the roof.
  const roof = quitAndReturn(game)
  assert.equal(roof.chips.size, 5, 'all five chips survive')
  assert.equal(roof.cleared, true, 'the Core counts as beaten')
  assert.ok(roof.offer?.reunion, 'the Reunion is offered')
  roof.update(press('a'))
  assert.equal(roof.script.reunion, true, 'straight back to the roof')
  assert.ok(!roof.boss, 'not the Glitch Core again')
  // Greet everyone, then quit while the true ending's credits roll.
  for (let t = 0; t < 60 * 60 && !roof.ending; t++) {
    const r = roof.family[0]
    if (r) Object.assign(roof.heroes[0], { x: r.x, y: r.y })
    roof.update(emptyInput())
  }
  assert.ok(roof.ending?.trueEnding, 'the true ending rolls')
  idle(roof, 30)
  const after = quitAndReturn(roof)
  assert.equal(after.save.trueEnding, true, 'the true ending survives')
  assert.equal(after.save.cleared, true)
  assert.equal(after.chips.size, 5)
  assert.equal(after.offer?.reunion ?? false, false, 'no second Reunion')
  assert.equal(after.offer?.loop, 2, 'the next time round')
}

// --- Time Attack, after a new rally from a checkpoint ----------------------------------------------
{
  // A campaign that reached the Toy Factory, saved at its checkpoint.
  const first = make()
  first.begin('campaign')
  first.startWave(districtStart(1))
  first.medals = { [medalKey(0, 0)]: 3 }
  first.keepRecords()
  const checkpoint = quitAndReturn(first)
  assert.ok(checkpoint.offer, 'the checkpoint is offered')
  // Start a new rally instead, then play Time Attack.
  checkpoint.update(press('down'))
  checkpoint.update(press('a'))
  assert.ok(checkpoint.menu, 'the menu')
  assert.equal(checkpoint.reached, 1, 'what the campaign reached is kept')
  assert.equal(checkpoint.medals[medalKey(0, 0)], 3, 'and the medals')
  checkpoint.begin('timeattack', 1)
  checkpoint.startWave(districtStart(1) + 7)
  checkpoint.attackTicks = 60 * 240
  emptyArena(checkpoint)
  idle(checkpoint, 200)
  assert.ok(checkpoint.result)
  // Quit on the result card.
  const back = quitAndReturn(checkpoint)
  assert.ok(back.times.factory > 0, 'the best time survives')
  assert.equal(back.medals[medalKey(0, 0)], 3, 'and the medals')
  assert.equal(back.save.district, 0, 'the new rally is the checkpoint now')
}

// --- Rally 100 and Classic never wipe the records -------------------------------------------------
{
  const game = make()
  game.medals = { [medalKey(2, 3)]: 7 }
  game.times = { dome: 1234 }
  game.reached = 2
  game.keepRecords()
  const back = quitAndReturn(game)
  back.update(emptyInput())
  idle(back, 10)
  back.update(press('down'))
  back.update(press('a'))
  assert.equal(back.mode, 'rally100')
  back.lives = 0
  back.heroes[0].alive = false
  idle(back, 200)
  assert.ok(back.over)
  const again = quitAndReturn(back)
  assert.equal(again.medals[medalKey(2, 3)], 7, 'the medals survive Rally 100')
  assert.equal(again.times.dome, 1234)
  assert.equal(again.reached, 2)
  again.begin('classic')
  again.lives = 0
  again.heroes[0].alive = false
  idle(again, 200)
  const last = quitAndReturn(again)
  assert.equal(last.medals[medalKey(2, 3)], 7, 'and Classic Rally')
  assert.equal(last.times.dome, 1234)
}

// --- every save fits the store ---------------------------------------------------------------------
{
  const game = make()
  for (let d = 0; d < DISTRICTS.length; d++)
    for (let i = 0; i < 8; i++) game.medals[medalKey(d, i)] = 7
  for (const d of DISTRICTS) {
    game.times[d.id] = 60 * 60 * 9
    game.chips.add(d.id)
  }
  game.friends = 999_999
  game.keepRecords()
  const back = quitAndReturn(game)
  assert.equal(Object.keys(back.medals).length, 40, 'a full medal board fits')
  assert.equal(back.chips.size, 5)
}

console.log('verifyCabinetRescueRallySaves: ok')
