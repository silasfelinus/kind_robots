// Save the Plumber's Golden Gears: one per runner leg, each on a raised route
// the autopilot can take at full pace (along with every power and heart on the
// leg), higher each world, counted once and kept across runs in the cabinet save.
import assert from 'node:assert/strict'
import {
  createSavePlumberPreview,
  type PlumberRun,
} from '../arcade/games/savePlumberPreview'
import { CAMPAIGN, parseStage } from '../arcade/games/savePlumberLevels'
import { readPlumberSave } from '../arcade/games/savePlumberSave'
import { emptyInput } from '../arcade/types'

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

// The extras-seeking autopilot grabs the gear and every power on every leg,
// without losing a life: extras are reachable at runner pace, not just on paper.
CAMPAIGN.forEach((def, index) => {
  const pilot: PlumberRun = createSavePlumberPreview(options(), {
    stage: index,
    autopilot: true,
  })
  const lives = pilot.lives
  for (let t = 0; t < 60 * 120 && !pilot.cleared.length; t++)
    pilot.update(emptyInput())
  assert.deepEqual(pilot.cleared, [def.code], `${def.code} is cleared`)
  assert.equal(pilot.lives, lives, `${def.code} costs no lives`)
  assert.ok(
    pilot.gear?.taken,
    `${def.code}'s Golden Gear is grabbed on the run`,
  )
  const missed = pilot.pickups.filter((p) => !p.taken).map((p) => p.kind)
  assert.deepEqual(
    missed,
    [],
    `${def.code}'s powers are all grabbed on the run`,
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
  average(24, 32) > average(0, 8) + 3,
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
  readPlumberSave({ ...run.save, gears: ['2-1', 'nope', 7, '2-1'] })!.gears,
  ['2-1'],
  'a save keeps only real stage codes, once',
)

console.log(
  'Save the Plumber Golden Gears: one per leg, all grabbed at runner pace with every power, rising difficulty, saved across runs',
)
