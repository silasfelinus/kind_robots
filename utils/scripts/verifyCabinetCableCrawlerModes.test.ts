// /utils/scripts/verifyCabinetCableCrawlerModes.test.ts
//
// Cable Crawler depth pass, slice 5 part 1 (conductor kr-arcade/t-068): the mode select, Marathon
// (all 33 mazes in a fixed cycle, a steep speed ramp, a per-wave clock, a nine-digit counter) and
// Maze Trials (time attack on a cleared maze, best times kept in the save). Tangle is a later part.
//
//   npx tsx utils/scripts/verifyCabinetCableCrawlerModes.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import cableCrawler from '../arcade/games/cableCrawler'
import { BIOS_INDEX } from '../arcade/cableCrawler/components'
import {
  CYCLE,
  MARATHON_PACE_FLOOR,
  betterTime,
  formatTime,
  legId,
  marathonClock,
  marathonLeg,
  marathonPace,
  marathonScore,
} from '../arcade/cableCrawler/modes'
import { readCableSave } from '../arcade/cableCrawler/save'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'

type Game = {
  score: number
  lives: number
  over: boolean
  wave: number
  mode: string
  cardTicks: number
  menu: { stage: string; cursor: number; note: string } | null
  maze: { id: string }
  cleared: Set<string>
  best: Record<string, number>
  trialTicks: number
  clear: number
  startLen: number
  batteryMax: number
  save: { cleared?: string[]; best?: Record<string, number> } | null
  update(input: InputFrame): void
  demoInput(): InputFrame
  mazeClear(): void
  stepTicks(): number
  boardTitle(): string
  render(g: CanvasRenderingContext2D): void
}

const quiet = { play: () => {} }
const fakeCtx = () =>
  new Proxy(
    {},
    {
      get: (_t, k) =>
        k === 'createRadialGradient' || k === 'createLinearGradient'
          ? () => ({ addColorStop: () => {} })
          : k === 'measureText'
            ? () => ({ width: 8 })
            : () => {},
      set: () => true,
    },
  ) as unknown as CanvasRenderingContext2D

function open(resume?: unknown, selectScreen = true): Game {
  return cableCrawler.create({
    rng: mulberry32(5),
    sound: quiet,
    demo: false,
    hiScore: 0,
    selectScreen,
    resume,
  }) as unknown as Game
}

function press(game: Game, ...buttons: Array<'up' | 'down' | 'a' | 'b'>) {
  const input = emptyInput()
  for (const b of buttons) input.pressed[b] = true
  game.update(input)
}

// --- the numbers ----------------------------------------------------------------------------------
{
  assert.equal(CYCLE.length, 33, 'thirty main mazes and three BIOS mazes')
  assert.equal(new Set(CYCLE.map(legId)).size, 33, 'no maze twice')
  assert.equal(CYCLE[32]!.comp, BIOS_INDEX)
  assert.equal(marathonLeg(0).leg, CYCLE[0])
  assert.equal(marathonLeg(33).leg, CYCLE[0], 'the cycle repeats')
  assert.equal(marathonLeg(33).cycle, 1)
  assert.ok(marathonPace(5) < marathonPace(0), 'the crawl speeds up')
  assert.equal(marathonPace(500), MARATHON_PACE_FLOOR)
  assert.ok(marathonClock(10) < marathonClock(0), 'the clock shrinks')
  assert.ok(marathonClock(500) >= 30, 'and has a floor')
  assert.equal(marathonScore(12345), '000012345', 'nine digits')
  assert.equal(marathonScore(2_000_000_000), '999999999')
  assert.equal(formatTime(3600 + 90), '1:01.50')
  assert.equal(betterTime({}, 'a', 100), true)
  assert.equal(betterTime({ a: 100 }, 'a', 100), false)
  assert.equal(betterTime({ a: 100 }, 'a', 99), true)
}

// --- the save keeps cleared mazes and best times, and drops junk --------------------------------
{
  const id = legId(CYCLE[0]!)
  const save = readCableSave({
    v: 1,
    comp: 0,
    score: 0,
    lives: 3,
    cleared: [id, id, 'nope', 7],
    best: { [id]: 1234, nope: 5, [legId(CYCLE[1]!)]: -3 },
  })!
  assert.deepEqual(save.cleared, [id])
  assert.deepEqual(save.best, { [id]: 1234 })
  assert.deepEqual(
    readCableSave({ v: 1, comp: 0, score: 0, lives: 1 })!.cleared,
    [],
  )
}

// --- no select without the cabinet asking: tests and demos play at once ------------------------
{
  assert.equal(open(undefined, false).menu, null)
  const demo = cableCrawler.create({
    rng: mulberry32(1),
    sound: quiet,
    demo: true,
    hiScore: 0,
    selectScreen: true,
  }) as unknown as Game
  assert.equal(demo.menu, null)
}

// --- the select: Odyssey carries on as it did ------------------------------------------------------
{
  const game = open()
  assert.ok(game.menu, 'a real game opens on the mode select')
  game.render(fakeCtx())
  press(game, 'a')
  assert.equal(game.menu, null)
  assert.equal(game.mode, 'odyssey')
}

// --- Marathon: waves, speed ramp, clock, counter, and the Odyssey save untouched -------------
{
  const odyssey = {
    v: 1,
    comp: 2,
    score: 5000,
    lives: 3,
    bytes: [],
    reached: 3,
  }
  const game = open(odyssey)
  press(game, 'down')
  press(game, 'a')
  assert.equal(game.mode, 'marathon')
  assert.equal(game.menu, null)
  assert.equal(game.score, 0)
  assert.equal(game.wave, 0)
  assert.equal(game.cardTicks, 0)
  assert.equal(game.maze.id, legId(CYCLE[0]!))
  assert.equal(game.boardTitle(), 'WAVE 1')
  const first = {
    pace: game.stepTicks(),
    clock: game.batteryMax,
    len: game.startLen,
  }
  for (let t = 0; t < 60 * 60 * 15 && game.wave < 3 && !game.over; t++) {
    game.lives = Math.max(game.lives, 2)
    game.update(game.demoInput())
  }
  assert.ok(game.wave >= 3, `a pilot clears waves (${game.wave})`)
  assert.equal(game.maze.id, legId(marathonLeg(game.wave).leg))
  assert.ok(game.stepTicks() < first.pace, 'faster each wave')
  assert.ok(game.batteryMax < first.clock, 'a shorter clock each wave')
  assert.ok(game.startLen > first.len, 'a longer cable each wave')
  assert.ok(game.cleared.size >= 3, 'cleared mazes are noted')
  assert.equal(
    (game.save as { comp?: number } | null)?.comp,
    2,
    'the Odyssey save keeps its place',
  )
  game.render(fakeCtx())
}

// --- Marathon ends when the cables run out ------------------------------------------------------
{
  const game = open()
  press(game, 'down')
  press(game, 'a')
  assert.equal(game.lives, 3)
  game.lives = 0
  // A flat battery is the quickest way to run out.
  ;(game as unknown as { unplug(why: string): void }).unplug('TEST')
  for (let t = 0; t < 400 && !game.over; t++) game.update(emptyInput())
  assert.ok(game.over, 'out of cables ends the run')
}

// --- Maze Trials: locked until cleared, then timed, best kept ------------------------------------
{
  const id = legId(CYCLE[1]!)
  const fresh = open()
  press(fresh, 'down')
  press(fresh, 'down')
  press(fresh, 'a')
  assert.equal(fresh.menu?.stage, 'trial')
  assert.match(fresh.menu!.note, /CLEAR/)
  press(fresh, 'a')
  assert.ok(fresh.menu, 'a locked maze does not start')
  fresh.render(fakeCtx())
  press(fresh, 'b')
  assert.equal(fresh.menu?.stage, 'mode', 'B backs out to the modes')

  const game = open({
    v: 1,
    comp: 0,
    score: 0,
    lives: 3,
    cleared: [id],
    best: { [id]: 99_999 },
  })
  press(game, 'down')
  press(game, 'down')
  press(game, 'a')
  assert.equal(game.menu?.cursor, 1, 'the cursor starts on a cleared maze')
  game.render(fakeCtx())
  press(game, 'a')
  assert.equal(game.mode, 'trials')
  assert.equal(game.maze.id, id)
  assert.equal(game.lives, 1, 'a trial is one cable')
  assert.equal(game.boardTitle(), 'TRIAL')
  for (let t = 0; t < 120; t++) game.update(game.demoInput())
  assert.ok(game.trialTicks > 0 && game.trialTicks <= 121, 'the clock runs')
  game.render(fakeCtx())
  game.trialTicks = 1500
  game.mazeClear()
  for (let t = 0; t < 400 && !game.over; t++) game.update(emptyInput())
  assert.ok(game.over, 'a cleared trial ends')
  assert.equal(game.best[id], 1500, 'a faster time is kept')
  assert.equal(game.save?.best?.[id], 1500, 'and saved')
}

console.log('verifyCabinetCableCrawlerModes: ok')
