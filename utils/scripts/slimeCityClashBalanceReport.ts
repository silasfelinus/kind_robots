// Slime City CLASH balance sweep: CPU vs CPU on every crew pairing, both seats.
// Usage: npx tsx utils/scripts/slimeCityClashBalanceReport.ts [seedsPerPairing]
import { CARDS, TEAMS, cardById, type Side } from '../slimeCity/prototypes'
import {
  CLASH_ROUND_LIMIT,
  applyClashCommand,
  chooseClashCpu,
  clashBalance,
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

const pct = (n: number, d: number): string =>
  d ? ((100 * n) / d).toFixed(1) + '%' : '-'

if (process.argv[1]?.includes('slimeCityClashBalanceReport')) {
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
