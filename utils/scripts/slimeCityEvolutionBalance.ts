// Slime City crafted-evolution balance check: the same seeded CPU sweep run
// with and without one team's crafted evolutions, so a faction's new stages
// can be judged against the cards they replace on identical games.
// Usage: npx tsx utils/scripts/slimeCityEvolutionBalance.ts <team> [seeds] [offset]
import { TEAMS, cardById } from '../slimeCity/prototypes'
import { clashDeck } from '../slimeCity/clash'
import { CLASH_EVOLUTIONS } from '../slimeCity/clashEvolutions'
import type { CardEvolution } from '../slimeCity/evolutions/dsl'
import { playClashCpuGame } from './slimeCityClashBalanceReport'

const team = process.argv[2]
const seeds = Number(process.argv[3] ?? 40)
const offset = Number(process.argv[4] ?? 2001)
if (!team) {
  console.error('usage: slimeCityEvolutionBalance.ts <team> [seeds] [offset]')
  process.exit(1)
}
const crews = TEAMS.map((t) => t.id as string)
const mine = Object.keys(CLASH_EVOLUTIONS).filter(
  (id) => cardById(id).team === team,
)

function sweep(): Record<string, number> {
  const wins: Record<string, number> = {}
  const games: Record<string, number> = {}
  for (const a of crews)
    for (const b of crews) {
      if (a === b) continue
      for (let i = 0; i < seeds; i++) {
        const g = playClashCpuGame(a, b, offset + i)
        games[a] = (games[a] ?? 0) + 1
        games[b] = (games[b] ?? 0) + 1
        if (g.victor === 'player') wins[a] = (wins[a] ?? 0) + 1
        if (g.victor === 'enemy') wins[b] = (wins[b] ?? 0) + 1
      }
    }
  return Object.fromEntries(
    crews.map((c) => [c, ((wins[c] ?? 0) / (games[c] ?? 1)) * 100]),
  )
}

const withEvo = sweep()
const saved: Record<string, CardEvolution> = {}
for (const id of mine) {
  saved[id] = CLASH_EVOLUTIONS[id]!
  delete CLASH_EVOLUTIONS[id]
}
const without = sweep()
Object.assign(CLASH_EVOLUTIONS, saved)

const inDecks = mine.filter((id) =>
  crews.some((c) => clashDeck(c as never).includes(id)),
)
console.log(
  team +
    ': ' +
    mine.length +
    ' crafted cards, ' +
    inDecks.length +
    ' in CPU decks (' +
    inDecks.join(', ') +
    ')',
)
console.log('crew           with    without  delta')
for (const c of crews)
  console.log(
    c.padEnd(14),
    withEvo[c]!.toFixed(1).padStart(6) + '%',
    without[c]!.toFixed(1).padStart(7) + '%',
    (withEvo[c]! - without[c]! >= 0 ? '+' : '') +
      (withEvo[c]! - without[c]!).toFixed(1),
  )
