import { adversarialReport } from '../shiftingDesks/adversarial'

const runs = Number(process.argv[2] ?? 200)
const report = adversarialReport(runs)
const pct = (a: number, b: number) => ((a / b) * 100).toFixed(1) + '%'
const ratio = (a: number, b: number) => (a / b).toFixed(2)
const out: string[] = [
  '# Shifting Desks adversarial playtest',
  '',
  'Generated from the real Kind Robots rules and reducer. ' +
    runs +
    ' deterministic seeds per strategy, all job titles in rotation. ' +
    'No LLM gameplay, no database writes. Rerun with:',
  '',
  '    npx tsx utils/scripts/shiftingDesksAdversarialReport.ts ' + runs,
  '',
  '## Outcome by adversarial strategy',
  '',
  '| Strategy | Finished | Eliminated | Stalled | Deaths/run | Decisions/run | Endings |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
]

for (const a of report.attacks)
  out.push(
    '| ' +
      a.id +
      ' | ' +
      pct(a.completed, a.runs) +
      ' | ' +
      pct(a.eliminated, a.runs) +
      ' | ' +
      a.stalled +
      ' | ' +
      ratio(a.terminations, a.runs) +
      ' | ' +
      ratio(a.decisions, a.runs) +
      ' | ' +
      Object.keys(a.endings).length +
      ' |',
  )

out.push(
  '',
  '## Floor reach',
  '',
  '| Strategy | ' +
    Object.keys(report.attacks[0]!.departmentVisits).join(' | ') +
    ' |',
  '| --- | ' +
    Object.keys(report.attacks[0]!.departmentVisits)
      .map(() => '---:')
      .join(' | ') +
    ' |',
)
for (const a of report.attacks) {
  const floors = Object.keys(report.attacks[0]!.departmentVisits)
  out.push(
    '| ' +
      a.id +
      ' | ' +
      floors.map((f) => pct(a.departmentVisits[f] ?? 0, a.runs)).join(' | ') +
      ' |',
  )
}
out.push('', '## Reproducible engine findings', '')
if (!report.findings.length)
  out.push(
    'No failed invariants in this run. This is not a browser or human fun verdict.',
  )
for (const f of report.findings)
  out.push(
    '- **' +
      f.kind +
      '** [' +
      f.attack +
      '] seed=' +
      f.seed +
      ' step=' +
      f.step +
      ' department=' +
      f.department +
      ' card=' +
      f.card +
      ': ' +
      f.detail +
      '; trace=' +
      f.trace.join(' > '),
  )

out.push(
  '',
  '## Experience and coverage warnings',
  '',
  '- Encounter cards never drawn: ' +
    report.neverSeenCards.length +
    (report.neverSeenCards.length
      ? ' (' + report.neverSeenCards.join(', ') + ')'
      : ''),
  '- Choice routes never selected: ' +
    report.neverPickedChoices.length +
    (report.neverPickedChoices.length
      ? ' (' + report.neverPickedChoices.join(', ') + ')'
      : ''),
  '- Ending IDs unseen: ' +
    report.unseenEndings.length +
    (report.unseenEndings.length
      ? ' (' + report.unseenEndings.join(', ') + ')'
      : ''),
  '',
  '## Recommendations from these measurements',
  '',
)
const rows = report.attacks
const mean = (fn: (a: (typeof rows)[number]) => number) =>
  rows.reduce((n, a) => n + fn(a), 0) / rows.length
const completion = mean((a) => a.completed / a.runs)
const meanLoss = mean((a) => a.terminations / a.runs)
if (report.findings.length)
  out.push(
    '1. Fix engine invariants first. Replay the listed seed and action trace before changing narrative balance.',
  )
if (completion < 0.4)
  out.push(
    '- Improve early-floor survival and signpost scarce-resource decisions: fewer than 40% finish across strategies.',
  )
else if (completion > 0.9)
  out.push(
    '- Raise trade-off pressure without forcing failure: more than 90% finish across strategies.',
  )
else
  out.push(
    '- Keep the present survival baseline while comparing different choices and success/failure prose.',
  )
if (meanLoss > 4)
  out.push(
    '- Give replacements richer callbacks or a more visible cost: mean Successor losses exceed four per run.',
  )
if (report.neverSeenCards.length || report.neverPickedChoices.length)
  out.push(
    '- Audit undrawn and unpicked content: distinguish rare seeded content from gated options whose setup rarely occurs.',
  )
if (report.unseenEndings.length)
  out.push(
    '- Target the missing endings with directed flag-seeking seeds and human-written playthroughs before treating them as unreachable.',
  )
out.push(
  '- Follow this mechanical harness with browser viewport/reload testing and subjective comedy/agency playtests; seeded bots cannot judge humor or whether a choice feels earned.',
)
console.log(out.join('\n'))
