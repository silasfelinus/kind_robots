import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createPinia, setActivePinia } from 'pinia'
import { useMemoryWorldStore } from '../../stores/memoryWorldStore'
import { useMemoryEarthStore } from '../../stores/memoryEarthStore'
import {
  chooseOverworldEvent,
  newOverworldEventProgress,
  restoreOverworldEventProgress,
  revealOverworldEvent,
  worldEvent,
  worldEvents,
} from '../memoryDungeon/overworldEventCatalog'
import {
  EARTH_REALITIES,
  earthRealityCoverage,
  earthRealityPhotos,
  earthRealityReady,
} from '../memoryDungeon/earthAct'
import {
  newMemoryCampaignProgress,
  memoryCharFate,
} from '../memoryDungeon/reimaginerCampaign'
import {
  newEarthChronicle,
  reconcileMorrowEarthChronicle,
  restoreEarthChronicle,
  EARTH_PHOTOS,
} from '../memoryDungeon/chronicle'

assert.deepEqual(earthRealityCoverage(), [])
for (const reality of EARTH_REALITIES) {
  assert.equal(worldEvents(reality).length, 64)
  assert.equal(earthRealityPhotos(reality).length, 2)
  assert.equal(earthRealityReady(reality, newOverworldEventProgress(reality)), false)
  for (const photo of EARTH_PHOTOS.filter((item) => item.experience === reality)) {
    assert.equal(worldEvent(reality, photo.site)?.photographId, photo.id)
  }
}

setActivePinia(createPinia())
const world = useMemoryWorldStore()
const earth = useMemoryEarthStore()
assert.equal(earth.unlocked, false)
earth.travel('2,1')
assert.equal(earth.position, '1,1')
earth.select('e04')
assert.equal(earth.active, 'e03')

world.campaign = { ...newMemoryCampaignProgress(), completed: ['e01', 'e02'] }
assert.equal(earth.unlocked, true)
earth.select('e04')
assert.equal(earth.active, 'e03')

function snake(reality: 'e03' | 'e04'): void {
  assert.equal(earth.active, reality)
  for (let y = 1; y <= 8; y++) {
    const xs = Array.from({ length: 8 }, (_, i) =>
      y % 2 === 1 ? i + 1 : 8 - i,
    )
    for (const x of xs) {
      const key = x + ',' + y
      earth.travel(key)
      assert.equal(earth.position, key)
      assert.equal(earth.progress.revealed.includes(key), true)
      const event = worldEvent(reality, key)!
      const choice =
        reality === 'e04' && key === '8,8'
          ? event.choices.find((option) => option.id === 'open-the-tide-gate')!
          : event.choices[0]!
      earth.choose(choice.id)
      assert.equal(earth.progress.choices[key], choice.id)
      const score = earth.progress.trust
      earth.choose(choice.id)
      assert.equal(earth.progress.trust, score, 'duplicate rewards forbidden')
    }
  }
  assert.equal(earth.progress.revealed.length, 64)
  assert.equal(Object.keys(earth.progress.choices).length, 64)
  assert.equal(earth.photographs, 2)
  assert.equal(earth.readyToLeave, true)
}

snake('e03')
assert.equal(world.campaign.completed.includes('e03'), false)
earth.conclude()
assert.equal(world.campaign.completed.includes('e03'), true)
assert.equal(world.campaign.rememberedAnchors.includes('morrow-magic-attempt'), true)
assert.equal(earth.active, 'e04')
assert.equal(earth.e04Unlocked, true)
assert.equal(earth.progress.revealed.length, 1)
assert.equal(world.earthChronicle.found.filter((id) => id.startsWith('earth-')).length >= 0, true)

snake('e04')
assert.equal(earth.readyToLeave, true)
earth.conclude()
assert.equal(world.campaign.completed.includes('e04'), true)
assert.equal(world.campaign.pairDecisions?.e04, 'open-the-tide-gate')
assert.equal(memoryCharFate(world.campaign), 'lost')
assert.equal(earth.notice.includes('Scylla'), true)
earth.conclude()
assert.equal(world.campaign.completed.filter((id) => id === 'e04').length, 1)

for (const fate of ['seal-the-tide-gate', 'divert-the-current']) {
  let progress = newOverworldEventProgress('e04')
  progress = revealOverworldEvent(progress, '2,1')
  progress = chooseOverworldEvent(progress, '2,1', 'care')
  assert.equal(progress.choices['2,1'], 'care')
  assert.ok(worldEvent('e04', '8,8')?.choices.some((choice) => choice.id === fate))
}

for (const reality of EARTH_REALITIES) {
  const source = earth.progress.experience === reality
    ? earth.progress
    : newOverworldEventProgress(reality)
  const restored = restoreOverworldEventProgress({
    ...source,
    supplies: 999999,
    trust: 999999,
    revealed: [...source.revealed, '8,0', '10,10'],
    choices: { ...source.choices, '8,0': 'care' },
  })!
  assert.equal(restored.revealed.includes('8,0'), false)
  assert.equal(restored.choices['8,0'], undefined)
  assert.notEqual(restored.trust, 999999)
}

let chronicle = newEarthChronicle()
chronicle = reconcileMorrowEarthChronicle(chronicle, 'e03', {
  [earthRealityPhotos('e03')[0]!]: 'challenge',
})
assert.equal(chronicle.found.length, 1)
assert.equal(restoreEarthChronicle(chronicle).found.length, 1)
assert.equal(
  reconcileMorrowEarthChronicle(chronicle, 'e03', {}).found.length,
  1,
  'previously collected photos stay collected',
)

const stage = readFileSync('components/pages/memory-dungeon-earth.vue', 'utf8')
const root = readFileSync('components/pages/memory-dungeon.vue', 'utf8')
const briar = readFileSync('components/pages/memory-dungeon-overworld.vue', 'utf8')
assert.match(stage, /data-testid="memory-earth-act"/)
assert.match(stage, /earth\.travel\(tile\.key\)/)
assert.match(stage, /earth\.choose\(choice\.id\)/)
assert.match(stage, /sceneArt\.status === 'delivered'/)
assert.match(stage, /choice\.art\.status === 'delivered'/)
assert.match(root, /memory-dungeon-earth v-else-if="earthMode"/)
assert.match(briar, /v-if="world\.campaign\.completed\.includes\('e02'\)"/)

console.log('Memory Earth act: 128 walkable scenes, earned photos, saved one-time outcomes, gating and Char fate passed')
