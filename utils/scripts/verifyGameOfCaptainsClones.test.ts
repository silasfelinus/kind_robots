import assert from 'node:assert/strict'
import {
  advanceCloneQuest,
  cloneCandidates,
  cloneCost,
  cloneEndingCoda,
  cloneGeneration,
  cloneOddsBonus,
  cloneProgram,
  cloneQuestStatus,
  printClone,
  recordCloneMissions,
  CLONE_CHAPTERS,
} from '../gameOfCaptains/cloneSaga'
import { restoreVoyage, startVoyage } from '../gameOfCaptains/rules'
import type { VoyageRun } from '../gameOfCaptains/rules'

assert.equal(CLONE_CHAPTERS.length, 5)
assert.deepEqual([1, 2, 3, 4].map(cloneCost), [3, 5, 7, 9])
const original = startVoyage('fluke', ['pell', 'vela', 'tess'], 42042)
const id = original.redshirtRoster![0]!
assert.equal(cloneQuestStatus(original).ready, false)
assert.equal(
  printClone(original, id),
  original,
  'cannot print a living original',
)
assert.equal(
  advanceCloneQuest(original, 'ask'),
  original,
  'cannot skip the memorial',
)

// A real original death is a historical record, and a genuine next episode is required.
let run: VoyageRun = {
  ...original,
  chapter: 1,
  phase: 'briefing',
  redshirtRoster: original.redshirtRoster!.filter((person) => person !== id),
  redshirtFallen: [
    { id, chapter: 1, encounterId: 'local-M0', missionId: 'refugees' },
  ],
  supplies: 90,
}
assert.ok(cloneQuestStatus(run).ready)
run = advanceCloneQuest(run, 'document')
assert.equal(cloneProgram(run).step, 1)
assert.equal(run.reputation, original.reputation + 1)
assert.equal(
  cloneCandidates(run).find((item) => item.id === id)!.available,
  false,
)
assert.equal(printClone(run, id), run, 'no same-episode resurrection')
const afterMemorial = JSON.parse(JSON.stringify(run))
assert.deepEqual(
  restoreVoyage(afterMemorial),
  run,
  'v1 save survives additive clone record',
)
run = { ...run, chapter: 2, expeditionVisit: null }
run = printClone(run, id)
assert.equal(cloneGeneration(run, id), 1)
assert.equal(cloneOddsBonus(run, id), 6)
assert.ok(run.redshirtRoster?.includes(id))
assert.equal(
  run.redshirtFallen?.length,
  1,
  'a new clone does not erase the first death',
)
assert.equal(
  printClone(run, id),
  run,
  'cannot print the same person twice in one episode',
)
assert.equal(cloneQuestStatus(run).ready, false, 'must deploy Gen I')
let afterDispatch: VoyageRun = {
  ...run,
  expeditionVisit: {
    chapter: 2,
    missionId: 'refugees',
    encounterIds: ['galaxy-m1'],
    results: [
      {
        encounterId: 'galaxy-m1',
        lead: id,
        casualty: null,
        secret: false,
        revealedPower: null,
        outcome: 'The clone discovers a hidden letter.',
      },
    ],
  },
}
afterDispatch = recordCloneMissions(run, afterDispatch)
assert.equal(cloneProgram(afterDispatch).records[0]!.deployments, 1)
assert.equal(
  cloneProgram(recordCloneMissions(afterDispatch, afterDispatch)).records[0]!
    .deployments,
  1,
)
assert.equal(
  cloneQuestStatus(afterDispatch).ready,
  false,
  'one story beat per episode',
)
run = { ...afterDispatch, chapter: 3, expeditionVisit: null }
assert.equal(cloneQuestStatus(run).ready, true)
run = advanceCloneQuest(run, 'ask')
assert.equal(cloneProgram(run).step, 2)
assert.equal(cloneQuestStatus(run).ready, false)
assert.ok(cloneCandidates(run).find((item) => item.id === id)!.available)
run = printClone(run, id)
assert.equal(cloneGeneration(run, id), 2)
assert.equal(cloneProgram(run).records.length, 2)
assert.equal(
  cloneProgram(run).records[0]!.deployments,
  1,
  'prior gen field memories persist',
)
assert.equal(cloneOddsBonus(run, id), 12)
const unchanged = printClone(run, id)
assert.equal(unchanged, run, 'cannot farm generations with free clicks')

// A genuine Gen II field test, then the first casino-rights hearing.
const genTwoResult = {
  encounterId: 'casino-union',
  lead: id,
  casualty: null,
  secret: false,
  revealedPower: null,
  outcome: 'The testimony is preserved.',
}
run = recordCloneMissions(run, {
  ...run,
  expeditionVisit: {
    chapter: 3,
    missionId: 'refugees',
    encounterIds: ['casino-union'],
    results: [genTwoResult],
  },
})
assert.equal(cloneProgram(run).records[1]!.deployments, 1)
run = { ...run, chapter: 4, expeditionVisit: null }
assert.equal(cloneQuestStatus(run).ready, true)
run = advanceCloneQuest(run, 'document')
assert.equal(cloneProgram(run).step, 3)
run = printClone(run, id)
assert.equal(cloneGeneration(run, id), 3)
assert.equal(cloneOddsBonus(run, id), 18)

// The Gen III mission may kill a clone; neither the memorial nor field
// experience disappears, and the character cannot be selected again.
run = recordCloneMissions(run, {
  ...run,
  redshirtRoster: run.redshirtRoster!.filter((person) => person !== id),
  redshirtFallen: [
    ...run.redshirtFallen!,
    { id, chapter: 4, encounterId: 'star-collapse', missionId: 'refugees' },
  ],
  expeditionVisit: {
    chapter: 4,
    missionId: 'refugees',
    encounterIds: ['star-collapse'],
    results: [{ ...genTwoResult, encounterId: 'star-collapse', casualty: id }],
  },
})
assert.equal(cloneGeneration(run, id), 0)
assert.equal(cloneProgram(run).records.at(-1)!.lost, true)
assert.equal(cloneProgram(run).records.at(-1)!.deployments, 1)
assert.equal(run.redshirtFallen?.length, 2)
run = { ...run, chapter: 5, expeditionVisit: null }
// Death alone never satisfies the living-Gen-III testimony gate.
assert.equal(cloneQuestStatus(run).ready, false)
const replacement = cloneCandidates(run).find((x) => x.id === id)!
assert.equal(
  replacement.generation,
  3,
  'repeat the unearned tier, do not skip it',
)
assert.equal(replacement.available, true)
run = printClone(run, id)
assert.equal(cloneGeneration(run, id), 3)
assert.equal(cloneProgram(run).records.at(-1)!.iteration, 2)
assert.equal(
  run.redshirtFallen?.length,
  2,
  'both previous deaths remain recorded',
)
assert.equal(
  cloneQuestStatus(run).ready,
  false,
  'reprinting is not field evidence',
)
run = recordCloneMissions(run, {
  ...run,
  expeditionVisit: {
    chapter: 5,
    missionId: 'refugees',
    encounterIds: ['reborn-field-record'],
    results: [{ ...genTwoResult, encounterId: 'reborn-field-record' }],
  },
})
assert.equal(
  cloneQuestStatus(run).ready,
  false,
  'mission still in current episode',
)
run = { ...run, chapter: 6, expeditionVisit: null }
assert.equal(cloneQuestStatus(run).ready, true)
const validCheckpoint = { ...run, missionId: undefined }
assert.deepEqual(
  restoreVoyage(JSON.parse(JSON.stringify(validCheckpoint))),
  JSON.parse(JSON.stringify(validCheckpoint)),
  'save restores when its mission belongs to its simulated chapter',
)
run = advanceCloneQuest(run, 'ask')
assert.equal(cloneProgram(run).step, 4)
run = printClone(run, id)
assert.equal(cloneGeneration(run, id), 4)
assert.equal(cloneCandidates(run).find((x) => x.id === id)?.available, false)
run = recordCloneMissions(run, {
  ...run,
  expeditionVisit: {
    chapter: 6,
    missionId: 'refugees',
    encounterIds: ['future-memory'],
    results: [{ ...genTwoResult, encounterId: 'future-memory' }],
  },
})
run = { ...run, chapter: 7, expeditionVisit: null }
assert.ok(cloneQuestStatus(run).ready)
run = advanceCloneQuest(run, 'document')
assert.equal(cloneProgram(run).step, 5)
assert.equal(cloneQuestStatus(run).ready, false)
assert.equal(advanceCloneQuest(run, 'document'), run)
const completed = cloneEndingCoda({
  ...run,
  phase: 'ending',
  ending: 'A New Home',
  scene: 'Finale.',
})
assert.match(completed.ending ?? '', /Rights of Copies/)
assert.match(completed.scene, /clone tribunal/)
assert.equal(
  cloneEndingCoda(completed),
  completed,
  'a final review cannot duplicate the coda',
)
assert.equal(cloneEndingCoda(run), run, 'no premature ending')

// The high-speed ethics route is allowed but never forgotten.
let controversial: VoyageRun = {
  ...original,
  chapter: 1,
  redshirtRoster: original.redshirtRoster!.filter((person) => person !== id),
  redshirtFallen: [
    { id, chapter: 1, encounterId: 'local-M0', missionId: 'refugees' },
  ],
}
controversial = advanceCloneQuest(controversial, 'override')
assert.equal(controversial.trust, original.trust - 2)
assert.ok((controversial.worldFlags ?? []).includes('clone-quest:0:override'))
const broken: VoyageRun = {
  ...original,
  chapter: 1,
  supplies: 0,
  redshirtRoster: original.redshirtRoster!.filter((person) => person !== id),
  redshirtFallen: [
    { id, chapter: 1, encounterId: 'local-M0', missionId: 'refugees' },
  ],
}
const brokeThenUnlocked = advanceCloneQuest(broken, 'document')
assert.equal(printClone({ ...brokeThenUnlocked, chapter: 2 }, id).supplies, 0)
console.log(
  'Space Couch Red Thread cloning, tiers, consent and v1 persistence verified',
)
