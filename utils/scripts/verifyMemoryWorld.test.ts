import assert from 'node:assert/strict'
import {
  DARK_BRIAR_WAVES,
  DARK_BRIAR_SCENES,
  newDarkBriarProgress,
  restoreDarkBriarProgress,
  recoverDarkBriarTurn,
} from '../memoryDungeon/darkBriar'
import { settleDarkBriarReturn } from '../memoryDungeon/darkBriarReturn'
import { newDarkHouseProgress } from '../memoryDungeon/darkHouse'
import { newMemoryCampaignProgress } from '../memoryDungeon/reimaginerCampaign'
import { newCrossMapSealChronicle } from '../memoryDungeon/crossMapSealChronicle'
import {
  MEMORY_SAVE_SLOT_COUNT,
  restoreMemoryCheckpoint,
  restoreMemorySaveSlots,
  writeMemorySaveSlot,
  type MemoryCheckpoint,
} from '../memoryDungeon/saveSlots'
import { readFileSync } from 'node:fs'
import { startCombatRoom } from '../memoryDungeon/rooms'
import {
  DEFAULT_DUNGEON_DECK,
  DESIGNED_DUNGEON_ART,
  isEligibleDungeonArt,
  normalizeDungeonDeck,
  uniqueDeckPaths,
  unseenDeckPaths,
  deckImageIdentity,
} from '../memoryDungeonDeck'

import {
  BRIAR_CROSS_MAP_KEYS,
  BRIAR_REVEAL_WAVES,
  BRIAR_WAVE_SIZES,
  createBriarWaveCards,
  recoverBriarWaveTurn,
  validateBriarWaves,
} from '../memoryDungeonWaves'

import {
  BRIAR_STORY_ATLAS,
  pendingBriarStoryKeys,
  validateBriarStoryAtlas,
} from '../memoryDungeonStoryAtlas'

import {
  EARTH_PHOTOS,
  earthPhotoReappraisal,
  firstWorldPhotoChronicle,
  newEarthChronicle,
  recoveredEarthPhotos,
  reconcileEarthChronicle,
  restoreEarthChronicle,
  respondToEarthPhoto,
  validateEarthPhotoManifest,
} from '../memoryDungeon/chronicle'
import {
  HOUSE_ROOMS,
  HOUSE_ENTRY,
  HOUSE_EXIT_POINTS,
  houseExits,
  houseWitnessEvidence,
  newHouseProgress,
  validateHouseRooms,
} from '../memoryDungeon/house'

import {
  BRIAR_DUNGEON,
  BRIAR_GATE,
  BRIAR_LINKS,
  BRIAR_SITES,
  BRIAR_START,
  BRIAR_TILES,
  briarConnected,
  briarTileProgress,
  newBriarSave,
  restoreBriarSave,
  recoverBriarCombatDefeat,
  recoverBriarRoomMissPenalty,
  recoverBriarRoomFirstFlip,
  validateBriarLinks,
} from '../memoryDungeonWorld'
import {
  BRIAR_SCENES,
  briarSceneOpening,
  canChooseBriarScene,
} from '../memoryDungeon/scenes'

assert.deepEqual(
  validateBriarLinks(),
  [],
  'All reveal links are in-bounds, adjacent, and expose at most two new options',
)
assert.equal(BRIAR_TILES.length, 64)
assert.equal(new Set(BRIAR_TILES.map((tile) => tile.key)).size, 64)

assert.deepEqual(
  validateHouseRooms(),
  [],
  'All 36 House locations are authored and reachable',
)
assert.equal(Object.keys(HOUSE_ROOMS).length, 36)
assert.deepEqual(
  HOUSE_ROOMS['HD-35']!.choices.map((choice) => choice.id),
  ['release', 'renew', 'break'],
)
assert.ok(HOUSE_EXIT_POINTS.includes('HD-06'))
assert.ok(HOUSE_EXIT_POINTS.includes('HD-12'))
assert.ok(HOUSE_EXIT_POINTS.includes('HD-24'))
const fullHouse = {
  ...newHouseProgress(),
  wardenPassed: true,
  ending: 'release' as const,
}
const reachedHouse = new Set([HOUSE_ENTRY])
const houseQueue: string[] = [HOUSE_ENTRY]
while (houseQueue.length) {
  const current = houseQueue.shift()!
  const progress = { ...fullHouse, current: current as typeof HOUSE_ENTRY }
  for (const next of houseExits(current as typeof HOUSE_ENTRY, progress)) {
    if (!reachedHouse.has(next)) {
      reachedHouse.add(next)
      houseQueue.push(next)
    }
  }
}
assert.equal(reachedHouse.size, 36, 'All rooms are reachable from the porch')
assert.deepEqual(
  houseExits('HD-01', newHouseProgress()).sort(),
  ['HD-02', 'HD-07'],
  'Opening exploration genuinely forks rather than following a linear room list',
)
assert.ok(
  houseExits('HD-01', {
    ...newHouseProgress(),
    visited: ['HD-01', 'HD-06'],
  }).includes('HD-06'),
  'A discovered return shortcut can be used from the entry porch',
)
assert.ok(
  !houseExits('HD-32', { ...newHouseProgress(), current: 'HD-32' }).includes(
    'HD-33',
  ),
)
assert.ok(
  houseExits('HD-32', {
    ...newHouseProgress(),
    current: 'HD-32',
    wardenPassed: true,
  }).includes('HD-33'),
)
assert.ok(
  !houseExits('HD-35', { ...newHouseProgress(), current: 'HD-35' }).includes(
    'HD-36',
  ),
)
assert.ok(
  houseExits('HD-35', {
    ...newHouseProgress(),
    current: 'HD-35',
    ending: 'renew',
  }).includes('HD-36'),
)
assert.equal(houseWitnessEvidence(newHouseProgress(), {}), false)
assert.equal(
  houseWitnessEvidence(newHouseProgress(), { '4,6': 'testify' }),
  true,
)
assert.equal(
  houseWitnessEvidence(
    { ...newHouseProgress(), decisions: { 'HD-17': 'read' } },
    {},
  ),
  true,
)
const houseSave = restoreBriarSave({
  ...newBriarSave(),
  room: 'house',
  house: {
    ...newHouseProgress(),
    current: 'HD-18',
    visited: ['HD-01', 'HD-18'],
    decisions: { 'HD-03': 'route', 'HD-04': 'share' },
    ending: 'release',
  },
})
assert.equal(houseSave.room, 'house')
assert.equal(houseSave.house?.current, 'HD-18')
assert.equal(houseSave.house?.decisions['HD-03'], 'route')
assert.equal(houseSave.house?.ending, 'release')
assert.equal(
  houseSave.house?.chimeClaimed,
  false,
  'Ending choice does not grant unlimited rewards',
)
for (const id of ['HD-09', 'HD-19', 'HD-22', 'HD-28', 'HD-32']) {
  const source = HOUSE_ROOMS[id]!
  assert.ok(
    source.choices.some((choice) =>
      ['duel', 'match', 'fight'].includes(choice.id),
    ),
  )
}

assert.deepEqual(firstWorldPhotoChronicle({}), [])
assert.deepEqual(
  firstWorldPhotoChronicle({ '8,6': 'promise', '2,5': 'grieve' }).map(
    (photo) => photo.key,
  ),
  ['2,5', '8,6'],
  'Photographs are stored in Earth chronology even when collected in reverse map order',
)
assert.deepEqual(
  firstWorldPhotoChronicle(
    restoreBriarSave({
      ...newBriarSave(),
      sceneChoices: { '8,6': 'record', '2,5': 'archive' },
    }).sceneChoices,
  ).map((photo) => photo.key),
  ['2,5', '8,6'],
  'Photograph records survive saving and reloading',
)

// Independent Earth Chronicle: 32 planned pieces but no future-world spoilers.
assert.deepEqual(validateEarthPhotoManifest(), [])
assert.equal(EARTH_PHOTOS.length, 32)
assert.deepEqual(
  EARTH_PHOTOS.slice(0, 4).map((photo) => [photo.experience, photo.site]),
  [
    ['e01', '2,5'],
    ['e01', '8,6'],
    ['e02', '2,5'],
    ['e02', '5,4'],
  ],
)
const playablePhotoScenes = [
  { reality: 'e01' as const, site: '2,5', choices: ['archive', 'grieve'] },
  { reality: 'e01' as const, site: '8,6', choices: ['record', 'promise'] },
  { reality: 'e02' as const, site: '2,5', choices: ['question', 'preserve'] },
  { reality: 'e02' as const, site: '5,4', choices: ['draw', 'release'] },
]
for (const { reality, site, choices } of playablePhotoScenes) {
  const scene = reality === 'e01' ? BRIAR_SCENES[site] : DARK_BRIAR_SCENES[site]
  assert.ok(scene, `Earth photo scene ${reality}/${site} must be authored`)
  assert.match(
    scene.opening,
    /photograph|photo|print|apology/i,
    `Earth photo ${reality}/${site} must be discoverable in its scene`,
  )
  for (const choice of choices) {
    assert.ok(
      scene.choices.some((option) => option.id === choice),
      `Earth photo ${reality}/${site} must honor choice ${choice}`,
    )
    const scenes = { e01: {}, e02: {} } as {
      e01: Record<string, string>
      e02: Record<string, string>
    }
    scenes[reality][site] = choice
    assert.deepEqual(
      reconcileEarthChronicle(newEarthChronicle(), scenes).found,
      [
        EARTH_PHOTOS.find(
          (photo) => photo.experience === reality && photo.site === site,
        )!.id,
      ],
      `Earned photo must be granted by ${reality}/${site} choice ${choice}`,
    )
  }
}
assert.deepEqual(
  reconcileEarthChronicle(newEarthChronicle(), {
    e01: { '2,5': 'forged', '8,6': 'forged' },
    e02: { '2,5': 'forged', '5,4': 'forged' },
  }).found,
  [],
  'Invalid or forged scene decisions cannot mint Earth Chronicle evidence',
)
assert.deepEqual(
  firstWorldPhotoChronicle({ '2,5': 'forged', '8,6': 'forged' }),
  [],
  'Legacy photo summaries also reject decisions absent from the authored scenes',
)
const recordedBackwards = reconcileEarthChronicle(newEarthChronicle(), {
  e01: { '8,6': 'record' },
  e02: { '5,4': 'draw', '2,5': 'question' },
})
assert.deepEqual(
  recoveredEarthPhotos(recordedBackwards).map((photo) => photo.order),
  [2, 3, 4],
  'Out-of-order cross-reality finds are filed in Earth-side chronology',
)
assert.equal(
  reconcileEarthChronicle(recordedBackwards, {
    e01: { '8,6': 'record' },
    e02: { '5,4': 'draw', '2,5': 'question' },
  }),
  recordedBackwards,
  'Once-only photograph claims do not churn or duplicate when the same scene is replayed',
)
const reacted = respondToEarthPhoto(recordedBackwards, 'earth-03', 'challenge')
assert.equal(reacted.responses['earth-03'], 'challenge')
assert.equal(
  respondToEarthPhoto(reacted, 'earth-03', 'hold'),
  reacted,
  'A later reaction does not overwrite the player’s earlier response',
)
assert.equal(
  respondToEarthPhoto(reacted, 'earth-31', 'challenge'),
  reacted,
  'Future unwritten reality cannot mint a spoiler response',
)
const restoredChronicle = restoreEarthChronicle(
  JSON.parse(
    JSON.stringify({
      ...reacted,
      found: [...reacted.found, 'earth-31', 'earth-99'],
    }),
  ),
)
assert.deepEqual(restoredChronicle.found, reacted.found)
assert.deepEqual(restoredChronicle.responses, reacted.responses)
assert.equal(recoveredEarthPhotos(newEarthChronicle()).length, 0)
const migratedChronicle = reconcileEarthChronicle(newEarthChronicle(), {
  e01: { '8,6': 'record', '2,5': 'archive' },
  e02: {},
})
assert.deepEqual(
  recoveredEarthPhotos(migratedChronicle).map((photo) => photo.id),
  ['earth-01', 'earth-02'],
  'Older Briar saves gain their already-earned evidence without replaying encounters',
)
// The impatient reader may find a Dark Briar photograph before either
// original, then reset the original map. All 24 permutations should restore
// the same Earth chronology, preserve consent-based responses, and never leak
// later-world photographs into the journal.
const photoEvents = [
  {
    reality: 'e01' as const,
    site: '2,5',
    id: 'earth-01',
    choice: 'archive',
  },
  {
    reality: 'e01' as const,
    site: '8,6',
    id: 'earth-02',
    choice: 'record',
  },
  {
    reality: 'e02' as const,
    site: '2,5',
    id: 'earth-03',
    choice: 'question',
  },
  {
    reality: 'e02' as const,
    site: '5,4',
    id: 'earth-04',
    choice: 'draw',
  },
]
function permutations<T>(items: readonly T[]): T[][] {
  if (!items.length) return [[]]
  return items.flatMap((item, i) =>
    permutations(items.filter((_, j) => i !== j)).map((tail) => [
      item,
      ...tail,
    ]),
  )
}
let photoSequences = 0
for (const sequence of permutations(photoEvents)) {
  const scenes: { e01: Record<string, string>; e02: Record<string, string> } = {
    e01: {},
    e02: {},
  }
  let journal = newEarthChronicle()
  for (const [i, event] of sequence.entries()) {
    scenes[event.reality][event.site] = event.choice
    journal = reconcileEarthChronicle(journal, scenes)
    assert.equal(journal.found.length, i + 1)
    const response = i % 2 ? 'hold' : 'challenge'
    journal = respondToEarthPhoto(journal, event.id, response)
    assert.equal(journal.responses[event.id], response)
    journal = restoreEarthChronicle(JSON.parse(JSON.stringify(journal)))
  }
  assert.deepEqual(
    recoveredEarthPhotos(journal).map((photo) => photo.id),
    ['earth-01', 'earth-02', 'earth-03', 'earth-04'],
  )
  const old = journal.responses[sequence[0]!.id]
  assert.equal(
    respondToEarthPhoto(journal, sequence[0]!.id, 'hold').responses[
      sequence[0]!.id
    ],
    old,
  )
  // An ordinary world restart doesn't destroy the cross-run photograph record.
  journal = reconcileEarthChronicle(journal, { e01: {}, e02: {} })
  assert.equal(journal.found.length, 4)
  photoSequences++
}
assert.equal(photoSequences, 24)
console.log(
  'Adversarial Earth Chronicle: 24 mirrored/original discovery orders, persistent first-response semantics',
)

const pairedPhotoCases = [
  ['earth-01', 'earth-03'],
  ['earth-02', 'earth-04'],
] as const
for (const [firstId, secondId] of pairedPhotoCases) {
  const firstOnly = {
    ...newEarthChronicle(),
    found: [firstId],
    responses: { [firstId]: 'hold' as const },
  }
  assert.equal(earthPhotoReappraisal(firstOnly, firstId), null)
  assert.equal(earthPhotoReappraisal(firstOnly, secondId), null)
  const unreflected = { ...firstOnly, found: [secondId, firstId] }
  assert.equal(earthPhotoReappraisal(unreflected, firstId), null)
  const outcomes = new Set<string>()
  for (const firstResponse of ['challenge', 'hold'] as const) {
    for (const secondResponse of ['challenge', 'hold'] as const) {
      const journal = restoreEarthChronicle(
        JSON.parse(
          JSON.stringify({
            version: 1,
            found: [secondId, firstId],
            responses: {
              [firstId]: firstResponse,
              [secondId]: secondResponse,
            },
          }),
        ),
      )
      const fromFirst = earthPhotoReappraisal(journal, firstId)
      const fromSecond = earthPhotoReappraisal(journal, secondId)
      assert.ok(fromFirst)
      assert.deepEqual(fromFirst, fromSecond)
      assert.match(fromFirst.evidence, /photograph|print|gathering/i)
      assert.ok(fromFirst.reflection.length > 80)
      outcomes.add(fromFirst.reflection)
      assert.equal(
        earthPhotoReappraisal(journal, 'earth-31'),
        null,
        'Future photographs must not expose an early comparison',
      )
      assert.equal(
        respondToEarthPhoto(
          journal,
          firstId,
          firstResponse === 'hold' ? 'challenge' : 'hold',
        ),
        journal,
        'Pair comparisons must never rewrite the original response',
      )
    }
  }
  assert.equal(
    outcomes.size,
    4,
    'Every paired interpretation has unique authored copy',
  )
}
assert.equal(earthPhotoReappraisal(newEarthChronicle(), 'earth-01'), null)

const chronicleSurface = readFileSync(
  'components/memory-dungeon/earth-chronicle.vue',
  'utf8',
)
const memoryMapSurface = readFileSync(
  'components/pages/memory-dungeon-overworld.vue',
  'utf8',
)
const questLogSurface = readFileSync(
  'components/memory-dungeon/quest-log.vue',
  'utf8',
)
for (const surface of [chronicleSurface, questLogSurface]) {
  assert.match(surface, /@keydown="trapMemoryDialogTab\(\$event, dialog\)"/)
  assert.match(surface, /@keydown\.esc\.prevent="emit\('close'\)"/)
}
assert.match(memoryMapSurface, /ref="settingsDialog"/)
assert.match(memoryMapSurface, /@keydown="trapMemoryDialogTab\(\$event, settingsDialog\)"/)
assert.match(memoryMapSurface, /@keydown\.esc\.prevent\.stop="settingsOpen = false"/)
for (const trigger of ['chronicleTrigger', 'questsTrigger', 'settingsTrigger']) {
  assert.ok(memoryMapSurface.includes(`ref="${trigger}"`))
  assert.ok(memoryMapSurface.includes(`${trigger}.value?.focus()`))
}
assert.match(memoryMapSurface, /if \(open\) settingsDialog\.value\?\.focus\(\)/)
assert.match(chronicleSurface, /data-testid="memory-earth-chronicle"/)
assert.match(chronicleSurface, /data-testid="memory-earth-reappraisal"/)
assert.match(chronicleSurface, /earthPhotoReappraisal/)
assert.match(chronicleSurface, /world\.answerEarthPhoto/)
assert.match(chronicleSurface, /v-if="!failed\[active.id\]"/)
assert.match(memoryMapSurface, /data-testid="memory-earth-chronicle-open"/)
assert.doesNotMatch(
  memoryMapSurface,
  /\/32 photographs|future photograph|16 realms/i,
)

assert.equal(
  Object.keys(BRIAR_SCENES).length,
  64,
  'Every fixed Briar coordinate has original narrative, art direction and two choices',
)
for (const tile of BRIAR_TILES) {
  const scene = BRIAR_SCENES[tile.key]
  assert.ok(scene, `Missing authored experience at ${tile.key}`)
  assert.ok(
    scene.title.trim() && scene.opening.trim() && scene.artPrompt.trim(),
  )
  assert.ok(scene.choices.length >= 2)
  assert.ok(
    new Set(scene.choices.map((choice) => choice.id)).size ===
      scene.choices.length,
  )
  for (const choice of scene.choices) {
    assert.ok(choice.label.trim() && choice.outcome.trim())
    const save = restoreBriarSave({
      ...newBriarSave(),
      revealed: [tile.key],
      visited: [tile.key],
      sceneChoices: { [tile.key]: choice.id },
    })
    assert.equal(
      save.sceneChoices[tile.key],
      choice.id,
      `Choice at ${tile.key} restores`,
    )
  }
}

assert.deepEqual(
  validateBriarStoryAtlas(),
  [],
  'Canonical atlas stays aligned with runnable scenes and planned sites',
)
assert.equal(Object.keys(BRIAR_STORY_ATLAS).length, 64)
assert.deepEqual(
  pendingBriarStoryKeys().sort(),
  BRIAR_TILES.filter((tile) => !BRIAR_SCENES[tile.key])
    .map((tile) => tile.key)
    .sort(),
  'Editorial planning cannot silently masquerade as shipped runtime scenes',
)
for (const tile of BRIAR_TILES) {
  const atlas = BRIAR_STORY_ATLAS[tile.key]!
  assert.ok(atlas.title && atlas.artDirection && atlas.introduction)
  assert.ok(atlas.choices.length >= 2)
  if (BRIAR_SCENES[tile.key]) {
    assert.equal(atlas.status, 'playable-scene')
    assert.equal(atlas.introduction, BRIAR_SCENES[tile.key]!.opening)
    assert.deepEqual(
      atlas.choices.map((choice) => choice.id),
      BRIAR_SCENES[tile.key]!.choices.map((choice) => choice.id),
    )
  } else {
    assert.equal(atlas.status, 'planned')
  }
}
assert.ok(
  !JSON.stringify(BRIAR_STORY_ATLAS).match(
    /\\b(?:Prince Halden|Prince Vesper)\\b/i,
  ),
  'Abandoned prince canon cannot reappear in the new atlas',
)

const first = newBriarSave()
assert.deepEqual(first.frontier, [])
assert.deepEqual(first.revealed, [])
assert.equal(first.waveIndex, 0)
assert.equal(first.wavePhase, 'matching')
assert.equal(first.attempts, 0)
assert.equal(first.player, BRIAR_START)

assert.equal(
  first.prologueChoice,
  null,
  'New games have not yet chosen a prologue path',
)
assert.equal(
  restoreBriarSave({ ...newBriarSave(), prologueChoice: 'terms' })
    .prologueChoice,
  'terms',
  'The opening choice survives a browser reload',
)
assert.equal(
  restoreBriarSave({ ...newBriarSave(), prologueChoice: 'anchor' })
    .prologueChoice,
  'anchor',
)
assert.equal(
  restoreBriarSave({ ...newBriarSave(), prologueChoice: 'invalid' })
    .prologueChoice,
  null,
  'Old and malformed saves cannot invent a prologue outcome',
)

const visited = new Set([BRIAR_START])
const queue = [BRIAR_START]
while (queue.length) {
  const current = queue.shift()!
  for (const next of BRIAR_LINKS[current] ?? []) {
    if (!visited.has(next)) {
      visited.add(next)
      queue.push(next)
    }
  }
}
for (const site of Object.keys(BRIAR_SITES).filter(
  (key) =>
    !BRIAR_CROSS_MAP_KEYS.includes(
      key as (typeof BRIAR_CROSS_MAP_KEYS)[number],
    ),
)) {
  assert.equal(
    visited.has(site),
    true,
    `Player can eventually reveal site ${site}`,
  )
}
assert.equal(
  visited.size,
  BRIAR_TILES.length,
  'All 64 fixed Briar squares have a legal route from camp',
)
assert.equal(
  BRIAR_CROSS_MAP_KEYS.filter((key) => visited.has(key)).length,
  4,
  'All cross-map seals have a future legal path without inventing a new coordinate',
)
assert.equal(visited.has(BRIAR_DUNGEON), true)
assert.equal(visited.has(BRIAR_GATE), true)
assert.equal(
  BRIAR_SITES['1,4']?.name,
  BRIAR_SCENES['1,4']?.title,
  'Authored sites have meaningful visible map labels',
)
assert.equal(
  BRIAR_SITES['4,4']?.kind,
  'story',
  'Scene-only map locations use a real story site instead of an empty marker',
)
assert.equal(BRIAR_SITES['4,2']?.kind, 'merchant')
assert.equal(BRIAR_SITES['2,7']?.kind, 'puzzle')
assert.equal(BRIAR_SITES['3,6']?.kind, 'chest')
assert.equal(BRIAR_SITES['7,6']?.kind, 'chest')
assert.equal(BRIAR_SITES['5,2']?.kind, 'sealed')

const road = ['2,4', '3,4', '4,4', '5,4', '6,4', '7,4', '8,4']
assert.equal(briarConnected(BRIAR_START, BRIAR_GATE, road), true)
assert.equal(briarConnected(BRIAR_START, BRIAR_GATE, road.slice(0, -1)), false)

const firstBriarExpansion = [
  '1,5',
  '1,6',
  '1,7',
  '2,7',
  '2,2',
  '2,1',
  '3,1',
  '4,1',
  '6,1',
  '7,1',
  '7,2',
  '4,5',
  '5,3',
  '5,6',
  '6,7',
  '7,5',
]
for (const key of firstBriarExpansion) {
  assert.ok(BRIAR_SCENES[key], `Expanded scene ${key} is authored`)
  assert.equal(BRIAR_SCENES[key]?.choices.length, 2)
  assert.ok(visited.has(key), `Scene ${key} is reachable from Briar Camp`)
  const savedChoices = Object.fromEntries(
    firstBriarExpansion.map((site) => [
      site,
      BRIAR_SCENES[site]!.choices[0]!.id,
    ]),
  )
  const save = restoreBriarSave({
    ...newBriarSave(),
    sceneChoices: savedChoices,
  })
  assert.equal(save.sceneChoices[key], BRIAR_SCENES[key]?.choices[0]?.id)
}
assert.equal(
  new Set(firstBriarExpansion).size,
  16,
  'First Briar expansion adds exactly sixteen unique coordinates',
)
assert.match(
  briarSceneOpening(BRIAR_SCENES['7,2']!, { '2,2': 'observe' }),
  /wolf patrol tracks/,
  "Forest court reflects the player's earlier investigation",
)

const secondBriarExpansion = [
  '1,4',
  '1,3',
  '1,2',
  '2,3',
  '3,3',
  '5,1',
  '8,2',
  '6,5',
  '6,6',
  '7,7',
  '7,8',
  '1,8',
  '2,8',
  '4,8',
  '5,8',
  '8,3',
]
assert.equal(new Set(secondBriarExpansion).size, 16)
for (const key of secondBriarExpansion) {
  assert.ok(BRIAR_SCENES[key], `A second-batch scene exists at ${key}`)
  assert.ok(visited.has(key), `Scene ${key} is reachable from camp`)
  const scene = BRIAR_SCENES[key]!
  assert.equal(scene.choices.length, 2, `${key} offers a meaningful fork`)
  const savedState = restoreBriarSave({
    ...newBriarSave(),
    revealed: ['2,4', key],
    visited: ['2,4', key],
    player: key,
    sceneChoices: { [key]: scene.choices[1]!.id },
  })
  assert.equal(
    savedState.sceneChoices[key],
    scene.choices[1]!.id,
    `Decision at ${key} survives reload`,
  )
  assert.equal(
    briarTileProgress(savedState, key),
    'complete',
    `Resolved story square ${key} receives a completion marker`,
  )
}
assert.equal(
  Object.keys(BRIAR_SCENES).length,
  64,
  'All 64 Briar Marches authored scene records exist',
)
assert.match(
  briarSceneOpening(BRIAR_SCENES['1,4']!, { '2,2': 'observe' }),
  /wolf a raider/,
  'The red-hooded courier remembers the wolf evidence',
)
assert.match(
  briarSceneOpening(BRIAR_SCENES['5,8']!, { '3,3': 'halt' }),
  /stopped gears/,
  "The attorney's contract economy responds to the player's earlier mill choice",
)
assert.equal(
  briarSceneOpening(BRIAR_SCENES['5,8']!, {}),
  BRIAR_SCENES['5,8']!.opening,
  'Undiscovered earlier choices cannot trigger hidden callbacks',
)

const sceneCoordinates = Object.keys(BRIAR_SCENES)
assert.ok(
  sceneCoordinates.length >= 12,
  'World 1 begins with authored individual scenes',
)
for (const key of sceneCoordinates) {
  assert.ok(
    BRIAR_TILES.some((tile) => tile.key === key),
    `Scene ${key} is on map`,
  )
  const scene = BRIAR_SCENES[key]!
  assert.ok(scene.opening.length > 100, `Scene ${key} has prose`)
  assert.ok(scene.artPrompt.length > 40, `Scene ${key} has an art brief`)
  assert.equal(scene.choices.length, 2, `Scene ${key} has two decisions`)
  assert.equal(new Set(scene.choices.map((option) => option.id)).size, 2)
}

assert.equal(
  BRIAR_SCENES['4,4']?.choices.length,
  2,
  'The mermaid twins offer two different responses',
)
assert.match(BRIAR_SCENES['4,4']!.opening, /Scylla/)
assert.match(BRIAR_SCENES['4,4']!.opening, /Charybdis/)
assert.match(BRIAR_SCENES['4,3']!.opening, /executioner’s hood/)
assert.match(
  briarSceneOpening(BRIAR_SCENES['4,3']!, { '4,4': 'escort' }),
  /UNNECESSARY BUT BINDING/,
  "Oren responds to the player's earlier choice",
)

assert.match(
  briarSceneOpening(BRIAR_SCENES['6,4']!, { '3,5': 'light' }),
  /own voice thanks to you/,
  'Pip recalls an earlier decision',
)
assert.equal(
  canChooseBriarScene(BRIAR_SCENES['2,4']!.choices[0]!, {
    lanterns: 0,
    wildflowers: 0,
  }),
  false,
  'Players cannot spend a lantern they lack',
)
assert.equal(
  canChooseBriarScene(BRIAR_SCENES['2,4']!.choices[1]!, {
    lanterns: 0,
    wildflowers: 0,
  }),
  true,
  'A no-cost story continuation remains available',
)
const visitSave = {
  ...newBriarSave(),
  revealed: ['2,4', '3,4', '3,6', '5,5', '5,2', '6,2', '8,4', '2,7'],
  visited: ['2,4', '3,6', '5,5', '5,2', '6,2', '8,4', '2,7'],
}
assert.equal(briarTileProgress(visitSave, '4,8'), 'hidden')
assert.equal(briarTileProgress(visitSave, '3,4'), 'unvisited')
assert.equal(briarTileProgress(visitSave, '2,4'), 'unfinished')
assert.equal(briarTileProgress(visitSave, '3,6'), 'unfinished')
assert.equal(briarTileProgress(visitSave, '5,5'), 'unfinished')
assert.equal(briarTileProgress(visitSave, '5,2'), 'unfinished')
assert.equal(briarTileProgress(visitSave, '6,2'), 'unfinished')
assert.equal(briarTileProgress(visitSave, '8,4'), 'unfinished')
assert.equal(briarTileProgress(visitSave, '2,7'), 'unfinished')
const settledSave = {
  ...visitSave,
  sceneChoices: {
    '2,4': 'copy',
    '3,6': 'read',
    '5,5': 'gift',
    '6,2': 'witness',
    '8,4': 'law',
    '2,7': 'rehearse',
  },
  chestClaims: ['3,6'],
  completedEncounters: ['5,5'],
  relics: ['bramble-chime'],
  gateOpened: true,
  puzzleSolved: true,
}
for (const key of ['2,4', '3,6', '5,5', '6,2', '8,4', '2,7']) {
  assert.equal(
    briarTileProgress(settledSave, key),
    'complete',
    `${key} clears only when resolved`,
  )
}
assert.equal(
  briarTileProgress({ ...settledSave, completedEncounters: [] }, '5,5'),
  'unfinished',
  'Hearing the Sprite without completing its duel does not clear the square',
)
assert.equal(
  briarTileProgress(
    {
      ...settledSave,
      sceneChoices: { ...settledSave.sceneChoices, '2,7': '' },
    },
    '2,7',
  ),
  'unfinished',
  'The stone puzzle requires both solving the glyphs and settling the encounter',
)
assert.equal(
  briarTileProgress(
    {
      ...settledSave,
      sceneChoices: { ...settledSave.sceneChoices, '2,4': '' },
    },
    '2,4',
  ),
  'unfinished',
  'An old cleared square becomes actionable again when its scene is reactivated',
)
assert.equal(
  briarTileProgress(settledSave, '5,2'),
  'unfinished',
  'Cross-world seals remain pending',
)
const restoredScene = restoreBriarSave({
  ...settledSave,
  sceneChoices: { ...settledSave.sceneChoices, '3,4': 'invalid' },
})
assert.equal(restoredScene.sceneChoices['2,4'], 'copy')
assert.equal(restoredScene.sceneChoices['3,4'], undefined)
assert.ok(restoredScene.visited.includes('3,6'))
assert.ok(
  restoreBriarSave({
    ...newBriarSave(),
    revealed: ['2,4'],
    player: '2,4',
    visited: undefined,
    sceneChoices: undefined,
  }).visited.includes('2,4'),
  'Older saves recover the last visited square',
)

const saved = {
  ...newBriarSave(),
  revealed: ['1,4', '2,4', '3,4', '99,99', '3,4'],
  frontier: ['4,4', '-1,1', '3,4'],
  player: '3,4',
  attempts: 11,
  cards: [
    { id: 0, pairId: 0, image: '/ok.jpg', matched: false, flipped: true },
  ],
  room: 'memory',
  roomId: 'vault-1',
}
const restored = restoreBriarSave(saved)
assert.deepEqual(restored.revealed, ['1,4', '2,4', '3,4'])
assert.deepEqual(restored.frontier, ['4,4'])
assert.equal(restored.player, '3,4')
assert.equal(restored.attempts, 11)
assert.equal(
  restored.cards[0]?.flipped,
  false,
  'Incomplete one-card turn is discarded safely',
)
assert.equal(
  restored.room,
  'memory',
  'Active matching room can resume after reload',
)
assert.equal(
  restoreBriarSave({ ...saved, version: 999 }).attempts,
  0,
  'Unknown schema resets safely',
)
assert.equal(
  restoreBriarSave({ ...saved, attempts: -99 }).attempts,
  0,
  'Corrupt attempts cannot go negative',
)

console.log(
  'Memory Dungeon Briar Camp: reveal routes, landmarks and save contracts passed.',
)

assert.equal(
  DESIGNED_DUNGEON_ART.length,
  36,
  'Designed fantasy deck has thirty-six unique art faces',
)
assert.equal(
  new Set(DESIGNED_DUNGEON_ART.map((item) => item.imagePath)).size,
  36,
)
assert.equal(
  DESIGNED_DUNGEON_ART.every((entry) =>
    entry.imagePath.startsWith('data:image/svg+xml'),
  ),
  true,
)
assert.deepEqual(normalizeDungeonDeck({}), DEFAULT_DUNGEON_DECK)
assert.equal(
  normalizeDungeonDeck({ gallery: 'generated' }).gallery,
  'generated',
)
assert.equal(normalizeDungeonDeck({ family: 'bad' }).family, 'designed')
assert.deepEqual(
  normalizeDungeonDeck({ collectionIds: [1, 1, -1, 2] }).collectionIds,
  [1, 2],
)
assert.equal(
  isEligibleDungeonArt({ isPublic: true, isMature: false }, false, false),
  true,
)
assert.equal(
  isEligibleDungeonArt({ isPublic: false, isMature: false }, true, true),
  false,
)
assert.equal(
  isEligibleDungeonArt({ isPublic: null, isMature: false }, false, false),
  false,
)
assert.equal(
  isEligibleDungeonArt({ isPublic: true, isActive: false }, true, true),
  false,
)
assert.equal(
  isEligibleDungeonArt({ isPublic: true, isMature: true }, false, true),
  false,
)
assert.equal(
  isEligibleDungeonArt({ isPublic: true, isMature: true }, true, false),
  false,
)
assert.equal(
  isEligibleDungeonArt({ isPublic: true, isMature: true }, true, true),
  true,
)
assert.equal(
  isEligibleDungeonArt({ isPublic: true, isMature: false }, true, true),
  false,
  'Mature-only mode must exclude all non-mature cards rather than mixing them',
)
assert.equal(
  isEligibleDungeonArt({ isPublic: true, isMature: true }, false, true),
  false,
  'Non-mature mode must never include mature art',
)
assert.equal(
  isEligibleDungeonArt({ isPublic: true, isMature: true }, true, false),
  false,
  'Guest, child, or mature-off accounts cannot force mature cards through local settings',
)
assert.equal(
  isEligibleDungeonArt({ isPublic: true, isMature: false }, false, false),
  true,
  'Anonymous and restricted users still get normal public safe art',
)
assert.deepEqual(
  uniqueDeckPaths(['/forest.jpg', '/forest.jpg', '', '/sun.jpg']),
  ['/forest.jpg', '/sun.jpg'],
)

assert.deepEqual(validateBriarWaves(), [])
assert.deepEqual(
  BRIAR_REVEAL_WAVES.map((wave) => wave.length),
  BRIAR_WAVE_SIZES,
)
assert.equal(BRIAR_REVEAL_WAVES.flat().length, 60)
assert.equal(
  new Set([...BRIAR_REVEAL_WAVES.flat(), ...BRIAR_CROSS_MAP_KEYS]).size,
  64,
)
assert.equal(BRIAR_CROSS_MAP_KEYS.length, 4)
for (const [index, wave] of BRIAR_REVEAL_WAVES.entries()) {
  const faces = Array.from(
    { length: wave.length / 2 },
    (_, pair) => `/design/pair-${pair}.png`,
  )
  const cards = createBriarWaveCards(wave, faces, () => 0.4)
  assert.equal(
    cards.length,
    wave.length,
    `wave ${index + 1} has expected card count`,
  )
  assert.equal(new Set(cards.map((card) => card.tile)).size, wave.length)
  for (const image of faces) {
    assert.equal(cards.filter((card) => card.image === image).length, 2)
  }
}
const interruptionWave = BRIAR_REVEAL_WAVES[0]!
const interruptionCards = createBriarWaveCards(
  interruptionWave,
  Array.from(
    { length: interruptionWave.length / 2 },
    (_, i) => `/memory-${i}.webp`,
  ),
  () => 0.4,
)
const interruptionPair = interruptionCards.filter((card) => card.pairId === 0)
const otherPairCard = interruptionCards.find((card) => card.pairId === 1)!
assert.equal(interruptionPair.length, 2)
const interruptionBase = {
  ...newBriarSave(),
  mapCards: interruptionCards,
  mapDeckSignature: 'designed',
}
const pendingSingle = {
  ...interruptionBase,
  mapCards: interruptionCards.map((card) => ({
    ...card,
    flipped: card.tile === interruptionPair[0]!.tile,
  })),
}
const resumedSingle = recoverBriarWaveTurn(
  restoreBriarSave(pendingSingle),
  pendingSingle,
)
assert.equal(resumedSingle.firstTile, interruptionPair[0]!.tile)
assert.equal(
  resumedSingle.progress.mapCards.find(
    (card) => card.tile === interruptionPair[0]!.tile,
  )?.flipped,
  true,
  'Reload between first and second flips preserves the active first card',
)
assert.equal(resumedSingle.progress.attempts, 0)
const pendingMatch = {
  ...interruptionBase,
  attempts: 1,
  mapCards: interruptionCards.map((card) => ({
    ...card,
    flipped: interruptionPair.some((pair) => pair.tile === card.tile),
  })),
}
const resumedMatch = recoverBriarWaveTurn(
  restoreBriarSave(pendingMatch),
  pendingMatch,
)
assert.equal(resumedMatch.firstTile, null)
assert.equal(resumedMatch.progress.attempts, 1)
assert.ok(
  interruptionPair.every(
    (pair) =>
      resumedMatch.progress.revealed.includes(pair.tile) &&
      resumedMatch.progress.mapCards.find((card) => card.tile === pair.tile)
        ?.matched,
  ),
  'Reload during the success animation commits the already-paid-for pair',
)
const replayedMatch = recoverBriarWaveTurn(
  restoreBriarSave(resumedMatch.progress),
  resumedMatch.progress,
)
assert.equal(replayedMatch.recovered, false)
assert.equal(replayedMatch.progress.attempts, 1)
const pendingMismatch = {
  ...interruptionBase,
  attempts: 1,
  mapCards: interruptionCards.map((card) => ({
    ...card,
    flipped:
      card.tile === interruptionPair[0]!.tile ||
      card.tile === otherPairCard.tile,
  })),
}
const resumedMismatch = recoverBriarWaveTurn(
  restoreBriarSave(pendingMismatch),
  pendingMismatch,
)
assert.equal(resumedMismatch.firstTile, null)
assert.equal(resumedMismatch.progress.attempts, 1)
assert.equal(resumedMismatch.progress.revealed.length, 0)
assert.ok(
  resumedMismatch.progress.mapCards.every(
    (card) => card.matched || !card.flipped,
  ),
  'Reload during a mismatch closes both cards without another penalty',
)
const forgedMatch = {
  ...pendingMatch,
  mapCards: pendingMatch.mapCards.map((card) =>
    card.tile === interruptionPair[1]!.tile
      ? { ...card, image: '/different-face.webp' }
      : card,
  ),
}
const rejectedForgery = recoverBriarWaveTurn(
  restoreBriarSave(forgedMatch),
  forgedMatch,
)
assert.equal(rejectedForgery.progress.revealed.length, 0)
assert.equal(rejectedForgery.firstTile, null)
const overflipped = {
  ...pendingMatch,
  mapCards: pendingMatch.mapCards.map((card) =>
    card.tile === otherPairCard.tile ? { ...card, flipped: true } : card,
  ),
}
const rejectedOverflip = recoverBriarWaveTurn(
  restoreBriarSave(overflipped),
  overflipped,
)
assert.equal(rejectedOverflip.progress.revealed.length, 0)
assert.ok(
  rejectedOverflip.progress.mapCards.every(
    (card) => card.matched || !card.flipped,
  ),
  'Malformed saves with three exposed faces never mint terrain',
)
const finalPair = {
  ...pendingMatch,
  mapCards: pendingMatch.mapCards.map((card) =>
    card.pairId === 0 ? card : { ...card, flipped: true, matched: true },
  ),
}
const completedOnReload = recoverBriarWaveTurn(
  restoreBriarSave(finalPair),
  finalPair,
)
assert.equal(
  completedOnReload.progress.wavePhase,
  'exploring',
  'The final successful flip resumes directly into exploration',
)
const mirroredWave = DARK_BRIAR_WAVES[0]!
const mirroredCards = createBriarWaveCards(
  mirroredWave,
  Array.from(
    { length: mirroredWave.length / 2 },
    (_, i) => `/mirrored-memory-${i}.webp`,
  ),
  () => 0.4,
)
const mirroredPair = mirroredCards.filter((card) => card.pairId === 0)
const mirroredOther = mirroredCards.find((card) => card.pairId === 1)!
const mirroredBase = {
  ...newDarkBriarProgress(),
  mapCards: mirroredCards,
}
const mirroredSingle = {
  ...mirroredBase,
  mapCards: mirroredCards.map((card) => ({
    ...card,
    flipped: card.tile === mirroredPair[0]!.tile,
  })),
}
const resumedMirroredSingle = recoverDarkBriarTurn(
  restoreDarkBriarProgress(mirroredSingle),
  mirroredSingle,
)
assert.equal(resumedMirroredSingle.firstTile, mirroredPair[0]!.tile)
assert.equal(resumedMirroredSingle.progress.attempts, 0)
assert.equal(
  resumedMirroredSingle.progress.mapCards.find(
    (card) => card.tile === mirroredPair[0]!.tile,
  )?.flipped,
  true,
  'A reflected first flip survives reload without another attempt',
)
const mirroredPending = {
  ...mirroredBase,
  attempts: 1,
  mapCards: mirroredCards.map((card) => ({
    ...card,
    flipped: mirroredPair.some((pair) => pair.tile === card.tile),
  })),
}
const resumedMirroredPair = recoverDarkBriarTurn(
  restoreDarkBriarProgress(mirroredPending),
  mirroredPending,
)
assert.equal(resumedMirroredPair.progress.attempts, 1)
assert.equal(resumedMirroredPair.firstTile, null)
assert.ok(
  mirroredPair.every(
    (pair) =>
      resumedMirroredPair.progress.revealed.includes(pair.tile) &&
      resumedMirroredPair.progress.mapCards.find(
        (card) => card.tile === pair.tile,
      )?.matched,
  ),
  'The already-paid mirrored pair resolves once after an interrupted animation',
)
assert.equal(
  recoverDarkBriarTurn(
    restoreDarkBriarProgress(resumedMirroredPair.progress),
    resumedMirroredPair.progress,
  ).recovered,
  false,
  'Replaying the restored save cannot mint the same pair again',
)
const mirroredMismatch = {
  ...mirroredPending,
  mapCards: mirroredCards.map((card) => ({
    ...card,
    flipped:
      card.tile === mirroredPair[0]!.tile || card.tile === mirroredOther.tile,
  })),
}
const closedMirroredMismatch = recoverDarkBriarTurn(
  restoreDarkBriarProgress(mirroredMismatch),
  mirroredMismatch,
)
assert.equal(closedMirroredMismatch.progress.revealed.length, 0)
assert.equal(closedMirroredMismatch.progress.attempts, 1)
assert.ok(
  closedMirroredMismatch.progress.mapCards.every(
    (card) => card.matched || !card.flipped,
  ),
)
const mirroredForgedFace = {
  ...mirroredPending,
  mapCards: mirroredPending.mapCards.map((card) =>
    card.tile === mirroredPair[1]!.tile
      ? { ...card, image: '/different-mirrored-face.webp' }
      : card,
  ),
}
assert.equal(
  recoverDarkBriarTurn(
    restoreDarkBriarProgress(mirroredForgedFace),
    mirroredForgedFace,
  ).progress.revealed.length,
  0,
  'Same pair ID with different artwork never reveals mirrored terrain',
)
const mirroredOverflip = {
  ...mirroredPending,
  mapCards: mirroredPending.mapCards.map((card) =>
    card.tile === mirroredOther.tile ? { ...card, flipped: true } : card,
  ),
}
assert.equal(
  recoverDarkBriarTurn(
    restoreDarkBriarProgress(mirroredOverflip),
    mirroredOverflip,
  ).progress.revealed.length,
  0,
  'Three exposed mirrored cards cannot manufacture a match',
)
assert.equal(
  recoverDarkBriarTurn(
    restoreDarkBriarProgress({ ...mirroredPending, attempts: 0 }),
    { ...mirroredPending, attempts: 0 },
  ).progress.revealed.length,
  0,
  'A two-face save without a recorded attempt cannot earn terrain',
)
const mirroredFinalPair = {
  ...mirroredPending,
  mapCards: mirroredPending.mapCards.map((card) =>
    card.pairId === 0 ? card : { ...card, flipped: true, matched: true },
  ),
}
assert.equal(
  recoverDarkBriarTurn(
    restoreDarkBriarProgress(mirroredFinalPair),
    mirroredFinalPair,
  ).progress.phase,
  'exploring',
  'The last reflected pair resumes directly into exploration',
)
const returnedMirroredPair = settleDarkBriarReturn(mirroredPending)
assert.equal(returnedMirroredPair.attempts, 1)
assert.deepEqual(
  [...returnedMirroredPair.revealed].sort(),
  mirroredPair.map((card) => card.tile).sort(),
  'Leaving during a successful reflected flip must award the already-paid pair',
)
assert.ok(
  mirroredPair.every(
    (card) =>
      returnedMirroredPair.mapCards.find((item) => item.tile === card.tile)
        ?.matched,
  ),
)
assert.ok(
  returnedMirroredPair.mapCards.every((card) => card.matched || !card.flipped),
  'No unmatched pictures remain face up when leaving the reflection',
)
assert.deepEqual(
  settleDarkBriarReturn(returnedMirroredPair),
  returnedMirroredPair,
  'Returning twice cannot grant an extra pair or attempt',
)
const returnedMirroredMismatch = settleDarkBriarReturn(mirroredMismatch)
assert.equal(returnedMirroredMismatch.attempts, 1)
assert.equal(returnedMirroredMismatch.revealed.length, 0)
assert.ok(returnedMirroredMismatch.mapCards.every((card) => !card.flipped))
const returnedMirroredFirst = settleDarkBriarReturn(mirroredSingle)
assert.equal(returnedMirroredFirst.attempts, 0)
assert.equal(returnedMirroredFirst.revealed.length, 0)
assert.ok(returnedMirroredFirst.mapCards.every((card) => !card.flipped))
const returnedMirroredFinal = settleDarkBriarReturn({
  ...mirroredPending,
  revealed: mirroredCards
    .filter((card) => card.pairId !== 0)
    .map((card) => card.tile),
  mapCards: mirroredPending.mapCards.map((card) =>
    card.pairId === 0 ? card : { ...card, flipped: true, matched: true },
  ),
})
assert.equal(returnedMirroredFinal.phase, 'exploring')
assert.equal(returnedMirroredFinal.revealed.length, mirroredCards.length)
assert.deepEqual(
  settleDarkBriarReturn(returnedMirroredFinal),
  returnedMirroredFinal,
  'Leaving after the last pair remains idempotent',
)
assert.match(
  readFileSync('stores/memoryWorldStore.ts', 'utf8'),
  /function returnToBriar\(\): void \{[\s\S]*?dark\.value = settleDarkBriarReturn\(dark\.value\)/,
  'Reality switching must use the same paid-pair recovery as save restoration',
)
assert.match(
  readFileSync('stores/memoryWorldStore.ts', 'utf8'),
  /recoverBriarWaveTurn\(restoreBriarSave\(raw\), raw\)/,
  'Production hydration must actually invoke the interrupted-turn recovery',
)
assert.match(
  readFileSync('stores/memoryWorldStore.ts', 'utf8'),
  /recoverDarkBriarTurn\([\s\S]*?restoreDarkBriarProgress\(checkpoint.dark\)/,
  'Manual checkpoint load settles mirrored turns instead of discarding matches',
)
assert.match(
  readFileSync('stores/memoryWorldStore.ts', 'utf8'),
  /const resumedDark = recoverDarkBriarTurn\([\s\S]*?restoreDarkBriarProgress\(savedDark\)/,
  'Browser hydration recovers interrupted mirrored matching turns',
)
assert.match(
  readFileSync('stores/memoryWorldStore.ts', 'utf8'),
  /latestMapCardKey\.value = resumed\.firstTile/,
  'Restored first flips remain visible in the large image preview',
)

assert.throws(() =>
  createBriarWaveCards(['2,4', '3,4'], ['/same.jpg', '/same.jpg']),
)
assert.equal(BRIAR_SITES['4,2']?.kind, 'merchant')
assert.equal(BRIAR_SITES['6,2']?.kind, 'dungeon')
assert.equal(
  isEligibleDungeonArt({ isPublic: false, userId: 42 }, false, false, 42, true),
  true,
  'Explicitly selected owner art can be used in custom decks',
)
assert.equal(
  isEligibleDungeonArt({ isPublic: false, userId: 42 }, false, false, 77, true),
  false,
  'Another user’s private art is always excluded',
)

assert.deepEqual(
  unseenDeckPaths(
    ['/owl.png', '/fern.png', '/owl.png', '/moth.png'],
    ['/owl.png'],
  ),
  ['/fern.png', '/moth.png'],
  'Previously drawn images never re-enter the playable pool',
)
assert.equal(
  deckImageIdentity(
    '/api/art/image/archive/319?variant=medium&exp=100&sig=old',
  ),
  '/api/art/image/archive/319',
)
assert.deepEqual(
  unseenDeckPaths(
    [
      '/api/art/image/archive/319?exp=200&sig=new',
      '/api/art/image/archive/320?exp=200&sig=new',
    ],
    ['/api/art/image/archive/319?exp=100&sig=old'],
  ),
  ['/api/art/image/archive/320?exp=200&sig=new'],
  'Signed URL refresh never allows the same artwork to repeat',
)
assert.deepEqual(
  unseenDeckPaths(['/one.png', '/one.png'], ['/one.png']),
  [],
  'Exhausted collection must not silently recycle an image',
)

const pool = Array.from({ length: 60 }, (_, i) => `/fresh-${i}.jpg`)
const alreadyUsed = new Set<string>()
for (const wave of BRIAR_REVEAL_WAVES) {
  const fresh = unseenDeckPaths(pool, [...alreadyUsed]).slice(
    0,
    wave.length / 2,
  )
  assert.equal(fresh.length, wave.length / 2)
  assert.equal(fresh.filter((value) => alreadyUsed.has(value)).length, 0)
  for (const path of fresh) alreadyUsed.add(path)
}
assert.equal(alreadyUsed.size, 30)
const usedSave = restoreBriarSave({
  ...newBriarSave(),
  seenMapImages: ['/already.jpg', '/other.jpg', '/already.jpg'],
  mapCards: [
    {
      id: 0,
      pairId: 0,
      image: '/current.jpg',
      tile: '2,4',
      flipped: true,
      matched: false,
    },
  ],
})
assert.deepEqual(usedSave.seenMapImages, [
  '/already.jpg',
  '/other.jpg',
  '/current.jpg',
])
assert.deepEqual(
  newBriarSave().seenMapImages,
  [],
  'New expedition starts with a fresh art history',
)
assert.deepEqual(
  unseenDeckPaths(
    ['/already.jpg', '/current.jpg', '/new.jpg'],
    usedSave.seenMapImages,
  ),
  ['/new.jpg'],
  'Reloaded save still blocks all previously seen cards',
)

assert.equal(
  newBriarSave().mapDeckSignature,
  '',
  'New runs have no old deck binding',
)
const restoredDeck = restoreBriarSave({
  ...newBriarSave(),
  mapDeckSignature: '{"family":"gallery","gallery":"collections"}',
  revealed: ['2,4', '1,4'],
  attempts: 19,
})
assert.equal(
  restoredDeck.mapDeckSignature,
  '{"family":"gallery","gallery":"collections"}',
)
assert.deepEqual(restoredDeck.revealed, ['2,4', '1,4'])
assert.equal(restoredDeck.attempts, 19)
const oldDeckSave = restoreBriarSave({
  ...newBriarSave(),
  mapDeckSignature: undefined,
  mapCards: [
    {
      id: 0,
      pairId: 0,
      image: '/designed.svg',
      tile: '2,4',
      flipped: false,
      matched: false,
    },
  ],
})
assert.equal(
  oldDeckSave.mapDeckSignature,
  '',
  'Older saves must trigger art-source reconciliation',
)

const classicScreen = readFileSync(
  'components/pages/memory-dungeon.vue',
  'utf8',
)
const mapScreen = readFileSync(
  'components/pages/memory-dungeon-overworld.vue',
  'utf8',
)
const launcherScreen = readFileSync(
  'components/pages/memory-dungeon-launcher.vue',
  'utf8',
)
const darkMapScreen = readFileSync(
  'components/memory-dungeon/dark-briar-stage.vue',
  'utf8',
)
const mapBeacon = readFileSync(
  'components/memory-dungeon/action-beacon.vue',
  'utf8',
)
const questScreen = readFileSync(
  'components/memory-dungeon/quest-log.vue',
  'utf8',
)
const houseMapScreen = readFileSync(
  'components/memory-dungeon/house-stage.vue',
  'utf8',
)
const darkHouseScreen = readFileSync(
  'components/memory-dungeon/dark-house-stage.vue',
  'utf8',
)
assert.ok(
  mapScreen.includes(
    'src="/images/memory-dungeon/backdrops/briar-overworld.webp"',
  ),
  'Original Briar uses the delivered painted map first',
)
assert.ok(
  darkMapScreen.includes(
    'src="/images/memory-dungeon/dark-briar/backdrops/map.webp"',
  ),
  'Dark Briar uses its own delivered map art',
)
assert.ok(
  mapScreen.includes('briar-camp.svg') && mapScreen.includes('v-else'),
  'The original map survives a media delivery outage',
)
assert.ok(
  mapScreen.includes('tileNeedsAttention(tile.key)'),
  'Briar tiles show actionable markers',
)
assert.ok(
  mapScreen.includes("progress === 'unfinished'"),
  'Reactivated scene decisions restore an action beacon',
)
assert.ok(
  darkMapScreen.includes('memory-dungeon-action-beacon'),
  'Dark Briar tiles show actionable markers',
)
assert.ok(
  houseMapScreen.includes('memory-dungeon-action-beacon') &&
    houseMapScreen.includes('!progress?.decisions[item.id]'),
  'Original House reactivates markers for unfinished chambers',
)
assert.ok(
  darkHouseScreen.includes('memory-dungeon-action-beacon') &&
    darkHouseScreen.includes('!world.darkHouse.decisions[tileRoom.id]'),
  'Mirrored House reactivates markers for unfinished chambers',
)
assert.ok(
  mapBeacon.includes('rotateY(360deg)'),
  'Action markers use depth and 3D rotation',
)
assert.ok(
  mapBeacon.includes('prefers-reduced-motion'),
  'Action markers respect reduced motion',
)
assert.ok(
  questScreen.includes('text-base leading-relaxed sm:text-lg'),
  'Quest narrative is legible like Shifting Desks',
)
assert.ok(
  mapScreen.includes('font-size: clamp(1rem, 1.85cqw, 1.5rem)'),
  'Story decisions are large at console widths',
)

const memoryCore = readFileSync('stores/memoryStore.ts', 'utf8')
const worldStoreSource = readFileSync('stores/memoryWorldStore.ts', 'utf8')
assert.match(
  worldStoreSource,
  /inspectedSigil\.value = key/,
  'Inspecting a reserved sigil activates its individually authored response',
)
assert.match(
  worldStoreSource,
  /isInspectedSeal/,
  'Regional seal choices are saved without falsely completing the paired puzzle',
)
assert.match(
  mapScreen,
  /world\.activeSiteKey/,
  'Decision buttons use the inspected seal instead of the previous map square',
)
const deckLoaderSource = readFileSync(
  'stores/helpers/memoryDungeonDeckSource.ts',
  'utf8',
)
assert.match(
  worldStoreSource,
  /state\.value\.seenMapImages/,
  'Overworld persists used image history',
)
assert.match(
  worldStoreSource,
  /keys\.length \/ 2,[\s\S]*?usedPrior,[\s\S]*?state\.value\.seenMapImages/,
  'A new map round excludes all previous wave images',
)
assert.match(
  classicScreen,
  /runSeenImages\.add\(path\)/,
  'Classic records images once each floor is dealt',
)
assert.match(
  deckLoaderSource,
  /unseenDeckPaths\(/,
  'All gallery and model pools exclude previous images',
)

assert.match(
  classicScreen,
  /<memory-dungeon-deck-selector/,
  'Classic settings mount shared art selector',
)
assert.match(
  mapScreen,
  /<memory-dungeon-deck-selector/,
  'Overworld settings mount shared art selector',
)

assert.match(
  launcherScreen,
  /data-testid="memory-dungeon-prologue"/,
  'The new full-screen opening is part of the existing memory game',
)
assert.match(
  launcherScreen,
  /world\.recordPrologueChoice\(choice\)/,
  'A prologue choice is persisted before entry',
)
assert.match(
  launcherScreen,
  /hasExistingSave/,
  'Existing runs resume without forcing the new prologue',
)
assert.match(
  worldStoreSource,
  /function recordPrologueChoice\(/,
  'Only the store changes game state',
)

assert.match(
  launcherScreen,
  /<memory-dungeon-deck-selector/,
  'Launcher mounts shared art selector',
)
assert.doesNotMatch(
  classicScreen,
  /<collection-picker/,
  'Classic does not retain duplicate gallery picker',
)
assert.match(
  classicScreen,
  /setGameSuiteDeckResolver/,
  'Classic supplies the same resolver to memory store',
)
assert.match(
  classicScreen,
  /resolveMemoryDungeonDeck\([\s\S]*?selection, needed, 0, \[\.\.\.runSeenImages\]/,
  'Classic resolves with a per-run exclusion list of previous floors',
)
assert.match(
  memoryCore,
  /if \(gameSuiteDeckResolver\)/,
  'Both Classic and RPG can resolve selected image pools',
)
assert.match(
  memoryCore,
  /new Set\(imagePaths\)\.size !== needed/,
  'Classic rejects duplicate card faces',
)

assert.match(mapScreen, /:data-progress="progressFor\(tile\.key\)"/)
assert.match(mapScreen, /progressLabel\(tile\.key\)/)
assert.match(mapScreen, /world\.chooseScene\(choice\.id\)/)
assert.match(worldStoreSource, /state\.value\.sceneChoices\[key\] = choice\.id/)
assert.match(worldStoreSource, /state\.value\.visited\.push\(key\)/)
assert.match(
  mapScreen,
  /world\.pickMapCard/,
  'Map cards must be matched, not single-click unveiled',
)
assert.match(
  mapScreen,
  /world\.nextWave/,
  'Player actively begins each subsequent reveal round',
)
assert.doesNotMatch(
  mapScreen,
  /world\.state\.frontier\.includes/,
  'Prototype single-click fog reveal is removed',
)

const sharedFlipCss = readFileSync('assets/css/memory-dungeon.css', 'utf8')
const combatBoard = readFileSync(
  'components/memory-dungeon/combat-board.vue',
  'utf8',
)
assert.match(
  worldStoreSource,
  /async function refreshMapDeck\(/,
  'Changing galleries must refresh the active map deck',
)
assert.match(
  worldStoreSource,
  /if \(previous !== currentDeckSignature\.value && mapMatching\.value\)/,
  'Deck selection changes must be applied immediately while matching',
)
assert.match(
  worldStoreSource,
  /state\.value\.mapCards[\s\S]*?\.filter\(\(card\) => !card\.matched\)/,
  'Refacing the board must preserve matched cards and revealed terrain',
)
assert.match(
  worldStoreSource,
  /state\.value\.mapDeckSignature = currentDeckSignature\.value/,
  'Successful deck loads must record the applied source',
)
assert.match(
  mapScreen,
  /world\.syncActiveMapDeck\(\)/,
  'Older saved maps automatically resync artwork on opening',
)
assert.match(
  mapScreen,
  /world\.mapDeckError/,
  'Failed custom-gallery loads must show a visible error',
)
assert.match(
  mapScreen,
  /role="dialog"/,
  'Settings float as a game panel instead of reducing map height',
)
assert.match(
  mapScreen,
  /md-card-inner/,
  'Map cards animate with the same flip vocabulary as Classic',
)
assert.match(combatBoard, /md-card-inner/, 'Combat cards animate the same way')
assert.match(
  sharedFlipCss,
  /transition: transform 0\.55s ease/,
  '3D flip retains Classic Match animation timing',
)

const selectorSource = readFileSync(
  'components/memory-dungeon/deck-selector.vue',
  'utf8',
)
const imageApiSource = readFileSync('server/api/art/memory-deck.get.ts', 'utf8')
const collectionPickerSource = readFileSync(
  'components/art/collection-picker.vue',
  'utf8',
)
assert.match(
  selectorSource,
  /selected\.family !== 'designed' && matureAvailable/,
  'Mature selection controls are completely hidden from guests, child roles, and mature-off users',
)
assert.match(selectorSource, /Non-mature only/)
assert.match(selectorSource, /Mature only/)
assert.doesNotMatch(
  selectorSource,
  /Include mature, public art/,
  'The old mixed-rating checkbox must not return',
)
assert.match(worldStoreSource, /userStore\.isLoggedIn/)
assert.match(worldStoreSource, /!userStore\.isChild/)
assert.match(
  worldStoreSource,
  /userStore\.showMature === true/,
  'Mature permission uses the restricted effective user-store preference',
)
assert.match(imageApiSource, /access\.isAuthenticated/)
assert.match(imageApiSource, /!access\.restricted/)
assert.match(
  imageApiSource,
  /\{ isMature: mature \}/,
  'Even forged API queries must be forced to a safe-only or mature-only rating',
)
assert.match(
  collectionPickerSource,
  /!userStore\.isChild/,
  'Memory collection index never asks for mature folders from child accounts',
)
assert.match(
  classicScreen,
  /Public mature only/,
  'Classic summary must not claim that mature mode mixes safe and mature artwork',
)

const consoleStage = readFileSync(
  'components/pages/memory-dungeon-overworld.vue',
  'utf8',
)

const houseScreen = readFileSync(
  'components/memory-dungeon/house-stage.vue',
  'utf8',
)
assert.match(consoleStage, /world\.state\.room === 'house'/)
assert.match(houseScreen, /data-testid="memory-house-console"/)
assert.match(houseScreen, /grid-cols-6 grid-rows-6/)
assert.match(houseScreen, /world\.houseMove\(item\.id\)/)
assert.match(houseScreen, /world\.chooseHouse\(choice\.id\)/)
assert.match(houseScreen, /memory-house-choice-column/)
assert.match(
  houseScreen,
  /artPath/,
  'Delivered ArtJob images are wired into the room stage',
)
assert.match(worldStoreSource, /house\.decisions\[house\.current\] = id/)
assert.match(worldStoreSource, /house\.chimeClaimed = true/)
assert.match(worldStoreSource, /finishHouseCombat\(houseOrigin\)/)
const generatedBacks = readFileSync('utils/memoryDungeonCardArt.ts', 'utf8')
assert.ok(
  generatedBacks.includes(
    '/images/memory-dungeon/card-backs/briar-default.webp',
  ),
)
assert.ok(
  generatedBacks.includes(
    '/images/memory-dungeon/card-backs/briar-arcane.webp',
  ),
)
assert.match(consoleStage, /memoryCardBackPath\(world\.cardBack\)/)
assert.match(consoleStage, /MEMORY_CARD_BACKS/)
assert.match(consoleStage, /world\.selectCardBack\(back\.id\)/)
assert.match(classicScreen, /DEFAULT_BRIAR_CARD_BACK/)
assert.match(consoleStage, /@error="hideMissingMemoryCardBack"/)
const choiceColumnStart = consoleStage.indexOf(
  'data-testid="memory-world-choice-column"',
)
const choiceActionsStart = consoleStage.indexOf(
  'class="md-encounter-actions',
  choiceColumnStart,
)
const mapErrorStart = consoleStage.indexOf(
  'v-if="world.mapDeckError"',
  choiceColumnStart,
)
assert.ok(
  choiceColumnStart >= 0 &&
    choiceActionsStart > choiceColumnStart &&
    choiceActionsStart < mapErrorStart,
  'Location decisions belong in the same narrative column as their description',
)
assert.ok(consoleStage.includes('overflow-y: auto;'))
assert.ok(consoleStage.includes('ring-[3px] ring-inset ring-cyan-50'))
assert.ok(consoleStage.includes('ring-[3px] ring-inset ring-amber-100'))

assert.match(
  consoleStage,
  /data-testid="memory-world-console-stage"/,
  'Overworld renders a dedicated, fully bounded console stage',
)
assert.match(
  consoleStage,
  /container: md-world \/ size/,
  'Map stage uses its actual available dimensions, not viewport height',
)
assert.match(
  consoleStage,
  /@container md-world \(min-width: 760px\)/,
  'Tablet landscape uses a two-column game layout independent of viewport breakpoint labels',
)
assert.match(
  consoleStage,
  /grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\)/,
  'Map and encounter split available landscape width equally',
)
assert.match(
  consoleStage,
  /width: min\(100cqw, 100cqh\)/,
  'Map fills its square viewport up to the available panel height',
)
assert.match(
  consoleStage,
  /class="md-scene-overview"/,
  'Encounter panel includes a prominent image and narrative',
)
assert.match(
  consoleStage,
  /world\.activeMapCard\.image/,
  'The selected picture is rendered at enlarged resolution in the encounter panel',
)
assert.match(
  consoleStage,
  /md-scene-status/,
  'Current map status lives alongside the enlarged picture',
)
assert.match(
  consoleStage,
  /backgroundSize: '800% 800%'/,
  'Exploration displays a closeup of the current map square',
)
assert.doesNotMatch(
  consoleStage,
  /kr-scroll min-h-0 w-full flex-1 overflow-y-auto/,
  'Gameplay location panel does not become a vertically scrolling webpage',
)
assert.match(
  consoleStage,
  /\.md-map-layout \{[\s\S]*?overflow: hidden/,
  'Entire game stage remains within the shell instead of scrolling',
)
assert.match(
  worldStoreSource,
  /const activeMapCard = computed\(/,
  'Current flipped card is published for full-scale memory preview',
)

const layoutVerifier = readFileSync(
  'utils/scripts/verifyLayoutContract.ts',
  'utf8',
)
assert.match(
  consoleStage,
  /data-layout="console-fixed"/,
  'Map explicitly opts into a bounded console instead of requiring scroll',
)
assert.match(
  layoutVerifier,
  /const fixedConsoleStage =/,
  'Global layout contract has an explicit bounded-console exception',
)
assert.match(
  layoutVerifier,
  /!fixedConsoleStage/,
  'Exception is restricted to named fixed consoles, not all pages',
)

const emptyCheckpoints = restoreMemorySaveSlots(null)
assert.equal(emptyCheckpoints.length, MEMORY_SAVE_SLOT_COUNT)
assert.ok(emptyCheckpoints.every((slot) => slot === null))
const checkpoint: MemoryCheckpoint = {
  version: 1,
  savedAt: '2026-10-27T08:46:26Z',
  briar: { ...newBriarSave(), attempts: 9 },
  dark: newDarkBriarProgress(),
  house: newDarkHouseProgress(),
  reality: {
    version: 1,
    active: 'e01',
    progress: newMemoryCampaignProgress(),
  },
  seals: newCrossMapSealChronicle(),
}
const invalidRealityCases = [
  [
    'missing completed history',
    { ...checkpoint.reality.progress, completed: undefined },
  ],
  [
    'missing wish ledger',
    { ...checkpoint.reality.progress, rememberedAnchors: null },
  ],
  [
    'invalid finale commitment',
    { ...checkpoint.reality.progress, finaleCommitted: 'yes' },
  ],
  [
    'duplicate completed experience',
    { ...checkpoint.reality.progress, completed: ['e01', 'e01'] },
  ],
  [
    'unknown experience',
    { ...checkpoint.reality.progress, completed: ['e99'] },
  ],
  [
    'unreachable future experience',
    { ...checkpoint.reality.progress, completed: ['e03'] },
  ],
  [
    'unearned wish',
    {
      ...checkpoint.reality.progress,
      rememberedAnchors: ['char-possible-future'],
    },
  ],
  [
    'premature finale commitment',
    { ...checkpoint.reality.progress, finaleCommitted: true },
  ],
] as const
for (const [reason, progress] of invalidRealityCases) {
  assert.equal(
    restoreMemoryCheckpoint({
      ...checkpoint,
      reality: { ...checkpoint.reality, progress },
    }),
    null,
    `A checkpoint with ${reason} must not silently discard campaign history`,
  )
}
assert.equal(
  restoreMemoryCheckpoint({
    ...checkpoint,
    reality: { ...checkpoint.reality, active: 'e02' },
  }),
  null,
  'A mirrored reality cannot be active before its original is completed',
)
const validMirroredReality = {
  ...checkpoint,
  reality: {
    ...checkpoint.reality,
    active: 'e02' as const,
    progress: {
      ...checkpoint.reality.progress,
      completed: ['e01' as const],
    },
  },
}
assert.deepEqual(
  restoreMemoryCheckpoint(validMirroredReality)?.reality,
  validMirroredReality.reality,
  'A legitimately unlocked mirrored reality remains loadable',
)
const isolatedRealitySlots = restoreMemorySaveSlots([
  { ...checkpoint, reality: { ...checkpoint.reality, progress: null } },
  validMirroredReality,
])
assert.equal(isolatedRealitySlots[0], null)
assert.deepEqual(
  isolatedRealitySlots[1]?.reality,
  validMirroredReality.reality,
  'A damaged campaign ledger cannot erase a neighboring checkpoint',
)
const firstCheckpoint = writeMemorySaveSlot(emptyCheckpoints, 0, checkpoint)
assert.ok(firstCheckpoint)
assert.equal(firstCheckpoint[0]?.briar.attempts, 9)
assert.equal(
  writeMemorySaveSlot(firstCheckpoint, 0, checkpoint),
  null,
  'An occupied slot cannot be silently overwritten',
)
assert.equal(writeMemorySaveSlot(firstCheckpoint, -1, checkpoint), null)
assert.equal(
  writeMemorySaveSlot(firstCheckpoint, MEMORY_SAVE_SLOT_COUNT, checkpoint),
  null,
)
const replacedCheckpoint = writeMemorySaveSlot(
  firstCheckpoint,
  0,
  { ...checkpoint, briar: { ...checkpoint.briar, attempts: 12 } },
  true,
)
assert.equal(replacedCheckpoint?.[0]?.briar.attempts, 12)
assert.equal(firstCheckpoint[0]?.briar.attempts, 9)
assert.equal(replacedCheckpoint?.[1], null)
assert.equal(
  restoreMemorySaveSlots(JSON.parse(JSON.stringify(replacedCheckpoint)))[0]
    ?.briar.attempts,
  12,
)
assert.equal(
  restoreMemoryCheckpoint({ ...checkpoint, house: null }),
  null,
  'A corrupt snapshot cannot replace a valid current expedition',
)
assert.equal(
  restoreMemoryCheckpoint({
    ...checkpoint,
    reality: { ...checkpoint.reality, version: 99 },
  }),
  null,
)
assert.equal(
  restoreMemoryCheckpoint({ ...checkpoint, savedAt: 'not a date' }),
  null,
)
const completeSealCheckpoint = {
  ...checkpoint,
  seals: {
    ...checkpoint.seals,
    seen: ['5,2'],
    inspected: ['5,2'],
    mirrorSeen: ['5,2'],
    counterpartSeen: ['5,2'],
    matched: ['5,2'],
    resolved: ['5,2'],
  },
}
assert.deepEqual(
  restoreMemoryCheckpoint(completeSealCheckpoint)?.seals,
  completeSealCheckpoint.seals,
  'A legitimate cross-world seal sequence survives checkpoint loading intact',
)
const damagedSealCases = [
  [
    'missing inspected ledger',
    { ...completeSealCheckpoint.seals, inspected: undefined },
  ],
  [
    'missing counterpart ledger',
    { ...completeSealCheckpoint.seals, counterpartSeen: null },
  ],
  [
    'unknown coordinate',
    { ...completeSealCheckpoint.seals, seen: ['5,2', '0,0'] },
  ],
  [
    'duplicate discovery',
    { ...completeSealCheckpoint.seals, seen: ['5,2', '5,2'] },
  ],
  [
    'inspection without discovery',
    { ...completeSealCheckpoint.seals, seen: [], mirrorSeen: [] },
  ],
  [
    'mirror inspection without discovery',
    { ...completeSealCheckpoint.seals, mirrorSeen: ['8,8'] },
  ],
  [
    'match without original inspection',
    { ...completeSealCheckpoint.seals, inspected: [] },
  ],
  [
    'match without counterpart visit',
    { ...completeSealCheckpoint.seals, counterpartSeen: [] },
  ],
  [
    'resolution without match',
    { ...completeSealCheckpoint.seals, matched: [] },
  ],
  [
    'invalid resolution key',
    { ...completeSealCheckpoint.seals, resolved: [null] },
  ],
] as const
for (const [reason, seals] of damagedSealCases) {
  assert.equal(
    restoreMemoryCheckpoint({ ...checkpoint, seals }),
    null,
    `A checkpoint with ${reason} must not silently rewrite cross-world seal progress`,
  )
}
const isolatedSealSlots = restoreMemorySaveSlots([
  { ...checkpoint, seals: damagedSealCases[0]![1] },
  completeSealCheckpoint,
])
assert.equal(isolatedSealSlots[0], null)
assert.deepEqual(
  isolatedSealSlots[1]?.seals,
  completeSealCheckpoint.seals,
  'A damaged seal ledger cannot erase a neighboring valid checkpoint',
)
const damagedHouseCases = [
  ['missing decisions', { ...checkpoint.house, decisions: null }],
  ['invalid active state', { ...checkpoint.house, active: 'yes' }],
  ['invalid current room', { ...checkpoint.house, current: null }],
  ['invalid visited room', { ...checkpoint.house, visited: ['HD-01', null] }],
  ['missing trials', { ...checkpoint.house, trials: null }],
  ['missing puzzles', { ...checkpoint.house, puzzles: null }],
  ['negative spent echoes', { ...checkpoint.house, spentEchoes: -1 }],
  [
    'malformed matching trial',
    {
      ...checkpoint.house,
      trials: {
        'HD-09': {
          matched: null,
          faceUp: [],
          failures: 0,
          clue: null,
          note: '',
        },
      },
    },
  ],
  [
    'malformed logic puzzle',
    {
      ...checkpoint.house,
      puzzles: {
        'HD-13': { solved: true, wrong: [null], hint: false, note: '' },
      },
    },
  ],
] as const
for (const [reason, house] of damagedHouseCases) {
  assert.equal(
    restoreMemoryCheckpoint({ ...checkpoint, house }),
    null,
    `A checkpoint with ${reason} must not silently erase mirrored House progress`,
  )
}
const damagedHouseSlots = restoreMemorySaveSlots([
  { ...checkpoint, house: damagedHouseCases[0]![1] },
  checkpoint,
])
assert.equal(damagedHouseSlots[0], null)
assert.equal(
  damagedHouseSlots[1]?.briar.attempts,
  9,
  'Corrupt House progress in one slot cannot damage a neighboring expedition',
)
assert.ok(
  restoreMemoryCheckpoint({
    ...checkpoint,
    house: {
      ...checkpoint.house,
      trials: {
        'HD-09': {
          matched: [],
          faceUp: ['HD-09-a'],
          failures: 1,
          clue: null,
          note: 'One picture is exposed.',
        },
      },
      puzzles: {
        'HD-13': {
          solved: false,
          wrong: ['incorrect'],
          hint: true,
          note: 'A clue was earned.',
        },
      },
    },
  }),
  'A valid interrupted mirrored House trial and earned clue remain saveable',
)
const malformedBriarMapDeck = {
  ...checkpoint,
  briar: { ...checkpoint.briar, mapCards: [null] },
}
const malformedBriarFightDeck = {
  ...checkpoint,
  briar: { ...checkpoint.briar, cards: [null] },
}
assert.equal(
  restoreMemoryCheckpoint(malformedBriarMapDeck),
  null,
  'A damaged original Briar map deck must not silently erase a checkpoint wave',
)
assert.equal(
  restoreMemoryCheckpoint(malformedBriarFightDeck),
  null,
  'A damaged original Briar combat deck must not silently erase an active fight',
)
assert.equal(
  restoreMemoryCheckpoint({
    ...checkpoint,
    briar: {
      ...checkpoint.briar,
      mapCards: [
        {
          id: 1,
          pairId: 1,
          tile: '1,4',
          image: '/memory-test.webp',
          flipped: true,
          matched: false,
        },
      ],
    },
  })?.briar.mapCards[0]?.flipped,
  true,
  'A valid interrupted first flip remains eligible for checkpoint restoration',
)
const isolatedBriarCheckpoints = restoreMemorySaveSlots([
  malformedBriarMapDeck,
  malformedBriarFightDeck,
  checkpoint,
])
assert.equal(isolatedBriarCheckpoints[0], null)
assert.equal(isolatedBriarCheckpoints[1], null)
assert.equal(isolatedBriarCheckpoints[2]?.briar.attempts, 9)
const malformedDarkDeck = {
  ...checkpoint,
  dark: {
    ...checkpoint.dark,
    mapCards: Array.from({ length: DARK_BRIAR_WAVES[0]!.length }, () => null),
  },
}
assert.equal(
  restoreMemoryCheckpoint(malformedDarkDeck),
  null,
  'A malformed nested Dark Briar deck cannot replace the current expedition',
)
const mixedCheckpoints = restoreMemorySaveSlots([malformedDarkDeck, checkpoint])
assert.equal(mixedCheckpoints[0], null)
assert.equal(mixedCheckpoints[1]?.briar.attempts, 9)
assert.doesNotThrow(
  () => restoreDarkBriarProgress(malformedDarkDeck.dark),
  'An interrupted or damaged mirrored deck must never crash autosave recovery',
)
assert.deepEqual(restoreDarkBriarProgress(malformedDarkDeck.dark).mapCards, [])
assert.match(
  worldStoreSource,
  /roomEpoch\+\+[\s\S]*?darkEpoch\+\+[\s\S]*?state\.value = resumedRoom\.progress/,
  'Loading a slot invalidates pending map and mirrored animation callbacks',
)
assert.match(
  worldStoreSource,
  /syncEarthChronicle\(\)/,
  'Checkpoint restoration reconciles rather than deletes earned Chronicle memories',
)
assert.match(
  consoleStage,
  /v-for="\(checkpoint, index\) in world\.saveSlots"/,
  'All three checkpoint slots are visible in the bounded console settings',
)
assert.match(
  consoleStage,
  /window\.confirm\([\s\S]*?Replace checkpoint/,
  'Overwriting a slot requires explicit confirmation',
)
assert.match(
  consoleStage,
  /window\.confirm\([\s\S]*?Load checkpoint/,
  'Loading a slot warns before replacing the current autosave',
)

const combatForDefeat = startCombatRoom(
  'sprite',
  91,
  Array.from({ length: 8 }, (_, index) => `/memory-test-${index}.webp`),
)
const defeatedBriar = {
  ...newBriarSave(),
  room: 'memory' as const,
  roomId: 'sprite' as const,
  hearts: 2,
  combat: {
    ...combatForDefeat,
    state: {
      ...combatForDefeat.state,
      playerHp: 0,
      outcome: 'defeat' as const,
    },
  },
}
const interruptedDefeat = restoreBriarSave(defeatedBriar)
assert.equal(interruptedDefeat.combat?.state.outcome, 'defeat')
const resumedDefeat = recoverBriarCombatDefeat(interruptedDefeat)
assert.equal(resumedDefeat.room, 'map')
assert.equal(resumedDefeat.combat, null)
assert.equal(resumedDefeat.hearts, 1)
assert.equal(resumedDefeat.roomId, null)
assert.match(resumedDefeat.status, /One heart lost/)
assert.deepEqual(
  recoverBriarCombatDefeat(restoreBriarSave(resumedDefeat)),
  resumedDefeat,
  'Reloading a settled defeat cannot charge a second heart',
)
const lastHeartDefeat = recoverBriarCombatDefeat(
  restoreBriarSave({ ...defeatedBriar, hearts: 1 }),
)
assert.equal(lastHeartDefeat.hearts, 3)
assert.equal(lastHeartDefeat.player, BRIAR_START)
assert.equal(lastHeartDefeat.room, 'map')
assert.match(lastHeartDefeat.status, /retreat to Briar Camp/)
const houseDefeat = recoverBriarCombatDefeat(
  restoreBriarSave({
    ...defeatedBriar,
    hearts: 2,
    house: {
      ...newHouseProgress(),
      current: 'HD-09',
      visited: ['HD-01', 'HD-09'],
      combatOrigin: 'HD-09',
    },
  }),
)
assert.equal(houseDefeat.room, 'house')
assert.equal(houseDefeat.house?.current, 'HD-18')
assert.equal(houseDefeat.house?.combatOrigin, null)
assert.equal(
  houseDefeat.house?.visited.filter((id) => id === 'HD-18').length,
  1,
)
assert.equal(houseDefeat.hearts, 1)
assert.match(houseDefeat.status, /House's quiet bedchamber/)
assert.deepEqual(
  recoverBriarCombatDefeat(restoreBriarSave(houseDefeat)),
  houseDefeat,
  'A recovered House retreat stays in the House without duplicate damage',
)
const victoryBriar = restoreBriarSave({
  ...defeatedBriar,
  combat: {
    ...combatForDefeat,
    state: { ...combatForDefeat.state, outcome: 'victory' },
  },
})
assert.equal(
  recoverBriarCombatDefeat(victoryBriar),
  victoryBriar,
  'An interrupted victory must remain claimable instead of being treated as defeat',
)
const activeBriar = restoreBriarSave({
  ...defeatedBriar,
  combat: combatForDefeat,
})
assert.equal(recoverBriarCombatDefeat(activeBriar), activeBriar)
assert.ok(
  restoreMemoryCheckpoint({ ...checkpoint, briar: defeatedBriar }),
  'A valid checkpoint captured during the defeat animation can be recovered',
)
assert.match(
  worldStoreSource,
  /const recoveredCombat = recoverBriarCombatDefeat\(resumed\.progress\)/,
  'Both checkpoint loading and autosave hydration settle interrupted defeats',
)
assert.equal(
  (
    worldStoreSource.match(/recoverBriarCombatDefeat\(resumed\.progress\)/g) ??
    []
  ).length,
  2,
  'Both restoration entry points must use the same idempotent combat recovery',
)

const chamberCards = [
  { id: 0, pairId: 0, image: '/pair-a.webp', matched: false, flipped: true },
  { id: 1, pairId: 0, image: '/pair-a.webp', matched: false, flipped: false },
  { id: 2, pairId: 1, image: '/pair-b.webp', matched: false, flipped: false },
  { id: 3, pairId: 1, image: '/pair-b.webp', matched: false, flipped: false },
]
const firstChamberFlip = {
  ...newBriarSave(),
  room: 'memory' as const,
  roomId: 'vault-1' as const,
  cards: chamberCards,
}
const normalizedChamber = restoreBriarSave(firstChamberFlip)
assert.equal(normalizedChamber.cards[0]?.flipped, false)
const recoveredChamber = recoverBriarRoomFirstFlip(
  normalizedChamber,
  firstChamberFlip,
)
assert.equal(recoveredChamber.firstCard, 0, 'Card zero must survive reload')
assert.equal(recoveredChamber.progress.cards[0]?.flipped, true)
assert.equal(
  recoveredChamber.progress.cards.filter((card) => card.flipped).length,
  1,
)
assert.equal(recoveredChamber.progress.attempts, 0)
assert.equal(recoveredChamber.progress.hearts, 3)
assert.equal(
  recoverBriarRoomFirstFlip(
    restoreBriarSave(recoveredChamber.progress),
    recoveredChamber.progress,
  ).firstCard,
  0,
  'Repeated reloads retain one selected picture without charging a turn',
)
assert.equal(
  recoverBriarRoomFirstFlip(
    restoreBriarSave({
      ...firstChamberFlip,
      cards: chamberCards.map((card) => ({
        ...card,
        flipped: card.id === 0 || card.id === 2,
      })),
    }),
    {
      ...firstChamberFlip,
      cards: chamberCards.map((card) => ({
        ...card,
        flipped: card.id === 0 || card.id === 2,
      })),
    },
  ).firstCard,
  null,
  'A pending mismatch must not restore multiple exposed pictures',
)
assert.equal(
  recoverBriarRoomFirstFlip(restoreBriarSave(firstChamberFlip), {
    ...firstChamberFlip,
    cards: chamberCards.map((card) =>
      card.id === 0 ? { ...card, image: '/forged.webp' } : card,
    ),
  }).firstCard,
  null,
  'A changed picture identity cannot revive an interrupted first flip',
)
assert.equal(
  recoverBriarRoomFirstFlip(restoreBriarSave(firstChamberFlip), {
    ...firstChamberFlip,
    cards: chamberCards.map((card) =>
      card.id === 1 ? { ...card, image: '/forged.webp' } : card,
    ),
  }).firstCard,
  null,
  'A corrupted partner picture cannot turn a preview into a valid pair',
)
assert.equal(
  recoverBriarRoomFirstFlip(
    restoreBriarSave({ ...firstChamberFlip, room: 'map' }),
    firstChamberFlip,
  ).firstCard,
  null,
  'Chamber selections never leak into the overworld matching screen',
)
assert.ok(
  restoreMemoryCheckpoint({ ...checkpoint, briar: firstChamberFlip }),
  'Manual checkpoints preserve a valid pending chamber selection',
)
assert.match(
  worldStoreSource,
  /const resumedRoom = recoverBriarRoomFirstFlip\(\s*recoveredRoom,\s*checkpoint\.briar,\s*\)/,
  'Checkpoint loading restores the selected chamber card',
)
assert.match(
  worldStoreSource,
  /const resumedRoom = recoverBriarRoomFirstFlip\(recoveredRoom, raw\)/,
  'Autosave hydration restores the same selected chamber card',
)
assert.equal(
  (worldStoreSource.match(/firstCard\.value = resumedRoom\.firstCard/g) ?? [])
    .length,
  2,
  'Both restoration paths reconnect the recovered selection to the next click',
)

const interruptedThirdMissRoom = {
  ...saved,
  hearts: 2,
  roomMisses: 3,
  attempts: 3,
  cards: [
    { id: 0, pairId: 0, image: '/ok.jpg', matched: false, flipped: true },
    { id: 1, pairId: 1, image: '/other.jpg', matched: false, flipped: true },
  ],
}
const interruptedThirdMiss = restoreBriarSave(interruptedThirdMissRoom)
assert.equal(interruptedThirdMiss.roomMisses, 3)
assert.equal(
  interruptedThirdMiss.cards.every((card) => !card.flipped),
  true,
)
const recoveredThirdMiss = recoverBriarRoomMissPenalty(interruptedThirdMiss)
assert.equal(recoveredThirdMiss.room, 'memory')
assert.equal(recoveredThirdMiss.hearts, 1)
assert.equal(recoveredThirdMiss.roomMisses, 0)
assert.equal(recoveredThirdMiss.attempts, 3)
assert.match(recoveredThirdMiss.status, /One heart lost/)
assert.deepEqual(
  recoverBriarRoomMissPenalty(restoreBriarSave(recoveredThirdMiss)),
  recoveredThirdMiss,
  'Reloading after a third missed pair cannot charge a second heart',
)
const pendingSecondMiss = restoreBriarSave({
  ...interruptedThirdMissRoom,
  roomMisses: 2,
})
assert.equal(
  recoverBriarRoomMissPenalty(pendingSecondMiss),
  pendingSecondMiss,
  'Earlier misses do not incur a premature penalty',
)
const lastHeartRoomMiss = recoverBriarRoomMissPenalty(
  restoreBriarSave({ ...interruptedThirdMissRoom, hearts: 1 }),
)
assert.equal(lastHeartRoomMiss.room, 'map')
assert.equal(lastHeartRoomMiss.hearts, 3)
assert.equal(lastHeartRoomMiss.player, BRIAR_START)
assert.equal(lastHeartRoomMiss.roomId, null)
assert.equal(lastHeartRoomMiss.cards.length, 0)
assert.match(lastHeartRoomMiss.status, /retreat to Briar Camp/)
const houseThirdMiss = recoverBriarRoomMissPenalty(
  restoreBriarSave({
    ...interruptedThirdMissRoom,
    hearts: 1,
    house: {
      ...newHouseProgress(),
      current: 'HD-19',
      visited: ['HD-01', 'HD-19'],
      combatOrigin: 'HD-19',
    },
  }),
)
assert.equal(houseThirdMiss.room, 'house')
assert.equal(houseThirdMiss.house?.current, 'HD-18')
assert.equal(houseThirdMiss.house?.combatOrigin, null)
assert.equal(houseThirdMiss.hearts, 3)
assert.match(houseThirdMiss.status, /quiet bedchamber/)
const restoredHouseThirdMiss = restoreBriarSave(houseThirdMiss)
assert.equal(
  recoverBriarRoomMissPenalty(restoredHouseThirdMiss),
  restoredHouseThirdMiss,
  'A settled House retreat cannot be charged again after restoration',
)
assert.ok(
  restoreMemoryCheckpoint({
    ...checkpoint,
    briar: interruptedThirdMissRoom,
  }),
  'A valid manual checkpoint captured during a third miss can be recovered',
)
assert.equal(
  (
    worldStoreSource.match(/recoverBriarRoomMissPenalty\(recoveredCombat\)/g) ??
    []
  ).length,
  2,
  'Autosave hydration and manual checkpoint loading both settle missed-room penalties',
)
