// /utils/scripts/verifyCabinetButterflyBlasterModes.test.ts
//
// Butterfly Blaster depth slice 4, part 1 (conductor kr-arcade t-058, depth-pass/CABINETS.md
// section 6, "Modes"): the menu of modes (the Season, Long Night, Region Time Attack, Classic
// Night), the three medals and their board, and a save that keeps them all.
//
//   npx tsx utils/scripts/verifyCabinetButterflyBlasterModes.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import mod, { readBlasterSave } from '../arcade/games/butterflyBlaster'
import {
  LASSO_MASTER,
  MENU,
  classicNight,
  clock,
  medalCount,
  medalKey,
  medalsWon,
  openRegions,
  parTicks,
  readMedals,
  readTimes,
} from '../arcade/butterflyBlaster/modes'
import { REGIONS, THREAD_REGIONS } from '../arcade/butterflyBlaster/season'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'

/* eslint-disable @typescript-eslint/no-explicit-any */

const quiet = { play: () => {} }
const make = (resume?: unknown, seed = 3) =>
  mod.create({
    rng: mulberry32(seed),
    sound: quiet,
    demo: false,
    hiScore: 0,
    resume,
  }) as any
const press = (...b: Array<keyof InputFrame['held']>) => {
  const f = emptyInput()
  for (const k of b) {
    f.held[k] = true
    f.pressed[k] = true
  }
  return f
}
const idle = (g: any, n: number) => {
  for (let i = 0; i < n; i++) g.update(emptyInput())
}
/** Pick menu row i with A. */
function choose(g: any, row: number, right = 0) {
  idle(g, 10)
  for (let i = 0; i < row; i++) g.update(press('down'))
  for (let i = 0; i < right; i++) g.update(press('right'))
  g.update(press('a'))
}

// --- the menu ---------------------------------------------------------------------------------------
{
  assert.deepEqual(
    MENU.map((m) => m.id),
    ['season', 'longnight', 'timeattack', 'classic', 'coop', 'board'],
  )
  const g = make()
  assert.equal(g.phase, 'menu', 'a fresh watch opens on the menu')
  assert.equal(g.music, null)
  choose(g, 0)
  assert.equal(g.phase, 'map', 'the Season opens on the river map')
  assert.equal(g.mode, 'season')

  const demo = mod.create({
    rng: mulberry32(1),
    sound: quiet,
    demo: true,
    hiScore: 0,
  }) as any
  assert.notEqual(demo.phase, 'menu', 'the attract demo skips the menu')
}

// --- Long Night -------------------------------------------------------------------------------------
{
  const g = make()
  choose(g, 1)
  assert.equal(g.mode, 'longnight')
  assert.equal(g.level, 1)
  assert.equal(g.inEndless, true)
  const a = g.plan.waves[0]
  assert.ok(
    a.big >= 5 && (a.needles > 0 || a.skimmers > 0),
    'pests already mixed',
  )
  const first = g.region.id
  g.startPlay()
  g.startDawn()
  g.advance()
  assert.equal(g.level, 2, 'the next night follows')
  assert.notEqual(g.region.id, first, 'every night has a new sky')
  assert.equal(g.save.step, 0, 'a Long Night leaves the Season save alone')
}

// --- Classic Night ----------------------------------------------------------------------------------
{
  const g = make()
  choose(g, 3)
  assert.equal(g.mode, 'classic')
  assert.equal(g.phase, 'play', 'no river map in the classic')
  const n1 = classicNight(1)
  assert.equal(n1.waves.length, 1)
  assert.equal(n1.waves[0]!.cloud, false)
  assert.equal(classicNight(3).waves[0]!.cloud, true)
  assert.equal(
    classicNight(30).waves[0]!.big,
    11,
    'it is flat at the top, as it was',
  )
  assert.deepEqual(n1.pools, [])
  assert.equal(n1.waves[0]!.needles, 0)
  // Clear the sky and the next wave comes with no dawn tally.
  g.swarms = []
  g.pests = []
  g.update(emptyInput())
  assert.equal(g.level, 2)
  assert.equal(g.phase, 'play')
  assert.equal(g.score, 0, 'no tally points in the classic')
}

// --- medals -----------------------------------------------------------------------------------------
{
  const night = REGIONS.riverbend.nights[0]!
  const par = parTicks(night)
  assert.ok(par > 3000)
  assert.equal(
    medalsWon({ perfect: true, biggestLoop: 3, ticks: par + 1, night }),
    1,
  )
  assert.equal(
    medalsWon({
      perfect: false,
      biggestLoop: LASSO_MASTER,
      ticks: par + 1,
      night,
    }),
    2,
  )
  assert.equal(
    medalsWon({ perfect: false, biggestLoop: 0, ticks: par, night }),
    4,
  )
  assert.equal(
    medalCount(medalsWon({ perfect: true, biggestLoop: 99, ticks: 1, night })),
    3,
  )

  // Played: a clean, quick night wins Not a Bite and Swift Night.
  const g = make()
  choose(g, 0)
  g.startPlay()
  g.swarms = []
  g.pests = []
  g.biggestLoop = 22
  g.startDawn()
  const key = medalKey('riverbend', 0)
  assert.equal(g.medals[key], 7, 'all three medals')
  assert.equal(g.save.medals[key], 7, 'kept in the save')
  // A later bitten, slow, small night never takes a medal away.
  g.huts[0].bites = 1
  g.biggestLoop = 0
  g.nightTicks = 99999
  g.startPlay()
  g.startDawn()
  assert.equal(g.medals[key], 7)
}

// --- Region Time Attack ----------------------------------------------------------------------------
{
  assert.deepEqual(openRegions(new Map(), false), [])
  assert.deepEqual(openRegions(new Map(), true), [...THREAD_REGIONS])
  // A region opens once its four nights are in the record.
  const record = new Map<number, number>()
  const open = openRegions(record, false)
  assert.equal(open.length, 0)

  const g = make()
  choose(g, 2)
  assert.equal(g.phase, 'menu', 'a closed region does not start')
  const cleared = make({
    ...make().save,
    v: 1,
    step: 0,
    score: 0,
    lives: 3,
    beads: 0,
    owned: [],
    hints: [],
    threads: [],
    record: [],
    cleared: true,
  })
  assert.equal(cleared.phase, 'menu')
  choose(cleared, 2, 1)
  assert.equal(cleared.mode, 'timeattack')
  assert.equal(cleared.region.id, 'terraces')
  assert.equal(cleared.plan.title, REGIONS.terraces.nights[0]!.title)
  for (let night = 0; night < 4; night++) {
    assert.equal(cleared.attack.night, night)
    cleared.startPlay()
    cleared.swarms = []
    cleared.pests = []
    cleared.pools = []
    cleared.special = null
    cleared.attack.ticks += 600
    cleared.startDawn()
    cleared.advance()
  }
  assert.equal(cleared.phase, 'result')
  const t = cleared.attack.done
  assert.ok(t >= 2400)
  assert.equal(cleared.times.terraces, t, 'the best time is kept')
  assert.equal(cleared.save.times.terraces, t)
  assert.equal(cleared.save.cleared, true)
  cleared.update(press('a'))
  idle(cleared, 70)
  cleared.update(press('a'))
  assert.equal(cleared.over, true)
  assert.match(clock(t), /^\d+:\d\d\.\d$/)
}

// --- saves ------------------------------------------------------------------------------------------
{
  assert.deepEqual(readMedals(undefined), {})
  assert.equal(readMedals({ 'riverbend:1': 9 }), null)
  assert.equal(readMedals({ nowhere: 1 }), null)
  assert.deepEqual(readMedals({ 'terraces:4': 5 }), { 'terraces:4': 5 })
  assert.equal(readTimes({ riverbend: -1 }), null)
  assert.deepEqual(readTimes({ delta: 3600 }), { delta: 3600 })

  const g = make()
  choose(g, 0)
  g.startPlay()
  g.swarms = []
  g.pests = []
  g.startDawn()
  g.advance()
  const raw = JSON.parse(JSON.stringify(g.save))
  const back = readBlasterSave(raw)!
  assert.ok(back)
  assert.deepEqual(back.medals, g.save.medals)
  // Junk medals are dropped, not trusted.
  const junk = readBlasterSave({ ...raw, medals: { x: 1 } })!
  assert.deepEqual(junk.medals, {})
  const resumed = make(raw)
  assert.equal(resumed.phase, 'offer')
  assert.deepEqual(resumed.medals, g.medals)
}

// --- pilot probe: every mode's run still ends -----------------------------------------------------
for (const row of [0, 1, 3]) {
  let ended = 0
  for (let seed = 1; seed <= 3; seed++) {
    const g = make(undefined, seed * 77)
    choose(g, row)
    for (let t = 0; t < 60 * 60 * 15 && !g.over; t++) g.update(g.demoInput())
    if (g.over) ended++
  }
  assert.equal(ended, 3, `mode row ${row}: every pilot run ends`)
}

console.log('butterfly blaster modes ok')
