import assert from 'node:assert/strict'
import { IDENTITY_ARCS, fieldFor } from '../cometAcademy/identityArcs'
import { campaignStagesFor } from '../cometAcademy/identityCampaignStages'
import { newTacticalInterlude } from '../cometAcademy/tacticalInterlude'
import { restoreAcademy, startFullAcademy } from '../cometAcademy/rules'
import {
  signatureCounterPoint,
  signatureThreatCells,
  signatureThreatFor,
} from '../everyVillainTactics/signatureLieutenant'
import {
  counterSignatureLieutenant,
  endTurn,
  trainingState,
} from '../everyVillainTactics/training'
import type { TacticalMap } from '../everyVillainTactics/combat'
import { rivalArenaFor } from '../cometAcademy/rivalArenas'

const cleanMap: TacticalMap = { width: 9, height: 6, tiles: {} }
const center = { x: 4, y: 3 }
const shapes = new Set<string>()
const anchors = new Set<string>()
const affinityShapes = new Map<string, string>()
const originAnchors = new Map<string, string>()

assert.equal(IDENTITY_ARCS.length, 48)
for (const person of IDENTITY_ARCS) {
  const signature = person.signature
  const [origin, affinity] = signature.split('-')
  const threat = signatureThreatFor(signature)
  const authored = campaignStagesFor(signature)
  assert.equal(threat.name, authored.lieutenant.name)
  assert.equal(threat.power, authored.lieutenant.power)
  assert.equal(threat.counter, authored.lieutenant.counter)

  const cells = signatureThreatCells(cleanMap, signature, center)
  const shape = cells.map((c) => c.x + ':' + c.y).join('|')
  assert.ok(cells.some((p) => p.x === center.x && p.y === center.y))
  assert.ok(cells.length > 1 && cells.length < 54)
  shapes.add(shape)
  assert.equal(
    affinityShapes.get(affinity!) ?? shape,
    shape,
    'each affinity controls a consistent physical attack footprint',
  )
  affinityShapes.set(affinity!, shape)

  const anchor = signatureCounterPoint(cleanMap, signature, center)
  assert.ok(anchor.x >= 0 && anchor.x < 9 && anchor.y >= 0 && anchor.y < 6)
  anchors.add(anchor.x + ':' + anchor.y)
  assert.equal(
    originAnchors.get(origin!) ?? anchor.x + ':' + anchor.y,
    anchor.x + ':' + anchor.y,
    'each origin has a consistent interrupt station',
  )
  originAnchors.set(origin!, anchor.x + ':' + anchor.y)

  const stage = rivalArenaFor(signature).stage
  const fight = trainingState(424242, stage)
  const lead = fight.units.find((u) => u.id === 'backdraft')!
  const boss = fight.units.find((u) => u.id === 'vee')!
  boss.lieutenantName = authored.lieutenant.name
  boss.signatureBoss = signature
  boss.signatureTarget = null
  boss.signatureCounter = null
  boss.signatureChargeHp = 4
  boss.signatureCooldown = false
  boss.hp = 4
  boss.maxHp = 4
  fight.units = [lead, boss]
  assert.equal(fight.phase, 'active')
  endTurn(fight)
  assert.ok(boss.signatureTarget, signature + ': boss must announce its target')
  assert.ok(boss.signatureCounter, signature + ': boss must announce its counter')
  assert.match(fight.events[0]!, /Round 2/)
  const announced = { ...boss.signatureTarget! }
  const threatened = signatureThreatCells(fight.map, signature, announced)
  assert.ok(threatened.some((p) => p.x === lead.x && p.y === lead.y))
  const hp = lead.hp
  endTurn(fight)
  assert.equal(lead.hp, hp - 1, signature + ': telegraph and actual attack disagree')
  assert.equal(boss.signatureTarget, null)
  assert.equal(boss.signatureCounter, null)

  const disrupted = trainingState(424242, stage)
  const ally = disrupted.units.find((u) => u.id === 'backdraft')!
  const adversary = disrupted.units.find((u) => u.id === 'vee')!
  Object.assign(adversary, {
    lieutenantName: authored.lieutenant.name,
    signatureBoss: signature,
    signatureTarget: null,
    signatureCounter: null,
    signatureChargeHp: 4,
    signatureCooldown: false,
    hp: 4,
    maxHp: 4,
  })
  disrupted.units = [ally, adversary]
  assert.equal(counterSignatureLieutenant(disrupted), false, 'counter needs a warning')
  endTurn(disrupted)
  ally.x = adversary.signatureCounter!.x
  ally.y = adversary.signatureCounter!.y
  ally.ap = 2
  assert.equal(counterSignatureLieutenant(disrupted), true, signature + ': interrupt unreachable')
  assert.equal(ally.ap, 1, 'counter spends exactly one AP')
  assert.equal(adversary.signatureTarget, null)
  assert.equal(adversary.signatureCooldown, true)
  assert.equal(counterSignatureLieutenant(disrupted), false, 'no repeated free interruption')
  const safeHp = ally.hp
  endTurn(disrupted)
  assert.equal(ally.hp, safeHp, 'disrupted boss must skip its attack')
  assert.equal(adversary.signatureCooldown, false)
}
assert.equal(shapes.size, 8, 'all eight signature attack shapes must be mechanically distinct')
assert.equal(anchors.size, 6, 'all six origin counters must have different physical stations')

const base = startFullAcademy(fieldFor('accident-fire'), 4321, 'accident-fire')
const late = {
  ...base,
  phase: 'dispatch' as const,
  day: 23,
  playerCaseId: 'city-finale-night',
  opponentSignature: 'tech-air' as const,
}
const battle = newTacticalInterlude(late)!
const boss = battle.state.units.find((unit) => unit.signatureBoss)!
assert.equal(boss.signatureBoss, late.opponentSignature)
assert.equal(boss.lieutenantName, campaignStagesFor(late.opponentSignature).lieutenant.name)
assert.equal(boss.seismicTarget, undefined, 'signature boss must not reuse quarry seismic AI')
assert.equal(boss.maxHp, 4)
assert.ok(battle.arena?.kind === 'lair')
const suspicious = JSON.parse(JSON.stringify({ ...late, tacticalBattle: battle }))
suspicious.tacticalBattle.state.units.find((u: { id: string }) => u.id === boss.id).signatureTarget = { x: -8, y: 99 }
assert.equal(restoreAcademy(suspicious), null, 'cannot restore an out-of-board boss warning')

console.log(
  'Prom lieutenant tactics: 48 canonical profiles, 8 real footprints, 6 counter stations, telegraph/attack parity, interruption AP, late story boss and save protection.',
)
