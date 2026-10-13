import assert from 'node:assert/strict'
import { DAY_ONE_BRIEFINGS, DAY_ONE_INCIDENTS } from '../emperorOfDust/dayOne'
import {
  advanceClock,
  dispatchFollowers,
  previewDispatch,
  timeAt,
} from '../emperorOfDust/engine'
import {
  earnStoryFlag,
  startEmperorCampaign,
} from '../emperorOfDust/progression'
import {
  acquireRelic,
  chooseNextLoadout,
  decodeRelicVault,
  earnSecondSlot,
  emptyRelicVault,
  encodeRelicVault,
  equipped,
  revealFalseReport,
  startWithRelics,
} from '../emperorOfDust/relics'
import { decodeEmperorSave, encodeEmperorSave } from '../emperorOfDust/save'

const start = startEmperorCampaign(1099)
const empty = emptyRelicVault()
assert.deepEqual(empty.owned, [])
assert.equal(empty.slots, 1)
assert.equal(revealFalseReport(start, false), false, 'no Day 1 free eye')
assert.throws(() => acquireRelic(empty, start, 'eye-of-elder-crow'), /earned/)
assert.throws(
  () => chooseNextLoadout(empty, ['eye-of-elder-crow']),
  /collected/,
)

const awardedEye = earnStoryFlag(
  advanceClock(start, timeAt(16, 7)),
  'relic-eye-earned',
)
const eyeVault = acquireRelic(empty, awardedEye, 'eye-of-elder-crow')
assert.deepEqual(eyeVault.owned, ['eye-of-elder-crow'])
assert.deepEqual(empty.owned, [], 'vault changes are immutable')
assert.throws(
  () => acquireRelic(eyeVault, awardedEye, 'eye-of-elder-crow'),
  /Already/,
)
assert.deepEqual(decodeRelicVault(encodeRelicVault(eyeVault)), eyeVault)
assert.equal(decodeRelicVault('not json'), null)
assert.equal(
  decodeRelicVault(
    '{"version":1,"owned":["unknown"],"nextLoadout":[],"slots":1}',
  ),
  null,
)
assert.equal(
  decodeRelicVault(
    JSON.stringify({
      version: 1,
      owned: ['eye-of-elder-crow'],
      nextLoadout: ['eye-of-elder-crow', 'eye-of-elder-crow'],
      slots: 2,
    }),
  ),
  null,
  'no duplicate relic loadout',
)

const selectedEye = chooseNextLoadout(eyeVault, ['eye-of-elder-crow'])
const eyeRun = startWithRelics(2000, selectedEye)
assert.deepEqual(eyeRun.equippedRelics, ['eye-of-elder-crow'])
assert.equal(
  DAY_ONE_BRIEFINGS.filter((report) => revealFalseReport(eyeRun, report.truth))
    .length,
  1,
)
assert.equal(
  DAY_ONE_BRIEFINGS.filter(
    (report) => !report.truth && revealFalseReport(eyeRun, report.truth),
  ).length,
  1,
)
assert.equal(eyeRun.hour, 7)
assert.throws(
  () =>
    chooseNextLoadout(selectedEye, [
      'eye-of-elder-crow',
      'komodo-brass-hourglass',
    ]),
  /collected/,
)

const awardedHourglass = earnStoryFlag(
  advanceClock(start, timeAt(11, 7)),
  'relic-hourglass-earned',
)
const bothVault = acquireRelic(
  selectedEye,
  awardedHourglass,
  'komodo-brass-hourglass',
)
assert.throws(
  () =>
    chooseNextLoadout(bothVault, [
      'eye-of-elder-crow',
      'komodo-brass-hourglass',
    ]),
  /slots/,
)
assert.throws(() => earnSecondSlot(bothVault, start), /later authored/)
const secondSlotStory = earnStoryFlag(
  advanceClock(start, timeAt(41, 7)),
  'relic-second-slot-earned',
)
const upgradedVault = earnSecondSlot(bothVault, secondSlotStory)
const twoEquipped = chooseNextLoadout(upgradedVault, [
  'eye-of-elder-crow',
  'komodo-brass-hourglass',
])
assert.equal(twoEquipped.slots, 2)
const run = startWithRelics(4401, twoEquipped)
assert.equal(equipped(run, 'komodo-brass-hourglass'), true)
const aqueduct = DAY_ONE_INCIDENTS[0]!
const normal = previewDispatch(run, aqueduct, ['F002'], 10, 'repair')
const fast = previewDispatch(run, aqueduct, ['F002'], 10, 'repair', true)
assert.equal(normal.projectedReturnHour - fast.projectedReturnHour, 1)
assert.equal(normal.probability, fast.probability)
const sent = dispatchFollowers(run, aqueduct, ['F002'], 10, 'repair', true)
assert.equal(
  sent.dispatches[0]!.arrivesAt,
  run.hour + aqueduct.outwardHours - 1,
)
assert.equal(sent.dispatches[0]!.returnsAt, fast.projectedReturnHour)
assert.equal(sent.relicUses?.['komodo-brass-hourglass'], 1)
assert.equal(run.relicUses?.['komodo-brass-hourglass'], undefined)
const toll = DAY_ONE_INCIDENTS[1]!
const atTollOpen = advanceClock(sent, timeAt(1, toll.opensAtHour))
assert.throws(
  () => previewDispatch(atTollOpen, toll, ['F001'], 8, 'parley', true),
  /not available/,
)
assert.ok(
  previewDispatch(atTollOpen, toll, ['F001'], 8, 'parley').projectedReturnHour >
    0,
)
const nextMorning = advanceClock(sent, timeAt(2, 7))
assert.equal(nextMorning.equippedRelics?.length, 2)
assert.equal(
  decodeEmperorSave(encodeEmperorSave(nextMorning))?.relicUses?.[
    'komodo-brass-hourglass'
  ],
  1,
)
assert.equal(revealFalseReport(startWithRelics(21, empty), false), false)
assert.equal(startWithRelics(24, selectedEye).equippedRelics?.length, 1)
assert.deepEqual(
  selectedEye.owned,
  ['eye-of-elder-crow'],
  'restarting never deletes collection',
)
assert.equal(
  decodeEmperorSave(encodeEmperorSave(start))?.version,
  1,
  'legacy save valid',
)
assert.equal(
  decodeEmperorSave(
    JSON.stringify({
      format: 1,
      campaign: { ...run, equippedRelics: ['invented-relic'] },
    }),
  ),
  null,
)
console.log(
  'Emperor of Dust relic vault, Eye, Hourglass and save contracts passed',
)
