import assert from 'node:assert/strict'
import {
  TRAIN_CHOICES,
  chooseTrain,
  newTrainProgress,
  restoreTrainProgress,
  trainConsequences,
  replayTrainEncounters,
  restoreVerifiedTrainProgress,
} from '../memoryDungeon/lastTrain'

const scenes = Object.keys(TRAIN_CHOICES) as (keyof typeof TRAIN_CHOICES)[]
assert.equal(scenes.length, 4)
assert.equal(new Set(scenes.flatMap((scene) => TRAIN_CHOICES[scene])).size, 12)

for (const door of [...TRAIN_CHOICES.e03Door, undefined])
  for (const timetable of [...TRAIN_CHOICES.e03Timetable, undefined])
    for (const platform of [...TRAIN_CHOICES.e04Platform, undefined])
      for (const carriage of [...TRAIN_CHOICES.e04Carriage, undefined]) {
        let progress = newTrainProgress()
        if (door) progress = chooseTrain(progress, 'e03Door', door)
        if (timetable)
          progress = chooseTrain(progress, 'e03Timetable', timetable)
        if (platform) progress = chooseTrain(progress, 'e04Platform', platform)
        if (carriage) progress = chooseTrain(progress, 'e04Carriage', carriage)
        assert.deepEqual(restoreTrainProgress(progress), progress)
        const effects = trainConsequences(progress)
        assert.equal(effects.trainToken, door === 'md.train.e03.release')
        assert.equal(effects.trainRouteSlip, door === 'md.train.e03.wait')
        assert.equal(
          effects.trainEchoFragment,
          platform === 'md.train.e04.open' ||
            platform === 'md.train.e04.listen',
        )
        assert.equal(
          effects.trainWitness,
          door === 'md.train.e03.release'
            ? 'public'
            : door === 'md.train.e03.wait'
              ? 'private'
              : door === 'md.train.e03.leave'
                ? 'none'
                : null,
        )
        for (const scene of scenes)
          for (const replacement of TRAIN_CHOICES[scene]) {
            const replay = chooseTrain(progress, scene, replacement)
            if (progress.decisions[scene]) assert.deepEqual(replay, progress)
            assert.deepEqual(
              trainConsequences(replay),
              trainConsequences(restoreTrainProgress(replay)!),
            )
          }
      }

for (const forged of [
  { version: 2, decisions: {} },
  { version: 1, decisions: { e03Door: 'forged' } },
  { version: 1, decisions: { e04Carriage: undefined } },
  { version: 1, decisions: { other: 'md.train.e03.wait' } },
  { version: 1, decisions: {}, injected: true },
  { version: 1, decisions: [] },
  Object.assign(Object.create(null), { version: 1, decisions: {} }),
]) {
  assert.equal(restoreTrainProgress(forged), null)
  assert.deepEqual(
    trainConsequences(forged as never),
    trainConsequences(newTrainProgress()),
  )
  assert.equal(
    chooseTrain(forged as never, 'e03Door', 'md.train.e03.release'),
    forged,
  )
}

assert.deepEqual(restoreTrainProgress(null), newTrainProgress())
assert.deepEqual(restoreTrainProgress(undefined), newTrainProgress())

const visited = [
  {
    world: 'e03' as const,
    scene: 'e03Door' as const,
    choice: 'md.train.e03.wait',
  },
  {
    world: 'e04' as const,
    scene: 'e04Platform' as const,
    choice: 'md.train.e04.listen',
  },
]
const verified = replayTrainEncounters(visited)
assert.deepEqual(verified.decisions, {
  e03Door: 'md.train.e03.wait',
  e04Platform: 'md.train.e04.listen',
})
assert.deepEqual(restoreVerifiedTrainProgress(verified, visited), verified)
assert.equal(
  restoreVerifiedTrainProgress(
    {
      version: 1,
      decisions: { ...verified.decisions, e04Carriage: 'md.train.e04.name' },
    },
    visited,
  ),
  null,
)
assert.equal(
  restoreVerifiedTrainProgress(
    { version: 1, decisions: { e04Platform: 'md.train.e04.listen' } },
    visited,
  ),
  null,
)
assert.deepEqual(
  replayTrainEncounters([
    { world: 'e03', scene: 'e04Platform', choice: 'md.train.e04.open' },
    ...visited,
    { world: 'e03', scene: 'e03Door', choice: 'md.train.e03.release' },
    { world: 'e04', scene: 'e04Carriage', choice: 'invalid-choice' },
  ]),
  verified,
)
assert.deepEqual(
  trainConsequences(replayTrainEncounters([])),
  trainConsequences(newTrainProgress()),
)

// The expedition's world order is irreversible: e03 rewards cannot be
// backfilled after e04 begins, even with otherwise valid scene/choice IDs.
const outOfOrder = [
  {
    world: 'e04' as const,
    scene: 'e04Platform' as const,
    choice: 'md.train.e04.listen',
  },
  {
    world: 'e03' as const,
    scene: 'e03Door' as const,
    choice: 'md.train.e03.release',
  },
  {
    world: 'e04' as const,
    scene: 'e04Carriage' as const,
    choice: 'md.train.e04.map',
  },
]
const orderedNight = replayTrainEncounters(outOfOrder)
assert.equal(orderedNight.decisions.e03Door, undefined)
assert.equal(orderedNight.decisions.e04Platform, 'md.train.e04.listen')
assert.equal(orderedNight.decisions.e04Carriage, 'md.train.e04.map')
assert.equal(trainConsequences(orderedNight).trainToken, false)
assert.equal(
  restoreVerifiedTrainProgress(
    {
      version: 1,
      decisions: {
        e03Door: 'md.train.e03.release',
        e04Platform: 'md.train.e04.listen',
        e04Carriage: 'md.train.e04.map',
      },
    },
    outOfOrder,
  ),
  null,
)
assert.deepEqual(
  restoreVerifiedTrainProgress(orderedNight, outOfOrder),
  orderedNight,
)

// A malformed e04 choice cannot prematurely seal e03. The first valid e04
// decision is the actual chronological boundary for replayed rewards.
const invalidNightThenDay = [
  { world: 'e04' as const, scene: 'e04Platform' as const, choice: 'forged' },
  {
    world: 'e03' as const,
    scene: 'e03Door' as const,
    choice: 'md.train.e03.release',
  },
  {
    world: 'e04' as const,
    scene: 'e04Platform' as const,
    choice: 'md.train.e04.listen',
  },
  {
    world: 'e03' as const,
    scene: 'e03Timetable' as const,
    choice: 'md.train.e03.share',
  },
]
const recoveredDay = replayTrainEncounters(invalidNightThenDay)
assert.deepEqual(recoveredDay.decisions, {
  e03Door: 'md.train.e03.release',
  e04Platform: 'md.train.e04.listen',
})
assert.equal(trainConsequences(recoveredDay).trainToken, true)
assert.equal(recoveredDay.decisions.e03Timetable, undefined)
assert.deepEqual(
  restoreVerifiedTrainProgress(recoveredDay, invalidNightThenDay),
  recoveredDay,
)
