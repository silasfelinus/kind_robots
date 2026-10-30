import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  HOSHIMORI_LANTERN_CLUE_SITES,
  HOSHIMORI_OVEN_ROOMS,
  HOSHIMORI_WARM_SITES,
  advanceHoshimoriWarm,
  hoshimoriLanternClues,
  hoshimoriLanternOrder,
  hoshimoriOvenResolution,
  hoshimoriOvenTestimony,
  newHoshimoriWarmProgress,
  restoreHoshimoriWarm,
  validateHoshimoriWarm,
  type HoshimoriWarmProgress,
} from '../memoryDungeon/hoshimoriWarm'
import { EARTH_PHOTOS } from '../memoryDungeon/chronicle'
import { MEMORY_REALITY_EXPERIENCES } from '../memoryDungeon/reimaginerCampaign'

assert.deepEqual(validateHoshimoriWarm(), [])
assert.equal(HOSHIMORI_WARM_SITES.length, 16)
assert.equal(new Set(HOSHIMORI_WARM_SITES.map((site) => site.key)).size, 16)
assert.equal(HOSHIMORI_OVEN_ROOMS.length, 3)
assert.equal(new Set(HOSHIMORI_WARM_SITES.map((site) => site.opening)).size, 16)
assert.equal(
  new Set(
    HOSHIMORI_WARM_SITES.flatMap((site) =>
      site.choices.map((choice) => choice.outcome),
    ),
  ).size,
  32,
  'Every authored decision must have a distinct outcome',
)

const experience07 = MEMORY_REALITY_EXPERIENCES.find(
  (item) => item.id === 'e07',
)!
const experience08 = MEMORY_REALITY_EXPERIENCES.find(
  (item) => item.id === 'e08',
)!
assert.equal(experience07.concept, 'hearth')
assert.equal(experience07.viewpoint, 'earth-protagonist')
assert.equal(experience08.concept, 'hearth')
assert.equal(experience08.viewpoint, 'scylla')
assert.equal(
  experience07.title,
  'Hearth and Hunger',
  'Preserve serialized legacy title',
)
assert.equal(experience08.title, 'Hearth of Perfect Safety')
assert.deepEqual(
  EARTH_PHOTOS.filter((photo) => photo.experience === 'e07').map(
    (photo) => photo.site,
  ),
  ['2,3', '7,5'],
)
assert.deepEqual(
  EARTH_PHOTOS.filter((photo) => photo.experience === 'e08').map(
    (photo) => photo.site,
  ),
  ['1,4', '6,7'],
)
assert.ok(HOSHIMORI_WARM_SITES.some((site) => site.key === '2,3'))
assert.ok(!HOSHIMORI_WARM_SITES.some((site) => site.key === '7,5'))
assert.equal(HOSHIMORI_LANTERN_CLUE_SITES.length, 3)

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

function move(
  progress: HoshimoriWarmProgress,
  to: string,
): HoshimoriWarmProgress {
  const next = advanceHoshimoriWarm(progress, { type: 'move', to })
  assert.notStrictEqual(next, progress, 'Expected reachable site ' + to)
  return next
}

function choose(
  progress: HoshimoriWarmProgress,
  id: string,
): HoshimoriWarmProgress {
  const next = advanceHoshimoriWarm(progress, { type: 'choose', id })
  assert.notStrictEqual(next, progress, 'Expected legal choice ' + id)
  return next
}

for (let seed = 0; seed < 96; seed++) {
  let progress = newHoshimoriWarmProgress(seed)
  assert.deepEqual(hoshimoriLanternClues(progress), [])
  assert.strictEqual(
    advanceHoshimoriWarm(progress, {
      type: 'light',
      symbols: [...hoshimoriLanternOrder(seed)],
    }),
    progress,
    'Lantern sequence must not be blindly accepted before its clues',
  )
  progress = choose(progress, 'listen')
  for (const key of snake) {
    progress = move(progress, key)
    const site = HOSHIMORI_WARM_SITES.find((item) => item.key === key)!
    const affordable = site.choices.find(
      (choice) => progress.rations + (choice.rations ?? 0) >= 0,
    )!
    progress = choose(progress, affordable.id)
  }
  assert.equal(
    progress.visited.length,
    16,
    'All sixteen sites are geographically reachable',
  )
  assert.equal(Object.keys(progress.choices).length, 16)
  assert.equal(hoshimoriLanternClues(progress).length, 3)
  const wrong = [...hoshimoriLanternOrder(seed)].reverse()
  if (wrong.join(':') !== hoshimoriLanternOrder(seed).join(':')) {
    assert.strictEqual(
      advanceHoshimoriWarm(progress, { type: 'light', symbols: wrong }),
      progress,
      'Wrong lantern sequence must not open the Oven',
    )
  }
  progress = advanceHoshimoriWarm(progress, {
    type: 'light',
    symbols: [...hoshimoriLanternOrder(seed)],
  })
  assert.equal(progress.lanternLit, true)
  assert.strictEqual(
    advanceHoshimoriWarm(progress, {
      type: 'light',
      symbols: [...hoshimoriLanternOrder(seed)],
    }),
    progress,
    'Lantern reward is once-only',
  )
  for (const key of ['2,4', '3,4', '4,4', '4,3']) progress = move(progress, key)
  progress = advanceHoshimoriWarm(progress, { type: 'enter' })
  assert.equal(progress.ovenRoom, 'OV-01')
  assert.strictEqual(
    advanceHoshimoriWarm(progress, { type: 'move', to: '4,2' }),
    progress,
    'No overworld teleport while inside the Oven',
  )
  for (const id of ['audit', 'consent', 'pact']) {
    const next = advanceHoshimoriWarm(progress, { type: 'oven-choice', id })
    assert.notStrictEqual(next, progress)
    progress = next
  }
  assert.equal(progress.ovenComplete, true)
  assert.equal(progress.ovenRoom, null)
  assert.match(hoshimoriOvenResolution(progress)!, /first hearing/i)
  assert.strictEqual(
    advanceHoshimoriWarm(progress, { type: 'enter' }),
    progress,
  )
  assert.deepEqual(
    restoreHoshimoriWarm(JSON.parse(JSON.stringify(progress))),
    progress,
  )
  assert.ok(progress.rations >= 0)
  assert.ok(progress.events.length <= 256)
}

let alternative = newHoshimoriWarmProgress(17)
for (const key of ['2,1', '3,1', '4,1', '4,2'])
  alternative = move(alternative, key)
alternative = choose(alternative, 'pledge')
alternative = move(alternative, '4,3')
assert.equal(alternative.lanternLit, false)
alternative = advanceHoshimoriWarm(alternative, { type: 'enter' })
assert.equal(
  alternative.ovenRoom,
  'OV-01',
  'Bakery promise offers a second fair Oven route',
)
alternative = advanceHoshimoriWarm(alternative, {
  type: 'oven-choice',
  id: 'audit',
})
assert.equal(alternative.ovenRoom, 'OV-02')
const beforeLeave = alternative.rations
alternative = advanceHoshimoriWarm(alternative, { type: 'leave' })
assert.equal(alternative.ovenRoom, null)
alternative = advanceHoshimoriWarm(alternative, { type: 'enter' })
alternative = advanceHoshimoriWarm(alternative, {
  type: 'oven-choice',
  id: 'audit',
})
assert.equal(
  alternative.rations,
  beforeLeave,
  'Reentering cannot farm the pantry reward',
)
assert.strictEqual(
  advanceHoshimoriWarm(alternative, { type: 'oven-choice', id: 'audit' }),
  alternative,
  'A decision cannot be repeated in the next room',
)

const hearingOutcomes = new Set<string>()
for (const pipDecision of ['trace', 'protect', null] as const) {
  for (const pantry of ['audit', 'feed'] as const) {
    for (const ember of ['consent', 'pause'] as const) {
      for (const hearing of ['pact', 'relief'] as const) {
        let run = newHoshimoriWarmProgress(22)
        run = move(run, '2,1')
        if (pipDecision) {
          run = move(run, '2,2')
          run = choose(run, pipDecision)
          run = move(run, '3,2')
          run = move(run, '4,2')
        } else {
          run = move(run, '3,1')
          run = move(run, '4,1')
          run = move(run, '4,2')
        }
        run = choose(run, 'pledge')
        run = move(run, '4,3')
        run = advanceHoshimoriWarm(run, { type: 'enter' })
        assert.equal(run.ovenRoom, 'OV-01')
        for (const id of [pantry, ember, hearing]) {
          const next = advanceHoshimoriWarm(run, {
            type: 'oven-choice',
            id,
          })
          assert.notStrictEqual(next, run)
          run = next
        }
        assert.equal(run.ovenComplete, true)
        const resolution = hoshimoriOvenResolution(run)
        assert.ok(resolution)
        assert.match(resolution, /first hearing/i)
        if (pipDecision === 'trace') assert.match(resolution, /testify/)
        else if (pipDecision === 'protect')
          assert.match(resolution, /anonymous/)
        else assert.match(resolution, /will not guess/)
        hearingOutcomes.add(resolution)
        assert.deepEqual(
          restoreHoshimoriWarm(JSON.parse(JSON.stringify(run))),
          run,
          'Every earned hearing must survive replay-validated restoration',
        )
        const forgedHearing = JSON.parse(
          JSON.stringify(run),
        ) as HoshimoriWarmProgress
        forgedHearing.ovenChoices['OV-03'] =
          hearing === 'pact' ? 'relief' : 'pact'
        assert.equal(
          restoreHoshimoriWarm(forgedHearing),
          null,
          'A saved hearing cannot change its verdict without the earned action',
        )
      }
    }
  }
}
assert.equal(
  hearingOutcomes.size,
  24,
  'Eight oven resolutions and three Pip witness states must stay distinct',
)

let pip = newHoshimoriWarmProgress(3)
pip = move(pip, '2,1')
pip = move(pip, '2,2')
pip = choose(pip, 'trace')
assert.match(hoshimoriOvenTestimony(pip), /testify/)
let privatePip = newHoshimoriWarmProgress(3)
privatePip = move(privatePip, '2,1')
privatePip = move(privatePip, '2,2')
privatePip = choose(privatePip, 'protect')
assert.match(hoshimoriOvenTestimony(privatePip), /anonymous/)
assert.notEqual(hoshimoriOvenTestimony(pip), hoshimoriOvenTestimony(privatePip))

const forged = JSON.parse(JSON.stringify(pip)) as HoshimoriWarmProgress
forged.rations = 10000
assert.equal(
  restoreHoshimoriWarm(forged),
  null,
  'Forged supplies cannot survive action replay',
)
forged.rations = pip.rations
forged.current = '4,4'
assert.equal(
  restoreHoshimoriWarm(forged),
  null,
  'Forged travel cannot survive action replay',
)
forged.current = pip.current
forged.events.push({ type: 'move', to: '4,4' })
assert.equal(
  restoreHoshimoriWarm(forged),
  null,
  'Impossible teleport cannot survive action replay',
)
const forgedChoice = JSON.parse(JSON.stringify(pip)) as HoshimoriWarmProgress
forgedChoice.events.push({ type: 'choose', id: 'protect' })
assert.equal(
  restoreHoshimoriWarm(forgedChoice),
  null,
  'A settled decision cannot be replaced',
)
const forgedLantern = JSON.parse(JSON.stringify(pip)) as HoshimoriWarmProgress
forgedLantern.lanternLit = true
assert.equal(
  restoreHoshimoriWarm(forgedLantern),
  null,
  'A lantern cannot be granted without clues',
)
const forgedEvents = JSON.parse(JSON.stringify(pip)) as HoshimoriWarmProgress
forgedEvents.events = Array.from({ length: 257 }, () => ({ type: 'enter' }))
assert.equal(
  restoreHoshimoriWarm(forgedEvents),
  null,
  'Journal must remain bounded',
)
assert.equal(restoreHoshimoriWarm({ version: 999 }), null)
assert.equal(restoreHoshimoriWarm(null), null)

const consoleSource = readFileSync(
  'components/pages/memory-dungeon-hoshimori.vue',
  'utf8',
)
const storeSource = readFileSync('stores/memoryHoshimoriStore.ts', 'utf8')
const pageSource = readFileSync('components/pages/memory-dungeon.vue', 'utf8')
const overworldSource = readFileSync(
  'components/pages/memory-dungeon-overworld.vue',
  'utf8',
)
assert.match(consoleSource, /data-testid="memory-hoshimori-console"/)
assert.match(consoleSource, /data-layout="console-fixed"/)
assert.match(consoleSource, /kr-scroll/)
assert.match(consoleSource, /hoshimori\.clues\.length !== 3/)
assert.match(consoleSource, /hoshimori\.canEnterOven/)
assert.match(consoleSource, /hoshimori\.act\(\{ type: 'oven-choice'/)
assert.doesNotMatch(consoleSource, /localStorage|\$fetch/)
assert.match(storeSource, /restoreHoshimoriWarm\(JSON\.parse\(saved\)\)/)
assert.match(storeSource, /advanceHoshimoriWarm\(progress\.value, event\)/)
assert.match(storeSource, /memory-dungeon-hoshimori-e07-v1/)
assert.match(pageSource, /memory-dungeon-hoshimori/)
assert.match(overworldSource, /campaign\.completed\.includes\('e06'\)/)
assert.match(overworldSource, /data-testid="memory-enter-hoshimori"/)

console.log(
  'Hoshimori warm proof: 16 unique sites, 32 outcomes, 96 seeds, two Oven routes, three rooms, Pip continuity and forged-save rejection passed',
)
