import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { ATTACKS, adversarialReport } from '../shiftingDesks/adversarial'
import {
  emptyReport,
  playRun,
  policyPicker,
  POLICIES,
} from '../shiftingDesks/balance'
import {
  ENDINGS,
  JOB_TITLES,
  METERS,
  METER_LIMITS,
  endingFor,
  newRun,
  rankedGrades,
} from '../shiftingDesks/rules'
import { dailySeed } from '../shiftingDesks/daily'
import {
  MILESTONES,
  REWARD_ARCHIVE_LIMIT,
  emptyRewardArchive,
  filedReceiptFor,
  migrateFoundEndings,
  newMilestonesForRun,
  parseSavedJSON,
  receiptFor,
  recordReward,
  restoreEndingGallery,
  restoreRewardArchive,
  runFingerprint,
  type RunReceipt,
} from '../shiftingDesks/rewards'

// Art-independent reducer and reward-archive release QA. Never reaches the API,
// database, browser, media host or the live account. Replay seeds are durable.
const RUNS_PER_ATTACK = 200
const report = adversarialReport(RUNS_PER_ATTACK)
const attempts = report.attacks.reduce((sum, a) => sum + a.runs, 0)
assert.equal(
  attempts,
  RUNS_PER_ATTACK * ATTACKS.length,
  'all adversarial strategies run the requested number of seeds',
)
assert.ok(
  attempts >= 2000,
  'release QA exercises at least 2000 seeded campaigns',
)
assert.deepEqual(
  report.findings,
  [],
  'illegal actions, double submits, reloads, softlocks and invalid states must not break the reducer',
)
for (const attack of report.attacks) {
  assert.equal(attack.stalled, 0, attack.id + ' must not softlock')
  assert.equal(
    attack.completed + attack.eliminated,
    attack.runs,
    attack.id + ' accounts for every seed',
  )
}
const reached = new Set(report.attacks.flatMap((a) => Object.keys(a.endings)))
const unreachable = ENDINGS.map((e) => e.id).filter((id) => !reached.has(id))
assert.deepEqual(
  unreachable,
  [],
  'every authored ending needs a naturally reachable seeded route',
)

let archive = emptyRewardArchive()
const discovered = new Set<string>()
const earnedDates = new Map<string, string>()
let receipts = 0
let totalDeaths = 0
let totalDecisions = 0
const rewardRuns = 600
const rewardEndings = new Set<string>()
for (let i = 0; i < rewardRuns; i++) {
  const policy = POLICIES[i % POLICIES.length]!
  const jobId = JOB_TITLES[i % JOB_TITLES.length]!.id
  const seed = 'release-reward-' + policy.id + '-' + i
  const stats = emptyReport(policy.id, 1)
  const run = playRun(seed, jobId, policyPicker(policy), stats)
  assert.ok(
    run.status === 'complete' || run.status === 'eliminated',
    seed + ': run must terminate',
  )
  const end = endingFor(run)
  assert.ok(end, seed + ': ending must exist')
  const receipt = receiptFor(run, '2026-11-01T22:00:00Z')
  assert.ok(receipt, seed + ': terminal run must earn a real receipt')
  assert.equal(receipt.endingId, end.id)
  assert.equal(receipt.id, seed + ':' + end.id + ':' + runFingerprint(run))
  assert.equal(
    receiptFor(run, '2026-11-02T08:00:00Z')?.id,
    receipt.id,
    seed + ': reloading the same run must keep its receipt ID',
  )
  const readings = rankedGrades(run.grades)
  assert.ok(
    readings.filter((r) => r.level.startsWith('Exceptional')).length <= 1,
    seed + ': at most one Exceptional label on a final report',
  )
  for (const reading of readings)
    assert.equal(
      reading.score,
      run.grades[reading.grade],
      seed + '/' + reading.grade + ': the report must show the raw grade',
    )
  assert.deepEqual(receipt.grades, run.grades)
  assert.equal(receipt.floors, Object.keys(run.departmentOutcomes).length)
  assert.ok(receipt.files >= 0)
  assert.ok(receipt.employees >= 1)
  for (const meter of METERS) {
    assert.ok(Number.isFinite(run.meters[meter]), seed + '/' + meter)
    assert.ok(
      run.meters[meter] >= METER_LIMITS[meter].min &&
        run.meters[meter] <= METER_LIMITS[meter].max,
      seed + '/' + meter + ': meter outside legal range',
    )
  }
  rewardEndings.add(end.id)
  discovered.add(end.id)
  const previous = archive
  const updated = recordReward(previous, receipt, [...discovered])
  const awardIds = newMilestonesForRun(previous, updated, receipt.id)
  assert.equal(
    awardIds.length,
    new Set(awardIds).size,
    seed + ': duplicate award in one completion',
  )
  for (const id of awardIds) {
    assert.ok(
      !previous.milestones[id],
      seed + ': previously earned award replayed',
    )
    assert.ok(updated.milestones[id], seed + ': award did not persist')
  }
  const duplicate = recordReward(updated, receipt, [...discovered])
  assert.strictEqual(
    duplicate,
    updated,
    seed + ': duplicate save creates another receipt',
  )
  assert.deepEqual(newMilestonesForRun(updated, duplicate, receipt.id), [])
  assert.ok(updated.runs.length <= REWARD_ARCHIVE_LIMIT)
  archive = restoreRewardArchive(JSON.parse(JSON.stringify(updated)))
  assert.deepEqual(archive, updated, seed + ': archive JSON round-trip drift')
  for (const [id, date] of Object.entries(archive.milestones)) {
    if (earnedDates.has(id)) {
      assert.equal(date, earnedDates.get(id), seed + ': old award was re-dated')
    } else {
      earnedDates.set(id, date)
    }
  }
  receipts++
  totalDeaths += run.terminations.length
  totalDecisions += run.log.length
}
assert.ok(receipts > 0)
assert.equal(archive.runs.length, REWARD_ARCHIVE_LIMIT)
assert.ok(archive.milestones['first-ending'])
assert.ok(archive.milestones['test-report'])
assert.equal(
  receiptFor(
    newRun('release-qa-unfinished', JOB_TITLES[0]!.id),
    '2026-11-01T22:00:00Z',
  ),
  null,
  'an unfinished game must never mint a receipt',
)
for (const id of Object.keys(archive.milestones))
  assert.ok(
    MILESTONES.some((m) => m.id === id),
    'unknown earned award: ' + id,
  )

// A malformed gallery key must not wipe a valid save or invent three endings.
assert.equal(parseSavedJSON('{broken JSON'), null)
assert.equal(parseSavedJSON(null), null)
assert.deepEqual(parseSavedJSON('["one", "two"]'), ['one', 'two'])
const threeRealEndingIds = ENDINGS.slice(0, 3).map((ending) => ending.id)
assert.deepEqual(
  restoreEndingGallery([
    threeRealEndingIds[0],
    threeRealEndingIds[0],
    null,
    'not-an-authored-ending',
    threeRealEndingIds[1],
    threeRealEndingIds[2],
  ]),
  threeRealEndingIds,
  'gallery preserves only distinct known endings in discovery order',
)
assert.deepEqual(restoreEndingGallery({ bad: 'ledger' }), [])
const latestReceipt = archive.runs.at(-1)!
const repeatedEndingId = [threeRealEndingIds[0]!, threeRealEndingIds[0]!]
assert.ok(
  !recordReward(emptyRewardArchive(), latestReceipt, repeatedEndingId)
    .milestones['three-endings'],
  'repeated gallery entries cannot mint the three-endings award',
)
assert.ok(
  !migrateFoundEndings(
    { version: 1, runs: [latestReceipt], milestones: {} },
    repeatedEndingId,
  ).milestones['three-endings'],
  'legacy migration must not date a duplicated gallery entry as a new award',
)
const badReceipts: unknown[] = [
  { ...latestReceipt, files: -1 },
  { ...latestReceipt, employees: null },
  { ...latestReceipt, forms: -3 },
  { ...latestReceipt, grades: { ...latestReceipt.grades, empathy: Infinity } },
  { ...latestReceipt, flags: [...latestReceipt.flags, 42] },
  { ...latestReceipt, societyMet: 'yes' },
]
assert.deepEqual(
  restoreRewardArchive({ version: 1, milestones: {}, runs: badReceipts }).runs,
  [],
  'malformed receipt fields cannot poison a saved dossier',
)
assert.deepEqual(
  restoreRewardArchive({
    version: 1,
    milestones: {},
    runs: [latestReceipt, ...badReceipts, latestReceipt],
  }).runs,
  [latestReceipt],
  'a corrupted archive keeps valid distinct receipts without duplicate awards',
)

// Daily Memo replays share one seed. Two different completions that reach the
// same ending must each be filed, announce only their own new awards, and be
// found again (not their twin) by the Personnel File and the print dossier.
const daily = dailySeed(new Date('2026-11-05T12:00:00Z'))
const dailyRuns = new Map<string, RunReceipt[]>()
let dailyCompletions = 0
for (const policy of POLICIES) {
  for (const job of JOB_TITLES) {
    const run = playRun(
      daily,
      job.id,
      policyPicker(policy),
      emptyReport(policy.id, 1),
    )
    const receipt = receiptFor(run, '2026-11-05T12:00:00Z')
    if (!receipt) continue
    dailyCompletions++
    const sameEnding = dailyRuns.get(receipt.endingId) ?? []
    if (!sameEnding.some((filed) => filed.id === receipt.id))
      sameEnding.push(receipt)
    dailyRuns.set(receipt.endingId, sameEnding)
  }
}
const replays = [...dailyRuns.values()].find((list) => list.length >= 2)
assert.ok(
  replays,
  'the same Daily Memo seed reaches one ending by two different routes',
)
const [firstDaily, secondDaily] = replays as [RunReceipt, RunReceipt]
let dailyArchive = recordReward(emptyRewardArchive(), firstDaily, [
  firstDaily.endingId,
])
const beforeReplay = dailyArchive
dailyArchive = recordReward(dailyArchive, secondDaily, [firstDaily.endingId])
assert.equal(
  dailyArchive.runs.length,
  2,
  'a second Daily Memo completion with the same ending gets its own dossier',
)
for (const id of newMilestonesForRun(
  beforeReplay,
  dailyArchive,
  secondDaily.id,
))
  assert.ok(
    !beforeReplay.milestones[id],
    'a Daily Memo replay must not re-announce awards the first run earned',
  )
assert.deepEqual(
  newMilestonesForRun(
    dailyArchive,
    recordReward(dailyArchive, secondDaily, [firstDaily.endingId]),
    secondDaily.id,
  ),
  [],
  'reloading the replay announces nothing',
)

// A receipt filed before fingerprints existed (`seed:ending`) is the same
// completion when its evidence matches, so a reload never double-files it.
const legacy: RunReceipt = {
  ...firstDaily,
  id: firstDaily.id.split(':').slice(0, -1).join(':'),
}
const legacyArchive = { version: 1 as const, milestones: {}, runs: [legacy] }
assert.strictEqual(
  recordReward(legacyArchive, firstDaily, [firstDaily.endingId]),
  legacyArchive,
  'reloading a run filed under its legacy ID must not create a second receipt',
)
assert.equal(
  recordReward(legacyArchive, secondDaily, [firstDaily.endingId]).runs.length,
  2,
  'a legacy receipt must not swallow a different completion of the same seed',
)
assert.deepEqual(
  newMilestonesForRun(
    legacyArchive,
    recordReward(legacyArchive, firstDaily, [firstDaily.endingId]),
    firstDaily.id,
  ),
  [],
)

// The Personnel File and print dossier find this run's own receipt.
const replayRun = (() => {
  for (const policy of POLICIES)
    for (const job of JOB_TITLES) {
      const run = playRun(
        daily,
        job.id,
        policyPicker(policy),
        emptyReport(policy.id, 1),
      )
      if (receiptFor(run, '2026-11-05T12:00:00Z')?.id === secondDaily.id)
        return run
    }
  return null
})()
assert.ok(replayRun)
assert.equal(filedReceiptFor(dailyArchive, replayRun)?.id, secondDaily.id)
assert.equal(filedReceiptFor(beforeReplay, replayRun), null)
assert.equal(filedReceiptFor(dailyArchive, null), null)
assert.equal(
  filedReceiptFor(legacyArchive, replayRun),
  null,
  'a different completion must not print its twin from the legacy archive',
)

// Locked endings keep their art classified while t-041 hero art is pending:
// no hidden image request behind the overlay, and the archive progress bars
// speak to screen readers.
const source = (path: string) =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')
const archiveView = source(
  '../../components/shifting-desks/shifting-desks-personnel-archive.vue',
)
const endingsTab = archiveView.slice(
  archiveView.indexOf('aria-label="Ending collection"'),
  archiveView.indexOf('aria-label="Completed run dossiers"'),
)
assert.match(
  endingsTab,
  /<shifting-desks-art\s+v-if="hasEnding\(ending\.id\)"/,
  'locked endings must not load their ending art behind the lock',
)
assert.match(endingsTab, /data-testid="locked-ending-slot"/)
const progressBars = archiveView.match(/role="progressbar"/g) ?? []
assert.equal(
  progressBars.length,
  2,
  'milestone and stamp progress bars expose progressbar semantics',
)
assert.equal(
  (archiveView.match(/:aria-valuenow="progress\(milestone\)"/g) ?? []).length,
  2,
)
for (const component of [
  'shifting-desks-personnel-file.vue',
  'shifting-desks-print-dossier.vue',
])
  assert.doesNotMatch(
    source('../../components/shifting-desks/' + component),
    /seed\s*\+\s*':'|seed\}:\$\{/,
    component + ' must match receipts through rewards.ts, not a rebuilt ID',
  )

const summary = {
  seededCampaigns: attempts,
  adversarialStrategies: ATTACKS.length,
  totalRewardReplayCampaigns: rewardRuns,
  stalled: report.attacks.reduce((sum, a) => sum + a.stalled, 0),
  invariantFindings: report.findings.length,
  endingsReached: reached.size,
  endingsAuthored: ENDINGS.length,
  unreachedEndings: unreachable,
  rewardEndingsReached: rewardEndings.size,
  receiptsVerified: receipts,
  archiveSize: archive.runs.length,
  awardsEarned: Object.keys(archive.milestones).length,
  dailyMemoCompletions: dailyCompletions,
  dailyMemoDistinctReceipts: [...dailyRuns.values()].reduce(
    (sum, list) => sum + list.length,
    0,
  ),
  successorLossesInRewardPass: totalDeaths,
  decisionsInRewardPass: totalDecisions,
  warnings: {
    neverSeenCards: report.neverSeenCards,
    neverOfferedChoices: report.neverOfferedChoices,
    offeredButUnpickedChoices: report.offeredButUnpickedChoices,
  },
  exclusions: [
    'visual art fidelity',
    'production account/database writes',
    'browser accessibility and viewport rendering',
    'subjective comedy/fun evaluation',
  ],
}
console.log('SHIFTING_DESKS_RELEASE_QA_JSON=' + JSON.stringify(summary))
