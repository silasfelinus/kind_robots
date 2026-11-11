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
  GUTTER_CROWN_FINALE_A,
  GUTTER_CROWN_FINALE_A_RARE_IDS,
} from '../slimeCity/gutterCrownFinaleA'
import {
  GUTTER_CROWN_FINALE_B,
  GUTTER_CROWN_FINALE_B_RARE_IDS,
} from '../slimeCity/gutterCrownFinaleB'
import {
  PACK_COST,
  RARE_COUNT,
  buyPack,
  canBuyPack,
  newProgression,
  rarityOf,
} from '../slimeCity/progression'

const additions = [...GUTTER_CROWN_FINALE_A, ...GUTTER_CROWN_FINALE_B]
const rarityCodes = new Set([
  ...GUTTER_CROWN_FINALE_A_RARE_IDS,
  ...GUTTER_CROWN_FINALE_B_RARE_IDS,
])
assert.equal(additions.length, 96)
assert.equal(rarityCodes.size, 32)
assert.equal(CARDS.length, 300)
assert.equal(RARE_COUNT, 100)
assert.equal(new Set(CARDS.map((c) => c.id)).size, 300)
assert.equal(new Set(CARDS.map((c) => c.name)).size, 300)
assert.equal(CARDS.filter((c) => rarityOf(c) === 'rare').length, 100)
assert.equal(CARDS.filter((c) => rarityOf(c) !== 'rare').length, 200)
assert.equal(additions.filter((c) => rarityOf(c) === 'rare').length, 32)

function unit(
  side: 'player' | 'enemy',
  id: number,
  x: number,
  y: number,
  cardId: string,
): Fighter {
  return {
    side,
    id,
    x,
    y,
    cardId,
    hp: 3,
    maxHp: 8,
    attack: 2,
    armor: 0,
    ap: 2,
    maxAp: 2,
    hidden: false,
    carryingFlag: false,
    keywords: [],
  }
}

for (const crew of TEAMS) {
  const faction = CARDS.filter((card) => card.team === crew.id)
  const wave = additions.filter((card) => card.team === crew.id)
  const kinds = {
    creature: wave.filter((c) => c.kind === 'creature'),
    spell: wave.filter((c) => c.kind === 'spell'),
    trap: wave.filter((c) => c.kind === 'trap'),
    equipment: wave.filter((c) => c.kind === 'equipment'),
  }
  assert.equal(faction.length, 40, crew.id + ' has its complete roster')
  assert.equal(wave.length, 16)
  assert.equal(kinds.creature.length, 6)
  assert.equal(kinds.spell.length, 5)
  assert.equal(kinds.trap.length, 3)
  assert.equal(kinds.equipment.length, 2)
  assert.ok(wave.filter((c) => rarityOf(c) === 'rare').length >= 5)
  const starter = deckOf(crew.id).map((c) => c.id)
  const foe = TEAMS.find((t) => t.id !== crew.id)!
  for (const card of wave) {
    assert.ok(card.text.length >= 65, card.id + ' has concrete written rules')
    assert.ok(card.name.length >= 8)
    assert.ok(card.symbol)
    assert.ok(card.cost >= 1 && card.cost <= 6)
    assert.equal(card.signature, undefined)
    const deck = starter.slice()
    const slot = deck.find((id) => {
      const old = cardById(id)
      return old.kind === card.kind && !old.signature
    })
    assert.ok(slot, card.id + ' has a legal deck slot')
    deck[deck.indexOf(slot!)] = card.id
    assert.deepEqual(loadoutProblems(crew.id, deck), [], card.id + ' legal')
    const base = createMatch('blackout', crew.id, foe.id, 900, {}, deck)
    assert.deepEqual(
      base,
      createMatch('blackout', crew.id, foe.id, 900, {}, deck),
      'A faction card must shuffle consistently from a match seed',
    )
    base.mana = 10
    base.hands.player = [card.id]
    base.units = [
      unit('player', 8001, 1, 2, crew.creatures[0]!),
      unit('enemy', 8002, 7, 2, foe.creatures[0]!),
    ]
    base.nextId = 8003
    const friendly =
      card.kind === 'equipment' ||
      ['heal', 'scan', 'armor', 'sharpen', 'grant', 'boost'].includes(
        card.effect ?? '',
      )
    const location =
      card.kind === 'creature'
        ? { x: 0, y: 0 }
        : card.kind === 'trap'
          ? { x: 3, y: 2 }
          : friendly
            ? { x: 1, y: 2 }
            : { x: 7, y: 2 }
    const result = deploy(base, card.id, location.x, location.y)
    assert.notEqual(result, base, crew.id + '/' + card.id + ' must play')
    assert.equal(result.mana, 10 - card.cost)
    assert.equal(result.stats.plays.player[card.kind], 1)
    assert.ok(result.discards.player.includes(card.id))
    assert.ok(
      result.commands.some((c) => c.t === 'deploy' && c.card === card.id),
    )
    if (card.kind === 'creature') {
      const fighter = result.units.find((c) => c.cardId === card.id)
      assert.ok(fighter, card.id + ' materialized as an actual creature')
      assert.equal(fighter!.maxHp, card.hp)
      assert.ok(
        (card.keywords ?? []).every((k) =>
          (fighter!.keywords ?? []).includes(k),
        ),
      )
    }
    if (card.kind === 'trap') {
      const trap = result.traps.find(
        (t) => t.side === 'player' && t.x === 3 && t.y === 2,
      )
      assert.ok(trap)
      assert.equal(trap.damage, card.power)
      assert.equal(Boolean(trap.roots), Boolean(card.roots))
      assert.equal(trap.debt ?? 0, card.debt ?? 0)
    }
    if (card.effect === 'grant') {
      const fighter = result.units.find((c) => c.id === 8001)!
      assert.ok(
        (card.grants ?? []).every((k) => (fighter.keywords ?? []).includes(k)),
      )
    }
    if (card.effect === 'debt') {
      assert.equal(result.debt.enemy, card.debt)
    }
    if (card.effect === 'sharpen') {
      assert.equal(result.units.find((c) => c.id === 8001)!.attack, 3)
    }
    if (card.effect === 'armor') {
      assert.equal(result.units.find((c) => c.id === 8001)!.armor, 1)
    }
  }
  // Three deliberate ten-card decks with different tactical investments:
  // aggressive creatures, support equipment, and control traps.
  const plans = [
    [kinds.creature[0]!, kinds.creature[1]!, kinds.spell[0]!],
    [kinds.creature[2]!, kinds.spell[1]!, kinds.equipment[0]!],
    [kinds.creature[3]!, kinds.spell[2]!, kinds.trap[0]!],
  ]
  for (const [index, plan] of plans.entries()) {
    const deck = starter.slice()
    for (const card of plan) {
      const slot = deck.find(
        (id) => cardById(id).kind === card.kind && !cardById(id).signature,
      )
      assert.ok(slot, crew.id + ' archetype ' + index)
      deck[deck.indexOf(slot!)] = card.id
    }
    assert.deepEqual(
      loadoutProblems(crew.id, deck),
      [],
      crew.id + ' archetype ' + index + ' is a legal ten-card loadout',
    )
    assert.equal(new Set(deck).size, 10)
    assert.equal(
      createMatch(
        'blackout',
        crew.id,
        foe.id,
        199 + index,
        {},
        deck,
      ).playerDeck!.join(','),
      deck.join(','),
    )
  }
}

// Packs reach every card beyond the base collection (Silas, 2026-11-11 PT:
// the pool is all non-starter cards; duplicates refund Meat).
let wallet = { ...newProgression(), meat: 1000 * PACK_COST }
for (let i = 0; i < 400 && wallet.cards.length < 300; i++) {
  assert.equal(canBuyPack(wallet), true, 'Pack ' + (i + 1) + ' is available')
  const next = buyPack(wallet, 20261102 + i * 187)
  assert.notEqual(next, wallet)
  assert.equal(rarityOf(cardById(next.lastPack[0]!)), 'rare')
  wallet = next
}
assert.equal(wallet.cards.length, 300)
assert.equal(new Set(wallet.cards).size, 300)

console.log(
  'Slime City complete core: 300 distinct cards, six 40-card crews, 32 new rares, 96 real casts, 18 legal archetypes, packs reach all 300 PASS',
)
