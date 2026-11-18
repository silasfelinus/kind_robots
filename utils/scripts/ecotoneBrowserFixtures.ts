/**
 * Real engine-reached localStorage fixtures for the mounted Ecotone viewport
 * audit (auditEcotoneViewports.browser.mjs, weird-humboldt/t-016). Nothing
 * here is hand-written state: every run is played through the engine with
 * seeded choices, and the full ledger is the set of endings those plays earn.
 *
 *   npx tsx utils/scripts/ecotoneBrowserFixtures.ts > fixtures.json
 */
import { ENDING_IDS, type LensId } from '../ecotone/content'
import {
  advance,
  chooseBeat,
  chooseCrossroads,
  chooseEvent,
  chooseFork,
  createRun,
  findCard,
  type RunState,
} from '../ecotone/engine'
import { contextualOpeningChoices } from '../ecotone/sceneOffers'
import { openingLensChoices } from '../ecotone/openingLensChoices'
import { EVENTS } from '../ecotone/story'
import { addScrapbookPage, scrapbookPage } from '../ecotone/scrapbook'

type Plan = {
  seed: number
  event: string
  lens?: LensId
  wild?: boolean
  alone?: boolean
}

function rng(seed: number) {
  let state = seed * 2654435761
  return (n: number) => {
    state = (Math.imul(state ^ (state >>> 15), 2246822519) + 0x6d2b79f5) >>> 0
    return state % n
  }
}

/** Plays a run; stops early when `until` says so (for a mid-run save). */
function play(plan: Plan, until?: (state: RunState) => boolean): RunState {
  const next = rng(plan.seed)
  let state = advance(
    chooseEvent(
      createRun(plan.seed, 'reporter'),
      plan.event as Exclude<RunState['event'], null>,
    ),
  )
  for (let turn = 0; state.phase !== 'end'; turn++) {
    if (turn > 160) throw new Error(`seed ${plan.seed} stalled`)
    if (until?.(state)) return state
    if (state.pending) {
      state = advance(state)
      continue
    }
    if (state.phase === 'fork') {
      const wild = plan.wild
        ? state.offered.find((id) =>
            findCard(id)?.choices.some((choice) => choice.wild),
          )
        : undefined
      state = chooseFork(
        state,
        wild ?? state.offered[next(state.offered.length)]!,
      )
      continue
    }
    if (state.phase === 'crossroads') {
      state = chooseCrossroads(
        state,
        plan.wild || plan.alone ? false : next(2) === 0,
      )
      continue
    }
    const card = findCard(state.card)!
    const open = (
      plan.lens || plan.wild
        ? openingLensChoices(card)
        : contextualOpeningChoices(card, state)
    ).filter(
      (choice) =>
        !choice.locked &&
        (!choice.requiresFlag || state.flags.includes(choice.requiresFlag)),
    )
    const pick =
      (plan.lens && open.find((choice) => choice.lens === plan.lens)) ||
      (plan.alone && open.find((choice) => choice.meet === false)) ||
      (plan.wild &&
        (open.find((choice) => choice.meet === false) ??
          open.find((choice) => choice.wild))) ||
      open[next(open.length)]!
    state = chooseBeat(state, pick.id)
  }
  return state
}

// Collect real finished runs until every one of the 84 endings is witnessed.
const earned = new Map<string, RunState>()
const lenses = [
  'sober',
  'tipsy',
  'stoned',
  'tripping_balls',
  'cocaine',
  'meth',
  'mdma',
] as LensId[]
for (let seed = 1; seed < 6000 && earned.size < ENDING_IDS.length; seed++) {
  const event = EVENTS[seed % EVENTS.length]!.id
  const lens = lenses[seed % lenses.length]
  for (const plan of [
    { seed, event, lens },
    { seed, event: 'quiet', lens, wild: true },
    { seed, event: 'quiet', lens, wild: false },
    { seed, event, lens, alone: true },
  ] as Plan[]) {
    const run = play(plan)
    if (run.ending && !earned.has(run.ending)) earned.set(run.ending, run)
  }
}
const missing = ENDING_IDS.filter((id) => !earned.has(id))

let scrapbook = [] as ReturnType<typeof addScrapbookPage>
for (const [index, run] of [...earned.values()].slice(0, 30).entries()) {
  const page = scrapbookPage(
    run,
    new Date(Date.UTC(2026, 10, 1 + (index % 28))).toISOString(),
  )
  if (page) scrapbook = addScrapbookPage(scrapbook, page)
}

const midRun = play(
  { seed: 41, event: 'green-ribbon' },
  (state) => state.phase === 'beat' && state.log.length >= 6,
)
const finished = earned.get('kit.tipsy.hope') ?? [...earned.values()][0]!

process.stdout.write(
  JSON.stringify({
    endings: ENDING_IDS.filter((id) => earned.has(id)),
    missing,
    midRun,
    finished,
    scrapbook,
  }),
)
if (missing.length) {
  console.error(`Ecotone fixtures: no played witness for ${missing.join(', ')}`)
  process.exitCode = 1
}
