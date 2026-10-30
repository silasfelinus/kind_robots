import assert from 'node:assert/strict'
import { IDENTITY_ARCS, fieldFor } from '../cometAcademy/identityArcs'
import { campaignStagesFor } from '../cometAcademy/identityCampaignStages'
import {
  canParleyWithLieutenant,
  newTacticalInterlude,
  parleyWithLieutenant,
  reconcileTacticalVictory,
  tacticalResultFor,
} from '../cometAcademy/tacticalInterlude'
import {
  finishAcademy,
  incidentsFor,
  resolveDispatch,
  restoreAcademy,
  startFullAcademy,
} from '../cometAcademy/rules'

const roster = IDENTITY_ARCS.map((identity) => identity.signature)
assert.equal(roster.length, 48)
for (const signature of roster) {
  const protagonist =
    signature === 'accident-fire' ? 'magic-water' : 'accident-fire'
  const base = startFullAcademy(fieldFor(protagonist), 4738, protagonist)
  const late = {
    ...base,
    day: 23,
    phase: 'dispatch' as const,
    opponentSignature: signature,
    playerCaseId: incidentsFor({ ...base, day: 23 })[0]!.id,
  }
  const battle = newTacticalInterlude(late)!
  assert.ok(battle && battle.arena?.kind === 'lair')
  const boss = battle.state.units.find((unit) => unit.signatureBoss)!
  const lead = battle.state.units.find((unit) => unit.id === 'backdraft')!
  assert.equal(
    boss.lieutenantName,
    campaignStagesFor(signature).lieutenant.name,
  )
  assert.equal(canParleyWithLieutenant(battle), false)
  boss.hp = 2
  lead.x = 7
  lead.y = 3
  lead.ap = 2
  assert.equal(
    canParleyWithLieutenant(battle),
    false,
    'boss wounds alone do not earn a deal',
  )
  battle.arena!.discovered = true
  assert.equal(
    canParleyWithLieutenant(battle),
    true,
    'evidence and proximity unlock a parley',
  )
  lead.ap = 0
  assert.equal(canParleyWithLieutenant(battle), false, 'talking has an AP cost')
  lead.ap = 2
  lead.x = 0
  assert.equal(
    canParleyWithLieutenant(battle),
    false,
    'talking requires danger-close approach',
  )
  lead.x = 7
  const choice =
    signature.endsWith('-air') || signature.endsWith('-social')
      ? 'truce'
      : 'ally'
  assert.equal(parleyWithLieutenant(battle, choice), true)
  assert.equal(lead.ap, 1)
  assert.equal(battle.arena!.lieutenantParley, choice)
  assert.equal(boss.hp, 0)
  assert.equal(boss.signatureTarget, null)
  assert.equal(
    parleyWithLieutenant(battle, choice),
    false,
    'one settlement per encounter',
  )
  const inProgress = { ...late, tacticalBattle: battle }
  assert.ok(
    restoreAcademy(JSON.parse(JSON.stringify(inProgress))),
    signature + ': a negotiated outcome must survive mid-fight reload',
  )
  for (const enemy of battle.state.units.filter(
    (unit) => unit.team === 'rival',
  )) {
    enemy.hp = 0
  }
  battle.arena!.secured = true
  reconcileTacticalVictory(battle)
  assert.equal(battle.state.phase, 'victory')
  const record = tacticalResultFor(inProgress)!
  assert.equal(record.lieutenantParley, choice)
  assert.equal(record.discovered, true)
  const dispatched = resolveDispatch({
    ...late,
    tacticalBattle: null,
    tacticalResult: record,
    tacticalHistory: [record],
  })
  assert.match(
    dispatched.reports[0]!.text,
    choice === 'ally' ? /LIEUTENANT DEFECTED/ : /LIEUTENANT CEASEFIRE/,
  )
  assert.ok(restoreAcademy(JSON.parse(JSON.stringify(dispatched))))
  const nextNight = newTacticalInterlude({
    ...late,
    day: 24,
    tacticalHistory: [record],
  })!
  assert.ok(nextNight)
  assert.equal(
    nextNight.state.units.some((unit) => unit.signatureBoss),
    false,
    'defected or truce lieutenant must not respawn on later nights',
  )
  assert.match(nextNight.state.log, /already defected|agreed to a ceasefire/)
  const finale = finishAcademy(
    {
      ...dispatched,
      day: 30,
      phase: 'finale',
    },
    'share',
  )
  const name = campaignStagesFor(signature).lieutenant.name
  assert.ok(finale.scene.includes(name))
  assert.match(
    finale.scene,
    choice === 'ally' ? /sworn testimony/ : /honors the ceasefire/,
  )
  assert.ok(finale.ending)
  const tampered = JSON.parse(JSON.stringify(inProgress))
  tampered.tacticalBattle.arena.discovered = false
  assert.equal(
    restoreAcademy(tampered),
    null,
    'a parley requires discovered evidence',
  )
  const forged = JSON.parse(JSON.stringify(dispatched))
  forged.tacticalHistory[0].lieutenantParley = 'hostage'
  assert.equal(
    restoreAcademy(forged),
    null,
    'invalid settlement is not imported',
  )
}

const student = startFullAcademy(
  fieldFor('accident-fire'),
  1234,
  'accident-fire',
)
const early = newTacticalInterlude({
  ...student,
  day: 14,
  phase: 'dispatch',
  playerCaseId: 'morning-dream',
})!
assert.ok(early.arena)
early.arena.discovered = true
assert.equal(
  canParleyWithLieutenant(early),
  false,
  'an origin encounter has no lieutenant deal',
)
console.log(
  'Prom of Doom: 48 lieutenant bargains, AP/evidence gates, battle saves, no-repeat encounters, reports and finale callbacks verified.',
)
