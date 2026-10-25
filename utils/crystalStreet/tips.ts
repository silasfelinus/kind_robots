/**
 * Coach tips for a first week on Crystal Street (conductor crystal-street
 * t-016, onboarding). Each tip shows once, the first time its moment comes
 * up, while tips are on; the store remembers which ones were seen.
 */
import {
  ARC_STEPS,
  BEST_WINS,
  activitiesAt,
  awaitingDraw,
  LOCATIONS,
  type RunState,
} from './rules'
import type { LocationId } from './ids'

export type Tip = {
  id: string
  title: string
  text: string
  /** True when this is the moment the tip explains. */
  when: (run: RunState) => boolean
}

const anyActivity = (run: RunState, kind: string) =>
  LOCATIONS.some((l) =>
    activitiesAt(run, l.id as LocationId).some((a) => a.kind === kind),
  )

// Earlier tips win when two moments overlap, so the order is the lesson plan.
export const TIPS: Tip[] = [
  {
    id: 'finale',
    title: 'Halloween night',
    text: `Fight, trick, or (with all three leads) the heart. The heart plus ${BEST_WINS} night wins is the Best ending; every edge you earned this week adds to these rolls.`,
    when: (r) => r.current?.kind === 'finale' && !r.pending,
  },
  {
    id: 'outcome',
    title: 'Win or lose, the story moves',
    text: 'Nerve is how much you can take: at zero the week ends. Dread makes every roll harder. Read the chips to see what changed.',
    when: (r) => !!r.pending,
  },
  {
    id: 'meet',
    title: 'Making friends',
    text: 'Win a meeting to recruit a friend. Friends add +1 to rolls that use their skills, and each one has a perk.',
    when: (r) => r.current?.kind === 'meet' && !r.pending,
  },
  {
    id: 'card',
    title: 'Every card is a roll',
    text: 'Two dice plus your skill and any help, against 7, 9 or 11. The percentage on each choice is your real chance, and choices in your look’s style get a bonus.',
    when: (r) => !!r.current && !r.pending,
  },
  {
    id: 'draw',
    title: 'Night falls',
    text: 'Draw from the nightmare’s deck (harder, and wins earn edges for Halloween) or the street deck (steadier). Both count toward the Best ending.',
    when: (r) => awaitingDraw(r),
  },
  {
    id: 'map',
    title: 'Your day',
    text: 'You get three actions a day. Tap a pin to see what’s there: something happening, a friend to meet, training, or rest.',
    when: (r) => r.phase === 'day' && !r.current,
  },
  {
    id: 'leads',
    title: 'The nightmare has a name',
    text: 'Three leads are hidden around town. Find all three before Halloween to unlock the heart choice, the only road to the Best ending.',
    when: (r) =>
      r.phase === 'day' && !r.current && r.revealed && !r.clues.length,
  },
  {
    id: 'hangout',
    title: 'Hang out',
    text: `Once a day you can hang out with a friend at their spot. Finish their story (${ARC_STEPS} hangouts) and they’re Loyal: +1 at Halloween.`,
    when: (r) => r.phase === 'day' && !r.current && anyActivity(r, 'hangout'),
  },
  {
    id: 'standing',
    title: 'Standing in town',
    text: 'Friends, family, officials, neighbors: let any one hit zero and the week ends its own way. Resting at home and training at school mend them.',
    when: (r) => r.phase === 'day' && !r.current && r.day >= 2,
  },
]

export const TIP_IDS = TIPS.map((t) => t.id)

/** The first tip whose moment is now and that hasn't been seen, or null. */
export function tipFor(run: RunState, seen: readonly string[]): Tip | null {
  if (run.phase === 'ended') return null
  return TIPS.find((t) => !seen.includes(t.id) && t.when(run)) ?? null
}
