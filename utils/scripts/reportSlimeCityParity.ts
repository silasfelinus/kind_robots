// PARITY audit (Silas, 2026-11-03): "let's test a system where every card is
// theoretically as good as every other card." For every card, swap it into
// one fixed slot of a crew's founder deck (same kind, so the deck stays
// legal) and play it against every rival founder deck over many seeds, under
// the normal rules and under PARITY. A system where every card is as good as
// every other leaves card win rates spread no wider than sampling noise.
//
//   npx tsx utils/scripts/reportSlimeCityParity.ts [games-per-rival] [mode]
import {
  CARDS,
  TEAMS,
  cardById,
  deckOf,
  loadoutProblems,
  type Card,
  type ModeId,
  type TeamId,
} from '../slimeCity/prototypes'
import { playHeadless } from '../slimeCity/playtest'

const perRival = Number(process.argv[2] ?? 12)
const mode = (process.argv[3] ?? 'blackout') as ModeId
const seeds = Array.from({ length: perRival }, (_, i) => 101 + i * 37)

interface Row {
  card: Card
  crew: TeamId
  rate: number
  games: number
}

/** Each card's deck: its crew's founders with one fixed same-kind slot swapped. */
function trialDecks(): { card: Card; crew: TeamId; deck: string[] }[] {
  const out: { card: Card; crew: TeamId; deck: string[] }[] = []
  const crews = TEAMS.map((t) => t.id)
  for (const card of CARDS) {
    const crew =
      card.team === 'mercenary'
        ? crews[CARDS.filter((c) => c.team === 'mercenary').indexOf(card) % 6]!
        : (card.team as TeamId)
    const founders = deckOf(crew).map((c) => c.id)
    const slot = founders.findIndex(
      (id) => cardById(id).kind === card.kind && !cardById(id).signature,
    )
    if (slot < 0) continue
    if (founders.includes(card.id) && founders[slot] !== card.id) continue
    const deck = [...founders]
    deck[slot] = card.id
    if (loadoutProblems(crew, deck).length) continue
    out.push({ card, crew, deck })
  }
  return out
}

function run(parity: boolean): Row[] {
  const rows: Row[] = []
  for (const { card, crew, deck } of trialDecks()) {
    let score = 0
    let games = 0
    for (const rival of TEAMS) {
      if (rival.id === crew) continue
      for (const seed of seeds) {
        const { state } = playHeadless(
          mode,
          crew,
          rival.id,
          seed,
          undefined,
          { parity },
          undefined,
          deck,
        )
        score +=
          state.victor === 'player' ? 1 : state.victor === 'draw' ? 0.5 : 0
        games++
      }
    }
    rows.push({ card, crew, rate: score / games, games })
  }
  return rows
}

/** Spread of values around their mean, minus what sampling alone explains. */
function spreadOf(values: number[], noise: number) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance =
    values.reduce((a, v) => a + (v - mean) ** 2, 0) / (values.length - 1)
  return {
    observed: Number(Math.sqrt(variance).toFixed(3)),
    beyondNoise: Number(Math.sqrt(Math.max(0, variance - noise)).toFixed(3)),
  }
}

/**
 * Each test deck is nine founder cards plus the card under test, so a card's
 * raw win rate is mostly its crew's. Report the crews' spread and, separately,
 * each card's lift over its own crew's average: that lift is the card itself.
 */
function summary(rows: Row[]) {
  const noise =
    rows.reduce((a, r) => a + (r.rate * (1 - r.rate)) / r.games, 0) /
    rows.length
  const crewRate: Record<string, number> = {}
  for (const team of TEAMS) {
    const own = rows.filter((r) => r.crew === team.id)
    crewRate[team.id] = Number(
      (own.reduce((a, r) => a + r.rate, 0) / own.length).toFixed(3),
    )
  }
  const lift = rows.map((r) => ({ ...r, lift: r.rate - crewRate[r.crew]! }))
  const sorted = [...lift].sort((a, b) => a.lift - b.lift)
  const byKind: Record<string, number> = {}
  for (const kind of ['creature', 'spell', 'trap', 'equipment'])
    byKind[kind] = spreadOf(
      lift.filter((r) => r.card.kind === kind).map((r) => r.lift),
      noise,
    ).beyondNoise
  const label = (r: (typeof lift)[number]) =>
    r.card.name +
    ' (' +
    r.crew +
    ' ' +
    r.card.kind +
    ') ' +
    (r.lift >= 0 ? '+' : '') +
    r.lift.toFixed(2)
  const perCrew = rows.length / TEAMS.length
  return {
    cards: rows.length,
    gamesPerCard: rows[0]?.games,
    noiseFloor: Number(Math.sqrt(noise).toFixed(3)),
    crewWinRates: crewRate,
    crewSpread: spreadOf(Object.values(crewRate), noise / perCrew),
    cardLiftSpread: spreadOf(
      lift.map((r) => r.lift),
      noise,
    ),
    cardLiftBeyondNoiseByKind: byKind,
    weakestCards: sorted.slice(0, 6).map(label),
    strongestCards: sorted.slice(-6).reverse().map(label),
  }
}

const started = Date.now()
const normal = summary(run(false))
const parity = summary(run(true))
console.log(
  'SLIME_CITY_PARITY_AUDIT ' +
    JSON.stringify({ mode, seedsPerRival: perRival, normal, parity }, null, 2),
)
console.log('took ' + Math.round((Date.now() - started) / 1000) + 's')
