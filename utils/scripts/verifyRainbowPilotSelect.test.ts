import assert from 'node:assert/strict'
import { readRainbowSave } from '../arcade/games/rainbowLoadouts'
import {
  RAINBOW_DIFFICULTY,
  createRainbowPrincessPreview,
  isRainbowCheckpoint,
} from '../arcade/games/rainbowPrincessPreview'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'

// Silas's first playtest (2026-10-17): "There was no opening option to choose my player or difficulty." A
// seated game the cabinet starts opens on a pilot and difficulty select: left and right pick, up and down
// switch rows, A launches after a beat. P1 flies the chosen pilot (her weapons, colour, ship and lines) and
// the other seats follow in order; the difficulty sets lives at launch; a save keeps the pilot. Demos and
// headless runs (no selectScreen) start flying at once, exactly as before.

function seeded(seed = 1234) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
const create = (
  opts: {
    players?: number
    selectScreen?: boolean
    resume?: unknown
    demo?: boolean
  } = {},
) =>
  createRainbowPrincessPreview({
    players: opts.players ?? 1,
    demo: opts.demo ?? false,
    rng: seeded(),
    sound: { play() {} },
    hiScore: 0,
    selectScreen: opts.selectScreen,
    resume: opts.resume,
  })
const press = (
  button: keyof InputFrame['pressed'],
  held: Partial<InputFrame['held']> = {},
) => {
  const frame = emptyInput()
  frame.pressed[button] = true
  Object.assign(frame.held, held)
  return frame
}
const texts: string[] = []
const g = new Proxy({} as Record<string | symbol, unknown>, {
  get(target, key) {
    if (key in target) return target[key]
    if (key === 'fillText') return (text: string) => texts.push(String(text))
    return () => ({ addColorStop() {} })
  },
  set(target, key, value) {
    target[key] = value
    return true
  },
}) as unknown as CanvasRenderingContext2D

// Without the cabinet's request nothing changes: seat order is pilot order and play starts at once.
{
  const game = create({ players: 2 })
  assert.equal(game.snapshot.selectMenu, null)
  assert.deepEqual(game.snapshot.pilots, [0, 1])
  game.update(emptyInput())
  assert.equal(game.snapshot.tick, 1)
}
assert.equal(
  create({ selectScreen: true, demo: true }).snapshot.selectMenu,
  null,
  'the demo never asks',
)

// The select: Halo Fin (Solenne) at Ace.
{
  const game = create({ selectScreen: true })
  assert.deepEqual(game.snapshot.selectMenu, {
    row: 0,
    pilot: 0,
    difficulty: 'normal',
  })
  assert.equal(game.music, null, 'the select is quiet')
  game.update(press('right'))
  game.update(press('right'))
  assert.equal(game.snapshot.selectMenu?.pilot, 2)
  game.update(press('left'))
  game.update(press('left'))
  game.update(press('left'))
  assert.equal(game.snapshot.selectMenu?.pilot, 3, 'the pilots wrap round')
  game.update(press('right'))
  game.update(press('right'))
  game.update(press('right'))
  game.update(press('down'))
  game.update(press('right'))
  game.update(press('right'))
  assert.deepEqual(
    game.snapshot.selectMenu,
    { row: 1, pilot: 2, difficulty: 'hard' },
    'difficulty stops at Ace',
  )
  assert.equal(game.snapshot.tick, 0, 'the world waits behind the select')
  texts.length = 0
  game.render(g)
  for (const line of ['CHOOSE YOUR PILOT', 'SOLENNE', 'AZURE', '[ ACE ]', 'P1'])
    assert.ok(texts.includes(line), `the select shows ${line}`)
  for (let i = 0; i < 25; i++) game.update(emptyInput())
  game.update(press('a'))
  assert.equal(game.snapshot.selectMenu, null)
  assert.deepEqual(game.snapshot.pilots, [2])
  assert.equal(game.snapshot.difficulty, 'hard')
  assert.equal(game.snapshot.ships[0]!.lives, RAINBOW_DIFFICULTY.hard.lives)
  // Seat 1 now flies Halo Fin's focused Halo Link.
  const focus = emptyInput()
  focus.held.a = true
  focus.held.b = true
  for (let i = 0; i < 3; i++) game.update(focus)
  assert.ok(game.snapshot.shots.length)
  assert.ok(game.snapshot.shots.every((shot) => shot.kind === 'link'))
  // Lilt's opening lines name the pilot actually flying.
  for (let i = 0; i < 120; i++) game.update(emptyInput())
  texts.length = 0
  game.render(g)
  assert.ok(
    texts.some((text) => text === 'A01.OPEN / SOLENNE'),
    `the lead's line is Solenne's (${texts.filter((t) => t.startsWith('A01')).join(', ')})`,
  )
  assert.ok(!texts.some((text) => text.includes('MARIBEL')))
}

// A press before the beat (the one that started the game) does not launch; a Cadet gets five lives.
{
  const game = create({ selectScreen: true })
  game.update(press('a'))
  assert.ok(game.snapshot.selectMenu, 'the starting press does not launch')
  game.update(press('down'))
  game.update(press('left'))
  for (let i = 0; i < 25; i++) game.update(emptyInput())
  game.update(press('a'))
  assert.equal(game.snapshot.difficulty, 'easy')
  assert.equal(game.snapshot.ships[0]!.lives, RAINBOW_DIFFICULTY.easy.lives)
}

// Co-op: P1 picks Comet Crown and the other seats follow in order.
{
  const game = create({ players: 3, selectScreen: true })
  game.update(press('left'))
  for (let i = 0; i < 25; i++) game.update(emptyInput())
  game.update(press('a'))
  assert.deepEqual(game.snapshot.pilots, [3, 0, 1])
}

// A save keeps the pilot: continuing skips the select, a new flight opens it.
{
  const demo = create({ demo: true })
  let save: unknown
  for (let i = 0; i < 100000 && !save; i++) {
    demo.update(emptyInput())
    save = demo.save ?? undefined
  }
  const kept = { ...(save as object), pilot: 3 }
  assert.equal(readRainbowSave(kept, isRainbowCheckpoint)?.pilot, 3)
  assert.equal(
    readRainbowSave({ ...kept, pilot: 9 }, isRainbowCheckpoint)?.pilot,
    undefined,
    'a bad pilot is dropped',
  )
  const go = create({ selectScreen: true, resume: kept })
  assert.equal(go.snapshot.selectMenu, null, 'the flight log comes first')
  for (let i = 0; i < 25; i++) go.update(emptyInput())
  go.update(press('a'))
  assert.deepEqual(go.snapshot.pilots, [3], 'continuing flies the saved pilot')
  assert.equal(go.snapshot.selectMenu, null)
  const fresh = create({ selectScreen: true, resume: kept })
  for (let i = 0; i < 25; i++) fresh.update(emptyInput())
  fresh.update(press('down'))
  fresh.update(press('a'))
  assert.ok(fresh.snapshot.selectMenu, 'a new flight goes on to the select')
}

console.log(
  'rainbow pilot select: ok (pilot and difficulty pick, wrap, beat, co-op order, renamed comms, saved pilot)',
)
