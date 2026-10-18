// Save the Plumber's Endless run: seeded zones that join on flat ground and
// cycle all eight worlds, a pace that rises each zone, one life, a distance
// score, and a best kept in the cabinet save beside (not over) the campaign.
import assert from 'node:assert/strict'
import { createSavePlumberPreview } from '../arcade/games/savePlumberPreview'
import {
  ENDLESS_PAD,
  buildEndlessZone,
  zoneWorld,
} from '../arcade/games/savePlumberEndless'
import { parseStage, stageWorld } from '../arcade/games/savePlumberLevels'
import { readPlumberSave } from '../arcade/games/savePlumberSave'
import { emptyInput, type ArcadeButton } from '../arcade/types'

const options = (extra = {}) => ({
  rng: () => 0.37,
  sound: { play() {} },
  demo: false,
  hiScore: 0,
  ...extra,
})

// Zones: valid, seeded, flat at both ends, one world each, cycling.
for (let seed = 0; seed < 6; seed++)
  for (let zone = 0; zone < 24; zone++) {
    const def = buildEndlessZone(seed, zone)
    const stage = parseStage(def)
    assert.equal(stage.rows, 24, 'a zone is 24 rows tall')
    assert.equal(stageWorld(def.code), zoneWorld(zone))
    const ground = stage.rows - 3
    for (const col of [
      ...Array.from({ length: ENDLESS_PAD }, (_, i) => i),
      ...Array.from({ length: ENDLESS_PAD }, (_, i) => stage.cols - 1 - i),
    ]) {
      assert.ok(
        stage.solid[ground * stage.cols + col],
        `zone ${zone} (seed ${seed}) opens and closes on flat ground`,
      )
      for (let row = 1; row < ground; row++)
        assert.equal(
          stage.solid[row * stage.cols + col],
          0,
          `zone ${zone} (seed ${seed}) has a clear handover strip`,
        )
    }
    assert.ok(
      stage.spawns.some(
        (s) => s.kind === 'heart' || s.kind.startsWith('power'),
      ),
      'every zone offers a heart or a power',
    )
    assert.deepEqual(buildEndlessZone(seed, zone).rows, def.rows, 'seeded')
  }
assert.deepEqual(
  Array.from({ length: 10 }, (_, z) => zoneWorld(z)),
  [1, 2, 3, 4, 5, 6, 7, 8, 1, 2],
  'zones cycle all eight worlds',
)
assert.notDeepEqual(
  buildEndlessZone(1, 3).rows,
  buildEndlessZone(2, 3).rows,
  'each run draws its own zones',
)

// The runner pilot runs a full lap (every world) on several seeds without
// dying: zones hand her on mid-stride, the pace rises and metres add up.
for (const seed of [0, 1, 3]) {
  const run = createSavePlumberPreview(options(), {
    endless: true,
    endlessSeed: seed,
    autopilot: true,
  })
  assert.equal(run.endless, true)
  assert.equal(run.runSpeed, 2.9, 'Endless starts at the World 1 pace')
  let last = 0
  let shrank = false
  for (let t = 0; t < 60 * 400 && run.zone < 8; t++) {
    run.update(emptyInput())
    assert.equal(run.mode, 'play', `seed ${seed}: still running`)
    if (run.distance < last) shrank = true
    last = run.distance
  }
  assert.equal(run.zone, 8, `seed ${seed}: a full lap of all eight worlds`)
  assert.ok(!shrank, 'distance only grows')
  assert.ok(run.distance > 1800, `seed ${seed}: ${run.distance} m`)
  assert.ok(run.runSpeed > 3.8, 'and the pace has risen')
}

// Handover keeps her stride, her hearts and her place on screen.
const relay = createSavePlumberPreview(options(), {
  endless: true,
  endlessSeed: 4,
  autopilot: true,
})
let before: { vx: number; hearts: number; screen: number } | null = null
for (let t = 0; t < 60 * 120 && relay.zone < 1; t++) {
  before = {
    vx: relay.hero.vx,
    hearts: relay.hearts,
    screen: relay.hero.x - relay.camera,
  }
  relay.update(emptyInput())
}
assert.equal(relay.zone, 1)
assert.equal(relay.hearts, before!.hearts, 'hearts carry into the next zone')
assert.ok(Math.abs(relay.hero.vx - before!.vx) < 0.5, 'she keeps her stride')
assert.ok(
  Math.abs(relay.hero.x - relay.camera - before!.screen) < 8,
  'and her place on screen',
)
assert.ok(
  relay.hero.x < ENDLESS_PAD * 16,
  'she lands on the next zone’s opening strip',
)

// The title menu: New Game, then Endless; Endless picks a heroine and runs.
const fresh = createSavePlumberPreview(options())
const tap = (button: ArcadeButton) => {
  const f = emptyInput()
  f.pressed[button] = true
  fresh.update(f)
}
tap('down')
tap('a')
assert.equal(fresh.mode, 'select', 'Endless picks a heroine first')
tap('a')
assert.equal(fresh.endless, true)
assert.equal(fresh.mode, 'intro', 'no story: straight to the run')
assert.equal(fresh.stage.code, '1-E')
assert.equal(fresh.lives, 1, 'one life')

// A fall ends the run and keeps the best, without moving the campaign save.
const saved = {
  v: 1 as const,
  heroine: 7,
  stage: 9,
  score: 4200,
  lives: 2,
  tokens: 5,
  gears: ['1-1'],
}
const runner = createSavePlumberPreview(options({ resume: saved }), {
  endless: true,
  endlessSeed: 2,
})
runner.mode = 'play'
for (let i = 0; i < 90; i++) runner.update(emptyInput())
const ran = runner.distance
assert.ok(ran > 10, 'she runs on her own')
runner.hero.y = runner.stage.rows * 16 + 40
for (let i = 0; i < 400 && !runner.over; i++) runner.update(emptyInput())
assert.equal(runner.over, true, 'one life: the run ends')
const kept = readPlumberSave(runner.save)!
assert.equal(kept.endlessBest, ran, 'the best is saved in metres')
assert.equal(kept.stage, 9, 'the campaign resume point is untouched')
assert.equal(kept.score, 4200)
assert.deepEqual(kept.gears, ['1-1'])
const next = createSavePlumberPreview(options({ resume: kept }))
assert.equal(next.endlessBest, ran, 'the best survives into the next session')
const worse = createSavePlumberPreview(options({ resume: kept }), {
  endless: true,
  endlessSeed: 2,
})
worse.mode = 'play'
worse.hero.y = worse.stage.rows * 16 + 40
for (let i = 0; i < 400 && !worse.over; i++) worse.update(emptyInput())
assert.equal(
  readPlumberSave(worse.save)!.endlessBest,
  ran,
  'a shorter run keeps the old best',
)

console.log(
  'Save the Plumber Endless: seeded zones cycle eight worlds, join on flat ground, a full lap clears at rising pace, one life, best kept beside the campaign save',
)
