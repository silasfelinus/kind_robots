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
  compactEarthJournal,
  EARTH_JOURNAL_COMPACT_AT,
  migrateLegacyEarthJournal,
  replayEarthJournal,
  type EarthJournalAction,
} from '../memoryDungeon/earthJournal'
import {
  MEMORY_EARTH_ACHIEVEMENTS,
  earnedEarthAchievementIds,
} from '../memoryDungeon/earthAchievements'
import {
  memoryAchievementGallery,
  reconcileMemoryEarthAchievements,
  restoreMemoryAchievements,
} from '../memoryDungeon/achievements'
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
  assert.equal(
    earthRealityReady(reality, newOverworldEventProgress(reality)),
    false,
  )
  for (const photo of EARTH_PHOTOS.filter(
    (item) => item.experience === reality,
  ))
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
    campaign = chooseMemoryPairEnding(campaign, 'e04', progress.choices['8,8']!)
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

for (const reality of EARTH_REALITIES) {
  const journal: EarthJournalAction[] = []
  let current = '1,1'
  for (let y = 1; y <= 8; y++) {
    for (const x of Array.from({ length: 8 }, (_, i) =>
      y % 2 === 1 ? i + 1 : 8 - i,
    )) {
      const key = x + ',' + y
      if (key !== current) journal.push({ type: 'travel', key })
      const event = worldEvent(reality, key)!
      const choiceId =
        reality === 'e04' && key === '8,8'
          ? 'open-the-tide-gate'
          : event.choices[0]!.id
      journal.push({ type: 'choose', key, choiceId })
      current = key
    }
  }
  const replayed = replayEarthJournal(reality, journal)!
  assert.equal(replayed.position, current)
  assert.equal(replayed.progress.revealed.length, 64)
  assert.equal(Object.keys(replayed.progress.choices).length, 64)
  assert.equal(earthRealityReady(reality, replayed.progress), true)

  const legacy = migrateLegacyEarthJournal(
    reality,
    replayed.progress,
    replayed.position,
  )!
  const migrated = replayEarthJournal(reality, legacy)!
  assert.deepEqual(migrated.progress.choices, replayed.progress.choices)
  assert.equal(migrated.position, current)
  assert.equal(migrated.progress.revealed.length, 64)

  const shortened = compactEarthJournal(reality, journal)!
  const shorterReplay = replayEarthJournal(reality, shortened)!
  assert.ok(shortened.length <= EARTH_JOURNAL_COMPACT_AT)
  assert.deepEqual(shorterReplay.progress.choices, replayed.progress.choices)
  assert.deepEqual(shorterReplay.progress.flags, replayed.progress.flags)
  assert.equal(shorterReplay.progress.danger, replayed.progress.danger)
  assert.equal(shorterReplay.position, replayed.position)

  let wandering: EarthJournalAction[] = [...journal]
  let wanderingPosition = current
  for (let index = 0; index < 3000; index++) {
    if (wandering.length >= EARTH_JOURNAL_COMPACT_AT) {
      const compacted = compactEarthJournal(reality, wandering)
      assert.ok(compacted, 'a legitimate route can always be compacted')
      assert.ok(compacted.length < EARTH_JOURNAL_COMPACT_AT)
      wandering = compacted
    }
    wanderingPosition = wanderingPosition === current ? '2,8' : current
    wandering.push({ type: 'travel', key: wanderingPosition })
  }
  const afterWandering = replayEarthJournal(reality, wandering)!
  assert.ok(afterWandering, 'three thousand extra moves must survive reload')
  assert.equal(afterWandering.position, current)
  assert.deepEqual(afterWandering.progress.choices, replayed.progress.choices)
  assert.deepEqual(afterWandering.progress.flags, replayed.progress.flags)
  for (const resource of ['supplies', 'trust', 'evidence', 'danger'] as const)
    assert.equal(afterWandering.progress[resource], replayed.progress[resource])
  assert.deepEqual(
    new Set(afterWandering.progress.revealed),
    new Set(replayed.progress.revealed),
  )
  assert.equal(
    compactEarthJournal(reality, [{ type: 'travel', key: '8,8' }]),
    null,
    'compaction must never legitimize a forged teleport',
  )

  assert.equal(
    replayEarthJournal(reality, [{ type: 'travel', key: '8,8' }]),
    null,
    'teleporting to a distant photograph or finale is not a valid save',
  )
  assert.equal(
    replayEarthJournal(reality, [
      { type: 'choose', key: '8,8', choiceId: 'care' },
    ]),
    null,
    'a choice cannot be made without physically reaching the site',
  )
  assert.equal(
    replayEarthJournal(reality, [
      { type: 'choose', key: '1,1', choiceId: 'care' },
      { type: 'choose', key: '1,1', choiceId: 'risk' },
    ]),
    null,
    'the same encounter cannot mint a second reward',
  )
  assert.equal(
    replayEarthJournal(reality, [
      { type: 'travel', key: '2,1' },
      { type: 'choose', key: '2,1', choiceId: 'forged' },
    ]),
    null,
  )
  assert.equal(
    replayEarthJournal(
      reality,
      Array.from({ length: 2049 }, () => ({
        type: 'travel',
        key: '2,1',
      })),
    ),
    null,
    'oversized action histories must be bounded',
  )
  assert.equal(
    replayEarthJournal(reality, journal.slice(0, -1))?.progress.choices[
      current
    ],
    undefined,
    'an incomplete route cannot claim its unplayed last outcome',
  )
  assert.equal(
    migrateLegacyEarthJournal(reality, replayed.progress, '8,0'),
    null,
    'legacy migration cannot invent an invalid destination',
  )
}

assert.equal(MEMORY_EARTH_ACHIEVEMENTS.length, 12)
assert.equal(memoryAchievementGallery([]).length, 64)
assert.equal(
  new Set(MEMORY_EARTH_ACHIEVEMENTS.map((medal) => medal.id)).size,
  12,
)
assert.equal(
  new Set(MEMORY_EARTH_ACHIEVEMENTS.map((medal) => medal.echo)).size,
  12,
)
for (const medal of MEMORY_EARTH_ACHIEVEMENTS) {
  assert.ok(medal.description.length >= 45, medal.id)
  assert.ok(medal.echo.length >= 120, medal.id)
  assert.ok(medal.artPath.endsWith('.webp'), medal.id)
}

function medalRoute(
  reality: (typeof EARTH_REALITIES)[number],
  firstPhoto: 'challenge' | 'hold',
  secondPhoto: 'challenge' | 'hold',
  gate: string,
): EarthJournalAction[] {
  const journal: EarthJournalAction[] = []
  const [firstSite, secondSite] = earthRealityPhotos(reality)
  let position = '1,1'
  for (let y = 1; y <= 8; y++) {
    for (const x of Array.from({ length: 8 }, (_, index) =>
      y % 2 ? index + 1 : 8 - index,
    )) {
      const key = `${x},${y}`
      if (key !== position) journal.push({ type: 'travel', key })
      const event = worldEvent(reality, key)!
      const choiceId =
        key === firstSite
          ? firstPhoto
          : key === secondSite
            ? secondPhoto
            : reality === 'e04' && key === '8,8'
              ? gate
              : event.choices[0]!.id
      journal.push({ type: 'choose', key, choiceId })
      position = key
    }
  }
  return journal
}

const reachableMedals = new Set<string>()
for (const reality of EARTH_REALITIES) {
  const gates =
    reality === 'e04'
      ? ['open-the-tide-gate', 'seal-the-tide-gate', 'divert-the-current']
      : ['care']
  for (const first of ['challenge', 'hold'] as const)
    for (const second of ['challenge', 'hold'] as const)
      for (const gate of gates) {
        const journal = medalRoute(reality, first, second, gate)
        const awarded = earnedEarthAchievementIds(reality, journal)
        assert.equal(
          awarded.length,
          3,
          `${reality}: ${first}/${second}/${gate}`,
        )
        for (const id of awarded) reachableMedals.add(id)
        const lifetime = reconcileMemoryEarthAchievements([], reality, journal)
        assert.deepEqual(lifetime, restoreMemoryAchievements(lifetime))
        assert.deepEqual(
          reconcileMemoryEarthAchievements(lifetime, reality, journal),
          lifetime,
          'restoring or replaying a completed Earth route cannot duplicate medals',
        )
        assert.equal(
          memoryAchievementGallery(lifetime).filter((medal) => medal.earned)
            .length,
          3,
        )
        assert.ok(
          memoryAchievementGallery(lifetime)
            .filter((medal) => !medal.earned)
            .every((medal) => medal.echo === null),
          'unearned story echoes remain hidden',
        )
        assert.deepEqual(
          earnedEarthAchievementIds(
            reality,
            journal.filter(
              (action) => !(action.type === 'choose' && action.key === '8,8'),
            ),
          ),
          [],
          'a missing pivotal choice cannot mint a completed-route medal',
        )
        assert.deepEqual(
          earnedEarthAchievementIds(reality, [
            ...journal,
            { type: 'travel', key: '8,8' },
          ]),
          [],
          'forged travel cannot mint medals',
        )
        assert.deepEqual(
          earnedEarthAchievementIds(reality, [
            ...journal,
            { type: 'choose', key: '8,8', choiceId: 'forged' },
          ]),
          [],
          'a second forged outcome cannot mint medals',
        )
      }
}
assert.equal(reachableMedals.size, 12, 'every Earth medal has a legal route')

const stage = readFileSync('components/pages/memory-dungeon-earth.vue', 'utf8')
const root = readFileSync('components/pages/memory-dungeon.vue', 'utf8')
const briar = readFileSync(
  'components/pages/memory-dungeon-overworld.vue',
  'utf8',
)
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
assert.match(store, /replayEarthJournal\(/)
assert.match(store, /migrateLegacyEarthJournal\(/)
assert.match(store, /journals\[active\.value\]\.push\(/)
assert.match(store, /window\.localStorage\.setItem\(STORAGE_KEY/)
assert.match(world, /function finishMorrowEarthReality\(/)

console.log(
  'Memory Earth act: 128 walkable events, 4 earned photos, gated world exits, replay-safe choices and Char fate passed',
)
