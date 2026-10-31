import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  chooseOverworldEvent,
  eventNeighbors,
  newOverworldEventProgress,
  restoreOverworldEventProgress,
  revealOverworldEvent,
  worldEvent,
  worldEvents,
} from '../memoryDungeon/overworldEventCatalog'
import {
  EARTH_REALITIES,
  earthChoiceSummary,
  earthRealityCoverage,
  earthRealityPhotos,
  earthRealityReady,
} from '../memoryDungeon/earthAct'
import {
  chooseMemoryPairEnding,
  completeMemoryExperience,
  memoryCharFate,
  newMemoryCampaignProgress,
  rememberMemoryWish,
  type MemoryCampaignProgress,
} from '../memoryDungeon/reimaginerCampaign'
import {
  EARTH_PHOTOS,
  newEarthChronicle,
  reconcileMorrowEarthChronicle,
  restoreEarthChronicle,
} from '../memoryDungeon/chronicle'

assert.deepEqual(earthRealityCoverage(), [])
for (const reality of EARTH_REALITIES) {
  assert.equal(worldEvents(reality).length, 64)
  assert.equal(earthRealityPhotos(reality).length, 2)
  assert.equal(earthRealityReady(reality, newOverworldEventProgress(reality)), false)
  for (const photo of EARTH_PHOTOS.filter((item) => item.experience === reality))
    assert.equal(worldEvent(reality, photo.site)?.photographId, photo.id)
}
assert.deepEqual(eventNeighbors('1,1').sort(), ['1,2', '2,1'])

let campaign: MemoryCampaignProgress = {
  ...newMemoryCampaignProgress(),
  completed: ['e01', 'e02'],
}
let chronicle = newEarthChronicle()

for (const reality of EARTH_REALITIES) {
  let progress = newOverworldEventProgress(reality)
  assert.equal(earthRealityReady(reality, progress), false)
  assert.equal(chooseOverworldEvent(progress, '8,8', 'care'), progress)

  let previous = '1,1'
  for (let y = 1; y <= 8; y++) {
    const xs = Array.from({ length: 8 }, (_, i) =>
      y % 2 === 1 ? i + 1 : 8 - i,
    )
    for (const x of xs) {
      const key = x + ',' + y
      if (key !== previous)
        assert.ok(eventNeighbors(previous).includes(key), 'walk adjacency')
      progress = revealOverworldEvent(progress, key)
      assert.ok(progress.revealed.includes(key))
      const event = worldEvent(reality, key)!
      const choice =
        reality === 'e04' && key === '8,8'
          ? event.choices.find((option) => option.id === 'open-the-tide-gate')!
          : event.choices[0]!
      progress = chooseOverworldEvent(progress, key, choice.id)
      assert.equal(progress.choices[key], choice.id)
      assert.equal(
        chooseOverworldEvent(progress, key, choice.id),
        progress,
        'never award a site twice',
      )
      previous = key
    }
  }

  assert.equal(progress.revealed.length, 64)
  assert.equal(Object.keys(progress.choices).length, 64)
  assert.equal(earthRealityReady(reality, progress), true)
  assert.ok(earthChoiceSummary(reality, progress).length > 30)
  chronicle = reconcileMorrowEarthChronicle(
    chronicle,
    reality,
    progress.choices,
  )
  assert.equal(
    chronicle.found.filter((id) =>
      EARTH_PHOTOS.some(
        (photo) => photo.experience === reality && photo.id === id,
      ),
    ).length,
    2,
  )

  const forged = restoreOverworldEventProgress({
    ...progress,
    supplies: 999999,
    trust: 999999,
    revealed: [...progress.revealed, '8,0', '10,10'],
    choices: { ...progress.choices, '8,0': 'care' },
  })!
  assert.equal(forged.revealed.includes('8,0'), false)
  assert.equal(forged.choices['8,0'], undefined)
  assert.notEqual(forged.trust, 999999)
  assert.equal(earthRealityReady(reality, forged), true)

  if (reality === 'e03') {
    campaign = rememberMemoryWish(campaign, 'morrow-magic-attempt')
    campaign = completeMemoryExperience(campaign, 'e03')
    assert.ok(campaign.completed.includes('e03'))
    assert.ok(campaign.rememberedAnchors.includes('morrow-magic-attempt'))
  } else {
    for (const surviving of ['seal-the-tide-gate', 'divert-the-current']) {
      const survival = chooseMemoryPairEnding(campaign, 'e04', surviving)
      assert.equal(memoryCharFate(survival), 'alive')
    }
    campaign = chooseMemoryPairEnding(
      campaign,
      'e04',
      progress.choices['8,8']!,
    )
    campaign = completeMemoryExperience(campaign, 'e04')
    assert.equal(memoryCharFate(campaign), 'lost')
    assert.equal(campaign.pairDecisions?.e04, 'open-the-tide-gate')
    assert.ok(campaign.completed.includes('e04'))
  }
}

assert.equal(chronicle.found.length, 4)
assert.equal(restoreEarthChronicle(chronicle).found.length, 4)
assert.equal(
  reconcileMorrowEarthChronicle(chronicle, 'e03', {}).found.length,
  4,
  'a future sync must not erase earlier earned photos',
)

const stage = readFileSync('components/pages/memory-dungeon-earth.vue', 'utf8')
const root = readFileSync('components/pages/memory-dungeon.vue', 'utf8')
const briar = readFileSync('components/pages/memory-dungeon-overworld.vue', 'utf8')
const store = readFileSync('stores/memoryEarthStore.ts', 'utf8')
const world = readFileSync('stores/memoryWorldStore.ts', 'utf8')
assert.match(stage, /data-testid="memory-earth-act"/)
assert.match(stage, /earth\.travel\(tile\.key\)/)
assert.match(stage, /earth\.choose\(choice\.id\)/)
assert.match(stage, /sceneArt\.status === 'delivered'/)
assert.match(stage, /choice\.art\.status === 'delivered'/)
assert.match(root, /memory-dungeon-earth v-else-if="earthMode"/)
assert.match(briar, /v-if="world\.campaign\.completed\.includes\('e02'\)"/)
assert.match(store, /world\.finishMorrowEarthReality\(/)
assert.match(store, /restoreOverworldEventProgress\(/)
assert.match(store, /window\.localStorage\.setItem\(STORAGE_KEY/)
assert.match(world, /function finishMorrowEarthReality\(/)

console.log(
  'Memory Earth act: 128 walkable events, 4 earned photos, gated world exits, replay-safe choices and Char fate passed',
)
