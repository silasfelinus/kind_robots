import assert from 'node:assert/strict'
import {
  HOSHIMORI_NIGHT_MAX_EVENTS,
  HOSHIMORI_NIGHT_BELLROAD_KEYS,
  HOSHIMORI_NIGHT_LOWBANK_KEYS,
  HOSHIMORI_NIGHT_SOUTHERN_KEYS,
  HOSHIMORI_NIGHT_SITES,
  HOSHIMORI_NIGHT_WINDWARD_KEYS,
  advanceHoshimoriNight,
  canMoveHoshimoriNight,
  hoshimoriNightClues,
  hoshimoriNightBellroadAccount,
  hoshimoriNightLowbankAccount,
  hoshimoriNightCouncil,
  hoshimoriNightWindwardAccount,
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
assert.equal(HOSHIMORI_NIGHT_SITES.length, 64)
assert.equal(
  new Set(HOSHIMORI_NIGHT_SITES.map((site) => site.opening)).size,
  64,
)
assert.equal(
  new Set(
    HOSHIMORI_NIGHT_SITES.flatMap((site) => site.choices.map((c) => c.outcome)),
  ).size,
  96,
)
assert.ok(
  HOSHIMORI_NIGHT_SITES.every((site) =>
    HOSHIMORI_WARM_SITES.some((warm) => warm.key === site.key),
  ),
)
assert.equal(
  MEMORY_REALITY_EXPERIENCES.find((item) => item.id === 'e08')?.viewpoint,
  'vesper',
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
assert.equal(memoryAchievementGallery([]).length, 64)
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
    memoryAchievementGallery(earned).find((entry) => entry.id === medal.id)
      ?.echo,
    medal.echo,
  )
  assert.deepEqual(
    reconcileMemoryAchievements(
      earned,
      [],
      undefined,
      undefined,
      undefined,
      progress,
    ),
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
    reconcileMemoryAchievements(
      [],
      [],
      undefined,
      undefined,
      undefined,
      tampered,
    ),
    [],
    'A forged council choice must never mint a medal',
  )
  const unfinished = JSON.parse(JSON.stringify(progress)) as NightProgress
  unfinished.visited.pop()
  assert.deepEqual(
    reconcileMemoryAchievements(
      [],
      [],
      undefined,
      undefined,
      undefined,
      unfinished,
    ),
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
const nightStoreSource = readFileSync(
  'stores/memoryHoshimoriNightStore.ts',
  'utf8',
)
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
  'Unknown testimony cannot mint evidence',
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
  {
    version: 1,
    found: ['earth-15', 'earth-16'],
    responses: { 'earth-15': 'hold', 'earth-16': 'challenge' },
  },
  'The first night photo persists while forged future entries remain locked',
)
const windwardAccounts = new Set<string>()
const windwardKeys = [...HOSHIMORI_NIGHT_WINDWARD_KEYS]
assert.equal(windwardKeys.length, 8)
assert.equal(new Set(windwardKeys).size, 8)
assert.ok(
  windwardKeys.every((key) =>
    HOSHIMORI_WARM_SITES.some((site) => site.key === key),
  ),
)
assert.ok(
  windwardKeys.every((key) => {
    const warm = HOSHIMORI_WARM_SITES.find((site) => site.key === key)!
    const night = HOSHIMORI_NIGHT_SITES.find((site) => site.key === key)!
    return warm.title !== night.title && warm.opening !== night.opening
  }),
)
const ridgeSnake = ['5,1', '6,1', '7,1', '8,1', '8,2', '7,2', '6,2', '5,2']
for (let seed = 0; seed < 64; seed++) {
  const bits = seed % 8
  let progress = newHoshimoriNightProgress(seed)
  progress = choose(progress, HOSHIMORI_NIGHT_SITES[0]!.choices[0].id)
  for (const key of ['2,1', '3,1', '4,1']) {
    progress = visit(progress, key)
    progress = choose(
      progress,
      HOSHIMORI_NIGHT_SITES.find((site) => site.key === key)!.choices[0].id,
    )
  }
  assert.equal(canMoveHoshimoriNight(progress, '5,1'), false)
  assert.equal(hoshimoriNightWindwardAccount(progress), null)
  for (const key of snake.slice(3)) {
    progress = visit(progress, key)
    progress = choose(
      progress,
      HOSHIMORI_NIGHT_SITES.find((site) => site.key === key)!.choices[0].id,
    )
  }
  assert.ok(hoshimoriNightCouncil(progress))
  for (const key of ['2,4', '3,4', '4,4', '4,3', '4,2', '4,1'])
    progress = visit(progress, key)
  assert.equal(canMoveHoshimoriNight(progress, '5,1'), true)
  for (const key of ridgeSnake) {
    progress = visit(progress, key)
    const site = HOSHIMORI_NIGHT_SITES.find((item) => item.key === key)!
    const index =
      key === '5,1'
        ? bits & 1
        : key === '7,1'
          ? (bits >> 1) & 1
          : key === '8,2'
            ? (bits >> 2) & 1
            : 0
    if (!progress.choices['8,2'])
      assert.equal(
        hoshimoriNightWindwardAccount(progress),
        null,
        'The ridge account requires its final earned council choice',
      )
    progress = choose(progress, site.choices[index]!.id)
    assert.strictEqual(
      advanceHoshimoriNight(progress, {
        type: 'choose',
        id: site.choices[1 - index]!.id,
      }),
      progress,
      'No repeated or reversed ridge choice',
    )
  }
  assert.equal(progress.visited.length, 24)
  assert.equal(Object.keys(progress.choices).length, 24)
  const account = hoshimoriNightWindwardAccount(progress)
  assert.ok(account)
  windwardAccounts.add(account)
  const restored = restoreHoshimoriNight(JSON.parse(JSON.stringify(progress)))
  assert.deepEqual(restored, progress)
  progress = visit(progress, '5,1')
  progress = visit(progress, '5,2')
  assert.equal(hoshimoriNightWindwardAccount(progress), account)
  assert.deepEqual(
    restoreHoshimoriNight(JSON.parse(JSON.stringify(progress))),
    progress,
    'A retreat and return cannot erase testimony',
  )
  const forged = JSON.parse(JSON.stringify(progress)) as NightProgress
  forged.choices['8,2'] =
    forged.choices['8,2'] === 'night-windward-open'
      ? 'night-windward-limited'
      : 'night-windward-open'
  assert.equal(restoreHoshimoriNight(forged), null)
  const skipped = JSON.parse(JSON.stringify(progress)) as NightProgress
  skipped.events.splice(0, 1, { type: 'move', to: '5,1' })
  assert.equal(restoreHoshimoriNight(skipped), null)
}
assert.equal(
  windwardAccounts.size,
  8,
  'Three earned Windward decisions produce eight distinct accounts',
)
const bellroadAccounts = new Set<string>()
const bellroadKeys = [...HOSHIMORI_NIGHT_BELLROAD_KEYS]
assert.equal(bellroadKeys.length, 8)
assert.equal(new Set(bellroadKeys).size, 8)
assert.ok(
  bellroadKeys.every((key) => {
    const warm = HOSHIMORI_WARM_SITES.find((site) => site.key === key)!
    const night = HOSHIMORI_NIGHT_SITES.find((site) => site.key === key)!
    return warm.title !== night.title && warm.opening !== night.opening
  }),
)
const bellroadSnake = ['5,3', '6,3', '7,3', '8,3', '8,4', '7,4', '6,4', '5,4']
for (let seed = 0; seed < 64; seed++) {
  const bits = seed % 8
  let progress = newHoshimoriNightProgress(seed)
  progress = choose(progress, HOSHIMORI_NIGHT_SITES[0]!.choices[0].id)
  for (const key of snake) {
    progress = visit(progress, key)
    const site = HOSHIMORI_NIGHT_SITES.find((item) => item.key === key)!
    progress = choose(progress, site.choices[0].id)
  }
  const photoBefore = reconcileHoshimoriNightEarthChronicle(
    newEarthChronicle(),
    progress.choices,
  ).found
  assert.deepEqual(photoBefore, ['earth-15'])
  for (const key of ['2,4', '3,4', '4,4', '4,3'])
    progress = visit(progress, key)
  assert.equal(
    canMoveHoshimoriNight(progress, '5,3'),
    false,
    'The Bellroad cannot be entered directly from the southern council',
  )
  for (const key of ['4,2', '4,1']) progress = visit(progress, key)
  for (const key of ridgeSnake) {
    progress = visit(progress, key)
    const site = HOSHIMORI_NIGHT_SITES.find((item) => item.key === key)!
    progress = choose(progress, site.choices[0].id)
  }
  assert.ok(hoshimoriNightWindwardAccount(progress))
  assert.equal(hoshimoriNightBellroadAccount(progress), null)
  assert.equal(canMoveHoshimoriNight(progress, '5,3'), true)
  for (const key of bellroadSnake) {
    progress = visit(progress, key)
    const site = HOSHIMORI_NIGHT_SITES.find((item) => item.key === key)!
    const index =
      key === '5,3'
        ? bits & 1
        : key === '6,4'
          ? (bits >> 1) & 1
          : key === '8,4'
            ? (bits >> 2) & 1
            : 0
    progress = choose(progress, site.choices[index]!.id)
    assert.strictEqual(
      advanceHoshimoriNight(progress, {
        type: 'choose',
        id: site.choices[1 - index]!.id,
      }),
      progress,
      'A Bellroad choice cannot be reversed for another reward',
    )
  }
  assert.equal(progress.visited.length, 32)
  assert.equal(Object.keys(progress.choices).length, 32)
  const account = hoshimoriNightBellroadAccount(progress)
  assert.ok(account)
  bellroadAccounts.add(account)
  assert.deepEqual(
    reconcileHoshimoriNightEarthChronicle(newEarthChronicle(), progress.choices)
      .found,
    photoBefore,
    'Nightmare expansion cannot alter an earned Earth photograph',
  )
  assert.deepEqual(
    restoreHoshimoriNight(JSON.parse(JSON.stringify(progress))),
    progress,
  )
  progress = visit(progress, '5,3')
  progress = visit(progress, '5,4')
  assert.equal(hoshimoriNightBellroadAccount(progress), account)
  const forged = JSON.parse(JSON.stringify(progress)) as NightProgress
  forged.choices['8,4'] =
    forged.choices['8,4'] === 'night-shrine-offer'
      ? 'night-shrine-release'
      : 'night-shrine-offer'
  assert.equal(restoreHoshimoriNight(forged), null)
  const skipped = JSON.parse(JSON.stringify(progress)) as NightProgress
  skipped.events.splice(0, 1, { type: 'move', to: '5,3' })
  assert.equal(restoreHoshimoriNight(skipped), null)
}
assert.equal(
  bellroadAccounts.size,
  8,
  'Three earned Bellroad decisions must produce eight distinct accounts',
)
const lowbankAccounts = new Set<string>()
const lowbankKeys = [...HOSHIMORI_NIGHT_LOWBANK_KEYS]
assert.equal(lowbankKeys.length, 8)
assert.equal(new Set(lowbankKeys).size, 8)
assert.ok(
  lowbankKeys.every((key) => {
    const warm = HOSHIMORI_WARM_SITES.find((site) => site.key === key)!
    const night = HOSHIMORI_NIGHT_SITES.find((site) => site.key === key)!
    return warm.title !== night.title && warm.opening !== night.opening
  }),
)
const lowbankSnake = ['4,5', '3,5', '2,5', '1,5', '1,6', '2,6', '3,6', '4,6']
for (let seed = 0; seed < 64; seed++) {
  const bits = seed % 8
  let progress = newHoshimoriNightProgress(seed)
  progress = choose(progress, HOSHIMORI_NIGHT_SITES[0]!.choices[0].id)
  for (const key of snake) {
    progress = visit(progress, key)
    const site = HOSHIMORI_NIGHT_SITES.find((item) => item.key === key)!
    progress = choose(progress, site.choices[0].id)
  }
  assert.deepEqual(
    reconcileHoshimoriNightEarthChronicle(newEarthChronicle(), progress.choices)
      .found,
    ['earth-15'],
  )
  for (const key of ['2,4', '3,4', '4,4']) progress = visit(progress, key)
  assert.equal(
    canMoveHoshimoriNight(progress, '4,5'),
    false,
    'The Lowbank cannot be entered without a Bellroad witness account',
  )
  for (const key of ['4,3', '4,2', '4,1']) progress = visit(progress, key)
  for (const key of ridgeSnake) {
    progress = visit(progress, key)
    const site = HOSHIMORI_NIGHT_SITES.find((item) => item.key === key)!
    progress = choose(progress, site.choices[0].id)
  }
  assert.equal(hoshimoriNightLowbankAccount(progress), null)
  for (const key of bellroadSnake) {
    progress = visit(progress, key)
    const site = HOSHIMORI_NIGHT_SITES.find((item) => item.key === key)!
    progress = choose(progress, site.choices[0].id)
  }
  assert.ok(hoshimoriNightBellroadAccount(progress))
  assert.deepEqual(
    restoreHoshimoriNight(JSON.parse(JSON.stringify(progress))),
    progress,
    'A legacy 32-site save remains valid after Lowbank authoring',
  )
  progress = visit(progress, '4,4')
  assert.equal(canMoveHoshimoriNight(progress, '4,5'), true)
  for (const key of lowbankSnake) {
    progress = visit(progress, key)
    const site = HOSHIMORI_NIGHT_SITES.find((item) => item.key === key)!
    const index =
      key === '1,5'
        ? bits & 1
        : key === '3,5'
          ? (bits >> 1) & 1
          : key === '4,6'
            ? (bits >> 2) & 1
            : 0
    progress = choose(progress, site.choices[index]!.id)
    assert.strictEqual(
      advanceHoshimoriNight(progress, {
        type: 'choose',
        id: site.choices[1 - index]!.id,
      }),
      progress,
      'A Lowbank outcome cannot be replaced on revisit',
    )
  }
  assert.equal(progress.visited.length, 40)
  assert.equal(Object.keys(progress.choices).length, 40)
  const account = hoshimoriNightLowbankAccount(progress)
  assert.ok(account)
  lowbankAccounts.add(account)
  assert.deepEqual(
    reconcileHoshimoriNightEarthChronicle(newEarthChronicle(), progress.choices)
      .found,
    ['earth-15'],
    'The Lowbank must not unlock the reserved 6,7 Earth photograph',
  )
  assert.deepEqual(
    restoreHoshimoriNight(JSON.parse(JSON.stringify(progress))),
    progress,
  )
  progress = visit(progress, '3,6')
  progress = visit(progress, '4,6')
  assert.equal(hoshimoriNightLowbankAccount(progress), account)
  const forged = JSON.parse(JSON.stringify(progress)) as NightProgress
  forged.choices['4,6'] =
    forged.choices['4,6'] === 'night-lowland-road'
      ? 'night-lowland-veto'
      : 'night-lowland-road'
  assert.equal(restoreHoshimoriNight(forged), null)
  const skipped = JSON.parse(JSON.stringify(progress)) as NightProgress
  skipped.events.splice(0, 1, { type: 'move', to: '4,5' })
  assert.equal(restoreHoshimoriNight(skipped), null)
}
const southernKeys = [...HOSHIMORI_NIGHT_SOUTHERN_KEYS]
assert.deepEqual(southernKeys, ['1,7', '2,7', '3,7', '4,7', '5,7', '6,7'])
for (let seed = 0; seed < 16; seed++) {
  let progress = newHoshimoriNightProgress(seed)
  progress = choose(progress, HOSHIMORI_NIGHT_SITES[0]!.choices[0].id)
  for (const key of snake) {
    progress = visit(progress, key)
    progress = choose(
      progress,
      HOSHIMORI_NIGHT_SITES.find((site) => site.key === key)!.choices[0].id,
    )
  }
  for (const key of ['2,4', '3,4', '4,4', '4,3', '4,2', '4,1'])
    progress = visit(progress, key)
  for (const key of ridgeSnake) {
    progress = visit(progress, key)
    progress = choose(
      progress,
      HOSHIMORI_NIGHT_SITES.find((site) => site.key === key)!.choices[0].id,
    )
  }
  for (const key of bellroadSnake) {
    progress = visit(progress, key)
    progress = choose(
      progress,
      HOSHIMORI_NIGHT_SITES.find((site) => site.key === key)!.choices[0].id,
    )
  }
  progress = visit(progress, '4,4')
  for (const key of lowbankSnake) {
    progress = visit(progress, key)
    if (key === '1,6')
      assert.equal(canMoveHoshimoriNight(progress, '1,7'), false)
    progress = choose(
      progress,
      HOSHIMORI_NIGHT_SITES.find((site) => site.key === key)!.choices[0].id,
    )
  }
  assert.ok(hoshimoriNightLowbankAccount(progress))
  progress = visit(progress, '3,6')
  progress = visit(progress, '2,6')
  progress = visit(progress, '1,6')
  for (const key of southernKeys) {
    progress = visit(progress, key)
    const site = HOSHIMORI_NIGHT_SITES.find((item) => item.key === key)!
    const selected = site.choices[(seed >> (Number(key[0]) - 1)) & 1]!
    progress = choose(progress, selected.id)
    assert.strictEqual(
      advanceHoshimoriNight(progress, {
        type: 'choose',
        id: site.choices.find((choice) => choice.id !== selected.id)!.id,
      }),
      progress,
    )
  }
  assert.equal(progress.visited.length, 46)
  assert.equal(Object.keys(progress.choices).length, 46)
  assert.deepEqual(
    restoreHoshimoriNight(JSON.parse(JSON.stringify(progress))),
    progress,
  )
  const forged = JSON.parse(JSON.stringify(progress)) as NightProgress
  forged.choices['4,7'] = 'night-orchard-nonexistent'
  assert.equal(restoreHoshimoriNight(forged), null)
  assert.deepEqual(
    reconcileHoshimoriNightEarthChronicle(newEarthChronicle(), progress.choices)
      .found,
    ['earth-15', 'earth-16'],
  )
  const journal = reconcileHoshimoriNightEarthChronicle(
    newEarthChronicle(),
    progress.choices,
  )
  const recovered = restoreEarthChronicle(JSON.parse(JSON.stringify(journal)))
  assert.deepEqual(recovered.found, ['earth-15', 'earth-16'])
  assert.strictEqual(
    reconcileHoshimoriNightEarthChronicle(recovered, progress.choices),
    recovered,
  )
  const southernExtension = [
    '7,7'
    '8,7'
    '8,8'
    '7,8'
    '6,8'
    '5,8'
    '4,8'
    '3,8'
        '2,8'
    '1,8'
    '2,8'
    '3,8'
    '4,8'
    '5,8'
    '6,8'
    '6,7'
        '6,6'
    '5,6'
    '6,6'
    '7,6'
    '8,6'
    '8,5'
    '7,5',
  ]
  for (const key of southernExtension) {
    progress = visit(progress, key)
    const site = HOSHIMORI_NIGHT_SITES.find((item) => item.key === key)!
    if (!progress.choices[key]) {
      const choice = site.choices[seed % 2]!
      progress = choose(progress, choice.id)
    }
  }
  assert.equal(progress.visited.length, 62)
  assert.equal(Object.keys(progress.choices).length, 62)
  assert.deepEqual(
    restoreHoshimoriNight(JSON.parse(JSON.stringify(progress))),
    progress,
  )
  const forgedExtension = JSON.parse(JSON.stringify(progress)) as NightProgress
  forgedExtension.choices['8,8'] = 'night-gate-forged'
  assert.equal(restoreHoshimoriNight(forgedExtension), null)
  const forgedSupper = JSON.parse(JSON.stringify(progress)) as NightProgress
  forgedSupper.choices['6,7'] = 'night-supper-forged'
  assert.equal(restoreHoshimoriNight(forgedSupper), null)
}
assert.equal(
  lowbankAccounts.size,
  8,
  'Three earned Lowbank decisions must produce eight distinct flood accounts',
)
console.log(
  'Hoshimori e08: 64 authored sites, 96 original + 64 Windward + 64 Bellroad + 64 Lowbank seeded routes, eight council/ridge/Bellroad/Lowbank accounts, save forgery protection OK',
)
