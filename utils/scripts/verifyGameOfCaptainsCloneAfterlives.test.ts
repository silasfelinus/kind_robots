import assert from 'node:assert/strict'
import {
  CLONE_FIELD_TRAITS,
  cloneFieldTrait,
  cloneOddsBonus,
  cloneProgram,
  cloneQuestStatus,
  printClone,
  recordCloneMissions,
  validCloneProgram,
  type CloneProgram,
} from '../gameOfCaptains/cloneSaga'
import { EXPEDITION_ENCOUNTERS } from '../gameOfCaptains/expedition'
import { startVoyage, restoreVoyage, type VoyageRun } from '../gameOfCaptains/rules'

const base = startVoyage('fluke', ['pell', 'tess', 'rue'], 87091)
const id = base.redshirtRoster![0]!
const signatures = CLONE_FIELD_TRAITS
assert.deepEqual(signatures.map((t) => t.generation), [1, 2, 3, 4])
assert.equal(new Set(signatures.map((t) => t.skill)).size, 4)

for (const trait of signatures) {
  const mission = EXPEDITION_ENCOUNTERS.find((e) => e.skill === trait.skill)!
  assert.ok(mission, 'an authored mission is reachable for ' + trait.name)
  const beats = Array.from({ length: trait.generation }, (_, step) => ({
    step,
    chapter: step + 1,
    choice: 'ask' as const,
    narrative: 'Recorded consent at the memorial.',
  }))
  const generationRecord = {
    id,
    generation: trait.generation,
    iteration: 1,
    createdChapter: trait.generation,
    createdDay: trait.generation,
    deployments: 0,
    survived: 0,
    lastEncounter: null,
    lastDeploymentChapter: null,
    lost: false,
  }
  const program: CloneProgram = {
    step: trait.generation,
    beats,
    records: [generationRecord],
  }
  assert.ok(validCloneProgram(program))
  const before: VoyageRun = {
    ...base,
    phase: 'expedition',
    chapter: 6,
    supplies: 14,
    trust: 4,
    reputation: 4,
    nemesisPressure: 5,
    cloneProgram: program,
    expeditionVisit: {
      chapter: 6,
      missionId: 'local-sandbox',
      encounterIds: [mission.id],
      results: [],
    },
  }
  assert.equal(cloneFieldTrait(before, id)?.name, trait.name)
  assert.equal(cloneOddsBonus(before, id), trait.generation * 6)
  assert.equal(
    cloneOddsBonus(before, id, trait.skill),
    trait.generation * 6 + 10,
  )
  const otherSkill = signatures.find((t) => t.skill !== trait.skill)!.skill
  assert.equal(
    cloneOddsBonus(before, id, otherSkill),
    trait.generation * 6,
  )
  const success = {
    encounterId: mission.id,
    lead: id,
    casualty: null,
    secret: false,
    revealedPower: null,
    successful: true,
    outcome: 'The expedition returned with real evidence.',
  }
  const after = recordCloneMissions(before, {
    ...before,
    expeditionVisit: {
      ...before.expeditionVisit!,
      results: [success],
    },
  })
  assert.equal(cloneProgram(after).records[0]!.deployments, 1)
  assert.equal(cloneProgram(after).records[0]!.survived, 1)
  assert.equal(
    after.worldFlags?.filter((f) => f.startsWith('clone-breakthrough:')).length,
    1,
  )
  assert.match(after.scene, /SPECIAL EPISODE:/)
  assert.match(after.scene, new RegExp(trait.name))
  assert.equal(
    after.reputation - before.reputation,
    trait.generation === 1 ? 1 : 0,
  )
  assert.equal(after.trust - before.trust, trait.generation === 2 ? 1 : 0)
  assert.equal(
    (after.nemesisPressure ?? 0) - (before.nemesisPressure ?? 0),
    trait.generation === 3 ? -1 : 0,
  )
  assert.equal(after.supplies - before.supplies, trait.generation === 4 ? 1 : 0)
  assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(after))), after)
  assert.equal(recordCloneMissions(after, after), after, 'idempotent save')
  const repeat = recordCloneMissions(after, {
    ...after,
    expeditionVisit: {
      ...after.expeditionVisit!,
      results: [...after.expeditionVisit!.results],
    },
  })
  assert.equal(repeat, after, 'cannot farm a previously completed field job')

  const failed = recordCloneMissions(before, {
    ...before,
    expeditionVisit: {
      ...before.expeditionVisit!,
      results: [{ ...success, successful: false }],
    },
  })
  assert.ok(
    !(failed.worldFlags ?? []).some((f) => f.startsWith('clone-breakthrough:')),
  )
  assert.equal(failed.reputation, before.reputation)
  assert.equal(failed.trust, before.trust)
  assert.equal(failed.supplies, before.supplies)
  const lost = recordCloneMissions(before, {
    ...before,
    redshirtRoster: before.redshirtRoster!.filter((x) => x !== id),
    expeditionVisit: {
      ...before.expeditionVisit!,
      results: [{ ...success, casualty: id }],
    },
  })
  assert.equal(cloneProgram(lost).records[0]!.lost, true)
  assert.equal(cloneFieldTrait(lost, id), null)
  assert.equal(cloneQuestStatus({ ...lost, chapter: 7 }).ready, false)
  assert.equal(
    (lost.worldFlags ?? []).some((f) => f.startsWith('clone-breakthrough:')),
    false,
  )
}
assert.equal(cloneOddsBonus(base, id, 'science'), 0)
assert.equal(printClone(base, id), base)
assert.equal(validCloneProgram({ step: 0, beats: [], records: [
  { id, generation: 2, iteration: 1, createdChapter: 3, createdDay: 3, deployments: 0, survived: 0, lastEncounter: null, lastDeploymentChapter: null, lost: false },
  { id, generation: 2, iteration: 1, createdChapter: 4, createdDay: 4, deployments: 0, survived: 0, lastEncounter: null, lastDeploymentChapter: null, lost: true },
] }), false, 'duplicate generation + printing ID cannot load')

console.log('Space Couch: four clone mission specialties, fatality guards, redshirt lineage and reward idempotency verified')
