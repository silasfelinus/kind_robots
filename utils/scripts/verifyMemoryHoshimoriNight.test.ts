import assert from 'node:assert/strict'
import {
  HOSHIMORI_NIGHT_MAX_EVENTS,
  HOSHIMORI_NIGHT_SITES,
  advanceHoshimoriNight,
  canMoveHoshimoriNight,
  hoshimoriNightClues,
  hoshimoriNightCouncil,
  hoshimoriNightOrder,
  newHoshimoriNightProgress,
  restoreHoshimoriNight,
  validateHoshimoriNight,
  type NightProgress,
} from '../memoryDungeon/hoshimoriNight'
import { HOSHIMORI_WARM_SITES } from '../memoryDungeon/hoshimoriWarm'
import { EARTH_PHOTOS } from '../memoryDungeon/chronicle'
import { MEMORY_REALITY_EXPERIENCES } from '../memoryDungeon/reimaginerCampaign'

assert.deepEqual(validateHoshimoriNight(), [])
assert.equal(HOSHIMORI_NIGHT_SITES.length, 16)
assert.equal(
  new Set(HOSHIMORI_NIGHT_SITES.map((site) => site.opening)).size,
  16,
)
assert.equal(
  new Set(
    HOSHIMORI_NIGHT_SITES.flatMap((site) => site.choices.map((c) => c.outcome)),
  ).size,
  32,
)
assert.ok(
  HOSHIMORI_NIGHT_SITES.every((site) =>
    HOSHIMORI_WARM_SITES.some((warm) => warm.key === site.key),
  ),
)
assert.equal(
  MEMORY_REALITY_EXPERIENCES.find((item) => item.id === 'e08')?.viewpoint,
  'scylla',
)
assert.equal(
  MEMORY_REALITY_EXPERIENCES.find((item) => item.id === 'e08')?.title,
  'Hearth of Perfect Safety',
)
assert.deepEqual(
  EARTH_PHOTOS.filter((photo) => photo.experience === 'e08').map(
    (photo) => photo.site,
  ),
  ['1,4', '6,7'],
)

const snake = [
  '2,1',
  '3,1',
  '4,1',
  '4,2',
  '3,2',
  '2,2',
  '1,2',
  '1,3',
  '2,3',
  '3,3',
  '4,3',
  '4,4',
  '3,4',
  '2,4',
  '1,4',
]
function visit(progress: NightProgress, to: string): NightProgress {
  assert.equal(
    canMoveHoshimoriNight(progress, to),
    true,
    'Expected fair route to ' + to,
  )
  const next = advanceHoshimoriNight(progress, { type: 'move', to })
  assert.notStrictEqual(next, progress)
  return next
}
function choose(progress: NightProgress, id: string): NightProgress {
  const next = advanceHoshimoriNight(progress, { type: 'choose', id })
  assert.notStrictEqual(next, progress, 'Expected earned choice ' + id)
  return next
}
for (let seed = 0; seed < 96; seed++) {
  let progress = newHoshimoriNightProgress(seed)
  assert.equal(hoshimoriNightClues(progress).length, 0)
  assert.strictEqual(
    advanceHoshimoriNight(progress, {
      type: 'unbind',
      signs: [...hoshimoriNightOrder(seed)],
    }),
    progress,
  )
  progress = choose(progress, HOSHIMORI_NIGHT_SITES[0]!.choices[0].id)
  for (const key of snake) {
    progress = visit(progress, key)
    const site = HOSHIMORI_NIGHT_SITES.find((item) => item.key === key)!
    progress = choose(progress, site.choices[key === '4,2' ? 1 : 0].id)
    assert.strictEqual(
      advanceHoshimoriNight(progress, {
        type: 'choose',
        id: site.choices[1].id,
      }),
      progress,
    )
    if (key === '4,2') {
      assert.equal(hoshimoriNightClues(progress).length, 3)
      const order = [...hoshimoriNightOrder(seed)]
      const wrong = [...order].reverse()
      assert.strictEqual(
        advanceHoshimoriNight(progress, { type: 'unbind', signs: wrong }),
        progress,
      )
      assert.equal(canMoveHoshimoriNight(progress, '4,3'), false)
      progress = advanceHoshimoriNight(progress, {
        type: 'unbind',
        signs: order,
      })
      assert.equal(progress.doorOpen, true)
      assert.equal(canMoveHoshimoriNight(progress, '4,3'), true)
      assert.strictEqual(
        advanceHoshimoriNight(progress, { type: 'unbind', signs: order }),
        progress,
      )
    }
  }
  assert.equal(progress.visited.length, 16)
  assert.equal(Object.keys(progress.choices).length, 16)
  assert.ok(hoshimoriNightCouncil(progress))
  assert.deepEqual(
    restoreHoshimoriNight(JSON.parse(JSON.stringify(progress))),
    progress,
  )
  assert.equal(progress.events.length, 32)
  const forged = JSON.parse(JSON.stringify(progress))
  forged.doorOpen = false
  assert.equal(restoreHoshimoriNight(forged), null)
  forged.doorOpen = true
  forged.visited.push('6,7')
  assert.equal(restoreHoshimoriNight(forged), null)
  forged.visited.pop()
  forged.flags.push('free-pass')
  assert.equal(restoreHoshimoriNight(forged), null)
  forged.flags.pop()
  forged.events.push({ type: 'move', to: '8,8' })
  assert.equal(restoreHoshimoriNight(forged), null)
}
const councilAccounts = new Set<string>()
for (let bits = 0; bits < 8; bits++) {
  let progress = newHoshimoriNightProgress(bits)
  progress = choose(progress, HOSHIMORI_NIGHT_SITES[0]!.choices[0].id)
  for (const key of snake) {
    progress = visit(progress, key)
    const site = HOSHIMORI_NIGHT_SITES.find((item) => item.key === key)!
    const alternative = ['2,2', '3,3', '4,4'].indexOf(key)
    const index =
      key === '4,2' ? 1 : alternative < 0 ? 0 : (bits >> alternative) & 1
    progress = choose(progress, site.choices[index]!.id)
  }
  councilAccounts.add(hoshimoriNightCouncil(progress)!)
  assert.equal(
    progress.visited.length,
    16,
    'Side route must work without the wall bargain',
  )
  assert.equal(progress.doorOpen, false)
}
assert.equal(
  councilAccounts.size,
  8,
  'Three earned testimonies produce eight distinct accounts',
)
const partial = newHoshimoriNightProgress(1)
assert.equal(hoshimoriNightCouncil(partial), null)
assert.strictEqual(
  advanceHoshimoriNight(partial, { type: 'move', to: '8,8' }),
  partial,
)
assert.strictEqual(
  advanceHoshimoriNight(partial, { type: 'choose', id: 'council-departure' }),
  partial,
)
assert.equal(
  restoreHoshimoriNight({
    ...partial,
    events: Array(HOSHIMORI_NIGHT_MAX_EVENTS + 1).fill({
      type: 'move',
      to: '2,1',
    }),
  }),
  null,
)
console.log(
  'Hoshimori e08: sixteen mirrored sites, 96 seeded runs, eight council accounts, two fair crossings, save forgery protection OK',
)
