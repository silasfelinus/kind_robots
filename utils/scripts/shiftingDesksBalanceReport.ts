// Prints the seeded balance report (conductor shifting-desks t-019) as Markdown.
// Paste the output into conductor projects/shifting-desks/BALANCE-REPORT.md,
// between the generated-section markers.
//   npx tsx utils/scripts/shiftingDesksBalanceReport.ts [runsPerPolicy]
import {
  type PolicyReport,
  POLICIES,
  balanceReport,
} from '../shiftingDesks/balance'
import { DEPARTMENTS, ENDINGS } from '../shiftingDesks/rules'

const runs = Number(process.argv[2] ?? 2000)
const report = balanceReport(runs)
const rows = [...report.policies, report.random]
const title = (p: PolicyReport) =>
  POLICIES.find((x) => x.id === p.policy)?.title ?? 'Random baseline'
const pct = (n: number, d: number) => `${((100 * n) / d).toFixed(1)}%`
const per = (n: number, d: number) => (n / d).toFixed(2)
const lost = (p: PolicyReport) =>
  Object.values(p.successorDeaths).reduce((a, b) => a + b, 0)

const out: string[] = []
const table = (head: string[], body: string[][]) => {
  out.push(`| ${head.join(' | ')} |`)
  out.push(`|${head.map((_, i) => (i ? '---:' : '---')).join('|')}|`)
  for (const r of body) out.push(`| ${r.join(' | ')} |`)
  out.push('')
}

out.push(
  `${runs} seeded runs per policy (seeds \`balance-<policy>-<n>\`, job titles in rotation), played through the real Kind Robots engine.`,
  '',
  '### Survival',
  '',
)
table(
  ['Policy', 'Finished', 'Eliminated', 'Successors lost / run', 'Endings seen'],
  rows.map((p) => [
    title(p),
    pct(p.completed, p.runs),
    pct(p.eliminated, p.runs),
    per(lost(p), p.runs),
    `${Object.values(p.endings).filter((n) => n > 0).length} of ${ENDINGS.length}`,
  ]),
)

out.push('### Successors lost per run, by department', '')
table(
  ['Policy', ...DEPARTMENTS.map((d) => d.department.title)],
  rows.map((p) => [
    title(p),
    ...DEPARTMENTS.map((d) =>
      per(p.successorDeaths[d.department.id] ?? 0, p.runs),
    ),
  ]),
)

out.push('### Endings (share of runs)', '')
table(
  ['Ending', ...rows.map(title)],
  ENDINGS.map((e) => [
    e.title,
    ...rows.map((p) => (p.endings[e.id] ? pct(p.endings[e.id]!, p.runs) : '·')),
  ]),
)

const hitKeys = [...new Set(rows.flatMap((p) => Object.keys(p.meterHits)))]
  .filter((k) => rows.some((p) => (p.meterHits[k] ?? 0) / p.runs >= 0.05))
  .sort()
out.push('### Meter limits hit per run', '')
table(
  ['Policy', ...hitKeys],
  rows.map((p) => [
    title(p),
    ...hitKeys.map((k) => per(p.meterHits[k] ?? 0, p.runs)),
  ]),
)

out.push('### Top causes of termination', '')
table(
  ['Policy', 'Causes (per run)'],
  rows.map((p) => [
    title(p),
    Object.entries(p.deathCauses)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([cause, n]) => `${cause} ${per(n, p.runs)}`)
      .join('; '),
  ]),
)

out.push(
  '### Choice health',
  '',
  `- Dominant choices (every temperament makes the same call): ${
    report.dominantChoices.length
      ? report.dominantChoices
          .map((c) => `\`${c.card}/${c.choice}\``)
          .join(', ')
      : 'none'
  }.`,
  `- Choices no bot ever picked: ${
    report.unpickedChoices.length
      ? report.unpickedChoices
          .map((c) => `\`${c.card}/${c.choice}\``)
          .join(', ')
      : 'none'
  }.`,
  `- Rarest choices (picks across every policy): ${rarest()}.`,
)
console.log(out.join('\n'))

function rarest(): string {
  const totals: Record<string, number> = {}
  for (const p of rows) {
    for (const [card, picks] of Object.entries(p.picks)) {
      for (const [choice, n] of Object.entries(picks)) {
        totals[`${card}/${choice}`] = (totals[`${card}/${choice}`] ?? 0) + n
      }
    }
  }
  return Object.entries(totals)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 5)
    .map(([id, n]) => `\`${id}\` ${n}`)
    .join(', ')
}
