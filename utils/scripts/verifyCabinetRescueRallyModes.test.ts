// /utils/scripts/verifyCabinetRescueRallyModes.test.ts
//
// Rescue Rally depth slice 4 (conductor kr-arcade t-038, depth-pass/CABINETS.md section 1, "Co-op and
// the long rally"): co-op for two to four heroes (a shared multiplier, partners picking each other
// up), the menu of modes (Campaign, Rally 100, District Time Attack, Classic Rally), the medals and
// their board, and the registry entry.
//
//   npx tsx utils/scripts/verifyCabinetRescueRallyModes.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { ARCADE_GAMES } from '../arcade/games'
import mod, { readSave } from '../arcade/games/rescueRally'
import { districtStart } from '../arcade/rescueRally/districts'
import {
  MENU,
  RALLY_CYCLE,
  RALLY_LENGTH,
  classicWave,
  clock,
  medalKey,
  rallyWave,
  readMedals,
} from '../arcade/rescueRally/modes'
import { newFoe } from '../arcade/rescueRally/roster'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'

/* eslint-disable @typescript-eslint/no-explicit-any */

const quiet = { play: () => {} }
const make = (players = 1, resume?: unknown, seed = 3) =>
  mod.create({
    rng: mulberry32(seed),
    sound: quiet,
    demo: false,
    hiScore: 0,
    players,
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
const idle = (game: any, ticks: number, frames?: () => InputFrame[]) => {
  for (let t = 0; t < ticks; t++) {
    const all = frames?.()
    game.update(all?.[0] ?? emptyInput(), all)
  }
}
/** Pick a menu row (0-based) and go. */
function choose(game: any, row: number) {
  idle(game, 10)
  for (let i = 0; i < row; i++) game.update(press('down'))
  game.update(press('a'))
}
function emptyArena(game: any) {
  Object.assign(game, {
    foes: [],
    family: [],
    arrivals: [{ tick: 1e9, kind: 'drone', count: 1, from: 'vents' }],
    bolts: [],
    shots: [],
    pickups: [],
    boss: null,
    banner: null,
    ventPower: true,
  })
}

// --- the registry ----------------------------------------------------------------------------------
{
  const meta = ARCADE_GAMES.find((g) => g.slug === 'rescue-rally')!
  assert.equal(meta.maxPlayers, 4, 'up to four heroes')
  assert.equal(meta.twinStick, true)
  assert.ok(meta.howTo.length >= 5)
  assert.ok(meta.blurb.includes('Rally 100'))
}

// --- the menu ---------------------------------------------------------------------------------------
{
  const game = make()
  assert.ok(game.menu, 'the menu of modes opens first')
  assert.equal(game.level, 1)
  assert.deepEqual(
    MENU.map((m) => m.id),
    ['campaign', 'rally100', 'timeattack', 'classic', 'board'],
  )
  const demo = mod.create({
    rng: mulberry32(1),
    sound: quiet,
    demo: true,
    hiScore: 0,
  }) as any
  assert.equal(demo.menu, null, 'the attract demo plays straight away')
  choose(game, 0)
  assert.equal(game.menu, null)
  assert.equal(game.mode, 'campaign')
  assert.equal(game.save.district, 0, 'the campaign saves')

  const board = make()
  choose(board, 4)
  assert.ok(board.menu.board, 'the medal board opens')
  idle(board, 12)
  board.update(press('a'))
  assert.equal(board.menu.board, false, 'and closes')
}

// --- Rally 100 -------------------------------------------------------------------------------------
{
  assert.ok(RALLY_CYCLE >= 30, 'it walks every non-boss wave of the city')
  for (let n = 1; n <= RALLY_LENGTH; n++) {
    const w = rallyWave(n)
    assert.ok(!w.script.boss, 'no bosses in Rally 100')
    assert.ok(w.loop >= 1 && w.loop <= 4)
  }
  assert.ok(rallyWave(100).loop > rallyWave(1).loop, 'it grows as it goes')
  const game = make()
  choose(game, 1)
  assert.equal(game.mode, 'rally100')
  assert.equal(game.level, 1)
  game.startWave(RALLY_LENGTH)
  emptyArena(game)
  game.arrivals = []
  const score = game.score
  idle(game, 200)
  assert.ok(game.result, 'the finish card')
  assert.ok(game.score - score >= 500_000, 'the finishing bonus')
  idle(game, 60 * 6)
  assert.ok(game.over, 'and the run ends')
  assert.equal(
    game.save?.district ?? 0,
    0,
    'Rally 100 never moves the campaign save',
  )
}

// --- Classic Rally ---------------------------------------------------------------------------------
{
  const w1 = classicWave(1)
  assert.equal(w1.beacon, null, 'no beacon in the classic')
  const kinds = new Set(w1.groups.map((g) => g.kind))
  assert.ok([...kinds].every((k) => ['drone', 'spawner', 'tank'].includes(k)))
  const count = (n: number) =>
    classicWave(n).groups.find((g) => g.kind === 'drone')!.count
  assert.equal(count(1), 14, 'the original curve')
  assert.equal(count(12), count(30), 'flat from wave 12, as the original was')
  const game = make()
  choose(game, 3)
  assert.equal(game.mode, 'classic')
  emptyArena(game)
  game.ventPower = false
  game.waveTick = 60 * 14 - 1
  game.update(emptyInput())
  assert.equal(game.pickups.length, 0, 'no power-ups through the vents')
  // Fifteen reboots in a breath free no squad bot: the original had none.
  game.heroes[0].invuln = 1e9
  for (let i = 0; i < 15; i++)
    game.foes.push(newFoe('drone', { x: 260 + i * 6, y: 182 }, game.rng))
  const aim = emptyInput()
  aim.aim = { x: 1, y: 0 }
  idle(game, 60, () => [aim])
  assert.ok(game.foes.length < 15, 'beams still reboot')
  assert.equal(game.heroes[0].squad, 0, 'but no squad bots')
}

// --- District Time Attack ------------------------------------------------------------------------
{
  const game = make()
  idle(game, 10)
  game.update(press('down'))
  game.update(press('down'))
  game.update(press('right'))
  game.update(press('a'))
  assert.ok(game.menu, 'a district the campaign has not reached is locked')
  game.update(press('left'))
  game.update(press('a'))
  assert.equal(game.mode, 'timeattack')
  assert.equal(game.level, districtStart(0))
  // Clear the district's boss wave: the clock stops and the best time is kept.
  game.startWave(districtStart(0) + 7)
  game.attackTicks = 60 * 200
  emptyArena(game)
  game.arrivals = []
  idle(game, 200)
  assert.ok(game.result, 'the result card')
  assert.equal(game.times.plaza > 0, true, 'a best time')
  assert.equal(clock(game.times.plaza).split(':')[0], '3')
  idle(game, 60 * 6)
  assert.ok(game.over)
  assert.ok(game.save.times.plaza > 0, 'kept on the save')
  // Unlocked once the campaign reaches a district.
  const later = make(1, game.save)
  later.reached = 2
  idle(later, 10)
  later.update(press('down'))
  later.update(press('down'))
  later.update(press('right'))
  later.update(press('right'))
  later.update(press('a'))
  assert.equal(later.mode, 'timeattack')
  assert.equal(later.district, 2, 'the Botanic Dome')
}

// --- medals ----------------------------------------------------------------------------------------
{
  const game = make()
  choose(game, 0)
  game.startWave(2)
  emptyArena(game)
  game.arrivals = []
  game.familyTotal = 2
  game.familySaved = 2
  game.heroes[0].squad = 3
  game.update(emptyInput())
  assert.equal(
    game.medals[medalKey(0, 1)],
    7,
    'Everyone Home, Untouched and Full Squad',
  )
  assert.equal(game.banner.sub, 'ALL THREE MEDALS!')
  const hit = make()
  choose(hit, 0)
  hit.startWave(3)
  emptyArena(hit)
  hit.arrivals = []
  hit.waveHit = true
  hit.familyTotal = 3
  hit.familySaved = 1
  hit.update(emptyInput())
  assert.equal(
    hit.medals[medalKey(0, 2)] ?? 0,
    0,
    'no medals for a hit, a loss and no squad',
  )
  // The board is kept on the save, checked on the way back in.
  const save = game.save
  assert.equal(save.medals[medalKey(0, 1)], 7)
  assert.deepEqual(
    readSave(JSON.parse(JSON.stringify(save)))?.medals,
    save.medals,
  )
  assert.equal(readMedals({ 'plaza:9': 1 }), null, 'no such wave')
  assert.equal(readMedals({ 'plaza:1': 9 }), null, 'no such medal')
  assert.equal(readSave({ ...save, medals: { moon: 1 } }), null)
}

// --- co-op ------------------------------------------------------------------------------------------
{
  for (let players = 2; players <= 4; players++) {
    const game = make(players)
    assert.equal(game.heroes.length, players, `${players} heroes`)
    assert.equal(game.lives, 3 + players - 1, 'a shared pool of lives')
  }
  const game = make(2)
  choose(game, 0)
  emptyArena(game)
  const [a, b] = game.heroes
  Object.assign(a, { x: 200, y: 186, invuln: 0 })
  Object.assign(b, { x: 300, y: 186, invuln: 0 })
  // The second seat moves on its own frame.
  const right = press('right')
  game.update(emptyInput(), [emptyInput(), right])
  assert.ok(b.x > 300 && a.x === 200, 'seat 2 moves itself')
  // One rescue multiplier for the team.
  game.multiplier = 3
  game.family.push({
    id: 99,
    kind: 'cat',
    x: b.x,
    y: b.y,
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
  const score = game.score
  game.update(emptyInput(), [emptyInput(), emptyInput()])
  assert.equal(game.score - score, 3000, 'the shared multiplier')
  // Down: dizzy where they fell, until a partner stands close for two seconds.
  b.invuln = 0
  game.hurtHero(b)
  assert.equal(b.alive, false)
  const lives = game.lives
  const fell = { x: b.x, y: b.y }
  Object.assign(a, { x: fell.x - 10, y: fell.y })
  idle(game, 125, () => [emptyInput(), emptyInput()])
  assert.equal(b.alive, true, 'picked up by a partner')
  assert.ok(Math.hypot(b.x - fell.x, b.y - fell.y) < 2, 'right where they fell')
  assert.equal(game.lives, lives, 'a pick-up costs nothing more')
  // Alone, a downed hero gets up by themselves after a while.
  b.invuln = 0
  game.hurtHero(b)
  Object.assign(a, { x: 40, y: 60 })
  idle(game, 60 * 3, () => [emptyInput(), emptyInput()])
  assert.equal(b.alive, false, 'still down without a partner')
  idle(game, 60 * 5, () => [emptyInput(), emptyInput()])
  assert.equal(b.alive, true, 'up again on their own')
  // Out of lives, the team plays on while anyone stands.
  game.lives = 0
  b.invuln = 0
  game.hurtHero(b)
  idle(game, 200, () => [emptyInput(), emptyInput()])
  assert.equal(game.over, false, 'one hero still standing')
  a.invuln = 0
  game.hurtHero(a)
  idle(game, 200, () => [emptyInput(), emptyInput()])
  assert.equal(game.over, true, 'everyone down, no lives: game over')

  // A long two-player run still ends, under the ceiling.
  const meta = ARCADE_GAMES.find((g) => g.slug === 'rescue-rally')!
  const run = make(2, undefined, 5)
  run.menu = null
  let t = 0
  for (; t < 60 * 60 * 45 && !run.over; t++) {
    const p1 = run.demoInput()
    const p2 = emptyInput()
    p2.held.a = true
    p2.held[
      (['left', 'up', 'right', 'down'] as const)[Math.floor(t / 90) % 4]!
    ] = true
    run.update(p1, [p1, p2])
  }
  assert.ok(
    run.over,
    `the co-op run ends (${Math.round(t / 3600)} min, wave ${run.level})`,
  )
  assert.ok(run.score <= meta.maxPlausibleScore)
}

console.log('verifyCabinetRescueRallyModes: ok')
