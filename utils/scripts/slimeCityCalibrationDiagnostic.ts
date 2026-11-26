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
type OpeningBudget = [number, number]
type Candidate = {
  base: {
    ironjaw: TierBudget
    riot: TierBudget
    exchange: TierBudget
    undertow?: TierBudget
  }
  opening: Partial<
    Record<'ironjaw' | 'riot' | 'catgirls' | 'undertow' | 'exchange', OpeningBudget>
  >
}
type Result = {
  rates: Record<string, number>
  first: number
  limit: number
  worst: number
  worstPairings: { pairing: string; rate: number }[]
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
        'console.log(JSON.stringify({ rates, first: s.firstSeatWins / s.games, limit: s.roundLimit / s.games, worst: worstClashPairings(s)[0]!.rate, worstPairings: worstClashPairings(s).slice(0, 3).map(({ pairing, rate }) => ({ pairing, rate })), spread: Math.max(...Object.values(rates)) - Math.min(...Object.values(rates)) }))',
      ].join('\n'),
    )
    function run(candidate: Candidate, seeds: number, offset: number): Result {
      writeFileSync(
        engine,
        source.replace(
          table,
          'const CLASH_V2_CREW_ADJUSTMENT: CrewLifeTuning = ' +
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

    // Earlier sweeps showed level-two/three Ironjaw adjustments do not
    // materially change these matchups. Screen opening play-cost bands and
    // keep the measured aggregate baseline for every candidate.
    const base: Candidate['base'] = {
      ironjaw: [-0.5, 0, 0],
      riot: [0, 0.5, 0.5],
      exchange: [-0.5, -0.5, -0.5],
    }
    const iron: OpeningBudget[] = [
      [0, 0],
      [0, 0.5],
      [0.5, 0],
    ]
    const riot: OpeningBudget[] = [
      [0, 0],
      [0, 0.5],
      [0.5, 0],
    ]
    const candidates: Candidate[] = []
    for (const a of iron)
      for (const b of riot)
        candidates.push({ base, opening: { ironjaw: a, riot: b } })
    const screened = candidates
      .map((candidate) => ({ candidate, result: run(candidate, 40, 700) }))
      .sort((a, b) => penalty(a.result) - penalty(b.result))
    console.log('CLASH_CALIBRATION_SCREEN', JSON.stringify(screened))

    // Evaluate independent seeds for the strongest base configurations,
    // then refine the remaining weak opening bands on the best two.
    const best = screened.slice(0, 3).map(({ candidate, result }) => ({
      candidate,
      result,
      holdout: run(candidate, 40, 1400),
    }))
    best.sort(
      (a, b) =>
        penalty(a.result) + penalty(a.holdout) -
        penalty(b.result) - penalty(b.holdout),
    )
    const variants: Candidate[] = []
    for (const { candidate } of best.slice(0, 2)) {
      for (const catgirls of [[0, 0.5], [0.5, 0]] as OpeningBudget[])
        variants.push({
          ...candidate,
          opening: { ...candidate.opening, catgirls },
        })
      for (const undertow of [[0, -0.5], [-0.5, 0]] as OpeningBudget[])
        variants.push({
          ...candidate,
          opening: { ...candidate.opening, undertow },
        })
      variants.push({
        ...candidate,
        opening: { ...candidate.opening, exchange: [0, -0.5] },
      })
    }
    const refined = variants
      .map((candidate) => ({ candidate, result: run(candidate, 40, 700) }))
      .sort((a, b) => penalty(a.result) - penalty(b.result))
    console.log('CLASH_CALIBRATION_REFINED', JSON.stringify(refined))
    const verified = [
      ...best,
      ...refined.slice(0, 3).map(({ candidate, result }) => ({
        candidate,
        result,
        holdout: run(candidate, 40, 1400),
      })),
    ].sort(
      (a, b) =>
        penalty(a.result) + penalty(a.holdout) -
        penalty(b.result) - penalty(b.holdout),
    )
    console.log('CLASH_CALIBRATION_FULL', JSON.stringify(verified))
  } catch (error) {
    console.warn('CLASH_CALIBRATION_UNAVAILABLE', error)
  } finally {
    if (temp) rmSync(temp, { recursive: true, force: true })
  }
}
