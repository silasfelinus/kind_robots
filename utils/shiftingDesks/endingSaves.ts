// Naturally reached saves for every ending (conductor shifting-desks t-026).
// The balance policies play seeded runs through the real engine until each
// ending has been reached, preferring the run whose save carries the most
// epilogue variant lines. The browser contract loads these saves exactly as a
// player's browser would, so the Personnel File is exercised with real state
// rather than hand-built fixtures.
import {
  POLICIES,
  emptyReport,
  playRun,
  policyPicker,
  randomPicker,
} from './balance'
import {
  type Ending,
  type RunState,
  ENDINGS,
  JOB_TITLES,
  endingFor,
  endingLines,
} from './rules'

export type EndingSave = {
  ending: string
  kind: Ending['kind']
  // Provenance: replaying this seed, job and policy reproduces `run` exactly.
  policy: string
  seed: string
  jobId: string
  epilogueTitle: string
  lines: string[]
  run: RunState
}

const PICKERS = [
  ...POLICIES.map((p) => ({ id: p.id, pick: policyPicker(p) })),
  { id: 'random', pick: randomPicker },
]

export function naturalEndingSaves(runsPerPolicy = 400): EndingSave[] {
  const best = new Map<string, EndingSave>()
  for (const { id, pick } of PICKERS) {
    const report = emptyReport(id, runsPerPolicy)
    for (let i = 0; i < runsPerPolicy; i++) {
      const seed = `ending-save-${id}-${i}`
      const jobId = JOB_TITLES[i % JOB_TITLES.length]!.id
      const run = playRun(seed, jobId, pick, report)
      const ending = endingFor(run)
      if (!ending) continue
      const lines = endingLines(run, ending)
      const held = best.get(ending.id)
      if (held && held.lines.length >= lines.length) continue
      best.set(ending.id, {
        ending: ending.id,
        kind: ending.kind,
        policy: id,
        seed,
        jobId,
        epilogueTitle: ending.epilogue.title,
        lines,
        run,
      })
    }
  }
  return ENDINGS.flatMap((e) => {
    const save = best.get(e.id)
    return save ? [save] : []
  })
}
