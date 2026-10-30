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
  recommendedRivalFor,
  tacticalOpening,
  tacticalResultFor,
  tacticalRoleFor,
} from '../cometAcademy/tacticalInterlude'
import { aliasFor, moveSelected } from '../everyVillainTactics/training'

assert.equal(IDENTITY_ARCS.length, 48)
const rivals = new Set<string>()
for (const identity of IDENTITY_ARCS) {
  const foil = recommendedRivalFor(identity.signature)
  assert.notEqual(foil.signature, identity.signature)
  rivals.add(foil.signature)
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
for (const unit of conquered.tacticalBattle.state.units) {
  if (unit.team === 'rival') unit.hp = 0
}
const victory = tacticalResultFor(conquered)!
assert.equal(victory.grade, 'honors')
assert.equal(victory.role, 'hero')
assert.equal(victory.fallen, 0)
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
  'Prom of Doom tactical bridge: 48 rivals, playable mission handoff, hero\/villain outcomes, legacy saves verified.',
)
