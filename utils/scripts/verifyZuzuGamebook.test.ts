import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  PLATES,
  plateLayout,
  platePath,
  sectionPlate,
} from '../zuzuGamebook/art'
import { SECTION_PLATES } from '../zuzuGamebook/sectionArt'
import {
  applyPlaytestMove,
  combatBenchmark,
  encodeWitness,
  findEndingWitness,
  replayEncodedWitness,
  witnessFingerprint,
  replayWitness,
  witnessFromRun,
  type EndingWitness,
  type PlaytestMove,
} from '../zuzuGamebook/adversarial'
import { journal } from '../zuzuGamebook/journal'
import { emphasis } from '../zuzuGamebook/prose'
import {
  BOOK,
  scene,
  startRun,
  takeChoice,
  fight,
  isSavedRun,
  lockReason,
  resolveLoot,
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

const titleOwners = new Map<string, string>()
for (const node of Object.values(BOOK)) {
  const owner = titleOwners.get(node.title)
  assert.ok(!owner, node.id + ' reuses the title of ' + owner)
  titleOwners.set(node.title, node.id)
}
// Spoken and remembered words are set in *asterisks*; the reader turns each pair into italics.
for (const node of Object.values(BOOK)) {
  assert.equal(
    (node.text.match(/\*/g) ?? []).length % 2,
    0,
    node.id + ': unbalanced * emphasis',
  )
  assert.ok(
    emphasis(node.text).every((part) => !part.text.includes('*')),
    node.id + ': emphasis left a stray *',
  )
  assert.equal(
    emphasis(node.text)
      .map((part) => part.text)
      .join(''),
    node.text.replace(/\*/g, ''),
    node.id + ': emphasis changed the words',
  )
}
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
  assert.equal(
    plateLayout(own),
    (own.shape ?? 'wide') === 'wide' ? 'top' : 'right',
    node.id +
      ': wide plates sit above the text, tall and square ones to its right',
  )
}
const usedPlates = new Set(Object.values(BOOK).map((node) => node.art))
for (const key of Object.keys(PLATES)) {
  assert.ok(usedPlates.has(key), 'plate ' + key + ' is not used by any scene')
}
for (const file of readdirSync(scenesDir, { withFileTypes: true })) {
  if (file.isDirectory()) continue
  assert.ok(
    Object.values(PLATES).some((p) => p.file + '.webp' === file.name),
    'stray plate file ' + file.name,
  )
}
// One plate per section: keyed by a real section id, filed under scenes/sections/, reviewed provenance.
for (const [id, own] of Object.entries(SECTION_PLATES)) {
  assert.ok(BOOK[id], 'section plate for unknown section ' + id)
  assert.equal(
    own.file,
    'sections/' + id,
    id + ': section plates live in scenes/sections/',
  )
  assert.equal(own.fit, 'exact', id + ': a section plate depicts its section')
  assert.ok(
    own.alt.length > 40 && own.artImageId > 0,
    id + ': alt text and provenance',
  )
}
const sectionsDir = join(scenesDir, 'sections')
for (const file of existsSync(sectionsDir) ? readdirSync(sectionsDir) : []) {
  assert.ok(
    SECTION_PLATES[file.replace(/\.webp$/, '')],
    'stray section plate file ' + file,
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
assert.equal(isSavedRun({ ...initial, pendingLoot: [123] }), false)
const legacySave = JSON.parse(JSON.stringify(initial)) as Record<
  string,
  unknown
>
delete legacySave.pendingLoot
assert.ok(
  isSavedRun(legacySave),
  'older V1 saves without pending loot are valid',
)

// An at-capacity pickup must never vanish without the player's consent.
const fullItems = ['water', 'bandage', 'apple', 'flint', 'clapper']
const fullPack: Run = {
  ...startRun(77),
  sceneId: 'apple-tree',
  items: [...fullItems],
}
const offered = takeChoice(fullPack, 'take')
assert.deepEqual(offered.items, fullItems)
assert.deepEqual(offered.pendingLoot, ['apple'])
assert.deepEqual(fullPack.pendingLoot, [], 'pickup did not mutate old state')
assert.equal(
  takeChoice(offered, 'on'),
  offered,
  'pending loot blocks story advancement',
)
assert.equal(
  resolveLoot(offered, -1),
  offered,
  'invalid replacement cannot skip loot',
)
assert.equal(
  resolveLoot(offered, 99),
  offered,
  'invalid index cannot discard items',
)
const replaced = resolveLoot(offered, 4)
assert.deepEqual(replaced.items, [
  'water',
  'bandage',
  'apple',
  'flint',
  'apple',
])
assert.deepEqual(replaced.pendingLoot, [])
assert.deepEqual(offered.items, fullItems, 'exchange leaves old run untouched')
const abandoned = resolveLoot(offered, null)
assert.deepEqual(abandoned.items, fullItems)
assert.deepEqual(abandoned.pendingLoot, [])
assert.equal(resolveLoot(abandoned, null), abandoned, 'empty queue is a no-op')
const multiple = {
  ...offered,
  pendingLoot: ['apple', 'water'],
}
assert.deepEqual(resolveLoot(multiple, null).pendingLoot, ['water'])
assert.deepEqual(resolveLoot(resolveLoot(multiple, 0), 1).pendingLoot, [])
const wagonPickup = Array.from({ length: 40 }, (_, i) =>
  takeChoice(
    { ...startRun(i + 1), sceneId: 'wagon', items: [...fullItems] },
    'search',
  ),
).find((result) => result.sceneId === 'wagon-find')
assert.ok(wagonPickup, 'some seeded wagon search succeeds')
assert.deepEqual(
  wagonPickup.pendingLoot,
  ['water'],
  'scene-entry loot must also wait for a full-pack decision',
)

const noWater = { ...initial, items: [] }
assert.equal(
  takeChoice(noWater, 'approach'),
  noWater,
  'unavailable items block choices',
)
const looter = { ...startRun(123), sceneId: 'a2-looter' }
const passingBy = takeChoice(looter, 'walk-on')
assert.equal(
  passingBy.sceneId,
  'survivors',
  'ignoring the raccoon advances the story',
)
assert.ok(!passingBy.flags.includes('met:looter'))
assert.ok(!passingBy.flags.includes('debt:looter'))
assert.ok(
  !visibleChoices(passingBy, scene(passingBy.sceneId)).some(
    (choice) => choice.to === 'a2-looter',
  ),
)
const observedLooter = takeChoice(looter, 'watch')
assert.equal(observedLooter.sceneId, 'a2-looter-watch')
assert.equal(
  takeChoice(observedLooter, 'walk-on').sceneId,
  'survivors',
  'observing the raccoon also allows walking away without confrontation',
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
assert.deepEqual(notes.debts, ['Jeffery Mittens'])
assert.deepEqual(notes.learned, ['wax', 'sister trust'])

// Seeded player journeys use actual dice and inventory decisions. Capture a
// replayable witness for each ending rather than trusting synthetic scene flags.
let rng = 20261009
const rand = (n: number) => {
  rng = (rng * 1103515245 + 12345) >>> 0
  return (rng >>> 16) % n
}
const witnessed = new Map<string, EndingWitness>()
const actions: BattleAction[] = ['strike', 'guard', 'feint', 'quiet-draw']
for (let walk = 0; walk < 6000; walk++) {
  const seed = walk * 7919 + 1
  let run = startRun(seed)
  const moves: PlaytestMove[] = []
  for (let step = 0; step < 200; step++) {
    const node = scene(run.sceneId)
    if (node.ending) {
      if (!witnessed.has(node.id))
        witnessed.set(node.id, witnessFromRun(seed, moves, run))
      break
    }
    let move: PlaytestMove
    if (run.pendingLoot.length) {
      const slot = rand(run.items.length + 1)
      move = { kind: 'loot', replace: slot === run.items.length ? null : slot }
    } else if (run.battle) {
      const proposed = actions[rand(actions.length)]!
      move = {
        kind: 'fight',
        action:
          proposed === 'quiet-draw' && run.resolve < 2 ? 'strike' : proposed,
      }
    } else {
      const open = visibleChoices(run, node).filter((c) => !lockReason(run, c))
      assert.ok(open.length, 'stalled with no available choice at ' + node.id)
      move = { kind: 'choice', id: open[rand(open.length)]!.id }
    }
    const next = applyPlaytestMove(run, move)
    assert.notEqual(next, run, 'random walker attempted a rejected move')
    moves.push(move)
    run = next
    assert.ok(run.health >= 0 && run.health <= 12)
    assert.ok(run.items.length <= 5)
  }
}
for (const id of endings) {
  const witness = witnessed.get(id) ?? findEndingWitness(id)
  assert.ok(witness, 'No legal seed-and-choice playthrough reaches ' + id)
  assert.equal(witness.ending, id)
  const replayed = replayWitness(witness.seed, witness.moves)
  assert.equal(replayed.sceneId, id, 'replayed witness diverged for ' + id)
  assert.deepEqual(replayed.visited, witness.visited)
  assert.equal(replayed.health, witness.health)
  assert.equal(replayed.resolve, witness.resolve)
  const trace = encodeWitness(witness)
  const compactReplay = replayEncodedWitness(witness.seed, trace)
  assert.equal(witnessFingerprint(compactReplay), witnessFingerprint(replayed))
  console.log(
    'GAMEBOOK_GOLDEN ' +
      JSON.stringify({
        ending: id,
        seed: witness.seed,
        trace,
        health: witness.health,
        resolve: witness.resolve,
        scenes: witness.visited.length,
        fingerprint: witnessFingerprint(replayed),
      }),
  )
  assert.ok(witness.visited[0] === 'the-crossing')
  if (id === 'ending-wren-lamp') {
    assert.ok(
      witness.visited.includes('a5-wren-talk'),
      'Wren must actually trust Zuzu',
    )
    assert.ok(replayed.flags.includes('wren-ally'))
  }
  console.log(
    'Gamebook witness ' +
      id +
      ': seed=' +
      witness.seed +
      ', moves=' +
      witness.moves.length +
      ', health=' +
      witness.health,
  )
}

// Check that every policy resolves each authored combat, including starting hurt.
// The report is for designers; deterministic outcome bounds prevent a silent
// regression to unwinnable battles.
for (const node of Object.values(BOOK).filter((entry) => !!entry.battle)) {
  const results = [
    combatBenchmark(node.id, 'strike', 250),
    combatBenchmark(node.id, 'quiet-draw', 250),
    combatBenchmark(node.id, 'feint-strike', 250),
    combatBenchmark(node.id, 'guard-strike', 250),
  ]
  for (const outcome of results) {
    assert.ok(Number.isFinite(outcome.averageRounds))
    assert.ok(outcome.averageRounds > 0 && outcome.averageRounds < 40)
    assert.ok(outcome.winRate >= 0 && outcome.winRate <= 1)
  }
  assert.ok(
    results.some((outcome) => outcome.wins > 0),
    node.id + ': unwinnable',
  )
  console.log(
    'Gamebook combat ' +
      node.id +
      ': ' +
      results
        .map(
          (r) =>
            Math.round(r.winRate * 100) +
            '%/' +
            r.averageHealth.toFixed(1) +
            'hp',
        )
        .join(' | '),
  )
}
// Wounded and exhausted players must still resolve battles deterministically.
// We do not require an injured Zuzu to beat five jackals: failures can be story.
for (const node of Object.values(BOOK).filter((entry) => !!entry.battle)) {
  for (const resolve of [0, 2, 4]) {
    for (const health of [3, 6, 9, 12]) {
      const strike = combatBenchmark(node.id, 'strike', 90, health, resolve)
      const exhausted = combatBenchmark(
        node.id,
        'quiet-draw',
        90,
        health,
        resolve,
      )
      const feint = combatBenchmark(
        node.id,
        'feint-strike',
        90,
        health,
        resolve,
      )
      const guard = combatBenchmark(
        node.id,
        'guard-strike',
        90,
        health,
        resolve,
      )
      for (const outcome of [strike, exhausted, feint, guard]) {
        assert.ok(outcome.averageRounds > 0 && outcome.averageRounds < 40)
        assert.ok(outcome.averageHealth >= 0 && outcome.averageHealth <= health)
        assert.ok(outcome.wins >= 0 && outcome.wins <= 90)
      }
      if (resolve === 0)
        assert.deepEqual(
          exhausted,
          strike,
          'Quiet Draw cannot bypass 0 Resolve',
        )
      if (health === 3 || health === 12)
        console.log(
          'Gamebook wounded ' +
            node.id +
            ': health=' +
            health +
            ', resolve=' +
            resolve +
            ', strike=' +
            strike.wins +
            ', feint=' +
            feint.wins +
            ', guard=' +
            guard.wins +
            ', draw=' +
            exhausted.wins,
        )
    }
  }
}
assert.throws(() => combatBenchmark('crocodile', 'strike', 10, 0))
assert.throws(() => combatBenchmark('crocodile', 'strike', 10, 12, 5))

const guardTestRuns = Array.from({ length: 120 }, (_, i) =>
  fight({ ...coyote, seed: i + 1 }, 'guard'),
)
assert.ok(
  guardTestRuns.some(
    (result) => result.battle?.exposed && result.health === coyote.health,
  ),
  'successful guard should block damage and open a counterattack',
)
const feintTestRuns = Array.from({ length: 120 }, (_, i) =>
  fight({ ...coyote, seed: i + 1 }, 'feint'),
)
assert.ok(
  feintTestRuns.some(
    (result) =>
      result.battle?.exposed &&
      result.battle.hp === 5 &&
      result.health >= coyote.health - 1,
  ),
  'successful feint should deal 3, expose and reduce retaliation',
)

// The Keeper of the Empty Bell: from the tower, only when the children were freed.
const towerRun: Run = { ...startRun(11), sceneId: 'a9-tower', flags: [] }
const keeperChoice = scene('a9-tower').choices?.find((c) => c.id === 'keeper')
assert.ok(keeperChoice, 'the tower offers the keeper choice')
assert.equal(keeperChoice.to, 'ending-bell-keeper')
assert.ok(lockReason(towerRun, keeperChoice), 'locked without children-freed')
const freedRun: Run = { ...towerRun, flags: ['children-freed'] }
assert.equal(lockReason(freedRun, keeperChoice), null)
const keptRun = takeChoice(freedRun, 'keeper')
assert.equal(keptRun.sceneId, 'ending-bell-keeper')
assert.equal(scene('ending-bell-keeper').ending, 'bittersweet')
assert.ok(keptRun.endings.includes('ending-bell-keeper'))

// Wren's Lamp: from the tower, only with Wren as an ally.
const lampChoice = scene('a9-tower').choices?.find((c) => c.id === 'wren-lamp')
assert.ok(lampChoice, 'the tower offers the lamp choice')
assert.equal(lampChoice.to, 'ending-wren-lamp')
assert.ok(lockReason(towerRun, lampChoice), 'locked without wren-ally')
const wrenRun: Run = { ...towerRun, flags: ['wren-ally'] }
assert.equal(lockReason(wrenRun, lampChoice), null)
const lampRun = takeChoice(wrenRun, 'wren-lamp')
assert.equal(lampRun.sceneId, 'ending-wren-lamp')
assert.equal(scene('ending-wren-lamp').ending, 'bittersweet')
assert.ok(lampRun.endings.includes('ending-wren-lamp'))

// Silas, 2026-10-16 layout sweep: one solid toolbar row, the fitted page from
// portrait tablets up, and wide-but-short screens set the plate beside the text.
const page = readFileSync(
  join(process.cwd(), 'pages/play/zuzu-gamebook.vue'),
  'utf8',
)
assert.match(
  page,
  /class="kr-toolbar[^"]*bg-base-100\/95/,
  'toolbar has a solid bar',
)
assert.match(page, /\(min-width: 1024px\) and \(max-height: 820px\)/)
assert.match(page, /\(min-width: 768px\) and \(orientation: portrait\)/)
assert.match(page, /md:grid-rows-\[minmax\(9rem,1fr\)_auto\]/)
assert.match(page, /max-md:max-h-\[34svh\]/, 'phones keep the plate to a third')

assert.ok(
  page.includes('store.claimLoot(index)'),
  'full pack can replace inventory',
)
assert.ok(page.includes('store.claimLoot(null)'), 'full pack can leave loot')
assert.ok(
  page.includes('store.recoverable'),
  'restore journey action is visible',
)

console.log(
  'Zuzu gamebook contract: ' +
    ids.length +
    ' sections, ' +
    endings.length +
    ' endings, acyclic, stateful exploration, plates, items, dice, combat replay, saves and power costs passed',
)
