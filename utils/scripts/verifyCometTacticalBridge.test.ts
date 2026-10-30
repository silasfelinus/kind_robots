import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fieldFor, IDENTITY_ARCS } from '../cometAcademy/identityArcs'
import {
  assignPlayerCase,
  chooseRecommendedRival,
  incidentsFor,
  resolveDispatch,
  restoreAcademy,
  startFullAcademy,
} from '../cometAcademy/rules'
import {
  newTacticalInterlude,
  advanceRivalArena,
  discoverRivalSecret,
  reconcileTacticalVictory,
  secureRivalObjective,
  recommendedRivalFor,
  tacticalOpening,
  tacticalResultFor,
  tacticalRoleFor,
} from '../cometAcademy/tacticalInterlude'
import { aliasFor, moveSelected } from '../everyVillainTactics/training'
import { stageProblems } from '../everyVillainTactics/studio'
import { rivalArenaFor, originArenaFor } from '../cometAcademy/rivalArenas'
import { campaignStagesFor } from '../cometAcademy/identityCampaignStages'
import { pathDistance, tileAt } from '../everyVillainTactics/combat'

assert.equal(IDENTITY_ARCS.length, 48)
const rivals = new Set<string>()
const arenaMaps = new Set<string>()
const originMaps = new Set<string>()
const arenaTitles = new Set<string>()
for (const identity of IDENTITY_ARCS) {
  const foil = recommendedRivalFor(identity.signature)
  assert.notEqual(foil.signature, identity.signature)
  rivals.add(foil.signature)
  const originArena = originArenaFor(identity.signature)
  originMaps.add(JSON.stringify(originArena.stage.map.tiles))
  assert.equal(originArena.stage.id, 'hero-origin-' + identity.signature)
  assert.equal(
    originArena.stage.title,
    campaignStagesFor(identity.signature).opening.title,
  )
  assert.equal(
    originArena.stage.objective,
    campaignStagesFor(identity.signature).opening.inciting,
  )
  assert.deepEqual(
    stageProblems(originArena.stage),
    [],
    identity.signature + ' origin map is unplayable',
  )
  assert.ok(
    Number.isFinite(
      pathDistance(
        originArena.stage.map,
        [],
        { x: 0, y: 4 },
        originArena.objectivePoint,
      ),
    ),
  )
  const arena = rivalArenaFor(identity.signature)
  arenaTitles.add(arena.stage.title)
  arenaMaps.add(JSON.stringify(arena.stage.map.tiles))
  assert.equal(arena.stage.id, 'rival-lair-' + identity.signature)
  assert.equal(
    arena.stage.title,
    campaignStagesFor(identity.signature).lair.title,
  )
  assert.equal(
    arena.stage.objective,
    campaignStagesFor(identity.signature).lair.objective,
  )
  assert.equal(arena.secret, campaignStagesFor(identity.signature).lair.secret)
  assert.deepEqual(
    stageProblems(arena.stage),
    [],
    identity.signature + ' has an unplayable map',
  )
  assert.equal(tileAt(arena.stage.map, arena.objectivePoint).wall, undefined)
  assert.ok(
    Number.isFinite(
      pathDistance(arena.stage.map, [], { x: 0, y: 4 }, arena.objectivePoint),
    ),
  )
  assert.equal(
    recommendedRivalFor(foil.signature).signature,
    identity.signature,
    'recommended antagonist pairings must be reciprocal',
  )
}
assert.equal(
  rivals.size,
  48,
  'all 48 people need their own rival recommendation',
)
assert.equal(
  arenaTitles.size,
  48,
  'all 48 rivals need distinct authored lair names',
)
assert.equal(
  arenaMaps.size,
  48,
  'all 48 rivals need distinct physical cover and wall layouts',
)
assert.equal(
  originMaps.size,
  48,
  'all 48 origin fights need distinct physical layouts',
)

const lead = IDENTITY_ARCS.find(
  (person) => person.signature === 'accident-fire',
)!
const seed = 143
const base = startFullAcademy(fieldFor(lead.signature), seed, lead.signature)
assert.notEqual(base.opponentSignature, lead.signature)
const recommended = chooseRecommendedRival(base)
assert.equal(
  recommended.opponentSignature,
  recommendedRivalFor(lead.signature).signature,
)
assert.equal(
  chooseRecommendedRival(recommended).opponentSignature,
  recommended.opponentSignature,
)
assert.equal(
  restoreAcademy(JSON.parse(JSON.stringify(recommended)))?.opponentSignature,
  recommended.opponentSignature,
)

const originRun = { ...recommended, day: 4, phase: 'dispatch' as const }
const originCase = incidentsFor(originRun)[0]!
const firstBattle = newTacticalInterlude(
  assignPlayerCase(originRun, originCase.id),
)!
assert.equal(firstBattle.state.stageId, 'hero-origin-' + lead.signature)
assert.equal(firstBattle.arena?.kind, 'origin')
assert.equal(firstBattle.arena?.signature, lead.signature)
assert.equal(
  firstBattle.arena?.title,
  campaignStagesFor(lead.signature).opening.title,
)
assert.equal(
  aliasFor(firstBattle.state.units.find((unit) => unit.id === 'pip')!),
  'Masked Rival',
)
assert.ok(
  restoreAcademy(
    JSON.parse(
      JSON.stringify({
        ...originRun,
        playerCaseId: originCase.id,
        tacticalBattle: firstBattle,
      }),
    ),
  ),
  'early origin battle persists without revealing an antagonist',
)
const completedOrigin = JSON.parse(
  JSON.stringify(firstBattle),
) as typeof firstBattle
completedOrigin.arena!.secured = true
completedOrigin.arena!.discovered = true
completedOrigin.state.phase = 'victory'
for (const enemy of completedOrigin.state.units.filter(
  (unit) => unit.team === 'rival',
))
  enemy.hp = 0
const originResult = tacticalResultFor({
  ...originRun,
  playerCaseId: originCase.id,
  tacticalBattle: completedOrigin,
})!
assert.equal(originResult.stageId, 'hero-origin-' + lead.signature)
const originDebrief = resolveDispatch({
  ...originRun,
  playerCaseId: originCase.id,
  tacticalResult: originResult,
  tacticalHistory: [originResult],
})
const originReport = originDebrief.reports.find(
  (entry) => entry.caseId === originCase.id,
)!
assert.match(originReport.text, /ORIGIN MISSION:/)
assert.match(originReport.text, /ORIGIN DISCOVERY:/)
assert.doesNotMatch(originReport.text, /RIVAL LAIR:/)
assert.ok(
  restoreAcademy(JSON.parse(JSON.stringify(originDebrief))),
  'day-four origin result must persist',
)
const day = 15
const dispatchState = {
  ...recommended,
  day,
  phase: 'dispatch' as const,
}
const firstMission = incidentsFor(dispatchState)[0]!
const withLead = assignPlayerCase(dispatchState, firstMission.id)
assert.equal(withLead.playerCaseId, firstMission.id)
const battle = newTacticalInterlude(withLead)!
assert.ok(battle)
assert.equal(battle.day, day)
assert.equal(battle.caseId, firstMission.id)
assert.equal(battle.opponent, recommended.opponentSignature)
assert.equal(battle.state.map.width, 9)
assert.equal(battle.state.map.height, 6)
assert.ok(battle.arena)
assert.equal(battle.state.stageId, 'rival-lair-' + battle.opponent)
assert.equal(battle.arena?.title, campaignStagesFor(battle.opponent).lair.title)
assert.equal(
  battle.state.units.filter((unit) => unit.team === 'rival').length,
  3,
)
assert.equal(
  battle.state.units.find((unit) => unit.id === 'backdraft')?.identity,
  lead.signature,
)
assert.equal(
  battle.state.units.find((unit) => unit.id === 'pip')?.identity,
  recommended.opponentSignature,
)
const threeFriends = newTacticalInterlude({
  ...withLead,
  assignments: [
    { caseId: firstMission.id, students: ['mina', 'imani', 'nix'] },
  ],
})!
assert.equal(
  threeFriends.state.units.filter((unit) => unit.team === 'squad').length,
  4,
  'protagonist and all three recruited followers enter the battlefield',
)
assert.equal(
  threeFriends.state.units.find((unit) => unit.id === 'third-follower')
    ?.henchmanName,
  'nix',
)
assert.ok(battle.state.units.some((unit) => unit.henchmanName))
assert.ok(battle.state.units.find((unit) => unit.henchmanName)?.maxHp === 1)
assert.match(tacticalOpening(withLead), /trap|choose what it is prepared/)
assert.equal(tacticalRoleFor(withLead), 'hero')
assert.ok(moveSelected(battle.state, { x: 2, y: 4 }))
const activeRun = { ...withLead, tacticalBattle: battle }
assert.ok(
  restoreAcademy(JSON.parse(JSON.stringify(activeRun))),
  'ongoing fights survive save/reload',
)
assert.equal(
  resolveDispatch(activeRun),
  activeRun,
  'cannot resolve a night with an unfinished tactical battle',
)
assert.equal(
  newTacticalInterlude(activeRun),
  null,
  'do not duplicate active battle',
)

const conquered = JSON.parse(JSON.stringify(activeRun)) as typeof activeRun
conquered.tacticalBattle.state.phase = 'victory'
assert.equal(
  tacticalResultFor(conquered),
  null,
  'rival defeat alone cannot skip the mission objective',
)
conquered.tacticalBattle.arena!.secured = true
for (const unit of conquered.tacticalBattle.state.units) {
  if (unit.team === 'rival') unit.hp = 0
}
const victory = tacticalResultFor(conquered)!
assert.equal(victory.grade, 'honors')
assert.equal(victory.role, 'hero')
assert.equal(victory.fallen, 0)
assert.equal(victory.stageId, 'rival-lair-' + battle.opponent)
assert.equal(victory.secured, true)
const resolved = resolveDispatch({
  ...conquered,
  tacticalBattle: null,
  tacticalResult: victory,
  tacticalHistory: [victory],
})
const battleReport = resolved.reports.find(
  (report) => report.caseId === firstMission.id,
)!
assert.equal(
  battleReport.grade,
  'honors',
  'real result overrides the automatic odds roll',
)
assert.match(battleReport.text, /TACTICAL HERO: HONORS/)
assert.equal(resolved.phase, 'debrief')
assert.equal(resolved.tacticalResult, null)
assert.equal(resolved.tacticalBattle, null)
assert.equal(resolved.tacticalHistory?.length, 1)
assert.ok(
  restoreAcademy(JSON.parse(JSON.stringify(resolved))),
  'battle record survives debrief reload',
)
const next = { ...resolved, day: 16, phase: 'map' as const }
assert.ok(
  restoreAcademy(JSON.parse(JSON.stringify(next))),
  'battle history can persist to later days',
)

const villainRun = startFullAcademy(
  fieldFor(lead.signature),
  seed,
  lead.signature,
  undefined,
  'villain',
)
const chosenVillain = {
  ...villainRun,
  day: 23,
  phase: 'dispatch' as const,
  playerCaseId: firstMission.id,
}
assert.equal(tacticalRoleFor(chosenVillain), 'villain')
assert.match(tacticalOpening(chosenVillain), /defending/)
const villainBattle = newTacticalInterlude(chosenVillain)!
assert.ok(
  aliasFor(villainBattle.state.units.find((unit) => unit.id === 'vee')!)
    .length > 3,
)
assert.equal(
  villainBattle.state.units.find((unit) => unit.id === 'vee')?.maxHp,
  4,
)
villainBattle.state.phase = 'defeat'
const defeat = tacticalResultFor({
  ...chosenVillain,
  tacticalBattle: villainBattle,
})!
assert.equal(defeat.grade, 'failed')
assert.equal(defeat.role, 'villain')

const badSave = JSON.parse(JSON.stringify(activeRun))
badSave.tacticalBattle.opponent = lead.signature
assert.equal(restoreAcademy(badSave), null)
const badTurn = JSON.parse(JSON.stringify(activeRun))
badTurn.tacticalBattle.state.turn = -5
assert.equal(restoreAcademy(badTurn), null)
const objectiveRun = newTacticalInterlude(withLead)!
const objective = objectiveRun.arena!
const originalMap = JSON.stringify(objectiveRun.state.map.tiles)
objectiveRun.state.turn = 3
assert.equal(advanceRivalArena(objectiveRun), true)
assert.notEqual(JSON.stringify(objectiveRun.state.map.tiles), originalMap)
assert.equal(
  advanceRivalArena(objectiveRun),
  false,
  'arena shift is once per battle',
)
const savedShift = {
  ...withLead,
  tacticalBattle: objectiveRun,
}
assert.ok(
  restoreAcademy(JSON.parse(JSON.stringify(savedShift))),
  'shifted cover and secret persist on reload',
)
const player = objectiveRun.state.units.find((unit) => unit.id === 'backdraft')!
player.x = objective.secretPoint.x
player.y = objective.secretPoint.y
assert.equal(discoverRivalSecret(objectiveRun), true)
assert.equal(discoverRivalSecret(objectiveRun), false)
assert.match(objectiveRun.state.log, /SECRET FOUND/)
for (const foe of objectiveRun.state.units.filter(
  (unit) => unit.team === 'rival',
))
  foe.hp = 0
objectiveRun.state.phase = 'victory'
reconcileTacticalVictory(objectiveRun)
assert.equal(
  objectiveRun.state.phase,
  'active',
  'objective remains mandatory after enemies fall',
)
player.x = objective.objectivePoint.x - 1
player.y = objective.objectivePoint.y
player.ap = 2
assert.equal(secureRivalObjective(objectiveRun), true)
assert.equal(objectiveRun.state.phase, 'victory')
assert.equal(secureRivalObjective(objectiveRun), false)
const discoveredResult = tacticalResultFor({
  ...withLead,
  tacticalBattle: objectiveRun,
})!
assert.equal(discoveredResult.discovered, true)
assert.equal(discoveredResult.secured, true)
assert.equal(discoveredResult.grade, 'honors')
const discoveredDebrief = resolveDispatch({
  ...withLead,
  tacticalBattle: null,
  tacticalResult: discoveredResult,
  tacticalHistory: [discoveredResult],
})
const discoveryReport = discoveredDebrief.reports.find(
  (entry) => entry.caseId === firstMission.id,
)!
assert.match(discoveryReport.text, /HIDDEN REVELATION:/)
assert.ok(
  discoveredDebrief.influence > resolved.influence,
  'discovering evidence improves civic standing',
)
const tamperedMap = JSON.parse(JSON.stringify(savedShift))
tamperedMap.tacticalBattle.arena.objectivePoint.x = 100
assert.equal(restoreAcademy(tamperedMap), null)

const oldSave = { ...base }
assert.ok(
  restoreAcademy(JSON.parse(JSON.stringify(oldSave))),
  'legacy save unchanged',
)

const ui = readFileSync(
  new URL('../../pages/play/comet-city-academy.vue', import.meta.url),
  'utf8',
)
const store = readFileSync(
  new URL('../../stores/cometAcademyStore.ts', import.meta.url),
  'utf8',
)
assert.match(ui, /data-testid="academy-recommended-rival"/)
assert.match(ui, /data-testid="academy-launch-tactical"/)
assert.match(ui, /AcademyTacticalFight/)
assert.match(store, /battleResolve\(\)/)
assert.match(store, /battleClick\(x: number, y: number\)/)
console.log(
  'Prom of Doom tactical bridge: 48 rivals, playable mission handoff, hero/villain outcomes, legacy saves verified.',
)
