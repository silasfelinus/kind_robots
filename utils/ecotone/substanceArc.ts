import type { LensId } from './content'

export const SUBSTANCE_CHOICES = [
  {
    id: 'alcohol',
    label: 'Another drink',
    detail: 'A social ritual can become a pattern.',
  },
  {
    id: 'cannabis',
    label: 'Cannabis',
    detail: 'A slower, more associative moment.',
  },
  { id: 'coffee', label: 'Coffee', detail: 'A very Humboldt kind of urgency.' },
  {
    id: 'psychedelic',
    label: 'The uncanny',
    detail: 'A fictional altered perspective, without a revelation guarantee.',
  },
  {
    id: 'cocaine',
    label: 'The fast track',
    detail: 'Urgency, followed by its ordinary consequences.',
  },
  {
    id: 'meth',
    label: 'The long night',
    detail: 'Rest and corroboration still matter.',
  },
  {
    id: 'mdma',
    label: 'The open heart',
    detail: 'Warmth does not erase anyone’s boundaries.',
  },
] as const

export type SubstanceId = (typeof SUBSTANCE_CHOICES)[number]['id']
export type SubstanceMoment = {
  source: string
  day: number
  selected: SubstanceId[]
}

const ids: readonly string[] = SUBSTANCE_CHOICES.map((entry) => entry.id)

export function validSubstanceSelection(
  value: unknown,
): value is SubstanceId[] {
  return (
    Array.isArray(value) &&
    value.length <= 2 &&
    new Set(value).size === value.length &&
    value.every((id) => typeof id === 'string' && ids.includes(id))
  )
}

export function validSubstanceMoments(
  value: unknown,
): value is SubstanceMoment[] {
  return (
    Array.isArray(value) &&
    value.length <= 180 &&
    value.every(
      (entry) =>
        entry &&
        typeof entry.source === 'string' &&
        entry.source.length > 0 &&
        typeof entry.day === 'number' &&
        Number.isInteger(entry.day) &&
        entry.day >= 1 &&
        validSubstanceSelection(entry.selected),
    )
  )
}

export function openingSubstance(lens: LensId): SubstanceId[] {
  const initial: Partial<Record<LensId, SubstanceId>> = {
    tipsy: 'alcohol',
    stoned: 'cannabis',
    tripping_balls: 'psychedelic',
    cocaine: 'cocaine',
    meth: 'meth',
    mdma: 'mdma',
  }
  return initial[lens] ? ([initial[lens]] as SubstanceId[]) : []
}

export function substanceSummary(moments: SubstanceMoment[]) {
  const counts = Object.fromEntries(
    SUBSTANCE_CHOICES.map(({ id }) => [
      id,
      moments.filter((m) => m.selected.includes(id)).length,
    ]),
  ) as Record<SubstanceId, number>
  let alcoholStreak = 0
  let maxAlcoholStreak = 0
  let restStreak = 0
  let run = 0
  for (const moment of moments) {
    run = moment.selected.includes('alcohol') ? run + 1 : 0
    maxAlcoholStreak = Math.max(maxAlcoholStreak, run)
  }
  for (const moment of [...moments].reverse()) {
    if (!moment.selected.includes('alcohol')) break
    alcoholStreak += 1
  }
  for (const moment of [...moments].reverse()) {
    if (moment.selected.length !== 0) break
    restStreak += 1
  }
  const used = SUBSTANCE_CHOICES.filter(
    (choice) => choice.id !== 'coffee' && counts[choice.id] > 0,
  )
  return {
    counts,
    alcoholStreak,
    maxAlcoholStreak,
    restStreak,
    substancesTried: used.length,
    repeated: used.some(({ id }) => counts[id] >= 3),
    hippieSpeedball: moments.some(
      (m) => m.selected.includes('coffee') && m.selected.includes('cannabis'),
    ),
    latest: moments.at(-1) ?? null,
  }
}

export function momentPerspective(moments: SubstanceMoment[]): {
  lens: LensId
  clarity: number
} {
  const summary = substanceSummary(moments)
  const selected = summary.latest?.selected ?? []
  if (selected.length === 0)
    return {
      lens: 'sober',
      clarity:
        summary.restStreak === 1 && summary.maxAlcoholStreak >= 3 ? 2 : 3,
    }
  if (selected.includes('alcohol'))
    return {
      lens: 'tipsy',
      clarity:
        summary.alcoholStreak >= 5 ? 0 : summary.alcoholStreak >= 3 ? 1 : 2,
    }
  if (selected.includes('meth')) return { lens: 'meth', clarity: 1 }
  if (selected.includes('psychedelic'))
    return { lens: 'tripping_balls', clarity: 1 }
  if (selected.includes('cocaine')) return { lens: 'cocaine', clarity: 2 }
  if (selected.includes('mdma')) return { lens: 'mdma', clarity: 2 }
  if (selected.includes('cannabis')) return { lens: 'stoned', clarity: 2 }
  return { lens: 'sober', clarity: 3 }
}

/** Additional viewpoint, never a replacement for the scene's facts or action labels. */
export function substanceSceneLine(
  moments: SubstanceMoment[],
  day: number,
  source?: string,
): string | null {
  const summary = substanceSummary(moments)
  const last = summary.latest
  if (!last || last.day !== day || (source && last.source !== source))
    return null
  if (summary.alcoholStreak >= 5)
    return '“Th’ brri— the p-p-paper, an’ the... rrriver is a stapler.” You try again. Nothing recognizable comes out. Someone offers a chair and listens anyway. The decisions in front of you remain clear.'
  if (summary.alcoholStreak >= 3)
    return 'You begin a confident explanation. “The bridge, see, it’s the... bridgebridge, the river, no, the paper river—” Your words cannot carry the evidence. Someone gently asks to see what you wrote down instead.'
  if (summary.restStreak >= 2 && summary.substancesTried > 0)
    return 'You have passed on the last few offers. The room has not become simple, but you can hear where other people’s sentences end again.'
  if (last.selected.includes('coffee') && last.selected.includes('cannabis'))
    return 'Coffee sets an urgent little clock ticking; cannabis makes the seconds oddly spacious. The hippie speedball is a contradiction you can feel, not a secret technique for being right.'
  if (last.selected.length === 2)
    return 'Two currents tug at the same afternoon. Neither makes the witness more reliable or the people around you less entitled to a boundary.'
  if (last.selected.length === 0 && summary.substancesTried > 0)
    return 'You choose water and a pause. The room is still strange, but there is time to ask for the words again.'
  if (last.selected.includes('alcohol'))
    return 'A drink loosens the room into overlapping jokes. You still have to decide which promises can survive the music.'
  if (last.selected.includes('cannabis'))
    return 'A small pattern in the corner becomes fascinating. It may mean something, or it may simply be a corner.'
  if (last.selected.includes('coffee'))
    return 'The coffee makes each unanswered question feel a little late. Deadlines remain human inventions, even here.'
  if (last.selected.includes('psychedelic'))
    return 'Scale and metaphor briefly trade coats. Nobody else owes your private impression the status of evidence.'
  if (last.selected.includes('cocaine'))
    return 'Every errand sounds urgent. You could still ask whose deadline it is before running.'
  if (last.selected.includes('meth'))
    return 'The night stretches out. A second witness and a place to rest are both more useful than certainty.'
  if (last.selected.includes('mdma'))
    return 'People seem briefly, extravagantly dear. Their boundaries remain exactly where they put them.'
  return null
}

/** Reusable epilogue layer, independent from hope/dark score and 84 collectible IDs. */
export function substanceEpilogue(moments: SubstanceMoment[]): string | null {
  const summary = substanceSummary(moments)
  const total = Object.entries(summary.counts)
    .filter(([id]) => id !== 'coffee')
    .reduce((sum, [, count]) => sum + count, 0)
  if (total === 0 && moments.length === 0) return null
  if (summary.maxAlcoholStreak >= 3 && summary.restStreak >= 2)
    return 'Somewhere along the way, the drinks stopped being the point of the evening. You remember how hard it was to form a sentence, and the unremarkable courage of eventually choosing water and company instead. Nobody demands a conversion story.'
  if (summary.alcoholStreak >= 3)
    return 'There were nights when you could not make yourself understood. They were part of your journey, not its entire verdict. The people who shared that night remember what you did for them, and what they had to carry.'
  if (summary.hippieSpeedball)
    return 'You once paired coffee with cannabis and called it a hippie speedball. The county declined to become easier to interpret. The mixture was a moment, not a destiny.'
  if (summary.restStreak >= 2 && total > 0)
    return 'The weekend included experiments and refusals. Eventually the refusals became a rhythm you chose for yourself, without requiring anyone else to follow.'
  if (summary.repeated)
    return 'What began as a moment became a habit for part of the journey. Its influence belonged in the account alongside the people, promises and second thoughts, never as an automatic moral verdict.'
  if (total > 0)
    return 'You remember a brief altered moment. It was one detail of the weekend, not a diagnosis, a philosophy or the explanation for everything that followed.'
  return null
}
