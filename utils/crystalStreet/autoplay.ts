import {
  LOCATIONS,
  activitiesAt,
  awaitingDraw,
  choose,
  currentEncounter,
  doActivity,
  drawFrom,
  lockReason,
  modifierFor,
  newRun,
  nightfall,
  reroll,
  rerollHelper,
  resolve,
  standingOf,
  successChance,
  villainDeck,
  type DayActivity,
  type RunState,
} from './rules'
import type { LocationId, VillainId } from './ids'

const PRIORITY: DayActivity['kind'][] = [
  'clue',
  'meet',
  'beat',
  'train',
  'rest',
]

// A careful player mends whichever standing is about to give out first.
function mending(
  run: RunState,
  location: LocationId,
  activity: DayActivity,
): boolean {
  const standing = standingOf(run)
  if (standing.family <= 1)
    return activity.kind === 'rest' || activity.kind === 'groceries'
  if (standing.officials <= 1)
    return (
      activity.kind === 'train' &&
      (location === 'library' || location === 'high-school')
    )
  return false
}

function bestActivity(run: RunState): [LocationId, DayActivity] | null {
  let best: [LocationId, DayActivity, number] | null = null
  for (const location of LOCATIONS) {
    for (const activity of activitiesAt(run, location.id as LocationId)) {
      const mend = mending(run, location.id as LocationId, activity)
      if (activity.kind === 'rest' && run.nerve > 5 && !mend) continue
      const rank = mend ? -1 : PRIORITY.indexOf(activity.kind)
      if (rank < 0) continue
      if (
        (activity.kind === 'meet' || activity.kind === 'rejoin') &&
        run.crew.length >= 10
      )
        continue
      if (!best || rank < best[2])
        best = [location.id as LocationId, activity, rank]
    }
  }
  return best ? [best[0], best[1]] : null
}

function bestChoice(run: RunState): string | null {
  const encounter = currentEncounter(run)
  if (!encounter) return null
  const open = encounter.choices.filter((c) => !lockReason(run, c))
  const heart = open.find((c) => c.id === 'heart')
  if (heart) return heart.id
  let pick = open[0]
  let odds = -1
  for (const choice of open) {
    const p = successChance(modifierFor(run, choice).modifier, choice.target)
    if (p > odds) {
      odds = p
      pick = choice
    }
  }
  return pick?.id ?? null
}

export function autoplay(
  seed: string,
  villain?: VillainId,
  archetype = 'theatre-kid',
  avatar?: string,
): RunState {
  let run = newRun({
    seed,
    name: 'Sim',
    pronouns: 'they/them',
    archetype,
    avatar,
    villain,
  })
  for (let guard = 0; guard < 500 && run.phase !== 'ended'; guard++) {
    if (run.current) {
      const choiceId = bestChoice(run)
      if (!choiceId) break
      run = choose(run, choiceId)
      if (rerollHelper(run)) run = reroll(run)
      run = resolve(run)
      continue
    }
    if (awaitingDraw(run)) {
      const curfew =
        standingOf(run).family <= 1 && !run.flags.includes(`curfew-${run.day}`)
      run = drawFrom(
        run,
        villainDeck(run).length && !curfew ? 'villain' : 'street',
      )
      continue
    }
    if (run.phase === 'day') {
      const next = run.actions > 0 ? bestActivity(run) : null
      run = next ? doActivity(run, next[0], next[1]) : nightfall(run)
    }
  }
  return run
}
