import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  HOSHIMORI_LANTERN_CLUE_SITES,
  HOSHIMORI_MAX_EVENTS,
  HOSHIMORI_OVEN_ROOMS,
  HOSHIMORI_WARM_SITES,
  advanceHoshimoriWarm,
  hoshimoriLanternClues,
  hoshimoriLanternOrder,
  hoshimoriOvenResolution,
  hoshimoriOvenSecondAccount,
  hoshimoriOvenThirdAccount,
  hoshimoriOvenGuardianResolution,
  hoshimoriRidgeAccount,
  hoshimoriLowlandAccount,
  hoshimoriWindwardAccount,
  hoshimoriSouthernAccount,
  hoshimoriOvenTestimony,
  newHoshimoriWarmProgress,
  restoreHoshimoriWarm,
  validateHoshimoriWarm,
  type HoshimoriWarmProgress,
} from '../memoryDungeon/hoshimoriWarm'
import {
  EARTH_PHOTOS,
  newEarthChronicle,
  reconcileHoshimoriEarthChronicle,
  recoveredEarthPhotos,
  respondToEarthPhoto,
  restoreEarthChronicle,
} from '../memoryDungeon/chronicle'
import { MEMORY_REALITY_EXPERIENCES } from '../memoryDungeon/reimaginerCampaign'

assert.deepEqual(validateHoshimoriWarm(), [])
assert.equal(HOSHIMORI_WARM_SITES.length, 64)
assert.equal(new Set(HOSHIMORI_WARM_SITES.map((site) => site.key)).size, 64)
assert.equal(HOSHIMORI_OVEN_ROOMS.length, 15)
assert.equal(new Set(HOSHIMORI_WARM_SITES.map((site) => site.opening)).size, 64)
assert.equal(
  new Set(
    HOSHIMORI_WARM_SITES.flatMap((site) =>
      site.choices.map((choice) => choice.outcome),
    ),
  ).size,
  128,
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
assert.ok(HOSHIMORI_WARM_SITES.some((site) => site.key === '7,5'))
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
  assert.equal(progress.visited.length, 16)
  for (const key of ['2,4', '3,4', '4,4', '5,4', '6,4', '7,4', '7,5']) {
    progress = move(progress, key)
    if (['5,4', '6,4', '7,4', '7,5'].includes(key)) {
      const site = HOSHIMORI_WARM_SITES.find((item) => item.key === key)!
      const affordable = site.choices.find(
        (choice) => progress.rations + (choice.rations ?? 0) >= 0,
      )!
      progress = choose(progress, affordable.id)
    }
  }
  assert.equal(
    progress.visited.length,
    20,
    'All twenty sites, including the second Earth photograph, are reachable',
  )
  assert.equal(Object.keys(progress.choices).length, 20)
  for (const key of [
    '8,5',
    '8,4',
    '8,5',
    '8,6',
    '7,6',
    '6,6',
    '6,5',
    '5,5',
    '5,6',
  ]) {
    progress = move(progress, key)
    if (!progress.choices[key]) {
      const site = HOSHIMORI_WARM_SITES.find((item) => item.key === key)!
      const affordable = site.choices.find(
        (choice) => progress.rations + (choice.rations ?? 0) >= 0,
      )!
      progress = choose(progress, affordable.id)
    }
  }
  assert.equal(progress.visited.length, 28, 'All ridge sites are reachable')
  assert.equal(Object.keys(progress.choices).length, 28)
  for (const key of ['4,6', '3,6', '2,6', '1,6', '1,5', '2,5', '3,5', '4,5']) {
    progress = move(progress, key)
    const site = HOSHIMORI_WARM_SITES.find((item) => item.key === key)!
    const affordable = site.choices.find(
      (choice) => progress.rations + (choice.rations ?? 0) >= 0,
    )!
    progress = choose(progress, affordable.id)
  }
  assert.equal(progress.visited.length, 36, 'All lowland sites are reachable')
  assert.equal(Object.keys(progress.choices).length, 36)
  for (const key of [
    '4,4',
    '4,3',
    '4,2',
    '4,1',
    '5,1',
    '6,1',
    '7,1',
    '8,1',
    '8,2',
    '7,2',
    '6,2',
    '5,2',
  ]) {
    progress = move(progress, key)
    if (!progress.choices[key]) {
      const site = HOSHIMORI_WARM_SITES.find((item) => item.key === key)!
      const affordable = site.choices.find(
        (choice) => progress.rations + (choice.rations ?? 0) >= 0,
      )!
      progress = choose(progress, affordable.id)
    }
  }
  assert.equal(
    progress.visited.length,
    44,
    'All first forty-four village sites are reachable',
  )
  assert.equal(Object.keys(progress.choices).length, 44)
  assert.ok(hoshimoriWindwardAccount(progress))
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
  for (const key of ['4,2', '4,3']) progress = move(progress, key)
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

const ashWingChoices = [
  ['seal-jars', 'return-names'],
  ['ask-workers', 'pay-workers'],
  ['tend-tools', 'free-tools'],
  ['share-heat', 'bank-heat'],
  ['witness-claims', 'redact-claims'],
  ['open-kiln', 'hold-kiln'],
] as const
const ashWingAccounts = new Set<string>()
for (let mask = 0; mask < 64; mask++) {
  let run = newHoshimoriWarmProgress(mask)
  assert.strictEqual(
    advanceHoshimoriWarm(run, { type: 'enter-wing' }),
    run,
    'The second wing cannot be entered without an earned first hearing',
  )
  for (const key of ['2,1', '3,1', '4,1', '4,2']) run = move(run, key)
  run = choose(run, 'pledge')
  run = move(run, '4,3')
  run = advanceHoshimoriWarm(run, { type: 'enter' })
  for (const id of ['audit', 'consent', 'pact'])
    run = advanceHoshimoriWarm(run, { type: 'oven-choice', id })
  assert.equal(run.ovenComplete, true)
  assert.equal(run.ovenRoom, null)
  assert.match(hoshimoriOvenResolution(run)!, /first hearing/i)
  assert.equal(hoshimoriOvenSecondAccount(run), null)
  assert.deepEqual(
    restoreHoshimoriWarm(JSON.parse(JSON.stringify(run))),
    run,
    'An existing first-hearing-only v1 save remains valid',
  )
  run = advanceHoshimoriWarm(run, { type: 'enter-wing' })
  assert.equal(run.ovenRoom, 'OV-04')
  for (let index = 0; index < ashWingChoices.length; index++) {
    const room = HOSHIMORI_OVEN_ROOMS[index + 3]!
    assert.equal(run.ovenRoom, room.id)
    const id = ashWingChoices[index]![(mask >> index) & 1]!
    run = advanceHoshimoriWarm(run, { type: 'oven-choice', id })
    if (index === 2 && mask === 0) {
      const beforeLeave = run
      run = advanceHoshimoriWarm(run, { type: 'leave' })
      assert.equal(run.ovenRoom, null)
      run = advanceHoshimoriWarm(run, { type: 'enter-wing' })
      assert.equal(
        run.ovenRoom,
        'OV-07',
        'Retreat and reentry must resume the first unfinished wing room',
      )
      assert.equal(run.rations, beforeLeave.rations)
      assert.equal(run.trust, beforeLeave.trust)
      assert.equal(
        Object.keys(run.ovenChoices).length,
        Object.keys(beforeLeave.ovenChoices).length,
        'Retreat cannot repeat rewards or decisions',
      )
    }
  }
  assert.equal(run.ovenRoom, null)
  assert.equal(run.ovenComplete, true)
  const account = hoshimoriOvenSecondAccount(run)
  assert.ok(account)
  ashWingAccounts.add(account)
  assert.match(hoshimoriOvenResolution(run)!, /first hearing/i)
  assert.strictEqual(
    advanceHoshimoriWarm(run, { type: 'enter-wing' }),
    run,
    'The finished wing cannot be farmed',
  )
  assert.deepEqual(
    restoreHoshimoriWarm(JSON.parse(JSON.stringify(run))),
    run,
    'Every six-room ash-wing branch must replay and restore',
  )
  const forged = JSON.parse(JSON.stringify(run)) as HoshimoriWarmProgress
  forged.ovenChoices['OV-07'] =
    run.ovenChoices['OV-07'] === 'share-heat' ? 'bank-heat' : 'share-heat'
  assert.equal(
    restoreHoshimoriWarm(forged),
    null,
    'An ash-wing verdict cannot be forged without matching events',
  )
}
assert.equal(
  ashWingAccounts.size,
  64,
  'Six distinct decisions should produce 64 earned accounts',
)

const emberWingChoices = [
  ['weigh-flour', 'trace-sacks'],
  ['unlatch-door', 'ask-children'],
  ['release-ember', 'offer-ember'],
  ['publish-totals', 'invite-auditors'],
  ['build-commons', 'share-flue'],
  ['rewrite-guardian', 'quench-guardian'],
] as const
const emberWingAccounts = new Set<string>()
const guardianDispositions = new Set<string>()
for (let mask = 0; mask < 64; mask++) {
  let run = newHoshimoriWarmProgress(mask)
  assert.strictEqual(
    advanceHoshimoriWarm(run, { type: 'enter-ember-wing' }),
    run,
    'The Ember Wing requires both earlier hearings',
  )
  for (const key of ['2,1', '3,1', '4,1', '4,2']) run = move(run, key)
  run = choose(run, 'pledge')
  run = move(run, '4,3')
  run = advanceHoshimoriWarm(run, { type: 'enter' })
  for (const id of ['audit', 'consent', 'pact'])
    run = advanceHoshimoriWarm(run, { type: 'oven-choice', id })
  assert.strictEqual(
    advanceHoshimoriWarm(run, { type: 'enter-ember-wing' }),
    run,
    'The first hearing cannot skip the Ash Wing',
  )
  run = advanceHoshimoriWarm(run, { type: 'enter-wing' })
  for (const pair of ashWingChoices)
    run = advanceHoshimoriWarm(run, { type: 'oven-choice', id: pair[0] })
  assert.equal(run.ovenRoom, null, 'OV-09 remains a terminal v1 room')
  assert.deepEqual(
    restoreHoshimoriWarm(JSON.parse(JSON.stringify(run))),
    run,
    'An existing completed Ash Wing save must still restore unchanged',
  )
  assert.equal(hoshimoriOvenThirdAccount(run), null)
  assert.equal(hoshimoriOvenGuardianResolution(run), null)
  const unearned = {
    ...run,
    ovenChoices: {
      ...run.ovenChoices,
      'OV-15': 'rewrite-guardian',
    },
  }
  assert.equal(
    hoshimoriOvenThirdAccount(unearned),
    null,
    'Missing middle-room testimony cannot produce an account',
  )
  assert.equal(
    hoshimoriOvenGuardianResolution(unearned),
    null,
    'A forged final choice alone cannot produce a guardian verdict',
  )
  run = advanceHoshimoriWarm(run, { type: 'enter-ember-wing' })
  assert.equal(run.ovenRoom, 'OV-10')
  for (let index = 0; index < emberWingChoices.length; index++) {
    const room = HOSHIMORI_OVEN_ROOMS[index + 9]!
    assert.equal(run.ovenRoom, room.id)
    const choice = emberWingChoices[index]![(mask >> index) & 1]!
    run = advanceHoshimoriWarm(run, { type: 'oven-choice', id: choice })
    if (index === 2 && mask === 0) {
      const beforeLeave = run
      run = advanceHoshimoriWarm(run, { type: 'leave' })
      assert.equal(run.ovenRoom, null)
      run = advanceHoshimoriWarm(run, { type: 'enter-ember-wing' })
      assert.equal(run.ovenRoom, 'OV-13')
      assert.equal(run.rations, beforeLeave.rations)
      assert.equal(run.trust, beforeLeave.trust)
      assert.deepEqual(run.ovenChoices, beforeLeave.ovenChoices)
    }
  }
  assert.equal(run.ovenRoom, null)
  assert.equal(run.ovenComplete, true)
  assert.ok(run.rations >= 0)
  const account = hoshimoriOvenThirdAccount(run)
  const guardian = hoshimoriOvenGuardianResolution(run)
  assert.ok(account)
  assert.ok(guardian)
  emberWingAccounts.add(account)
  guardianDispositions.add(guardian.split('.')[0]!)
  assert.strictEqual(
    advanceHoshimoriWarm(run, { type: 'enter-ember-wing' }),
    run,
    'The completed Ember Wing cannot be farmed',
  )
  assert.deepEqual(
    restoreHoshimoriWarm(JSON.parse(JSON.stringify(run))),
    run,
    'Every Ember Wing path must restore from its action journal',
  )
  const forged = JSON.parse(JSON.stringify(run)) as HoshimoriWarmProgress
  forged.ovenChoices['OV-12'] =
    run.ovenChoices['OV-12'] === 'release-ember'
      ? 'offer-ember'
      : 'release-ember'
  assert.equal(
    restoreHoshimoriWarm(forged),
    null,
    'Guardian consent cannot be forged by editing the saved ledger',
  )
}
assert.equal(emberWingAccounts.size, 64)
assert.equal(
  guardianDispositions.size,
  3,
  'Release, bounded guardianship and non-magical relief need distinct endings',
)

const windwardAccounts = new Set<string>()
for (const post of ['deliver', 'archive'] as const) {
  for (const gate of ['invite', 'release'] as const) {
    for (const council of ['open', 'sealed'] as const) {
      let progress = newHoshimoriWarmProgress(19)
      for (const key of ['2,1', '3,1', '4,1', '5,1'])
        progress = move(progress, key)
      assert.equal(hoshimoriWindwardAccount(progress), null)
      progress = choose(progress, post)
      for (const key of ['5,2', '6,2', '7,2']) progress = move(progress, key)
      progress = choose(progress, gate)
      progress = move(progress, '8,2')
      assert.equal(
        hoshimoriWindwardAccount(progress),
        null,
        'The council cannot invent an outcome before its own decision',
      )
      progress = choose(progress, council)
      const account = hoshimoriWindwardAccount(progress)
      assert.ok(account)
      windwardAccounts.add(account)
      assert.deepEqual(
        restoreHoshimoriWarm(JSON.parse(JSON.stringify(progress))),
        progress,
        'Every Windward Council account must survive action replay',
      )
      assert.strictEqual(
        advanceHoshimoriWarm(progress, { type: 'choose', id: council }),
        progress,
        'Council decisions cannot be farmed or changed after acceptance',
      )
      const forged = JSON.parse(
        JSON.stringify(progress),
      ) as HoshimoriWarmProgress
      forged.choices['7,2'] = gate === 'invite' ? 'release' : 'invite'
      assert.equal(
        restoreHoshimoriWarm(forged),
        null,
        'A Windward Council witness cannot be forged on save restore',
      )
    }
  }
}
assert.equal(
  windwardAccounts.size,
  8,
  'Three earned windward decisions must yield eight distinct accounts',
)

const ridgeOutcomes = new Set<string>()
for (const hearth of ['host', 'measure'] as const) {
  for (const relay of ['signal', 'wait'] as const) {
    for (const assembly of ['open', 'trial'] as const) {
      let progress = newHoshimoriWarmProgress(37)
      for (const key of [
        '2,1',
        '3,1',
        '4,1',
        '4,2',
        '4,3',
        '4,4',
        '5,4',
        '5,5',
      ])
        progress = move(progress, key)
      progress = choose(progress, hearth)
      for (const key of ['6,5', '6,6', '7,6']) progress = move(progress, key)
      progress = choose(progress, relay)
      progress = move(progress, '8,6')
      assert.equal(
        hoshimoriRidgeAccount(progress),
        null,
        'The assembly cannot claim an unmade decision',
      )
      progress = choose(progress, assembly)
      const account = hoshimoriRidgeAccount(progress)
      assert.ok(account)
      ridgeOutcomes.add(account)
      assert.deepEqual(
        restoreHoshimoriWarm(JSON.parse(JSON.stringify(progress))),
        progress,
        'Ridge testimony survives action-replay restoration',
      )
      const forged = JSON.parse(
        JSON.stringify(progress),
      ) as HoshimoriWarmProgress
      forged.choices['7,6'] = relay === 'signal' ? 'wait' : 'signal'
      assert.equal(
        restoreHoshimoriWarm(forged),
        null,
        'Ridge witness decisions cannot be forged in a checkpoint',
      )
    }
  }
}
assert.equal(ridgeOutcomes.size, 8, 'The ridge has eight earned accounts')

const lowlandOutcomes = new Set<string>()
for (const flood of ['evacuate', 'record'] as const) {
  for (const rain of ['audit', 'pledge'] as const) {
    for (const council of ['open', 'restrict'] as const) {
      let progress = newHoshimoriWarmProgress(41)
      for (const key of ['1,2', '1,3', '1,4', '1,5'])
        progress = move(progress, key)
      progress = choose(progress, flood)
      for (const key of ['2,5', '3,5', '3,6']) progress = move(progress, key)
      progress = choose(progress, rain)
      progress = move(progress, '4,6')
      assert.equal(
        hoshimoriLowlandAccount(progress),
        null,
        'A lowland verdict cannot precede the council decision',
      )
      progress = choose(progress, council)
      const account = hoshimoriLowlandAccount(progress)
      assert.ok(account)
      lowlandOutcomes.add(account)
      assert.deepEqual(
        restoreHoshimoriWarm(JSON.parse(JSON.stringify(progress))),
        progress,
        'Every flood outcome must survive deterministic replay',
      )
      const forged = JSON.parse(
        JSON.stringify(progress),
      ) as HoshimoriWarmProgress
      forged.choices['3,6'] = rain === 'audit' ? 'pledge' : 'audit'
      assert.equal(
        restoreHoshimoriWarm(forged),
        null,
        'A flood ledger decision cannot be forged in a saved run',
      )
      assert.strictEqual(
        advanceHoshimoriWarm(progress, {
          type: 'choose',
          id: council === 'open' ? 'restrict' : 'open',
        }),
        progress,
        'The council decision cannot be replaced to farm trust',
      )
    }
  }
}
assert.equal(
  lowlandOutcomes.size,
  8,
  'Eight distinct lowland verdicts are earned',
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

for (const decision of ['question', 'hold'] as const) {
  let run = newHoshimoriWarmProgress(43)
  for (const site of ['1,2', '1,3', '2,3']) run = move(run, site)
  assert.deepEqual(
    reconcileHoshimoriEarthChronicle(newEarthChronicle(), run.choices).found,
    [],
    'Visiting the photograph without deciding must not collect it',
  )
  run = choose(run, decision)
  const restoredRun = restoreHoshimoriWarm(JSON.parse(JSON.stringify(run)))
  assert.ok(restoredRun, 'Photograph must follow replay-validated progress')
  const journal = reconcileHoshimoriEarthChronicle(
    newEarthChronicle(),
    restoredRun.choices,
  )
  assert.deepEqual(journal.found, ['earth-13'])
  assert.strictEqual(
    reconcileHoshimoriEarthChronicle(journal, restoredRun.choices),
    journal,
    'A revisited photograph cannot award a second copy',
  )
  const reacted = respondToEarthPhoto(
    journal,
    'earth-13',
    decision === 'question' ? 'challenge' : 'hold',
  )
  const persisted = restoreEarthChronicle(JSON.parse(JSON.stringify(reacted)))
  assert.deepEqual(
    persisted,
    reacted,
    'Photo and immutable response persist across runs',
  )
  assert.deepEqual(
    recoveredEarthPhotos(persisted).map((photo) => photo.id),
    ['earth-13'],
  )
  assert.deepEqual(
    reconcileHoshimoriEarthChronicle(persisted, {}).found,
    ['earth-13'],
    'Restarting the village must not revoke earned evidence',
  )
}
for (const decision of ['inquire', 'respect'] as const) {
  let run = newHoshimoriWarmProgress(43)
  for (const key of [
    '2,1',
    '3,1',
    '4,1',
    '4,2',
    '4,3',
    '4,4',
    '5,4',
    '6,4',
    '7,4',
    '7,5',
  ])
    run = move(run, key)
  assert.deepEqual(
    reconcileHoshimoriEarthChronicle(newEarthChronicle(), run.choices).found,
    [],
    'Finding the second photo without an authored decision cannot earn it',
  )
  run = choose(run, decision)
  const restoredRun = restoreHoshimoriWarm(JSON.parse(JSON.stringify(run)))
  assert.ok(restoredRun, 'Second photo requires replay-validated travel')
  const journal = reconcileHoshimoriEarthChronicle(
    newEarthChronicle(),
    restoredRun.choices,
  )
  assert.deepEqual(journal.found, ['earth-14'])
  assert.strictEqual(
    reconcileHoshimoriEarthChronicle(journal, restoredRun.choices),
    journal,
    'Second photograph is once-only',
  )
  const reacted = respondToEarthPhoto(
    journal,
    'earth-14',
    decision === 'inquire' ? 'challenge' : 'hold',
  )
  assert.deepEqual(
    restoreEarthChronicle(JSON.parse(JSON.stringify(reacted))),
    reacted,
    'The second photo and immutable response persist across expeditions',
  )
  const forgedRun = JSON.parse(JSON.stringify(run)) as HoshimoriWarmProgress
  forgedRun.choices['7,5'] = decision === 'inquire' ? 'respect' : 'inquire'
  assert.equal(
    restoreHoshimoriWarm(forgedRun),
    null,
    'A changed photo decision without the matching event must fail replay',
  )
}
assert.deepEqual(
  reconcileHoshimoriEarthChronicle(newEarthChronicle(), {
    '2,3': 'forged',
    '7,5': 'invented',
  }).found,
  [],
  'Forged scene decisions cannot mint either photograph',
)
assert.deepEqual(
  reconcileHoshimoriEarthChronicle(newEarthChronicle(), {
    '7,5': 'respect',
    '2,3': 'hold',
  }).found,
  ['earth-13', 'earth-14'],
  'Both earned photos sort by Earth chronology, not scene order',
)
assert.deepEqual(
  restoreEarthChronicle({
    version: 1,
    found: ['earth-13', 'earth-14', 'earth-15', 'earth-31'],
    responses: { 'earth-14': 'challenge' },
  }).found,
  ['earth-13', 'earth-14'],
  'Both authored Hoshimori photos survive; later realities remain spoiler-locked',
)
const outOfOrder = reconcileHoshimoriEarthChronicle(
  { version: 1, found: ['earth-02', 'earth-01'], responses: {} },
  { '2,3': 'hold' },
)
assert.deepEqual(
  recoveredEarthPhotos(outOfOrder).map((photo) => photo.id),
  ['earth-01', 'earth-02', 'earth-13'],
  'Chronicle uses Earth chronology, not discovery order',
)

// A completionist can revisit sites hundreds of times before recovering evidence.
// The journal must remain replayable rather than silently freezing at 256 actions.
let longJourney = choose(newHoshimoriWarmProgress(19), 'listen')
for (let step = 0; step < 600; step++)
  longJourney = move(longJourney, step % 2 === 0 ? '2,1' : '1,1')
assert.equal(longJourney.rations, 2, 'Travel cannot farm rations')
assert.equal(longJourney.choices['1,1'], 'listen')
assert.ok(longJourney.events.length > 256)
assert.ok(longJourney.events.length < HOSHIMORI_MAX_EVENTS)
for (const key of ['2,1', '2,2', '2,3']) longJourney = move(longJourney, key)
longJourney = choose(longJourney, 'hold')
for (const key of ['3,3', '4,3', '4,4', '5,4', '6,4', '7,4', '7,5'])
  longJourney = move(longJourney, key)
longJourney = choose(longJourney, 'respect')
assert.deepEqual(
  restoreHoshimoriWarm(JSON.parse(JSON.stringify(longJourney))),
  longJourney,
  'Long-running expeditions must survive action-replay save restoration',
)
assert.deepEqual(
  reconcileHoshimoriEarthChronicle(newEarthChronicle(), longJourney.choices)
    .found,
  ['earth-13', 'earth-14'],
  'Both fixed Earth photos remain earnable after the old action cap',
)
const tamperedLongJourney = JSON.parse(
  JSON.stringify(longJourney),
) as HoshimoriWarmProgress
tamperedLongJourney.rations += 1
assert.equal(restoreHoshimoriWarm(tamperedLongJourney), null)
const oversizedJournal = JSON.parse(
  JSON.stringify(longJourney),
) as HoshimoriWarmProgress
oversizedJournal.events = Array.from(
  { length: HOSHIMORI_MAX_EVENTS + 1 },
  () => ({
    type: 'move',
    to: '2,1',
  }),
)
assert.equal(
  restoreHoshimoriWarm(oversizedJournal),
  null,
  'Unbounded or hostile journals must still be rejected',
)

const southernVerdicts = new Set<string>()
for (let variation = 0; variation < 8; variation++) {
  let run = newHoshimoriWarmProgress(variation + 101)
  for (let y = 1; y <= 8; y++) {
    const row = Array.from({ length: 8 }, (_, index) =>
      y % 2 === 1 ? index + 1 : 8 - index,
    )
    for (const x of row) {
      const key = `${x},${y}`
      if (key !== '1,1') run = move(run, key)
      const site = HOSHIMORI_WARM_SITES.find((entry) => entry.key === key)!
      assert.ok(site, 'Every square must be a real authored location: ' + key)
      const southernDecisions: Readonly<Record<string, number>> = {
        '4,7': variation & 1,
        '6,8': (variation >> 1) & 1,
        '8,8': (variation >> 2) & 1,
      }
      const choice = Object.prototype.hasOwnProperty.call(
        southernDecisions,
        key,
      )
        ? site.choices[southernDecisions[key]!]!
        : (site.choices.find((option) => (option.rations ?? 0) >= 0) ??
          site.choices[0])
      assert.ok(
        run.rations + (choice.rations ?? 0) >= 0,
        'Each visit must have a legal non-starving resolution: ' + key,
      )
      run = choose(run, choice.id)
    }
  }
  assert.equal(
    run.visited.length,
    64,
    'Every authored village square is reachable',
  )
  assert.equal(Object.keys(run.choices).length, 64, 'No empty choice squares')
  assert.equal(run.events.length, 127, '63 moves and 64 decisions')
  const account = hoshimoriSouthernAccount(run)
  assert.ok(account, 'The southern assembly must pay off earned testimony')
  southernVerdicts.add(account)
  const restored = restoreHoshimoriWarm(JSON.parse(JSON.stringify(run)))
  assert.deepEqual(
    restored,
    run,
    'Full map and all choices survive a replayed save',
  )
  assert.equal(
    hoshimoriSouthernAccount(restored!),
    account,
    'The same testimony produces the same earned consequence after reload',
  )
  assert.strictEqual(
    advanceHoshimoriWarm(run, { type: 'choose', id: 'consent' }),
    run,
    'Revisiting the final assembly cannot mint a new outcome',
  )
  const forged = JSON.parse(JSON.stringify(run)) as HoshimoriWarmProgress
  forged.choices['8,8'] =
    forged.choices['8,8'] === 'consent' ? 'open' : 'consent'
  assert.equal(
    restoreHoshimoriWarm(forged),
    null,
    'A forged assembly verdict must not survive replay',
  )
}
assert.equal(
  southernVerdicts.size,
  8,
  'The three southern decisions must produce eight distinguishable earned accounts',
)
assert.equal(
  hoshimoriSouthernAccount(newHoshimoriWarmProgress(7)),
  null,
  'Do not invent testimony for unvisited locations',
)

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
assert.match(consoleSource, /data-testid="memory-hoshimori-chronicle-open"/)
assert.match(consoleSource, /memory-dungeon-earth-chronicle/)
assert.match(consoleSource, /data-testid="memory-hoshimori-lowland-account"/)
assert.match(consoleSource, /data-testid="memory-hoshimori-windward-account"/)
assert.match(consoleSource, /data-testid="memory-hoshimori-southern-account"/)
assert.match(consoleSource, /data-testid="memory-hoshimori-enter-ash-wing"/)
assert.match(consoleSource, /data-testid="memory-hoshimori-ash-wing-account"/)
assert.match(consoleSource, /data-testid="memory-hoshimori-enter-ember-wing"/)
assert.match(
  consoleSource,
  /data-testid="memory-hoshimori-guardian-resolution"/,
)
assert.match(consoleSource, /data-testid="memory-hoshimori-ember-wing-account"/)
assert.doesNotMatch(consoleSource, /localStorage|\$fetch/)
assert.match(storeSource, /restoreHoshimoriWarm\(JSON\.parse\(saved\)\)/)
assert.match(storeSource, /advanceHoshimoriWarm\(progress\.value, event\)/)
assert.match(storeSource, /memory-dungeon-hoshimori-e07-v1/)
assert.match(storeSource, /syncHoshimoriPhoto\(restored\.choices\)/)
assert.match(storeSource, /syncHoshimoriPhoto\(next\.choices\)/)
assert.match(storeSource, /hoshimoriLowlandAccount\(progress\.value\)/)
assert.match(storeSource, /hoshimoriWindwardAccount\(progress\.value\)/)
assert.match(storeSource, /hoshimoriSouthernAccount\(progress\.value\)/)
assert.match(storeSource, /hoshimoriOvenSecondAccount\(progress\.value\)/)
assert.match(storeSource, /hoshimoriOvenThirdAccount\(progress\.value\)/)
assert.match(storeSource, /hoshimoriOvenGuardianResolution\(progress\.value\)/)
const worldStoreSource = readFileSync('stores/memoryWorldStore.ts', 'utf8')
assert.match(worldStoreSource, /campaign\.value\.completed\.includes\('e06'\)/)
assert.match(worldStoreSource, /reconcileHoshimoriEarthChronicle/)
assert.match(pageSource, /memory-dungeon-hoshimori/)
assert.match(overworldSource, /campaign\.completed\.includes\('e06'\)/)
assert.match(overworldSource, /data-testid="memory-enter-hoshimori"/)

console.log(
  'Hoshimori warm proof: 64 sites, 15 Oven rooms, 64 ash-wing and 64 ember-wing accounts, 3 guardian dispositions, 96 seeds, 24 hearings, two Earth photos, long-run save and spoiler guards passed',
)
