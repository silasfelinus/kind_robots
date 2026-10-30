import assert from 'node:assert/strict'
import {
  advance, CARDS, createMatch, deploy, DISTRICTS, legalNeighbor, MODES, move, reveal,
  TEAMS, type MatchState,
} from '../slimeCity/prototypes'

assert.equal(TEAMS.length, 6)
assert.equal(new Set(TEAMS.map((team) => team.id)).size, 6)
assert.equal(new Set(TEAMS.map((team) => team.color)).size, 5)
assert.ok(TEAMS.some((team) => team.id === 'catgirls' && team.hook.includes('genetic')))
assert.ok(TEAMS.some((team) => team.id === 'bloodfairies' && team.name.includes('BLOODFAIRIES')))
assert.ok(TEAMS.some((team) => team.id === 'ironjaw' && team.name.includes('OGRES')))
assert.equal(DISTRICTS.length, 7)
assert.equal(MODES.length, 3)
assert.deepEqual(MODES.map((mode) => mode.size), ['8 × 8', '12 × 6', '14 × 6'])
for (const team of TEAMS) {
  assert.equal(team.creatures.length, 3)
  assert.equal(team.special.length, 3)
  for (const id of [...team.creatures, ...team.special]) {
    const card = CARDS.find((item) => item.id === id)
    assert.ok(card, team.id + ' missing ' + id)
    assert.equal(card.team, team.id)
  }
  assert.ok(team.special.some((id) => CARDS.find((card) => card.id === id)?.kind === 'trap'))
  assert.ok(team.special.some((id) => CARDS.find((card) => card.id === id)?.kind !== 'trap'))
}
assert.equal(legalNeighbor({ x: 1, y: 1 }, { x: 2, y: 1 }), true)
assert.equal(legalNeighbor({ x: 1, y: 1 }, { x: 2, y: 2 }), false)

const fog = createMatch('blackout', 'catgirls', 'bloodfairies')
assert.equal(fog.width, 8)
assert.equal(fog.height, 8)
assert.equal(fog.units.length, 8)
assert.equal(fog.units.filter((unit) => unit.hidden).length, 8)
assert.equal(fog.mana, 1)
const selected = fog.units.find((unit) => unit.side === 'player')!
assert.equal(move(fog, selected.id, selected.x + 2, selected.y), fog, 'No double-square teleports')
const moved = move(fog, selected.id, selected.x + 1, selected.y)
assert.notEqual(moved, fog)
assert.equal(moved.units.find((unit) => unit.id === selected.id)!.hidden, false)
assert.equal(fog.units.find((unit) => unit.id === selected.id)!.hidden, true, 'Pure rules do not mutate prior state')
assert.equal(reveal(fog, selected.id).units.find((unit) => unit.id === selected.id)!.hidden, false)
assert.equal(deploy(fog, 'sprite', 0, 0), fog, 'Cannot deploy enemy faction')
assert.equal(deploy(fog, 'mau', 0, 0), fog, 'Cannot overspend mana')
assert.equal(deploy(fog, 'lynx', 5, 2), fog, 'Cannot deploy in enemy zone')
const recruited = deploy(fog, 'lynx', 0, 0)
assert.equal(recruited.units.length, 9)
assert.equal(recruited.mana, 0)
assert.equal(advance(fog).mana, 2)

const gr = createMatch('gridiron', 'catgirls', 'ironjaw')
const rr = createMatch('bloodrush', 'catgirls', 'ironjaw')
assert.deepEqual([gr.width, gr.height, rr.width, rr.height], [12, 6, 14, 6])
assert.equal(deploy(gr, 'lynx', 2, 2), gr, 'Only home edge can deploy')
assert.equal(deploy(gr, 'lynx', 0, 2), gr, 'Occupied home tile cannot deploy')
const placed = deploy(gr, 'lynx', 0, 1)
assert.equal(placed.mana, 0)
assert.equal(placed.units.filter((unit) => unit.side === 'player').length, 2)
assert.equal(move(gr, gr.units[0]!.id, 1, 2), gr, 'Lane mode is auto-run, not manual move')
assert.equal(advance(gr).round, 2)
assert.equal(advance(gr).mana, 2)
assert.deepEqual(advance(advance(gr)), advance(advance(gr)), 'Seed-stable opposing moves')

const spellState = createMatch('gridiron', 'catgirls', 'bloodfairies')
spellState.mana = 2
const enemyUnit = spellState.units.find((unit) => unit.side === 'enemy')!
enemyUnit.hp = 5
const damaged = deploy(spellState, 'pounce', enemyUnit.x, enemyUnit.y)
assert.equal(damaged, spellState, 'Friendly boost cannot target opponents')
const healed = deploy(spellState, 'reknit', 0, 2)
assert.equal(healed.units[0]!.hp, spellState.units[0]!.hp + 2)

const trapState = createMatch('blackout', 'catgirls', 'bloodfairies')
trapState.mana = 2
const trap = deploy(trapState, 'scentmine', 3, 2)
assert.equal(trap.traps.length, 1)
assert.equal(trap.mana, 1)
assert.equal(deploy(trap, 'scentmine', 3, 2), trap, 'Cannot stack traps')

const duel = createMatch('blackout', 'riot', 'bloodfairies')
duel.round = 5
duel.units = [
  { id: 90, cardId: 'rat', side: 'player', x: 3, y: 2, hp: 1, attack: 2, armor: 0, ap: 1, maxAp: 1, hidden: false, carryingFlag: false },
  { id: 91, cardId: 'sprite', side: 'enemy', x: 4, y: 2, hp: 1, attack: 2, armor: 0, ap: 1, maxAp: 1, hidden: false, carryingFlag: false },
]
const resolved = advance(duel)
assert.equal(resolved.units.length, 0, 'Simultaneous exchange preserves mutual knockout')
assert.equal(resolved.victor, 'draw')

const score: MatchState = createMatch('gridiron', 'catgirls', 'bloodfairies')
score.score = [2, 0]
score.units = [{ id: 50, cardId: 'lynx', side: 'player', x: score.width - 2, y: 0, hp: 3, attack: 1, armor: 0, ap: 2, maxAp: 2, hidden: false, carryingFlag: false }]
assert.equal(advance(score).score[0], 3)
assert.equal(advance(score).victor, 'player')

for (const mode of MODES) {
  for (const faction of TEAMS) {
    const first = createMatch(mode.id, faction.id, 'exchange')
    const second = createMatch(mode.id, faction.id, 'exchange')
    for (let i = 0; i < 8; i++) {
      if (first.victor || second.victor) break
      Object.assign(first, advance(first))
      Object.assign(second, advance(second))
    }
    assert.deepEqual(first, second, mode.id + '/' + faction.id + ' replay drift')
    assert.ok(first.units.every((unit) => unit.x >= 0 && unit.x < first.width && unit.y >= 0 && unit.y < first.height))
    assert.equal(new Set(first.units.map((unit) => unit.x + ':' + unit.y)).size, first.units.length)
  }
}
console.log('Slime City: 3 square-grid formats, 6 teams, specials, seeded rules and replay fixtures PASS')
