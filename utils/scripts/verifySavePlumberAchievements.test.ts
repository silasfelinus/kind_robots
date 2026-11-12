import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  achievementCode,
  achievementsForGame,
} from '../achievements/gameAchievements'
import {
  PLUMBER_ACHIEVEMENT_CODES,
  PLUMBER_BOSS_FEATS,
  PLUMBER_ROSTER_PARTS,
  plumberProgressFeats,
  rosterComplete,
} from '../arcade/games/savePlumberAchievements'
import { OVERWORLD, nodeBuilt } from '../arcade/games/savePlumberOverworld'
import { createSavePlumberPreview } from '../arcade/games/savePlumberPreview'
import { PLUMBER_WORLDS } from '../arcade/games/savePlumberWorlds'
import { emptyInput } from '../arcade/types'

const GAME = 'save-the-plumber'

// The catalog and the run's queue agree, with the cabinet's arcade- prefix.
const catalog = achievementsForGame(GAME)
assert.ok(catalog.length >= 12 && catalog.length <= 30)
assert.deepEqual(
  catalog.map((entry) => entry.key).sort(),
  Object.keys(PLUMBER_ACHIEVEMENT_CODES).sort(),
)
for (const [key, code] of Object.entries(PLUMBER_ACHIEVEMENT_CODES))
  assert.equal(code, achievementCode({ game: GAME, key }))

// Boss achievements name real world bosses.
assert.equal(PLUMBER_WORLDS[0]!.boss.name, 'Madame Pressure')
assert.equal(PLUMBER_WORLDS[3]!.boss.name, 'Tick-Tock Duchess')
assert.equal(PLUMBER_WORLDS[6]!.boss.name, 'The Umbrella Dragon')
assert.deepEqual(Object.keys(PLUMBER_BOSS_FEATS), ['1', '4', '7'])

// Every key is queued somewhere: the engine, or the Maker store.
const engine = readFileSync('utils/arcade/games/savePlumberPreview.ts', 'utf8')
const helper = readFileSync(
  'utils/arcade/games/savePlumberAchievements.ts',
  'utf8',
)
const maker = readFileSync('stores/savePlumberMakerStore.ts', 'utf8')
assert.ok(maker.includes('PLUMBER_ACHIEVEMENT_CODES.maker'))
for (const key of Object.keys(PLUMBER_ACHIEVEMENT_CODES)) {
  if (key === 'maker') continue
  assert.ok(
    engine.includes(`this.feat('${key}')`) ||
      helper.includes(`push('${key}')`) ||
      Object.values(PLUMBER_BOSS_FEATS).includes(key as never),
    `${key} is queued at its deed`,
  )
}

// Completion feats from a slot's progress.
const nodes = OVERWORLD.flatMap((map) =>
  map.nodes.filter(nodeBuilt).map((node) => ({ world: map.world, node })),
)
const worldOne = nodes.filter((n) => n.world === 1)
const gearsOf = (list: typeof nodes) => list.map((n) => n.node.stage!)
assert.deepEqual(
  plumberProgressFeats({ done: [], secrets: [], gears: [] }, 1),
  [],
)
assert.deepEqual(
  plumberProgressFeats({ done: [], secrets: [], gears: gearsOf(worldOne) }, 1),
  ['gear-world'],
)
assert.ok(
  !plumberProgressFeats(
    { done: [], secrets: [], gears: gearsOf(worldOne).slice(1) },
    1,
  ).includes('gear-world'),
)
const everything = {
  done: nodes.map((n) => n.node.id),
  secrets: nodes.map((n) => n.node.id),
  gears: gearsOf(nodes),
}
assert.deepEqual(plumberProgressFeats(everything, 8), [
  'gear-world',
  'all-gears',
  'hundred-percent',
])

// The roster: a part per heroine, complete with all eight.
assert.equal(PLUMBER_ROSTER_PARTS.length, 8)
assert.ok(rosterComplete(new Set(PLUMBER_ROSTER_PARTS)))
assert.ok(!rosterComplete(new Set(PLUMBER_ROSTER_PARTS.slice(1))))

const options = (extra: { demo?: boolean; mastery?: string[] } = {}) => ({
  rng: () => 0.5,
  sound: { play() {} },
  demo: extra.demo ?? false,
  hiScore: 0,
  mastery: extra.mastery,
})

// Clearing 1-1 (the test pilot plays it) queues First Valve and keeps the
// heroine's roster part as mastery; with the other seven held, Every Heroine.
{
  const probe = createSavePlumberPreview(options(), {
    stage: 0,
    autopilot: true,
  })
  const part = `roster-${probe.member.key}`
  const held = PLUMBER_ROSTER_PARTS.filter((p) => p !== part)
  const fresh = createSavePlumberPreview(options({ mastery: held }), {
    stage: 0,
    autopilot: true,
  })
  const drained: string[] = []
  for (let t = 0; t < 60 * 120 && !fresh.cleared.length; t++) {
    fresh.update(emptyInput())
    drained.push(...fresh.drainFeats())
  }
  assert.deepEqual(fresh.cleared, ['1-1'], 'the pilot clears 1-1')
  assert.ok(drained.includes('first-valve'))
  assert.ok(drained.includes('full-roster'))
  assert.ok(fresh.mastered.includes(part))
  assert.ok(fresh.mastered.includes('first-valve'))
  assert.deepEqual(fresh.drainFeats(), [], 'the queue drains')
}

// The attract demo and a Maker course never queue or keep anything.
{
  const demo = createSavePlumberPreview(options({ demo: true }), { stage: 0 })
  for (let t = 0; t < 60 * 120 && !demo.cleared.length; t++)
    demo.update(emptyInput())
  assert.ok(demo.cleared.length, 'the demo clears a stage')
  assert.deepEqual(demo.drainFeats(), [])
  assert.deepEqual(demo.mastered, [])
}

// An Endless run past 500 m queues Long Haul.
{
  const run = createSavePlumberPreview(options(), {
    endless: true,
    endlessSeed: 0,
    autopilot: true,
  })
  const drained: string[] = []
  for (let t = 0; t < 60 * 400 && run.distance < 520; t++) {
    run.update(emptyInput())
    drained.push(...run.drainFeats())
  }
  assert.ok(run.distance >= 500, `${run.distance} m`)
  assert.ok(drained.includes('endless-500'))
}

console.log(
  `Save the Plumber achievements: ${catalog.length} codes, queued at their deeds.`,
)
