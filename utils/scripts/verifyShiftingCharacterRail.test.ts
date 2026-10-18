import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { activeFiveLandEncounter } from '../shiftingLands/authoredFiveLands'
import { reachableLocations } from '../shiftingLands/journey'
import {
  canUseJourneyReward,
  journeyCharacterSheet,
} from '../shiftingLands/progression'
import {
  newJourneyLedgerV5,
  restoreJourneyLedgerV5,
  stepJourneyLedgerV5,
} from '../shiftingLands/saveLedgerV5'

const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')
const board = read('../../components/shifting-lands-journey-board.vue')
const rail = read('../../components/shifting-lands-character-rail.vue')
const store = read('../../stores/shiftingLandsJourneyStore.ts')
const workflow = read('../../.github/workflows/shifting-lands-gameplay.yml')
const preferences = read('../shiftingLands/presentationPreferences.ts')
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

// The compact, image-forward rail must be grounded in the replay-verified
// character sheet and dispatch the *existing* USE_REWARD action. Never add a
// second local wallet, an invented companion, or client-computed dice effects.
assert.match(board, /<ShiftingLandsCharacterRail/)
assert.match(board, /:sheet="game\.characterSheet"/)
assert.match(board, /:seed="game\.state\.seed"/)
assert.match(board, /@use-reward="useEarnedReward"/)
assert.match(board, /game\.useReward\(id\)/)
assert.match(rail, /defineProps<\{/)
assert.match(rail, /sheet: JourneyCharacterSheet/)
assert.match(rail, /canUseJourneyReward\(props\.sheet, id\)/)
assert.match(rail, /:disabled="!canUse\(item\.id\)"/)
assert.match(rail, /\$emit\('useReward', item\.id\)/)
assert.match(rail, /item\.kind !== 'evidence'/)
assert.match(
  rail,
  /contact\.traveling\s*\?\s*'Traveling companion'\s*:\s*'Contact · not traveling'/,
)
assert.match(rail, /No established contacts yet/)
assert.match(rail, /Already used/)
assert.match(rail, /props\.sheet\.hp >= props\.sheet\.maxHp/)
assert.match(rail, /props\.sheet\.provisions >= 30/)
assert.doesNotMatch(
  rail,
  /(?:Math\.random|useFetch|fetch\(|localStorage|\$fetch)/,
)
assert.match(
  store,
  /v6CharacterSheet\(ledger\.value\.current, ledger\.value\.usedRewards\)/,
)
assert.match(workflow, /verifyShiftingCharacterRail\.test\.ts/)

// Display-only settings cannot alter the ledger or import gameplay rules.
// Muting never blocks choices or changes the seeded RNG. Motion settings
// respect system preferences, and audio requires a user-initiated roll.
assert.match(
  preferences,
  /PRESENTATION_KEY = 'kr\.shiftingLands\.presentation\.v1'/,
)
assert.match(
  preferences,
  /window\.matchMedia\(\s*'\(prefers-reduced-motion: reduce\)',?\s*\)/,
)
assert.match(board, /readShiftingLandsPresentation\(\)/)
assert.match(board, /writeShiftingLandsPresentation\(\{/)
assert.doesNotMatch(board, /\b(?:localStorage|\$fetch|fetch\()\b/)
assert.match(board, /:duration-ms="reducedMotion \? 0 : 650"/)
assert.match(board, /:aria-pressed="!reducedMotion"/)
assert.match(board, /:aria-pressed="soundEnabled"/)
assert.match(board, /:key="rollEffectKey"/)
assert.match(
  board,
  /if \(!soundEnabled\.value \|\| !import\.meta\.client\) return/,
)
assert.match(board, /oscillator\.start\(\)/)
assert.match(board, /@media \(prefers-reduced-motion: reduce\)/)
assert.match(board, /const visibleJournal = computed\(/)
assert.match(
  board,
  /journalFilter\.value === 'all' \|\| item\.kind === journalFilter\.value/,
)
assert.match(board, /aria-label="Journal filters"/)
assert.match(board, /v-for="\(item, index\) in visibleJournal"/)
assert.doesNotMatch(
  board,
  /game\.ledger\.actions\.push|game\.state\.rngState\s*=/,
)

// Exercise a real earned item through V5 action replay rather than injecting
// fictitious source outcomes into the board's reactive state.
let earned: ReturnType<typeof newJourneyLedgerV5> | null = null
for (let seed = 1; seed <= 750 && !earned; seed++) {
  let run = newJourneyLedgerV5(seed)
  for (let step = 0; step < 3; step++) {
    const nextId = reachableLocations(run.current.journey).find(
      (id) =>
        !run.current.journey.resolved.some(
          (result) => result.locationId === id,
        ),
    )
    if (!nextId) break
    const traveled = stepJourneyLedgerV5(run, {
      type: 'TRAVEL',
      locationId: nextId,
    })
    if (traveled === run) break
    run = traveled
    const card = activeFiveLandEncounter(run.current)
    assert.ok(card)
    const choice =
      card!.id === 'scarecrows-lantern'
        ? card!.choices.find((option) => option.id === 'cut-the-line')!
        : card!.choices[0]!
    run = stepJourneyLedgerV5(run, { type: 'CHOOSE', choiceId: choice.id })
    if (
      journeyCharacterSheet(run.current, run.usedRewards).inventory.some(
        (item) => item.id === 'recovered-rations' && item.available,
      )
    ) {
      earned = run
      break
    }
  }
}
assert.ok(earned, 'a real seeded route must earn the ration reward')
const sheet = journeyCharacterSheet(earned!.current, earned!.usedRewards)
assert.equal(canUseJourneyReward(sheet, 'recovered-rations'), true)
assert.equal(canUseJourneyReward(sheet, 'unearned-weapon'), false)
assert.equal(canUseJourneyReward(sheet, 'ribbon-evidence'), false)
const used = stepJourneyLedgerV5(earned!, {
  type: 'USE_REWARD',
  rewardId: 'recovered-rations',
})
assert.notStrictEqual(used, earned)
assert.equal(
  used.current.journey.provisions,
  Math.min(30, earned!.current.journey.provisions + 2),
)
assert.deepEqual(used.usedRewards, ['recovered-rations'])
assert.equal(
  journeyCharacterSheet(used.current, used.usedRewards).inventory.find(
    (item) => item.id === 'recovered-rations',
  )?.available,
  false,
)
assert.strictEqual(
  stepJourneyLedgerV5(used, {
    type: 'USE_REWARD',
    rewardId: 'recovered-rations',
  }),
  used,
  'one-use items are idempotent on repeated button taps',
)
assert.deepEqual(restoreJourneyLedgerV5(clone(used)), used)
assert.equal(
  restoreJourneyLedgerV5({ ...used, usedRewards: [] }),
  null,
  'tampering with persisted inventory is rejected by replay',
)
console.log(
  'Character rail contract passed: read-only progression, sound and motion controls, journal filters and V5 one-use inventory replay',
)
