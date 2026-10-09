import assert from 'node:assert/strict'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { PLATES, platePath } from '../zuzuGamebook/art'
import {
  BOOK,
  scene,
  startRun,
  takeChoice,
  fight,
  isSavedRun,
  type Run,
} from '../zuzuGamebook/adventure'

const ids = Object.keys(BOOK)
assert.ok(ids.length >= 18, 'preview has substantive scenes')
const endings = ids.filter((id) => !!BOOK[id]?.ending)
assert.equal(endings.length, 6, 'preview has six authored outcomes')

for (const node of Object.values(BOOK)) {
  assert.ok(
    node.art && node.text.length > 80,
    node.id + ' needs a scene and readable prose',
  )
  assert.equal(
    !!node.ending,
    !node.choices && !node.battle,
    node.id + ' needs an ending or an action',
  )
  for (const choice of node.choices ?? []) {
    assert.ok(BOOK[choice.to], node.id + ': missing ' + choice.to)
    if (choice.check) {
      assert.ok(
        BOOK[choice.check.success] && BOOK[choice.check.failure],
        node.id + ': missing outcome',
      )
      assert.ok(
        choice.check.target >= 7 && choice.check.target <= 13,
        node.id + ': invalid difficulty',
      )
    }
  }
  if (node.battle) {
    assert.ok(
      BOOK[node.battle.win] && BOOK[node.battle.lose],
      node.id + ': combat outcome missing',
    )
  }
}

const scenesDir = join(process.cwd(), 'public', 'zuzu-gamebook', 'scenes')
for (const node of Object.values(BOOK)) {
  const art = PLATES[node.art]
  assert.ok(art, node.id + ': unknown plate ' + node.art)
  assert.ok(art.alt.length > 40, node.art + ' needs descriptive alt text')
  assert.ok(art.artImageId > 0, node.art + ' needs its ArtImage provenance')
  assert.ok(
    existsSync(join(scenesDir, art.file + '.webp')),
    node.art + ': plate file missing',
  )
  assert.equal(platePath(art), '/zuzu-gamebook/scenes/' + art.file + '.webp')
}
const usedPlates = new Set(Object.values(BOOK).map((node) => node.art))
for (const key of Object.keys(PLATES)) {
  assert.ok(usedPlates.has(key), 'plate ' + key + ' is not used by any scene')
}
for (const file of readdirSync(scenesDir)) {
  assert.ok(
    Object.values(PLATES).some((p) => p.file + '.webp' === file),
    'stray plate file ' + file,
  )
}

const reachable = new Set<string>()
function walk(id: string) {
  if (reachable.has(id)) return
  reachable.add(id)
  const node = scene(id)
  for (const choice of node.choices ?? []) {
    walk(choice.to)
    if (choice.check) {
      walk(choice.check.success)
      walk(choice.check.failure)
    }
  }
  if (node.battle) {
    walk(node.battle.win)
    walk(node.battle.lose)
  }
}
walk('the-crossing')
assert.equal(reachable.size, ids.length, 'no orphan scene or ending')

const initial = startRun(123)
assert.equal(initial.health, 12)
assert.equal(initial.items.length, 4)
assert.equal(initial.resolve, 4)
assert.ok(isSavedRun(JSON.parse(JSON.stringify(initial))))
assert.equal(isSavedRun({ ...initial, sceneId: 'missing' }), false)
assert.equal(isSavedRun({ ...initial, health: 500 }), false)

const noWater = { ...initial, items: [] }
assert.equal(
  takeChoice(noWater, 'approach'),
  noWater,
  'unavailable items block choices',
)
const good = takeChoice(initial, 'approach')
assert.equal(good.sceneId, 'coyote')
assert.ok(good.flags.includes('coyote-kindness'))
assert.ok(!good.items.includes('water'))
assert.equal(initial.items.includes('water'), true, 'transitions are immutable')

const coyote = takeChoice(good, 'defend')
assert.equal(coyote.sceneId, 'crocodile')
assert.equal(coyote.battle?.hp, 8)
assert.equal(
  takeChoice(coyote, 'missing'),
  coyote,
  'cannot bypass an active battle',
)

const c1 = takeChoice(startRun(888), 'listen')
const c2 = takeChoice(startRun(888), 'listen')
assert.deepEqual(c1, c2, 'dice are deterministic for identical seed and move')

const battle = { ...coyote, health: 12, resolve: 4 }
let fightA: Run = battle
let fightB: Run = battle
for (const action of [
  'feint',
  'strike',
  'quiet-draw',
  'guard',
  'strike',
  'strike',
] as const) {
  fightA = fight(fightA, action)
  fightB = fight(fightB, action)
  assert.deepEqual(fightA, fightB, 'replayed combat diverged on ' + action)
  assert.ok(fightA.health >= 0 && fightA.health <= 12)
  assert.ok(fightA.resolve >= 0 && fightA.resolve <= 4)
}
const spent = fight(coyote, 'quiet-draw')
assert.equal(spent.resolve, 2)
const blocked = fight({ ...coyote, resolve: 0 }, 'quiet-draw')
assert.equal(blocked.resolve, 0, 'power cannot overdraft Resolve')
assert.equal(
  blocked,
  blocked.battle?.turn === coyote.battle?.turn ? blocked : coyote,
  'unaffordable move does not advance',
)
console.log(
  'Zuzu gamebook contract: scene graph, plates, six endings, items, dice, combat replay, saves and power costs passed',
)
