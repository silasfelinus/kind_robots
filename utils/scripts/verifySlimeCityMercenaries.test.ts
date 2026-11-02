import assert from 'node:assert/strict'
import {
  CARDS,
  DECK_SIZE,
  TEAMS,
  cardById,
  createMatch,
  deckOf,
  deploy,
  loadoutProblems,
  replayMatch,
  type Card,
  type Fighter,
  type TeamId,
} from '../slimeCity/prototypes'
import {
  MERCENARY_CARDS,
  MERCENARY_RARE_IDS,
} from '../slimeCity/mercenaryCards'
import { RARE_COUNT, rarityOf } from '../slimeCity/progression'

assert.equal(MERCENARY_CARDS.length, 60)
assert.equal(MERCENARY_RARE_IDS.size, 20)
assert.equal(
  MERCENARY_CARDS.filter((card) => card.kind === 'creature').length,
  20,
)
assert.equal(MERCENARY_CARDS.filter((card) => card.kind === 'spell').length, 18)
assert.equal(MERCENARY_CARDS.filter((card) => card.kind === 'trap').length, 12)
assert.equal(
  MERCENARY_CARDS.filter((card) => card.kind === 'equipment').length,
  10,
)
assert.equal(
  MERCENARY_CARDS.filter((card) => rarityOf(card) === 'rare').length,
  20,
)
assert.equal(new Set(CARDS.map((card) => card.id)).size, CARDS.length)
assert.equal(new Set(CARDS.map((card) => card.name)).size, CARDS.length)
assert.equal(
  CARDS.filter((card) => rarityOf(card) !== 'rare').length,
  RARE_COUNT * 2,
)
assert.ok(
  MERCENARY_CARDS.every((card) => card.team === 'mercenary' && !card.signature),
)
assert.ok(
  MERCENARY_CARDS.every((card) => card.text.length >= 25 && card.symbol),
)
assert.ok(MERCENARY_CARDS.every((card) => card.cost >= 1 && card.cost <= 6))

function buildDeck(teamId: TeamId, recruits: readonly Card[]): string[] {
  const deck = deckOf(teamId).map((card) => card.id)
  for (const recruit of recruits) {
    const slot = deck.findIndex((id) => {
      const card = cardById(id)
      return (
        card.kind === recruit.kind &&
        !card.signature &&
        !recruits.some((r) => r.id === id)
      )
    })
    assert.ok(slot >= 0, teamId + ' has a legal ' + recruit.kind + ' slot')
    deck[slot] = recruit.id
  }
  assert.equal(deck.length, DECK_SIZE)
  return deck
}

function dummy(
  id: number,
  side: 'player' | 'enemy',
  x: number,
  y: number,
): Fighter {
  return {
    id,
    side,
    x,
    y,
    cardId: side === 'player' ? 'rat' : 'sprite',
    hp: 3,
    maxHp: 6,
    armor: 0,
    attack: 1,
    ap: 1,
    maxAp: 1,
    keywords: [],
    hidden: false,
    carryingFlag: false,
  }
}

for (const team of TEAMS) {
  const founder = deckOf(team.id).map((card) => card.id)
  for (const card of MERCENARY_CARDS) {
    const deck = buildDeck(team.id, [card])
    assert.deepEqual(loadoutProblems(team.id, deck), [])
    assert.ok(deck.includes(team.signature))
    const seed = Array.from({ length: 60 }, (_, i) => i + 1).find((value) =>
      createMatch(
        'blackout',
        team.id,
        'exchange',
        value,
        {},
        deck,
      ).hands.player.includes(card.id),
    )
    assert.ok(seed, 'Seed search must deal each neutral ' + card.id)
    const match = createMatch('blackout', team.id, 'exchange', seed!, {}, deck)
    assert.ok(match.hands.player.includes(card.id))
    assert.deepEqual(
      replayMatch(
        {
          mode: 'blackout',
          teamId: team.id,
          foeId: 'exchange',
          seed: seed!,
          playerDeck: deck,
        },
        match.commands,
      ),
      match,
    )
    match.mana = 10
    match.units = [dummy(900, 'player', 0, 0), dummy(901, 'enemy', 8, 4)]
    const helpful =
      card.kind === 'equipment' ||
      ['heal', 'scan', 'armor', 'boost', 'sharpen', 'grant'].includes(
        card.effect ?? '',
      )
    const pos =
      card.kind === 'creature'
        ? { x: 1, y: 2 }
        : card.kind === 'trap'
          ? { x: 4, y: 1 }
          : helpful
            ? { x: 0, y: 0 }
            : { x: 8, y: 4 }
    const played = deploy(match, card.id, pos.x, pos.y)
    assert.notEqual(
      played,
      match,
      team.id + '/' + card.id + ' must resolve its actual effect',
    )
    assert.equal(played.hands.player.includes(card.id), false)
    assert.ok(played.discards.player.includes(card.id))
    assert.equal(played.commands.at(-1)?.t, 'deploy')
  }

  const recruits = [
    MERCENARY_CARDS.find((c) => c.kind === 'creature')!,
    MERCENARY_CARDS.find((c) => c.kind === 'spell')!,
    MERCENARY_CARDS.find((c) => c.kind === 'trap')!,
  ]
  assert.deepEqual(loadoutProblems(team.id, buildDeck(team.id, recruits)), [])
  const four = [
    ...recruits,
    MERCENARY_CARDS.find((c) => c.kind === 'equipment')!,
  ]
  assert.ok(
    loadoutProblems(team.id, buildDeck(team.id, four)).some((problem) =>
      problem.includes('three mercenaries'),
    ),
  )
  const wrongTeam = TEAMS.find((other) => other.id !== team.id)!
  assert.ok(
    loadoutProblems(team.id, [...founder.slice(0, -1), wrongTeam.special[0]!])
      .length,
  )
}

console.log(
  'Slime City mercenaries: 60 authored, 20 rare, all four kinds, six crews, legal slots, real plays PASS',
)
