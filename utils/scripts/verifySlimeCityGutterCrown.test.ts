import assert from 'node:assert/strict'
import {
  CARDS,
  advance,
  TEAMS,
  cardById,
  createMatch,
  deckOf,
  deploy,
  loadoutProblems,
  type Fighter,
} from '../slimeCity/prototypes'
import { GUTTER_CROWN_WAVE_TWO } from '../slimeCity/gutterCrownWaveTwo'
import {
  RARE_COUNT,
  buyPack,
  newProgression,
  rarityOf,
} from '../slimeCity/progression'

assert.equal(GUTTER_CROWN_WAVE_TWO.length, 36)
assert.equal(CARDS.length, 300)
assert.equal(RARE_COUNT, 100)
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
// BULLDOZE in the arena (Silas, 2026-11-02): creatures march on their own, so
// a bulldozer meeting an enemy head-on shoves it back during END ROUND.
const arena = (units: Fighter[]) => {
  const state = createMatch('blackout', 'ironjaw', 'riot', 83)
  state.round = 3
  state.units = units
  state.hands = { player: [], enemy: [] }
  state.piles = { player: [], enemy: [] }
  state.discards = { player: [], enemy: [] }
  state.mana = 0
  state.enemyMana = 0
  return state
}
const shove = arena([ironjaw(3, 2), rival(4, 2)])
const pushed = advance(shove)
assert.ok(pushed.stats.shoves >= 1, 'The bulldozer shoves on its own')
assert.ok((pushed.units.find((u) => u.id === 100)?.x ?? 0) >= 4)
assert.deepEqual(advance(shove), pushed, 'Same shove replays from same state')
assert.deepEqual(shove.units[0], ironjaw(3, 2), 'Pure command processing')
assert.equal(
  advance(arena([ironjaw(3, 2), rival(4, 2), { ...rival(5, 2), id: 102 }]))
    .stats.shoves,
  0,
  'No pushes through occupied space',
)
assert.equal(
  advance(arena([ironjaw(8, 2), rival(9, 2)])).stats.shoves,
  0,
  'No pushes past the edge',
)
assert.equal(
  advance(arena([{ ...ironjaw(3, 2), keywords: [] }, rival(4, 2)])).stats
    .shoves,
  0,
  'BULLDOZE is a real keyword',
)
assert.equal(
  advance(arena([{ ...ironjaw(3, 2), stance: 'defend' }, rival(4, 2)])).stats
    .shoves,
  0,
  'Defenders hold instead of bulldozing',
)
const trapped = arena([ironjaw(3, 2), rival(4, 2)])
trapped.traps = [{ x: 5, y: 2, side: 'player', damage: 1, roots: true }]
assert.ok(
  advance(trapped).stats.trapsSprung >= 1,
  'Enemy shoved onto friendly trap triggers it',
)
const enemyTrap = arena([ironjaw(3, 2), rival(4, 2)])
enemyTrap.traps = [{ x: 4, y: 2, side: 'enemy', damage: 1, roots: true }]
assert.ok(advance(enemyTrap).stats.trapsSprung >= 1)

// Every account owns the base collection (Silas, 2026-11-10 PT); packs add
// the rest, a rare leading every pack (2026-11-11: duplicates refund Meat).
let wallet = { ...newProgression(), meat: CARDS.length * 1000 }
for (let i = 0; i < 400 && wallet.cards.length < CARDS.length; i++) {
  wallet = buyPack(wallet, 5700 + wallet.opened)
  assert.equal(
    rarityOf(cardById(wallet.lastPack[0]!)),
    'rare',
    'Every pack leads with a rare',
  )
  assert.equal(new Set(wallet.cards).size, wallet.cards.length)
}
assert.equal(wallet.cards.length, CARDS.length)
console.log(
  'Slime City Gutter Crown wave two: 36 cards, six faction styles, legal decks, casts, shoves and all guaranteed-rare packs PASS',
)
