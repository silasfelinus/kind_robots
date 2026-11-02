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
  assert.ok(
    art.format === 'svg' ? art.artImageId === 0 : art.artImageId > 0,
    node.art +
      ': a local SVG has no generated ArtImage, a WebP needs provenance',
  )
  assert.ok(
    existsSync(join(scenesDir, art.file + '.' + (art.format ?? 'webp'))),
    node.art + ': plate file missing',
  )
  assert.equal(
    platePath(art),
    '/zuzu-gamebook/scenes/' + art.file + '.' + (art.format ?? 'webp'),
  )
  // A section's own plate (keyed by its id, one plate per section) wins over the shared one.
  const own = sectionPlate(node)
  assert.ok(
    existsSync(join(scenesDir, own.file + '.' + (own.format ?? 'webp'))),
    node.id + ': own plate file missing',
  )
  assert.equal(
    plateLayout(own),
    (own.shape ?? 'wide') === 'wide' ? 'top' : 'right',
    node.id +
      ': wide plates sit above the text, tall and square ones to its right',
  )
}
// Regression: never show Hollow Bell on the lookout or an apple tree in the rain-bloom.
for (const [nodeId, expectedFile] of [
  ['a2-bell-view', 'bell-view-original.svg'],
  ['a4-bloom', 'desert-bloom-original.svg'],
] as const) {
  const chosen = sectionPlate(BOOK[nodeId]!)
  assert.equal(
    platePath(chosen),
    '/zuzu-gamebook/scenes/' + expectedFile,
    nodeId + ': illustration must follow the authored scene',
  )
  assert.equal(chosen.fit, 'exact', nodeId + ': no unrelated stand-in')
  assert.match(
    readFileSync(join(scenesDir, expectedFile), 'utf8'),
    /<svg[^>]+viewBox/,
    nodeId + ': local scene illustration must be valid vector artwork',
  )
}
const usedPlates = new Set(Object.values(BOOK).map((node) => node.art))
for (const key of Object.keys(PLATES)) {
  assert.ok(usedPlates.has(key), 'plate ' + key + ' is not used by any scene')
}
for (const file of readdirSync(scenesDir, { withFileTypes: true })) {
  if (file.isDirectory()) continue
  assert.ok(
    Object.values(PLATES).some(
      (p) => p.file + '.' + (p.format ?? 'webp') === file.name,
    ),
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

// Act I's dangerous ground checks are entered from a legitimate fresh run.
// A failed roll costs 2 HP, but a warned coyote can cover a costly retreat.
// The 3-HP crocodile stress fixture is synthetic: this seeded approach enters
// with 10 HP, not an already-wounded late-act character.
const failedGroundRoutes: Run[] = []
for (let seed = 1; seed <= 120; seed++) {
  const warned = takeChoice(takeChoice(startRun(seed), 'approach'), 'defend')
  assert.equal(warned.sceneId, 'a1-terrain')
  assert.ok(warned.flags.includes('coyote-warned'))
  const stones = takeChoice(warned, 'stones')
  if (stones.sceneId === 'a1-bad-ground') {
    assert.equal(stones.health, 10)
    assert.equal(stones.lastRoll?.success, false)
    failedGroundRoutes.push(stones)
  } else {
    assert.equal(stones.sceneId, 'a1-on-the-stones')
  }
}
assert.ok(failedGroundRoutes.length > 0, 'seeded failures reach the retreat')
for (const id of ['stones', 'reeds']) {
  const risk = scene('a1-terrain').choices?.find((choice) => choice.id === id)
  assert.match(risk?.label ?? '', /fail: hurt, cornered/)
}
const crocRetreat = scene('a1-bad-ground').choices?.find(
  (choice) => choice.id === 'ridge',
)
assert.ok(crocRetreat)
assert.equal(scene('a1-bad-ground').choices?.[0]?.id, 'up')
const grounded = failedGroundRoutes[0]!
const unWarned: Run = {
  ...grounded,
  flags: grounded.flags.filter((flag) => flag !== 'coyote-warned'),
}
assert.ok(lockReason(unWarned, crocRetreat))
assert.equal(takeChoice(unWarned, 'ridge'), unWarned)
const noBandage: Run = {
  ...grounded,
  items: grounded.items.filter((item) => item !== 'bandage'),
}
assert.ok(lockReason(noBandage, crocRetreat))
assert.equal(takeChoice(noBandage, 'ridge'), noBandage)
for (const health of [1, 3, 6, 12]) {
  for (const resolve of [0, 4]) {
    const wounded: Run = { ...grounded, health, resolve }
    const retreat = takeChoice(wounded, 'ridge')
    assert.equal(retreat.sceneId, 'a1-ridge-retreat')
    assert.equal(retreat.health, health, 'retreat cannot heal a wound')
    assert.equal(retreat.resolve, Math.max(0, resolve - 1))
    assert.ok(!retreat.items.includes('bandage'))
    assert.ok(wounded.items.includes('bandage'), 'previous state is immutable')
    assert.ok(retreat.flags.includes('debt:coyote-cover'))
    assert.ok(retreat.flags.includes('deed:left-coyote-at-water'))
    assert.equal(honor(retreat), honor(wounded))
    assert.equal(taint(retreat), taint(wounded))
    assert.ok(isSavedRun(JSON.parse(JSON.stringify(retreat))))
    const east = takeChoice(retreat, 'east')
    assert.equal(east.sceneId, 'dust-road')
    assert.equal(east.battle, null)
    assert.equal(east.health, health)
  }
}
assert.equal(takeChoice(grounded, 'up').sceneId, 'crocodile')
assert.equal(takeChoice(grounded, 'up').battle?.hp, 8)

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
assert.deepEqual(journal(['debt:coyote-cover', 'debt:sister']).debts, [
  'The Coyote Vagrant',
  'The sister',
])
assert.deepEqual(notes.learned, ['wax', 'sister trust'])

// A failed parley at Hollis's well must not force a trusted, prepared sister
// into a near-certain low-health fight. Retreat costs the bandage and dry miles.
assert.deepEqual(
  scene('a4-well-grab')
    .choices?.slice(0, 2)
    .map((choice) => choice.id),
  ['fight', 'pay'],
  'existing positional replay actions retain their choice indices',
)
for (const id of ['trick', 'why']) {
  const choice = scene('a4-well-toll').choices?.find((entry) => entry.id === id)
  assert.match(choice?.label ?? '', /failure: cornered/)
}
const hollisRetreat = scene('a4-well-grab').choices?.find(
  (choice) => choice.id === 'follow-sister',
)
assert.ok(hollisRetreat, 'the failed parley offers an earned retreat')
const grabbedAlone: Run = {
  ...startRun(23),
  sceneId: 'a4-well-grab',
  health: 3,
  resolve: 0,
  items: ['bandage'],
  flags: [],
}
assert.ok(lockReason(grabbedAlone, hollisRetreat))
assert.equal(takeChoice(grabbedAlone, 'follow-sister'), grabbedAlone)
const grabbedUnprepared: Run = {
  ...grabbedAlone,
  flags: ['sister-trust'],
  items: [],
}
assert.ok(lockReason(grabbedUnprepared, hollisRetreat))
assert.equal(takeChoice(grabbedUnprepared, 'follow-sister'), grabbedUnprepared)
const estrangedSister: Run = {
  ...grabbedAlone,
  flags: ['sister-trust', 'sister-wary'],
}
assert.ok(
  !visibleChoices(estrangedSister, scene('a4-well-grab')).some(
    (choice) => choice.id === 'follow-sister',
  ),
  'neglect after earned trust must retire the sister rescue',
)
assert.equal(takeChoice(estrangedSister, 'follow-sister'), estrangedSister)
for (const health of [1, 3, 6, 12]) {
  for (const resolve of [0, 4]) {
    const trusted: Run = {
      ...grabbedAlone,
      health,
      resolve,
      flags: ['sister-trust'],
    }
    const slipped = takeChoice(trusted, 'follow-sister')
    assert.equal(slipped.sceneId, 'a4-well-slip')
    assert.equal(slipped.health, health, 'retreat grants no free healing')
    assert.equal(slipped.resolve, Math.max(0, resolve - 1))
    assert.ok(!slipped.items.includes('bandage'), 'escape spends the bandage')
    assert.ok(slipped.flags.includes('sister-led-escape'))
    assert.equal(taint(slipped), 0)
    const dryRoad = takeChoice(slipped, 'on')
    assert.equal(dryRoad.sceneId, 'a4-wide-berth')
    assert.equal(dryRoad.health, Math.max(1, health - 2))
    assert.equal(dryRoad.battle, null)
    assert.ok(dryRoad.flags.includes('sister-led-escape'))
  }
}
assert.equal(
  takeChoice(grabbedAlone, 'fight').sceneId,
  'a4-well-battle',
  'the existing dangerous choice remains available',
)

// Real from-new-game Hollis witnesses: a synthetic low-HP setup alone cannot
// prove that the sister's escape is reachable or that declining her trust matters.
function followHollisRoute(
  seed: number,
  steps: readonly (readonly [string, string])[],
): Run {
  let run = startRun(seed)
  for (const [choice, destination] of steps) {
    const next = takeChoice(run, choice)
    assert.notEqual(next, run, 'rejected ' + run.sceneId + '/' + choice)
    assert.equal(next.sceneId, destination, run.sceneId + '/' + choice)
    run = next
  }
  return run
}

const trustedHollisSteps = [
  ['avoid', 'dust-road'],
  ['hurry', 'hollow-bell'],
  ['search', 'survivors'],
  ['kneel', 'sister-trust'],
  ['go', 'they-follow'],
  ['let', 'a3-first-day'],
  ['shade', 'a3-shade'],
  ['on', 'two-fires'],
  ['sleep', 'a3-cold-dawn'],
  ['road', 'a3-salt-pan'],
  ['cross', 'apple-tree'],
  ['leave-all', 'a3-apples-reach'],
  ['on', 'a3-apple-days'],
  ['keep', 'a3-theft'],
  ['seen', 'a3-theft-seen'],
  ['on', 'a3-fever'],
  ['kindness', 'a3-fever-vigil'],
  ['on', 'a3-last-camp'],
  ['wave', 'a3-one-fire'],
  ['on', 'canyon-road'],
  ['long', 'a4-canyon-floor'],
  ['carry', 'bone-river'],
  ['pass', 'a4-stone-face'],
  ['cover', 'a4-face-covered'],
  ['on', 'a4-dry-well'],
  ['walk', 'a4-well-toll'],
  ['why', 'a4-well-grab'],
] as const
const trustedHollis = followHollisRoute(48, trustedHollisSteps)
assert.deepEqual(trustedHollis.lastRoll?.dice, [1, 3])
assert.equal(trustedHollis.lastRoll?.success, false)
assert.ok(trustedHollis.flags.includes('sister-trust'))
assert.ok(trustedHollis.items.includes('bandage'))
const sisterRescue = takeChoice(trustedHollis, 'follow-sister')
assert.equal(sisterRescue.sceneId, 'a4-well-slip')
assert.ok(sisterRescue.flags.includes('debt:sister'))
assert.ok(sisterRescue.flags.includes('sister-led-escape'))
assert.ok(!sisterRescue.items.includes('bandage'))
assert.equal(sisterRescue.resolve, Math.max(0, trustedHollis.resolve - 1))
assert.equal(sisterRescue.health, trustedHollis.health)
assert.deepEqual(journal(sisterRescue.flags).debts, ['The sister'])
const afterRescue = takeChoice(sisterRescue, 'on')
assert.equal(afterRescue.sceneId, 'a4-wide-berth')
assert.equal(afterRescue.health, Math.max(1, sisterRescue.health - 2))
const resumedRoad = takeChoice(afterRescue, 'on')
assert.equal(resumedRoad.sceneId, 'a4-waystation')
assert.equal(resumedRoad.battle, null)
assert.ok(isSavedRun(JSON.parse(JSON.stringify(resumedRoad))))
assert.ok(resumedRoad.flags.includes('debt:sister'))

// The same legal seed can earn trust early, then lose the sister's confidence
// by walking through her brother's fever. The later rescue must not survive
// that choice simply because the earlier trust flag remains in the journal.
const estrangedHollis = followHollisRoute(48, [
  ...trustedHollisSteps.slice(0, 16),
  ['walk', 'a3-fever-walk'],
  ['on', 'a3-fever-long-night'],
  ['on', 'a3-last-camp'],
  ['apart', 'a3-far-fires'],
  ['on', 'canyon-road'],
  ...trustedHollisSteps.slice(20),
])
assert.equal(estrangedHollis.sceneId, 'a4-well-grab')
assert.deepEqual(estrangedHollis.lastRoll?.dice, [1, 3])
assert.ok(estrangedHollis.flags.includes('sister-trust'))
assert.ok(estrangedHollis.flags.includes('sister-wary'))
assert.ok(
  !visibleChoices(estrangedHollis, scene('a4-well-grab')).some(
    (choice) => choice.id === 'follow-sister',
  ),
)
assert.equal(takeChoice(estrangedHollis, 'follow-sister'), estrangedHollis)
assert.equal(takeChoice(estrangedHollis, 'pay').sceneId, 'a4-well-paid')

// An actual seed with no earned trust fails the same parley. The new retreat
// stays locked, while surrendering water remains a legitimate costly choice.
const untrustedHollis = followHollisRoute(1, [
  ['avoid', 'dust-road'],
  ['hurry', 'hollow-bell'],
  ['search', 'survivors'],
  ['wait', 'they-follow'],
  ['let', 'a3-first-day'],
  ['pace', 'a3-hard-pace'],
  ['camp', 'two-fires'],
  ['sleep', 'a3-cold-dawn'],
  ['road', 'a3-salt-pan'],
  ['cross', 'apple-tree'],
  ['leave-all', 'a3-apples-reach'],
  ['on', 'a3-apple-days'],
  ['keep', 'a3-theft'],
  ['let', 'a3-theft-kept'],
  ['on', 'a3-fever'],
  ['walk', 'a3-fever-walk'],
  ['on', 'a3-fever-long-night'],
  ['on', 'a3-last-camp'],
  ['apart', 'a3-far-fires'],
  ['on', 'canyon-road'],
  ['long', 'a4-canyon-floor'],
  ['wait', 'bone-river'],
  ['pass', 'a4-stone-face'],
  ['listen', 'a4-face-listen'],
  ['on', 'a4-dry-well'],
  ['walk', 'a4-well-toll'],
  ['why', 'a4-well-grab'],
])
assert.deepEqual(untrustedHollis.lastRoll?.dice, [4, 2])
assert.ok(!untrustedHollis.flags.includes('sister-trust'))
assert.ok(lockReason(untrustedHollis, hollisRetreat))
assert.equal(takeChoice(untrustedHollis, 'follow-sister'), untrustedHollis)
const paidHollis = takeChoice(untrustedHollis, 'pay')
assert.equal(paidHollis.sceneId, 'a4-well-paid')
assert.ok(!paidHollis.items.includes('water'))
assert.ok(paidHollis.flags.includes('a4-stripped'))
assert.ok(!paidHollis.flags.includes('debt:sister'))
console.log(
  'Gamebook Hollis from-start witnesses: seed 48 earned rescue, seed 1 paid after failed parley',
)

// A full seed-48 journey proves that trust and estrangement can coexist in a
// real save. The isolated knifepoint checks below change only the scene to
// exercise that later guard; they are not claimed as full Abbess witnesses.
const abbessKnifepoint = scene('a8-knifepoint')
const sisterNod = abbessKnifepoint.choices?.find(
  (choice) => choice.id === 'nod',
)
assert.ok(sisterNod)
assert.equal(sisterNod.needs, 'sister-trust')
assert.equal(sisterNod.unless, 'sister-wary')
const trustedAtAltar: Run = {
  ...trustedHollis,
  sceneId: 'a8-knifepoint',
}
assert.ok(
  visibleChoices(trustedAtAltar, abbessKnifepoint).some(
    (choice) => choice.id === 'nod',
  ),
)
const nodRescue = takeChoice(trustedAtAltar, 'nod')
assert.equal(nodRescue.sceneId, 'a8-sister-bites')
assert.ok(nodRescue.flags.includes('sister-free'))
const estrangedAtAltar: Run = {
  ...estrangedHollis,
  sceneId: 'a8-knifepoint',
}
assert.ok(
  !visibleChoices(estrangedAtAltar, abbessKnifepoint).some(
    (choice) => choice.id === 'nod',
  ),
  'a later betrayal must retire the old trust-only rescue',
)
assert.equal(takeChoice(estrangedAtAltar, 'nod'), estrangedAtAltar)
const untrustedAtAltar: Run = {
  ...untrustedHollis,
  sceneId: 'a8-knifepoint',
}
assert.ok(lockReason(untrustedAtAltar, sisterNod))
assert.equal(takeChoice(untrustedAtAltar, 'nod'), untrustedAtAltar)
assert.equal(abbessKnifepoint.choices?.[0]?.id, 'trust')
assert.equal(abbessKnifepoint.choices?.[1]?.id, 'refuse')
assert.equal(abbessKnifepoint.choices?.[2]?.id, 'strike')
for (const risky of ['trust', 'strike']) {
  const riskChoice: { label: string; check?: { failure: string } } | undefined =
    abbessKnifepoint.choices?.find((entry) => entry.id === risky)
  assert.match(riskChoice?.label ?? '', /fail: 3 HP wound/)
  assert.equal(
    riskChoice?.check?.failure,
    risky === 'trust' ? 'a8-word-broken' : 'stabbed',
  )
}
assert.equal(scene('a8-word-broken').choices?.[0]?.to, 'stabbed')
assert.equal(scene('stabbed').effects?.hurt, 3)
console.log(
  'Gamebook Abbess trust regression: seeded 48 trusted/estranged preconditions, guarded rescue and explicit wound cues',
)

// A later betrayal must retire the mechanical trust bonus as well as the rescue.
// Seed 28 rolls 4+4: Mercy 0 fails the 9 target, while earned trust passes.
for (const [encounter, choiceId, successScene, failureScene] of [
  ['a8-standoff', 'wait', 'a8-standoff-break', 'nuns-attack'],
  ['a9-sister-knife', 'hand', 'a9-beside', 'a9-behind'],
] as const) {
  const bonus = scene(encounter).choices?.find(
    (choice) => choice.id === choiceId,
  )?.check?.bonus
  assert.deepEqual(bonus, {
    flag: 'sister-trust',
    amount: 2,
    unless: 'sister-wary',
  })
  const base: Run = {
    ...startRun(28),
    sceneId: encounter,
    health: 3,
    resolve: 0,
    flags: [],
  }
  const trusted = takeChoice({ ...base, flags: ['sister-trust'] }, choiceId)
  const estranged: Run = {
    ...base,
    flags: ['sister-trust', 'sister-wary'],
  }
  const betrayed = takeChoice(estranged, choiceId)
  const untrusted = takeChoice(base, choiceId)
  assert.deepEqual(trusted.lastRoll?.dice, [4, 4])
  assert.deepEqual(betrayed.lastRoll?.dice, trusted.lastRoll?.dice)
  assert.deepEqual(untrusted.lastRoll?.dice, trusted.lastRoll?.dice)
  assert.equal(trusted.lastRoll?.modifier, 2)
  assert.equal(betrayed.lastRoll?.modifier, 0)
  assert.equal(untrusted.lastRoll?.modifier, 0)
  assert.equal(trusted.sceneId, successScene)
  assert.equal(betrayed.sceneId, failureScene)
  assert.equal(untrusted.sceneId, failureScene)
  assert.equal(betrayed.health, 3)
  assert.equal(betrayed.resolve, 0)
  assert.ok(betrayed.flags.includes('sister-wary'))
  assert.ok(isSavedRun(JSON.parse(JSON.stringify(betrayed))))
  assert.deepEqual(estranged.flags, ['sister-trust', 'sister-wary'])
}
console.log(
  'Gamebook Abbess and sister knife: estrangement retires trust dice bonuses',
)

// The sister's rescue is an earned alternative to a near-certain wounded Abbess fight.
// It must not become a free escape for Zuzu when she remains tied to the altar.
const woundedAlone: Run = {
  ...startRun(19),
  sceneId: 'a8-voice-wound',
  health: 1,
  resolve: 0,
  flags: [],
}
assert.deepEqual(
  scene('a8-voice-wound')
    .choices?.slice(0, 3)
    .map((choice) => choice.id),
  ['refuse', 'dream', 'take'],
  'positional golden witnesses retain their original choice indices',
)
const escapeChoice = scene('a8-voice-wound').choices?.find(
  (choice) => choice.id === 'escape-with-sister',
)
assert.ok(escapeChoice, 'the wounded bargain offers a retreat')
assert.ok(lockReason(woundedAlone, escapeChoice))
assert.equal(takeChoice(woundedAlone, 'escape-with-sister'), woundedAlone)
for (const health of [1, 3, 6, 12]) {
  for (const resolve of [0, 4]) {
    const withSister: Run = {
      ...woundedAlone,
      health,
      resolve,
      flags: ['sister-free'],
    }
    const withdrawn = takeChoice(withSister, 'escape-with-sister')
    assert.equal(withdrawn.sceneId, 'a8-wounded-flight')
    assert.equal(withdrawn.health, health, 'retreat cannot secretly heal')
    assert.equal(withdrawn.resolve, resolve, 'retreat cannot grant Resolve')
    assert.ok(withdrawn.flags.includes('honor:refused-the-dark'))
    assert.equal(taint(withdrawn), 0)
    const escaped = takeChoice(withdrawn, 'carry-them')
    assert.equal(escaped.sceneId, 'ending-hunted')
    assert.ok(escaped.flags.includes('breach-left-open'))
    assert.ok(escaped.endings.includes('ending-hunted'))
    assert.equal(escaped.health, health)
    const returned = takeChoice(withdrawn, 'turn-back')
    assert.equal(returned.sceneId, 'abbess')
    assert.equal(returned.battle?.hp, 9)
    assert.ok(!returned.flags.includes('breach-left-open'))
  }
}

// Search the actual reducer graph, rather than teleporting a fabricated low-HP
// save into Act VIII. This route must free the sister, survive the nuns, fail
// the Abbess's ambush, and arrive at the wounded bargain with real dice.
function findWoundedAbbessWitness(): {
  seed: number
  moves: PlaytestMove[]
  run: Run
} | null {
  const target = 'a8-voice-wound'
  const parents = new Map<string, string[]>()
  for (const node of Object.values(BOOK)) {
    const destinations = [
      ...(node.choices ?? []).flatMap((choice) =>
        choice.check
          ? [choice.check.success, choice.check.failure]
          : [choice.to],
      ),
      ...(node.battle ? [node.battle.win, node.battle.lose] : []),
    ]
    for (const destination of destinations)
      parents.set(destination, [...(parents.get(destination) ?? []), node.id])
  }
  const distances = new Map<string, number>([[target, 0]])
  const queue = [target]
  for (let i = 0; i < queue.length; i++) {
    const from = queue[i]!
    for (const parent of parents.get(from) ?? []) {
      if (distances.has(parent)) continue
      distances.set(parent, distances.get(from)! + 1)
      queue.push(parent)
    }
  }

  for (let seed = 1; seed <= 48; seed++) {
    const seen = new Set<string>()
    let budget = 6000
    const search = (
      run: Run,
      moves: PlaytestMove[],
    ): { seed: number; moves: PlaytestMove[]; run: Run } | null => {
      if (run.sceneId === target)
        return run.flags.includes('sister-free') ? { seed, moves, run } : null
      if (
        --budget < 0 ||
        moves.length >= 145 ||
        scene(run.sceneId).ending ||
        !distances.has(run.sceneId)
      )
        return null
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
      if (seen.has(key)) return null
      seen.add(key)

      let options: PlaytestMove[]
      if (run.pendingLoot.length) {
        options = [{ kind: 'loot', replace: null }]
      } else if (run.battle) {
        options = (['quiet-draw', 'feint', 'strike', 'guard'] as const)
          .filter((action) => action !== 'quiet-draw' || run.resolve >= 2)
          .map((action) => ({ kind: 'fight' as const, action }))
      } else {
        options = visibleChoices(run, scene(run.sceneId))
          .filter((choice) => !lockReason(run, choice))
          .filter((choice) =>
            (choice.check
              ? [choice.check.success, choice.check.failure]
              : [choice.to]
            ).some((destination) => distances.has(destination)),
          )
          .sort((a, b) => {
            const distance = (choice: typeof a) =>
              Math.min(
                ...(choice.check
                  ? [choice.check.success, choice.check.failure]
                  : [choice.to]
                ).map((destination) => distances.get(destination) ?? Infinity),
              )
            return (
              distance(a) - distance(b) ||
              Number(b.id === 'cut') - Number(a.id === 'cut')
            )
          })
          .map((choice) => ({ kind: 'choice' as const, id: choice.id }))
      }
      for (const move of options) {
        const next = applyPlaytestMove(run, move)
        if (next === run) continue
        const found = search(next, [...moves, move])
        if (found) return found
      }
      return null
    }
    const found = search(startRun(seed), [])
    if (found) return found
  }
  return null
}

const woundedAbbessWitness = findWoundedAbbessWitness()
assert.ok(
  woundedAbbessWitness,
  'A real seeded journey must reach the wounded Abbess with the sister freed',
)
const woundedAbbess = woundedAbbessWitness.run
assert.equal(woundedAbbess.sceneId, 'a8-voice-wound')
assert.ok(woundedAbbess.visited.includes('nuns-attack'))
assert.ok(woundedAbbess.visited.includes('abbess-strikes'))
assert.ok(woundedAbbess.visited.includes('stabbed'))
assert.ok(woundedAbbess.flags.includes('sister-free'))
assert.ok(woundedAbbess.health >= 1 && woundedAbbess.health <= 9)
assert.deepEqual(
  replayWitness(woundedAbbessWitness.seed, woundedAbbessWitness.moves),
  woundedAbbess,
)
assert.ok(isSavedRun(JSON.parse(JSON.stringify(woundedAbbess))))
const earnedRetreat = takeChoice(woundedAbbess, 'escape-with-sister')
assert.equal(earnedRetreat.sceneId, 'a8-wounded-flight')
assert.equal(earnedRetreat.health, woundedAbbess.health)
assert.ok(earnedRetreat.flags.includes('honor:refused-the-dark'))
const evacuated = takeChoice(earnedRetreat, 'carry-them')
assert.equal(evacuated.sceneId, 'ending-hunted')
assert.ok(evacuated.flags.includes('breach-left-open'))
assert.equal(evacuated.health, woundedAbbess.health)
const returnedWounded = takeChoice(earnedRetreat, 'turn-back')
assert.equal(returnedWounded.sceneId, 'abbess')
assert.equal(returnedWounded.health, woundedAbbess.health)
assert.equal(returnedWounded.battle?.hp, 9)
assert.ok(!returnedWounded.flags.includes('breach-left-open'))
assert.ok(isSavedRun(JSON.parse(JSON.stringify(returnedWounded))))
console.log(
  'Gamebook real wounded Abbess witness: seed=' +
    woundedAbbessWitness.seed +
    ', moves=' +
    woundedAbbessWitness.moves.length +
    ', HP=' +
    woundedAbbess.health +
    ', sister freed, retreat and return validated',
)

// Golden journeys must remain replayable without the search solver, including
// rare moral endings and failures. Changes to choices, dice or consequences
// require explicit editorial review and deliberate fixture refresh.
type GoldenWitness = {
  ending: string
  seed: number
  trace: string
  health: number
  resolve: number
  scenes: number
  fingerprint: string
}
const goldenFile = JSON.parse(
  readFileSync(
    join(process.cwd(), 'utils/scripts/fixtures/zuzuGamebookGolden.json'),
    'utf8',
  ),
) as { version: number; witnesses: GoldenWitness[] }
assert.equal(goldenFile.version, 1)
assert.deepEqual(
  goldenFile.witnesses.map((witness) => witness.ending).sort(),
  [...endings].sort(),
  'each authored ending must have exactly one golden full-journey transcript',
)
for (const fixture of goldenFile.witnesses) {
  assert.ok(fixture.trace.length > 0 && fixture.trace.length % 2 === 0)
  const replayed = replayEncodedWitness(fixture.seed, fixture.trace)
  assert.equal(replayed.sceneId, fixture.ending)
  assert.equal(replayed.health, fixture.health)
  assert.equal(replayed.resolve, fixture.resolve)
  assert.equal(replayed.visited.length, fixture.scenes)
  assert.equal(
    witnessFingerprint(replayed),
    fixture.fingerprint,
    fixture.ending + ': golden route or consequences unexpectedly changed',
  )
  if (fixture.ending === 'ending-wren-lamp') {
    assert.ok(replayed.visited.includes('a5-wren-talk'))
    assert.ok(replayed.flags.includes('wren-ally'))
  }
}
assert.throws(() => replayEncodedWitness(1, 'c'), /Truncated witness/)
assert.throws(() => replayEncodedWitness(1, 'x0'), /Unknown witness action/)

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
        // Losing some encounters restores HP during the authored aftermath.
        assert.ok(outcome.averageHealth >= 0 && outcome.averageHealth <= 12)
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
// Silas, 2026-11-01: one header strip site-wide. The toolbar row docks into
// the shell's system bar rather than drawing a second strip over the book.
assert.match(
  page,
  /<header-page-bar>\s*<div[^>]*data-testid="zuzu-gamebook-hud"/,
  'the toolbar row docks into the system bar',
)
assert.doesNotMatch(page, /class="kr-toolbar/, 'no second header strip')
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
