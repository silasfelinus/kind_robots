import { IDENTITY_ARCS } from '../cometAcademy/identityArcs'
import { sceneTriggerId } from './sceneGraph'
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
const ROUND_WORDS: Record<number, string> = {
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
}

/** Only call with a validated save. A story receives its award after its
 * closing choice, never while the final cinematic is still awaiting input. */
export function scoreFromSave(save: EvtSave): BattleResult | null {
  const state = save.state
  if (
    state.phase === 'active' ||
    (save.mode === 'story' && !save.story.completed)
  )
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
  const neverDamaged = won && allHealthy && state.damageTaken === 0
  const allRescued = civilians.length > 0 && rescued === civilians.length
  // Timed reinforcements cannot be beaten before they arrive, so the tempo
  // medal allows one round after the last scheduled wave.
  const tempoRound = Math.max(
    4,
    ...(state.rules?.waves ?? []).map((wave) => wave.round + 1),
  )
  const quick = won && state.turn <= tempoRound
  // A secret is earned by triggering an *authored* scene on a verified stage,
  // not by simply noticing a painted secret tile or editing a scrapbook.
  const secretScene =
    won &&
    save.stage?.script?.scenes.some(
      (scene) =>
        scene.trigger.kind === 'secret' &&
        state.fired?.includes(sceneTriggerId(scene.id)),
    )
  const evidence = save.mode === 'story' ? save.story.evidence : 0
  const lines: ScoreLine[] = [
    {
      id: 'outcome',
      label: won ? 'Objective secured' : 'Mission lost',
      points: won ? 500 : 50,
    },
    {
      id: 'opponents',
      label: defeated + ' rival units stopped',
      points: defeated * 20,
    },
    {
      id: 'evacuation',
      label: rescued + ' civilians evacuated',
      points: rescued * 75,
    },
    {
      id: 'evidence',
      label: evidence + ' evidence recovered',
      points: evidence * 25,
    },
  ]
  if (won && allAlive)
    lines.push({ id: 'survival', label: 'No squad knockouts', points: 150 })
  if (won && allHealthy)
    lines.push({
      id: 'healthy',
      label: 'Full health at extraction',
      points: 100,
    })
  if (neverDamaged)
    lines.push({
      id: 'flawless',
      label: 'Untouched from first move to victory',
      points: 250,
    })
  if (won && allRescued)
    lines.push({ id: 'evacuated', label: 'Every civilian safe', points: 200 })
  if (secretScene)
    lines.push({
      id: 'secret',
      label: 'Authored hidden route uncovered',
      points: 125,
    })
  if (quick)
    lines.push({
      id: 'tempo',
      label:
        'Fast objective: round ' +
        (ROUND_WORDS[tempoRound] ?? tempoRound) +
        ' or earlier',
      points: 75,
    })

  const medals = [
    ...(won && allAlive ? ['no-knockouts'] : []),
    ...(won && allHealthy ? ['healthy-extraction'] : []),
    ...(neverDamaged ? ['untouched'] : []),
    ...(won && allRescued ? ['every-civilian'] : []),
    ...(quick ? ['quick-clear'] : []),
    ...(secretScene ? ['secret-route'] : []),
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
    damageTaken: state.damageTaken,
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

const MEDAL_LINES: Readonly<Record<string, string>> = {
  'no-knockouts': 'survival',
  'healthy-extraction': 'healthy',
  untouched: 'flawless',
  'every-civilian': 'evacuated',
  'quick-clear': 'tempo',
  'evidence-recovered': 'evidence',
  'secret-route': 'secret',
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
    (r.foil === null ||
      IDENTITY_ARCS.some((arc) => arc.signature === r.foil)) &&
    ['hero', 'villain', 'henchman', 'sidekick'].includes(r.perspective) &&
    ['victory', 'defeat'].includes(r.outcome) &&
    Number.isInteger(r.turns) &&
    r.turns > 0 &&
    r.turns <= 301 &&
    Array.isArray(r.lines) &&
    r.lines.length >= 4 &&
    r.lines.length <= 10 &&
    r.lines.every(
      (l) =>
        !!l &&
        typeof l === 'object' &&
        typeof l.id === 'string' &&
        l.id.length > 0 &&
        typeof l.label === 'string' &&
        l.label.length <= 120 &&
        Number.isInteger(l.points) &&
        l.points >= 0 &&
        l.points <= 10000,
    ) &&
    new Set(r.lines.map((l) => l.id)).size === r.lines.length &&
    r.lines.reduce((n, l) => n + l.points, 0) === r.total &&
    Array.isArray(r.medals) &&
    new Set(r.medals).size === r.medals.length &&
    (r.outcome === 'victory' || r.medals.length === 0) &&
    r.medals.every(
      (m) =>
        typeof m === 'string' &&
        Object.hasOwn(MEDAL_LINES, m) &&
        r.lines.some((l) => l.id === MEDAL_LINES[m] && l.points > 0),
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
    .sort(
      (a, b) => Date.parse(b.at) - Date.parse(a.at) || a.id.localeCompare(b.id),
    )
    .slice(0, MAX_SCORE_HISTORY)
}

/** Earned, cross-save tactical career record for each permanent identity.
 * Derived only from verified, de-duplicated battle results; no new storage
 * schema, retroactive achievements or promises of unauthored routes. */
export function identityBattleLedger(results: readonly BattleResult[]) {
  const byLead = new Map<
    string,
    {
      lead: string
      name: string
      heroWins: number
      villainWins: number
      otherWins: number
      defeats: number
      storyWins: number
      oneShotWins: number
      uniqueStages: Set<string>
      defeatedFoils: Set<string>
      secrets: Set<string>
    }
  >()
  for (const result of mergeBattleResults([], results)) {
    let entry = byLead.get(result.lead)
    if (!entry) {
      const identity = IDENTITY_ARCS.find(
        (candidate) => candidate.signature === result.lead,
      )!
      entry = {
        lead: result.lead,
        name: identity.hero.alias,
        heroWins: 0,
        villainWins: 0,
        otherWins: 0,
        defeats: 0,
        storyWins: 0,
        oneShotWins: 0,
        uniqueStages: new Set<string>(),
        defeatedFoils: new Set<string>(),
        secrets: new Set<string>(),
      }
      byLead.set(result.lead, entry)
    }
    if (result.outcome !== 'victory') {
      entry.defeats++
      continue
    }
    if (result.perspective === 'hero') entry.heroWins++
    else if (result.perspective === 'villain') entry.villainWins++
    else entry.otherWins++
    if (result.mode === 'story') entry.storyWins++
    else entry.oneShotWins++
    entry.uniqueStages.add(result.stage)
    if (result.foil) entry.defeatedFoils.add(result.foil)
    if (result.medals.includes('secret-route')) entry.secrets.add(result.stage)
  }
  return [...byLead.values()]
    .map((entry) => ({
      lead: entry.lead,
      name: entry.name,
      heroWins: entry.heroWins,
      villainWins: entry.villainWins,
      otherWins: entry.otherWins,
      defeats: entry.defeats,
      storyWins: entry.storyWins,
      oneShotWins: entry.oneShotWins,
      stages: entry.uniqueStages.size,
      foils: [...entry.defeatedFoils].map(
        (signature) =>
          IDENTITY_ARCS.find((arc) => arc.signature === signature)!.hero.alias,
      ),
      secrets: [...entry.secrets],
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
