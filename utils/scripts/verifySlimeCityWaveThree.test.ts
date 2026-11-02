import assert from 'node:assert/strict'
import {
  CARDS,
  TEAMS,
  cardById,
  createMatch,
  deckOf,
  deploy,
  loadoutProblems,
  type Fighter,
} from '../slimeCity/prototypes'
import {
  GUTTER_CROWN_WAVE_THREE,
  GUTTER_CROWN_WAVE_THREE_RARE_IDS,
} from '../slimeCity/gutterCrownWaveThree'
import {
  RARE_COUNT,
  rarityOf,
} from '../slimeCity/progression'

assert.equal(GUTTER_CROWN_WAVE_THREE.length, 36)
assert.equal(CARDS.length, 204)
assert.equal(RARE_COUNT, 68)
assert.equal(GUTTER_CROWN_WAVE_THREE_RARE_IDS.size, 12)
assert.equal(new Set(CARDS.map((card) => card.id)).size, CARDS.length)
assert.equal(new Set(CARDS.map((card) => card.name)).size, CARDS.length)
assert.equal(CARDS.filter((card) => rarityOf(card) === 'rare').length, 68)
assert.equal(CARDS.filter((card) => rarityOf(card) !== 'rare').length, 136)
assert.equal(
  GUTTER_CROWN_WAVE_THREE.filter((card) => rarityOf(card) === 'rare').length,
  12,
)

const unit = (
  side: 'player' | 'enemy',
  id: number,
  x: number,
  y: number,
  cardId: string,
): Fighter => ({
  id,
  cardId,
  side,
  x,
  y,
  hp: 3,
  maxHp: 6,
  attack: 2,
  armor: 0,
  ap: 2,
  maxAp: 2,
  keywords: [],
  hidden: false,
  carryingFlag: false,
})

for (const crew of TEAMS) {
  const wave = GUTTER_CROWN_WAVE_THREE.filter(
    (card) => card.team === crew.id,
  )
  assert.equal(wave.length, 6, crew.id + ' has six distinct new cards')
  assert.equal(wave.filter((card) => card.kind === 'creature').length, 2)
  assert.equal(wave.filter((card) => card.kind === 'spell').length, 2)
  assert.equal(wave.filter((card) => card.kind === 'trap').length, 1)
  assert.equal(wave.filter((card) => card.kind === 'equipment').length, 1)
  assert.equal(wave.filter((card) => rarityOf(card) === 'rare').length, 2)
  assert.equal(
    CARDS.filter((card) => card.team === crew.id).length,
    24,
    'Each crew now has exactly 24 of its target 40 cards',
  )
  const founder = deckOf(crew.id).map((card) => card.id)
  assert.equal(founder.length, 10)
  const foe = TEAMS.find((candidate) => candidate.id !== crew.id)!
  for (const card of wave) {
    assert.ok(card.text.length >= 65, card.id + ' has flavorful exact rules')
    assert.ok(card.name.length >= 8 && card.symbol)
    assert.ok(card.cost >= 1 && card.cost <= 6)
    assert.equal(card.signature, undefined, 'Original signature remains required')
    const deck = [...founder]
    const substitute = deck.find((id) => {
      const original = cardById(id)
      return original.kind === card.kind && !original.signature
    })
    assert.ok(substitute, card.id + ' has a legal replacement slot')
    deck[deck.indexOf(substitute!)] = card.id
    assert.deepEqual(loadoutProblems(crew.id, deck), [])
    const game = createMatch('blackout', crew.id, foe.id, 931, {}, deck)
    assert.deepEqual(
      game,
      createMatch('blackout', crew.id, foe.id, 931, {}, deck),
      'The edited deck shuffles reproducibly',
    )
    game.mana = 10
    game.hands.player = [card.id]
    game.units = [
      unit('player', 981, 1, 2, crew.creatures[0]!),
      unit('enemy', 982, 7, 2, foe.creatures[0]!),
    ]
    game.nextId = 983
    const friendly = card.kind === 'equipment' ||
      ['heal', 'scan', 'armor', 'sharpen', 'grant', 'boost'].includes(card.effect ?? '')
    const location =
      card.kind === 'creature'
        ? { x: 0, y: 0 }
        : card.kind === 'trap'
          ? { x: 3, y: 2 }
          : friendly
            ? { x: 1, y: 2 }
            : { x: 7, y: 2 }
    const played = deploy(game, card.id, location.x, location.y)
    assert.notEqual(
      played,
      game,
      crew.id + '/' + card.id + ' must execute its printed battle effect',
    )
    assert.equal(played.mana, 10 - card.cost)
    assert.equal(played.stats.plays.player[card.kind], 1)
    assert.ok(played.discards.player.includes(card.id))
    assert.ok(played.commands.some((cmd) => cmd.t === 'deploy' && cmd.card === card.id))
  }
}
console.log('Slime City wave three: 36 playable crew cards, 12 rares, six distinct archetypes, 204-card economy PASS')
