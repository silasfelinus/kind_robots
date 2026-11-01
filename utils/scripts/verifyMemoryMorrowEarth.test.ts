import assert from 'node:assert/strict'
import {
  MORROW_EARTH_MAX_EVENTS,
  MORROW_EARTH_PHOTO_SITES,
  MORROW_EARTH_SITES,
  advanceMorrowEarth,
  morrowEarthClosingAccount,
  morrowEarthPhotoSites,
  newMorrowEarthProgress,
  restoreMorrowEarth,
  validateMorrowEarth,
  type MorrowEarthProgress,
} from '../memoryDungeon/morrowEarth'

assert.deepEqual(validateMorrowEarth(), [])
assert.equal(MORROW_EARTH_SITES.length, 16)
assert.equal(new Set(MORROW_EARTH_SITES.map((site) => site.key)).size, 16)
assert.equal(
  new Set(
    MORROW_EARTH_SITES.flatMap((site) =>
      site.choices.map((choice) => choice.outcome),
    ),
  ).size,
  32,
)
assert.deepEqual(MORROW_EARTH_PHOTO_SITES, ['1,3', '6,4'])

function move(progress: MorrowEarthProgress, to: string): MorrowEarthProgress {
  const next = advanceMorrowEarth(progress, { type: 'move', to })
  assert.notStrictEqual(next, progress, 'Unreachable Earth location: ' + to)
  return next
}

function choose(
  progress: MorrowEarthProgress,
  id: string,
): MorrowEarthProgress {
  const next = advanceMorrowEarth(progress, { type: 'choose', id })
  assert.notStrictEqual(next, progress, 'Invalid Earth choice: ' + id)
  return next
}

const route = ['1,2', '1,3', '2,3', '3,3', '4,3', '5,3', '6,3', '6,4']
const accounts = new Set<string>()
for (let seed = 0; seed < 96; seed++) {
  let progress = newMorrowEarthProgress(seed)
  assert.deepEqual(morrowEarthPhotoSites(progress), [])
  assert.equal(morrowEarthClosingAccount(progress), null)
  for (const to of route) {
    progress = move(progress, to)
    if (to === '1,3')
      progress = choose(progress, seed & 1 ? 'study-alone' : 'accept-help')
    if (to === '5,3') progress = choose(progress, seed & 2 ? 'imitate' : 'ask')
    if (to === '6,4')
      progress = choose(progress, seed & 4 ? 'witness' : 'attempt')
  }
  assert.deepEqual(morrowEarthPhotoSites(progress), ['1,3', '6,4'])
  const account = morrowEarthClosingAccount(progress)
  assert.ok(
    account?.includes('spell') ||
      account?.includes('gesture') ||
      account?.includes('magic') ||
      account?.includes('Nothing'),
  )
  accounts.add(account!)
  assert.deepEqual(
    restoreMorrowEarth(JSON.parse(JSON.stringify(progress))),
    progress,
  )
  assert.strictEqual(
    advanceMorrowEarth(progress, { type: 'choose', id: 'witness' }),
    progress,
    'Once-only scene choices must not be farmable',
  )
  assert.equal(restoreMorrowEarth({ ...progress, confidence: 999 }), null)
  assert.equal(
    restoreMorrowEarth({
      ...progress,
      choices: { ...progress.choices, '1,1': 'pay' },
    }),
    null,
  )
  assert.equal(restoreMorrowEarth({ ...progress, empathy: -999 }), null)
  assert.equal(
    restoreMorrowEarth({ ...progress, events: [{ type: 'move', to: '6,4' }] }),
    null,
  )
}
assert.equal(
  accounts.size,
  8,
  'Three witnessed decisions must yield eight earned accounts',
)

function pathBetween(from: string, to: string): string[] {
  const queue: string[][] = [[from]]
  const seen = new Set([from])
  while (queue.length) {
    const path = queue.shift()!
    const last = path.at(-1)!
    if (last === to) return path.slice(1)
    const [x, y] = last.split(',').map(Number)
    for (const site of MORROW_EARTH_SITES) {
      const [sx, sy] = site.key.split(',').map(Number)
      if (Math.abs(x! - sx!) + Math.abs(y! - sy!) !== 1 || seen.has(site.key))
        continue
      seen.add(site.key)
      queue.push([...path, site.key])
    }
  }
  throw new Error('No authored path from ' + from + ' to ' + to)
}

let completionist = newMorrowEarthProgress(72)
for (const site of MORROW_EARTH_SITES) {
  for (const step of pathBetween(completionist.current, site.key))
    completionist = move(completionist, step)
  completionist = choose(completionist, site.choices[0].id)
}
assert.equal(completionist.visited.length, 16)
assert.equal(Object.keys(completionist.choices).length, 16)
assert.ok(completionist.events.length < MORROW_EARTH_MAX_EVENTS)
assert.deepEqual(restoreMorrowEarth(completionist), completionist)
assert.strictEqual(
  advanceMorrowEarth(completionist, { type: 'move', to: '9,9' }),
  completionist,
)
assert.strictEqual(
  advanceMorrowEarth(completionist, { type: 'choose', id: 'invented' }),
  completionist,
)
assert.equal(
  restoreMorrowEarth({
    ...completionist,
    events: Array(MORROW_EARTH_MAX_EVENTS + 1).fill({
      type: 'move',
      to: '2,1',
    }),
  }),
  null,
)
assert.throws(() => newMorrowEarthProgress(-1))
assert.throws(() => newMorrowEarthProgress(Number.MAX_SAFE_INTEGER))
console.log(
  'Morrow Earth e03: 16 sites, 32 choices, 8 accounts, 96 seeds and replay checks passed',
)
