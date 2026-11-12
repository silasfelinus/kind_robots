import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  WILD_BREAK_ENDINGS,
  WILD_BREAK_ENDING_COUNT,
  WILD_BREAK_ROOT,
  WILD_BREAK_SCENES,
  WILD_BREAK_SHIELD_MAX,
  WILD_BREAK_STEPS,
  createWildBreak,
  startWildBreakVoyage,
  validWildBreak,
  walkWildBreak,
  wildBreakCoda,
  wildBreakEnding,
  wildBreakEndingArtKey,
  wildBreakSceneArtKey,
} from '../gameOfCaptains/wildBreak'
import {
  restoreVoyage,
  startVoyage,
  type VoyageRun,
} from '../gameOfCaptains/rules'
import { createStarAssessment } from '../gameOfCaptains/starSigns'
import { episodeEndingCoda } from '../gameOfCaptains/episodeConsole'

// Silas, 2026-11-12: "there needs to be a wild break possible to avoid the
// horoscope, with at least 32 endings." The Couchscope's wild break is a
// 4 x 2 x 4 branching escape: every path is a distinct, reachable ending.

const fromRoot = (path: string) =>
  readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

assert.ok(WILD_BREAK_ENDING_COUNT >= 32, 'at least 32 wild break endings')
assert.equal(WILD_BREAK_ENDING_COUNT, 32)
assert.equal(WILD_BREAK_SCENES.length, 13, '1 + 4 + 8 branching scenes')
assert.equal(
  new Set(WILD_BREAK_ENDINGS.map((e) => e.id)).size,
  32,
  'every ending has its own id',
)
assert.equal(
  new Set(WILD_BREAK_ENDINGS.map((e) => e.title)).size,
  32,
  'every ending has its own title',
)
assert.equal(new Set(WILD_BREAK_ENDINGS.map((e) => e.text)).size, 32)
assert.equal(new Set(WILD_BREAK_ENDINGS.map((e) => e.coda)).size, 32)
for (const ending of WILD_BREAK_ENDINGS) {
  assert.ok(ending.text.length > 120, ending.id + ' has a real scene')
  assert.ok(ending.coda.length > 40, ending.id + ' has a finale coda')
  assert.equal(ending.perk.delta, 1)
}
for (const scene of WILD_BREAK_SCENES) {
  assert.ok(scene.text.length > 120, scene.id + ' has a real scene')
  assert.ok(scene.choices.length === 2 || scene.choices.length === 4)
  for (const choice of scene.choices) assert.ok(choice.label && choice.hint)
}

// Walk every path: each of 32 three-step paths lands on a different ending,
// every scene is visited and nothing dangles.
const reached = new Map<string, number[]>()
const visited = new Set<string>([WILD_BREAK_ROOT])
function explore(path: number[]) {
  const at = walkWildBreak(path)
  assert.ok(at, 'path resolves: ' + path.join('-'))
  if ('ending' in at) {
    assert.equal(path.length, WILD_BREAK_STEPS, 'endings come on step 3')
    assert.ok(!reached.has(at.ending.id), 'one path per ending')
    reached.set(at.ending.id, path)
    return
  }
  visited.add(at.scene.id)
  at.scene.choices.forEach((_choice, index) => explore([...path, index]))
}
explore([])
assert.equal(reached.size, 32, 'all 32 endings are reachable')
assert.equal(visited.size, 13, 'every scene is reachable')

// Records validate only when the path really reaches the named ending.
const [firstId, firstPath] = [...reached.entries()][0]!
assert.deepEqual(createWildBreak(firstPath), {
  path: firstPath,
  ending: firstId,
})
assert.ok(validWildBreak({ path: firstPath, ending: firstId }))
assert.ok(!validWildBreak({ path: firstPath, ending: 'the-climb-down' }))
assert.ok(!validWildBreak({ path: [0, 0], ending: firstId }))
assert.ok(!validWildBreak({ path: [9, 0, 0], ending: firstId }))
assert.ok(!validWildBreak({ path: [0, 0, 0, 0], ending: firstId }))
assert.equal(createWildBreak([0, 0]), null, 'an unfinished break is no ending')

// Launching unsigned: no constellation, the ending's one perk, a flag and a log.
const base = startVoyage('fluke', ['pell', 'vela', 'taal'], 4242)
for (const [id, path] of reached) {
  const ending = wildBreakEnding(id)!
  const run = startWildBreakVoyage(base, { path, ending: id })
  assert.equal(run.starAssessment, undefined, id + ' launches unsigned')
  assert.deepEqual(run.wildBreak, { path, ending: id })
  assert.ok(run.worldFlags?.includes('wild-break:' + id))
  assert.match(run.log.at(-1)!, /^WILD BREAK: /)
  const meter = ending.perk.meter
  if (meter === 'shieldCharge')
    assert.equal(
      run.shieldCharge,
      Math.min(WILD_BREAK_SHIELD_MAX, (base.shieldCharge ?? 2) + 1),
    )
  else assert.equal(run[meter], base[meter] + 1, id + ' perk applied')

  // It survives a save and reload.
  const restored = restoreVoyage(JSON.parse(JSON.stringify(run)))
  assert.ok(restored, id + ' restores')
  assert.deepEqual(restored!.wildBreak, run.wildBreak)

  // The finale reads its coda back.
  const finished: VoyageRun = {
    ...run,
    phase: 'ending',
    ending: 'CAPTAIN OF THE OPEN HORIZON',
    scene: 'The voyage ends.',
  }
  const coda = episodeEndingCoda(finished)
  assert.ok(coda.scene.includes(ending.coda), id + ' coda in the finale')
  assert.ok(coda.log.some((line) => line.startsWith('Wild break epilogue: ')))
  assert.equal(
    wildBreakCoda(run.wildBreak),
    'THE UNSIGNED CAPTAIN: ' + ending.title + '. ' + ending.coda,
  )
}

// A shield-perk break never overfills the force bubble.
const shieldEnding = WILD_BREAK_ENDINGS.find(
  (e) => e.perk.meter === 'shieldCharge',
)!
const fullBubble = startWildBreakVoyage(
  { ...base, shieldCharge: WILD_BREAK_SHIELD_MAX },
  { path: reached.get(shieldEnding.id)!, ending: shieldEnding.id },
)
assert.equal(fullBubble.shieldCharge, WILD_BREAK_SHIELD_MAX)

// A wild break never stacks with a sign, twice, or from a forged record.
const signed = startVoyage(
  'fluke',
  ['pell', 'vela', 'taal'],
  4242,
  createStarAssessment([0, 0, 0])!,
)
assert.equal(
  startWildBreakVoyage(signed, { path: firstPath, ending: firstId }),
  signed,
)
const once = startWildBreakVoyage(base, { path: firstPath, ending: firstId })
assert.equal(
  startWildBreakVoyage(once, { path: firstPath, ending: firstId }),
  once,
)
assert.equal(
  startWildBreakVoyage(base, { path: firstPath, ending: 'the-climb-down' }),
  base,
)
assert.equal(
  restoreVoyage({ ...once, starAssessment: createStarAssessment([0, 0, 0]) }),
  null,
  'a save cannot claim both a sign and a wild break',
)
assert.equal(
  restoreVoyage({
    ...once,
    wildBreak: { path: [0, 0, 0], ending: 'the-climb-down' },
  }),
  null,
  'a forged wild break is rejected',
)
assert.ok(
  restoreVoyage(JSON.parse(JSON.stringify(base))),
  'v1 saves without a break still load',
)

// UI contract: the Couchscope always offers the break, the ending screen shows
// its number out of 32, the found ledger and an unsigned launch.
const scope = fromRoot('components/gameOfCaptains/constellation-test.vue')
for (const id of [
  'space-couch-wild-break-start',
  'space-couch-wild-break',
  'space-couch-wild-ending',
  'space-couch-wild-ledger',
  'space-couch-wild-launch',
  'space-couch-wild-again',
  'space-couch-wild-back',
  'space-couch-wild-return',
  'space-couch-wild-art',
])
  assert.ok(scope.includes(`"${id}"`), id)
assert.ok(scope.includes("emit('wildBreak', record)"))
assert.ok(scope.includes("emit('wildEnding', wildEndingNow.value.id)"))
const page = fromRoot('pages/play/game-of-captains.vue')
assert.ok(page.includes('@wild-break="confirmWildBreak"'))
assert.ok(page.includes('@wild-ending="store.recordWildBreakEnding"'))
assert.ok(page.includes(':wild-found="store.wildBreakFound"'))
const store = fromRoot('stores/gameOfCaptainsStore.ts')
assert.ok(store.includes('startWildBreakVoyage(started, wildBreak)'))
assert.ok(store.includes("'game-of-captains-wild-break-endings-v1'"))

// Art keys line up with Conductor's WILD-BREAK-ROUND-1 ledger assets.
assert.equal(wildBreakSceneArtKey('walkout'), 'couchscope/wild/walkout')
assert.equal(
  wildBreakEndingArtKey('the-climb-down'),
  'couchscope/wild-end/the-climb-down',
)

console.log(
  'Space Couch wild break: 13 scenes, 32 reachable endings, unsigned launch, save and finale coda verified',
)
