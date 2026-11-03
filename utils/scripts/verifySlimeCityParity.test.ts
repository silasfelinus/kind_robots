// PARITY (Silas, 2026-11-03): "each turn you play one card. That's it. A card
// can have an effect to nullify the next x plays, or not register as a play
// (faction bonus) but in general, let's test a system where every card is
// theoretically as good as every other card." No mana, one play a turn,
// normalized cards, JAM and the faction free play, in all three formats.
import assert from 'node:assert/strict'
import {
  advance,
  cardById,
  CARDS,
  createMatch,
  deploy,
  deployAs,
  JAM_CAP,
  observe,
  parityCard,
  parityWorth,
  PARITY_FREE_KIND,
  PARITY_WORTH,
  replayMatch,
  RULE_VARIANTS,
  TEAMS,
  type MatchState,
  type ModeId,
} from '../slimeCity/prototypes'
import { playHeadless } from '../slimeCity/playtest'

const parity = { parity: true }

// --- Normalized cards: free, and every creature on the same budget.
for (const card of CARDS) {
  const p = parityCard(card)
  assert.equal(p.cost, 0, card.id + ' is free')
  assert.equal(p.id, card.id)
  assert.deepEqual(p.keywords, card.keywords, 'Keywords keep their identity')
  if (card.kind !== 'creature') continue
  assert.ok(p.hp! >= 1 && p.attack! >= 1)
  // Rounding to whole stats leaves at most a point either way; only a
  // creature whose keywords alone exceed the budget keeps a 4-point body.
  const worth = parityWorth(p)
  assert.ok(
    Math.abs(worth - PARITY_WORTH) <= 1 ||
      (p.hp! + 2 * p.attack! + 2 * (p.armor ?? 0) <= 5 && worth > PARITY_WORTH),
    card.id + ' on budget: ' + worth,
  )
}
const strongest = CARDS.filter((c) => c.kind === 'creature').sort(
  (a, b) =>
    b.hp! +
    2 * b.attack! +
    2 * (b.armor ?? 0) -
    (a.hp! + 2 * a.attack! + 2 * (a.armor ?? 0)),
)[0]!
assert.ok(
  parityCard(strongest).hp! + 2 * parityCard(strongest).attack! <
    strongest.hp! + 2 * strongest.attack!,
  'The strongest creature is brought down to the budget',
)
// Mana debt becomes JAM, capped.
for (const card of CARDS.filter((c) => c.debt || c.effect === 'debt'))
  assert.ok(parityCard(card).debt! >= 1 && parityCard(card).debt! <= JAM_CAP)
assert.ok(RULE_VARIANTS.some((v) => v.id === 'parity'))
// Every crew's free kind is one it actually owns cards of.
for (const team of TEAMS)
  assert.ok(
    CARDS.some(
      (c) => c.team === team.id && c.kind === PARITY_FREE_KIND[team.id],
    ),
  )

// --- One play a turn in BLACKOUT, no mana needed.
function hand(state: MatchState, ids: string[]) {
  state.hands = { ...state.hands, player: ids }
  state.mana = 0
  return state
}
const team = 'riot'
const creatures = CARDS.filter(
  (c) => c.team === team && c.kind === 'creature',
).map((c) => c.id)
const freeKind = PARITY_FREE_KIND[team]
const freeCard = CARDS.find((c) => c.team === team && c.kind === freeKind)!
const one = hand(createMatch('blackout', team, 'catgirls', 31, parity), [
  creatures[0]!,
  creatures[1]!,
  freeCard.id,
])
assert.equal(observe(one, 'player').parity, true)
assert.equal(observe(one, 'player').hand[0]!.cost, 0)
const first = deploy(one, creatures[0]!, 0, 0)
assert.notEqual(first, one, 'Plays with zero mana')
assert.equal(first.mana, 0)
assert.equal(
  deploy(first, creatures[1]!, 0, 3),
  first,
  'A second play this turn is refused',
)
assert.equal(observe(first, 'player').playSpent, true)
// The crew's free kind does not use up the play (once a turn).
const trapAt = { x: 4, y: 2 }
const freed = deploy(first, freeCard.id, trapAt.x, trapAt.y)
assert.notEqual(freed, first, 'Faction free play after the turn’s play')
assert.equal(freed.freePlays.player, 1)
// Next turn: one play again.
const nextTurn = advance(freed)
assert.equal(nextTurn.freePlays.player, 0)
assert.equal(nextTurn.playedThisRound.player.length, 0)

// --- JAM: the other crew's next plays fizzle; capped.
const jammer = CARDS.find(
  (c) => c.kind === 'spell' && c.effect === 'debt' && c.team === 'exchange',
)!
const jamGame = createMatch('blackout', 'exchange', 'riot', 44, parity)
jamGame.hands.player = [jammer.id]
jamGame.units = [
  {
    id: 70,
    cardId: creatures[0]!,
    side: 'enemy',
    x: 8,
    y: 2,
    hp: 5,
    maxHp: 5,
    attack: 1,
    armor: 0,
    ap: 1,
    maxAp: 1,
    hidden: false,
    carryingFlag: false,
  },
]
const jammed = deploy(jamGame, jammer.id, 8, 2)
assert.notEqual(jammed, jamGame)
assert.equal(jammed.jammed.enemy, parityCard(jammer).debt)
assert.ok(jammed.jammed.enemy <= JAM_CAP)
const enemyCard = jammed.hands.enemy.find(
  (id) => cardById(id).kind === 'creature',
)!
const fizzled = deployAs(jammed, 'enemy', enemyCard, 9, 0)
assert.notEqual(fizzled, jammed, 'A jammed play is spent')
assert.equal(fizzled.units.length, 1, 'but it does nothing')
assert.equal(fizzled.jammed.enemy, jammed.jammed.enemy - 1)
assert.ok(fizzled.log[0]!.includes('JAMMED'))

// --- TURF: one stone a turn, plus the free kind.
const turf = createMatch('turf', team, 'catgirls', 9, parity)
turf.hands.player = [creatures[0]!, creatures[1]!, freeCard.id]
turf.mana = 0
const stone = deploy(turf, creatures[0]!, 4, 4)
assert.notEqual(stone, turf)
assert.equal(deploy(stone, creatures[1]!, 5, 5), stone)
assert.notEqual(deploy(stone, freeCard.id, 2, 2), stone)

// --- Whole games resolve and replay in every format.
for (const mode of ['blackout', 'bloodrush', 'turf'] as ModeId[]) {
  const { state } = playHeadless(
    mode,
    'undertow',
    'ironjaw',
    5,
    undefined,
    parity,
  )
  assert.ok(state.victor, mode + ' resolves')
  assert.deepEqual(
    replayMatch(
      {
        mode,
        teamId: 'undertow',
        foeId: 'ironjaw',
        seed: 5,
        rules: parity,
      },
      state.commands,
    ),
    state,
    mode + ' PARITY replays exactly',
  )
  // Never more than one non-free play per side in any turn.
  let turn = { player: 0, enemy: 0 }
  for (const c of state.commands) {
    if (c.t === 'end') turn = { player: 0, enemy: 0 }
    else if (c.t === 'deploy') {
      const kind = cardById(c.card).kind
      const team = c.side === 'player' ? 'undertow' : 'ironjaw'
      if (kind !== PARITY_FREE_KIND[team]) turn[c.side]++
      assert.ok(turn[c.side] <= 1, mode + ': one play a turn')
    }
  }
}

console.log(
  'Slime City PARITY: normalized free cards, one play a turn, faction free play, JAM, three formats replay PASS',
)
