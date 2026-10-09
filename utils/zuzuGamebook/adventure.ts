import { BOOK } from './book'
import type { Attribute, Choice, Roll, Run, Scene, SceneEffects } from './types'

export type {
  Attribute,
  Battle,
  Choice,
  Roll,
  Run,
  Scene,
  SceneEffects,
} from './types'
export { BOOK, SCENE_ORDER } from './book'

const MAX_HEALTH = 12
const MAX_RESOLVE = 4
const SLOTS = 5

export const ENDING_IDS: string[] = Object.values(BOOK)
  .filter((node) => !!node.ending)
  .map((node) => node.id)

export function scene(id: string): Scene {
  const found = BOOK[id]
  if (!found) throw new Error('Unknown gamebook scene: ' + id)
  return found
}

export function startRun(seed: number): Run {
  return {
    version: 1,
    sceneId: 'the-crossing',
    health: MAX_HEALTH,
    resolve: MAX_RESOLVE,
    attributes: { steel: 2, sense: 1, shadow: 1, mercy: 0 },
    items: ['water', 'bandage', 'apple', 'flint'],
    flags: [],
    seed: seed || 1,
    visited: ['the-crossing'],
    endings: [],
    battle: null,
    lastRoll: null,
  }
}

/** Why a choice cannot be taken right now, or null when it can. */
export function lockReason(run: Run, choice: Choice): string | null {
  if (choice.needs && !run.flags.includes(choice.needs))
    return choice.hint ?? 'You do not know enough yet.'
  if (choice.requires && !run.items.includes(choice.requires))
    return 'Requires: ' + choice.requires
  if (choice.spend && !run.items.includes(choice.spend))
    return 'Requires: ' + choice.spend
  if (choice.cost && run.resolve < choice.cost) return 'Not enough Resolve'
  return null
}

/** Choices still on offer: a choice whose `unless` flag is held is retired. */
export function visibleChoices(run: Run, node: Scene): Choice[] {
  return (node.choices ?? []).filter(
    (choice) => !choice.unless || !run.flags.includes(choice.unless),
  )
}

function roll(seed: number): { seed: number; dice: [number, number] } {
  let x = seed >>> 0 || 1
  const next = () => {
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    return ((x >>> 0) % 6) + 1
  }
  const dice: [number, number] = [next(), next()]
  return { seed: x >>> 0, dice }
}

function applyEffects(run: Run, effects: SceneEffects | undefined): Run {
  if (!effects) return run
  const next = { ...run, items: [...run.items], flags: [...run.flags] }
  if (effects.flag && !next.flags.includes(effects.flag))
    next.flags.push(effects.flag)
  if (effects.gain && next.items.length < SLOTS) next.items.push(effects.gain)
  if (effects.heal)
    next.health = Math.min(MAX_HEALTH, next.health + effects.heal)
  if (effects.hurt) next.health = Math.max(1, next.health - effects.hurt)
  if (effects.resolve)
    next.resolve = Math.max(
      0,
      Math.min(MAX_RESOLVE, next.resolve + effects.resolve),
    )
  return next
}

function enter(run: Run, target: string): Run {
  const node = scene(target)
  const endings =
    node.ending && !run.endings.includes(target)
      ? [...run.endings, target]
      : run.endings
  return applyEffects(
    {
      ...run,
      sceneId: target,
      endings,
      visited: [...run.visited, target],
      battle: node.battle
        ? {
            hp: node.battle.hp,
            exposed: false,
            turn: 1,
            log: 'A foe bars your path.',
          }
        : null,
    },
    node.effects,
  )
}

export function takeChoice(run: Run, id: string): Run {
  const node = scene(run.sceneId)
  if (run.battle || node.ending) return run
  const choice = visibleChoices(run, node).find((c) => c.id === id)
  if (!choice || lockReason(run, choice)) return run
  let next: Run = {
    ...run,
    items: [...run.items],
    flags: [...run.flags],
    resolve: run.resolve - (choice.cost ?? 0),
    health: Math.min(MAX_HEALTH, run.health + (choice.heal ?? 0)),
    lastRoll: null,
  }
  if (choice.spend) next.items.splice(next.items.indexOf(choice.spend), 1)
  if (choice.gain && next.items.length < SLOTS) next.items.push(choice.gain)
  if (choice.flag && !next.flags.includes(choice.flag))
    next.flags.push(choice.flag)
  let target = choice.to
  if (choice.check) {
    const result = roll(run.seed)
    const bonus =
      choice.check.bonus && run.flags.includes(choice.check.bonus.flag)
        ? choice.check.bonus.amount
        : 0
    const modifier = run.attributes[choice.check.attribute] + bonus
    const total = result.dice[0] + result.dice[1] + modifier
    const lastRoll: Roll = {
      dice: result.dice,
      modifier,
      total,
      target: choice.check.target,
      success: total >= choice.check.target,
      label: choice.check.attribute.toUpperCase(),
    }
    next = { ...next, seed: result.seed, lastRoll }
    target = lastRoll.success ? choice.check.success : choice.check.failure
  }
  return enter(next, target)
}

export type BattleAction = 'strike' | 'guard' | 'feint' | 'quiet-draw'
export function fight(run: Run, action: BattleAction): Run {
  const enemy = scene(run.sceneId).battle
  const battle = run.battle
  if (!enemy || !battle || (action === 'quiet-draw' && run.resolve < 2))
    return run
  const result = roll(run.seed)
  const modifier =
    action === 'feint'
      ? run.attributes.shadow
      : action === 'guard'
        ? run.attributes.sense
        : run.attributes.steel
  const target =
    action === 'guard' ? 8 : 7 + enemy.guard - (battle.exposed ? 2 : 0)
  const total = result.dice[0] + result.dice[1] + modifier
  const success = total >= target
  const damage =
    action === 'guard'
      ? 0
      : success
        ? action === 'feint'
          ? 1
          : action === 'quiet-draw'
            ? 6
            : 3
        : 0
  const enemyHp = Math.max(0, battle.hp - damage)
  const incoming =
    enemyHp === 0
      ? 0
      : action === 'guard' && success
        ? 0
        : action === 'guard'
          ? 1
          : Math.max(1, enemy.attack - (success && action === 'feint' ? 1 : 0))
  const health = Math.max(0, run.health - incoming)
  const next: Run = {
    ...run,
    health,
    seed: result.seed,
    resolve: run.resolve - (action === 'quiet-draw' ? 2 : 0),
    lastRoll: {
      dice: result.dice,
      modifier,
      target,
      total,
      success,
      label: action.toUpperCase(),
    },
    battle: {
      hp: enemyHp,
      exposed: action === 'feint' && success,
      turn: battle.turn + 1,
      log:
        (success ? 'Your move connects.' : 'Your move fails.') +
        (incoming
          ? ' You suffer ' + incoming + ' damage.'
          : ' You avoid the counterblow.'),
    },
  }
  if (!health) return enter(next, enemy.lose)
  if (!enemyHp) return enter(next, enemy.win)
  return next
}

export function isSavedRun(value: unknown): value is Run {
  if (!value || typeof value !== 'object') return false
  const s = value as Partial<Run>
  return (
    s.version === 1 &&
    typeof s.sceneId === 'string' &&
    !!BOOK[s.sceneId] &&
    typeof s.seed === 'number' &&
    Number.isFinite(s.seed) &&
    typeof s.health === 'number' &&
    s.health >= 0 &&
    s.health <= MAX_HEALTH &&
    typeof s.resolve === 'number' &&
    s.resolve >= 0 &&
    s.resolve <= MAX_RESOLVE &&
    !!s.attributes &&
    (['steel', 'sense', 'shadow', 'mercy'] as Attribute[]).every((k) =>
      Number.isFinite(s.attributes?.[k]),
    ) &&
    Array.isArray(s.items) &&
    s.items.length <= SLOTS &&
    s.items.every((x) => typeof x === 'string') &&
    Array.isArray(s.flags) &&
    s.flags.every((x) => typeof x === 'string') &&
    Array.isArray(s.visited) &&
    Array.isArray(s.endings) &&
    s.visited.every((x) => typeof x === 'string' && !!BOOK[x]) &&
    s.endings.every((x) => typeof x === 'string' && !!BOOK[x]?.ending) &&
    (s.battle === null ||
      (!!s.battle &&
        !!BOOK[s.sceneId]?.battle &&
        typeof s.battle.hp === 'number' &&
        Number.isFinite(s.battle.hp) &&
        s.battle.hp >= 0)) &&
    (s.lastRoll === null ||
      (!!s.lastRoll &&
        Array.isArray(s.lastRoll.dice) &&
        s.lastRoll.dice.length === 2))
  )
}
