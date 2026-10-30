// Authored conversation trees for studio stages: opening, triggered and
// closing scenes with speakers, emotions, camera framing, choices, flags and
// chained conditions. Triggers latch into the battle's fired history the
// moment they become true, so a reload never replays or skips a scene, and a
// scene's choice effects apply only when the whole scene is finished.
import { promArt } from '../cometAcademy/artManifest'
import { IDENTITY_ARCS } from '../cometAcademy/identityArcs'
import { inside, lineOfSight, tileAt, type Point } from './combat'
import type { Perspective } from './firstBellStory'
import type { TrainingState } from './training'

export type SceneTeam = 'squad' | 'rival'
export type SceneTrigger =
  | { kind: 'opening' }
  | { kind: 'closing'; outcome: 'victory' | 'defeat' | 'any' }
  | { kind: 'turn'; round: number }
  | { kind: 'tile'; x: number; y: number; team: SceneTeam }
  | { kind: 'sight'; unit: string; target: string }
  | { kind: 'health'; unit: string; atMost: number }
  | { kind: 'kill'; team: SceneTeam; count: number }
  | { kind: 'rescue'; count: number }
  | { kind: 'secret' }
  | { kind: 'objective'; progress: number }
  | { kind: 'faction'; team: SceneTeam; lead: number }
  | { kind: 'after'; scene: string }
  | { kind: 'flag'; flag: string }
export type TriggerKind = SceneTrigger['kind']
export type Emotion =
  'neutral' | 'determined' | 'angry' | 'afraid' | 'joyful' | 'sly'
export type Camera = 'wide' | 'close' | 'low-angle' | 'over-shoulder'
export type SceneEffect =
  { kind: 'flag'; flag: string } | { kind: 'heal' } | { kind: 'suppress' }
/** The speaker's role in this story, shown on the line. */
export type SceneRole = 'hero' | 'villain' | 'henchman' | 'sidekick'
/** A state check a branching line evaluates when the scene reaches it. */
export type SceneCondition =
  | { kind: 'flag'; flag: string }
  | { kind: 'perspective'; perspective: Perspective }
  | { kind: 'alive'; unit: string }
  | { kind: 'outnumber'; team: SceneTeam }
export type SceneBranch = {
  when: SceneCondition
  then: string | null
  else: string | null
}
export const ROLES: readonly SceneRole[] = [
  'hero',
  'villain',
  'henchman',
  'sidekick',
]
export type SceneChoice = {
  label: string
  next: string | null
  effects: SceneEffect[]
}
export type SceneNode = {
  id: string
  /** 'narrator', a stage unit id (backdraft, pip...) or a canonical signature. */
  speaker: string
  emotion: Emotion
  camera: Camera
  text: string
  next: string | null
  choices?: SceneChoice[]
  role?: SceneRole
  /** Conditional branch: continue to `then` or `else` from battle state. */
  branch?: SceneBranch
}
export type Scene = {
  id: string
  title: string
  trigger: SceneTrigger
  start: string
  nodes: SceneNode[]
}
export type SceneScript = { version: 1; scenes: Scene[] }

export const TRIGGER_LABELS: Record<TriggerKind, string> = {
  opening: 'Opening',
  closing: 'Closing',
  turn: 'Start of round',
  tile: 'Unit reaches a tile',
  sight: 'Line of sight',
  health: 'Unit health at or below',
  kill: 'Units down',
  rescue: 'Civilians rescued',
  secret: 'Secret found',
  objective: 'Objective progress',
  faction: 'One side outnumbers the other',
  after: 'After another scene',
  flag: 'Story flag set',
}
export const EMOTIONS: readonly Emotion[] = [
  'neutral',
  'determined',
  'angry',
  'afraid',
  'joyful',
  'sly',
]
export const CAMERAS: readonly Camera[] = [
  'wide',
  'close',
  'low-angle',
  'over-shoulder',
]
/** Which outcome portrait best carries an emotion. */
const EMOTION_ART: Record<Emotion, string> = {
  neutral: 'student',
  determined: 'outcomes/hero',
  angry: 'outcomes/villain',
  afraid: 'outcomes/betrayal',
  joyful: 'outcomes/partner',
  sly: 'outcomes/villain',
}
export const UNIT_IDS = ['backdraft', 'priya', 'hattie', 'pip', 'vee', 'remy']
export const sceneTriggerId = (id: string) => 'scene:' + id
const seenId = (id: string) => 'seen:scene:' + id

/** Canonical identity behind a speaker, if any. */
export function speakerIdentity(
  speaker: string,
  state?: Pick<TrainingState, 'units'>,
): string | null {
  if (IDENTITY_ARCS.some((arc) => arc.signature === speaker)) return speaker
  return state?.units.find((u) => u.id === speaker)?.identity ?? null
}
export function speakerArt(
  speaker: string,
  emotion: Emotion,
  state?: Pick<TrainingState, 'units'>,
): string | null {
  const identity = speakerIdentity(speaker, state)
  if (!identity) return null
  return (
    promArt('identities/' + identity + '/' + EMOTION_ART[emotion]) ??
    promArt('identities/' + identity + '/student')
  )
}
export function speakerName(
  speaker: string,
  state?: Pick<TrainingState, 'units'>,
): string {
  if (speaker === 'narrator') return 'NARRATOR'
  const unit = state?.units.find((u) => u.id === speaker)
  const name =
    unit?.lieutenantName ??
    unit?.henchmanName ??
    IDENTITY_ARCS.find((arc) => arc.signature === (unit?.identity ?? speaker))
      ?.hero.alias
  return (name ?? speaker).toUpperCase()
}

/** Every flag some choice in the script can set. */
export const settableFlags = (script: SceneScript) =>
  new Set(
    script.scenes.flatMap((scene) =>
      scene.nodes.flatMap((node) =>
        (node.choices ?? []).flatMap((choice) =>
          choice.effects.flatMap((e) => (e.kind === 'flag' ? [e.flag] : [])),
        ),
      ),
    ),
  )
/** Trigger ids a save may record for this script. */
export function scriptTriggerIds(script: SceneScript | undefined): string[] {
  return (script?.scenes ?? []).flatMap((s) => [
    sceneTriggerId(s.id),
    seenId(s.id),
  ])
}

type StageLike = {
  map: { width: number; height: number; tiles: Record<string, unknown> }
  spawns: Array<{ id: string }>
  secrets: Point[]
  civilians?: unknown[]
}
/** Every line a node can continue to (null ends the scene). */
export function nodeTargets(node: SceneNode): Array<string | null> {
  if (node.choices?.length) return node.choices.map((c) => c.next)
  if (node.branch) return [node.branch.then, node.branch.else]
  return [node.next]
}
function conditionProblem(
  when: SceneCondition,
  stage: StageLike,
  flags: Set<string>,
): string | null {
  switch (when.kind) {
    case 'flag':
      return flags.has(when.flag)
        ? null
        : 'checks flag ' + when.flag + ' that no choice sets.'
    case 'perspective':
      return ['hero', 'villain', 'henchman', 'sidekick'].includes(
        when.perspective,
      )
        ? null
        : 'checks an unknown viewpoint.'
    case 'alive':
      return UNIT_IDS.includes(when.unit) &&
        stage.spawns.some((s) => s.id === when.unit)
        ? null
        : 'checks a unit that is not on the stage.'
    case 'outnumber':
      return ['squad', 'rival'].includes(when.team)
        ? null
        : 'checks an unknown team.'
    default:
      return 'has an unknown condition.'
  }
}
export type SceneContext = {
  state?: Pick<TrainingState, 'units' | 'flags'>
  perspective?: Perspective
}
export function conditionHolds(
  when: SceneCondition,
  context: SceneContext,
): boolean {
  const units = context.state?.units ?? []
  const living = (team: SceneTeam) =>
    units.filter((u) => u.team === team && u.hp > 0).length
  switch (when.kind) {
    case 'flag':
      return !!context.state?.flags?.includes(when.flag)
    case 'perspective':
      return context.perspective === when.perspective
    case 'alive':
      return units.some((u) => u.id === when.unit && u.hp > 0)
    case 'outnumber':
      return (
        living(when.team) > living(when.team === 'squad' ? 'rival' : 'squad')
      )
  }
}
/** Graph validation: broken links, unreachable nodes and scenes, softlocks,
 * unknown actors, actors without shipped art and impossible triggers. */
export function scriptProblems(
  script: SceneScript,
  stage: StageLike,
): string[] {
  const issues: string[] = []
  const map = stage.map as Parameters<typeof tileAt>[0]
  const sceneIds = new Set<string>()
  const flags = settableFlags(script)
  if (script.scenes.length > 12) issues.push('A stage holds at most 12 scenes.')
  if (script.scenes.filter((s) => s.trigger.kind === 'opening').length > 1)
    issues.push('Only one opening scene is allowed.')
  for (const scene of script.scenes) {
    const label = 'Scene “' + scene.title + '”'
    if (!scene.id || sceneIds.has(scene.id))
      issues.push(label + ' needs a unique id.')
    sceneIds.add(scene.id)
    if (!scene.title.trim()) issues.push('Every scene needs a title.')
    const nodes = new Map(scene.nodes.map((n) => [n.id, n]))
    if (nodes.size !== scene.nodes.length)
      issues.push(label + ' repeats a line id.')
    if (!nodes.has(scene.start)) issues.push(label + ' has no starting line.')
    if (scene.nodes.length > 30)
      issues.push(label + ' is longer than 30 lines.')
    const targets = nodeTargets
    for (const node of scene.nodes) {
      if (!node.text.trim()) issues.push(label + ' has an empty line.')
      if (node.text.length > 400)
        issues.push(label + ' has a line over 400 characters.')
      if (!EMOTIONS.includes(node.emotion) || !CAMERAS.includes(node.camera))
        issues.push(label + ' has an unknown emotion or camera.')
      if (
        node.speaker !== 'narrator' &&
        !UNIT_IDS.includes(node.speaker) &&
        !IDENTITY_ARCS.some((arc) => arc.signature === node.speaker)
      )
        issues.push(label + ' has an unknown speaker ' + node.speaker + '.')
      else if (
        IDENTITY_ARCS.some((arc) => arc.signature === node.speaker) &&
        !promArt('identities/' + node.speaker + '/student') &&
        !promArt('identities/' + node.speaker + '/outcomes/hero')
      )
        issues.push(
          label + ': ' + node.speaker + ' has no shipped portrait art.',
        )
      if (node.role !== undefined && !ROLES.includes(node.role))
        issues.push(label + ' has an unknown role.')
      if (node.branch && node.choices?.length)
        issues.push(
          label + ' line ' + node.id + ' cannot both branch and offer choices.',
        )
      if (node.branch) {
        const why = conditionProblem(node.branch.when, stage, flags)
        if (why) issues.push(label + ' branch ' + why)
      }
      if (node.choices && (node.choices.length < 2 || node.choices.length > 3))
        issues.push(label + ' choices need two or three options.')
      for (const choice of node.choices ?? []) {
        if (!choice.label.trim())
          issues.push(label + ' has an unlabeled choice.')
        for (const effect of choice.effects)
          if (
            !['flag', 'heal', 'suppress'].includes(effect.kind) ||
            (effect.kind === 'flag' && !/^[a-z0-9-]{1,32}$/.test(effect.flag))
          )
            issues.push(label + ' has an invalid choice effect.')
      }
      for (const target of targets(node))
        if (target !== null && !nodes.has(target))
          issues.push(label + ' links to a missing line ' + target + '.')
    }
    // Reachability from the start, then softlocks: lines that can never
    // reach an ending line (a loop with no way out).
    const reached = new Set<string>()
    const queue = nodes.has(scene.start) ? [scene.start] : []
    while (queue.length) {
      const id = queue.shift()!
      if (reached.has(id)) continue
      reached.add(id)
      for (const t of targets(nodes.get(id)!))
        if (t !== null && nodes.has(t)) queue.push(t)
    }
    for (const node of scene.nodes)
      if (!reached.has(node.id))
        issues.push(label + ' line ' + node.id + ' is unreachable.')
    const ends = new Set<string>()
    let grew = true
    while (grew) {
      grew = false
      for (const node of scene.nodes)
        if (
          !ends.has(node.id) &&
          targets(node).some((t) => t === null || ends.has(t))
        ) {
          ends.add(node.id)
          grew = true
        }
    }
    for (const node of scene.nodes)
      if (reached.has(node.id) && !ends.has(node.id))
        issues.push(label + ' line ' + node.id + ' loops forever (softlock).')
    issues.push(...triggerProblems(scene, script, stage, map, flags))
  }
  // Chained 'after' triggers must not form a cycle.
  const after = new Map(
    script.scenes.flatMap((s) =>
      s.trigger.kind === 'after' ? [[s.id, s.trigger.scene] as const] : [],
    ),
  )
  for (const start of after.keys()) {
    const seen = new Set<string>()
    let at: string | undefined = start
    while (at && after.has(at) && !seen.has(at)) {
      seen.add(at)
      at = after.get(at)
    }
    if (at && seen.has(at))
      issues.push('Scene chain through ' + start + ' loops and never starts.')
  }
  return [...new Set(issues)]
}

function triggerProblems(
  scene: Scene,
  script: SceneScript,
  stage: StageLike,
  map: Parameters<typeof tileAt>[0],
  flags: Set<string>,
): string[] {
  const t = scene.trigger
  const label = 'Scene “' + scene.title + '” trigger'
  const unit = (id: string) =>
    UNIT_IDS.includes(id) && stage.spawns.some((s) => s.id === id)
  const count = (n: number, max: number) =>
    Number.isInteger(n) && n >= 1 && n <= max
  switch (t.kind) {
    case 'opening':
    case 'secret':
      return t.kind === 'secret' && !stage.secrets.length
        ? [label + ' needs a secret marker on the map.']
        : []
    case 'closing':
      return ['victory', 'defeat', 'any'].includes(t.outcome)
        ? []
        : [label + ' has an unknown outcome.']
    case 'turn':
      return count(t.round, 40) ? [] : [label + ' round must be 1 to 40.']
    case 'tile':
      return inside(map, t) &&
        !tileAt(map, t).wall &&
        ['squad', 'rival'].includes(t.team)
        ? []
        : [label + ' tile must be walkable.']
    case 'sight':
      return unit(t.unit) && unit(t.target) && t.unit !== t.target
        ? []
        : [label + ' needs two different stage units.']
    case 'health':
      return unit(t.unit) &&
        Number.isInteger(t.atMost) &&
        t.atMost >= 0 &&
        t.atMost <= 6
        ? []
        : [label + ' needs a stage unit and 0 to 6 HP.']
    case 'kill':
      return count(t.count, 6) && ['squad', 'rival'].includes(t.team)
        ? []
        : [label + ' count must be 1 to 6.']
    case 'rescue':
      return count(t.count, stage.civilians?.length ?? 0)
        ? []
        : [label + ' needs that many civilians on the map.']
    case 'objective':
      return count(t.progress, 40) ? [] : [label + ' progress must be 1 to 40.']
    case 'faction':
      return count(t.lead, 5) && ['squad', 'rival'].includes(t.team)
        ? []
        : [label + ' lead must be 1 to 5 units.']
    case 'after':
      return t.scene !== scene.id && script.scenes.some((s) => s.id === t.scene)
        ? []
        : [label + ' must follow another existing scene.']
    case 'flag':
      return flags.has(t.flag)
        ? []
        : [label + ' waits for flag ' + t.flag + ' that no choice sets.']
    default:
      return [label + ' is unknown.']
  }
}

/** Whether a trigger's condition holds right now. */
export function triggerHolds(
  trigger: SceneTrigger,
  state: TrainingState,
  stage: { secrets: Point[] },
): boolean {
  const living = state.units.filter((u) => u.hp > 0)
  const byId = (id: string) => state.units.find((u) => u.id === id)
  switch (trigger.kind) {
    case 'opening':
      return true
    case 'closing':
      return (
        state.phase !== 'active' &&
        (trigger.outcome === 'any' || trigger.outcome === state.phase)
      )
    case 'turn':
      return state.turn >= trigger.round
    case 'tile':
      return living.some(
        (u) =>
          u.team === trigger.team && u.x === trigger.x && u.y === trigger.y,
      )
    case 'sight': {
      const a = byId(trigger.unit)
      const b = byId(trigger.target)
      return !!a && !!b && a.hp > 0 && b.hp > 0 && lineOfSight(state.map, a, b)
    }
    case 'health': {
      const u = byId(trigger.unit)
      return !!u && u.hp <= trigger.atMost
    }
    case 'kill':
      return (
        state.units.filter((u) => u.team === trigger.team && u.hp <= 0)
          .length >= trigger.count
      )
    case 'rescue':
      return (
        (state.civilians ?? []).filter((c) => c.status === 'rescued').length >=
        trigger.count
      )
    case 'secret':
      return living.some(
        (u) =>
          u.team === 'squad' &&
          stage.secrets.some((p) => p.x === u.x && p.y === u.y),
      )
    case 'objective': {
      const v = state.rules?.victory
      if (v?.kind === 'hold-zone')
        return (state.field?.held ?? 0) >= trigger.progress
      if (v?.kind === 'rescue')
        return (
          (state.civilians ?? []).filter((c) => c.status === 'rescued')
            .length >= trigger.progress
        )
      return state.turn > trigger.progress
    }
    case 'faction': {
      const side = living.filter((u) => u.team === trigger.team).length
      return side - (living.length - side) >= trigger.lead
    }
    case 'after':
      return !!state.fired?.includes(seenId(trigger.scene))
    case 'flag':
      return !!state.flags?.includes(trigger.flag)
  }
}

/** Records every scene whose trigger now holds. Closing scenes wait for the
 * battle to end; everything else waits for the battle to be live. */
export function latchScenes(
  state: TrainingState,
  script: SceneScript | undefined,
  stage: { secrets: Point[] },
): string[] {
  if (!script || !state.fired) return []
  const latched: string[] = []
  for (const scene of script.scenes) {
    const id = sceneTriggerId(scene.id)
    if (state.fired.includes(id)) continue
    if (
      scene.trigger.kind !== 'closing' &&
      scene.trigger.kind !== 'after' &&
      state.phase !== 'active'
    )
      continue
    if (!triggerHolds(scene.trigger, state, stage)) continue
    state.fired.push(id)
    latched.push(scene.id)
  }
  return latched
}

/** The first latched scene the player has not watched yet. */
export function pendingScriptScene(
  state: TrainingState,
  script: SceneScript | undefined,
): Scene | null {
  if (!script || !state.fired) return null
  return (
    script.scenes.find(
      (s) =>
        state.fired!.includes(sceneTriggerId(s.id)) &&
        !state.fired!.includes(seenId(s.id)),
    ) ?? null
  )
}

/** Walks the chosen path; null when the path is not a legal route to an
 * ending line. */
export function walkScene(
  scene: Scene,
  path: readonly number[],
  context: SceneContext = {},
): { nodes: SceneNode[]; effects: SceneEffect[]; done: boolean } | null {
  const nodes = new Map(scene.nodes.map((n) => [n.id, n]))
  const visited: SceneNode[] = []
  const effects: SceneEffect[] = []
  let at: string | null = scene.start
  let step = 0
  while (at !== null) {
    const node = nodes.get(at)
    if (!node || visited.length > 60) return null
    visited.push(node)
    if (node.choices?.length) {
      if (step >= path.length) return { nodes: visited, effects, done: false }
      const choice = node.choices[path[step]!]
      if (!choice) return null
      step++
      effects.push(...choice.effects)
      at = choice.next
    } else if (node.branch)
      at = conditionHolds(node.branch.when, context)
        ? node.branch.then
        : node.branch.else
    else at = node.next
  }
  return step === path.length ? { nodes: visited, effects, done: true } : null
}

/** Finish a scene along a chosen path: apply its effects once and mark it
 * seen. Heal restores 1 HP to the most-hurt squadmate; suppress marks the
 * weakest rival. Returns false for an illegal or unfinished path. */
export function finishScene(
  state: TrainingState,
  scene: Scene,
  path: readonly number[],
  perspective?: Perspective,
): boolean {
  const walk = walkScene(scene, path, { state, perspective })
  if (!walk?.done || !state.fired || state.fired.includes(seenId(scene.id)))
    return false
  for (const effect of walk.effects) {
    if (effect.kind === 'flag') {
      state.flags ??= []
      if (!state.flags.includes(effect.flag)) state.flags.push(effect.flag)
    } else if (effect.kind === 'heal') {
      const hurt = state.units
        .filter((u) => u.team === 'squad' && u.hp > 0 && u.hp < u.maxHp)
        .sort(
          (a, b) =>
            b.maxHp - b.hp - (a.maxHp - a.hp) || a.id.localeCompare(b.id),
        )[0]
      if (hurt) hurt.hp++
    } else {
      const weak = state.units
        .filter((u) => u.team === 'rival' && u.hp > 0)
        .sort((a, b) => a.hp - b.hp || a.id.localeCompare(b.id))[0]
      if (weak && !weak.statuses.includes('suppressed'))
        weak.statuses.push('suppressed')
    }
  }
  state.fired.push(seenId(scene.id))
  return true
}
