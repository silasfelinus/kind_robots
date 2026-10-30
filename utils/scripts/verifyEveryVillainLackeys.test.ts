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

const page = readFileSync(
  new URL('../../pages/admin/every-villain-tactics.vue', import.meta.url),
  'utf8',
)
assert.match(page, /data-testid="tactics-phase-warning"/)
assert.match(page, /data-testid="studio-encounter-select"/)
console.log(
  'Every Villain lackeys: teleporting Wombat Ronin exits and jams, wind-up Licensed Legends swarm and seals, one-hit SPECIES crews, saves and studio line-ups verified.',
)
