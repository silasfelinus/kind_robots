import pack from './authoredTrials.json'
import {
  confrontJourneyBoss,
  JOURNEY_WORLD,
  type JourneyBoss,
  type JourneyLog,
  type JourneyRoll,
  type JourneyState,
  type Skill,
} from './journey'

export type TrialChoice = {
  id: string
  label: string
  intent: string
  skill: Skill
  target: number
  cost: number
  requiredAnyFlags: string[]
  success: string
  failure: string
}
export type AuthoredTrial = {
  landId: string
  title: string
  flavor: string
  art: string | null
  choices: TrialChoice[]
}
export type TrialResult = {
  landId: string
  bossId: string
  choiceId: string
  turn: number
  roll: JourneyRoll
  resultText: string
  hpChange: number
  provisionChange: number
}
export const TRIAL_SOURCE_VERSION = pack.schemaVersion
export const AUTHORED_TRIALS: readonly AuthoredTrial[] = pack.trials.map(
  ({ landId, title, flavor, art, choices }) => ({
    landId,
    title,
    flavor,
    art,
    choices: choices as TrialChoice[],
  }),
)
const SKILLS: Record<Skill, number> = {
  steel: 3,
  awareness: 2,
  wits: 2,
  bearing: 2,
  resolve: 2,
  insight: 2,
}
const random = (value: number): [number, number] => {
  const next = (Math.imul(value, 1664525) + 1013904223) >>> 0
  return [next, next / 4294967296]
}
const clamp = (value: number, maximum: number) =>
  Math.max(0, Math.min(maximum, value))

export function trialForLand(landId: string): AuthoredTrial | null {
  return AUTHORED_TRIALS.find((entry) => entry.landId === landId) ?? null
}

export function canChooseTrial(
  choice: TrialChoice,
  flags: readonly string[],
  provisions: number,
): boolean {
  return (
    provisions >= choice.cost &&
    (choice.requiredAnyFlags.length === 0 ||
      choice.requiredAnyFlags.some((flag) => flags.includes(flag)))
  )
}

export function stepAuthoredTrial(
  state: JourneyState,
  flags: readonly string[],
  choiceId: string,
): { journey: JourneyState; outcome: TrialResult } | null {
  if (state.phase !== 'boss') return null
  const land = JOURNEY_WORLD.lands[state.landIndex]
  if (!land) return null
  const trial = trialForLand(land.id)
  const choice = trial?.choices.find((entry) => entry.id === choiceId)
  if (!choice || !canChooseTrial(choice, flags, state.provisions)) return null

  const [first, left] = random(state.rngState)
  const [second, right] = random(first)
  const dice: [number, number] = [
    Math.floor(left * 6) + 1,
    Math.floor(right * 6) + 1,
  ]
  const modifier = SKILLS[choice.skill]
  const total = dice[0] + dice[1] + modifier
  const roll: JourneyRoll = {
    landId: land.id,
    locationId: land.boss.id,
    dice,
    skill: choice.skill,
    modifier,
    difficulty: choice.target,
    total,
    success: total >= choice.target,
  }
  const turn = state.turn + 1
  const provisions = state.provisions - choice.cost
  const hpAfterCheck = clamp(state.hp - (roll.success ? 0 : 1), 8)
  const text = roll.success ? choice.success : choice.failure
  const journal: JourneyLog[] = [
    ...state.journal,
    {
      turn,
      kind: 'boss',
      landId: land.id,
      text:
        trial!.title +
        ': ' +
        choice.label +
        '. ' +
        dice.join(' + ') +
        ' + ' +
        modifier +
        ' = ' +
        total +
        ' versus ' +
        choice.target +
        '. ' +
        text,
    },
  ]
  const outcome: TrialResult = {
    landId: land.id,
    bossId: land.boss.id,
    choiceId,
    turn,
    roll,
    resultText: text,
    hpChange: hpAfterCheck - state.hp,
    provisionChange: provisions - state.provisions,
  }
  if (!roll.success) {
    const fallen = hpAfterCheck <= 0
    if (fallen)
      journal.push({
        turn,
        kind: 'end',
        landId: land.id,
        text: 'You fall before the trial. The journey ends.',
      })
    return {
      journey: {
        ...state,
        rngState: second,
        turn,
        journal,
        provisions,
        hp: hpAfterCheck,
        lastRoll: roll,
        phase: fallen ? 'fallen' : 'boss',
      },
      outcome,
    }
  }
  const boss: JourneyBoss = {
    landId: land.id,
    id: land.boss.id,
    turn,
    approach: choiceId === 'confront' ? 'challenge' : 'parley',
    roll,
  }
  const final = state.landIndex === JOURNEY_WORLD.lands.length - 1
  if (final)
    journal.push({
      turn,
      kind: 'end',
      landId: land.id,
      text: 'You cross the last threshold. The five lands are behind you.',
    })
  else
    journal.push({
      turn,
      kind: 'start',
      landId: JOURNEY_WORLD.lands[state.landIndex + 1]!.id,
      text: 'You enter ' + JOURNEY_WORLD.lands[state.landIndex + 1]!.name + '.',
    })
  return {
    journey: {
      ...state,
      rngState: second,
      turn,
      provisions,
      hp: clamp(hpAfterCheck + 2, 8),
      journal,
      bosses: [...state.bosses, boss],
      lastRoll: roll,
      landIndex: final ? state.landIndex : state.landIndex + 1,
      phase: final ? 'complete' : 'explore',
      active: null,
      position: null,
    },
    outcome,
  }
}

export function retireAuthoredTrial(state: JourneyState): JourneyState {
  return confrontJourneyBoss(state, 'retreat')
}
