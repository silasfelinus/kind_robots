import {
  CHARACTER_ROSTER,
  identityStoryFor,
  type CharacterAllegiance,
  type CharacterBond,
  type CharacterIdentity,
  type CharacterViewpoint,
} from './identityArcs'

export type EvolutionState = {
  person: string
  allegiance: 'undecided' | CharacterAllegiance
  bonds: CharacterBond[]
  trust: number
  pressure: number
  history: EvolutionEvent[]
}

export type EvolutionEvent =
  | { kind: 'choice'; id: string; ethical: 'protect' | 'exploit'; weight?: number }
  | { kind: 'bond'; id: string; bond: CharacterBond; consent: boolean }
  | { kind: 'betrayal'; id: string; witnessed: boolean }

export function beginEvolution(character: CharacterIdentity): EvolutionState {
  return {
    person: character.realName,
    allegiance: 'undecided',
    bonds: [],
    trust: 0,
    pressure: 0,
    history: [],
  }
}

export function evolveCharacter(
  state: EvolutionState,
  event: EvolutionEvent,
): EvolutionState {
  if (state.history.some((prior) => prior.id === event.id)) return state
  const next: EvolutionState = {
    ...state,
    bonds: [...state.bonds],
    history: [...state.history, event],
  }
  if (event.kind === 'choice') {
    const weight = Math.max(1, Math.min(3, Math.trunc(event.weight ?? 1)))
    if (event.ethical === 'protect') next.trust += weight
    else next.pressure += weight
  } else if (event.kind === 'bond') {
    if (event.consent && !next.bonds.includes(event.bond)) next.bonds.push(event.bond)
    if (!event.consent)
      next.bonds = next.bonds.filter((bond) => bond !== event.bond)
  } else if (event.witnessed) {
    next.pressure += 2
  }
  if (next.trust >= 3 && next.trust >= next.pressure + 2)
    next.allegiance = 'hero'
  else if (next.pressure >= 3 && next.pressure >= next.trust + 2)
    next.allegiance = 'villain'
  else next.allegiance = 'undecided'
  return next
}

export function evolutionStory(
  state: EvolutionState,
  viewpoint: CharacterViewpoint,
) {
  const character = CHARACTER_ROSTER.find(
    (person) => person.realName === state.person,
  )
  if (!character) throw new Error('Unknown Comet City identity: ' + state.person)
  const allegiance = state.allegiance === 'undecided' ? 'hero' : state.allegiance
  return {
    ...identityStoryFor(character, viewpoint, allegiance, state.bonds),
    earned: state.allegiance !== 'undecided',
  }
}

export function foreshadowedBetrayer(
  seed: number,
  cast: readonly CharacterIdentity[] = CHARACTER_ROSTER,
): CharacterIdentity {
  if (!cast.length) throw new Error('Cannot select betrayer from an empty cast')
  const index = ((Math.trunc(seed) % cast.length) + cast.length) % cast.length
  return cast[index]!
}
