// Save the Plumber's Golden Gears: one per leg, each one (and every power and
// heart) reachable with plain moves (walk, run, jump, pipe doors; no specials
// or powers), higher each world, counted once and kept across runs in the
// cabinet save.
import assert from 'node:assert/strict'
import {
  HERO_HALF,
  HERO_TALL,
  createSavePlumberPreview,
  type PlumberRun,
} from '../arcade/games/savePlumberPreview'
import { CAMPAIGN, TILE, parseStage } from '../arcade/games/savePlumberLevels'
import { readPlumberSave } from '../arcade/games/savePlumberSave'
import { emptyInput } from '../arcade/types'

const TALL = HERO_TALL
const HALF = HERO_HALF
const options = (extra = {}) => ({
  rng: () => 0.37,
  sound: { play() {} },
  demo: false,
  hiScore: 0,
  ...extra,
})

for (const def of CAMPAIGN) {
  const gears = parseStage(def).spawns.filter((s) => s.kind === 'gear')
  assert.equal(gears.length, 1, `${def.code} hides exactly one Golden Gear`)
}

/**
 * Every cell a heroine can touch: seeded with the autopilot's standing spots
 * along the main route, then flooded with simulated walk-offs and jumps (both
 * ways, walking and running, several holds) and pipe doors.
 */
function touchable(index: number): { touched: Uint8Array; cols: number } {
  const pilot = createSavePlumberPreview(options(), {
    stage: index,
    autopilot: true,
  })
  const seeds = new Map<string, { x: number; feet: number }>()
  for (let t = 0; t < 60 * 120 && !pilot.cleared.length; t++) {
    pilot.update(emptyInput())
    if (pilot.ground && pilot.mode === 'play' && !pilot.riding) {
      const feet = Math.round(pilot.hero.y + TALL)
      const key = `${Math.floor(pilot.hero.x / TILE)},${feet}`
      if (!seeds.has(key)) seeds.set(key, { x: pilot.hero.x, feet })
    }
  }
  const g: PlumberRun = createSavePlumberPreview(options())
  g.loadStage(index)
  const { cols, rows, doors } = g.stage
  const touched = new Uint8Array(cols * rows)
  const seen = new Set(seeds.keys())
  const queue = [...seeds.values()]
  const plans: { dir: number; run: boolean; hold: number; vx: number }[] = []
  for (const dir of [-1, 1])
    for (const run of [false, true])
      for (const hold of [-1, 0, 5, 10, 16])
        for (const start of [0, 1]) {
          if (hold < 0 && !start && run) continue
          plans.push({
            dir,
            run,
            hold,
            vx: start ? dir * (run ? 4.2 : 2.85) : 0,
          })
        }
  const visit = (spot: { x: number; feet: number }) => {
    const key = `${Math.floor(spot.x / TILE)},${spot.feet}`
    if (seen.has(key)) return
    seen.add(key)
    queue.push(spot)
  }
  while (queue.length) {
    const from = queue.shift()!
    for (const door of doors)
      if (
        from.feet === door.row * TILE &&
        Math.abs(from.x - (door.col * TILE + TILE / 2)) <= 10
      ) {
        const to = doors[door.to]!
        visit({ x: to.col * TILE + TILE / 2, feet: to.row * TILE })
      }
    for (const plan of plans) {
      g.loadStage(index)
      g.foes.length = 0
      g.platforms.length = 0
      g.mode = 'play'
      g.hero = { x: from.x, y: from.feet - TALL, vx: plan.vx, vy: 0 }
      g.ground = true
      for (let f = 0; f < 110; f++) {
        const input = emptyInput()
        input.held.left = plan.dir < 0
        input.held.right = plan.dir > 0
        input.held.b = plan.run
        if (plan.hold >= 0) {
          input.pressed.a = f === 0
          input.held.a = f <= plan.hold
        }
        g.immune = 1e9
        g.update(input)
        const h = g.hero
        if (g.mode !== 'play' || h.y > rows * TILE) break
        for (
          let r = Math.max(0, Math.floor(h.y / TILE));
          r <= Math.min(rows - 1, Math.floor((h.y + TALL - 1) / TILE));
          r++
        )
          for (
            let c = Math.max(0, Math.floor((h.x - HALF) / TILE));
            c <= Math.min(cols - 1, Math.floor((h.x + HALF) / TILE));
            c++
          )
            touched[r * cols + c] = 1
        if (f > 2 && g.ground) {
          visit({ x: h.x, feet: Math.round(h.y + TALL) })
          break
        }
      }
    }
  }
  return { touched, cols }
}

CAMPAIGN.forEach((def, index) => {
  const spawns = parseStage(def).spawns
  const gear = spawns.find((s) => s.kind === 'gear')!
  const { touched, cols } = touchable(index)
  assert.ok(
    touched[gear.row * cols + gear.col],
    `${def.code}'s Golden Gear is reachable with plain moves`,
  )
  for (const power of spawns.filter(
    (s) => s.kind === 'heart' || s.kind.startsWith('power'),
  ))
    assert.ok(
      touched[power.row * cols + power.col],
      `${def.code}'s ${power.kind} is reachable with plain moves`,
    )
})

// Harder each world: the late gears sit well above the ground.
const height = (index: number) => {
  const stage = parseStage(CAMPAIGN[index]!)
  const gear = stage.spawns.find((s) => s.kind === 'gear')!
  return stage.rows - 3 - gear.row
}
const average = (from: number, to: number) => {
  let sum = 0
  for (let i = from; i < to; i++) sum += height(i)
  return sum / (to - from)
}
assert.ok(
  average(24, 32) > average(0, 8) + 2,
  'late gears sit far higher than early ones',
)

// Collecting one: counted, saved, and still found when the stage reloads.
const run = createSavePlumberPreview(options())
run.loadStage(4)
run.mode = 'play'
run.foes.length = 0
const gear = run.gear!
run.hero.x = gear.x
run.hero.y = gear.y - 14
run.hero.vy = 0
run.update(emptyInput())
assert.equal(gear.taken, true, 'touching the gear takes it')
assert.ok(run.gears.has('2-1'))
assert.deepEqual(readPlumberSave(run.save)!.gears, ['2-1'], 'the save keeps it')
run.loadStage(4)
assert.equal(run.gear!.taken, true, 'a found gear stays found')
const resumed = createSavePlumberPreview(
  options({ resume: readPlumberSave(run.save) }),
)
assert.ok(resumed.gears.has('2-1'), 'and survives into the next session')
assert.deepEqual(
  readPlumberSave({
    ...readPlumberSave(run.save),
    gears: ['2-1', 'nope', 7, '2-1'],
  })!.gears,
  ['2-1'],
  'a save keeps only real stage codes, once',
)

console.log(
  'Save the Plumber Golden Gears: one per leg, all reachable with every power, rising difficulty, saved across runs',
)
