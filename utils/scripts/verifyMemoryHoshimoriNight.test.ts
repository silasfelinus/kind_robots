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
import {
  EARTH_PHOTOS,
  newEarthChronicle,
  reconcileHoshimoriNightEarthChronicle,
  recoveredEarthPhotos,
  respondToEarthPhoto,
  restoreEarthChronicle,
} from '../memoryDungeon/chronicle'
import { MEMORY_REALITY_EXPERIENCES } from '../memoryDungeon/reimaginerCampaign'
import {
  MEMORY_HOSHIMORI_NIGHT_ACHIEVEMENTS,
  memoryAchievementGallery,
  reconcileMemoryAchievements,
  restoreMemoryAchievements,
} from '../memoryDungeon/achievements'
import { readFileSync } from 'node:fs'

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
assert.equal(MEMORY_HOSHIMORI_NIGHT_ACHIEVEMENTS.length, 8)
assert.equal(
  new Set(MEMORY_HOSHIMORI_NIGHT_ACHIEVEMENTS.map((medal) => medal.echo)).size,
  8,
)
assert.equal(memoryAchievementGallery([]).length, 44)
assert.ok(
  memoryAchievementGallery([])
    .filter((medal) => medal.id.startsWith('e08-night-'))
    .every((medal) => !medal.earned && medal.echo === null),
)
const nightMedalIds = new Set<string>()
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
  const earned = reconcileMemoryAchievements(
    [],
    [],
    undefined,
    undefined,
    undefined,
    progress,
  )
  assert.equal(earned.length, 1, 'A complete council route earns one medal')
  const medal = MEMORY_HOSHIMORI_NIGHT_ACHIEVEMENTS.find(
    (entry) => entry.id === earned[0],
  )!
  assert.ok(medal.echo.length >= 120)
  assert.ok(medal.artPath.startsWith('/images/memory-dungeon/hoshimori-night/'))
  nightMedalIds.add(medal.id)
  assert.equal(
    memoryAchievementGallery(earned).find((entry) => entry.id === medal.id)?.echo,
    medal.echo,
  )
  assert.deepEqual(
    reconcileMemoryAchievements(earned, [], undefined, undefined, undefined, progress),
    earned,
    'Revisiting the council cannot duplicate a medal',
  )
  assert.deepEqual(restoreMemoryAchievements([...earned, ...earned]), earned)
  const tampered = JSON.parse(JSON.stringify(progress)) as NightProgress
  tampered.choices['4,4'] =
    tampered.choices['4,4'] === 'allow-departure'
      ? 'require-consent'
      : 'allow-departure'
  assert.equal(restoreHoshimoriNight(tampered), null)
  assert.deepEqual(
    reconcileMemoryAchievements([], [], undefined, undefined, undefined, tampered),
    [],
    'A forged council choice must never mint a medal',
  )
  const unfinished = JSON.parse(JSON.stringify(progress)) as NightProgress
  unfinished.visited.pop()
  assert.deepEqual(
    reconcileMemoryAchievements([], [], undefined, undefined, undefined, unfinished),
    [],
    'Incomplete exploration cannot mint a medal',
  )
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
assert.equal(nightMedalIds.size, 8)
const worldStoreSource = readFileSync('stores/memoryWorldStore.ts', 'utf8')
const nightStoreSource = readFileSync('stores/memoryHoshimoriNightStore.ts', 'utf8')
assert.ok(worldStoreSource.includes('syncHoshimoriNightAchievements'))
assert.ok(worldStoreSource.includes("campaign.value.completed.includes('e07')"))
assert.ok(nightStoreSource.includes('syncHoshimoriNightAchievements(restored)'))
assert.ok(nightStoreSource.includes('syncHoshimoriNightAchievements(next)'))
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
for (const decision of ['ask-the-colleague', 'honor-the-help'] as const) {
  let run = newHoshimoriNightProgress(17)
  for (const key of ['1,2', '1,3', '1,4']) run = visit(run, key)
  assert.deepEqual(
    reconcileHoshimoriNightEarthChronicle(newEarthChronicle(), run.choices)
      .found,
    [],
    'Seeing the photograph without making a decision cannot earn it',
  )
  run = choose(run, decision)
  const restored = restoreHoshimoriNight(JSON.parse(JSON.stringify(run)))
  assert.ok(restored, 'Only replay-validated night choices can earn the photo')
  const journal = reconcileHoshimoriNightEarthChronicle(
    newEarthChronicle(),
    restored.choices,
  )
  assert.deepEqual(journal.found, ['earth-15'])
  assert.deepEqual(
    recoveredEarthPhotos(journal).map((photo) => photo.id),
    ['earth-15'],
  )
  assert.strictEqual(
    reconcileHoshimoriNightEarthChronicle(journal, restored.choices),
    journal,
    'Revisiting a photo never grants it twice',
  )
  const answered = respondToEarthPhoto(
    journal,
    'earth-15',
    decision === 'ask-the-colleague' ? 'challenge' : 'hold',
  )
  assert.deepEqual(
    restoreEarthChronicle(JSON.parse(JSON.stringify(answered))),
    answered,
    'The recovered photo and immutable response survive a save roundtrip',
  )
  assert.strictEqual(
    respondToEarthPhoto(answered, 'earth-15', 'challenge'),
    answered,
    'An earlier interpretation cannot be overwritten',
  )
  const forged = JSON.parse(JSON.stringify(run)) as NightProgress
  forged.choices['1,4'] =
    decision === 'ask-the-colleague' ? 'honor-the-help' : 'ask-the-colleague'
  assert.equal(
    restoreHoshimoriNight(forged),
    null,
    'A forged night decision without its matching event is rejected',
  )
}
assert.deepEqual(
  reconcileHoshimoriNightEarthChronicle(newEarthChronicle(), {
    '1,4': 'invented',
    '6,7': 'fabricated',
  }).found,
  [],
  'Unknown testimony and an unbuilt night photo cannot mint evidence',
)
assert.deepEqual(
  reconcileHoshimoriNightEarthChronicle(
    { version: 1, found: ['earth-14', 'earth-13'], responses: {} },
    { '1,4': 'honor-the-help' },
  ).found,
  ['earth-13', 'earth-14', 'earth-15'],
  'Out-of-order discoveries follow Earth chronology, not travel order',
)
assert.deepEqual(
  restoreEarthChronicle({
    version: 1,
    found: ['earth-15', 'earth-16', 'earth-31'],
    responses: { 'earth-15': 'hold', 'earth-16': 'challenge' },
  }),
  { version: 1, found: ['earth-15'], responses: { 'earth-15': 'hold' } },
  'The first night photo persists while the unbuilt second remains spoiler-locked',
)
console.log(
  'Hoshimori e08: sixteen mirrored sites, 96 seeded runs, eight council accounts, two fair crossings, save forgery protection OK',
)
