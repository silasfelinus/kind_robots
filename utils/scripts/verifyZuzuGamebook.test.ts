import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  FALLBACK_PLATE,
  PLATES,
  plateLayout,
  platePath,
  sectionPlate,
} from '../zuzuGamebook/art'
import { SECTION_PLATES } from '../zuzuGamebook/sectionArt'
import {
  applyPlaytestMove,
  bestWinChance,
  combatBenchmark,
  fightsOpenedBy,
  hopelessFights,
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
import {
  decodeSaveCode,
  encodeSaveCode,
  SAVE_CODE_PREFIX,
} from '../zuzuGamebook/saveCode'
import {
  choiceTerms,
  itemInfo,
  ITEM_INFO,
  moveTerms,
  noteBeyondRoll,
} from '../zuzuGamebook/terms'
import { emphasis } from '../zuzuGamebook/prose'
import { CH } from '../zuzuGamebook/sections'
import {
  actOpening,
  BOOK,
  checkChance,
  checkModifier,
  combatEntry,
  LOG_ROUNDS,
  moveCheck,
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
  fightAhead,
  fightCue,
  type Run,
  type BattleAction,
  type CombatRound,
} from '../zuzuGamebook/adventure'
import type { Attribute, Choice } from '../zuzuGamebook/types'

// At the opening waterhole, a failed roll can force an 8-HP crocodile fight.
// Warn before the player commits; the existing safe retreat must stay reachable.
const crossingChoices = scene('the-crossing').choices ?? []
assert.deepEqual(
  crossingChoices.map((choice) => choice.id),
  ['approach', 'stare', 'listen', 'avoid'],
)
assert.match(crossingChoices[2]!.label, /Failure draws the crocodile into a fight/)
assert.equal(crossingChoices[3]!.to, 'dust-road')
const standoffChoices = scene('standoff').choices ?? []
assert.deepEqual(standoffChoices.map((choice) => choice.id), ['open-hand', 'hold'])
assert.match(standoffChoices[0]!.label, /Failure draws the crocodile into a fight/)
assert.match(standoffChoices[1]!.label, /Either outcome leads to the crocodile/)
assert.equal(standoffChoices[1]!.check?.success, 'croc-ready')
assert.equal(standoffChoices[1]!.check?.failure, 'crocodile')
const hiddenPoolChoices = scene('hidden-pool').choices ?? []
assert.equal(hiddenPoolChoices.find((choice) => choice.id === 'withdraw')?.to, 'dust-road')
assert.match(
  hiddenPoolChoices.find((choice) => choice.id === 'warn')!.label,
  /Prepare to fight the crocodile/,
)

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
// Endings show their own painted plates (main-game standard item 6).
for (const id of ['ending-wren-lamp', 'ending-bell-keeper']) {
  assert.ok(endings.includes(id), id + ' is an ending')
  assert.equal(sectionPlate(BOOK[id]!).file, 'sections/' + id)
  assert.ok(
    existsSync(join(scenesDir, 'sections', id + '.webp')),
    id + ': ending has its own section plate',
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

// t-013 forced-fight audit: no choice walks Zuzu into a fight unannounced.
// Every choice whose outcome is a battle carries a cue, and the cue says
// whether a loss ends the journey for the journal as it will stand.
for (const node of Object.values(BOOK)) {
  for (const choice of node.choices ?? []) {
    const outcomes = choice.check
      ? [choice.check.success, choice.check.failure]
      : [choice.to]
    if (!outcomes.some((id) => BOOK[id]?.battle)) continue
    const cue = fightCue({ ...startRun(1), sceneId: node.id }, choice)
    assert.ok(cue, node.id + '/' + choice.id + ' starts a fight without a cue')
    assert.equal(cue.chip, 'Fight')
  }
}
const cueAt = (sceneId: string, choiceId: string, patch: Partial<Run> = {}) => {
  const run: Run = { ...startRun(1), sceneId, ...patch }
  const choice = scene(sceneId).choices?.find((entry) => entry.id === choiceId)
  assert.ok(choice, sceneId + '/' + choiceId)
  return { ahead: fightAhead(run, choice), cue: fightCue(run, choice) }
}
assert.equal(cueAt('a4-well-toll', 'pay').cue, null, 'no fight, no cue')
assert.equal(cueAt('a4-hollis-why', 'around').ahead, null)
// The cellar's real choice: freeing the sister first is what keeps a lost
// fight from being the end. The cards must say so before the player commits.
const cutFirst = cueAt('cellar', 'cut')
const charge = cueAt('cellar', 'charge')
const slip = cueAt('cellar', 'slip')
assert.equal(cutFirst.ahead?.foe, 'The Otter Nuns')
assert.equal(cutFirst.ahead?.deadly, false, 'a freed sister saves a lost fight')
assert.equal(charge.ahead?.deadly, true)
assert.equal(slip.ahead?.when, 'failure')
assert.equal(slip.ahead?.deadly, true)
assert.equal(charge.cue?.hint, 'Losing ends the journey')
assert.equal(
  cutFirst.cue?.hint,
  undefined,
  'a healthy, backed Zuzu sees no alarm',
)
assert.deepEqual(cutFirst.cue?.details, [
  'Leads to a fight: The Otter Nuns.',
  'Losing that fight costs you, but the journey goes on.',
])
assert.deepEqual(slip.cue?.details, [
  'A failed roll leads to a fight: The Otter Nuns.',
  'Losing that fight ends the journey.',
])
for (const health of [1, 3, 4]) {
  const hurt = cueAt('cellar', 'charge', { health })
  assert.equal(hurt.ahead?.wounded, true)
  assert.equal(
    hurt.cue?.hint,
    'Wounded, ' + health + ' HP: losing ends the journey',
  )
  assert.equal(
    cueAt('cellar', 'cut', { health }).cue?.hint,
    'Wounded, ' + health + ' HP',
  )
}
assert.equal(cueAt('cellar', 'charge', { health: 5 }).ahead?.wounded, false)
// Unannounced Act VI brawl: Hask's loss is survivable, and the card says so.
for (const sceneId of ['a6-vane', 'a6-vane-why', 'a6-vane-refuses']) {
  const hask = cueAt(sceneId, 'expose')
  assert.equal(hask.ahead?.foe, 'Hask, the water guard')
  assert.equal(hask.ahead?.deadly, false)
  assert.equal(hask.cue?.chip, 'Fight')
}
// Act I: the crocodile kills; its cue is honest at full health and when hurt.
assert.equal(cueAt('a1-terrain', 'open').cue?.hint, 'Losing ends the journey')
assert.equal(cueAt('a1-terrain', 'open').ahead?.wounded, false)
assert.equal(cueAt('a1-terrain', 'stones').ahead?.when, 'success')
assert.equal(cueAt('a1-bad-ground', 'up', { health: 6 }).ahead?.wounded, true)
// Scene damage on the way in counts: the bone bowl's 1-HP sting is projected.
assert.equal(cueAt('a1-bowl-bones', 'lay', { health: 3 }).ahead?.health, 2)
// The wounded bargain: the same refusal is final alone, survivable with the sister.
assert.equal(
  cueAt('a8-voice-wound', 'refuse', { health: 2 }).ahead?.deadly,
  true,
)
assert.equal(
  cueAt('a8-voice-wound', 'refuse', { health: 2, flags: ['sister-free'] }).ahead
    ?.deadly,
  false,
)
const realRefusal = scene('a8-voice-wound').choices?.find(
  (choice) => choice.id === 'refuse',
)
assert.ok(realRefusal)
const realRefusalCue = fightAhead(woundedAbbess, realRefusal)
assert.equal(realRefusalCue?.foe, 'The Abbess')
assert.equal(realRefusalCue?.deadly, false, 'the real witness freed the sister')
assert.equal(realRefusalCue?.health, woundedAbbess.health)
assert.equal(realRefusalCue?.wounded, woundedAbbess.health <= 6)

// Seeded journeys hold the cues to account: every fight a choice starts was
// announced, a loss marked survivable never lands on an ending, and a loss
// marked final reaches one within a few pages.
let cueRng = 20261105
const cueRand = (n: number) => {
  cueRng = (cueRng * 1103515245 + 12345) >>> 0
  return (cueRng >>> 16) % n
}
let cuedFights = 0
let woundedEntries = 0
let finalLosses = 0
let survivedLosses = 0
for (let walk = 0; walk < 1500; walk++) {
  let run = startRun(walk * 104729 + 7)
  let pending: { deadly: boolean; lose: string } | null = null
  let sinceLoss = -1
  for (let step = 0; step < 220 && !scene(run.sceneId).ending; step++) {
    if (run.pendingLoot.length) {
      run = resolveLoot(run, null)
      continue
    }
    if (run.battle) {
      const lose = scene(run.sceneId).battle!.lose
      run = fight(
        run,
        run.resolve >= 2
          ? 'quiet-draw'
          : run.battle.exposed
            ? 'strike'
            : 'feint',
      )
      if (run.sceneId === lose && pending) {
        if (pending.deadly) {
          finalLosses++
          sinceLoss = 0
        } else {
          survivedLosses++
          assert.ok(
            !scene(lose).ending,
            lose + ': a survivable loss ended the book',
          )
        }
      }
      continue
    }
    if (sinceLoss >= 0 && ++sinceLoss > 5)
      assert.fail('a loss marked final did not end the journey: ' + run.sceneId)
    const open = visibleChoices(run, scene(run.sceneId)).filter(
      (choice) => !lockReason(run, choice),
    )
    assert.ok(open.length, 'stalled at ' + run.sceneId)
    const choice = open[cueRand(open.length)]!
    const ahead = fightAhead(run, choice)
    run = takeChoice(run, choice.id)
    const foe = scene(run.sceneId).battle
    if (!foe) continue
    assert.ok(ahead, 'unannounced fight at ' + run.sceneId)
    assert.ok(ahead.foe.includes(foe.name))
    cuedFights++
    if (run.health <= foe.attack * 2) {
      woundedEntries++
      assert.ok(ahead.wounded, run.sceneId + ': wounded entry not flagged')
    }
    pending =
      ahead.foe === foe.name ? { deadly: ahead.deadly, lose: foe.lose } : null
  }
  if (sinceLoss >= 0) assert.ok(scene(run.sceneId).ending)
}
assert.ok(cuedFights > 500 && woundedEntries > 20 && finalLosses > 20)
assert.ok(survivedLosses > 0)
console.log(
  'Gamebook fight cues: ' +
    cuedFights +
    ' seeded fights announced, ' +
    woundedEntries +
    ' wounded entries flagged, ' +
    finalLosses +
    ' final and ' +
    survivedLosses +
    ' survivable losses matched their cue',
)

// t-013, Silas 2026-11-05: "zuzu, who is male, should probably not have an
// unwinnable fight." A fight best play cannot win may still be chosen, and lost,
// but no reachable state may leave it as Zuzu's only way on.
const baseAttributes = startRun(1).attributes
assert.equal(bestWinChance('abbess', baseAttributes, 1, 0), 0)
assert.equal(bestWinChance('abbess', baseAttributes, 2, 4), 0)
assert.ok(bestWinChance('abbess', baseAttributes, 3, 0) > 0.2)
for (const node of Object.values(BOOK).filter((entry) => !!entry.battle)) {
  assert.equal(
    bestWinChance(node.id, baseAttributes, 1, 4),
    0,
    node.id + ': one blow from falling, no fight can be won',
  )
  for (const health of [3, 6, 12]) {
    const exact = bestWinChance(node.id, baseAttributes, health, 4)
    const sampled = Math.max(
      ...(
        ['strike', 'quiet-draw', 'feint-strike', 'guard-strike'] as const
      ).map(
        (policy) => combatBenchmark(node.id, policy, 250, health, 4).winRate,
      ),
    )
    assert.ok(
      sampled <= exact + 0.08,
      node.id + ' at ' + health + ' HP: best play is no worse than any policy',
    )
  }
}

// The audited state: wounded at the bargain, the sister still bound, too
// clean to take the dark's road. Refusing still means the Abbess, and at 1 HP
// she cannot be beaten, so giving ground to the stair must be on the table.
const woundedNoSister: Run = {
  ...startRun(19),
  sceneId: 'a8-voice-wound',
  health: 1,
  resolve: 0,
  items: ['water'],
  flags: ['abbess-suspicion', 'taint:listened'],
}
assert.ok(taint(woundedNoSister) < 2)
const voiceOpen = visibleChoices(
  woundedNoSister,
  scene('a8-voice-wound'),
).filter((choice) => !lockReason(woundedNoSister, choice))
assert.deepEqual(
  voiceOpen.map((choice) => choice.id),
  ['refuse', 'give-ground'],
)
assert.deepEqual(
  hopelessFights(woundedNoSister, voiceOpen[0]!).map((fight) => fight.sceneId),
  ['abbess'],
  'standing to fight stays a choice, and an honest loss',
)
assert.deepEqual(hopelessFights(woundedNoSister, voiceOpen[1]!), [])
assert.equal(fightCue(woundedNoSister, voiceOpen[1]!), null)
const atStair = takeChoice(woundedNoSister, 'give-ground')
assert.equal(atStair.sceneId, 'a8-give-ground')
assert.equal(atStair.battle, null)
assert.equal(atStair.health, 1, 'giving ground cannot heal')
assert.equal(atStair.resolve, 0, 'giving ground cannot grant Resolve')
assert.deepEqual(atStair.items, woundedNoSister.items)
assert.ok(atStair.flags.includes('honor:refused-the-dark'))
assert.equal(taint(atStair), taint(woundedNoSister))
assert.ok(isSavedRun(JSON.parse(JSON.stringify(atStair))))
const carriedWord = takeChoice(atStair, 'out')
assert.equal(carriedWord.sceneId, 'ending-warning')
assert.equal(scene('ending-warning').ending, 'bittersweet')
assert.ok(carriedWord.flags.includes('deed:left-the-altar'))
assert.equal(carriedWord.health, 1)
const bindAtStair = scene('a8-give-ground').choices?.find(
  (choice) => choice.id === 'bind',
)
assert.ok(bindAtStair)
assert.ok(lockReason(atStair, bindAtStair), 'binding the wound costs a bandage')
assert.equal(takeChoice(atStair, 'bind'), atStair)
const bandagedAtStair: Run = { ...atStair, items: ['water', 'bandage'] }
assert.deepEqual(hopelessFights(bandagedAtStair, bindAtStair), [])
const boundWound = takeChoice(bandagedAtStair, 'bind')
assert.equal(boundWound.sceneId, 'abbess')
assert.equal(
  boundWound.health,
  3,
  'a bandage buys two HP, as on the night road',
)
assert.deepEqual(boundWound.items, ['water'])
assert.equal(boundWound.battle?.hp, 9)
assert.ok(
  bestWinChance(
    'abbess',
    boundWound.attributes,
    boundWound.health,
    boundWound.resolve,
  ) > 0.2,
)
const backDown = takeChoice(atStair, 'back')
assert.equal(backDown.sceneId, 'abbess')
assert.equal(backDown.health, 1)
assert.ok(
  !visibleChoices(
    { ...woundedNoSister, flags: ['sister-free'] },
    scene('a8-voice-wound'),
  ).some((choice) => choice.id === 'give-ground'),
  'with the sister free, the retreat takes the children',
)

// Every other place a fight can close in, at its worst: 1 HP, no Resolve, an
// empty pack. Each keeps the fight on offer and a way on that is not one.
const worstCase = (sceneId: string, flags: string[]): Run => ({
  ...startRun(5),
  sceneId,
  health: 1,
  resolve: 0,
  items: [],
  flags,
})
for (const [sceneId, flags, way, to] of [
  [
    'a8-voice-wound',
    ['sister-free'],
    'escape-with-sister',
    'a8-wounded-flight',
  ],
  ['abbess-strikes', [], 'a8-stair', 'a8-give-ground'],
  ['abbess-strikes', ['sister-free'], 'a8-run', 'ending-hunted'],
  ['a8-word-kept', ['sister-free'], 'run', 'ending-hunted'],
  ['a8-standoff', [], 'leave', 'ending-warning'],
  ['a8-standoff-break', ['sister-free'], 'run', 'ending-hunted'],
  ['cellar', [], 'a8-leave', 'ending-warning'],
  ['a4-well-grab', ['sister-wary'], 'scatter', 'a4-well-scatter'],
] as const) {
  const run = worstCase(sceneId, [...flags])
  const open = visibleChoices(run, scene(sceneId)).filter(
    (choice) => !lockReason(run, choice),
  )
  assert.ok(
    open.some((choice) => hopelessFights(run, choice).length),
    sceneId + ': the hopeless fight is still a choice',
  )
  const exit = open.find((choice) => choice.id === way)
  assert.ok(exit, sceneId + '/' + way + ' is open at the worst')
  assert.deepEqual(fightsOpenedBy(run, exit), [], sceneId + '/' + way)
  const after = takeChoice(run, way)
  assert.equal(after.sceneId, to)
  assert.equal(after.battle, null)
  assert.equal(after.health, 1, sceneId + '/' + way + ' cannot heal')
  assert.equal(after.resolve, 0, sceneId + '/' + way + ' cannot grant Resolve')
}
const scattered = takeChoice(
  takeChoice(worstCase('a4-well-grab', ['sister-wary']), 'scatter'),
  'on',
)
assert.equal(scattered.sceneId, 'a4-wide-berth')
assert.ok(scattered.flags.includes('a4-stripped'), 'running costs the goods')
assert.equal(scattered.health, 1)
const tollAtWorst = worstCase('a4-well-toll', ['sister-wary'])
assert.ok(
  visibleChoices(tollAtWorst, scene('a4-well-toll')).some(
    (choice) =>
      !lockReason(tollAtWorst, choice) &&
      !hopelessFights(tollAtWorst, choice).length,
  ),
  'a failed bluff at the well no longer corners Zuzu into the band',
)

// The seeded battery: real dice, real packs and four fighting styles. At every
// decision some open choice must not open a fight Zuzu cannot win.
let hopeRng = 20261113
const hopeRand = (n: number) => {
  hopeRng = (hopeRng * 1103515245 + 12345) >>> 0
  return (hopeRng >>> 16) % n
}
let decisions = 0
let lowDecisions = 0
let hopelessStarts = 0
let woundedAloneStates = 0
for (let walk = 0; walk < 12000; walk++) {
  let run = startRun(walk * 15485863 + 3)
  const style = walk % 4
  for (let step = 0; step < 260 && !scene(run.sceneId).ending; step++) {
    if (run.pendingLoot.length) {
      run = resolveLoot(run, null)
      continue
    }
    if (run.battle) {
      const exposed = run.battle.exposed
      const proposed: BattleAction =
        style === 0
          ? (['strike', 'guard', 'feint', 'quiet-draw'] as const)[hopeRand(4)]!
          : style === 1
            ? 'strike'
            : exposed
              ? 'strike'
              : style === 2
                ? 'feint'
                : 'guard'
      run = fight(
        run,
        proposed === 'quiet-draw' && run.resolve < 2 ? 'strike' : proposed,
      )
      continue
    }
    const open = visibleChoices(run, scene(run.sceneId)).filter(
      (choice) => !lockReason(run, choice),
    )
    decisions++
    if (run.health <= 3) lowDecisions++
    if (
      run.sceneId === 'a8-voice-wound' &&
      !run.flags.includes('sister-free') &&
      taint(run) < 2 &&
      run.health <= 3
    )
      woundedAloneStates++
    assert.ok(
      open.some((choice) => !hopelessFights(run, choice).length),
      run.sceneId +
        ' at ' +
        run.health +
        ' HP offers only fights Zuzu cannot win: ' +
        open.map((choice) => choice.id).join(', '),
    )
    run = takeChoice(run, open[hopeRand(open.length)]!.id)
    if (
      run.battle &&
      !bestWinChance(run.sceneId, run.attributes, run.health, run.resolve)
    )
      hopelessStarts++
  }
}
console.log(
  'Gamebook no forced hopeless fight: ' +
    decisions +
    ' seeded decisions (' +
    lowDecisions +
    ' at 3 HP or less, ' +
    woundedAloneStates +
    ' wounded and alone at the bargain), ' +
    hopelessStarts +
    ' hopeless fights chosen, none forced',
)
assert.ok(lowDecisions > 1000 && woundedAloneStates > 10 && hopelessStarts > 50)

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
  /<header-page-bar v-if="!frontOpen">\s*<div[^>]*data-testid="zuzu-gamebook-hud"/,
  'the toolbar row docks into the system bar',
)
assert.doesNotMatch(page, /class="kr-toolbar/, 'no second header strip')
assert.match(page, /data-testid="zuzu-gamebook-ledger-menu"/)
assert.match(page, /data-testid="zuzu-gamebook-ledger"/)
assert.match(page, /store\.discovered\.includes\(ending\)/)
assert.match(page, /recentTrail/)

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
assert.match(
  page,
  /const risk = locked \? null : fightCue\(store\.run, choice\)/,
  'open choice cards carry the fight cue',
)
assert.match(page, /hint: locked \?\? risk\?\.hint/)

// t-007 chapter pacing. Acts run in book order: a way on stays in its act or
// opens the next one. Act V's early arrivals at the altar skip Dustwater and
// the night road; such a jump must land on a bridge written for it (every way
// into it is a jump), never cut straight into a set piece Act VIII leads into.
const ACT_ORDER: string[] = Object.values(CH)
const actIndex = (id: string) => ACT_ORDER.indexOf(BOOK[id]!.chapter)
const waysOn = (node: (typeof BOOK)[string]) => [
  ...(node.choices ?? []).flatMap((choice) =>
    choice.check ? [choice.check.success, choice.check.failure] : [choice.to],
  ),
  ...(node.battle ? [node.battle.win, node.battle.lose] : []),
]
const waysIn = new Map<string, string[]>()
for (const node of Object.values(BOOK))
  for (const to of waysOn(node))
    waysIn.set(to, [...(waysIn.get(to) ?? []), node.id])
const bridges = new Set<string>()
for (const node of Object.values(BOOK)) {
  assert.ok(actIndex(node.id) >= 0, node.id + ': unknown act ' + node.chapter)
  for (const to of waysOn(node)) {
    if (BOOK[to]!.ending) continue
    const step = actIndex(to) - actIndex(node.id)
    assert.ok(step >= 0, node.id + ' -> ' + to + ' runs back an act')
    if (step < 2) continue
    bridges.add(to)
    assert.ok(
      waysIn.get(to)!.every((from) => actIndex(to) - actIndex(from) >= 2),
      node.id + ' -> ' + to + ' skips an act without a bridge section',
    )
  }
}
assert.deepEqual(
  [...bridges].sort(),
  ['a8-behind-the-altar', 'a8-under-the-wall'],
  'the early arrivals at the altar each cross a bridge',
)
for (const bridge of bridges) {
  assert.equal(BOOK[bridge]!.chapter, CH.VIII)
  assert.deepEqual(waysOn(BOOK[bridge]!), ['cellar'])
}

// Seeded journeys measure how an act feels to play through: the sections a run
// spends in each act it finishes (bands from the 2026-11-05 measure,
// with headroom), and the longest run of pages that offer a single way on.
// The longest is the Night Road's long way round, five pages of "Run." that
// cost the night: a deliberate slog, and the ceiling for any new chain.
const ACT_BANDS: Record<string, [number, number]> = {
  [CH.I]: [2, 18],
  [CH.II]: [2, 18],
  [CH.III]: [12, 22],
  [CH.IV]: [14, 27],
  [CH.V]: [2, 30],
  [CH.VI]: [1, 19],
  [CH.VII]: [2, 12],
  [CH.VIII]: [2, 16],
  [CH.IX]: [2, 17],
}
const MAX_SINGLE_WAY_PAGES = 5
let paceRng = 20261105
const paceRand = (n: number) => {
  paceRng = (paceRng * 1103515245 + 12345) >>> 0
  return (paceRng >>> 16) % n
}
const paced = new Map<string, number[]>()
let longestSingleWay: string[] = []
let actTurns = 0
for (let walk = 0; walk < 2500; walk++) {
  let run = startRun(walk * 104729 + 3)
  let singleWay: string[] = []
  for (let step = 0; step < 400; step++) {
    const node = scene(run.sceneId)
    const before = run.visited[run.visited.length - 2]
    const turn =
      !node.ending && (!before || BOOK[before]!.chapter !== node.chapter)
    assert.equal(actOpening(run), turn ? node.chapter : null, node.id)
    if (turn && before) actTurns++
    if (node.ending) break
    if (run.pendingLoot.length) {
      const slot = paceRand(run.items.length + 1)
      run = resolveLoot(run, slot === run.items.length ? null : slot)
    } else if (run.battle) {
      singleWay = []
      const move = actions[paceRand(actions.length)]!
      run = fight(
        run,
        move === 'quiet-draw' && run.resolve < 2 ? 'strike' : move,
      )
    } else {
      const open = visibleChoices(run, node).filter((c) => !lockReason(run, c))
      singleWay = open.length === 1 ? [...singleWay, node.id] : []
      if (singleWay.length > longestSingleWay.length)
        longestSingleWay = singleWay
      run = takeChoice(run, open[paceRand(open.length)]!.id)
    }
  }
  assert.ok(scene(run.sceneId).ending, 'pacing walk ' + walk + ' never ended')
  let from = 0
  for (let i = 1; i < run.visited.length; i++) {
    const act = BOOK[run.visited[from]!]!.chapter
    if (BOOK[run.visited[i]!]!.chapter === act) continue
    // An act counts when the run finishes it: on into a later act, or, in
    // the last act, to its ending. A run cut short mid-act is not pacing.
    if (!BOOK[run.visited[i]!]!.ending || act === CH.IX)
      paced.set(act, [...(paced.get(act) ?? []), i - from])
    from = i
  }
}
const pacingReport: string[] = []
for (const [act, [low, high]] of Object.entries(ACT_BANDS)) {
  const spent = paced.get(act) ?? []
  assert.ok(spent.length > 20, act + ': too few journeys finish it')
  const span = Math.min(...spent) + '-' + Math.max(...spent)
  pacingReport.push(act.split(' ')[0] + ' ' + span)
  assert.ok(
    Math.min(...spent) >= low && Math.max(...spent) <= high,
    act + ' takes ' + span + ' sections, outside ' + low + '-' + high,
  )
}
assert.ok(
  longestSingleWay.length <= MAX_SINGLE_WAY_PAGES,
  'single-way chain too long: ' + longestSingleWay.join(' > '),
)
assert.ok(actTurns > 2500, 'journeys cross acts')
console.log(
  'Gamebook act pacing (sections per finished act): ' +
    pacingReport.join(', ') +
    '; longest single-way run ' +
    longestSingleWay.length,
)

// Every act turn is announced on the page itself, on every screen.
assert.equal(actOpening(startRun(5)), CH.I)
const lateWall: Run = {
  ...startRun(5),
  sceneId: 'run-late',
  visited: ['the-crossing', 'run-late'],
}
const overTheWall = takeChoice(lateWall, 'gate')
assert.equal(overTheWall.sceneId, 'mission-night')
assert.equal(actOpening(overTheWall), CH.VIII)
const leftAtGate: Run = {
  ...startRun(5),
  sceneId: 'mission',
  visited: ['the-crossing', 'mission'],
  flags: ['no-tracks-out'],
  attributes: { ...startRun(5).attributes, sense: 4 },
}
const underWall = takeChoice(leftAtGate, 'investigate')
assert.equal(underWall.sceneId, 'a8-under-the-wall', 'the drain bridges V-VIII')
assert.equal(actOpening(underWall), CH.VIII)
const atAltar = takeChoice(underWall, 'in')
assert.equal(atAltar.sceneId, 'cellar')
assert.equal(actOpening(atAltar), null, 'the act has already opened')
assert.equal(actOpening({ ...atAltar, sceneId: 'ending-warning' }), null)
assert.match(page, /data-testid="zuzu-gamebook-act-opening"/)
assert.match(
  page,
  /const opening = computed\(\(\) => actOpening\(store\.run\)\)/,
)

// A missing plate degrades: an unknown art key shows the stand-in road plate,
// and a plate file that fails to load in the reader gives way to it once.
assert.equal(
  sectionPlate({ id: 'no-such-section', art: 'no-plate' }),
  FALLBACK_PLATE,
)
assert.equal(FALLBACK_PLATE.fit, 'stand-in')
assert.ok(FALLBACK_PLATE.alt.length > 40)
assert.ok(existsSync(join(scenesDir, FALLBACK_PLATE.file + '.webp')))
assert.equal(
  (page.match(/@error="plateFailed\(platePath\(art\)\)"/g) ?? []).length,
  2,
  'both stage images fall back',
)
assert.match(page, /:src="shownPlate\(entry\.art\)"/)

// t-008 UI polish: the odds a card shows are the engine's own, every fight
// keeps a readable per-round log, items say what they do, and a journey can be
// carried as a save code. None of it touches the dice or the golden routes.
{
  // 2d6 odds out of 36 throws.
  assert.equal(checkChance(0, 7), 58)
  assert.equal(checkChance(0, 2), 100)
  assert.equal(checkChance(0, 13), 0)
  assert.equal(checkChance(2, 9), 58)
  assert.equal(checkChance(-2, 12), 0)
  assert.equal(checkChance(4, 6), 100)

  // A checked choice rolls with exactly the modifier its card quotes.
  const bonusSpots = Object.values(BOOK).flatMap((node) =>
    (node.choices ?? [])
      .filter((choice) => choice.check?.bonus)
      .map((choice) => ({ node, choice })),
  )
  assert.ok(bonusSpots.length > 10, 'knowledge bonuses exist to quote')
  let quotedRolls = 0
  for (const { node, choice } of bonusSpots) {
    const check = choice.check!
    const knowing: Run = {
      ...startRun(41),
      sceneId: node.id,
      items: ['water', 'bandage', 'apple', 'flint'],
      flags: [check.bonus!.flag],
    }
    const plain: Run = { ...knowing, flags: [] }
    const quoted = checkModifier(knowing, check)
    assert.equal(
      quoted.bonus,
      check.bonus!.unless === check.bonus!.flag ? 0 : check.bonus!.amount,
    )
    assert.equal(checkModifier(plain, check).bonus, 0)
    if (lockReason(knowing, choice)) continue
    if (!visibleChoices(knowing, node).includes(choice)) continue
    const rolled = takeChoice(knowing, choice.id).lastRoll
    quotedRolls++
    assert.ok(rolled, node.id + '/' + choice.id + ' rolls')
    assert.equal(rolled.modifier, quoted.modifier, node.id + '/' + choice.id)
    assert.equal(rolled.target, check.target)
    const card = choiceTerms(knowing, choice)
    assert.ok(
      card.chip.includes(
        ['Steel', 'Sense', 'Shadow', 'Mercy'][
          ['steel', 'sense', 'shadow', 'mercy'].indexOf(check.attribute)
        ] +
          ' ' +
          check.target +
          '+ · ' +
          checkChance(quoted.modifier, check.target) +
          '%',
      ),
      node.id + '/' + choice.id + ' card quotes its odds: ' + card.chip,
    )
    if (quoted.bonus)
      assert.match(card.details[0]!, /for what you know/, 'bonus is named')
  }
  assert.ok(
    quotedRolls > 10,
    'card odds checked against ' + quotedRolls + ' rolls',
  )

  // Costs, items and healing read on the card, without repeating a label note.
  const terms = (
    sceneId: string,
    choiceId: string,
    patch: Partial<Run> = {},
  ) => {
    const node = scene(sceneId)
    const choice = node.choices!.find((entry) => entry.id === choiceId)!
    const note = /\(([^()]+)\)\s*$/.exec(choice.label)?.[1] ?? ''
    return choiceTerms({ ...startRun(3), sceneId, ...patch }, choice, note)
  }
  assert.deepEqual(
    terms('rescue', 'seal').chip,
    [],
    '(2 Resolve) is not doubled',
  )
  assert.match(terms('rescue', 'seal').details.join(' '), /Costs 2 Resolve/)
  assert.deepEqual(terms('a4-canyon-floor', 'carry').chip, ['1 Resolve'])
  assert.ok(
    !terms('a1-bad-ground', 'ridge').chip.some((part) => /bandage/.test(part)),
    '(Spend bandage) is not doubled',
  )
  assert.deepEqual(terms('cold-camp', 'fire').chip, ['Needs flint', '+3 HP'])
  assert.match(terms('cold-camp', 'fire').details.join(' '), /you keep it/)
  assert.deepEqual(terms('the-crossing', 'approach').chip, ['Uses water'])
  assert.match(
    terms('the-crossing', 'approach').details.join(' '),
    /Uses up your canteen of water/,
  )
  assert.deepEqual(terms('apple-tree', 'take').chip, ['Gain apple'])
  assert.match(
    terms('apple-tree', 'take', {
      items: ['water', 'bandage', 'apple', 'flint', 'water'],
    }).details.join(' '),
    /pack is full/,
  )

  // Every item the book gives, takes or asks for explains itself on the sheet.
  const bookItems = new Set(startRun(1).items)
  for (const node of Object.values(BOOK)) {
    if (node.effects?.gain) bookItems.add(node.effects.gain)
    for (const choice of node.choices ?? [])
      for (const item of [choice.gain, choice.spend, choice.requires])
        if (item) bookItems.add(item)
  }
  assert.deepEqual([...bookItems].sort(), Object.keys(ITEM_INFO).sort())
  for (const [item, info] of Object.entries(ITEM_INFO)) {
    assert.ok(info.name && info.use.length > 20 && info.spent.length > 20, item)
    const spentBy = Object.values(BOOK).some((node) =>
      (node.choices ?? []).some((choice) => choice.spend === item),
    )
    const keptBy = Object.values(BOOK).some((node) =>
      (node.choices ?? []).some(
        (choice) => choice.requires === item && choice.spend !== item,
      ),
    )
    assert.equal(
      /^Kept/.test(info.spent),
      keptBy,
      item + ': kept-or-spent line',
    )
    assert.ok(spentBy || keptBy, item + ' is used somewhere')
  }
  assert.equal(itemInfo('silver-key').name, 'Silver key', 'unknown items read')

  // Combat move cards quote this round's real roll.
  const atCroc: Run = { ...coyote, health: 12, resolve: 4 }
  const croc = scene(atCroc.sceneId).battle!
  for (const action of actions) {
    const check = moveCheck(atCroc, action)!
    const card = moveTerms(atCroc, action)!
    assert.ok(
      card.chip.endsWith(
        check.target + '+ · ' + checkChance(check.modifier, check.target) + '%',
      ),
      action + ': ' + card.chip,
    )
    const swung = fight(atCroc, action)
    assert.equal(swung.lastRoll?.modifier, check.modifier, action)
    assert.equal(swung.lastRoll?.target, check.target, action)
  }
  assert.equal(moveCheck(atCroc, 'guard')!.target, 8)
  const opened: Run = {
    ...atCroc,
    battle: { ...atCroc.battle!, exposed: true },
  }
  assert.equal(
    moveCheck(opened, 'strike')!.target,
    moveCheck(atCroc, 'strike')!.target - 2,
    'an open foe is easier to hit, and the card says so',
  )
  assert.match(moveTerms(atCroc, 'quiet-draw')!.chip, /^2 Resolve · Steel/)
  assert.match(
    moveTerms(atCroc, 'strike')!.hint,
    new RegExp('take ' + croc.attack),
  )
  assert.equal(moveCheck(startRun(1), 'strike'), null, 'no fight, no card')

  // Each round is logged: the move, dice, damage both ways and HP left.
  let logged: Run = atCroc
  for (const action of ['feint', 'strike', 'guard'] as const) {
    const before = logged
    logged = fight(logged, action)
    if (!logged.battle) break
    const rounds = logged.battle.rounds!
    const round = rounds[rounds.length - 1]!
    assert.equal(rounds.length, (before.battle!.rounds?.length ?? 0) + 1)
    assert.equal(round.turn, before.battle!.turn)
    assert.equal(round.action, action)
    assert.deepEqual(round.dice, logged.lastRoll!.dice)
    assert.equal(round.total, logged.lastRoll!.total)
    assert.equal(round.dealt, before.battle!.hp - logged.battle.hp)
    assert.equal(round.taken, before.health - logged.health)
    assert.equal(round.foeHp, logged.battle.hp)
    assert.equal(round.health, logged.health)
    assert.equal(round.opened, logged.battle.exposed)
  }
  // A long fight keeps only its latest rounds.
  let stalled: Run = { ...atCroc, health: 12 }
  for (let i = 0; i < 30 && stalled.battle; i++)
    stalled = fight(stalled, 'guard')
  if (stalled.battle) {
    assert.equal(stalled.battle.rounds!.length, LOG_ROUNDS)
    assert.equal(
      stalled.battle.rounds![LOG_ROUNDS - 1]!.turn,
      stalled.battle.turn - 1,
    )
  } else {
    assert.equal(stalled.lastFight?.won, false, 'guarding forever loses')
    assert.equal(stalled.lastFight!.rounds.length, LOG_ROUNDS)
  }

  // A plain-words entry a playtester can read on a phone.
  const sample: CombatRound = {
    turn: 2,
    action: 'feint',
    dice: [4, 3],
    modifier: 1,
    target: 9,
    total: 8,
    success: false,
    dealt: 0,
    taken: 3,
    foeHp: 5,
    health: 9,
    opened: false,
  }
  assert.deepEqual(combatEntry(sample, 'River Croc', 8), {
    head: 'Round 2 · Feint: 4 + 3 + 1 = 8 vs 9, missed.',
    tail: 'Zuzu takes 3. Zuzu 9/12 HP · River Croc 5/8 HP.',
    text: 'Round 2 · Feint: 4 + 3 + 1 = 8 vs 9, missed. Zuzu takes 3. Zuzu 9/12 HP · River Croc 5/8 HP.',
  })
  assert.equal(
    combatEntry(
      {
        ...sample,
        action: 'quiet-draw',
        modifier: -1,
        total: 6,
        target: 6,
        success: true,
        dealt: 5,
        taken: 0,
        foeHp: 0,
      },
      'River Croc',
      8,
    ).text,
    'Round 2 · Quiet Draw: 4 + 3 - 1 = 6 vs 6, hit for 5. River Croc is beaten. Zuzu 9/12 HP · River Croc 0/8 HP.',
  )
  assert.match(
    combatEntry(
      { ...sample, action: 'guard', success: true, taken: 0, opened: true },
      'Hask',
      9,
    ).head,
    /Guard: .*, held, the foe is open\.$/,
  )
  assert.match(
    combatEntry({ ...sample, health: 0 }, 'Hask', 9).tail,
    /Zuzu falls\.$/,
  )

  // The page after a fight carries its report until the next choice.
  let won: Run | null = null
  for (let seed = 1; seed <= 200 && !won; seed++) {
    let run: Run = { ...atCroc, seed }
    for (let i = 0; i < 20 && run.battle; i++)
      run = fight(run, run.resolve >= 2 ? 'quiet-draw' : 'strike')
    if (run.lastFight?.won) won = run
  }
  assert.ok(won, 'some seeded fight is won')
  const winner: Run = won
  assert.equal(won.sceneId, croc.win)
  assert.equal(won.lastFight!.foe, croc.name)
  assert.equal(won.lastFight!.foeMax, croc.hp)
  assert.equal(
    won.lastFight!.rounds[won.lastFight!.rounds.length - 1]!.foeHp,
    0,
  )
  assert.ok(isSavedRun(JSON.parse(JSON.stringify(won))), 'a fight report saves')
  const movedOn = visibleChoices(winner, scene(winner.sceneId)).find(
    (choice) => !lockReason(winner, choice) && !choice.check,
  )
  assert.ok(movedOn, 'the page after the fight offers a way on')
  assert.equal(takeChoice(winner, movedOn.id).lastFight, null)
  let lost: Run = { ...atCroc, health: 1 }
  for (let i = 0; i < 20 && lost.battle; i++) lost = fight(lost, 'strike')
  if (lost.lastFight && !lost.lastFight.won) {
    assert.equal(lost.sceneId, croc.lose)
    assert.equal(
      lost.lastFight.rounds[lost.lastFight.rounds.length - 1]!.health,
      0,
    )
  }
  // Story choices never invent a report: an older save has none to clear.
  assert.equal('lastFight' in takeChoice(initial, 'approach'), false)

  // Saves from before the combat log still load and fight on.
  const oldFight = JSON.parse(JSON.stringify(atCroc)) as Run
  delete oldFight.battle!.rounds
  assert.ok(isSavedRun(oldFight), 'a mid-fight save without a log loads')
  assert.equal(fight(oldFight, 'strike').battle?.rounds?.length ?? 1, 1)
  assert.equal(
    isSavedRun({ ...atCroc, battle: { ...atCroc.battle!, rounds: 'x' } }),
    false,
  )
  assert.equal(
    isSavedRun({
      ...atCroc,
      battle: { ...atCroc.battle!, rounds: [{ turn: 1 }] },
    }),
    false,
  )
  assert.equal(isSavedRun({ ...winner, lastFight: { foe: 3 } }), false)
  assert.ok(isSavedRun({ ...initial, lastFight: null }))

  // A save code carries a journey to another device, and refuses anything else.
  for (const journey of [initial, atCroc, winner, offered]) {
    const code = encodeSaveCode(journey)
    assert.ok(code.startsWith(SAVE_CODE_PREFIX) && /^[\w.-]+$/.test(code))
    assert.deepEqual(decodeSaveCode(code), journey)
    assert.deepEqual(
      decodeSaveCode('  ' + code.replace(/(.{40})/g, '$1\n') + '\n'),
      journey,
      'a code wrapped by a chat app still loads',
    )
  }
  const legacyCode = encodeSaveCode(legacySave as unknown as Run)
  assert.deepEqual(decodeSaveCode(legacyCode)?.pendingLoot, [])
  const accented: Run = { ...initial, flags: ['learned:café-bell'] }
  assert.deepEqual(decodeSaveCode(encodeSaveCode(accented)), accented)
  const good1 = encodeSaveCode(initial)
  for (const bad of [
    '',
    'hello',
    good1.slice(0, -6),
    good1.replace(SAVE_CODE_PREFIX, 'ZUZU2.'),
    SAVE_CODE_PREFIX + '!!!!',
    SAVE_CODE_PREFIX + 'e30',
    encodeSaveCode({ ...initial, health: 500 }),
    encodeSaveCode({ ...initial, sceneId: 'nowhere' }),
    encodeSaveCode({
      ...initial,
      attributes: { ...initial.attributes, steel: 9 },
    }),
    encodeSaveCode({ ...initial, visited: [] }),
    SAVE_CODE_PREFIX + 'A'.repeat(70000),
  ])
    assert.equal(decodeSaveCode(bad), null, 'refused: ' + bad.slice(0, 30))

  // The reader wires all of it in (markup-level guards).
  const store = readFileSync(
    join(process.cwd(), 'stores/zuzuGamebookStore.ts'),
    'utf8',
  )
  assert.match(store, /savedAt\.value = Date\.now\(\)/, 'a save marks the time')
  assert.match(store, /saveFailed\.value = true/, 'blocked storage is told')
  assert.match(store, /const next = decodeSaveCode\(code\)/)
  assert.match(store, /recoverable\.value = run\.value\s+run\.value = next/)
  assert.match(page, /data-testid="zuzu-gamebook-saved"/)
  assert.match(page, /data-testid="zuzu-gamebook-save-code"/)
  assert.match(page, /store\.importCode\(importText\.value\)/)
  assert.match(page, /store\.exportCode\(\)/)
  assert.match(page, /data-testid="zuzu-gamebook-combat-log"/)
  assert.match(page, /data-testid="zuzu-gamebook-fight-report"/)
  assert.match(page, /aria-live="polite">\s*\{\{ battleLog\[0\]!\.text \}\}/)
  assert.match(page, /const terms = choiceTerms\(store\.run, choice, note\)/)
  assert.match(page, /const terms = moveTerms\(store\.run, move\.action\)/)
  assert.match(page, /\{\{ itemInfo\(item\)\.use \}\}/)
  assert.match(page, /\{\{ itemInfo\(item\)\.spent \}\}/)
  assert.doesNotMatch(page, /\(planned\)/, 'the sheet promises only real arts')

  // t-008 round 6: a card states its roll once. The label's "(Sense · 9)" note
  // restated the roll the chip already quotes with its odds.
  assert.equal(noteBeyondRoll('Sense · 9', choiceCheck('sense', 9)), undefined)
  assert.equal(
    noteBeyondRoll(
      'Shadow · 9; fail: hurt, cornered',
      choiceCheck('shadow', 9),
    ),
    'Fail: hurt, cornered',
  )
  assert.equal(
    noteBeyondRoll('Mercy · 9; failure: cornered', choiceCheck('mercy', 9)),
    'Fail: cornered',
  )
  assert.equal(
    noteBeyondRoll('Sense · 11', choiceCheck('sense', 9)),
    'Sense · 11',
    'a note naming another roll stays whole',
  )
  assert.equal(noteBeyondRoll('2 Resolve', undefined), '2 Resolve')
  assert.equal(noteBeyondRoll(undefined, choiceCheck('steel', 9)), undefined)
  // Every roll note in the book names its own check, so none is left doubled.
  let rollNotes = 0
  for (const node of Object.values(BOOK))
    for (const choice of node.choices ?? []) {
      const note = /\(([^()]+)\)\s*$/.exec(choice.label)?.[1]
      if (!note || !/^\w+ · \d+/.test(note)) continue
      rollNotes++
      const rest = noteBeyondRoll(note, choice.check)
      assert.ok(
        rest === undefined || !/^\w+ · \d+/.test(rest),
        node.id + '/' + choice.id + ' note matches its check: ' + note,
      )
    }
  assert.ok(rollNotes > 40, rollNotes + ' roll notes checked')
  assert.match(
    page,
    /const rest = noteBeyondRoll\(note, check\)/,
    'the page drops the restated roll',
  )
  assert.match(
    page,
    /\[\.\.\.terms\.chip, shownHint \? rest : null, risk\?\.chip\]/,
  )
  assert.match(page, /hint: locked \?\? risk\?\.hint \?\? rest/)

  // Chips wrap between their parts on a narrow card (shared hand).
  const hand = readFileSync(
    join(process.cwd(), 'components/narrative/kr-choice-hand.vue'),
    'utf8',
  )
  assert.match(hand, /v-for="\(part, i\) in chipParts\(choice\.chip\)"/)
  assert.match(hand, /\.krh-title small \{\s*display: flex;\s*flex-wrap: wrap;/)

  // Below lg the character sheet is a modal drawer over the story, not a
  // replacement for it (t-008 round 6).
  assert.doesNotMatch(
    page,
    /showSheet \? 'hidden lg:block'/,
    'the sheet no longer hides the reading pane',
  )
  assert.match(page, /:inert="sheetModal && showSheet"/)
  assert.match(page, /window\.matchMedia\('\(max-width: 1023\.98px\)'\)/)
  const aside = /<aside[\s\S]*?>/.exec(page)?.[0] ?? ''
  assert.match(aside, /id="zuzu-sheet"/)
  assert.match(aside, /:role="sheetModal \? 'dialog' : undefined"/)
  assert.match(aside, /:aria-modal="sheetModal \? 'true' : undefined"/)
  assert.match(aside, /aria-labelledby="zuzu-sheet-heading"/)
  assert.match(aside, /max-lg:absolute/, 'a drawer over the page below lg')
  assert.doesNotMatch(
    aside,
    /(?<![\w:-])(?:fixed|absolute)/,
    'a plain column from lg up',
  )
  assert.match(page, /id="zuzu-sheet-heading"/)
  assert.match(page, /<Transition name="zuzu-sheet">\s*<aside/)
  assert.match(
    page,
    /data-testid="zuzu-gamebook-sheet-backdrop"\s*@click="closeSheet"/,
  )
  assert.match(
    page,
    /data-testid="zuzu-gamebook-sheet-close"\s*@click="closeSheet"/,
  )
  assert.match(page, /data-testid="zuzu-gamebook-sheet-toggle"/)
  assert.match(
    page,
    /if \(showSheet\.value\) \{\s*if \(event\.key === 'Escape'\) \{\s*event\.preventDefault\(\)\s*closeSheet\(\)\s*\} else if \(event\.key === 'Tab' && sheetModal\.value\) trapSheetFocus\(event\)/,
    'Escape closes the sheet and Tab stays inside it',
  )
  assert.match(page, /sheetClose\.value\?\.focus\(\)/, 'focus moves into it')
  assert.match(page, /sheetToggle\.value\?\.focus\(\)/, 'and back on close')
  assert.match(
    page,
    /@media \(prefers-reduced-motion: reduce\) \{[^@]*\.zuzu-sheet-enter-active,\s*\.zuzu-sheet-leave-active \{\s*transition: none;/,
  )

  // Hit feedback: a round's blows show on screen, only for rounds fought here.
  assert.match(
    page,
    /if \(move && moveCards\.value\.includes\(card\)\) fightRound\(move\.action\)/,
  )
  assert.match(page, /event\.preventDefault\(\)\s*fightRound\(move\.action\)/)
  assert.doesNotMatch(page, /store\.battle\(move\.action\)/)
  assert.match(page, /data-testid="zuzu-gamebook-hurt-flash"/)
  assert.match(page, /:class="battleHit\?\.taken \? 'zuzu-shake' : ''"/)
  assert.match(page, /:class="battleHit\?\.dealt \? 'zuzu-hit-foe' : ''"/)
  assert.match(page, /:class="hit\?\.taken \? 'zuzu-hurt-hud' : ''"/)
  assert.match(
    page,
    /@media \(prefers-reduced-motion: reduce\) \{\s*\.zuzu-shake,\s*\.zuzu-hit-foe \{\s*animation: none;\s*\}\s*\.zuzu-float \{\s*display: none;/,
    'reduced motion keeps only the colour flashes',
  )
}

function choiceCheck(
  attribute: Attribute,
  target: number,
): NonNullable<Choice['check']> {
  return { attribute, target, success: 'x', failure: 'y' }
}

console.log(
  'Zuzu gamebook contract: ' +
    ids.length +
    ' sections, ' +
    endings.length +
    ' endings, acyclic, act pacing, stateful exploration, plates, items, dice, combat replay, saves and power costs passed',
)
