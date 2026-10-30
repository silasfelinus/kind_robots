import assert from 'node:assert/strict'
import { IDENTITY_ARCS, fieldFor } from '../cometAcademy/identityArcs'
import {
  newTacticalInterlude,
  parleyWithLieutenant,
  reconcileTacticalVictory,
  tacticalResultFor,
} from '../cometAcademy/tacticalInterlude'
import {
  incidentsFor,
  restoreAcademy,
  startFullAcademy,
} from '../cometAcademy/rules'
import {
  aliasFor,
  previewAlliedSignature,
  selectedUnit,
  useAlliedSignature,
} from '../everyVillainTactics/training'
import { lineOfSight, tileAt } from '../everyVillainTactics/combat'
import { campaignStagesFor } from '../cometAcademy/identityCampaignStages'

assert.equal(IDENTITY_ARCS.length, 48)
for (const person of IDENTITY_ARCS) {
  const signature = person.signature
  const protagonist =
    signature === 'accident-fire' ? 'magic-water' : 'accident-fire'
  const base = startFullAcademy(fieldFor(protagonist), 55421, protagonist)
  const mission23 = {
    ...base,
    day: 23,
    phase: 'dispatch' as const,
    opponentSignature: signature,
    playerCaseId: incidentsFor({ ...base, day: 23 })[0]!.id,
  }
  const original = newTacticalInterlude(mission23)!
  const lead = original.state.units.find((unit) => unit.id === 'backdraft')!
  const boss = original.state.units.find((unit) => unit.signatureBoss)!
  lead.x = 7
  lead.y = 3
  lead.ap = 2
  boss.hp = 2
  original.arena!.discovered = true
  assert.ok(parleyWithLieutenant(original, 'ally'))
  original.state.units.forEach((unit) => {
    if (unit.team === 'rival') unit.hp = 0
  })
  original.arena!.secured = true
  reconcileTacticalVictory(original)
  const earned = tacticalResultFor({ ...mission23, tacticalBattle: original })!
  assert.equal(earned.lieutenantParley, 'ally')
  const night24 = {
    ...mission23,
    day: 24,
    playerCaseId: incidentsFor({ ...base, day: 24 })[0]!.id,
    tacticalHistory: [earned],
  }
  const alliedBattle = newTacticalInterlude(night24)!
  const units = alliedBattle.state.units
  const ally = units.find((unit) => unit.id === 'allied-lieutenant')!
  assert.ok(ally, signature + ': defection must summon an actual unit')
  assert.equal(ally.team, 'squad')
  assert.equal(ally.hp, 4)
  assert.equal(ally.maxHp, 4)
  assert.equal(ally.identity, signature)
  assert.equal(
    ally.lieutenantName,
    campaignStagesFor(signature).lieutenant.name,
  )
  assert.equal(aliasFor(ally), ally.lieutenantName)
  assert.equal(ally.signatureSupportUsed, false)
  assert.equal(
    units.some((unit) => unit.signatureBoss),
    false,
  )
  assert.ok(units.length >= 5 && units.length <= 8)
  assert.equal(
    new Set(
      units.filter((unit) => unit.hp > 0).map((unit) => unit.x + ',' + unit.y),
    ).size,
    units.filter((unit) => unit.hp > 0).length,
    signature + ': the returned lieutenant cannot overlap a spawn',
  )
  assert.ok(!tileAt(alliedBattle.state.map, ally).wall)
  assert.ok(
    restoreAcademy(
      JSON.parse(JSON.stringify({ ...night24, tacticalBattle: alliedBattle })),
    ),
    signature + ': must restore allied arrival before any action',
  )
  alliedBattle.state.selected = ally.id
  assert.equal(selectedUnit(alliedBattle.state)?.id, ally.id)
  const primary = units.find((unit) => unit.team === 'rival')!
  const occupied = new Set(
    units.filter((u) => u !== ally && u.hp > 0).map((u) => u.x + ',' + u.y),
  )
  const landing = Array.from(
    { length: alliedBattle.state.map.width * alliedBattle.state.map.height },
    (_, i) => ({
      x: i % alliedBattle.state.map.width,
      y: Math.floor(i / alliedBattle.state.map.width),
    }),
  ).find(
    (point) =>
      !occupied.has(point.x + ',' + point.y) &&
      !tileAt(alliedBattle.state.map, point).wall &&
      lineOfSight(alliedBattle.state.map, point, primary),
  )
  assert.ok(landing, signature + ': must have a position with line of sight')
  ally.x = landing.x
  ally.y = landing.y
  ally.ap = 2
  const preview = previewAlliedSignature(alliedBattle.state)!
  assert.ok(preview)
  assert.equal(preview.ally.id, 'allied-lieutenant')
  assert.ok(
    preview.cells.some(
      (p) => p.x === preview.target.x && p.y === preview.target.y,
    ),
  )
  const beforeEnemies = units
    .filter((unit) => unit.team === 'rival')
    .map((unit) => ({ id: unit.id, hp: unit.hp, x: unit.x, y: unit.y }))
  const beforeFriends = units
    .filter((unit) => unit.team === 'squad')
    .map((unit) => ({ id: unit.id, hp: unit.hp }))
  assert.equal(useAlliedSignature(alliedBattle.state), true)
  assert.equal(ally.ap, 0)
  assert.equal(ally.signatureSupportUsed, true)
  assert.equal(
    useAlliedSignature(alliedBattle.state),
    false,
    'once per battle, no second strike',
  )
  const strikeSquares = new Set(preview.cells.map((p) => p.x + ',' + p.y))
  for (const enemy of beforeEnemies) {
    const after = units.find((unit) => unit.id === enemy.id)!
    assert.equal(
      after.hp,
      Math.max(
        0,
        enemy.hp - Number(strikeSquares.has(enemy.x + ',' + enemy.y)),
      ),
      signature + ': ally preview and exact enemy damage differ',
    )
  }
  for (const friend of beforeFriends)
    assert.equal(
      units.find((unit) => unit.id === friend.id)!.hp,
      friend.hp,
      signature + ': friendly fire is forbidden',
    )
  ally.ap = 2
  assert.equal(
    previewAlliedSignature(alliedBattle.state),
    null,
    'no second charge after AP refresh',
  )
  assert.ok(
    restoreAcademy(
      JSON.parse(JSON.stringify({ ...night24, tacticalBattle: alliedBattle })),
    ),
    signature + ': used charge must persist',
  )
  const tampered = JSON.parse(
    JSON.stringify({ ...night24, tacticalBattle: alliedBattle }),
  )
  tampered.tacticalHistory = []
  assert.equal(
    restoreAcademy(tampered),
    null,
    'cannot forge a defector without prior alliance',
  )
  const forged = JSON.parse(
    JSON.stringify({ ...night24, tacticalBattle: alliedBattle }),
  )
  forged.tacticalBattle.state.units.find(
    (u: { id: string }) => u.id === 'allied-lieutenant',
  ).lieutenantName = 'Fake Ally'
  assert.equal(
    restoreAcademy(forged),
    null,
    'cannot rename an earned lieutenant',
  )

  const truceRecord = { ...earned, lieutenantParley: 'truce' as const }
  const truceBattle = newTacticalInterlude({
    ...night24,
    tacticalHistory: [truceRecord],
  })!
  assert.ok(truceBattle)
  assert.equal(
    truceBattle.state.units.some((unit) => unit.id === 'allied-lieutenant'),
    false,
    'a ceasefire is not recruitment',
  )
  assert.equal(
    truceBattle.state.units.some((unit) => unit.id === 'vee'),
    false,
  )
  assert.equal(
    truceBattle.state.units.filter((unit) => unit.team === 'rival').length,
    2,
  )
  assert.equal(
    truceBattle.state.units.some((unit) => unit.signatureBoss),
    false,
  )
  assert.match(truceBattle.state.log, /command squad stands down/)
  assert.ok(
    restoreAcademy(
      JSON.parse(
        JSON.stringify({
          ...night24,
          tacticalHistory: [truceRecord],
          tacticalBattle: truceBattle,
        }),
      ),
    ),
    signature + ': ceasefire saves and returns',
  )
}
console.log(
  'Comet City loyalty: 48 real controllable allies, one-charge 8-shape signature strikes, no friendly fire, 48 commander stand-downs, saved provenance and tamper guards.',
)
