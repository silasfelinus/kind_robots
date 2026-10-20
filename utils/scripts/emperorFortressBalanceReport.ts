// Prints the seeded balance report (conductor emperor-of-dust t-009) as
// Markdown for conductor projects/emperor-of-dust/BALANCE-REPORT.md.
//   npx tsx utils/scripts/emperorFortressBalanceReport.ts [runsPerPolicy]
import { POLICIES, balanceReport } from '../emperorOfDust/fortress/balance'
import { ENDINGS } from '../emperorOfDust/fortress/endings'

const runs = Number(process.argv[2] ?? 40)
const report = balanceReport(runs)
const title = (id: string) => POLICIES.find((p) => p.id === id)?.title ?? id
const per = (n: number) => (n / runs).toFixed(2)
const list = (counts: Record<string, number | undefined>) =>
  Object.entries(counts)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .map(
      ([id, n]) => `${ENDINGS[id as keyof typeof ENDINGS]?.title ?? id} ${n}`,
    )
    .join(', ')

const out: string[] = [
  `${runs} seeded campaigns per policy (seeds 1–${runs}), all 50 days, played through the real Kind Robots engine.`,
  '',
  '| Policy | Hideouts | Endings | Deaths / run | Runs losing 2+ | Loans / run | Factions wiped / run | Lowest final brass |',
  '|---|---|---|---:|---:|---:|---:|---:|',
]
for (const r of report)
  out.push(
    `| ${title(r.policy)} (\`${r.policy}\`) | ${list(r.hideouts)} | ${list(r.endings)} | ${per(r.deaths)} | ${r.heavyLosses} | ${per(r.loans)} | ${per(r.wipedOut)} | ${r.brassMin} |`,
  )
console.log(out.join('\n'))
