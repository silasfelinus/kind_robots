// Headless Slime City format comparison (conductor slime-city t-016, t-003).
//   npx tsx utils/scripts/slimeCityPlaytest.ts [seedsPerPairing] [--json]
//     [--rules=monster,overtime,...]  play with rule variants switched on
//     [--variants]                    compare every variant against the default
// Runs CPU-versus-CPU for every ordered pairing of the six crews in all three
// formats and prints Markdown tables (or raw JSON). Deterministic: the same
// seed count always prints the same numbers.
import {
  MODES,
  RULE_VARIANTS,
  TEAMS,
  type ModeId,
  type RuleVariants,
} from '../slimeCity/prototypes'
import { runTournament, type MatchMetrics } from '../slimeCity/playtest'

const args = process.argv.slice(2)
const seedCount = Number(args.find((a) => /^\d+$/.test(a)) ?? 20)
const seeds = Array.from({ length: seedCount }, (_, i) => 1000 + i * 7919)
const ruleArg = args.find((a) => a.startsWith('--rules='))
const rules: Partial<RuleVariants> = {}
for (const id of ruleArg ? ruleArg.slice(8).split(',') : []) {
  if (!RULE_VARIANTS.some((v) => v.id === id))
    throw new Error('Unknown rule variant: ' + id)
  rules[id as keyof RuleVariants] = true
}

const pct = (n: number, d: number) =>
  d ? ((100 * n) / d).toFixed(1) + '%' : '–'
const avg = (xs: number[]) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0
const quantile = (xs: number[], q: number) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))]! : 0
}

/** Crew win shares (wins + half of draws) for one batch of matches. */
function crewShares(ms: MatchMetrics[]): number[] {
  return TEAMS.map((team) => {
    const mine = ms.filter(
      (x) => x.playerTeam === team.id || x.enemyTeam === team.id,
    )
    const share = mine.reduce((a, x) => {
      const side = x.playerTeam === team.id ? 'player' : 'enemy'
      return a + (x.victor === side ? 1 : x.victor === 'draw' ? 0.5 : 0)
    }, 0)
    return mine.length ? (100 * share) / mine.length : 0
  })
}

if (args.includes('--variants')) {
  // One row per (format, variant): the default first, then each variant
  // alone, then every variant that applies to the format at once.
  const out: string[] = [
    `Seeds per ordered pairing: ${seedCount} · ${30 * seedCount} matches per row`,
    '',
    '| Format | Rules | Draws | Hit the limit | First side | Second side | Mean length | Decided by | Crew spread |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ]
  for (const m of MODES) {
    const fits = RULE_VARIANTS.filter((v) => v.modes.includes(m.id))
    const configs: [string, Partial<RuleVariants>][] = [
      ['default', {}],
      ...fits.map((v): [string, Partial<RuleVariants>] => [
        v.label.toLowerCase(),
        { [v.id]: true },
      ]),
      [
        'all of the above',
        Object.fromEntries(
          fits.map((v) => [v.id, true]),
        ) as Partial<RuleVariants>,
      ],
    ]
    for (const [label, r] of configs) {
      const ms = runTournament(m.id, seeds, r)
      const n = ms.length
      const paths = (['flag', 'score', 'rout', 'monster', 'time'] as const)
        .map(
          (p) =>
            [
              p,
              ms.filter((x) => x.winPath === p && x.victor !== 'draw').length,
            ] as const,
        )
        .filter(([, c]) => c > 0)
        .map(([p, c]) => p + ' ' + pct(c, n))
        .join(', ')
      const shares = crewShares(ms)
      out.push(
        `| ${m.title} | ${label} | ${pct(ms.filter((x) => x.victor === 'draw').length, n)} | ` +
          `${pct(ms.filter((x) => x.winPath === 'time' || x.overtime).length, n)} | ` +
          `${pct(ms.filter((x) => x.victor === 'player').length, n)} | ` +
          `${pct(ms.filter((x) => x.victor === 'enemy').length, n)} | ` +
          `${avg(ms.map((x) => x.rounds)).toFixed(1)} | ${paths} | ` +
          `${Math.min(...shares).toFixed(0)}–${Math.max(...shares).toFixed(0)}% |`,
      )
    }
  }
  console.log(out.join('\n'))
  process.exit(0)
}

const results: Record<ModeId, MatchMetrics[]> = {
  blackout: runTournament('blackout', seeds, rules),
  gridiron: runTournament('gridiron', seeds, rules),
  bloodrush: runTournament('bloodrush', seeds, rules),
}

if (args.includes('--json')) {
  console.log(JSON.stringify(results))
  process.exit(0)
}

const title = (id: ModeId) => MODES.find((m) => m.id === id)!.title
const lines: string[] = []
lines.push(
  `Seeds per ordered pairing: ${seedCount} · matches per format: ${results.blackout.length}` +
    (ruleArg ? ' · rules: ' + ruleArg.slice(8) : ' · default rules'),
  '',
  '| Metric | ' + MODES.map((m) => m.title).join(' | ') + ' |',
  '| --- | ' + MODES.map(() => '---').join(' | ') + ' |',
)
const row = (label: string, f: (ms: MatchMetrics[]) => string) =>
  lines.push(
    `| ${label} | ` + MODES.map((m) => f(results[m.id])).join(' | ') + ' |',
  )
row('Mean length (rounds/ticks)', (ms) =>
  avg(ms.map((m) => m.rounds)).toFixed(1),
)
row(
  'Median / p90 length',
  (ms) =>
    quantile(
      ms.map((m) => m.rounds),
      0.5,
    ) +
    ' / ' +
    quantile(
      ms.map((m) => m.rounds),
      0.9,
    ),
)
row('Decided by round/tick 4', (ms) =>
  pct(ms.filter((m) => m.victor !== 'draw' && m.rounds <= 4).length, ms.length),
)
row('Hit the round/tick limit', (ms) =>
  pct(ms.filter((m) => m.winPath === 'time').length, ms.length),
)
row('Draws', (ms) =>
  pct(ms.filter((m) => m.victor === 'draw').length, ms.length),
)
row('First-initiative side wins', (ms) =>
  pct(ms.filter((m) => m.victor === 'player').length, ms.length),
)
row('Second side wins', (ms) =>
  pct(ms.filter((m) => m.victor === 'enemy').length, ms.length),
)
for (const path of ['flag', 'score', 'rout', 'monster', 'time'] as const)
  row(`Decided by ${path}`, (ms) =>
    pct(
      ms.filter((m) => m.winPath === path && m.victor !== 'draw').length,
      ms.length,
    ),
  )
row('First contact (mean round)', (ms) =>
  avg(
    ms.filter((m) => m.firstContact !== null).map((m) => m.firstContact!),
  ).toFixed(1),
)
row('Dead rounds (nothing changed)', (ms) =>
  pct(
    ms.reduce((a, m) => a + m.deadRounds, 0),
    ms.reduce((a, m) => a + m.rounds, 0),
  ),
)
row('Matches with a 3+ dead-round streak', (ms) =>
  pct(ms.filter((m) => m.longestDeadStreak >= 3).length, ms.length),
)
row('Comeback wins', (ms) =>
  pct(ms.filter((m) => m.comeback).length, ms.length),
)
row('Lead changes per match', (ms) =>
  avg(ms.map((m) => m.leadChanges)).toFixed(2),
)
row('Lane clogs per match', (ms) => avg(ms.map((m) => m.clogs)).toFixed(2))
row('Sidesteps per match', (ms) => avg(ms.map((m) => m.sidesteps)).toFixed(1))
row('Knockouts per match', (ms) =>
  avg(ms.map((m) => m.knockouts.player + m.knockouts.enemy)).toFixed(1),
)
row('Flag drops per match', (ms) => avg(ms.map((m) => m.flagDrops)).toFixed(2))
for (const kind of ['creature', 'spell', 'trap', 'equipment'] as const)
  row(`${kind} plays per side per match`, (ms) =>
    avg(
      ms.map((m) => (m.plays.player[kind] + m.plays.enemy[kind]) / 2),
    ).toFixed(1),
  )
row('Traps sprung per match', (ms) =>
  avg(ms.map((m) => m.trapsSprung)).toFixed(1),
)
row('Explosions / shoves / roots per match', (ms) =>
  [
    avg(ms.map((m) => m.explosions)).toFixed(1),
    avg(ms.map((m) => m.shoves)).toFixed(1),
    avg(ms.map((m) => m.roots)).toFixed(1),
  ].join(' / '),
)
row('Mana debt charged per match', (ms) =>
  avg(ms.map((m) => m.debt)).toFixed(1),
)

lines.push(
  '',
  'Crew win share (wins + half of draws, over every match the crew played, either side):',
  '',
  '| Crew | ' + MODES.map((m) => m.title).join(' | ') + ' |',
  '| --- | ' + MODES.map(() => '---').join(' | ') + ' |',
)
for (const team of TEAMS) {
  lines.push(
    `| ${team.name} | ` +
      MODES.map((m) => {
        const ms = results[m.id].filter(
          (x) => x.playerTeam === team.id || x.enemyTeam === team.id,
        )
        const share = ms.reduce((a, x) => {
          const side = x.playerTeam === team.id ? 'player' : 'enemy'
          return a + (x.victor === side ? 1 : x.victor === 'draw' ? 0.5 : 0)
        }, 0)
        return pct(share, ms.length)
      }).join(' | ') +
      ' |',
  )
}
for (const m of MODES) {
  const ms = results[m.id]
  lines.push(
    '',
    `${title(m.id)} head-to-head (row crew's win share vs column crew, both sides):`,
    '',
    '| vs | ' + TEAMS.map((t) => t.id).join(' | ') + ' |',
    '| --- | ' + TEAMS.map(() => '---').join(' | ') + ' |',
  )
  for (const a of TEAMS) {
    lines.push(
      `| ${a.id} | ` +
        TEAMS.map((b) => {
          if (a.id === b.id) return '–'
          const games = ms.filter(
            (x) =>
              (x.playerTeam === a.id && x.enemyTeam === b.id) ||
              (x.playerTeam === b.id && x.enemyTeam === a.id),
          )
          const share = games.reduce((acc, x) => {
            const side = x.playerTeam === a.id ? 'player' : 'enemy'
            return acc + (x.victor === side ? 1 : x.victor === 'draw' ? 0.5 : 0)
          }, 0)
          return pct(share, games.length)
        }).join(' | ') +
        ' |',
    )
  }
}
console.log(lines.join('\n'))
