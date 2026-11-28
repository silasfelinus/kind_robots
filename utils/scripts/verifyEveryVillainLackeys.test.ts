import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { chanceFrom, gridDistance, tileAt } from '../everyVillainTactics/combat'
import { createStory } from '../everyVillainTactics/firstBellStory'
import { powerBlocker } from '../everyVillainTactics/powers'
import {
  createSave,
  loadSave,
  saveChecksum,
  serializeSave,
} from '../everyVillainTactics/saves'
import {
  STAGE_ENCOUNTERS,
  clonePreset,
  stageProblems,
} from '../everyVillainTactics/studio'
import {
  cinderPlan,
  hushLaneContains,
  hushPlan,
  endTurn,
  fireSelected,
  selectedPowerTargets,
  trainingState,
  type TrainingState,
} from '../everyVillainTactics/training'

assert.deepEqual(
  STAGE_ENCOUNTERS.map((entry) => entry.id),
  [
    null,
    'warren-wreckers',
    'wombat-ronin',
    'licensed-legends',
    'claim-cinders',
    'hushwings',
    'quarry-lieutenant',
  ],
)
const unknown = clonePreset('college-quad')
;(unknown as { encounter?: string }).encounter = 'dragons'
assert.ok(stageProblems(unknown).includes('Unknown rival encounter.'))

// Teleporting Clockwork Wombat Ronin: canonical one-hit SPECIES crew.
const quad = clonePreset('quad-portal-watch')
assert.deepEqual(stageProblems(quad), [])
const portal = trainingState(31, quad)
const ronin = portal.units.filter((u) => u.team === 'rival')
assert.equal(ronin.length, 3)
assert.ok(
  ronin.every(
    (u) =>
      u.identity === 'alien-discipline' &&
      u.henchmanType === 'phase' &&
      u.hp === 1 &&
      u.maxHp === 1 &&
      !u.power &&
      !u.role,
  ),
)
assert.equal(ronin[0]!.henchmanName, 'Lieutenant Teakettle')
endTurn(portal)
const exits = ronin.filter((u) => u.phaseTarget)
assert.equal(exits.length, 3, 'every ronin telegraphs an exit')
assert.equal(
  new Set(exits.map((u) => u.phaseTarget!.x + ',' + u.phaseTarget!.y)).size,
  3,
  'exits never overlap',
)
for (const unit of exits) {
  const victim = portal.units.find((u) => u.id === unit.phaseVictim)!
  assert.equal(victim.team, 'squad')
  assert.equal(gridDistance(unit.phaseTarget!, victim), 1)
  assert.ok(!tileAt(portal.map, unit.phaseTarget!).wall)
  assert.equal(
    chanceFrom(portal.map, unit.phaseTarget!, victim).cover,
    0,
    'exit is on the side the victim’s cover does not protect',
  )
}
// Save/load mid-telegraph keeps the exact exits; forging a victim fails.
const portalSave = createSave({
  slot: 'slot-1',
  perspective: 'hero',
  leadSignature: 'accident-fire',
  stage: quad,
  state: portal,
  story: { ...createStory(), current: null },
})
const reload = loadSave(serializeSave(portalSave))
assert.ok(reload.ok, reload.ok ? '' : reload.reason)
assert.deepEqual(reload.save.state.units, portal.units)
const forged = structuredClone(portalSave)
forged.state.units.find((u) => u.phaseVictim)!.phaseVictim = 'remy'
const { checksum: _c, ...forgedPayload } = forged
forged.checksum = saveChecksum(forgedPayload)
assert.equal(loadSave(serializeSave(forged)).ok, false)

// Next turn: unjammed ronin phase onto their exits; a jammed one fizzles.
const jammed = structuredClone(portal) as TrainingState
const plan = jammed.units.filter((u) => u.phaseTarget)
const blocker = jammed.units.find(
  (u) => u.team === 'squad' && u.hp > 0 && u.id !== plan[0]!.phaseVictim,
)!
blocker.x = plan[0]!.phaseTarget!.x
blocker.y = plan[0]!.phaseTarget!.y
const blockedRonin = plan[0]!
const homeBefore = { x: blockedRonin.x, y: blockedRonin.y }
const targets = new Map(plan.slice(1).map((u) => [u.id, { ...u.phaseTarget! }]))
endTurn(jammed)
assert.deepEqual(
  { x: blockedRonin.x, y: blockedRonin.y },
  homeBefore,
  'a jammed portal leaves the ronin in place',
)
for (const [id, exit] of targets) {
  const unit = jammed.units.find((u) => u.id === id)!
  if (unit.hp > 0 && !unit.phaseTarget)
    assert.ok(
      (unit.x === exit.x && unit.y === exit.y) || unit.phaseTarget === null,
    )
}
assert.ok(
  [...targets].some(([id, exit]) => {
    const unit = jammed.units.find((u) => u.id === id)!
    return unit.x === exit.x && unit.y === exit.y
  }),
  'an open exit is used exactly as shown',
)
const again = structuredClone(portal) as TrainingState
const again2 = structuredClone(portal) as TrainingState
endTurn(again)
endTurn(again2)
assert.deepEqual(again.units, again2.units, 'phase AI is seed-stable')
// One hit removes a ronin.
const duel = trainingState(31, quad)
duel.units[3]!.x = 2
duel.units[3]!.y = 4
duel.selected = 'backdraft'
let downed = false
for (let seed = 1; seed < 60 && !downed; seed++) {
  const trial = structuredClone(duel) as TrainingState
  trial.seed = seed
  fireSelected(trial, trial.units[3]!)
  downed = trial.units[3]!.hp === 0
}
assert.ok(downed, 'a single hit knocks out a one-hit ronin')

// Licensed Legends: wind-up toys swarm, never shoot, and seal powers.
const lab = clonePreset('lab-mascot-recall')
assert.deepEqual(stageProblems(lab), [])
const toys = trainingState(12, lab)
const mascots = toys.units.filter((u) => u.team === 'rival')
assert.ok(
  mascots.every(
    (u) =>
      u.identity === 'accident-birthright' &&
      u.henchmanType === 'windup' &&
      u.maxHp === 1,
  ),
)
assert.equal(mascots[0]!.henchmanName, 'Sir Cap-Permission')
const squadHp = () =>
  toys.units.filter((u) => u.team === 'squad').reduce((n, u) => n + u.hp, 0)
const startHp = squadHp()
const distance = () =>
  Math.min(
    ...mascots.map((m) =>
      Math.min(
        ...toys.units
          .filter((u) => u.team === 'squad')
          .map((h) => gridDistance(m, h)),
      ),
    ),
  )
const before = distance()
endTurn(toys)
assert.ok(distance() < before, 'mascots swarm toward the squad')
// Put a hero right beside a mascot that is ready to stamp.
const stamper = mascots.find((m) => !m.windupRewinding)!
const hattie = toys.units.find((u) => u.id === 'hattie')!
const spot = [
  { x: stamper.x - 1, y: stamper.y },
  { x: stamper.x + 1, y: stamper.y },
  { x: stamper.x, y: stamper.y - 1 },
  { x: stamper.x, y: stamper.y + 1 },
].find(
  (p) =>
    p.x >= 0 &&
    p.y >= 0 &&
    p.x < toys.map.width &&
    p.y < toys.map.height &&
    !tileAt(toys.map, p).wall &&
    !toys.units.some((u) => u.hp > 0 && u.x === p.x && u.y === p.y),
)!
hattie.x = spot.x
hattie.y = spot.y
for (const other of mascots) other.windupRewinding = other !== stamper
endTurn(toys)
assert.ok(hattie.statuses.includes('sealed'), 'adjacent mascot stamps a seal')
assert.equal(stamper.windupRewinding, true)
toys.selected = 'hattie'
assert.match(powerBlocker(hattie)!, /Sealed/)
assert.deepEqual(selectedPowerTargets(toys), [])
endTurn(toys)
assert.ok(!hattie.statuses.includes('sealed'), 'a seal lasts one turn')
assert.equal(
  stamper.windupRewinding,
  false,
  'the stamper spent a turn rewinding',
)
assert.equal(squadHp(), startHp, 'wind-up toys never deal damage')

// Claim Cinders field their canonical one-hit captain and a fixed warning.
// The same saved tile is resolved after the intervening player phase.
const claims = clonePreset('college-quad')
claims.encounter = 'claim-cinders'
assert.deepEqual(stageProblems(claims), [])
function claimBattle() {
  const state = trainingState(31, claims, { lead: 'magic-fire' })
  const clerk = state.units.find((u) => u.team === 'rival')!
  const hero = state.units.find((u) => u.id === 'backdraft')!
  clerk.x = 3
  clerk.y = 1
  hero.x = 2
  hero.y = 1
  for (const u of state.units)
    if (u.team === 'rival' && u.id !== clerk.id) u.hp = 0
  return { state, clerk, hero }
}
const insured = claimBattle()
assert.equal(insured.clerk.henchmanName, 'Ash Invoice')
assert.equal(insured.clerk.identity, 'accident-fire')
assert.equal(insured.clerk.hp, 1)
assert.equal(insured.clerk.power, undefined)
assert.ok(insured.state.events.some((line) => line.includes('receipts')))
assert.match(insured.state.log, /receipts/)
const hpBefore = insured.hero.hp
endTurn(insured.state)
assert.deepEqual(insured.clerk.cinderTarget, { x: 2, y: 1 })
assert.equal(insured.hero.hp, hpBefore, 'warning does not deal damage')
const stampSave = createSave({
  slot: 'slot-1',
  perspective: 'hero',
  leadSignature: 'magic-fire',
  stage: claims,
  state: insured.state,
  story: { ...createStory(), current: null },
})
const stampLoad = loadSave(serializeSave(stampSave))
assert.ok(stampLoad.ok, stampLoad.ok ? '' : stampLoad.reason)
assert.deepEqual(
  stampLoad.save.state.units.find((u) => u.id === insured.clerk.id)
    ?.cinderTarget,
  { x: 2, y: 1 },
)
endTurn(insured.state)
assert.equal(insured.hero.hp, hpBefore - 1)
assert.equal(insured.clerk.cinderTarget, null)
const dodge = claimBattle()
endTurn(dodge.state)
dodge.hero.y = 0
const dodgeHp = dodge.hero.hp
endTurn(dodge.state)
assert.equal(dodge.hero.hp, dodgeHp, 'the warning does not follow its victim')
const wet = claimBattle()
wet.clerk.cinderTarget = { x: 2, y: 1 }
wet.state.rules = {
  props: [],
  hazards: [{ id: 'wet', kind: 'water', x: 2, y: 1 }],
  waves: [],
  victory: { kind: 'defeat-all' },
}
const wetHp = wet.hero.hp
assert.equal(cinderPlan(wet.state, wet.clerk), true)
assert.equal(wet.hero.hp, wetHp, 'water douses a stamped tile')
const disarmed = claimBattle()
endTurn(disarmed.state)
disarmed.clerk.hp = 0
const safeHp = disarmed.hero.hp
assert.equal(cinderPlan(disarmed.state, disarmed.clerk), true)
assert.equal(disarmed.hero.hp, safeHp)
const falseStamp = structuredClone(stampSave)
falseStamp.state.units.find((u) => u.id === 'backdraft')!.cinderTarget = {
  x: 2,
  y: 1,
}
const { checksum: _stamp, ...falseStampPayload } = falseStamp
falseStamp.checksum = saveChecksum(falseStampPayload)
assert.equal(loadSave(serializeSave(falseStamp)).ok, false)

const hushStage = clonePreset('college-quad')
hushStage.encounter = 'hushwings'
assert.deepEqual(stageProblems(hushStage), [])
function hushBattle() {
  const state = trainingState(31, hushStage, { lead: 'magic-fire' })
  const moth = state.units.find((u) => u.team === 'rival')!
  const hero = state.units.find((u) => u.id === 'backdraft')!
  moth.x = 3
  moth.y = 1
  hero.x = 2
  hero.y = 1
  for (const unit of state.units)
    if (unit.team === 'rival' && unit.id !== moth.id) unit.hp = 0
  return { state, moth, hero }
}
const vacuum = hushBattle()
assert.equal(vacuum.moth.henchmanName, 'Nell No-Air')
assert.equal(vacuum.moth.identity, 'accident-air')
assert.equal(vacuum.moth.hp, 1)
assert.equal(vacuum.moth.power, undefined)
assert.match(vacuum.state.log, /Vacuum/)
const beforeVacuum = vacuum.hero.hp
endTurn(vacuum.state)
assert.deepEqual(vacuum.moth.hushTarget, { x: 2, y: 1 })
assert.ok(!vacuum.hero.statuses.includes('suppressed'))
assert.ok(hushLaneContains(vacuum.state, vacuum.moth.hushTarget!, vacuum.hero))
assert.ok(!hushLaneContains(vacuum.state, vacuum.moth.hushTarget!, { x: 2, y: 0 }))
const vacuumSave = createSave({
  slot: 'slot-1',
  perspective: 'hero',
  leadSignature: 'magic-fire',
  stage: hushStage,
  state: vacuum.state,
  story: { ...createStory(), current: null },
})
const vacuumLoad = loadSave(serializeSave(vacuumSave))
assert.ok(vacuumLoad.ok, vacuumLoad.ok ? '' : vacuumLoad.reason)
assert.deepEqual(
  vacuumLoad.save.state.units.find((u) => u.id === vacuum.moth.id)
    ?.hushTarget,
  { x: 2, y: 1 },
)
endTurn(vacuum.state)
assert.ok(vacuum.hero.statuses.includes('suppressed'))
assert.equal(vacuum.hero.hp, beforeVacuum)
assert.equal(vacuum.moth.hushTarget, null)
const changedLane = hushBattle()
endTurn(changedLane.state)
changedLane.hero.y = 0
endTurn(changedLane.state)
assert.ok(!changedLane.hero.statuses.includes('suppressed'))
const hushedDisarm = hushBattle()
endTurn(hushedDisarm.state)
hushedDisarm.moth.hp = 0
assert.equal(hushPlan(hushedDisarm.state, hushedDisarm.moth), true)
assert.ok(!hushedDisarm.hero.statuses.includes('suppressed'))
const forgedVacuum = structuredClone(vacuumSave)
forgedVacuum.state.units.find((u) => u.id === 'backdraft')!.hushTarget = {
  x: 2,
  y: 1,
}
const { checksum: _vacuum, ...forgedVacuumPayload } = forgedVacuum
forgedVacuum.checksum = saveChecksum(forgedVacuumPayload)
assert.equal(loadSave(serializeSave(forgedVacuum)).ok, false)

const page = readFileSync(
  new URL('../../pages/admin/every-villain-tactics.vue', import.meta.url),
  'utf8',
)
assert.match(page, /data-testid="tactics-phase-warning"/)
assert.match(page, /data-testid="tactics-cinder-warning"/)
assert.match(page, /data-testid="tactics-hush-warning"/)
assert.match(page, /data-testid="studio-encounter-select"/)
console.log(
  'Every Villain lackeys: teleporting Wombat Ronin exits and jams, wind-up Licensed Legends swarm and seals, one-hit SPECIES crews, saves and studio line-ups verified.',
)
