import { identityFor } from './identityArcs'
import type { SignaturePowerId } from './specialPowers'

export type PlayerForm = 'student' | 'hero' | 'villain'
export type PlayerEvolution = {
  form: PlayerForm
  protect: number
  exploit: number
  milestones: { day: 16 | 23; form: PlayerForm }[]
}

export function beginPlayerEvolution(
  form: PlayerForm = 'student',
): PlayerEvolution {
  return { form, protect: 0, exploit: 0, milestones: [] }
}

export function recordPlayerValues(
  state: PlayerEvolution,
  choice: { influence: number; danger: number },
): PlayerEvolution {
  return {
    ...state,
    protect:
      state.protect + (choice.influence > 0 && choice.danger <= 0 ? 1 : 0),
    exploit:
      state.exploit + (choice.influence < 0 || choice.danger >= 2 ? 1 : 0),
  }
}

export function canEvolve(
  state: PlayerEvolution,
  target: PlayerForm,
  signature?: SignaturePowerId,
): boolean {
  if (target === 'student') return true
  if (!signature) return false
  return target === 'hero' ? state.protect >= 2 : state.exploit >= 2
}

export function evolutionEncounter(
  signature: SignaturePowerId | undefined,
  state: PlayerEvolution,
  day: 16 | 23,
) {
  const person = signature ? identityFor(signature) : undefined
  const current = person?.[state.form]
  const scene = !person
    ? 'Your identity has not been registered. You can continue training but may not borrow another person’s heroic mantle.'
    : day === 16
      ? `You began as ${person.realName}, known as ${person.student.alias}. ${person.backstory} The heroic ${person.hero.alias} would ${person.hero.method}; the feared ${person.villain.alias} would ${person.villain.method}. Neither path happens automatically.`
      : `${person.realName} arrives for another reckoning as ${current?.alias}. ${person.heroDecision} Or: ${person.villainDecision} Former friends will remember what you choose.`
  const options = [
    ...(canEvolve(state, 'hero', signature)
      ? [
          {
            id: 'evolve-hero',
            label: `Take the mantle of ${person!.hero.alias}`,
            text: `${person!.realName} chooses ${person!.hero.alias}. ${person!.heroDecision} ${person!.hero.method} Rescues become easier but covert villain jobs harder.`,
            influence: 2,
            danger: -1,
          },
        ]
      : []),
    ...(canEvolve(state, 'villain', signature)
      ? [
          {
            id: 'evolve-villain',
            label: `Claim the name ${person!.villain.alias}`,
            text: `${person!.realName} claims ${person!.villain.alias}. ${person!.villainDecision} ${person!.villain.method} Covert jobs become easier but public rescues harder.`,
            influence: -2,
            danger: 2,
          },
        ]
      : []),
    {
      id: 'evolve-student',
      label:
        day === 16
          ? 'Stay a student and build my own future'
          : 'Keep my current identity',
      text: `Nobody gets to impose a costume on ${person?.realName ?? 'you'}. ${day === 16 ? 'You remain a student, with more time to earn a mantle.' : 'Your present mantle stays intact.'}`,
      influence: 0,
      danger: 0,
    },
  ]
  return {
    title: day === 16 ? 'The First Mask' : 'The Reckoning of the Mask',
    location: 'Academy / Public Oath Chamber',
    scene: `${scene} Your record: ${state.protect} protective and ${state.exploit} exploitative choices. Two matching choices are required for a new mantle.`,
    options,
  }
}

export function resolveEvolution(
  state: PlayerEvolution,
  choice: string,
  day: number,
  signature?: SignaturePowerId,
): PlayerEvolution | null {
  if (day !== 16 && day !== 23) return null
  if (state.milestones.some((event) => event.day === day)) return null
  const form =
    choice === 'evolve-hero'
      ? 'hero'
      : choice === 'evolve-villain'
        ? 'villain'
        : choice === 'evolve-student'
          ? day === 16
            ? 'student'
            : state.form
          : null
  if (!form || !canEvolve(state, form, signature)) return null
  return { ...state, form, milestones: [...state.milestones, { day, form }] }
}

export function evolutionNightModifier(
  state: PlayerEvolution | undefined,
  mission: 'hero' | 'villain' | 'rogue' | 'shared',
): number {
  if (!state || state.form === 'student') return 0
  if (state.form === 'hero')
    return mission === 'hero' || mission === 'shared'
      ? 2
      : mission === 'villain'
        ? -1
        : 0
  return mission === 'villain' || mission === 'rogue'
    ? 2
    : mission === 'hero'
      ? -1
      : 0
}

export function isValidPlayerEvolution(
  raw: unknown,
  signature?: SignaturePowerId,
  initialForm: PlayerForm = 'student',
): raw is PlayerEvolution {
  if (!raw || typeof raw !== 'object') return false
  const state = raw as Partial<PlayerEvolution>
  if (
    !['student', 'hero', 'villain'].includes(state.form ?? '') ||
    !Number.isInteger(state.protect) ||
    (state.protect ?? -1) < 0 ||
    !Number.isInteger(state.exploit) ||
    (state.exploit ?? -1) < 0 ||
    !Array.isArray(state.milestones) ||
    state.milestones.length > 2
  )
    return false
  let previous = 0
  let last: PlayerForm = initialForm
  for (const event of state.milestones) {
    if (
      !event ||
      ![16, 23].includes(event.day) ||
      event.day <= previous ||
      !['student', 'hero', 'villain'].includes(event.form)
    )
      return false
    if (!signature && event.form !== 'student') return false
    if (event.form === 'hero' && (state.protect ?? 0) < 2) return false
    if (event.form === 'villain' && (state.exploit ?? 0) < 2) return false
    previous = event.day
    last = event.form
  }
  return state.form === last
}
