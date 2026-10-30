import assert from 'node:assert/strict'
import {
  FIRST_BELL_MAP,
  chanceFrom,
  dashRange,
  clearSuppression,
  lineOfSight,
  moveAP,
  pathDistance,
  prepareOverwatch,
  reachableCells,
  refreshTurn,
  resolveAttack,
  resolveOverwatch,
  takeCover,
  tileAt,
  type Fighter,
  type TacticalMap,
} from '../everyVillainTactics/combat'
import {
  availableMove,
  endTurn,
  fireSelected,
  hunkerSelected,
  moveSelected,
  overwatchSelected,
  previewShot,
  trainingState,
} from '../everyVillainTactics/training'

const open: TacticalMap = {
  width: 5,
  height: 5,
  tiles: {
    '2,2': { elevation: 0, cover: { west: 'full', north: 'half' } },
  },
}
function unit(id: string, team: string, x: number, y: number): Fighter {
  return {
    id,
    team,
    x,
    y,
    hp: 3,
    ap: 2,
    moved: false,
    fired: false,
    overwatch: false,
    statuses: [],
  }
}
const target = unit('target', 'rival', 2, 2)
const west = chanceFrom(open, unit('west', 'squad', 1, 2), target)
const east = chanceFrom(open, unit('east', 'squad', 3, 2), target)
const north = chanceFrom(open, unit('north', 'squad', 2, 1), target)
assert.equal(west.cover, 40)
assert.equal(north.cover, 20)
assert.equal(east.cover, 0)
assert.equal(east.flank, 10)
assert.equal(west.flank, 0)
assert.equal(west.hit, 45)
assert.equal(east.hit, 95)

const hill: TacticalMap = {
  width: 4,
  height: 3,
  tiles: {
    '1,1': { elevation: 2 },
    '2,1': { elevation: 1 },
  },
}
const walker = unit('walker', 'squad', 0, 1)
assert.equal(
  pathDistance(hill, [walker], walker, { x: 1, y: 1 }),
  5,
  'two-level vertical step must route around the ridge and climb from the other side',
)
const isolatedCliff: TacticalMap = {
  width: 2,
  height: 1,
  tiles: {
    '1,0': { elevation: 2 },
  },
}
const isolatedWalker = unit('isolated-walker', 'squad', 0, 0)
assert.equal(
  pathDistance(isolatedCliff, [isolatedWalker], isolatedWalker, { x: 1, y: 0 }),
  Infinity,
  'a two-level cliff with no alternate route must remain impassable',
)
assert.ok(
  Number.isFinite(pathDistance(hill, [walker], walker, { x: 2, y: 1 })),
  'can go around elevation cliffs',
)
assert.equal(
  lineOfSight(hill, { x: 0, y: 1 }, { x: 3, y: 1 }),
  false,
  'ridge obscures a lower line',
)
assert.equal(lineOfSight(FIRST_BELL_MAP, { x: 1, y: 1 }, { x: 5, y: 1 }), false)
assert.equal(lineOfSight(FIRST_BELL_MAP, { x: 5, y: 1 }, { x: 1, y: 1 }), false)
assert.equal(tileAt(FIRST_BELL_MAP, { x: 6, y: 2 }).elevation, 1)
assert.equal(chanceFrom(hill, { x: 2, y: 1 }, { x: 3, y: 1 }).elevation, 10)
assert.equal(chanceFrom(hill, { x: 3, y: 1 }, { x: 2, y: 1 }).elevation, -10)

const block: TacticalMap = {
  width: 3,
  height: 3,
  tiles: { '1,0': { elevation: 0, wall: true } },
}
const player = unit('player', 'squad', 0, 0)
const ally = unit('ally', 'squad', 0, 1)
assert.equal(pathDistance(block, [player, ally], player, ally), Infinity)
assert.equal(
  pathDistance(block, [player, ally], player, { x: 1, y: 0 }),
  Infinity,
)
assert.equal(moveAP(0), Infinity)
assert.equal(moveAP(3), 1)
assert.equal(moveAP(4), 2)
assert.equal(moveAP(6), 2)
assert.equal(moveAP(7), Infinity)
assert.ok(
  reachableCells(block, [player, ally], player).every((c) => c.cost <= 2),
)
assert.equal(chanceFrom(open, { x: 0, y: 0 }, { x: 9, y: 2 }).hit, 0)

const shooter = unit('shooter', 'squad', 0, 0)
const rival = unit('enemy', 'rival', 2, 0)
const rng = { seed: 119 }
const predicted = chanceFrom(open, shooter, rival)
assert.equal(predicted.hit, 85)
const result = resolveAttack(rng, open, shooter, rival)!
assert.equal(result.chance.hit, predicted.hit)
assert.equal(result.hit, result.roll < predicted.hit * 100)
assert.equal(shooter.ap, 1)
assert.equal(shooter.fired, true)
const afterShot = rng.seed
assert.equal(resolveAttack(rng, open, shooter, rival), null)
assert.equal(rng.seed, afterShot, 'invalid actions must never advance RNG')
assert.equal(resolveAttack(rng, open, rival, rival), null)

const guardedTarget = unit('guarded', 'rival', 2, 0)
const tiredShooter = unit('tired', 'squad', 0, 0)
assert.ok(takeCover(guardedTarget))
assert.equal(guardedTarget.ap, 1)
assert.equal(chanceFrom(open, tiredShooter, guardedTarget).guarded, 15)
tiredShooter.statuses.push('suppressed')
assert.equal(chanceFrom(open, tiredShooter, guardedTarget).suppressed, 15)
assert.equal(chanceFrom(open, tiredShooter, guardedTarget).hit, 55)
refreshTurn([tiredShooter, guardedTarget], 'rival')
assert.deepEqual(guardedTarget.statuses, [])
assert.equal(guardedTarget.ap, 2)
assert.deepEqual(
  tiredShooter.statuses,
  ['suppressed'],
  'team refresh must not clear other side',
)
guardedTarget.statuses = ['suppressed']
refreshTurn([tiredShooter, guardedTarget], 'rival')
assert.deepEqual(
  guardedTarget.statuses,
  ['suppressed'],
  "suppression lasts through the affected side's next attack",
)
clearSuppression([tiredShooter, guardedTarget], 'rival')
assert.deepEqual(guardedTarget.statuses, [])
assert.deepEqual(tiredShooter.statuses, ['suppressed'])

const watcher = unit('watcher', 'squad', 0, 0)
const mover = unit('mover', 'rival', 3, 0)
const reactionRng = { seed: 735 }
assert.ok(prepareOverwatch(watcher))
const before = chanceFrom(open, watcher, mover)
const reaction = resolveOverwatch(reactionRng, open, watcher, mover)!
assert.equal(reaction.chance.hit, before.hit)
assert.equal(reaction.hit, reaction.roll < before.hit * 100)
assert.equal(watcher.overwatch, false)
assert.equal(resolveOverwatch(reactionRng, open, watcher, mover), null)
assert.equal(prepareOverwatch(watcher), false, 'cannot arm twice in one turn')
refreshTurn([watcher], 'squad')
assert.ok(prepareOverwatch(watcher))
const occluded: TacticalMap = {
  width: 4,
  height: 1,
  tiles: { '1,0': { elevation: 0, wall: true } },
}
const savedSeed = reactionRng.seed
assert.equal(resolveOverwatch(reactionRng, occluded, watcher, mover), null)
assert.equal(reactionRng.seed, savedSeed)
assert.equal(
  watcher.overwatch,
  true,
  'blocked overwatch must wait for later movement',
)

const game = trainingState(67)
assert.ok(availableMove(game, { x: 2, y: 4 }))
assert.ok(moveSelected(game, { x: 2, y: 4 }))
assert.equal(game.units[0]!.ap, 1)
assert.equal(previewShot(game.units[0]!, game.units[5]!).hit, 64)
const hpBefore = game.units[5]!.hp
assert.ok(fireSelected(game, game.units[5]!))
assert.equal(game.units[0]!.ap, 0)
assert.ok(game.units[5]!.hp <= hpBefore)
assert.equal(fireSelected(game, game.units[5]!), false)
assert.equal(overwatchSelected(game), false)

const actions = trainingState(111)
assert.ok(hunkerSelected(actions))
assert.equal(actions.units[0]!.statuses[0], 'guarded')
assert.equal(actions.units[0]!.ap, 1)
assert.ok(overwatchSelected(actions))
assert.equal(actions.units[0]!.ap, 0)
const initialRivals = actions.units
  .filter((u) => u.team === 'rival')
  .map((u) => ({ id: u.id, x: u.x, y: u.y }))
endTurn(actions)
assert.equal(actions.turn, 2)
assert.equal(actions.units[0]!.ap, 2)
assert.deepEqual(actions.units[0]!.statuses, [])
for (const old of initialRivals) {
  const rivalNow = actions.units.find((u) => u.id === old.id)!
  assert.ok(
    Math.abs(rivalNow.x - old.x) + Math.abs(rivalNow.y - old.y) <=
      dashRange(rivalNow),
    'enemy may never teleport beyond dash range',
  )
}
const parallel = trainingState(111)
hunkerSelected(parallel)
overwatchSelected(parallel)
endTurn(parallel)
assert.deepEqual(
  actions.units,
  parallel.units,
  'same seed and actions yield identical squad results',
)
assert.equal(actions.seed, parallel.seed)
console.log(
  'Every Villain Combat: directional cover, height, AP, LOS, statuses, reactions and deterministic AI verified.',
)
