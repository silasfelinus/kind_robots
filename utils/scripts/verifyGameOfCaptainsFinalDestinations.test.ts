import assert from 'node:assert/strict'
import {
  consequenceForRun,
  resolveConsequence,
  validConsequenceHistory,
} from '../gameOfCaptains/consequenceStories'
import { ACT_THREE_CLOSURE_CASES } from '../gameOfCaptains/consequenceStoriesActThreeClosure'
import {
  restoreVoyage,
  startVoyage,
  type VoyageRun,
} from '../gameOfCaptains/rules'
import { VOYAGE_BOARDS } from '../gameOfCaptains/voyageMap'
import { playVoyage } from './spaceCouchTraceHarness'

const routes = ['windglass-exodus', 'deposit-copy'] as const
const narratives = new Set<string>()
const artKeys = new Set<string>()
const outcomeFlags = new Set<string>()

for (const missionId of routes) {
  const episode = ACT_THREE_CLOSURE_CASES[missionId]
  assert.ok(VOYAGE_BOARDS[8]?.includes(missionId))
  assert.equal(episode.choices.length, 3, missionId)
  assert.deepEqual(
    episode.choices.map((choice) => choice.policy).sort(),
    ['aid', 'intervene', 'observe'],
    missionId,
  )
  assert.equal(new Set(episode.choices.map((choice) => choice.id)).size, 3)
  for (const seed of [7, 19, 31, 43]) {
    const before: VoyageRun = {
      ...startVoyage('fluke', ['pell', 'mox', 'rue'], seed),
      chapter: 9,
      phase: 'decision',
      missionId,
    }
    assert.equal(consequenceForRun(before)?.id, episode.id)
    assert.equal(resolveConsequence(before, 'unknown-option'), before)
    for (const choice of episode.choices) {
      assert.ok(choice.label.length >= 35, choice.id)
      assert.ok(choice.approach.length >= 60, choice.id)
      assert.ok(choice.cost.length >= 75, choice.id)
      for (const result of [choice.success, choice.failure]) {
        assert.ok(result.narrative.length >= 300, choice.id)
        assert.ok(result.callback.length >= 85, choice.id)
        assert.ok(result.flags.length >= 2, choice.id)
        narratives.add(result.narrative)
        for (const flag of result.flags) outcomeFlags.add(flag)
      }
      const first = resolveConsequence(before, choice.id)
      const second = resolveConsequence(before, choice.id)
      assert.deepEqual(first, second, 'same choice and seed must replay')
      const record = first.consequenceHistory?.[0]
      assert.equal(first.consequenceHistory?.length, 1)
      assert.ok(
        record?.artKey.startsWith(`consequences/${episode.id}-${choice.id}-`),
      )
      artKeys.add(record!.artKey)
      assert.ok(validConsequenceHistory(first.consequenceHistory))
      assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(first))), first)
      assert.equal(
        consequenceForRun({
          ...before,
          consequenceHistory: first.consequenceHistory,
        }),
        null,
        'restored chapter may not repeat its resolved consequence',
      )
    }
  }
}

const previousFlags = [
  ['windglass-exodus', 'windglass-hidden', /earlier covert escort/],
  ['windglass-exodus', 'windglass-broadcast', /earlier broadcast/],
  ['deposit-copy', 'archive-consented', /private editorial room/],
  ['deposit-copy', 'archive-appropriated', /independent witness/],
] as const

for (const [missionId, flag, expected] of previousFlags) {
  const before: VoyageRun = {
    ...startVoyage('fluke', ['pell', 'mox', 'rue'], 83),
    chapter: 9,
    phase: 'decision',
    missionId,
  }
  const modified = consequenceForRun({ ...before, worldFlags: [flag] })
  assert.match(modified!.opening, expected)
  assert.equal(
    consequenceForRun(before)?.opening,
    ACT_THREE_CLOSURE_CASES[missionId].opening,
  )
}

let fullVoyages = 0
for (let seed = 231; seed <= 242; seed++) {
  const target = routes[(seed - 231) % routes.length]!
  const { run, steps } = playVoyage('fluke', ['mox', 'tess', 'rue'], seed, {
    name: 'chapter-nine-final-destinations',
    order: () => (seed % 2 ? 'aid' : 'observe'),
    chart: (voyage) =>
      voyage.chapter === 9 ? target : VOYAGE_BOARDS[voyage.chapter - 1]?.[0],
    authoredChoices: true,
    sideQuests: false,
    errand: () => null,
    finale: 'protect',
  })
  assert.equal(run.phase, 'ending')
  const finalRecord = run.consequenceHistory?.find(
    (record) => record.chapter === 9 && record.missionId === target,
  )
  assert.ok(finalRecord, 'the final chapter must record the player’s decision')
  assert.ok(run.scene.includes(finalRecord.callback))
  assert.ok(
    run.endingSections?.some(
      (section) =>
        section.label === 'Your final command' &&
        section.lines.includes(finalRecord.callback),
    ),
    'the ending dossier must preserve the player’s chapter-nine consequence',
  )
  assert.ok(
    run.consequenceHistory?.some((record) => record.missionId === target),
    'the selected finale must resolve as a real authored decision',
  )
  assert.ok(
    steps.some((step) => step.startsWith('consequence:')),
    'the harness must play authored decisions through the real engine',
  )
  assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(run))), run)
  fullVoyages++
}
assert.equal(fullVoyages, 12)

assert.equal(narratives.size, 12, 'every result needs original writing')
assert.ok(artKeys.size >= 6, 'all decisions need distinct art keys')
assert.equal(
  outcomeFlags.size,
  24,
  'success and failure must persist separately',
)
console.log(
  'Space Couch final destinations: 2 missions, 6 ethical choices, 12 distinct outcomes, 12 whole voyages and 4 seeded decision replay/restore passes per route',
)
