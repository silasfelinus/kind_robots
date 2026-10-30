import { campaignStagesFor } from './identityCampaignStages'
import { identityFor } from './identityArcs'
import { personalCounterpart } from './identitySerial'
import { henchmanForVillain } from './villainHenchmen'
import type { AcademyRun } from './rules'
import type { SignaturePowerId } from './specialPowers'
import { trainingState, type TrainingState } from '../everyVillainTactics/training'

export type TacticalInterlude = {
  day: number
  caseId: string
  opponent: SignaturePowerId
  state: TrainingState
}

export type TacticalOutcome = {
  day: number
  caseId: string
  opponent: SignaturePowerId
  role: 'hero' | 'villain'
  grade: 'honors' | 'pass' | 'failed'
  turns: number
  fallen: number
}

export function recommendedRivalFor(signature: SignaturePowerId) {
  return personalCounterpart(signature)
}

export function tacticalRoleFor(run: AcademyRun): 'hero' | 'villain' {
  return run.playerEvolution?.form === 'villain' ? 'villain' : 'hero'
}

export function tacticalOpening(run: AcademyRun): string {
  if (!run.signature || !run.opponentSignature) return ''
  const player = identityFor(run.signature)
  const foe = identityFor(run.opponentSignature)
  const lair = campaignStagesFor(foe.signature)
  return tacticalRoleFor(run) === 'villain'
    ? `${foe.hero.alias} is defending ${lair.lair.venue} from your raid. ${foe.heroDecision} ${player.villainDecision} Your squad must choose what it is prepared to destroy.`
    : `${foe.villain.alias} has turned ${lair.lair.venue} into a trap. ${foe.quests.antagonist} ${lair.lair.secret} Your team must choose what it is prepared to save.`
}

function battleSeed(run: AcademyRun, caseId: string): number {
  let seed = (run.seed ^ Math.imul(run.day, 2654435761)) >>> 0
  for (const char of caseId) {
    seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0
  }
  return seed || 1
}

export function newTacticalInterlude(
  run: AcademyRun,
): TacticalInterlude | null {
  if (
    run.flowVersion !== 3 ||
    run.phase !== 'dispatch' ||
    run.day < 15 ||
    !run.signature ||
    !run.opponentSignature ||
    !run.playerCaseId ||
    run.tacticalBattle ||
    run.tacticalResult ||
    run.tacticalHistory?.some((entry) => entry.day === run.day)
  )
    return null

  const state = trainingState(battleSeed(run, run.playerCaseId))
  const [lead, first, second, rival, captain, minion] = state.units
  if (!lead || !first || !second || !rival || !captain || !minion)
    return null

  const opponent = identityFor(run.opponentSignature)
  const species = henchmanForVillain(opponent.signature)
  const lieutenant = campaignStagesFor(opponent.signature).lieutenant
  const assigned = run.assignments.find(
    (entry) => entry.caseId === run.playerCaseId,
  )?.students ?? []
  const allies = [first, second]
  lead.identity = run.signature
  lead.hp = 5
  lead.maxHp = 5
  for (const [index, ally] of allies.entries()) {
    const student = assigned[index]
    if (!student) continue
    ally.henchmanName = student
  }

  rival.identity = opponent.signature
  rival.hp = 5
  rival.maxHp = 5
  captain.identity = opponent.signature
  captain.hp = run.day >= 23 ? lieutenant.hp : species.hp
  captain.maxHp = captain.hp
  if (run.day >= 23) captain.lieutenantName = lieutenant.name
  else captain.henchmanName = species.captain
  minion.identity = opponent.signature
  minion.hp = species.hp
  minion.maxHp = species.hp
  minion.henchmanName = species.name

  const squad = [lead, ...allies.slice(0, assigned.length)]
  state.units = [...squad, rival, captain, minion]
  state.log = tacticalOpening(run)
  state.events = [state.log]
  state.selected = lead.id
  return {
    day: run.day,
    caseId: run.playerCaseId,
    opponent: run.opponentSignature,
    state,
  }
}

export function tacticalResultFor(
  run: AcademyRun,
): TacticalOutcome | null {
  const battle = run.tacticalBattle
  if (!battle || !['victory', 'defeat'].includes(battle.state.phase))
    return null
  const fallen = battle.state.units.filter(
    (unit) => unit.team === 'squad' && unit.hp <= 0,
  ).length
  return {
    day: battle.day,
    caseId: battle.caseId,
    opponent: battle.opponent,
    role: tacticalRoleFor(run),
    grade:
      battle.state.phase === 'defeat'
        ? 'failed'
        : fallen === 0 && battle.state.turn <= 6
          ? 'honors'
          : 'pass',
    turns: battle.state.turn,
    fallen,
  }
}

export function validTacticalOutcome(
  raw: unknown,
  run: AcademyRun,
): raw is TacticalOutcome {
  if (!raw || typeof raw !== 'object') return false
  const result = raw as Partial<TacticalOutcome>
  return (
    Number.isInteger(result.day ?? NaN) &&
    result.day! >= 15 &&
    result.day! <= run.day &&
    typeof result.caseId === 'string' &&
    result.caseId.length > 0 &&
    result.opponent === run.opponentSignature &&
    ['hero', 'villain'].includes(result.role ?? '') &&
    ['honors', 'pass', 'failed'].includes(result.grade ?? '') &&
    Number.isInteger(result.turns ?? NaN) &&
    result.turns! >= 1 &&
    result.turns! <= 300 &&
    Number.isInteger(result.fallen ?? NaN) &&
    result.fallen! >= 0 &&
    result.fallen! <= 4
  )
}

export function validTacticalInterlude(
  raw: unknown,
  run: AcademyRun,
): raw is TacticalInterlude {
  if (!raw || typeof raw !== 'object') return false
  const battle = raw as Partial<TacticalInterlude>
  const state = battle.state
  return (
    run.flowVersion === 3 &&
    run.phase === 'dispatch' &&
    run.day >= 15 &&
    battle.day === run.day &&
    battle.caseId === run.playerCaseId &&
    battle.opponent === run.opponentSignature &&
    !!state &&
    ['active', 'victory', 'defeat'].includes(state.phase) &&
    Number.isInteger(state.turn) &&
    state.turn >= 1 &&
    state.turn <= 300 &&
    typeof state.seed === 'number' &&
    Number.isFinite(state.seed) &&
    typeof state.selected === 'string' &&
    Array.isArray(state.units) &&
    state.units.length >= 3 &&
    state.units.length <= 8 &&
    new Set(state.units.map((unit) => unit.id)).size === state.units.length &&
    state.units.some((unit) => unit.team === 'squad') &&
    state.units.some((unit) => unit.team === 'rival') &&
    state.units.every(
      (unit) =>
        ['squad', 'rival'].includes(unit.team) &&
        Number.isInteger(unit.x) &&
        Number.isInteger(unit.y) &&
        Number.isInteger(unit.hp) &&
        Number.isInteger(unit.ap) &&
        unit.ap >= 0 &&
        unit.ap <= 2 &&
        Number.isFinite(unit.maxHp) &&
        unit.maxHp > 0 &&
        unit.hp >= 0 &&
        unit.hp <= unit.maxHp &&
        unit.x >= 0 &&
        unit.x < 9 &&
        unit.y >= 0 &&
        unit.y < 7,
    ) &&
    !!state.map &&
    state.map.width === 9 &&
    state.map.height === 6
  )
}
