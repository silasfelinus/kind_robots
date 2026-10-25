import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { BRIAR_CROSS_MAP_KEYS, BRIAR_REVEAL_WAVES } from '../memoryDungeonWaves'
import {
  FIRST_MAP_SEAL_RECOVERY,
  crossMapSealProgress,
  inspectCrossMapSeal,
  missingFirstMapSeals,
  newCrossMapSealChronicle,
  restoreCrossMapSealChronicle,
  firstMapRecoveryComplete,
} from '../memoryDungeon/crossMapSealChronicle'
import {
  DARK_BRIAR_ENCOUNTER_KEYS,
  DARK_BRIAR_KEYS,
  DARK_BRIAR_SEALS,
  DARK_BRIAR_SCENES,
  DARK_BRIAR_WAVES,
  DARK_BRIAR_WITNESSES,
  darkBriarHasWitness,
  darkBriarInspectSeal,
  newDarkBriarProgress,
  restoreDarkBriarProgress,
} from '../memoryDungeon/darkBriar'

const sealKeys = [...BRIAR_CROSS_MAP_KEYS]
assert.equal(sealKeys.length, 4)
assert.deepEqual(
  BRIAR_REVEAL_WAVES.map((wave) => wave.length),
  [12, 14, 16, 18],
)
assert.equal(new Set(BRIAR_REVEAL_WAVES.flat()).size, 60)
for (const seal of sealKeys) {
  assert.equal(BRIAR_REVEAL_WAVES.flat().includes(seal), false)
  assert.equal(
    DARK_BRIAR_SCENES[seal],
    undefined,
    'Reserved sigils cannot be normal Dark encounters',
  )
  assert.ok(
    DARK_BRIAR_SEALS[seal]?.hint,
    'Mirrored seal retains its own authored clue',
  )
  assert.ok(FIRST_MAP_SEAL_RECOVERY[seal].earthClue.length >= 50)
  assert.ok(FIRST_MAP_SEAL_RECOVERY[seal].alteredEarthClue.length >= 50)
}
assert.equal(DARK_BRIAR_ENCOUNTER_KEYS.length, 60)
assert.equal(DARK_BRIAR_KEYS.length, 64)
assert.deepEqual(new Set(DARK_BRIAR_KEYS), new Set(DARK_BRIAR_WAVES.flat()))
assert.deepEqual(
  new Set([...DARK_BRIAR_ENCOUNTER_KEYS, ...sealKeys]),
  new Set(DARK_BRIAR_KEYS),
)
assert.equal(DARK_BRIAR_WITNESSES.length, 8)
assert.ok(
  DARK_BRIAR_WITNESSES.every(
    (key) => !sealKeys.includes(key as (typeof sealKeys)[number]),
  ),
)
assert.ok(DARK_BRIAR_WITNESSES.includes('5,3'))
assert.ok(!(DARK_BRIAR_WITNESSES as readonly string[]).includes('5,2'))

const initial = newCrossMapSealChronicle()
assert.deepEqual(crossMapSealProgress(initial), {
  identified: 0,
  originalInspected: 0,
  reflected: 0,
  matched: 0,
  resolved: 0,
  total: 4,
})
assert.equal(firstMapRecoveryComplete(initial), false)
assert.equal(missingFirstMapSeals(initial).length, 4)
assert.equal(inspectCrossMapSeal(initial, '0,0', 'e01'), initial)
let journal = inspectCrossMapSeal(initial, '5,2', 'e02')
assert.deepEqual(journal.seen, ['5,2'])
assert.deepEqual(journal.mirrorSeen, ['5,2'])
assert.deepEqual(
  journal.inspected,
  [],
  'Mirror inspection is not the original inspection',
)
assert.equal(firstMapRecoveryComplete(journal), false)
journal = inspectCrossMapSeal(journal, '5,2', 'e01')
assert.deepEqual(journal.inspected, ['5,2'])
assert.equal(
  journal.matched.length,
  0,
  'Neither early inspection solves the late cross-world puzzle',
)
for (const key of sealKeys) journal = inspectCrossMapSeal(journal, key, 'e01')
assert.equal(journal.inspected.length, 4)
assert.equal(firstMapRecoveryComplete(journal), true)
assert.equal(journal.matched.length, 0)
assert.deepEqual(missingFirstMapSeals(journal), [])
assert.deepEqual(
  restoreCrossMapSealChronicle(JSON.parse(JSON.stringify(journal))),
  journal,
)

const untrusted = restoreCrossMapSealChronicle({
  seen: ['0,0', '5,2', '5,2'],
  inspected: ['8,8'],
  mirrorSeen: ['8,1', 7],
  counterpartSeen: ['5,2'],
  matched: ['5,2', '8,8'],
  resolved: ['5,2'],
})
assert.deepEqual(untrusted.seen, ['5,2', '8,8', '8,1'])
assert.deepEqual(untrusted.inspected, ['8,8'])
assert.deepEqual(
  untrusted.matched,
  [],
  'Future match requires both first seal and counterpart',
)
assert.deepEqual(untrusted.resolved, [])

const first = newDarkBriarProgress()
assert.equal(first.version, 3)
const firstCards = DARK_BRIAR_WAVES[0]!.map((tile, i) => ({
  id: i,
  pairId: Math.floor(i / 2),
  image: 'pair-' + Math.floor(i / 2),
  tile,
  flipped: true,
  matched: true,
}))
const revealed = restoreDarkBriarProgress({
  ...first,
  phase: 'exploring',
  mapCards: firstCards,
  revealed: [...DARK_BRIAR_WAVES[0]!],
  visited: [...DARK_BRIAR_WAVES[0]!],
})
const sigilProgress = { ...revealed, player: '5,2' }
const recorded = darkBriarInspectSeal(sigilProgress, '5,2')
assert.deepEqual(recorded.sealInspections, ['5,2'])
assert.equal(darkBriarInspectSeal(recorded, '5,2'), recorded)
assert.equal(
  darkBriarInspectSeal({ ...sigilProgress, phase: 'matching' }, '5,2')
    .sealInspections.length,
  0,
)
assert.deepEqual(
  restoreDarkBriarProgress(JSON.parse(JSON.stringify(recorded)))
    .sealInspections,
  ['5,2'],
)
const previousWitness = restoreDarkBriarProgress({
  ...revealed,
  version: 2,
  sceneChoices: { '5,2': 'shield' },
})
assert.equal(darkBriarHasWitness(previousWitness, '5,3'), true)
assert.equal(previousWitness.sceneChoices['5,2'], 'shield')
assert.ok(!DARK_BRIAR_SCENES['5,2'])
assert.deepEqual(previousWitness.sealInspections, [])
const wrongChoice = restoreDarkBriarProgress({
  ...revealed,
  version: 2,
  sceneChoices: { '5,2': 'invented' },
})
assert.equal(darkBriarHasWitness(wrongChoice, '5,3'), false)

const store = readFileSync('stores/memoryWorldStore.ts', 'utf8')
const original = readFileSync(
  'components/pages/memory-dungeon-overworld.vue',
  'utf8',
)
const mirror = readFileSync(
  'components/memory-dungeon/dark-briar-stage.vue',
  'utf8',
)
assert.ok(original.includes('world.examineCrossMapSigil(tile.key)'))
assert.ok(store.includes('CROSS_MAP_SEALS_KEY'))
assert.ok(
  store.includes("inspectCrossMapSeal(crossMapSeals.value, key, 'e01')"),
)
assert.ok(
  store.includes("inspectCrossMapSeal(crossMapSeals.value, key, 'e02')"),
)
assert.ok(mirror.includes('data-testid="dark-briar-inspect-seal"'))
assert.ok(mirror.includes('world.darkInspectSeal(world.dark.player)'))
assert.ok(mirror.includes('decisions}/60 encounters'))
console.log(
  '60 encounter + 4 seal contracts, 4 original map recovery milestones, legacy witnesses and independent Chronicle pass',
)
