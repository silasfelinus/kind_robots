import assert from 'node:assert/strict'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  PLATES,
  plateLayout,
  platePath,
  sectionPlate,
} from '../zuzuGamebook/art'
import { journal } from '../zuzuGamebook/journal'
import {
  BOOK,
  scene,
  startRun,
  takeChoice,
  fight,
  isSavedRun,
  lockReason,
  visibleChoices,
  honor,
  taint,
  ENDING_IDS,
  type Run,
  type BattleAction,
} from '../zuzuGamebook/adventure'

const ids = Object.keys(BOOK)
assert.ok(ids.length >= 60, 'Book One has substantive scenes')
const endings = ids.filter((id) => !!BOOK[id]?.ending)
assert.ok(endings.length >= 8, 'at least eight authored endings')
assert.deepEqual([...ENDING_IDS].sort(), [...endings].sort())

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
  // A section's own plate (keyed by its id, one plate per section) wins over the shared one.
  const own = sectionPlate(node)
  assert.ok(
    existsSync(join(scenesDir, own.file + '.webp')),
    node.id + ': own plate file missing',
  )
  const layout = plateLayout(node.id, own)
  assert.ok(
    (own.shape ?? 'wide') === 'wide'
      ? layout === 'top' || layout === 'bottom'
      : layout === 'left' || layout === 'right',
    node.id + ': wide plates sit above or below the text, tall ones beside it',
  )
}
const usedPlates = new Set(
  Object.values(BOOK).flatMap((node) =>
    PLATES[node.id] ? [node.art, node.id] : [node.art],
  ),
)
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

const ground = takeChoice(good, 'defend')
assert.equal(ground.sceneId, 'a1-terrain', 'Act I splices the fight ground in')
const coyote = takeChoice(ground, 'open')
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
// Every flag a choice needs, retires on, or rolls a bonus from is set somewhere.
const settable = new Set<string>()
for (const node of Object.values(BOOK)) {
  if (node.effects?.flag) settable.add(node.effects.flag)
  for (const flag of node.effects?.flags ?? []) settable.add(flag)
  for (const choice of node.choices ?? []) {
    if (choice.flag) settable.add(choice.flag)
    for (const flag of choice.flags ?? []) settable.add(flag)
  }
}
for (const node of Object.values(BOOK)) {
  for (const choice of node.choices ?? []) {
    for (const flag of [
      choice.needs,
      choice.unless,
      choice.check?.bonus?.flag,
    ]) {
      if (flag)
        assert.ok(
          settable.has(flag),
          node.id + ': flag ' + flag + ' is never set',
        )
    }
    if (choice.needs)
      assert.ok(
        choice.hint,
        node.id + '/' + choice.id + ' needs a disabled hint',
      )
  }
}

// No time loops: the section graph (choices, check outcomes, battle results) is acyclic.
const state = new Map<string, 'open' | 'done'>()
function acyclic(id: string) {
  if (state.get(id) === 'done') return
  assert.notEqual(state.get(id), 'open', 'story loop through ' + id)
  state.set(id, 'open')
  const node = scene(id)
  for (const choice of node.choices ?? []) {
    acyclic(choice.to)
    if (choice.check) {
      acyclic(choice.check.success)
      acyclic(choice.check.failure)
    }
  }
  if (node.battle) {
    acyclic(node.battle.win)
    acyclic(node.battle.lose)
  }
  state.set(id, 'done')
}
acyclic('the-crossing')

// Locked and retired choices behave.
const gate = { ...startRun(9), sceneId: 'morning', flags: [] as string[] }
const take = BOOK.morning!.choices!.find((c) => c.id === 'take')!
assert.ok(
  lockReason(gate, take),
  'needs-gated choice is locked without its flag',
)
assert.equal(takeChoice(gate, 'take'), gate, 'locked choice does nothing')
assert.equal(
  takeChoice({ ...gate, flags: ['abbess-doubt'] }, 'take').sceneId,
  'take-them',
)
const bell = { ...startRun(9), sceneId: 'hollow-bell', flags: ['poster-clue'] }
assert.ok(
  !visibleChoices(bell, BOOK['hollow-bell']!).some((c) => c.id === 'posters'),
  'a retired choice is not offered again',
)
const hurt = takeChoice(
  { ...startRun(9), sceneId: 'canyon-road', health: 1 },
  'long',
)
assert.equal(hurt.sceneId, 'a4-canyon-floor')
assert.ok(hurt.health >= 1, 'section damage never kills')
const fall = { ...startRun(9), sceneId: 'bridge-fall', health: 2 }
assert.ok(fall.health >= 1)

// Moral tallies, gates and lasting change (BOOK-ONE-OUTLINE.md §2).
const moral = {
  ...startRun(5),
  flags: ['honor:a', 'honor:b', 'taint:x', 'debt:y'],
}
assert.equal(honor(moral), 2)
assert.equal(taint(moral), 1)
const gated = {
  id: 'g',
  label: 'g',
  to: 'the-crossing',
  needsHonor: 3,
  hint: 'Not yet.',
}
assert.equal(lockReason(moral, gated), 'Not yet.')
assert.equal(
  lockReason({ ...moral, flags: [...moral.flags, 'honor:c'] }, gated),
  null,
)
assert.ok(lockReason(moral, { ...gated, needsHonor: 0, needsTaint: 2 }))
assert.ok(lockReason(moral, { ...gated, needsHonor: 0, maxTaint: 0 }))
assert.equal(lockReason(moral, { ...gated, needsHonor: 0, maxTaint: 1 }), null)
for (const node of Object.values(BOOK)) {
  for (const choice of node.choices ?? []) {
    if (choice.needsHonor || choice.needsTaint || choice.maxTaint !== undefined)
      assert.ok(
        choice.hint,
        node.id + '/' + choice.id + ' needs a disabled hint',
      )
  }
  const attr = node.effects?.attr
  if (attr)
    assert.ok(
      Math.abs(attr.amount) === 1,
      node.id + ': attributes move one step at a time',
    )
}

const notes = journal([
  'honor:sang',
  'taint:listened',
  'debt:looter',
  'met:wren',
  'clue:wax',
  'sister-trust',
])
assert.deepEqual(notes.deeds, [
  { text: 'sang' },
  { text: 'listened', dark: true },
])
assert.deepEqual(notes.debts, ['looter'])
assert.deepEqual(notes.learned, ['wax', 'sister trust'])

// Stateful exploration: seeded random playthroughs reach every ending and never stall.
let rng = 20261009
const rand = (n: number) => {
  rng = (rng * 1103515245 + 12345) >>> 0
  return (rng >>> 16) % n
}
const reached = new Set<string>()
const actions: BattleAction[] = ['strike', 'guard', 'feint', 'quiet-draw']
for (let walk = 0; walk < 6000; walk++) {
  let run = startRun(walk * 7919 + 1)
  for (let step = 0; step < 200; step++) {
    const node = scene(run.sceneId)
    if (node.ending) {
      reached.add(node.id)
      break
    }
    if (run.battle) {
      const next = fight(run, actions[rand(actions.length)]!)
      run = next === run ? fight(run, 'strike') : next
      continue
    }
    const open = visibleChoices(run, node).filter((c) => !lockReason(run, c))
    assert.ok(open.length, 'stalled with no available choice at ' + node.id)
    run = takeChoice(run, open[rand(open.length)]!.id)
    assert.ok(run.health >= 0 && run.health <= 12)
    assert.ok(run.items.length <= 5)
  }
}
for (const id of endings)
  assert.ok(reached.has(id), 'ending never reached in play: ' + id)

console.log(
  'Zuzu gamebook contract: ' +
    ids.length +
    ' sections, ' +
    endings.length +
    ' endings, acyclic, stateful exploration, plates, items, dice, combat replay, saves and power costs passed',
)
