import {
  BOOK,
  fight,
  lockReason,
  resolveLoot,
  scene,
  startRun,
  takeChoice,
  visibleChoices,
  type BattleAction,
  type Run,
} from './adventure'

export type PlaytestMove =
  | { kind: 'choice'; id: string }
  | { kind: 'fight'; action: BattleAction }
  | { kind: 'loot'; replace: number | null }

export type EndingWitness = {
  seed: number
  ending: string
  moves: PlaytestMove[]
  visited: string[]
  health: number
  resolve: number
}

export function applyPlaytestMove(run: Run, move: PlaytestMove): Run {
  return move.kind === 'choice'
    ? takeChoice(run, move.id)
    : move.kind === 'fight'
      ? fight(run, move.action)
      : resolveLoot(run, move.replace)
}

export function replayWitness(
  seed: number,
  moves: readonly PlaytestMove[],
): Run {
  let run = startRun(seed)
  for (const move of moves) {
    const next = applyPlaytestMove(run, move)
    if (next === run)
      throw new Error(
        'Rejected move at ' + run.sceneId + ': ' + JSON.stringify(move),
      )
    run = next
  }
  return run
}

export function witnessFromRun(
  seed: number,
  moves: readonly PlaytestMove[],
  run: Run,
): EndingWitness {
  if (!scene(run.sceneId).ending)
    throw new Error('Nonterminal witness: ' + run.sceneId)
  return {
    seed,
    moves: [...moves],
    ending: run.sceneId,
    visited: [...run.visited],
    health: run.health,
    resolve: run.resolve,
  }
}

/** Compact golden traces: each reducer action takes exactly two characters.
 * Choice offsets include disabled choices, so choice reordering is caught.
 */
const FIGHT_ACTIONS: readonly BattleAction[] = [
  'strike',
  'guard',
  'feint',
  'quiet-draw',
]

export function encodeWitness(witness: EndingWitness): string {
  let run = startRun(witness.seed)
  const tokens: string[] = []
  for (const move of witness.moves) {
    let kind: string
    let offset: number
    if (move.kind === 'choice') {
      kind = 'c'
      offset = visibleChoices(run, scene(run.sceneId)).findIndex(
        (choice) => choice.id === move.id,
      )
    } else if (move.kind === 'fight') {
      kind = 'f'
      offset = FIGHT_ACTIONS.indexOf(move.action)
    } else {
      kind = 'l'
      offset = move.replace === null ? 0 : move.replace + 1
    }
    if (offset < 0 || offset > 35)
      throw new Error('Cannot encode move at ' + run.sceneId)
    const next = applyPlaytestMove(run, move)
    if (next === run) throw new Error('Cannot encode rejected move')
    tokens.push(kind + offset.toString(36))
    run = next
  }
  if (run.sceneId !== witness.ending)
    throw new Error('Witness ended somewhere unexpected: ' + run.sceneId)
  return tokens.join('')
}

export function replayEncodedWitness(seed: number, encoded: string): Run {
  if (encoded.length % 2) throw new Error('Truncated witness trace')
  let run = startRun(seed)
  for (let i = 0; i < encoded.length; i += 2) {
    const kind = encoded[i]
    const index = Number.parseInt(encoded[i + 1]!, 36)
    if (!Number.isInteger(index) || index < 0)
      throw new Error('Bad witness action at offset ' + i)
    let move: PlaytestMove
    if (kind === 'c') {
      const choice = visibleChoices(run, scene(run.sceneId))[index]
      if (!choice)
        throw new Error('Unknown choice in witness at ' + run.sceneId)
      move = { kind: 'choice', id: choice.id }
    } else if (kind === 'f') {
      const action = FIGHT_ACTIONS[index]
      if (!action) throw new Error('Unknown battle move in witness')
      move = { kind: 'fight', action }
    } else if (kind === 'l') {
      if (index > run.items.length)
        throw new Error('Unknown loot slot in witness')
      move = { kind: 'loot', replace: index === 0 ? null : index - 1 }
    } else {
      throw new Error('Unknown witness action: ' + kind)
    }
    const next = applyPlaytestMove(run, move)
    if (next === run)
      throw new Error(
        'Witness move rejected at ' + run.sceneId + ' offset ' + i,
      )
    run = next
  }
  return run
}

/** A stable snapshot of the *route and consequences*, not just its ending. */
export function witnessFingerprint(run: Run): string {
  const text = [
    run.visited.join('>'),
    run.flags.join('|'),
    run.items.join('|'),
    run.sceneId,
    run.health,
    run.resolve,
    run.seed,
  ].join('~')
  let hash = 2166136261
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

/** Search only real reducer moves. Graph distance prioritizes branches without faking flags or rolls. */
export function findEndingWitness(
  ending: string,
  seeds = 64,
  maxStatesPerSeed = 12000,
): EndingWitness | null {
  if (!BOOK[ending]?.ending) throw new Error('Unknown ending: ' + ending)
  const distances = new Map<string, Map<string, number>>()
  const distance = (target: string, from: string): number => {
    let memo = distances.get(target)
    if (!memo) {
      memo = new Map()
      distances.set(target, memo)
    }
    const cached = memo.get(from)
    if (cached !== undefined) return cached
    if (target === from) return 0
    const node = BOOK[from]
    if (!node || node.ending) return Infinity
    const destinations = [
      ...(node.choices ?? []).flatMap((c) =>
        c.check ? [c.check.success, c.check.failure] : [c.to],
      ),
      ...(node.battle ? [node.battle.win, node.battle.lose] : []),
    ]
    const d = destinations.length
      ? 1 + Math.min(...destinations.map((x) => distance(target, x)))
      : Infinity
    memo.set(from, d)
    return d
  }

  for (let n = 0; n < seeds; n++) {
    const seed = n * 7919 + 1
    let explored = 0
    const rejected = new Set<string>()
    const moves: PlaytestMove[] = []
    const search = (run: Run): EndingWitness | null => {
      if (++explored > maxStatesPerSeed || moves.length > 190) return null
      if (run.sceneId === ending) return witnessFromRun(seed, moves, run)
      const node = scene(run.sceneId)
      if (node.ending) return null
      const goal =
        ending === 'ending-wren-lamp' && !run.flags.includes('wren-ally')
          ? 'a5-wren-talk'
          : ending
      if (!Number.isFinite(distance(goal, run.sceneId))) return null
      const key = [
        run.sceneId,
        run.seed,
        run.health,
        run.resolve,
        run.battle?.hp ?? '',
        run.battle?.exposed ?? '',
        run.items.join(','),
        run.pendingLoot.join(','),
        run.flags.join(','),
      ].join('|')
      if (rejected.has(key)) return null
      const options: { move: PlaytestMove; cost: number }[] = []
      if (run.pendingLoot.length) {
        options.push({ move: { kind: 'loot', replace: null }, cost: 0 })
        for (let i = 0; i < run.items.length; i++)
          options.push({ move: { kind: 'loot', replace: i }, cost: 1 })
      } else if (run.battle) {
        const losing = Number.isFinite(distance(goal, node.battle!.lose))
        const moveset: BattleAction[] = losing
          ? ['guard', 'strike', 'feint', 'quiet-draw']
          : ['quiet-draw', 'strike', 'feint', 'guard']
        for (const action of moveset) {
          if (action === 'quiet-draw' && run.resolve < 2) continue
          options.push({ move: { kind: 'fight', action }, cost: 0 })
        }
      } else {
        for (const choice of visibleChoices(run, node)) {
          if (lockReason(run, choice)) continue
          const d = choice.check
            ? Math.min(
                distance(goal, choice.check.success),
                distance(goal, choice.check.failure),
              )
            : distance(goal, choice.to)
          if (Number.isFinite(d))
            options.push({ move: { kind: 'choice', id: choice.id }, cost: d })
        }
        options.sort((a, b) => a.cost - b.cost)
      }
      for (const option of options) {
        const next = applyPlaytestMove(run, option.move)
        if (next === run) continue
        moves.push(option.move)
        const found = search(next)
        if (found) return found
        moves.pop()
      }
      rejected.add(key)
      return null
    }
    const found = search(startRun(seed))
    if (found) return found
  }
  return null
}

export type CombatPolicy =
  'strike' | 'quiet-draw' | 'feint-strike' | 'guard-strike'
export function combatBenchmark(
  sceneId: string,
  policy: CombatPolicy,
  seeds = 400,
  initialHealth = 12,
  initialResolve = 4,
) {
  if (
    !Number.isInteger(initialHealth) ||
    initialHealth < 1 ||
    initialHealth > 12
  )
    throw new Error('Combat health must be between 1 and 12')
  if (
    !Number.isInteger(initialResolve) ||
    initialResolve < 0 ||
    initialResolve > 4
  )
    throw new Error('Combat Resolve must be between 0 and 4')
  const foe = scene(sceneId).battle
  if (!foe) throw new Error('No fight at ' + sceneId)
  let wins = 0,
    rounds = 0,
    health = 0
  for (let n = 1; n <= seeds; n++) {
    let run: Run = {
      ...startRun(n * 733 + 1),
      sceneId,
      health: initialHealth,
      resolve: initialResolve,
      battle: { hp: foe.hp, exposed: false, turn: 1, log: '' },
    }
    let steps = 0
    while (run.battle && steps++ < 40) {
      const action: BattleAction =
        policy === 'strike'
          ? 'strike'
          : policy === 'quiet-draw'
            ? run.resolve >= 2
              ? 'quiet-draw'
              : 'strike'
            : policy === 'feint-strike'
              ? run.battle.exposed
                ? 'strike'
                : 'feint'
              : run.battle.exposed
                ? 'strike'
                : 'guard'
      run = fight(run, action)
    }
    if (run.battle) throw new Error('Fight never ended: ' + policy)
    rounds += steps
    health += run.health
    if (run.sceneId === foe.win) wins++
  }
  return {
    wins,
    winRate: wins / seeds,
    averageRounds: rounds / seeds,
    averageHealth: health / seeds,
  }
}
