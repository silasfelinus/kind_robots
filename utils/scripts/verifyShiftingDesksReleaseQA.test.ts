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
import { naturalEndingSaves } from '../shiftingDesks/endingSaves'
import {
  ENDING_COMMENDATIONS,
  MILESTONES,
  REWARD_ARCHIVE_LIMIT,
  ceremonyAwardFor,
  emptyRewardArchive,
  filedReceiptFor,
  migrateFoundEndings,
  newMilestonesForRun,
  ordinal,
  parseSavedJSON,
  receiptFor,
  recordReward,
  restoreEndingGallery,
  restoreRewardArchive,
  runFingerprint,
  type RewardArchive,
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
const ceremonyTitles = new Set<string>()
let repeatCeremonies = 0
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
  // The Personnel File's ceremony: a new award when one was earned, else
  // this ending's own commendation, counted from this completion's filing.
  const ceremony = ceremonyAwardFor(updated, end.id, receipt.id, awardIds)
  assert.ok(ceremony, seed + ': a finished run always gets a ceremony')
  const filedSoFar = updated.runs.filter((r) => r.endingId === end.id)
  const filing = filedSoFar.findIndex((r) => r.id === receipt.id) + 1
  assert.ok(filing >= 1, seed + ': the ceremony counts a filed receipt')
  if (awardIds.length) {
    assert.equal(ceremony.kind, 'milestone')
    assert.equal(
      ceremony.title,
      MILESTONES.find((m) => awardIds.includes(m.id))!.title,
    )
  } else {
    assert.equal(
      ceremony.kind,
      filing === 1 ? 'ending-first' : 'ending-repeat',
      seed + ': a completion without a new award gets its ending commendation',
    )
    assert.equal(ceremony.title, ENDING_COMMENDATIONS[end.id]!.title)
    assert.equal(ceremony.filings, filing)
    if (filing > 1) {
      assert.match(ceremony.line, new RegExp('\\b' + ordinal(filing) + '\\b'))
      repeatCeremonies++
    }
    assert.deepEqual(
      ceremonyAwardFor(updated, end.id, receipt.id, []),
      ceremony,
      seed + ': a reload must not change or escalate the ceremony',
    )
  }
  assert.notEqual(
    ceremony.kind === 'milestone' ? '' : ceremony.title,
    'A Permanent Position',
    seed + ': a repeat run must not replay the first-ending award',
  )
  ceremonyTitles.add(ceremony.title)
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
assert.ok(
  repeatCeremonies > rewardRuns / 2,
  'most of the 600 reward runs are repeats and get a counted commendation',
)
assert.ok(
  ceremonyTitles.size >= rewardEndings.size,
  'repeat runs to different endings present different ceremonies',
)
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

// Repeat ceremonies (t-046): every authored ending files its own commendation,
// so the Personnel File stops replaying "A Permanent Position" on every run
// after the first. Funny, distinct, and counted per ending.
assert.deepEqual(
  Object.keys(ENDING_COMMENDATIONS).sort(),
  ENDINGS.map((ending) => ending.id).sort(),
  'every ending, and only an authored ending, has a commendation',
)
const commendations = Object.values(ENDING_COMMENDATIONS)
const milestoneTitles = new Set(MILESTONES.map((m) => m.title))
for (const field of ['title', 'first', 'repeat'] as const)
  assert.equal(
    new Set(commendations.map((c) => c[field])).size,
    ENDINGS.length,
    'commendation ' + field + 's are all different',
  )
for (const [id, c] of Object.entries(ENDING_COMMENDATIONS)) {
  assert.ok(!milestoneTitles.has(c.title), id + ': not a milestone title')
  assert.equal(c.repeat.split('{nth}').length, 2, id + ': one {nth} slot')
  assert.ok(!c.first.includes('{nth}'), id + ': first filing has no count')
  assert.ok(c.first.length <= 110 && c.repeat.length <= 130, id + ': fits')
  const icon = c.icon.replace(/^kind-icon:/, '')
  assert.ok(
    readFileSync(
      fileURLToPath(
        new URL('../../assets/icons/' + icon + '.svg', import.meta.url),
      ),
      'utf8',
    ).includes('<svg'),
    id + ': icon ' + c.icon + ' exists',
  )
}
assert.deepEqual(
  [1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101, 111, 112].map(ordinal),
  [
    '1st',
    '2nd',
    '3rd',
    '4th',
    '11th',
    '12th',
    '13th',
    '21st',
    '22nd',
    '23rd',
    '101st',
    '111th',
    '112th',
  ],
)

// Each naturally reached ending (the saves the browser contract loads) filed
// three times, the way the store files it: on load, without announcing.
const endingSaveList = naturalEndingSaves()
assert.equal(endingSaveList.length, ENDINGS.length, 'a save for every ending')
for (const save of endingSaveList) {
  const receipt = receiptFor(save.run, '2026-11-05T12:00:00Z')
  assert.ok(receipt, save.ending + ': save files a receipt')
  const commendation = ENDING_COMMENDATIONS[save.ending]!
  let ledger: RewardArchive = emptyRewardArchive()
  const priorLines: string[] = []
  for (let filing = 1; filing <= 3; filing++) {
    const completion: RunReceipt =
      filing === 3
        ? receipt
        : { ...receipt, id: receipt.id + '-earlier-' + filing }
    const before = ledger
    ledger = recordReward(before, completion, [save.ending])
    const awards = newMilestonesForRun(before, ledger, completion.id)
    if (filing > 1)
      assert.deepEqual(
        awards,
        [],
        save.ending + ': a repeat earns no new award',
      )
    const shown = ceremonyAwardFor(ledger, save.ending, completion.id, awards)!
    if (filing === 1) {
      assert.equal(shown.kind, 'milestone', save.ending + ': first clear')
      assert.equal(shown.title, 'A Permanent Position')
      const reloaded = ceremonyAwardFor(ledger, save.ending, completion.id, [])!
      assert.equal(reloaded.kind, 'ending-first')
      assert.equal(reloaded.line, commendation.first)
    } else {
      assert.equal(
        shown.kind,
        'ending-repeat',
        save.ending + ' filing ' + filing,
      )
      assert.equal(shown.title, commendation.title)
      assert.equal(shown.icon, commendation.icon)
      assert.equal(shown.filings, filing)
      assert.equal(
        shown.line,
        commendation.repeat.replace('{nth}', ordinal(filing)),
      )
      assert.match(shown.status, new RegExp(ordinal(filing)))
      assert.ok(!priorLines.includes(shown.line), 'each repeat reads anew')
      priorLines.push(shown.line)
    }
  }
  // The Personnel File looks the run up through filedReceiptFor; that is the
  // receipt the ceremony counts, and an earlier filing keeps its own count.
  assert.equal(filedReceiptFor(ledger, save.run)?.id, receipt.id)
  assert.equal(
    ceremonyAwardFor(ledger, save.ending, receipt.id + '-earlier-2', [])!
      .filings,
    2,
    save.ending + ': an older dossier keeps its own place in the count',
  )
}
// Another ending's history never inflates this ending's count, and an
// unknown ending falls back to the archive's earliest distinction.
const [endA, endB] = endingSaveList as [
  (typeof endingSaveList)[number],
  (typeof endingSaveList)[number],
]
const receiptA = receiptFor(endA.run, '2026-11-05T12:00:00Z')!
const receiptB = receiptFor(endB.run, '2026-11-05T12:00:00Z')!
let mixed = recordReward(emptyRewardArchive(), receiptA, [endA.ending])
mixed = recordReward(mixed, { ...receiptA, id: receiptA.id + '-again' }, [
  endA.ending,
])
mixed = recordReward(mixed, receiptB, [endA.ending, endB.ending])
const mixedCeremony = ceremonyAwardFor(mixed, endB.ending, receiptB.id, [])!
assert.equal(mixedCeremony.kind, 'ending-first')
assert.equal(mixedCeremony.title, ENDING_COMMENDATIONS[endB.ending]!.title)
assert.equal(ceremonyAwardFor(emptyRewardArchive(), null, null, []), null)
assert.equal(
  ceremonyAwardFor(mixed, 'not-an-ending', null, [])?.kind,
  'previous',
)

// The ending reward panel grows with its content. At 390px a fixed h-52
// already squeezed the "Next:" milestone line to zero height, and the
// commendation line would push the archive button out of the panel.
const fileView = source(
  '../../components/shifting-desks/shifting-desks-personnel-file.vue',
)
assert.equal(
  (fileView.match(/role="tabpanel"\s+tabindex="0"/g) ?? []).length,
  4,
  'all four Personnel File panels must be keyboard reachable',
)
assert.equal(
  (archiveView.match(/role="tabpanel"\s+tabindex="0"/g) ?? []).length,
  1,
  'the Archive tab panel must be keyboard reachable',
)
const panelAt = fileView.indexOf('aria-label="Your ending reward"')
const panelOpen = fileView.slice(fileView.lastIndexOf('<div', panelAt), panelAt)
const panel = fileView.slice(
  panelAt,
  fileView.indexOf('aria-label="Personnel file sections"'),
)
assert.match(panelOpen, /\bmin-h-52\b/)
assert.doesNotMatch(
  panelOpen,
  /(?:^|[\s"])(?:[a-z]+:)?h-(?:\d+|\[[^\]]+\])(?=[\s"])/,
  'the reward panel must not fix its height and clip the archive button',
)
assert.doesNotMatch(panelOpen, /max-h-/)
assert.match(panel, /@click="emit\('archive'\)"/, 'archive button in panel')
assert.match(panel, /ceremonyAward\.line/, 'the commendation is shown')
assert.doesNotMatch(
  panel,
  /truncate[^>]*>\s*\{\{\s*ceremonyAward/,
  'the award title and line wrap instead of truncating',
)
assert.match(fileView, /ceremonyAwardFor\(/)
assert.doesNotMatch(
  fileView,
  /MILESTONES\.find\(\(m\) => !!store\.rewardArchive\.milestones/,
  'the ceremony no longer falls back to the oldest award on every repeat',
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
  repeatCeremonies,
  distinctCeremonies: ceremonyTitles.size,
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
