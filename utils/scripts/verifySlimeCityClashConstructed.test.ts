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
const selectedBouts = new Map<string, number>()
const reachedL2 = new Map<string, number>()
const reachedL3 = new Map<string, number>()
const replayedArchetypes = new Set<string>()
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
    const selected = new Set(
      s.commands.flatMap((c) =>
        c.t === 'play' && c.side === side ? [c.card] : [],
      ),
    )
    for (const id of deck.cards) {
      inDeckGames.set(id, (inDeckGames.get(id) ?? 0) + 1)
      if (selected.has(id))
        selectedBouts.set(id, (selectedBouts.get(id) ?? 0) + 1)
      const level = s.levels[side][id] ?? 1
      if (level >= 2) reachedL2.set(id, (reachedL2.get(id) ?? 0) + 1)
      if (level >= 3) reachedL3.set(id, (reachedL3.get(id) ?? 0) + 1)
    }
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
  // Replay each crew/archetype once, not just one arbitrary crew deck.
  // This exercises all five constructed strategies through server replay.
  const replayKey = a.team + '/' + a.name
  if (!mirror && !replayedArchetypes.has(replayKey)) {
    replayedArchetypes.add(replayKey)
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
// pair is played, so each pairing is seen from both seats, and each ordered
// pair is played on CROSS_BOUTS seeds so one lucky draw cannot swing a crew.
const CROSS_BOUTS = 4
for (const [i, a] of decks.entries())
  for (const [j, b] of decks.entries()) {
    if (a.team === b.team) continue
    for (let k = 0; k < CROSS_BOUTS; k++)
      record(a, b, play(a, b, 1 + ((i * 31 + j * 17) % 97) + k * 1000), false)
  }
// Same-crew mirrors: does any archetype dominate its own crew's other builds?
for (const [i, a] of decks.entries())
  for (const [j, b] of decks.entries()) {
    if (a.team !== b.team || a === b) continue
    record(a, b, play(a, b, 101 + i * 7 + j), true)
  }

const crossGames =
  CROSS_BOUTS * decks.length * (decks.length - ARCHETYPES.length)
assert.equal(games - mirrorGames, crossGames)
assert.equal(
  mirrorGames,
  TEAMS.length * ARCHETYPES.length * (ARCHETYPES.length - 1),
)
assert.equal(replayed.size, TEAMS.length)
assert.equal(replayedArchetypes.size, decks.length)

const rate = (r: { games: number; points: number }) => r.points / r.games
const firstSeatRate = firstSeat / games
assert.ok(
  firstSeatRate > 0.4 && firstSeatRate < 0.62,
  'constructed first seat ' + (100 * firstSeatRate).toFixed(1) + '%',
)
assert.ok(roundLimit / games < 0.05, 'constructed bouts end by knockout')
// Crew identity holds across a whole constructed field, not just starters.
// One bout per ordered pairing was noisy (Riot read 0.41-0.44, spread 0.20).
// At four bouts, five disjoint seed families on 2026-11-11 PT (slime-city/t-056)
// read Riot 0.430-0.473, Catgirls 0.435-0.457, Exchange 0.593-0.612 and
// spread 0.138-0.177: Exchange running hot is the stable signal, Riot is only
// a little low. slime-city/t-057 then cut Exchange's CALL IN THE DEBT from
// 5/8 to 4/7: four disjoint families read Exchange 0.552-0.569, Catgirls (now
// the low crew) 0.424-0.458 and spread 0.113-0.141, so the band tightens from
// 40-64% / 20 points to 41-59% / 16 points, one point either side of the
// 40-seed starter guard (42-58%) because each constructed seed family is noisier.
// slime-city/t-058 lifted NINE LIVES from +2/+3 to +3/+4: families 0-3 read
// Catgirls 0.452-0.478, Riot 0.441-0.484, Exchange 0.541-0.573 and spread
// 0.087-0.132, so the band tightens to the starter guard's 42-58% / 15 points.
// The bigger Catgirls drag is the CPU paying full price for PIERCE gear
// against unarmored fighters (their fighters deck read 0.43 with Surgical
// Piercers, 0.60 without), but fixing that lifts the Undertow starter to 59%,
// so it is its own task.
const crews = [...crewScore.entries()].map(
  ([team, r]) => [team, rate(r)] as const,
)
for (const [team, r] of crews)
  assert.ok(
    r > 0.42 && r < 0.58,
    team + ' constructed-field score ' + (100 * r).toFixed(1) + '%',
  )
assert.ok(
  Math.max(...crews.map(([, r]) => r)) - Math.min(...crews.map(([, r]) => r)) <=
    0.15,
  'constructed crew spread stays within 15 points',
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
// slime-city/t-012 (2026-11-19 PT): the spell-heavy build (eight fighters,
// twelve crew specials) is the weakest archetype at 26.0% (riot 17.3%,
// ironjaw 20.7%) while fighters reads 69.2%. That is a deck-builder probe,
// not a crew pairing (the >30% worst-pairing target is guarded on starter
// decks in verifySlimeCityClash), and its cause is the near-dead two-slot
// specials ratcheted below. Ratchet it so a card or CPU change can only lift
// spell-heavy decks: raise this floor as the special pass lands.
const SPECIALS_ARCHETYPE_FLOOR = 0.25
assert.ok(
  archetypeRate.specials! >= SPECIALS_ARCHETYPE_FLOOR,
  'specials archetype ' +
    (100 * archetypeRate.specials!).toFixed(1) +
    '% stays at or above its ratchet floor',
)

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
// slime-city/t-041 (2026-11-18 PT): the CPU judges a two-slot special against
// the best pair of one-slot plays instead of halving it, which revived seven
// of the 13 dead two-slot specials (6 remain). The follow-up card pass gave
// the last six (Union Reallocation, Furnace Overdrive, Wrong Side of the
// Curtain, Breeding Hunger, Mark of the Procession, Stolen Bone Saw) an
// authored level-one payoff carried into L2/L3, and every one is now played.
// Lock that in: a CPU or card change that strands a special again fails here.
assert.ok(
  dead.length === 0,
  dead.length + ' dead two-slot cards (ceiling 0): ' + dead.join(', '),
)
// Count distinct bouts in which a card was chosen, not raw play commands.
// A repeatedly played card must not masquerade as a high selection rate.
// Keep repeat plays and evolution reachability for editorial diagnosis.
const selectionRows = [...inDeckGames.entries()]
  .map(([id, appearances]) => ({
    id,
    appearances,
    plays: played.get(id) ?? 0,
    selectedBouts: selectedBouts.get(id) ?? 0,
    selectionRate: Number(
      ((selectedBouts.get(id) ?? 0) / appearances).toFixed(3),
    ),
    l2: reachedL2.get(id) ?? 0,
    l3: reachedL3.get(id) ?? 0,
  }))
  .sort((a, b) => a.selectionRate - b.selectionRate || a.id.localeCompare(b.id))
const lowSelection = selectionRows.slice(0, 25)
// Near-dead cards (slime-city/t-041, 2026-11-18 PT): "played at least once"
// hides cards the CPU almost never chooses. On the suite seeds 18 two-slot
// cards (crew specials plus Juggernaut, Chimera and Grease Oracle) are chosen in under 3% of the bouts they sit in (several 1-3 times
// in 208-416 bouts). Two held-out seed families (+5000, +9000) read 17 and
// 19, and there Twin Omens and Spare Nine Lives drop to zero plays, so the
// dead-card ceiling of 0 above is seed luck for them. Ratchet the count: a
// card or CPU change may lower it (then lower the ceiling), never raise it.
// Every one-slot card clears the floor on all three families (lowest:
// Floodlight Leak at 3.4-4.3%), so a near-dead one-slot card fails outright.
const NEAR_DEAD_RATE = 0.03
const nearDead = selectionRows.filter((r) => r.selectionRate < NEAR_DEAD_RATE)
const nearDeadOneSlot = nearDead.filter(
  (r) => clashPlayCost(cardById(r.id)) === 1,
)
assert.deepEqual(
  nearDeadOneSlot.map((r) => r.id),
  [],
  'every one-slot card is chosen in at least 3% of its bouts',
)
// 2026-11-19 PT: CLASH_CPU_TWO_SLOT_MARGIN 2 -> 0 revived ten of them; 8 remain
// (Juggernaut, Chimera, Grease Oracle, Spare Nine Lives, Glitterglass Flood,
// Breeding Hunger, Compound Notice, Acquisition Clause).
const NEAR_DEAD_TWO_SLOT_CEILING = 8
assert.ok(
  nearDead.length <= NEAR_DEAD_TWO_SLOT_CEILING,
  nearDead.length +
    ' near-dead two-slot cards (ceiling ' +
    NEAR_DEAD_TWO_SLOT_CEILING +
    '): ' +
    nearDead.map((r) => r.id).join(', '),
)
// Held-out seed family (slime-city/t-071, 2026-11-18 PT): the suite seeds
// above are what every card fix is tuned against, so a fix can pass by seed
// luck. kind_robots#5316 found Twin Omens and Spare Nine Lives fully dead on
// the +5000 and +9000 families while the suite seeds reported 0 dead. Replay
// the cross-crew field once more on a disjoint family (no mirrors, no crew
// balance asserts: those are pinned on the suite seeds) and ratchet its dead
// and near-dead counts too. One family keeps CI cost to one extra field.
// SLIME_CITY_CLASH_HELDOUT_OFFSET swaps the family for local probing; the
// ceilings below are only enforced on the default.
const DEFAULT_HELD_OUT_OFFSET = 5000
const heldOutOffset = Number(
  process.env.SLIME_CITY_CLASH_HELDOUT_OFFSET ?? DEFAULT_HELD_OUT_OFFSET,
)
assert.ok(
  Number.isInteger(heldOutOffset) && heldOutOffset >= CROSS_BOUTS * 1000,
  'held-out offset ' + heldOutOffset + ' is disjoint from the suite seeds',
)
function heldOutField(offset: number) {
  const inDeck = new Map<string, number>()
  const chosen = new Map<string, number>()
  let bouts = 0
  for (const [i, a] of decks.entries())
    for (const [j, b] of decks.entries()) {
      if (a.team === b.team) continue
      for (let k = 0; k < CROSS_BOUTS; k++) {
        const seed = offset + 1 + ((i * 31 + j * 17) % 97) + k * 1000
        const s = play(a, b, seed)
        assert.ok(s.victor, 'held-out bout ' + seed + ' settles')
        bouts++
        for (const [deck, side] of [
          [a, 'player'],
          [b, 'enemy'],
        ] as Array<[Deck, Side]>) {
          const picked = new Set(
            s.commands.flatMap((c) =>
              c.t === 'play' && c.side === side ? [c.card] : [],
            ),
          )
          for (const id of deck.cards) {
            inDeck.set(id, (inDeck.get(id) ?? 0) + 1)
            if (picked.has(id)) chosen.set(id, (chosen.get(id) ?? 0) + 1)
          }
        }
      }
    }
  const rows = [...inDeck.entries()].map(([id, appearances]) => ({
    id,
    rate: (chosen.get(id) ?? 0) / appearances,
  }))
  return {
    bouts,
    dead: rows.filter((r) => r.rate === 0).map((r) => r.id),
    nearDead: rows.filter((r) => r.rate < NEAR_DEAD_RATE).map((r) => r.id),
  }
}
const heldOut = heldOutField(heldOutOffset)
assert.equal(heldOut.bouts, crossGames)
// Same rules as the suite seeds: a near-dead one-slot card or a dead crew
// fighter fails outright; only two-slot cards fall under the ceilings.
assert.deepEqual(
  heldOut.nearDead.filter((id) => clashPlayCost(cardById(id)) === 1),
  [],
  'held-out family: every one-slot card is chosen in at least 3% of its bouts',
)
assert.deepEqual(
  heldOut.dead.filter(
    (id) => isFighter(id) && cardById(id).team !== 'mercenary',
  ),
  [],
  'held-out family: every crew fighter gets played',
)
// Measured on +5000 when this guard landed: 2 dead (Glitterglass Flood, the
// s3 Compound Notice) and 16 near-dead. Ratchet: lower them when
// a card or CPU change revives a card here; never raise them.
// 2026-11-19 PT: margin 2 -> 0 read 0 dead and 7 near-dead here (+9000: 0
// and 6).
const HELD_OUT_DEAD_CEILING = 0
const HELD_OUT_NEAR_DEAD_CEILING = 7
if (heldOutOffset === DEFAULT_HELD_OUT_OFFSET) {
  assert.ok(
    heldOut.dead.length <= HELD_OUT_DEAD_CEILING,
    'held-out family: ' +
      heldOut.dead.length +
      ' dead two-slot cards (ceiling ' +
      HELD_OUT_DEAD_CEILING +
      '): ' +
      heldOut.dead.join(', '),
  )
  assert.ok(
    heldOut.nearDead.length <= HELD_OUT_NEAR_DEAD_CEILING,
    'held-out family: ' +
      heldOut.nearDead.length +
      ' near-dead two-slot cards (ceiling ' +
      HELD_OUT_NEAR_DEAD_CEILING +
      '): ' +
      heldOut.nearDead.join(', '),
  )
}
const mercenarySelection = selectionRows.filter(
  (row) => cardById(row.id).team === 'mercenary',
)
assert.ok(
  lowSelection.every(
    (row) =>
      row.selectedBouts <= row.appearances &&
      row.selectionRate >= 0 &&
      row.selectionRate <= 1,
  ),
  'constructed selection rates are bounded per card appearance',
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
      nearDeadTwoSlotCards: nearDead.map((r) => r.id),
      heldOut: {
        offset: heldOutOffset,
        bouts: heldOut.bouts,
        deadTwoSlotCards: heldOut.dead,
        nearDeadTwoSlotCards: heldOut.nearDead,
      },
      evolutionReach: {
        l2: reachedL2.size,
        l3: reachedL3.size,
      },
      replayedArchetypes: replayedArchetypes.size,
      lowSelection,
      mercenarySelection,
    }),
)
console.log(
  'Slime City constructed CLASH: ' +
    games +
    ' bouts across ' +
    decks.length +
    ' legal 20-card decks, ' +
    replayedArchetypes.size +
    ' exact archetype replays; ' +
    dead.length +
    ' dead and ' +
    nearDead.length +
    ' near-dead two-slot cards (t-041); held-out +' +
    heldOutOffset +
    ': ' +
    heldOut.dead.length +
    ' dead and ' +
    heldOut.nearDead.length +
    ' near-dead (t-071), no dead crew fighter or one-slot card PASS',
)
