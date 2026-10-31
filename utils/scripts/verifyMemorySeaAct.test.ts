import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  chooseOverworldEvent,
  eventNeighbors,
  newOverworldEventProgress,
  worldEvent,
  worldEvents,
} from '../memoryDungeon/overworldEventCatalog'
import {
  SEA_REALITIES,
  seaActCoverage,
  seaNarrative,
  seaRealityPhotos,
  seaRealityReady,
} from '../memoryDungeon/seaAct'
import {
  EARTH_JOURNAL_COMPACT_AT,
  compactEarthJournal,
  replayEarthJournal,
  type EarthJournalAction,
} from '../memoryDungeon/earthJournal'
import {
  availableMemoryExperiences,
  chooseMemoryPairEnding,
  chooseMemoryScyllaDeparture,
  completeMemoryExperience,
  memoryCharFate,
  newMemoryCampaignProgress,
  rememberMemoryWish,
  scyllaOpeningForMemory,
  MEMORY_PAIR_ENDINGS,
  MEMORY_SCYLLA_DEPARTURE_CHOICES,
} from '../memoryDungeon/reimaginerCampaign'
import {
  EARTH_PHOTOS,
  newEarthChronicle,
  reconcileScyllaEarthChronicle,
  restoreEarthChronicle,
} from '../memoryDungeon/chronicle'

assert.deepEqual(seaActCoverage(), [])
for (const reality of SEA_REALITIES) {
  assert.equal(worldEvents(reality).length, 64)
  assert.equal(seaRealityPhotos(reality).length, 2)
  assert.equal(seaRealityReady(reality, newOverworldEventProgress(reality)), false)
  for (const photo of EARTH_PHOTOS.filter((item) => item.experience === reality))
    assert.equal(worldEvent(reality, photo.site)?.photographId, photo.id)
}

function priorEarth(fate: string) {
  let campaign = newMemoryCampaignProgress()
  campaign = completeMemoryExperience(campaign, 'e01')
  campaign = completeMemoryExperience(campaign, 'e02')
  campaign = rememberMemoryWish(campaign, 'morrow-magic-attempt')
  campaign = completeMemoryExperience(campaign, 'e03')
  campaign = chooseMemoryPairEnding(campaign, 'e04', fate)
  campaign = completeMemoryExperience(campaign, 'e04')
  return campaign
}

for (const fate of MEMORY_PAIR_ENDINGS.e04.map((choice) => choice.id)) {
  const before = priorEarth(fate)
  assert.deepEqual(availableMemoryExperiences(before), ['e05'])
  assert.equal(memoryCharFate(before), fate === 'open-the-tide-gate' ? 'lost' : 'alive')
  assert.match(scyllaOpeningForMemory(before, 'e05'), /Char/)
  assert.match(seaNarrative('e05', '1,1', before), /Char/)
  for (const departure of MEMORY_SCYLLA_DEPARTURE_CHOICES) {
    let atSea = chooseMemoryScyllaDeparture(before, departure.id)
    assert.throws(() => chooseMemoryScyllaDeparture(atSea, departure.id))
    atSea = rememberMemoryWish(atSea, 'scylla-home-wish')
    atSea = completeMemoryExperience(atSea, 'e05')
    assert.equal(atSea.scyllaDeparture, departure.id)
    assert.deepEqual(availableMemoryExperiences(atSea), ['e06'])
    assert.match(scyllaOpeningForMemory(atSea, 'e06'), /Char|court|palace|timeline/)
    assert.match(seaNarrative('e06', '8,8', atSea), /Char|sisters/)
    for (const verdict of MEMORY_PAIR_ENDINGS.e06) {
      let returned = chooseMemoryPairEnding(atSea, 'e06', verdict.id)
      returned = rememberMemoryWish(returned, 'char-possible-future')
      returned = completeMemoryExperience(returned, 'e06')
      assert.equal(returned.pairDecisions?.e06, verdict.id)
      assert.equal(returned.scyllaDeparture, departure.id)
      assert.equal(memoryCharFate(returned), memoryCharFate(before))
      assert.ok(returned.completed.includes('e06'))
      assert.ok(returned.rememberedAnchors.includes('char-possible-future'))
      assert.deepEqual(availableMemoryExperiences(returned), ['e07'])
    }
  }
}

let chronicle = newEarthChronicle()
for (const reality of SEA_REALITIES) {
  const journal: EarthJournalAction[] = []
  let position = '1,1'
  let progress = newOverworldEventProgress(reality)
  for (let y = 1; y <= 8; y++) {
    const xs = Array.from({ length: 8 }, (_, i) =>
      y % 2 === 1 ? i + 1 : 8 - i,
    )
    for (const x of xs) {
      const key = x + ',' + y
      if (key !== position) {
        assert.ok(eventNeighbors(position).includes(key))
        journal.push({ type: 'travel', key })
        position = key
      }
      const event = worldEvent(reality, key)!
      const choice = event.choices[0]!
      journal.push({ type: 'choose', key, choiceId: choice.id })
      progress = chooseOverworldEvent(
        replayEarthJournal(reality, journal.slice(0, -1))!.progress,
        key,
        choice.id,
      )
      assert.equal(progress.choices[key], choice.id)
      assert.equal(chooseOverworldEvent(progress, key, choice.id), progress)
    }
  }
  const replayed = replayEarthJournal(reality, journal)!
  assert.equal(replayed.progress.revealed.length, 64)
  assert.equal(Object.keys(replayed.progress.choices).length, 64)
  assert.equal(replayed.position, position)
  assert.equal(seaRealityReady(reality, replayed.progress), true)
  chronicle = reconcileScyllaEarthChronicle(
    chronicle,
    reality,
    replayed.progress.choices,
  )
  assert.equal(
    chronicle.found.filter((id) =>
      EARTH_PHOTOS.some(
        (photo) => photo.id === id && photo.experience === reality,
      ),
    ).length,
    2,
  )
  assert.equal(replayEarthJournal(reality, [...journal, journal[0]]), null)
  assert.equal(
    replayEarthJournal(reality, [
      { type: 'travel', key: '8,8' },
      ...journal,
    ]),
    null,
  )
  assert.equal(
    replayEarthJournal(reality, [
      ...journal,
      { type: 'choose', key: position, choiceId: 'no-such-choice' },
    ]),
    null,
  )
  const compacted = compactEarthJournal(reality, journal)
  assert.ok(compacted)
  assert.deepEqual(
    replayEarthJournal(reality, compacted)?.progress,
    replayed.progress,
  )
  assert.ok(EARTH_JOURNAL_COMPACT_AT > journal.length)
}
assert.equal(chronicle.found.length, 4)
assert.equal(restoreEarthChronicle(chronicle).found.length, 4)
assert.equal(
  reconcileScyllaEarthChronicle(chronicle, 'e05', {}).found.length,
  4,
)

const root = readFileSync('components/pages/memory-dungeon.vue', 'utf8')
const earth = readFileSync('components/pages/memory-dungeon-earth.vue', 'utf8')
const sea = readFileSync('components/pages/memory-dungeon-sea.vue', 'utf8')
const overworld = readFileSync('components/pages/memory-dungeon-overworld.vue', 'utf8')
const seaStore = readFileSync('stores/memorySeaStore.ts', 'utf8')
const world = readFileSync('stores/memoryWorldStore.ts', 'utf8')
assert.match(root, /memory-dungeon-sea v-else-if="seaMode"/)
assert.match(earth, /data-testid="memory-enter-scylla"/)
assert.match(overworld, /data-testid="memory-enter-scylla-sea"/)
assert.match(sea, /data-testid="memory-sea-act"/)
assert.match(sea, /sea\.travel\(tile\.key\)/)
assert.match(sea, /sea\.choose\(choice\.id\)/)
assert.match(sea, /sceneArt\.status === 'delivered'/)
assert.match(sea, /choice\.art\.status === 'delivered'/)
assert.match(seaStore, /replayEarthJournal\(/)
assert.match(seaStore, /world\.finishScyllaReality\(/)
assert.match(world, /function finishScyllaReality\(/)
assert.match(world, /function syncScyllaEarthPhoto\(/)

console.log(
  'Scylla e05/e06: 128 authored sites, 18 fate/departure/verdict histories, 4 collectible photographs, replay-safe routes and gate checks passed',
)
