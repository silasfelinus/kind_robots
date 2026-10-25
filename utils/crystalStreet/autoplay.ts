import {
  LOCATIONS,
  activitiesAt,
  awaitingDraw,
  buy,
  choose,
  currentEncounter,
  doActivity,
  drawFrom,
  hashSeed,
  lockReason,
  modifierFor,
  newRun,
  nextRandom,
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
  'hangout',
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

/**
 * Single-minded tactics for the exploit hunt (roadmap #4143): each one
 * replaces part of the careful player with a tactic that should never beat
 * playing the whole game well.
 */
export type Strategy = {
  /** Which deck to draw every night. */
  deck?: 'auto' | 'villain' | 'street'
  /** How to spend every daytime action. */
  day?: 'careful' | 'rest' | 'train' | 'shop'
  /** Use a friend's reroll whenever offered. */
  reroll?: boolean
}

function tacticalActivity(
  run: RunState,
  day: NonNullable<Strategy['day']>,
): [LocationId, DayActivity] | null {
  if (day === 'careful') return bestActivity(run)
  const want: DayActivity['kind'] =
    day === 'rest' ? 'rest' : day === 'train' ? 'train' : 'shop'
  for (const location of LOCATIONS)
    for (const activity of activitiesAt(run, location.id as LocationId))
      if (activity.kind === want) return [location.id as LocationId, activity]
  return bestActivity(run)
}

function shopEverything(run: RunState): RunState {
  let next = run
  for (const id of run.stock) next = buy(next, id)
  return next
}

export function autoplay(
  seed: string,
  villain?: VillainId,
  archetype = 'theatre-kid',
  avatar?: string,
  strategy: Strategy = {},
): RunState {
  const deck = strategy.deck ?? 'auto'
  const day = strategy.day ?? 'careful'
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
      if (strategy.reroll !== false && rerollHelper(run)) run = reroll(run)
      run = resolve(run)
      continue
    }
    if (awaitingDraw(run) && deck !== 'auto') {
      run = drawFrom(run, deck)
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
      if (run.shopOpen && day === 'shop') run = shopEverything(run)
      const next = run.actions > 0 ? tacticalActivity(run, day) : null
      run = next ? doActivity(run, next[0], next[1]) : nightfall(run)
    }
  }
  return run
}

/**
 * A careless week: random legal choices, wandering days, either deck. The
 * balance report's floor (a bad ending should be earned, not routine).
 */
export function carelessAutoplay(
  seed: string,
  villain?: VillainId,
  archetype = 'theatre-kid',
  avatar?: string,
): RunState {
  let rng = hashSeed(`careless:${seed}`)
  const roll = (): number => {
    const [value, next] = nextRandom(rng)
    rng = next
    return value
  }
  const any = <T>(list: readonly T[]): T =>
    list[Math.floor(roll() * list.length)]!
  let run = newRun({
    seed,
    name: 'Sim',
    pronouns: 'they/them',
    archetype,
    avatar,
    villain,
  })
  for (let guard = 0; guard < 800 && run.phase !== 'ended'; guard++) {
    if (run.current) {
      const encounter = currentEncounter(run)
      const open = encounter?.choices.filter((c) => !lockReason(run, c)) ?? []
      if (!open.length) break
      run = resolve(choose(run, any(open).id))
      continue
    }
    if (awaitingDraw(run)) {
      run = drawFrom(run, roll() < 0.5 ? 'villain' : 'street')
      continue
    }
    if (run.phase === 'day') {
      if (run.actions <= 0 || roll() < 0.1) {
        run = nightfall(run)
        continue
      }
      const location = any(LOCATIONS).id as LocationId
      const options = activitiesAt(run, location).filter(
        (a) => a.kind !== 'shop',
      )
      if (options.length) run = doActivity(run, location, any(options))
    }
  }
  return run
}
