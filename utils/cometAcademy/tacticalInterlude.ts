import { campaignStagesFor } from './identityCampaignStages'
import { identityFor } from './identityArcs'
import { personalCounterpart } from './identitySerial'
import { henchmanForVillain } from './villainHenchmen'
import { rivalArenaFor, originArenaFor, shiftRivalArena } from './rivalArenas'
import { gridDistance, tileAt, type Point } from '../everyVillainTactics/combat'
import { selectedUnit } from '../everyVillainTactics/training'
import type { AcademyRun } from './rules'
import type { SignaturePowerId } from './specialPowers'
import {
  trainingState,
  type TrainingState,
} from '../everyVillainTactics/training'

export type TacticalInterlude = {
  day: number
  caseId: string
  opponent: SignaturePowerId
  state: TrainingState
  arena?: {
    kind: 'origin' | 'lair'
    signature: SignaturePowerId
    title: string
    venue: string
    objective: string
    objectivePoint: Point
    secretPoint: Point
    shiftPoint: Point
    secret: string
    turningPoint: string
    lieutenantAgenda: string
    secured: boolean
    discovered: boolean
    shifted: boolean
    lieutenantParley?: 'ally' | 'truce'
  }
}

export type TacticalOutcome = {
  day: number
  caseId: string
  opponent: SignaturePowerId
  role: 'hero' | 'villain'
  grade: 'honors' | 'pass' | 'failed'
  turns: number
  fallen: number
  stageId?: string
  secured?: boolean
  discovered?: boolean
  lieutenantParley?: 'ally' | 'truce'
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
  if (run.day < 15) {
    const origin = campaignStagesFor(run.signature).opening
    return `${player.hero.alias}: ${origin.inciting} ${origin.powerUse} ${origin.choice} An unidentified opponent is already moving to stop you.`
  }
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
    run.day < 4 ||
    !run.signature ||
    !run.opponentSignature ||
    !run.playerCaseId ||
    run.tacticalBattle ||
    run.tacticalResult ||
    run.tacticalHistory?.some((entry) => entry.day === run.day)
  )
    return null

  const originMission = run.day < 15
  const arena = originMission
    ? originArenaFor(run.signature)
    : rivalArenaFor(run.opponentSignature)
  const state = trainingState(battleSeed(run, run.playerCaseId), arena.stage)
  const [lead, first, second, rival, captain, minion] = state.units
  if (!lead || !first || !second || !rival || !captain || !minion) return null

  const opponent = identityFor(run.opponentSignature)
  const species = henchmanForVillain(opponent.signature)
  const lieutenant = campaignStagesFor(opponent.signature).lieutenant
  const priorParley = run.tacticalHistory?.find(
    (entry) =>
      entry.opponent === run.opponentSignature && entry.lieutenantParley,
  )
  const assigned =
    run.assignments.find((entry) => entry.caseId === run.playerCaseId)
      ?.students ?? []
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
  if (originMission) rival.henchmanName = 'Masked Rival'
  rival.hp = 5
  rival.maxHp = 5
  captain.identity = opponent.signature
  captain.hp =
    run.day >= 23 && !priorParley && !originMission ? lieutenant.hp : species.hp
  captain.maxHp = captain.hp
  if (run.day >= 23 && !priorParley && !originMission) {
    captain.lieutenantName = lieutenant.name
    captain.signatureBoss = opponent.signature
    captain.signatureTarget = null
    captain.signatureCounter = null
    captain.signatureChargeHp = captain.hp
    captain.signatureCooldown = false
  } else captain.henchmanName = species.captain
  minion.identity = opponent.signature
  minion.hp = species.hp
  minion.maxHp = species.hp
  minion.henchmanName = species.name

  const squad = [lead, ...allies.slice(0, assigned.length)]
  if (assigned[2]) {
    // A personal patrol can deploy all three recruited friends, not just two.
    squad.push({
      ...first,
      id: 'third-follower',
      x: 1,
      y: 3,
      henchmanName: assigned[2],
      statuses: [],
    })
  }
  if (priorParley?.lieutenantParley === 'ally' && !originMission) {
    // The defector does more than change the epilogue: they return as a
    // selectable 4-HP squadmate with a once-per-mission signature power.
    const occupied = new Set(squad.map((unit) => unit.x + ',' + unit.y))
    const arrival = Array.from({ length: 12 }, (_, index) => ({
      x: 1 + Math.floor(index / 6),
      y: index % 6,
    })).find(
      (point) =>
        !occupied.has(point.x + ',' + point.y) &&
        !tileAt(state.map, point).wall,
    )
    if (arrival)
      squad.push({
        ...captain,
        id: 'allied-lieutenant',
        team: 'squad',
        identity: opponent.signature,
        lieutenantName: lieutenant.name,
        henchmanName: undefined,
        x: arrival.x,
        y: arrival.y,
        hp: lieutenant.hp,
        maxHp: lieutenant.hp,
        ap: 2,
        moved: false,
        fired: false,
        overwatch: false,
        statuses: [],
        signatureSupportUsed: false,
      })
  }
  // A truce demobilizes the lieutenant's captain and their escort. One
  // independent rival minion may still defend the lair alongside its owner.
  state.units = [
    ...squad,
    rival,
    ...(priorParley?.lieutenantParley === 'truce' ? [] : [captain]),
    minion,
  ]
  state.log =
    tacticalOpening(run) +
    (priorParley?.lieutenantParley === 'ally'
      ? ` ${lieutenant.name} returns as your allied commander. Select their card to deploy one signature strike this mission. The rival's loyal troops still defend the lair.`
      : priorParley?.lieutenantParley === 'truce'
        ? ` ${lieutenant.name} honors the ceasefire: their command squad stands down. Only the rival and an independent holdout remain.`
        : '')
  state.events = [state.log]
  state.selected = lead.id
  return {
    day: run.day,
    caseId: run.playerCaseId,
    opponent: run.opponentSignature,
    state,
    arena: {
      kind: originMission ? 'origin' : 'lair',
      signature: originMission ? run.signature : run.opponentSignature,
      title: arena.stage.title,
      venue: arena.stage.venue,
      objective: arena.stage.objective,
      objectivePoint: arena.objectivePoint,
      secretPoint: arena.secretPoint,
      shiftPoint: arena.shiftPoint,
      secret: arena.secret,
      turningPoint: arena.turningPoint,
      lieutenantAgenda: arena.lieutenantAgenda,
      secured: false,
      discovered: false,
      shifted: false,
    },
  }
}

/** Defeating the rival isn't enough: the player must secure the lair's own
 * physical objective. This works even after all enemy combatants fall. */
export function reconcileTacticalVictory(battle: TacticalInterlude) {
  if (battle.state.phase === 'defeat') return
  const enemiesDown = battle.state.units.every(
    (unit) => unit.team !== 'rival' || unit.hp <= 0,
  )
  if (enemiesDown && battle.arena && !battle.arena.secured) {
    battle.state.phase = 'active'
    battle.state.log =
      'The rival is down. Secure the mission objective before extraction.'
  } else if (enemiesDown && battle.arena?.secured) {
    battle.state.phase = 'victory'
    battle.state.log = `Objective secured: ${battle.arena.objective}`
  }
}

export function secureRivalObjective(battle: TacticalInterlude): boolean {
  const objective = battle.arena
  const leader = selectedUnit(battle.state)
  if (
    !objective ||
    objective.secured ||
    !leader ||
    battle.state.phase !== 'active' ||
    leader.ap < 1 ||
    gridDistance(leader, objective.objectivePoint) > 1
  )
    return false
  leader.ap--
  objective.secured = true
  battle.state.log = `Secured: ${objective.objective} ${objective.lieutenantAgenda}`
  battle.state.events.unshift(battle.state.log)
  battle.state.events = battle.state.events.slice(0, 6)
  reconcileTacticalVictory(battle)
  return true
}

export function discoverRivalSecret(battle: TacticalInterlude): boolean {
  const objective = battle.arena
  const leader = selectedUnit(battle.state)
  if (
    !objective ||
    objective.discovered ||
    !leader ||
    gridDistance(leader, objective.secretPoint) > 0
  )
    return false
  objective.discovered = true
  battle.state.log = `SECRET FOUND: ${objective.secret}`
  battle.state.events.unshift(battle.state.log)
  battle.state.events = battle.state.events.slice(0, 6)
  return true
}

/** An earned nonlethal choice, not a free "talk" button. The player must
 * recover the lair evidence, wound the real named lieutenant, approach within
 * two cells and sacrifice one action point before any deal can be offered. */
export function canParleyWithLieutenant(battle: TacticalInterlude): boolean {
  const arena = battle.arena
  const squadmate = selectedUnit(battle.state)
  const boss = battle.state.units.find(
    (unit) => unit.signatureBoss === battle.opponent && unit.hp > 0,
  )
  return Boolean(
    arena?.kind === 'lair' &&
    arena.discovered &&
    !arena.lieutenantParley &&
    battle.state.phase === 'active' &&
    squadmate &&
    squadmate.ap >= 1 &&
    boss &&
    boss.hp <= 2 &&
    gridDistance(squadmate, boss) <= 2,
  )
}

export function parleyWithLieutenant(
  battle: TacticalInterlude,
  decision: 'ally' | 'truce',
): boolean {
  if (!['ally', 'truce'].includes(decision) || !canParleyWithLieutenant(battle))
    return false
  const squadmate = selectedUnit(battle.state)!
  const boss = battle.state.units.find(
    (unit) => unit.signatureBoss === battle.opponent && unit.hp > 0,
  )!
  const arena = battle.arena!
  squadmate.ap--
  // A surrender removes the combatant but records that they left alive. The
  // separately saved resolution, not 0 HP alone, proves what happened.
  boss.hp = 0
  boss.signatureTarget = null
  boss.signatureCounter = null
  boss.overwatch = false
  arena.lieutenantParley = decision
  const lieutenant = campaignStagesFor(battle.opponent).lieutenant
  const message =
    decision === 'ally'
      ? `${lieutenant.name} chooses to defect after you present the hidden evidence. ${lieutenant.agenda} They promise testimony and help at graduation.`
      : `${lieutenant.name} signs a ceasefire and withdraws from this battle. ${lieutenant.agenda} Their forces are ordered to stop targeting civilians.`
  battle.state.log = message
  battle.state.events.unshift(message)
  battle.state.events = battle.state.events.slice(0, 6)
  reconcileTacticalVictory(battle)
  return true
}

/** Timed terrain event changes the actual cover/height calculations, persists
 * with battle state, and never replays twice after a reload. */
export function advanceRivalArena(battle: TacticalInterlude): boolean {
  const objective = battle.arena
  if (
    !objective ||
    objective.shifted ||
    battle.state.turn < 3 ||
    battle.state.phase !== 'active'
  )
    return false
  const arena =
    objective.kind === 'origin'
      ? originArenaFor(objective.signature)
      : rivalArenaFor(objective.signature)
  const shifted = shiftRivalArena(arena, {
    ...arena.stage,
    map: battle.state.map,
  })
  battle.state.map = shifted.map
  objective.shifted = true
  battle.state.log = `THE ARENA CHANGES: ${objective.turningPoint}`
  battle.state.events.unshift(battle.state.log)
  battle.state.events = battle.state.events.slice(0, 6)
  return true
}

export function tacticalResultFor(run: AcademyRun): TacticalOutcome | null {
  const battle = run.tacticalBattle
  if (
    !battle ||
    !['victory', 'defeat'].includes(battle.state.phase) ||
    (battle.state.phase === 'victory' && battle.arena && !battle.arena.secured)
  )
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
        : fallen === 0 && (battle.state.turn <= 6 || battle.arena?.discovered)
          ? 'honors'
          : 'pass',
    turns: battle.state.turn,
    fallen,
    ...(battle.arena
      ? {
          stageId: battle.state.stageId ?? undefined,
          secured: battle.arena.secured,
          discovered: battle.arena.discovered,
          ...(battle.arena.lieutenantParley
            ? { lieutenantParley: battle.arena.lieutenantParley }
            : {}),
        }
      : {}),
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
    result.day! >= 4 &&
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
    result.fallen! <= 4 &&
    (result.stageId === undefined ||
      result.stageId ===
        (result.day! < 15
          ? 'hero-origin-' + run.signature
          : 'rival-lair-' + result.opponent)) &&
    (result.secured === undefined || typeof result.secured === 'boolean') &&
    (result.discovered === undefined ||
      typeof result.discovered === 'boolean') &&
    (result.lieutenantParley === undefined ||
      (['ally', 'truce'].includes(result.lieutenantParley) &&
        result.day! >= 23 &&
        result.discovered === true &&
        result.stageId === 'rival-lair-' + result.opponent))
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
    run.day >= 4 &&
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
        (unit.signatureSupportUsed === undefined ||
          (unit.id === 'allied-lieutenant' &&
            typeof unit.signatureSupportUsed === 'boolean')) &&
        (unit.id !== 'allied-lieutenant' ||
          (unit.team === 'squad' &&
            unit.identity === run.opponentSignature &&
            unit.lieutenantName ===
              campaignStagesFor(battle.opponent!).lieutenant.name &&
            unit.maxHp === 4 &&
            typeof unit.signatureSupportUsed === 'boolean' &&
            run.tacticalHistory?.some(
              (entry) =>
                entry.opponent === battle.opponent &&
                entry.lieutenantParley === 'ally' &&
                entry.day < run.day,
            ))) &&
        unit.x >= 0 &&
        unit.x < 9 &&
        unit.y >= 0 &&
        unit.y < 7 &&
        (unit.signatureBoss === undefined ||
          (unit.signatureBoss === run.opponentSignature &&
            unit.lieutenantName ===
              campaignStagesFor(unit.signatureBoss).lieutenant.name &&
            typeof unit.signatureCooldown === 'boolean' &&
            Number.isInteger(unit.signatureChargeHp) &&
            unit.signatureChargeHp! >= unit.hp &&
            unit.signatureChargeHp! <= unit.maxHp &&
            [unit.signatureTarget, unit.signatureCounter].every(
              (point) =>
                point === null ||
                (point !== undefined &&
                  Number.isInteger(point.x) &&
                  Number.isInteger(point.y) &&
                  point.x >= 0 &&
                  point.x < state.map.width &&
                  point.y >= 0 &&
                  point.y < state.map.height &&
                  !tileAt(state.map, point).wall),
            ) &&
            !!unit.signatureTarget === !!unit.signatureCounter)),
    ) &&
    !!state.map &&
    state.map.width === 9 &&
    state.map.height === 6 &&
    (battle.arena === undefined ||
      (['origin', 'lair'].includes(battle.arena.kind) &&
        battle.arena.signature ===
          (battle.arena.kind === 'origin'
            ? run.signature
            : run.opponentSignature) &&
        typeof battle.arena.title === 'string' &&
        typeof battle.arena.venue === 'string' &&
        typeof battle.arena.objective === 'string' &&
        typeof battle.arena.secret === 'string' &&
        typeof battle.arena.turningPoint === 'string' &&
        typeof battle.arena.lieutenantAgenda === 'string' &&
        typeof battle.arena.secured === 'boolean' &&
        typeof battle.arena.discovered === 'boolean' &&
        typeof battle.arena.shifted === 'boolean' &&
        (battle.arena.lieutenantParley === undefined ||
          (['ally', 'truce'].includes(battle.arena.lieutenantParley) &&
            run.day >= 23 &&
            battle.arena.kind === 'lair' &&
            battle.arena.discovered &&
            state.units.some(
              (unit) =>
                unit.signatureBoss === run.opponentSignature && unit.hp === 0,
            ))) &&
        state.stageId ===
          (battle.arena.kind === 'origin'
            ? 'hero-origin-' + run.signature
            : 'rival-lair-' + battle.opponent) &&
        [
          battle.arena.objectivePoint,
          battle.arena.secretPoint,
          battle.arena.shiftPoint,
        ].every(
          (point) =>
            Number.isInteger(point?.x) &&
            Number.isInteger(point?.y) &&
            point.x >= 0 &&
            point.x < state.map.width &&
            point.y >= 0 &&
            point.y < state.map.height &&
            !tileAt(state.map, point).wall,
        ) &&
        (state.phase !== 'victory' || battle.arena.secured)))
  )
}
