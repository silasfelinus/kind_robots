import assert from 'node:assert/strict'
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
} from '../shiftingDesks/rules'
import {
  MILESTONES,
  REWARD_ARCHIVE_LIMIT,
  emptyRewardArchive,
  newMilestonesForRun,
  receiptFor,
  recordReward,
  restoreRewardArchive,
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
assert.ok(attempts >= 2000, 'release QA exercises at least 2000 seeded campaigns')
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
  assert.equal(receipt.id, seed + ':' + end.id)
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
    assert.ok(!previous.milestones[id], seed + ': previously earned award replayed')
    assert.ok(updated.milestones[id], seed + ': award did not persist')
  }
  const duplicate = recordReward(updated, receipt, [...discovered])
  assert.strictEqual(duplicate, updated, seed + ': duplicate save creates another receipt')
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
  receiptFor(newRun('release-qa-unfinished', JOB_TITLES[0]!.id), '2026-11-01T22:00:00Z'),
  null,
  'an unfinished game must never mint a receipt',
)
for (const id of Object.keys(archive.milestones))
  assert.ok(MILESTONES.some((m) => m.id === id), 'unknown earned award: ' + id)

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
