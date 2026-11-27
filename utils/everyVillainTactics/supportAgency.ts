// Supporting actors make their own tactical decision after the lead's order.
// The planner is shared by the choice preview and resolution: no RNG, no
// extra player-controlled starting roles, and no phantom actions by fallen NPCs.
import { IDENTITY_ARCS } from '../cometAcademy/identityArcs'
import type { ChoiceEffect } from './firstBellStory'
import { personalSupportVoice } from './personalSupportVoices'
import type { TrainingState, Unit } from './training'

export type SupportBeat = 'alarm' | 'reckoning'
export type SupportAction = {
  beat: SupportBeat
  actor: string
  target: string
  effect: 'guarded' | 'marked'
}

const name = (unit: Unit) =>
  IDENTITY_ARCS.find((entry) => entry.signature === unit.identity)?.hero
    .alias ?? unit.id

// These are the three canonical First Bell companions (including the
// replacement when a player selects one of the two default companions).
// Their decisions belong to them, not to the protagonist's allegiance.
const VOICES: Record<string, { mark: string; guard: string; refuse: string }> =
  {
    'tech-genius': {
      mark: 'My scanner can identify an active threat while you help them.',
      guard: 'The rescue rig has spare shielding. I am covering our crew.',
      refuse:
        'I will not turn a surrendered person into a test subject. I am covering our crew instead.',
    },
    'mutant-earth': {
      mark: 'I can feel the patrol moving through the floor. I will call their position.',
      guard:
        'Someone has to hold the weight while the rest of you move. I will brace the crew.',
      refuse:
        'I know what it feels like to be cornered. I will hold the line, not chase a fallen person.',
    },
    'accident-fire': {
      mark: 'I know how quickly an exit can close. I will call out the active threat.',
      guard:
        'Strangers pulled me out of a fire. I can cover somebody else now.',
      refuse:
        'I survived because somebody stopped to help. I will not chase a person who is already down.',
    },
  }

export function supportPlan(
  state: TrainingState,
  beat: SupportBeat,
  order: ChoiceEffect,
): { action: SupportAction; text: string } | null {
  // First Bell only. Other chapters and Prom's interludes have their own
  // authored scene graphs and should not acquire this rule accidentally.
  if (state.stageId !== null || state.phase !== 'active') return null
  const squad = state.units.filter(
    (unit) => unit.team === 'squad' && unit.hp > 0,
  )
  const companions = squad.filter((unit) => unit.id !== 'backdraft')
  const candidates = beat === 'alarm' ? companions : [...companions].reverse()
  const refusal = beat === 'reckoning' && order === 'press'
  for (const actor of candidates) {
    // Dr. Frog analyzes while the lead rescues; Groundswell protects even
    // under pressure. Future bespoke companions inherit a tactical fallback.
    const personal = state.crossfireCast
      ? personalSupportVoice(actor.identity)
      : undefined
    const analytical =
      actor.identity === 'tech-genius' ||
      (actor.identity !== 'mutant-earth' &&
        (actor.role === 'sniper' || actor.role === 'skirmisher'))
    const prefersMark =
      !refusal &&
      (personal ? personal.preference === 'mark' : analytical) &&
      (order === 'rescue' || order === 'spare')
    const allies = squad
      .filter((unit) => !unit.statuses.includes('guarded'))
      .sort(
        (a, b) =>
          Number(a.id === actor.id) - Number(b.id === actor.id) ||
          a.hp - b.hp ||
          a.id.localeCompare(b.id),
      )
    const rivals = state.units
      .filter(
        (unit) =>
          unit.team === 'rival' &&
          unit.hp > 0 &&
          !unit.statuses.includes('marked'),
      )
      .sort((a, b) => a.hp - b.hp || a.id.localeCompare(b.id))
    const target = prefersMark ? (rivals[0] ?? allies[0]) : allies[0]
    if (!target) continue
    const effect = target.team === 'rival' ? 'marked' : 'guarded'
    const voice = personal ?? VOICES[actor.identity]
    const line = refusal
      ? (voice?.refuse ?? 'I am staying with the crew rather than pursuing.')
      : effect === 'marked'
        ? (voice?.mark ?? 'I will identify the active threat.')
        : (voice?.guard ?? 'I will protect a teammate.')
    return {
      action: { beat, actor: actor.id, target: target.id, effect },
      text:
        line +
        ' ' +
        name(target) +
        (effect === 'marked'
          ? ' is marked (+20 hit chance).'
          : ' is guarded (−15 enemy hit chance).'),
    }
  }
  return null
}

export function supportReport(state: TrainingState, action: SupportAction) {
  const actor = state.units.find((unit) => unit.id === action.actor)
  const target = state.units.find((unit) => unit.id === action.target)
  if (!actor || !target) return null
  return {
    speaker: name(actor),
    text:
      action.effect === 'marked'
        ? 'I marked ' + name(target) + ' for the squad.'
        : 'I independently guarded ' + name(target) + '.',
  }
}

export function applySupport(
  state: TrainingState,
  action: SupportAction,
  plannedText?: string,
): boolean {
  const actor = state.units.find((unit) => unit.id === action.actor)
  const target = state.units.find((unit) => unit.id === action.target)
  if (
    !actor ||
    !target ||
    actor.hp <= 0 ||
    actor.team !== 'squad' ||
    actor.id === 'backdraft' ||
    target.hp <= 0 ||
    target.team !== (action.effect === 'guarded' ? 'squad' : 'rival') ||
    target.statuses.includes(action.effect)
  )
    return false
  target.statuses.push(action.effect)
  const report = supportReport(state, action)!
  const message =
    report.speaker + ': ' + (state.crossfireCast && plannedText ? plannedText : report.text)
  state.log = message
  state.events = [message, ...state.events].slice(0, 6)
  return true
}
