// Pure editing helpers for the studio's cinematic editor. Every helper
// returns a new script; the studio validates the result with scriptProblems.
import type {
  Scene,
  SceneChoice,
  SceneEffect,
  SceneNode,
  SceneScript,
  SceneTrigger,
  TriggerKind,
} from './sceneGraph'

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
export const emptyScript = (): SceneScript => ({ version: 1, scenes: [] })

function nextId(taken: readonly string[], prefix: string) {
  let n = 1
  while (taken.includes(prefix + '-' + n)) n++
  return prefix + '-' + n
}

/** Default parameters when the author switches a trigger's kind. */
export function defaultTrigger(
  kind: TriggerKind,
  script: SceneScript,
  sceneId: string,
): SceneTrigger {
  switch (kind) {
    case 'closing':
      return { kind, outcome: 'any' }
    case 'turn':
      return { kind, round: 2 }
    case 'tile':
      return { kind, x: 4, y: 3, team: 'squad' }
    case 'sight':
      return { kind, unit: 'backdraft', target: 'pip' }
    case 'health':
      return { kind, unit: 'backdraft', atMost: 1 }
    case 'kill':
      return { kind, team: 'rival', count: 1 }
    case 'rescue':
      return { kind, count: 1 }
    case 'objective':
      return { kind, progress: 1 }
    case 'after':
      return {
        kind,
        scene: script.scenes.find((s) => s.id !== sceneId)?.id ?? '',
      }
    case 'flag':
      return { kind, flag: settable(script)[0] ?? 'flag-1' }
    default:
      return { kind } as SceneTrigger
  }
}
const settable = (script: SceneScript) =>
  script.scenes.flatMap((s) =>
    s.nodes.flatMap((n) =>
      (n.choices ?? []).flatMap((c) =>
        c.effects.flatMap((e) => (e.kind === 'flag' ? [e.flag] : [])),
      ),
    ),
  )

export function addScene(script: SceneScript, kind: TriggerKind): SceneScript {
  const next = copy(script)
  const id = nextId(
    next.scenes.map((s) => s.id),
    'scene',
  )
  next.scenes.push({
    id,
    title:
      kind === 'opening'
        ? 'Opening'
        : kind === 'closing'
          ? 'Closing'
          : 'Triggered scene',
    trigger: defaultTrigger(kind, next, id),
    start: 'line-1',
    nodes: [
      {
        id: 'line-1',
        speaker: 'narrator',
        emotion: 'neutral',
        camera: 'wide',
        text: 'Describe the moment.',
        next: null,
      },
    ],
  })
  return next
}
export function removeScene(script: SceneScript, id: string): SceneScript {
  return { version: 1, scenes: script.scenes.filter((s) => s.id !== id) }
}
function withScene(
  script: SceneScript,
  id: string,
  edit: (scene: Scene) => void,
): SceneScript {
  const next = copy(script)
  const scene = next.scenes.find((s) => s.id === id)
  if (scene) edit(scene)
  return next
}
export const renameScene = (script: SceneScript, id: string, title: string) =>
  withScene(script, id, (s) => {
    s.title = title.slice(0, 80)
  })
export const setTrigger = (
  script: SceneScript,
  id: string,
  trigger: SceneTrigger,
) =>
  withScene(script, id, (s) => {
    s.trigger = copy(trigger)
  })

/** Appends a line after the scene's last line in reading order. */
export const addLine = (script: SceneScript, id: string) =>
  withScene(script, id, (scene) => {
    const nodeId = nextId(
      scene.nodes.map((n) => n.id),
      'line',
    )
    const last = scene.nodes.find((n) => n.next === null && !n.choices?.length)
    const line: SceneNode = {
      id: nodeId,
      speaker: last?.speaker ?? 'narrator',
      emotion: 'neutral',
      camera: 'close',
      text: '…',
      next: null,
    }
    if (last) last.next = nodeId
    scene.nodes.push(line)
    if (!scene.nodes.some((n) => n.id === scene.start)) scene.start = nodeId
  })
export const updateLine = (
  script: SceneScript,
  id: string,
  nodeId: string,
  patch: Partial<Pick<SceneNode, 'speaker' | 'emotion' | 'camera' | 'text'>>,
) =>
  withScene(script, id, (scene) => {
    const node = scene.nodes.find((n) => n.id === nodeId)
    if (node) Object.assign(node, patch)
  })
/** Removes a line and reconnects whatever pointed at it to its successor. */
export const removeLine = (script: SceneScript, id: string, nodeId: string) =>
  withScene(script, id, (scene) => {
    const gone = scene.nodes.find((n) => n.id === nodeId)
    if (!gone || scene.nodes.length === 1) return
    const successor = gone.choices?.length ? null : gone.next
    scene.nodes = scene.nodes.filter((n) => n.id !== nodeId)
    for (const node of scene.nodes) {
      if (node.next === nodeId) node.next = successor
      for (const choice of node.choices ?? [])
        if (choice.next === nodeId) choice.next = successor
    }
    if (scene.start === nodeId) scene.start = successor ?? scene.nodes[0]!.id
  })
/** Gives a line two or three choices (each may set a flag, heal or
 * suppress) or, with null, turns it back into a plain line. */
export const setChoices = (
  script: SceneScript,
  id: string,
  nodeId: string,
  choices: SceneChoice[] | null,
) =>
  withScene(script, id, (scene) => {
    const node = scene.nodes.find((n) => n.id === nodeId)
    if (!node) return
    if (choices?.length) {
      node.choices = copy(choices)
      node.next = null
    } else delete node.choices
  })
export const choiceEffect = (
  kind: 'none' | SceneEffect['kind'],
  flag = '',
): SceneEffect[] =>
  kind === 'none'
    ? []
    : kind === 'flag'
      ? [
          {
            kind,
            flag: flag
              .toLowerCase()
              .replace(/[^a-z0-9-]/g, '-')
              .slice(0, 32),
          },
        ]
      : [{ kind }]
