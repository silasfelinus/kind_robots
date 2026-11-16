import assert from 'node:assert/strict'
import {
  FURNACE_ENDINGS,
  FURNACE_OF_NAMES,
  type FurnaceEntry,
  type FurnaceProgress,
  type FurnaceRoomId,
} from '../memoryDungeon/furnaceOfNames'
import {
  HOSHIMORI_NIGHT_SITES,
  advanceHoshimoriNight,
  canMoveHoshimoriNight,
  newHoshimoriNightProgress,
  type NightProgress,
} from '../memoryDungeon/hoshimoriNight'
import { concludeHoshimoriNight } from '../memoryDungeon/hoshimoriNightCompletion'
import {
  chooseMemoryPairEnding,
  chooseMemoryScyllaDeparture,
  completeMemoryExperience,
  newMemoryCampaignProgress,
  rememberMemoryWish,
  type MemoryCampaignProgress,
} from '../memoryDungeon/reimaginerCampaign'

const D = FURNACE_OF_NAMES

function campaignThroughE07(): MemoryCampaignProgress {
  let campaign = completeMemoryExperience(newMemoryCampaignProgress(), 'e01')
  campaign = chooseMemoryPairEnding(campaign, 'e02', 'trust-witnesses')
  campaign = completeMemoryExperience(campaign, 'e02')
  campaign = completeMemoryExperience(campaign, 'e03')
  campaign = rememberMemoryWish(campaign, 'morrow-magic-attempt')
  campaign = chooseMemoryPairEnding(campaign, 'e04', 'divert-the-current')
  campaign = completeMemoryExperience(campaign, 'e04')
  campaign = chooseMemoryScyllaDeparture(campaign, 'tell-char')
  campaign = rememberMemoryWish(campaign, 'scylla-home-wish')
  campaign = completeMemoryExperience(campaign, 'e05')
  campaign = chooseMemoryPairEnding(campaign, 'e06', 'publish-twin-testimony')
  campaign = completeMemoryExperience(campaign, 'e06')
  return completeMemoryExperience(campaign, 'e07')
}

function adjacent(key: string): string[] {
  const [x, y] = key.split(',').map(Number)
  return [
    [x! - 1, y!],
    [x! + 1, y!],
    [x!, y! - 1],
    [x!, y! + 1],
  ]
    .filter(
      ([nextX, nextY]) =>
        nextX! >= 1 && nextX! <= 8 && nextY! >= 1 && nextY! <= 8,
    )
    .map(([nextX, nextY]) => nextX + ',' + nextY)
}

function completeNight(
  councilChoice: 'allow-departure' | 'require-consent',
): NightProgress {
  let progress = newHoshimoriNightProgress(73)
  const path = [progress.current]
  let turns = 0
  while (Object.keys(progress.choices).length < HOSHIMORI_NIGHT_SITES.length) {
    turns += 1
    assert.ok(turns < 2000, 'night route must not softlock')
    if (!progress.choices[progress.current]) {
      const site = HOSHIMORI_NIGHT_SITES.find(
        (candidate) => candidate.key === progress.current,
      )!
      const choice =
        progress.current === '4,4'
          ? site.choices.find((candidate) => candidate.id === councilChoice)!
          : site.choices[turns % 2]!
      progress = advanceHoshimoriNight(progress, {
        type: 'choose',
        id: choice.id,
      })
    }
    const next = adjacent(progress.current).find(
      (key) =>
        !progress.visited.includes(key) && canMoveHoshimoriNight(progress, key),
    )
    if (next) {
      progress = advanceHoshimoriNight(progress, { type: 'move', to: next })
      path.push(next)
      continue
    }
    path.pop()
    const previous = path.at(-1)
    assert.ok(previous, 'all reachable branches exhausted before 64 sites')
    progress = advanceHoshimoriNight(progress, {
      type: 'move',
      to: previous,
    })
  }
  assert.equal(progress.visited.length, 64)
  return progress
}

function goTo(
  progress: FurnaceProgress,
  target: FurnaceRoomId,
): FurnaceProgress {
  const previous = new Map<FurnaceRoomId, FurnaceRoomId>()
  const queue: FurnaceRoomId[] = [progress.current]
  const seen = new Set(queue)
  for (let index = 0; index < queue.length && !seen.has(target); index += 1)
    for (const next of D.exits(progress, queue[index]!))
      if (!seen.has(next)) {
        seen.add(next)
        previous.set(next, queue[index]!)
        queue.push(next)
      }
  assert.ok(seen.has(target), 'no open route to ' + target)
  const path: FurnaceRoomId[] = []
  for (let step = target; step !== progress.current; step = previous.get(step)!)
    path.unshift(step)
  for (const step of path) progress = D.travel(progress, step)
  return progress
}

function settle(progress: FurnaceProgress): FurnaceProgress {
  const room = D.rooms[progress.current]!
  if (progress.decisions[room.id]) return progress
  const choice = room.choices
    .filter((candidate) => !D.choiceLock(progress, candidate))
    .sort((a, b) => (b.gain?.evidence ?? 0) - (a.gain?.evidence ?? 0))[0]
  assert.ok(choice, room.id + ' must have an earned choice')
  return D.choose(progress, choice.id)
}

function completeFurnace(
  ending: (typeof FURNACE_ENDINGS)[number],
  entry: FurnaceEntry,
): FurnaceProgress {
  let progress = settle(D.newProgress(entry))
  for (let room = 2; room <= 31; room += 1)
    progress = settle(
      goTo(progress, ('FN-' + String(room).padStart(2, '0')) as FurnaceRoomId),
    )
  progress = D.choose(goTo(progress, 'FN-32'), 'truth')
  progress = D.choose(goTo(progress, 'FN-35'), ending)
  progress = D.choose(goTo(progress, 'FN-36'), 'climb')
  assert.equal(progress.completed, true)
  return progress
}

const campaign = campaignThroughE07()
for (const [councilChoice, expectedEnding] of [
  ['allow-departure', 'unbar-all-doors'],
  ['require-consent', 'keep-shelter-charter'],
] as const) {
  const night = completeNight(councilChoice)
  assert.equal(
    concludeHoshimoriNight(campaign, night, D.newProgress('named')),
    null,
    'reaching the Furnace is not an earned e08 exit',
  )
  for (const furnaceEnding of FURNACE_ENDINGS) {
    const entry: FurnaceEntry =
      night.choices['4,3'] === 'feed-without-claim' ? 'unnamed' : 'named'
    const completed = concludeHoshimoriNight(
      campaign,
      night,
      completeFurnace(furnaceEnding, entry),
    )
    assert.ok(completed)
    assert.ok(completed.completed.includes('e08'))
    assert.equal(completed.pairDecisions?.e08, expectedEnding)
    assert.equal(
      concludeHoshimoriNight(
        completed,
        night,
        completeFurnace(furnaceEnding, entry),
      ),
      null,
      'an earned exit cannot complete e08 twice',
    )
  }
  const forged = JSON.parse(JSON.stringify(night)) as NightProgress
  forged.choices['4,4'] =
    councilChoice === 'allow-departure' ? 'require-consent' : 'allow-departure'
  assert.equal(
    concludeHoshimoriNight(
      campaign,
      forged,
      completeFurnace('return-names', 'named'),
    ),
    null,
    'a forged council consequence cannot earn e08',
  )
}

console.log(
  'Hoshimori e08: both council consequences require 64 replay-valid sites and a completed Furnace exit; all three local endings preserve the earned campaign result.',
)
