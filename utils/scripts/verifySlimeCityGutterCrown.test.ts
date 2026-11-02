import assert from 'node:assert/strict'
import {
  CARDS,
  TEAMS,
  canBulldozeInto,
  cardById,
  createMatch,
  deckOf,
  deploy,
  loadoutProblems,
  move,
  type Fighter,
} from '../slimeCity/prototypes'
import { GUTTER_CROWN_WAVE_TWO } from '../slimeCity/gutterCrownWaveTwo'
import {
  RARE_COUNT,
  buyPack,
  canBuyPack,
  newProgression,
  rarityOf,
} from '../slimeCity/progression'

assert.equal(GUTTER_CROWN_WAVE_TWO.length, 36)
assert.equal(CARDS.length, 108)
assert.equal(RARE_COUNT, 36)
assert.equal(new Set(CARDS.map((card) => card.id)).size, CARDS.length)
assert.equal(new Set(CARDS.map((card) => card.name)).size, CARDS.length)
assert.equal(
  GUTTER_CROWN_WAVE_TWO.filter((c) => rarityOf(c) === 'rare').length,
  12,
)
for (const crew of TEAMS) {
  const wave = GUTTER_CROWN_WAVE_TWO.filter((card) => card.team === crew.id)
  assert.equal(wave.length, 6, crew.id + ' has six authored specials')
  assert.equal(wave.filter((card) => card.kind === 'creature').length, 2)
  assert.equal(wave.filter((card) => card.kind === 'spell').length, 2)
  assert.equal(wave.filter((card) => card.kind === 'trap').length, 1)
  assert.equal(wave.filter((card) => card.kind === 'equipment').length, 1)
  assert.equal(wave.filter((card) => rarityOf(card) === 'rare').length, 2)

  const starter = deckOf(crew.id).map((card) => card.id)
  for (const card of wave) {
    assert.ok(card.text.length > 45, card.id + ' has authored rules and flavor')
    assert.ok(card.name.length > 5)
    assert.ok(card.cost >= 1 && card.cost <= 4)
    assert.equal(card.signature, undefined, 'Founders keep their signature')
    const deck = [...starter]
    const victim = deck.find((id) => {
      const original = cardById(id)
      return original.kind === card.kind && !original.signature
    })
    assert.ok(victim, card.id + ' has a legal deck slot')
    deck[deck.indexOf(victim!)] = card.id
    assert.deepEqual(
      loadoutProblems(crew.id, deck),
      [],
      card.id + ' legal deck',
    )
    const foe = TEAMS.find((candidate) => candidate.id !== crew.id)!
    const initial = createMatch('blackout', crew.id, foe.id, 7091, {}, deck)
    assert.deepEqual(
      createMatch('blackout', crew.id, foe.id, 7091, {}, deck),
      initial,
      'Constructed deck setup is replayable from its seed',
    )
    initial.round = 3
    initial.mana = 10
    initial.hands.player = [card.id]
    const ours: Fighter = {
      id: 100,
      cardId: crew.creatures[0]!,
      side: 'player',
      x: 1,
      y: 2,
      hp: 1,
      maxHp: 6,
      attack: 2,
      armor: 0,
      ap: 2,
      maxAp: 2,
      hidden: false,
      carryingFlag: false,
      keywords: [],
    }
    const theirs: Fighter = {
      ...ours,
      id: 101,
      cardId: foe.creatures[0]!,
      side: 'enemy',
      x: 7,
      y: 2,
      hp: 6,
      maxHp: 6,
    }
    initial.units = [ours, theirs]
    const target =
      card.kind === 'creature'
        ? { x: 0, y: 0 }
        : card.kind === 'trap'
          ? { x: 3, y: 2 }
          : card.kind === 'equipment' ||
              card.effect === 'heal' ||
              card.effect === 'boost' ||
              card.effect === 'scan'
            ? { x: 1, y: 2 }
            : { x: 7, y: 2 }
    const played = deploy(initial, card.id, target.x, target.y)
    assert.notEqual(played, initial, card.id + ' actually resolves in Blackout')
    assert.equal(played.stats.plays.player[card.kind], 1, card.id)
    assert.equal(played.mana, 10 - card.cost)
    assert.equal(played.hands.player.includes(card.id), false)
    assert.ok(
      played.commands.some((cmd) => cmd.t === 'deploy' && cmd.card === card.id),
    )
  }
}

const ironjaw = (x: number, y: number): Fighter => ({
  id: 100,
  cardId: 's1-walking-foundry',
  side: 'player',
  x,
  y,
  hp: 6,
  maxHp: 6,
  attack: 2,
  armor: 2,
  ap: 2,
  maxAp: 2,
  hidden: false,
  carryingFlag: false,
  keywords: ['bulldoze'],
})
const rival = (x: number, y: number): Fighter => ({
  ...ironjaw(x, y),
  id: 101,
  side: 'enemy',
  cardId: 'spark-diver',
  hp: 3,
  maxHp: 3,
  armor: 0,
  keywords: [],
})
const shove = createMatch('blackout', 'ironjaw', 'riot', 83)
shove.round = 3
shove.units = [ironjaw(3, 2), rival(4, 2)]
assert.equal(canBulldozeInto(shove, shove.units[0]!, 4, 2), true)
const pushed = move(shove, 100, 4, 2)
assert.notEqual(pushed, shove)
assert.equal(pushed.units.find((u) => u.id === 100)?.x, 4)
assert.equal(pushed.units.find((u) => u.id === 101)?.x, 5)
assert.equal(pushed.units.find((u) => u.id === 100)?.ap, 1)
assert.equal(pushed.stats.shoves, 1)
assert.deepEqual(
  move(shove, 100, 4, 2),
  pushed,
  'Same shove replays from same state',
)
assert.deepEqual(shove.units[0], ironjaw(3, 2), 'Pure command processing')

const blocked = createMatch('blackout', 'ironjaw', 'riot', 83)
blocked.round = 3
blocked.units = [ironjaw(3, 2), rival(4, 2), { ...rival(5, 2), id: 102 }]
assert.equal(canBulldozeInto(blocked, blocked.units[0]!, 4, 2), false)
assert.equal(
  move(blocked, 100, 4, 2),
  blocked,
  'No pushes through occupied space',
)
const wall = createMatch('blackout', 'ironjaw', 'riot', 83)
wall.round = 3
wall.units = [ironjaw(8, 2), rival(9, 2)]
assert.equal(move(wall, 100, 9, 2), wall, 'No pushes past the edge')
const ordinary = createMatch('blackout', 'ironjaw', 'riot', 83)
ordinary.round = 3
ordinary.units = [{ ...ironjaw(3, 2), keywords: [] }, rival(4, 2)]
assert.equal(move(ordinary, 100, 4, 2), ordinary, 'BULLDOZE is a real keyword')
const trapped = createMatch('blackout', 'ironjaw', 'riot', 83)
trapped.round = 3
trapped.units = [ironjaw(3, 2), rival(4, 2)]
trapped.traps = [{ x: 5, y: 2, side: 'player', damage: 1, roots: true }]
const sprung = move(trapped, 100, 4, 2)
assert.equal(
  sprung.stats.trapsSprung,
  1,
  'Enemy shoved onto friendly trap triggers it',
)
assert.equal(sprung.units.find((u) => u.id === 101)?.hp, 2)
const enemyTrap = createMatch('blackout', 'ironjaw', 'riot', 83)
enemyTrap.round = 3
enemyTrap.units = [ironjaw(3, 2), rival(4, 2)]
enemyTrap.traps = [{ x: 4, y: 2, side: 'enemy', damage: 1, roots: true }]
const sprungOnMover = move(enemyTrap, 100, 4, 2)
assert.equal(sprungOnMover.stats.trapsSprung, 1)
assert.equal(sprungOnMover.units.find((u) => u.id === 100)?.hp, 5)

let wallet = { ...newProgression(), meat: 3600 }
for (let pack = 0; pack < 36; pack++) {
  assert.equal(canBuyPack(wallet), true)
  wallet = buyPack(wallet, 5700 + pack)
  assert.equal(wallet.lastPack.length, 3)
  assert.equal(
    wallet.lastPack.filter((id) => rarityOf(cardById(id)) === 'rare').length,
    1,
    'Every purchased pack contains one and only one rare',
  )
  assert.equal(new Set(wallet.cards).size, wallet.cards.length)
}
assert.equal(wallet.cards.length, 108)
assert.equal(wallet.meat, 0)
assert.equal(canBuyPack(wallet), false)
console.log(
  'Slime City Gutter Crown wave two: 36 cards, six faction styles, legal decks, casts, shoves and 36 guaranteed-rare packs PASS',
)
