// Test-only calibration. Each candidate runs the real CPU sweep in its own
// temporary engine copy. Never modify the working tree or acceptance gates.
import { spawnSync } from 'node:child_process'
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'

type TierBudget = [number, number, number]
type Candidate = {
  ironjaw: TierBudget
  riot: TierBudget
  exchange: TierBudget
}
type Result = {
  rates: Record<string, number>
  first: number
  limit: number
  worst: number
  spread: number
}

function penalty(r: Result): number {
  return (
    Object.values(r.rates).reduce(
      (sum, x) => sum + Math.max(0, 0.421 - x, x - 0.579),
      0,
    ) +
    Math.max(0, r.spread - 0.12) +
    Math.max(0, 0.301 - r.worst) +
    Math.max(0, 0.401 - r.first, r.first - 0.619) +
    Math.max(0, r.limit - 0.099)
  )
}

export function reportCalibrationCandidates(): void {
  let temp: string | undefined
  try {
    temp = mkdtempSync(join(process.cwd(), '.slime-calibration-'))
    const copy = join(temp, 'slimeCity')
    const scripts = join(temp, 'scripts')
    cpSync('utils/slimeCity', copy, { recursive: true })
    mkdirSync(scripts)
    cpSync(
      'utils/scripts/slimeCityClashBalanceReport.ts',
      join(scripts, 'slimeCityClashBalanceReport.ts'),
    )
    const engine = join(copy, 'clash.ts')
    const source = readFileSync(engine, 'utf8')
    const table = /const CLASH_V2_CREW_ADJUSTMENT:[\s\S]*?\n\}/
    if (!table.test(source)) throw new Error('Calibration table not found')
    const runner = join(scripts, 'candidate.ts')
    writeFileSync(
      runner,
      [
        "import { sweepClash, worstClashPairings } from './slimeCityClashBalanceReport'",
        'const s = sweepClash(Number(process.argv[2]), Number(process.argv[3]))',
        'const rates = Object.fromEntries(Object.entries(s.crews).map(([id, r]) => [id, r.wins / r.games]))',
        'console.log(JSON.stringify({ rates, first: s.firstSeatWins / s.games, limit: s.roundLimit / s.games, worst: worstClashPairings(s)[0]!.rate, spread: Math.max(...Object.values(rates)) - Math.min(...Object.values(rates)) }))',
      ].join('\n'),
    )
    function run(candidate: Candidate, seeds: number, offset: number): Result {
      writeFileSync(
        engine,
        source.replace(
          table,
          'const CLASH_V2_CREW_ADJUSTMENT: Partial<Record<TeamId, [number, number, number]>> = ' +
            JSON.stringify(candidate),
        ),
      )
      const child = spawnSync(
        process.execPath,
        ['--import', 'tsx', runner, String(seeds), String(offset)],
        { encoding: 'utf8', timeout: 45_000 },
      )
      if (child.status !== 0)
        throw new Error(child.stderr || child.error?.message || 'Sweep failed')
      const line = child.stdout.trim().split('\n').at(-1)
      return JSON.parse(line || '{}') as Result
    }

    const iron: TierBudget[] = [
      [0, -0.5, -0.5],
      [-0.5, 0, 0],
      [0, -0.5, 0],
      [0, 0, 0],
    ]
    const riot: TierBudget[] = [
      [0, 0.5, 0],
      [0, 0.5, 0.5],
      [0.5, 0, 0],
      [0, 0, 0.5],
    ]
    const candidates: Candidate[] = []
    for (const a of iron)
      for (const b of riot)
        candidates.push({
          ironjaw: a,
          riot: b,
          exchange: [-0.5, -0.5, -0.5],
        })
    const screened = candidates
      .map((candidate) => ({
        candidate,
        result: run(candidate, 12, 700),
      }))
      .sort((a, b) => penalty(a.result) - penalty(b.result))
    console.log('CLASH_CALIBRATION_SCREEN', JSON.stringify(screened))
    const verified = screened.slice(0, 4).map(({ candidate }) => {
      const result = run(candidate, 40, 700)
      const holdout = run(candidate, 40, 1400)
      return { candidate, result, holdout, penalty: penalty(result) }
    })
    console.log('CLASH_CALIBRATION_FULL', JSON.stringify(verified))
  } catch (error) {
    console.warn('CLASH_CALIBRATION_UNAVAILABLE', error)
  } finally {
    if (temp) rmSync(temp, { recursive: true, force: true })
  }
}
