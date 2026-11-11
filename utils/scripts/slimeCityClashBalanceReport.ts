// Slime City CLASH balance sweep: CPU vs CPU on every crew pairing, both seats.
// Usage: npx tsx utils/scripts/slimeCityClashBalanceReport.ts [seedsPerPairing]
import { CARDS, TEAMS, cardById, type Side } from '../slimeCity/prototypes'
import {
  CLASH_ROUND_LIMIT,
  applyClashCommand,
  chooseClashCpu,
  clashBalance,
  clashDeck,
  createClash,
  type ClashState,
} from '../slimeCity/clash'

export interface ClashSweep {
  games: number
  firstSeatWins: number
  draws: number
  roundLimit: number
  averageRounds: number
  crews: Record<string, { games: number; wins: number }>
  /** Average cards per crew per game that reached level 2 and level 3. */
  leveled: { two: number; three: number }
  cards: Record<string, { played: number; wins: number }>
}

export function playClashCpuGame(
  player: string,
  enemy: string,
  seed: number,
): ClashState {
  let s = createClash(player as never, enemy as never, seed)
  for (let step = 0; !s.victor && step < 600; step++)
    s = applyClashCommand(s, chooseClashCpu(s, s.active))
  return s
}

export function sweepClash(seeds: number, offset = 1): ClashSweep {
  const out: ClashSweep = {
    games: 0,
    firstSeatWins: 0,
    draws: 0,
    roundLimit: 0,
    averageRounds: 0,
    crews: {},
    cards: {},
    leveled: { two: 0, three: 0 },
  }
  let rounds = 0
  for (const a of TEAMS)
    for (const b of TEAMS) {
      if (a.id === b.id) continue
      for (let seed = offset; seed < offset + seeds; seed++) {
        const s = playClashCpuGame(a.id, b.id, seed)
        out.games++
        rounds += s.round
        if (s.victor === 'player') out.firstSeatWins++
        if (s.victor === 'draw') out.draws++
        if (s.round >= CLASH_ROUND_LIMIT) out.roundLimit++
        for (const side of ['player', 'enemy'] as Side[]) {
          for (const lv of Object.values(s.levels[side])) {
            if (lv >= 2) out.leveled.two++
            if (lv >= 3) out.leveled.three++
          }
          const crew = (out.crews[s.teams[side]] ??= { games: 0, wins: 0 })
          crew.games++
          if (s.victor === side) crew.wins++
          const played = new Set(
            s.commands
              .filter((c) => c.t === 'play' && c.side === side)
              .map((c) => (c.t === 'play' ? c.card : '')),
          )
          for (const id of played) {
            const card = (out.cards[id] ??= { played: 0, wins: 0 })
            card.played++
            if (s.victor === side) card.wins++
          }
        }
      }
    }
  out.averageRounds = rounds / out.games
  out.leveled.two /= out.games * 2
  out.leveled.three /= out.games * 2
  return out
}

// Counterfactual fighters-first pilot: compare the shipped Catgirls starter
// against its exact pre-pilot starter under identical seeds and seats.
// This is a diagnostic, not a balance gate: report both win and card-use rates.
export function compareCatgirlsStarter(seeds = 20, offset = 9000) {
  const current = clashDeck('catgirls')
  // Reconstruct the original from commit 81a7e2b9's three-slot diff.
  // The prior list already contained Patent Saboteur and Bicycle Clinic:
  // replacing only Organ Donor with Laser would invent a deck that never shipped.
  const original = current.map((id) =>
    id === 's3-catgirls-patent-saboteur'
      ? 'laser'
      : id === 's3-catgirls-bicycle-clinic'
        ? 's3-catgirls-patent-saboteur'
        : id === 's2-catgirls-backstreet-organ-donor'
          ? 's3-catgirls-bicycle-clinic'
          : id,
  )
  const changed = current.filter((id, index) => id !== original[index])
  if (
    current.length !== 20 ||
    original.length !== 20 ||
    new Set(original).size !== 20 ||
    changed.length !== 3 ||
    !original.includes('laser') ||
    original.includes('s2-catgirls-backstreet-organ-donor')
  )
    throw new Error(
      'Catgirls counterfactual no longer matches the pre-pilot deck',
    )
  const results = {
    current: { wins: 0, games: 0, two: 0, three: 0, played: 0 },
    original: { wins: 0, games: 0, two: 0, three: 0, played: 0 },
  }
  for (const opponent of TEAMS) {
    if (opponent.id === 'catgirls') continue
    for (let seed = offset; seed < offset + seeds; seed++)
      for (const seat of ['player', 'enemy'] as Side[])
        for (const version of ['current', 'original'] as const) {
          const catgirlsFirst = seat === 'player'
          let state = createClash(
            catgirlsFirst ? 'catgirls' : opponent.id,
            catgirlsFirst ? opponent.id : 'catgirls',
            seed,
            { decks: { [seat]: version === 'current' ? current : original } },
          )
          for (let step = 0; !state.victor && step < 600; step++)
            state = applyClashCommand(
              state,
              chooseClashCpu(state, state.active),
            )
          if (!state.victor)
            throw new Error('Catgirls matchup did not terminate')
          const result = results[version]
          result.games++
          if (state.victor === seat) result.wins++
          const levels = Object.values(state.levels[seat])
          result.two += levels.filter((level) => level >= 2).length
          result.three += levels.filter((level) => level >= 3).length
          result.played += state.commands.filter(
            (command) => command.t === 'play' && command.side === seat,
          ).length
        }
  }
  return results
}

const pct = (n: number, d: number): string =>
  d ? ((100 * n) / d).toFixed(1) + '%' : '-'

if (process.argv[1]?.includes('slimeCityClashBalanceReport')) {
  if (process.argv[2] === '--catgirls-pilot') {
    const results = compareCatgirlsStarter(Number(process.argv[3] ?? 20))
    console.table(
      Object.entries(results).map(([version, r]) => ({
        version,
        games: r.games,
        winRate: pct(r.wins, r.games),
        level2PerGame: (r.two / r.games).toFixed(2),
        level3PerGame: (r.three / r.games).toFixed(2),
        playsPerGame: (r.played / r.games).toFixed(2),
      })),
    )
    process.exit(0)
  }
  const seeds = Number(process.argv[2] ?? 20)
  const r = sweepClash(seeds, Number(process.argv[3] ?? 1))
  console.log(
    'games ' +
      r.games +
      ' · first seat wins ' +
      pct(r.firstSeatWins, r.games - r.draws) +
      ' · draws ' +
      pct(r.draws, r.games) +
      ' · round-limit ' +
      pct(r.roundLimit, r.games) +
      ' · avg rounds ' +
      r.averageRounds.toFixed(1) +
      ' · cards leveled per crew: ' +
      r.leveled.two.toFixed(1) +
      ' to L2, ' +
      r.leveled.three.toFixed(1) +
      ' to L3',
  )
  for (const [id, c] of Object.entries(r.crews))
    console.log('  ' + id.padEnd(14) + pct(c.wins, c.games))
  const rows = Object.entries(r.cards)
    .filter(([, c]) => c.played >= 20)
    .map(([id, c]) => ({ id, rate: c.wins / c.played, played: c.played }))
    .sort((x, y) => y.rate - x.rate)
  const show = (x: { id: string; rate: number; played: number }): string => {
    const card = cardById(x.id)
    const b = clashBalance(card)
    return (
      '  ' +
      (x.rate * 100).toFixed(0).padStart(3) +
      '% ' +
      String(x.played).padStart(4) +
      'x ' +
      card.team.padEnd(12) +
      card.kind.padEnd(10) +
      b.plays +
      'p ' +
      (card.kind === 'creature'
        ? b.attack + '/' + b.hp + (b.armor ? '+' + b.armor : '')
        : 'pow ' + b.power
      ).padEnd(7) +
      (card.effect ?? (card.keywords ?? []).join('+')).padEnd(18) +
      card.name
    )
  }
  console.log('top cards (win rate when played):')
  rows.slice(0, 12).forEach((x) => console.log(show(x)))
  console.log('bottom cards:')
  rows.slice(-12).forEach((x) => console.log(show(x)))
  console.log(
    'deck cards never played: ' +
      CARDS.filter((c) => !r.cards[c.id]).length +
      ' of ' +
      CARDS.length +
      ' catalog cards (most are outside the default 20-card decks)',
  )
}
