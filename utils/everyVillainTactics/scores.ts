import { IDENTITY_ARCS } from '../cometAcademy/identityArcs'
import { checksumV1, type EvtSave } from './saves'

export type ScoreLine = {
  id: string
  label: string
  points: number
}
export type BattleResult = {
  id: string
  at: string
  mode: EvtSave['mode']
  stage: string
  lead: string
  foil: string | null
  perspective: EvtSave['perspective']
  outcome: 'victory' | 'defeat'
  turns: number
  total: number
  medals: string[]
  lines: ScoreLine[]
}
export const MAX_SCORE_HISTORY = 64

/** Only call with a validated save. A story receives its award after its
 * closing choice, never while the final cinematic is still awaiting input. */
export function scoreFromSave(save: EvtSave): BattleResult | null {
  const state = save.state
  if (state.phase === 'active' || (save.mode === 'story' && !save.story.completed))
    return null

  const won = state.phase === 'victory'
  const squad = state.units.filter((u) => u.team === 'squad')
  const rivals = state.units.filter((u) => u.team === 'rival')
  const civilians = state.civilians ?? []
  const rescued = civilians.filter((c) => c.status === 'rescued').length
  const defeated = rivals.filter((u) => u.hp <= 0).length
  const survivors = squad.filter((u) => u.hp > 0).length
  const allAlive = squad.length > 0 && survivors === squad.length
  const allHealthy = allAlive && squad.every((u) => u.hp === u.maxHp)
  const allRescued = civilians.length > 0 && rescued === civilians.length
  const quick = won && state.turn <= 4
  const evidence = save.mode === 'story' ? save.story.evidence : 0
  const lines: ScoreLine[] = [
    { id: 'outcome', label: won ? 'Objective secured' : 'Mission lost', points: won ? 500 : 50 },
    { id: 'opponents', label: defeated + ' rival units stopped', points: defeated * 20 },
    { id: 'evacuation', label: rescued + ' civilians evacuated', points: rescued * 75 },
    { id: 'evidence', label: evidence + ' evidence recovered', points: evidence * 25 },
  ]
  if (won && allAlive)
    lines.push({ id: 'survival', label: 'No squad knockouts', points: 150 })
  if (won && allHealthy)
    lines.push({ id: 'healthy', label: 'Full health at extraction', points: 100 })
  if (won && allRescued)
    lines.push({ id: 'evacuated', label: 'Every civilian safe', points: 200 })
  if (quick)
    lines.push({ id: 'tempo', label: 'Fast objective: round four or earlier', points: 75 })

  const medals = [
    ...(won && allAlive ? ['no-knockouts'] : []),
    ...(won && allHealthy ? ['healthy-extraction'] : []),
    ...(won && allRescued ? ['every-civilian'] : []),
    ...(quick ? ['quick-clear'] : []),
    ...(won && evidence > 0 ? ['evidence-recovered'] : []),
  ]
  // The digest excludes save slot and timestamp. Loading, manually saving or
  // replaying an identical result cannot duplicate the award.
  const id = checksumV1({
    mode: save.mode,
    stage: save.stage?.id ?? 'first-bell',
    lead: save.leadSignature,
    foil: save.foilSignature ?? null,
    perspective: save.perspective,
    phase: state.phase,
    turn: state.turn,
    seed: state.seed,
    units: state.units.map((u) => [u.id, u.hp, u.x, u.y]),
    civilians: state.civilians?.map((c) => [c.id, c.status]),
    fired: state.fired,
    flags: state.flags,
    decisions: save.story.decisions,
  })
  return {
    id,
    at: save.savedAt,
    mode: save.mode,
    stage: save.stage?.title ?? 'First Bell',
    lead: save.leadSignature,
    foil: save.foilSignature ?? null,
    perspective: save.perspective,
    outcome: state.phase,
    turns: state.turn,
    total: lines.reduce((n, line) => n + line.points, 0),
    medals,
    lines,
  }
}

function validResult(value: unknown): value is BattleResult {
  if (!value || typeof value !== 'object') return false
  const r = value as BattleResult
  return (
    typeof r.id === 'string' &&
    /^[a-f0-9]{8}$/.test(r.id) &&
    typeof r.at === 'string' &&
    !Number.isNaN(Date.parse(r.at)) &&
    ['story', 'oneshot'].includes(r.mode) &&
    typeof r.stage === 'string' &&
    r.stage.length > 0 &&
    r.stage.length <= 120 &&
    IDENTITY_ARCS.some((arc) => arc.signature === r.lead) &&
    (r.foil === null || IDENTITY_ARCS.some((arc) => arc.signature === r.foil)) &&
    ['hero', 'villain', 'henchman', 'sidekick'].includes(r.perspective) &&
    ['victory', 'defeat'].includes(r.outcome) &&
    Number.isInteger(r.turns) &&
    r.turns > 0 &&
    r.turns <= 301 &&
    Array.isArray(r.lines) &&
    r.lines.length >= 4 &&
    r.lines.length <= 8 &&
    r.lines.every(
      (l) =>
        typeof l.id === 'string' &&
        typeof l.label === 'string' &&
        l.label.length <= 120 &&
        Number.isInteger(l.points) &&
        l.points >= 0 &&
        l.points <= 10000,
    ) &&
    r.lines.reduce((n, l) => n + l.points, 0) === r.total &&
    Array.isArray(r.medals) &&
    r.medals.every(
      (m) =>
        typeof m === 'string' &&
        ['no-knockouts', 'healthy-extraction', 'every-civilian', 'quick-clear', 'evidence-recovered'].includes(m),
    )
  )
}

/** The scrapbook is a finite history, not a farmable point balance. */
export function mergeBattleResults(
  existing: readonly BattleResult[],
  incoming: readonly BattleResult[],
): BattleResult[] {
  const byId = new Map<string, BattleResult>()
  for (const result of [...existing, ...incoming]) {
    if (!validResult(result)) continue
    const prior = byId.get(result.id)
    if (!prior || Date.parse(result.at) < Date.parse(prior.at))
      byId.set(result.id, result)
  }
  return [...byId.values()]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at) || a.id.localeCompare(b.id))
    .slice(0, MAX_SCORE_HISTORY)
}
