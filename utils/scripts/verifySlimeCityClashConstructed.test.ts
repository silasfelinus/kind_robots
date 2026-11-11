// slime-city/t-021: constructed-vs-constructed SOLO CLASH audit.
//
// The starter balance sweep (verifySlimeCityClash) plays canonical decks on
// both sides. This suite builds five legal 20-card constructed decks per crew
// from the actual 300-card pool and plays every deck against every other
// crew's decks (both seats, because every ordered pair is played) plus the
// same-crew archetype mirrors. It guards what a deck builder can break:
// legality, settled games, exact replays, seat and crew balance across a
// constructed field, and no single constructed deck running away with it.
//
// It also reports dead cards: catalog cards that sit in a constructed deck
// for its whole run and are never played. The 2026-11-11 PT audit found that
// the 1-slot field is fully live but the crews' two-slot specials (heavy
// spells and gear) are never played. An A/B showed that is card weakness,
// not a CPU blind spot: forcing the CPU to spend both slots on them dropped a
// heavy-special deck from 0.55 to 0.19, and even repricing them to one slot
// dropped it from 0.43 to 0.34. That redesign belongs to the fighters-first
// pass (slime-city/t-051), so this suite pins the dead set to two-slot
// cards (crew specials plus the Grease Oracle and Juggernaut mercenaries): a
// new dead one-slot card, or a dead crew fighter, fails here.
import assert from 'node:assert/strict'
import { soloProblems } from '../slimeCity/alliance'
import {
  CLASH_DECK_SIZE,
  CLASH_ROUND_LIMIT,
  applyClashCommand,
  chooseClashCpu,
  clashDeck,
  clashPlayCost,
  createClash,
  replayClash,
  type ClashState,
} from '../slimeCity/clash'
import {
  CARDS,
  TEAMS,
  cardById,
  type Side,
  type TeamId,
} from '../slimeCity/prototypes'

const ARCHETYPES = [
  'starter',
  'fighters',
  'specials',
  'mercs',
  'heavy',
] as const
type Archetype = (typeof ARCHETYPES)[number]
interface Deck {
  team: TeamId
  name: Archetype
  cards: string[]
}

const isFighter = (id: string) => cardById(id).kind === 'creature'
function fill(team: TeamId, picks: string[]): string[] {
  // Pad from the starter, then the crew pool, keeping the first 20 unique.
  const out = [...new Set(picks)]
  for (const id of [
    ...clashDeck(team),
    ...CARDS.filter((c) => c.team === team).map((c) => c.id),
  ]) {
    if (out.length >= CLASH_DECK_SIZE) break
    if (!out.includes(id)) out.push(id)
  }
  return out.slice(0, CLASH_DECK_SIZE)
}

/** Five deterministic, distinct deck-builder strategies for one crew. */
export function constructedDecks(team: TeamId): Deck[] {
  const starter = clashDeck(team)
  const pool = CARDS.filter((c) => c.team === team)
  const fighters = pool.filter((c) => c.kind === 'creature').map((c) => c.id)
  const specials = pool.filter((c) => c.kind !== 'creature').map((c) => c.id)
  const starterFighters = starter
    .filter(isFighter)
    .sort(
      (a, b) =>
        Number(!!cardById(b).signature) - Number(!!cardById(a).signature),
    )
  // Mercenaries: swap the starter's last six plain crew fighters for hired guns.
  const hired = CARDS.filter(
    (c) => c.team === 'mercenary' && c.kind === 'creature',
  ).map((c) => c.id)
  const mercs = [...starter]
  let next = 0
  for (let i = mercs.length - 1; i >= 0 && next < 6; i--) {
    const card = cardById(mercs[i]!)
    if (card.kind !== 'creature' || card.signature || card.team !== team)
      continue
    while (mercs.includes(hired[next]!)) next++
    mercs[i] = hired[next++]!
  }
  const heavyFirst = [...pool]
    .sort((a, b) => clashPlayCost(b) - clashPlayCost(a))
    .map((c) => c.id)
  return [
    { team, name: 'starter', cards: starter },
    // Every crew fighter, topped up with one-slot specials the starter skips.
    {
      team,
      name: 'fighters',
      cards: fill(team, [
        ...fighters,
        ...specials.filter(
          (id) => !starter.includes(id) && clashPlayCost(cardById(id)) === 1,
        ),
      ]),
    },
    // Spell/trap/gear control: eight fighters, twelve crew specials.
    {
      team,
      name: 'specials',
      cards: fill(team, [...starterFighters.slice(0, 8), ...specials]),
    },
    { team, name: 'mercs', cards: mercs },
    // Every two-slot card in the crew first.
    { team, name: 'heavy', cards: fill(team, heavyFirst) },
  ]
}

const decks = TEAMS.flatMap((t) => constructedDecks(t.id))
assert.equal(decks.length, TEAMS.length * ARCHETYPES.length)
for (const deck of decks) {
  const label = deck.team + '/' + deck.name
  assert.deepEqual(
    soloProblems(deck.team, deck.cards),
    [],
    label + ' is a legal Solo deck',
  )
  assert.equal(deck.cards.length, CLASH_DECK_SIZE, label + ' has 20 cards')
  if (deck.name !== 'starter') {
    const starter = new Set(clashDeck(deck.team))
    const changed = deck.cards.filter((id) => !starter.has(id)).length
    assert.ok(changed >= 4, label + ' differs from the starter by ' + changed)
  }
}

function play(a: Deck, b: Deck, seed: number): ClashState {
  let s = createClash(a.team, b.team, seed, {
    decks: { player: a.cards, enemy: b.cards },
  })
  for (let step = 0; !s.victor && step < 600; step++)
    s = applyClashCommand(s, chooseClashCpu(s, s.active))
  return s
}

const score = new Map<Deck, { games: number; points: number }>()
const crewScore = new Map<TeamId, { games: number; points: number }>()
const inDeckGames = new Map<string, number>()
const played = new Map<string, number>()
let games = 0
let firstSeat = 0
let draws = 0
let roundLimit = 0
let rounds = 0
let mirrorGames = 0
const replayed = new Set<TeamId>()

function record(a: Deck, b: Deck, s: ClashState, mirror: boolean): void {
  assert.ok(s.victor, a.team + '/' + a.name + ' vs ' + b.name + ' settles')
  games++
  rounds += s.round
  if (s.victor === 'player') firstSeat++
  if (s.victor === 'draw') draws++
  if (s.round >= CLASH_ROUND_LIMIT) roundLimit++
  if (mirror) mirrorGames++
  for (const [deck, side] of [
    [a, 'player'],
    [b, 'enemy'],
  ] as Array<[Deck, Side]>) {
    const points = s.victor === side ? 1 : s.victor === 'draw' ? 0.5 : 0
    const row = score.get(deck) ?? { games: 0, points: 0 }
    row.games++
    row.points += points
    score.set(deck, row)
    if (!mirror) {
      const crew = crewScore.get(deck.team) ?? { games: 0, points: 0 }
      crew.games++
      crew.points += points
      crewScore.set(deck.team, crew)
    }
    for (const id of deck.cards)
      inDeckGames.set(id, (inDeckGames.get(id) ?? 0) + 1)
    // No card is duplicated across draw pile, hand and spent pile.
    const zones = [...s.decks[side], ...s.hands[side], ...s.discards[side]]
    assert.equal(new Set(zones).size, zones.length, 'no duplicated card')
    assert.ok(
      zones.every((id) => deck.cards.includes(id)),
      'no foreign card',
    )
  }
  for (const c of s.commands)
    if (c.t === 'play') played.set(c.card, (played.get(c.card) ?? 0) + 1)
  // One exact command replay per crew, through the server replay path.
  if (!mirror && !replayed.has(a.team) && a.name !== 'starter') {
    replayed.add(a.team)
    assert.deepEqual(
      replayClash(a.team, b.team, s.seed, s.commands, {
        decks: { player: a.cards, enemy: b.cards },
      }),
      s,
      a.team + '/' + a.name + ' replays exactly',
    )
  }
}

// Cross-crew field: every deck against every other crew's decks. Every ordered
// pair is played, so each pairing is seen from both seats.
for (const [i, a] of decks.entries())
  for (const [j, b] of decks.entries()) {
    if (a.team === b.team) continue
    record(a, b, play(a, b, 1 + ((i * 31 + j * 17) % 97)), false)
  }
// Same-crew mirrors: does any archetype dominate its own crew's other builds?
for (const [i, a] of decks.entries())
  for (const [j, b] of decks.entries()) {
    if (a.team !== b.team || a === b) continue
    record(a, b, play(a, b, 101 + i * 7 + j), true)
  }

const crossGames = decks.length * (decks.length - ARCHETYPES.length)
assert.equal(games - mirrorGames, crossGames)
assert.equal(
  mirrorGames,
  TEAMS.length * ARCHETYPES.length * (ARCHETYPES.length - 1),
)
assert.equal(replayed.size, TEAMS.length)

const rate = (r: { games: number; points: number }) => r.points / r.games
const firstSeatRate = firstSeat / games
assert.ok(
  firstSeatRate > 0.4 && firstSeatRate < 0.62,
  'constructed first seat ' + (100 * firstSeatRate).toFixed(1) + '%',
)
assert.ok(roundLimit / games < 0.05, 'constructed bouts end by knockout')
// Crew identity holds across a whole constructed field, not just starters.
// One bout per ordered pairing is noisy (two seed sets on 2026-11-11 PT read
// spreads of 0.19 and 0.20, Exchange ~0.60 both times, Riot 0.41-0.44), so
// this is a looser band than the 40-seed starter guard (42-58%, 12 points).
const crews = [...crewScore.entries()].map(
  ([team, r]) => [team, rate(r)] as const,
)
for (const [team, r] of crews)
  assert.ok(
    r > 0.35 && r < 0.65,
    team + ' constructed-field score ' + (100 * r).toFixed(1) + '%',
  )
assert.ok(
  Math.max(...crews.map(([, r]) => r)) - Math.min(...crews.map(([, r]) => r)) <=
    0.24,
  'constructed crew spread stays within 24 points',
)
// No single constructed build runs away with the field.
const deckRows = decks.map((d) => ({
  deck: d.team + '/' + d.name,
  name: d.name,
  rate: rate(score.get(d)!),
}))
for (const row of deckRows)
  assert.ok(row.rate <= 0.85, row.deck + ' is not a runaway deck')
// The canonical starter stays a sound default: it beats the average build.
const archetypeRate = Object.fromEntries(
  ARCHETYPES.map((name) => {
    const rows = deckRows.filter((r) => r.name === name)
    return [name, rows.reduce((sum, r) => sum + r.rate, 0) / rows.length]
  }),
)
assert.ok(archetypeRate.starter! >= 0.5, 'starters hold their own')

// Dead cards: in a deck for its whole run, never played by either seat.
const dead = [...inDeckGames.keys()].filter((id) => !played.get(id))
const deadOneSlot = dead.filter((id) => clashPlayCost(cardById(id)) === 1)
const deadCrewFighters = dead.filter(
  (id) => isFighter(id) && cardById(id).team !== 'mercenary',
)
assert.deepEqual(
  deadOneSlot,
  [],
  'every one-slot card in the field gets played',
)
assert.deepEqual(
  deadCrewFighters,
  [],
  'every crew fighter in the field gets played',
)
const crewPool = CARDS.filter((c) => c.team !== 'mercenary')
const covered = crewPool.filter((c) => inDeckGames.has(c.id)).length

console.log(
  'SLIME_CITY_CLASH_CONSTRUCTED_REPORT ' +
    JSON.stringify({
      deckCount: decks.length,
      games,
      mirrorGames,
      crewCardsCovered: covered + '/' + crewPool.length,
      firstSeat: Number(firstSeatRate.toFixed(3)),
      draws,
      roundLimit,
      averageRounds: Number((rounds / games).toFixed(2)),
      crews: Object.fromEntries(
        crews.map(([t, r]) => [t, Number(r.toFixed(3))]),
      ),
      archetypes: Object.fromEntries(
        Object.entries(archetypeRate).map(([k, v]) => [
          k,
          Number(v.toFixed(3)),
        ]),
      ),
      decks: Object.fromEntries(
        deckRows
          .sort((x, y) => y.rate - x.rate)
          .map((r) => [r.deck, Number(r.rate.toFixed(3))]),
      ),
      deadTwoSlotCards: dead,
    }),
)
console.log(
  'Slime City constructed CLASH: ' +
    games +
    ' bouts across ' +
    decks.length +
    ' legal 20-card decks, ' +
    replayed.size +
    ' exact replays; ' +
    dead.length +
    ' dead two-slot cards (t-051), no dead crew fighter or one-slot card PASS',
)
