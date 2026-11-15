// /utils/scripts/verifyCabinetRescueRallySeats.test.ts
//
// Rescue Rally through the cabinet's input consumers (conductor kr-arcade t-147). The frames here are
// polled from real ArcadeInput instances fed key events and Gamepad-API pads, seated the way
// components/arcade/arcade-cabinet.vue seats them (P1/P2 key maps, assignPads/keepPads, the split
// twin-stick board), and passed to the game as the cabinet does: update(frames[0], frames).
// The full mounted-cabinet check is utils/scripts/verifyRescueRallyCabinet.browser.test.mjs.
//
//   npx tsx utils/scripts/verifyCabinetRescueRallySeats.test.ts

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { mulberry32 } from '../arcade/curve'
import mod from '../arcade/games/rescueRally'
import {
  AIM_KEYS,
  ArcadeInput,
  KEY_MAP,
  P1_KEYS,
  P2_KEYS,
  TWIN_KEYS,
  assignPads,
  keepPads,
} from '../arcade/input'
import type { InputFrame } from '../arcade/types'

/* eslint-disable @typescript-eslint/no-explicit-any */

// --- a browser-ish window and Gamepad API for the real input classes ----------------------------
const g = globalThis as unknown as Record<string, unknown>
g.HTMLInputElement ??= function HTMLInputElement() {}
g.Element ??= function Element() {}
const listeners = new Map<string, Set<(event: unknown) => void>>()
const target = {
  addEventListener: (type: string, fn: (event: unknown) => void) => {
    if (!listeners.has(type)) listeners.set(type, new Set())
    listeners.get(type)!.add(fn)
  },
  removeEventListener: (type: string, fn: (event: unknown) => void) =>
    listeners.get(type)?.delete(fn),
} as unknown as Window
const key = (type: 'keydown' | 'keyup', code: string) => {
  for (const fn of listeners.get(type) ?? [])
    fn({ code, target: null, preventDefault: () => {} })
}
type FakePad = { axes?: number[]; buttons?: number[] } | null
let pads: FakePad[] = []
const padsNow = () =>
  pads.map(
    (pad, index) =>
      pad && {
        index,
        axes: pad.axes ?? [0, 0, 0, 0],
        buttons: Array.from({ length: 17 }, (_, b) => ({
          pressed: (pad.buttons ?? []).includes(b),
        })),
      },
  )
Object.defineProperty(globalThis.navigator, 'getGamepads', {
  configurable: true,
  value: padsNow,
})
const connected = () => padsNow().flatMap((pad) => (pad ? [pad.index] : []))

// --- the cabinet's four seats ------------------------------------------------------------------
const inputs = [
  new ArcadeInput(KEY_MAP),
  new ArcadeInput(P2_KEYS),
  new ArcadeInput({}),
  new ArcadeInput({}),
]
inputs[0]!.attach(target)
let slots: Array<number | null> = [null]
/** applySeats + the aiming watcher, as the cabinet runs them. */
function seat(players: number, choosing: boolean, arrowsAim = false) {
  slots = choosing
    ? assignPads(connected(), players)
    : keepPads(slots, connected(), players)
  const aiming = players === 1 && !choosing
  inputs[0]!.setPadIndex(slots[0] ?? null)
  inputs[0]!.setAiming(aiming, arrowsAim ? AIM_KEYS : {})
  inputs[0]!.setKeyMap(players > 1 ? P1_KEYS : arrowsAim ? TWIN_KEYS : KEY_MAP)
  inputs.forEach((seatIn, i) => {
    if (i === 0) return
    if (i < players) {
      seatIn.setPadIndex(slots[i] ?? -1)
      seatIn.attach(target)
    } else {
      seatIn.detach()
      seatIn.clear()
    }
  })
}
function tick(game: any, players: number): InputFrame[] {
  const frames = inputs.slice(0, players).map((seatIn) => seatIn.poll())
  game.update(frames[0]!, frames)
  return frames
}
function tap(game: any, players: number, code: string) {
  key('keydown', code)
  tick(game, players)
  key('keyup', code)
  tick(game, players)
}
const make = (players: number) =>
  mod.create({
    rng: mulberry32(7),
    sound: { play: () => {} },
    demo: false,
    hiScore: 0,
    players,
    selectScreen: true,
  }) as any
function emptyArena(game: any, spots: Array<{ x: number; y: number }>) {
  Object.assign(game, {
    foes: [],
    family: [],
    arrivals: [{ tick: 1e9, kind: 'drone', count: 1, from: 'vents' }],
    bolts: [],
    shots: [],
    pickups: [],
    boss: null,
  })
  game.heroes.forEach((h: any, i: number) =>
    Object.assign(h, { ...spots[i], invuln: 1e9 }),
  )
}
const idle = (game: any, players: number, ticks: number) => {
  for (let t = 0; t < ticks; t++) tick(game, players)
}

// --- solo: the menu takes the arrows, play gives them to the aim -----------------------------------
{
  pads = []
  const game = make(1)
  assert.equal(game.menuOpen, true, 'the menu of modes is a menu')
  seat(1, false, !game.menuOpen)
  idle(game, 1, 10)
  tap(game, 1, 'ArrowDown')
  assert.equal(game.menu.cursor, 1, 'arrows move the menu')
  tap(game, 1, 'ArrowUp')
  tap(game, 1, 'Space')
  assert.equal(game.menuOpen, false, 'into the campaign')
  seat(1, false, !game.menuOpen)
  emptyArena(game, [{ x: 240, y: 180 }])
  const h = game.heroes[0]
  key('keydown', 'KeyD')
  key('keydown', 'ArrowLeft')
  const [frame] = tick(game, 1)
  assert.deepEqual(frame!.aim, { x: -1, y: 0 }, 'the arrows aim')
  assert.equal(frame!.held.right, true, 'WASD moves')
  assert.ok(h.x > 240 && h.aimX === -1 && h.aiming, 'twin-stick')
  key('keyup', 'KeyD')
  key('keyup', 'ArrowLeft')
  tick(game, 1)
  game.openShelter()
  assert.equal(game.menuOpen, true, 'the Shelter is a menu')
  seat(1, false, !game.menuOpen)
  idle(game, 1, 24)
  tap(game, 1, 'ArrowDown')
  assert.equal(game.shelter.cursor, 1, 'arrows move the Shelter')
  // Without the menu hand-back (the bug t-147 reproduced): the arrows only aim.
  seat(1, false, true)
  tap(game, 1, 'ArrowDown')
  assert.equal(game.shelter.cursor, 1, 'aiming arrows never reach a menu')
  const demo = mod.create({
    rng: mulberry32(1),
    sound: { play: () => {} },
    demo: true,
    hiScore: 0,
  }) as any
  assert.equal(demo.menuOpen, false, 'the attract demo plays straight away')
}

// --- 2 to 4 seats: own keys and pads, co-op aims the way it moves ----------------------------------
// Two seats share the keyboard; seats 3 and 4 each bring a gamepad.
{
  for (const players of [2, 3, 4]) {
    const padCount = players - 2
    pads = Array.from({ length: padCount }, () => ({}))
    const game = make(players)
    seat(players, true)
    seat(players, false)
    assert.equal(game.heroes.length, players)
    idle(game, players, 10)
    tap(game, players, 'KeyS')
    assert.equal(game.menu.cursor, 1, `${players}P: seat 1 moves the menu`)
    tap(game, players, 'KeyW')
    tap(game, players, 'KeyF')
    assert.equal(game.menuOpen, false, `${players}P: seat 1 picks`)
    const spots = [160, 220, 280, 340].map((x) => ({ x, y: 180 }))
    emptyArena(game, spots)
    key('keydown', 'KeyD')
    key('keydown', 'ArrowUp')
    pads = [{ axes: [0, 0.95, -0.95, 0] }, { buttons: [14] }].slice(0, padCount)
    const frames = tick(game, players)
    idle(game, players, 9)
    key('keyup', 'KeyD')
    key('keyup', 'ArrowUp')
    const [a, b, c, d] = game.heroes
    assert.ok(a.x > 170 && a.y === 180, 'seat 1: WASD right')
    assert.ok(b.y < 170 && b.x === 220, 'seat 2: arrows up')
    assert.ok(
      frames.every((frame) => frame.aim === undefined),
      'co-op frames carry no aim',
    )
    assert.ok(!b.aiming && b.aimY === -1, 'seat 2 aims the way it moves')
    if (players >= 3) {
      assert.ok(c.y > 190 && c.x === 280, 'seat 3: pad 1 stick down')
      assert.ok(!c.aiming && c.aimY === 1, 'a right stick never aims co-op')
    }
    if (players === 4) assert.ok(d.x < 330 && d.y === 180, 'seat 4: pad 2')
    if (players === 3)
      assert.equal(slots[2], 0, 'three seats: the keyless seat takes pad 1')

    // Pad 2 unplugs mid-run: seat 4 idles, seat 3 keeps pad 1; plugged back in, seat 4 has it.
    if (players === 4) {
      pads = [{}, null]
      seat(players, false)
      assert.deepEqual(slots, [-1, -1, 0, -1])
      emptyArena(game, spots)
      key('keydown', 'KeyD')
      idle(game, players, 10)
      key('keyup', 'KeyD')
      assert.ok(game.heroes[0].x > 170, 'seat 1 plays on')
      assert.equal(game.heroes[3].x, 340, 'seat 4 waits, padless')
      assert.ok(!game.over && game.heroes[3].alive)
      pads = [{}, { buttons: [13] }]
      seat(players, false)
      assert.deepEqual(slots, [-1, -1, 0, 1], 'the pad goes back to seat 4')
      emptyArena(game, spots)
      idle(game, players, 10)
      assert.ok(game.heroes[3].y > 190, 'and drives it again')
      assert.equal(game.heroes[2].y, 180, 'not seat 3')
    }
  }
}

// --- the partner pick-up, walked over on seat 1's keys ----------------------------------------------
{
  pads = []
  const game = make(2)
  seat(2, true)
  seat(2, false)
  idle(game, 2, 10)
  tap(game, 2, 'KeyF')
  emptyArena(game, [
    { x: 230, y: 180 },
    { x: 290, y: 180 },
  ])
  const [a, b] = game.heroes
  b.invuln = 0
  game.hurtHero(b)
  const lives = game.lives
  key('keydown', 'KeyD')
  for (let t = 0; t < 60 && b.x - a.x >= 14; t++) tick(game, 2)
  key('keyup', 'KeyD')
  let t = 0
  for (; t < 300 && !b.alive; t++) tick(game, 2)
  assert.ok(b.alive && t <= 130, `picked up by the partner in ${t} ticks`)
  assert.equal(b.x, 290, 'right where they fell')
  assert.equal(game.lives, lives)
}

// --- the cabinet hands the arrows back while a game's menu is up ------------------------------------
{
  const cabinet = readFileSync(
    new URL('../../components/arcade/arcade-cabinet.vue', import.meta.url),
    'utf8',
  )
  assert.match(
    cabinet,
    /const arrowsAim = computed\(\(\) => aiming\.value && !gameMenu\.value\)/,
  )
  assert.match(cabinet, /input\.setAiming\(on, arrows \? AIM_KEYS : \{\}\)/)
  assert.match(
    cabinet,
    /game\.update\(frames\[0\]!, frames\)\s+gameMenu\.value = menuOpenOf\(game\)/,
  )
}

for (const seatIn of inputs) seatIn.detach()
console.log('verifyCabinetRescueRallySeats: ok')
