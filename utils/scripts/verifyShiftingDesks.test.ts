import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  type RunState,
  BOSS_CARD,
  HARMFUL_SIGN,
  JOB_TITLES,
  METERS,
  METER_LIMITS,
  ORIENTATION,
  SKILLS,
  DECKS,
  DEPARTMENTS,
  MUTATIONS,
  descend,
  fallbackOutcome,
  stationArt,
  SOCIETIES,
  advance,
  choose,
  favorAppliesTo,
  instantAvailable,
  mutationAppliesTo,
  societyById,
  upgradeRun,
  useInstant,
  currentCard,
  isHarmful,
  isRunState,
  lockReason,
  newRun,
  nextRandom,
  GRADES,
  START_GRADES,
  finalVerdict,
  gradeRequirement,
  interimResults,
  rankedGrades,
  RESTRUCTURING_CARD,
  departmentBoard,
  restructuringFor,
  stepLabels,
  TOY_DIVISION,
  nextDepartment,
  ENDINGS,
  endingFor,
  endingLines,
  WINDOW_PREFIX,
  brokenRule,
  byTheBook,
  windowApplicant,
} from '../shiftingDesks/rules'
import { FLAG_MEMOS } from '../shiftingDesks/memos'

const file = (path: string) => fileURLToPath(new URL(path, import.meta.url))
const asset = (path: string) => readFileSync(file(path), 'utf8')

assert.equal(ORIENTATION.schemaVersion, 1)
assert.equal(ORIENTATION.sourceSha.length, 40)
assert.equal(ORIENTATION.encounters.length, 12)
assert.deepEqual(
  ORIENTATION.locations.map((l) => l.encounter_ids.length),
  [4, 4, 4],
)
assert.doesNotMatch(
  JSON.stringify(ORIENTATION),
  /developer_note|"brief"|art_ref/,
)

const allChoices = DEPARTMENTS.flatMap((d) => [
  ...d.encounters.flatMap((e) => e.choices),
  ...d.boss.choices,
])
assert.deepEqual(
  DEPARTMENTS.map((d) => d.department.order),
  DEPARTMENTS.map((_, i) => i + 1),
  'departments are registered in order',
)
for (const d of DEPARTMENTS) {
  assert.equal(d.encounters.length, 12, `${d.department.id} has 12 cards`)
  assert.ok(d.boss.choices.some((c) => !c.requires))
  assert.ok(
    d.boss.department_outcomes.some((o) => o.id === fallbackOutcome(d)),
    `${d.department.id} has a recognised fallback outcome`,
  )
  assert.doesNotMatch(JSON.stringify(d), /developer_note|"brief"|art_ref/)
}
for (const c of allChoices) {
  assert.ok(
    isHarmful(c.cost) || isHarmful(c.success.effects),
    `no clean wins: ${c.id}`,
  )
  if (c.roll) {
    assert.ok(SKILLS.includes(c.roll.skill), `skill ${c.roll.skill}`)
    assert.ok(c.failure, `rolled choice ${c.id} needs a failure`)
  } else {
    assert.equal(c.failure, null, `certain choice ${c.id} has no failure`)
  }
}
assert.ok(ORIENTATION.boss.choices.some((c) => !c.requires))
for (const k of METERS)
  assert.ok(HARMFUL_SIGN[k] === 1 || HARMFUL_SIGN[k] === -1)
for (const job of JOB_TITLES) {
  assert.equal(
    SKILLS.reduce((sum, s) => sum + job.skills[s], 0),
    6,
    `${job.id} has a six-point spread`,
  )
}

const a = newRun('fixed-seed', 'intern')
const b = newRun('fixed-seed', 'intern')
assert.deepEqual(a, b, 'same seed, same deal')
assert.equal(a.deck.length, 4)
assert.equal(a.deck[3], BOSS_CARD)
assert.deepEqual(
  a.deck
    .slice(0, 3)
    .map((id) => ORIENTATION.encounters.find((e) => e.id === id)?.location_id),
  ORIENTATION.locations.map((l) => l.location_id),
  'one card per location, in order',
)
assert.equal(a.meters.successors, 6, 'Intern perk adds a Successor')
assert.equal(newRun('x', 'night-janitor').meters.clearance, 2)
assert.ok(isRunState(JSON.parse(JSON.stringify(a))))
assert.equal(isRunState({ ...a, version: 6 }), false)
assert.deepEqual(a.restructurings, {}, 'a new run has no Restructuring yet')
assert.deepEqual(a.grades, START_GRADES, 'Test Results start blank')
assert.equal(isRunState({ ...a, grades: undefined }), false)
assert.equal(isRunState({ ...a, deck: ['not-a-card'] }), false)

assert.ok(SOCIETIES.length >= 6 && MUTATIONS.length >= 8)
assert.equal(DECKS.schemaVersion, 1)
assert.deepEqual(
  DECKS.jobTitles.map((j) => [j.id, j.skills]),
  JOB_TITLES.map((j) => [j.id, j.skills]),
  'job titles match the Conductor decks',
)
const allFlags = new Set(
  allChoices.flatMap((c) => [
    ...c.success.add_flags,
    ...(c.failure?.add_flags ?? []),
  ]),
)
for (const soc of SOCIETIES) {
  for (const f of [
    ...(soc.objectives.orientation ?? []),
    ...(soc.betrayals.orientation ?? []),
  ]) {
    assert.ok(allFlags.has(f), `${soc.id} names a granted flag (${f})`)
  }
  assert.ok(soc.objective_text.orientation && soc.betrayal_text.orientation)
}
assert.ok(SOCIETIES.some((x) => x.id === a.societyId))
assert.ok(MUTATIONS.some((x) => x.id === a.mutationId))
const dealt = new Set<string>()
for (let i = 0; i < 400; i++) dealt.add(newRun(`deal-${i}`, 'temp').societyId)
assert.equal(dealt.size, SOCIETIES.length, 'every society gets dealt')

const v1Keys = new Set([
  'department',
  'societyId',
  'societyStatus',
  'favorUsed',
  'mutationId',
  'mutationUsed',
])
const v1 = {
  ...Object.fromEntries(
    Object.entries(JSON.parse(JSON.stringify(a))).filter(
      ([k]) => !v1Keys.has(k),
    ),
  ),
  version: 1,
}
const upgraded = upgradeRun(v1)
assert.ok(upgraded && upgraded.version === 5, 'v1 saves upgrade')
assert.equal(upgradeRun({ version: 1, seed: 'x' }), null, 'junk v1 rejected')

function withDossier(
  run: RunState,
  societyId: string,
  mutationId: string,
): RunState {
  return {
    ...run,
    societyId,
    mutationId,
    societyStatus: 'active',
    favorUsed: false,
    mutationUsed: false,
  }
}
function findRun(predicate: (r: RunState) => boolean): RunState {
  for (let i = 0; i < 5000; i++) {
    const r = newRun(`find-${i}`, 'intern')
    if (predicate(r)) return r
  }
  throw new Error('no seed matched')
}

const rolledFirst = findRun((r) => {
  const v = currentCard(r)
  return !!v && v.card.choices.some((c) => c.roll && !lockReason(r, c))
})
const rolledChoice = currentCard(rolledFirst)!.card.choices.find(
  (c) => c.roll && !lockReason(rolledFirst, c),
)!

const forced = withDossier(
  rolledFirst,
  'stapler-liberation-front',
  'spontaneous-calm',
)
assert.ok(favorAppliesTo(forced, rolledChoice))
for (let i = 0; i < 40; i++) {
  const r = { ...forced, rng: i * 7919 + 13 }
  const out = choose(r, rolledChoice.id, { useFavor: true })
  assert.equal(
    out.pending!.success,
    true,
    'Spare Staples always lands a rolled choice',
  )
  if (out.pending!.aids.includes('Spare Staples'))
    assert.equal(out.favorUsed, true)
}

const auto = withDossier(
  rolledFirst,
  'the-recyclers',
  'perfect-signature-mimicry',
)
const autoChoice = {
  ...rolledChoice,
  roll: { ...rolledChoice.roll!, skill: 'compliance' as const },
}
assert.equal(mutationAppliesTo(auto, autoChoice), true)
assert.equal(
  mutationAppliesTo(auto, {
    ...rolledChoice,
    roll: { ...rolledChoice.roll!, skill: 'rapport' as const },
  }),
  false,
)

const calm = withDossier(
  { ...rolledFirst, meters: { ...rolledFirst.meters, composure: 2 } },
  'the-recyclers',
  'spontaneous-calm',
)
assert.equal(instantAvailable(calm, 'mutation'), true)
const calmed = useInstant(calm, 'mutation')
assert.equal(calmed.meters.composure, 6)
assert.equal(calmed.mutationUsed, true)
assert.equal(
  calmed.position,
  calm.position,
  'instant use does not advance the deck',
)
assert.equal(
  useInstant(calmed, 'mutation'),
  calmed,
  'mutation is once per department',
)

const pot = withDossier(
  { ...rolledFirst, meters: { ...rolledFirst.meters, composure: 2 } },
  'friends-of-the-old-coffee-machine',
  'spontaneous-calm',
)
assert.equal(useInstant(pot, 'favor').meters.composure, 5)

const betray = societyById('stapler-liberation-front')
const pensRun = findRun((r) => r.deck.includes('the-last-box-of-pens'))
let walk = withDossier(pensRun, betray.id, 'spontaneous-calm')
while (currentCard(walk)?.card.id !== 'the-last-box-of-pens') {
  const v = currentCard(walk)!
  const open = v.card.choices.find(
    (c) =>
      !lockReason(walk, c) &&
      !c.success.add_flags.some(
        (f) =>
          betray.betrayals.orientation!.includes(f) ||
          betray.objectives.orientation!.includes(f),
      ) &&
      !(c.failure?.add_flags ?? []).some(
        (f) =>
          betray.betrayals.orientation!.includes(f) ||
          betray.objectives.orientation!.includes(f),
      ),
  )
  if (!open) break
  walk = advance(choose(walk, open.id))
}
if (
  currentCard(walk)?.card.id === 'the-last-box-of-pens' &&
  walk.societyStatus === 'active'
) {
  const before = walk.meters.suspicion
  const burned = choose(walk, 'take-the-box')
  assert.equal(
    burned.societyStatus,
    'betrayed',
    'hoarding the pens betrays the Front',
  )
  assert.equal(burned.favorUsed, true)
  assert.ok(
    burned.meters.suspicion >= Math.min(10, before + 2) ||
      burned.generation > walk.generation,
  )
}

const first = currentCard(a)
assert.equal(first?.kind, 'encounter')
const pickable = first!.card.choices.find((c) => !lockReason(a, c))!
const chosen = choose(a, pickable.id)
assert.equal(chosen.log.length, 1)
assert.ok(chosen.pending)
assert.deepEqual(
  choose(chosen, pickable.id),
  chosen,
  'no second choice while a result is pending',
)
assert.equal(advance(chosen).position, 1)
assert.deepEqual(choose(a, pickable.id), chosen, 'replay is deterministic')

const gated = ORIENTATION.boss.choices.find((c) => c.requires?.flag)!
const atBoss: RunState = { ...a, position: 3 }
assert.ok(
  lockReason(atBoss, gated),
  'flag-gated boss route is locked without the flag',
)
assert.deepEqual(
  choose(atBoss, gated.id),
  atBoss,
  'locked route cannot be taken',
)
assert.equal(
  lockReason(
    {
      ...atBoss,
      flags: [gated.requires!.flag!],
      meters: { ...atBoss.meters, clearance: 5, forms: 9 },
    },
    gated,
  ),
  null,
  'earning the flag unlocks the route',
)

// Hidden Test Results (conductor shifting-desks t-022)
for (const d of DEPARTMENTS) {
  for (const e of d.encounters) {
    assert.ok(
      e.choices.some((c) => c.success.grades || c.failure?.grades),
      `${e.id} grades the player`,
    )
  }
  const gated = d.boss.choices.filter((c) => gradeRequirement(c))
  assert.ok(gated.length >= 1, `${d.department.id} review has a grade route`)
  for (const e of d.encounters) {
    for (const c of e.choices) {
      assert.equal(
        gradeRequirement(c),
        null,
        'only a review may gate on a hidden grade',
      )
    }
  }
}
assert.deepEqual(
  DECKS.testResults.axes.map((x) => x.id),
  [...GRADES],
  'every grade has PAL copy',
)

const gradedRun = findRun((r) => {
  const v = currentCard(r)
  return (
    !!v &&
    v.card.choices.some((c) => !lockReason(r, c) && c.success.grades && !c.roll)
  )
})
const gradedChoice = currentCard(gradedRun)!.card.choices.find(
  (c) => !lockReason(gradedRun, c) && c.success.grades && !c.roll,
)!
const afterGrade = choose(gradedRun, gradedChoice.id)
for (const g of GRADES) {
  assert.equal(
    afterGrade.grades[g],
    gradedChoice.success.grades?.[g] ?? 0,
    `${g} accumulates from the outcome`,
  )
}
assert.doesNotMatch(
  JSON.stringify(afterGrade.pending),
  /obedience|empathy|ingenuity|spite|grades/i,
  'the result panel and journal never carry a grade',
)

const orientationReview: RunState = {
  ...newRun('review', 'intern'),
  position: 3,
}
assert.equal(currentCard(orientationReview)!.kind, 'boss')
const gate = ORIENTATION.boss.choices.find((c) => gradeRequirement(c))!
const [gateGrade, gateMin] = gradeRequirement(gate)!
assert.match(
  lockReason(orientationReview, gate) ?? '',
  /PAL reserves this/,
  'a grade route stays locked until earned',
)
assert.equal(
  lockReason(
    {
      ...orientationReview,
      grades: { ...START_GRADES, [gateGrade]: gateMin },
    },
    gate,
  ),
  null,
  'reaching the grade opens the route',
)
const firstInterim = interimResults({
  ...orientationReview,
  grades: { obedience: 1, empathy: 3, ingenuity: 0, spite: 2 },
})
assert.deepEqual(
  firstInterim.revealed.map((r) => r.grade),
  ['empathy'],
  'Orientation reveals only the leading grade',
)
assert.equal(firstInterim.sealed, 3)
const recordsReview = interimResults({
  ...orientationReview,
  department: DEPARTMENTS[1]!.department.id,
  grades: { obedience: 1, empathy: 3, ingenuity: 0, spite: 2 },
})
assert.deepEqual(
  recordsReview.revealed.map((r) => r.grade),
  ['empathy', 'spite'],
  'each level deeper reveals one more grade',
)
assert.deepEqual(
  rankedGrades({ obedience: 2, empathy: 0, ingenuity: 0, spite: 2 }).map(
    (r) => r.grade,
  )[0],
  'spite',
  'ties go to the later axis',
)
assert.equal(finalVerdict(START_GRADES).axis, 'balanced')
assert.equal(
  finalVerdict({ obedience: 5, empathy: 1, ingenuity: 0, spite: 2 }).axis,
  'obedience',
)
for (const v of DECKS.testResults.verdicts) assert.match(v.text, /\.$/)

const v3 = { ...JSON.parse(JSON.stringify(afterGrade)), version: 3 }
delete v3.grades
const fromV3 = upgradeRun(v3)
assert.ok(fromV3, 'v3 saves upgrade')
assert.deepEqual(
  fromV3.grades,
  afterGrade.grades,
  'upgrading a v3 save replays its grades from the log',
)

// Restructuring (conductor shifting-desks t-023)
const RECORDS = DEPARTMENTS[1]!
assert.equal(
  ORIENTATION.restructurings,
  undefined,
  'the surface never restructures',
)
assert.ok(RECORDS.restructurings && RECORDS.restructurings.length >= 4)
assert.equal(
  RECORDS.restructurings.at(-1)!.when,
  null,
  'the default comes last',
)

function arriveAfter(outcome: string, flags: string[] = []): RunState {
  const top: RunState = {
    ...newRun(`arrive-${outcome}`, 'temp'),
    status: 'department-complete',
    departmentOutcome: outcome,
    departmentOutcomes: { [ORIENTATION.department.id]: outcome },
    flags,
  }
  return descend(top)
}
function locOf(id: string): string {
  return RECORDS.encounters.find((e) => e.id === id)?.location_id ?? 'boss'
}
const SHIFT = RECORDS.window_shift!.applicants.length
for (const memo of RECORDS.restructurings) {
  const board = departmentBoard(RECORDS, memo)
  const open = board.filter((x) => x.change !== 'closed')
  if (memo.kind === 'eliminate') {
    assert.equal(
      open.length,
      RECORDS.locations.length - 1,
      `${memo.id} closes one`,
    )
  }
  if (memo.kind === 'merge') {
    assert.equal(
      open.length,
      RECORDS.locations.length - 1,
      `${memo.id} merges two`,
    )
    assert.ok(
      board.some((x) => x.change === 'merged' && x.title === memo.title),
    )
  }
  if (memo.kind === 'add') {
    assert.equal(
      open.length,
      RECORDS.locations.length + 1,
      `${memo.id} adds one`,
    )
  }
  if (memo.kind === 'none') assert.equal(open.length, RECORDS.locations.length)
  assert.match(memo.reason, /[.!?]$/, `${memo.id} has a written reason`)
}

const closedMemo = RECORDS.restructurings.find((m) => m.kind === 'eliminate')!
const elimRun = arriveAfter(closedMemo.when!.outcomes![0]!)
assert.equal(elimRun.department, RECORDS.department.id)
assert.equal(elimRun.restructurings[RECORDS.department.id], closedMemo.id)
assert.equal(
  elimRun.deck.length,
  RECORDS.locations.length,
  'one fewer file, plus the review',
)
assert.ok(
  !elimRun.deck.some((id) => locOf(id) === closedMemo.location_ids[0]),
  'a closed location deals nothing',
)
const memoEntry = elimRun.log.at(-1)!
assert.equal(memoEntry.cardId, RESTRUCTURING_CARD)
assert.equal(
  memoEntry.text,
  closedMemo.reason,
  'the reason is pinned in the journal',
)

const merged = RECORDS.restructurings.find((m) => m.kind === 'merge')!
const mergeRun = arriveAfter(merged.when!.outcomes![0]!)
assert.equal(
  stepLabels(mergeRun)[0],
  merged.title,
  'the merged location names its step',
)
assert.ok(merged.location_ids.includes(locOf(mergeRun.deck[0]!)))
assert.equal(mergeRun.deck.length, RECORDS.locations.length + SHIFT)

const added = RECORDS.restructurings.find(
  (m) => m.kind === 'add' && (m.when?.outcomes ?? []).length > 0,
)!
const addRun = arriveAfter(added.when!.outcomes![0]!)
const fromAdded = addRun.deck.filter(
  (id) => locOf(id) === added.location_ids[0],
)
assert.equal(fromAdded.length, 2, 'an added location deals a second file')
assert.notEqual(fromAdded[0], fromAdded[1], 'never the same file twice')
assert.equal(addRun.deck.length, RECORDS.locations.length + 2 + SHIFT)

const ducts = RECORDS.restructurings.find((m) =>
  (m.when?.flags ?? []).includes('knows-the-ducts'),
)
if (ducts) {
  assert.equal(
    restructuringFor(
      {
        ...a,
        flags: ['knows-the-ducts'],
        departmentOutcomes: { orientation: 'reorientation' },
      },
      RECORDS,
    )?.id,
    ducts.id,
    'a flag from above can trigger a memo',
  )
}
const plain = arriveAfter('reorientation')
assert.equal(
  plain.restructurings[RECORDS.department.id],
  RECORDS.restructurings.at(-1)!.id,
  'otherwise the default memo applies',
)
assert.equal(plain.deck.length, RECORDS.locations.length + 1 + SHIFT)

// Window shifts (conductor shifting-desks t-016)
const shift = RECORDS.window_shift!
assert.equal(shift.location_id, 'window-9')
assert.ok(shift.applicants.length >= 3 && shift.applicants.length <= 5)
const shiftIds = shift.applicants.map((x) => `${WINDOW_PREFIX}${x.id}`)
assert.deepEqual(
  plain.deck.slice(-1 - SHIFT, -1),
  shiftIds,
  'the whole line is dealt, in order, right before the review',
)
assert.ok(
  !elimRun.deck.some((id) => id.startsWith(WINDOW_PREFIX)),
  'when Window 9 is closed, nobody queues at it',
)
assert.equal(
  stepLabels(plain).at(-1 - SHIFT),
  `Window 9 · 1/${SHIFT}`,
  'each applicant names its place in line',
)
assert.deepEqual(
  [...new Set(shift.applicants.map((x) => byTheBook(x)))].sort(),
  ['approve', 'deny'],
  'the memo approves someone and denies someone',
)
const atWindow: RunState = {
  ...plain,
  position: plain.deck.indexOf(shiftIds[0]!),
}
const windowView = currentCard(atWindow)!
assert.equal(windowView.kind, 'window')
assert.deepEqual(
  windowView.card.choices.map((c) => c.id),
  ['approve', 'deny'],
)
assert.ok(
  windowView.card.choices.every((c) => !c.roll && !lockReason(atWindow, c)),
)
for (const applicant of shift.applicants) {
  const id = `${WINDOW_PREFIX}${applicant.id}`
  const here: RunState = { ...plain, position: plain.deck.indexOf(id) }
  const book = byTheBook(applicant)
  const rule = brokenRule(shift, applicant)
  assert.equal(
    !!rule,
    book === 'deny',
    `${applicant.id}: deny only for a broken rule`,
  )
  for (const stamp of ['approve', 'deny'] as const) {
    const out = choose(here, stamp)
    const data = applicant.choices.find((c) => c.id === stamp)!
    assert.ok(out.pending, `${applicant.id} ${stamp} stamps`)
    assert.ok(
      data.success.add_flags.every((f) => out.flags.includes(f)),
      `${applicant.id} ${stamp} writes its flags`,
    )
    const audited = out.pending!.events.some((e) => e.startsWith("PAL's audit"))
    assert.equal(audited, stamp !== book, `${applicant.id} ${stamp} audit`)
    if (stamp !== book) {
      assert.ok(
        (out.pending!.effects.suspicion ?? 0) >= 1,
        'an off-memo stamp raises Suspicion',
      )
    }
    assert.equal(advance(out).position, here.position + 1)
  }
}
const savedAtWindow = upgradeRun(JSON.parse(JSON.stringify(atWindow)))
assert.equal(
  savedAtWindow && currentCard(savedAtWindow)?.kind,
  'window',
  'a save made mid-shift reloads at the same window',
)
assert.equal(windowApplicant('window:nobody'), null)
assert.equal(
  stationArt('window', shift.applicants[0]!.id),
  `/images/shifting-desks/window/${shift.applicants[0]!.id}.webp`,
)
const ductsEnding = ENDINGS.find((e) => e.id === 'escape-through-the-ducts')!
assert.ok(
  endingLines(
    { ...plain, flags: ['let-the-courier-through'] },
    ductsEnding,
  ).some((l) => l.includes('courier')),
  'the epilogue remembers who you let through',
)
assert.match(
  asset('../../components/shifting-desks/shifting-desks-window.vue'),
  /memo\.rules[\s\S]*documents[\s\S]*emit\('stamp'/,
  'the window shows the memo, the documents and the stamps',
)
assert.match(
  asset('../../pages/play/shifting-desks.vue'),
  /<shifting-desks-window/,
  'the play page puts the window on the desk',
)

const v4 = { ...JSON.parse(JSON.stringify(elimRun)), version: 4 }
delete v4.restructurings
const fromV4 = upgradeRun(v4)
assert.ok(fromV4 && fromV4.version === 5, 'v4 saves upgrade')
assert.deepEqual(
  fromV4.restructurings,
  {},
  'old saves keep the map they were dealt',
)

// Toy Division (conductor shifting-desks t-011)
assert.deepEqual(
  DEPARTMENTS.map((d) => d.department.id),
  ['orientation', 'records', 'toy-division', 'wellness', 'sub-level-zero'],
  'all five departments ship, in order',
)
assert.equal(TOY_DIVISION.encounters.length, 12)
assert.equal(
  fallbackOutcome(TOY_DIVISION),
  'back-to-the-drawing-board',
  'a failed launch sends you back to the floor',
)
assert.ok(
  TOY_DIVISION.restructurings && TOY_DIVISION.restructurings.length >= 4,
)
const toyArrival = descend({
  ...arriveAfter('compliant-graduate'),
  status: 'department-complete',
  departmentOutcome: 'stamped-through',
  departmentOutcomes: {
    orientation: 'compliant-graduate',
    records: 'stamped-through',
  },
  pending: null,
})
assert.equal(
  toyArrival.department,
  'toy-division',
  'Records descends to Toy Division',
)
assert.equal(
  stepLabels(toyArrival)[0],
  'Ideation & Feedback Suite',
  'Toy Division restructures on how Records ended',
)
for (const soc of SOCIETIES) {
  assert.ok(
    soc.objectives['toy-division']?.length &&
      soc.betrayals['toy-division']?.length,
    `${soc.id} has Toy Division orders`,
  )
  assert.ok(soc.objective_text['toy-division'], `${soc.id} explains its orders`)
}
assert.equal(
  fallbackOutcome(DEPARTMENTS[4]!),
  'adjourned',
  'an undecided Board adjourns',
)
assert.equal(
  nextDepartment('sub-level-zero'),
  null,
  'the Board is the bottom floor',
)
assert.match(
  asset('../../components/shifting-desks/shifting-desks-personnel-file.vue'),
  /aria-label="Epilogue"[\s\S]*epilogue\.epilogue\.text[\s\S]*epilogueLines/,
  'the Personnel File shows the epilogue card and its variant lines',
)
assert.match(
  asset('../../components/shifting-desks/shifting-desks-personnel-file.vue'),
  /const ending = computed/,
  'a run that reaches the Board ends on its ending',
)
assert.equal(
  fallbackOutcome(DEPARTMENTS[3]!),
  'retest',
  'an inconclusive Final Exam schedules a retest',
)
for (const soc of SOCIETIES) {
  assert.ok(soc.objectives.wellness?.length, `${soc.id} has Wellness orders`)
}
for (const flag of Object.keys(FLAG_MEMOS)) {
  assert.ok(
    allFlags.has(flag),
    `PAL memo ${flag} is keyed to a flag a card grants`,
  )
}

// Five floors of attrition: HR thaws a Successor at a new level when you are low.
const lowOnStaff = descend({
  ...newRun('thaw-low', 'temp'),
  status: 'department-complete',
  departmentOutcome: 'compliant-graduate',
  departmentOutcomes: { orientation: 'compliant-graduate' },
  meters: { ...newRun('thaw-low', 'temp').meters, successors: 2 },
})
assert.equal(
  lowOnStaff.meters.successors,
  3,
  'a low run gets one Successor back',
)
assert.ok(
  lowOnStaff.log
    .at(-1)!
    .events.some((e) => e.includes('thawed a fresh Successor')),
  'the thaw is announced in the journal',
)
const wellStaffed = descend({
  ...newRun('thaw-high', 'temp'),
  status: 'department-complete',
  departmentOutcome: 'compliant-graduate',
  departmentOutcomes: { orientation: 'compliant-graduate' },
  meters: { ...newRun('thaw-high', 'temp').meters, successors: 4 },
})
assert.equal(
  wellStaffed.meters.successors,
  4,
  'a healthy run gets nothing extra',
)

// Endings ledger (conductor shifting-desks t-014)
assert.ok(ENDINGS.length >= 10, 'ten or more endings ship')
const boardOutcomes = DEPARTMENTS.at(-1)!.boss.department_outcomes.map(
  (o) => o.id,
)
for (const oid of boardOutcomes.slice(0, -1)) {
  assert.ok(
    ENDINGS.some((e) => e.trigger.department_outcome === oid),
    `the Board's ${oid} has an epilogue`,
  )
}
const finished: RunState = {
  ...newRun('ending', 'temp'),
  status: 'complete',
  departmentOutcomes: { 'sub-level-zero': 'the-kind-rewrite' },
  flags: ['saved-pips-tape'],
}
assert.equal(endingFor(finished)?.id, 'the-kind-rewrite')
assert.ok(
  endingLines(finished, endingFor(finished)!).some((l) => l.includes('Pip')),
  'a variant line appears when the run carries its flag',
)
const dead: RunState = { ...newRun('dead', 'temp'), status: 'eliminated' }
assert.equal(endingFor(dead)?.id, 'position-eliminated')
assert.equal(
  endingFor({ ...dead, flags: ['wearing-a-dead-mans-badge'] })?.id,
  'posthumous-affairs',
  'the secret ending outranks the default elimination',
)
assert.equal(endingFor({ ...dead, status: 'playing' }), null)
for (const e of ENDINGS) {
  assert.match(e.epilogue.art_prompt, /every surface bare and unmarked$/)
}
assert.equal(
  stationArt('endings', 'the-kind-rewrite'),
  '/images/shifting-desks/endings/the-kind-rewrite.webp',
)

// Deterministic reachability: every Board ending, forced through its real route.
const BOTTOM = DEPARTMENTS.at(-1)!
for (const ending of ENDINGS.filter((e) => e.kind === 'board')) {
  const route = BOTTOM.boss.choices.find(
    (c) => c.success.department_outcome === ending.trigger.department_outcome,
  )
  assert.ok(route, `${ending.id} has a route at the Board`)
  const atBoard: RunState = {
    ...newRun(`reach-${ending.id}`, 'middle-manager'),
    department: BOTTOM.department.id,
    deck: [BOSS_CARD],
    position: 0,
    flags: route!.requires?.flag ? [route!.requires.flag] : [],
    grades: {
      obedience: 9,
      empathy: 9,
      ingenuity: 9,
      spite: 9,
    },
    meters: { ...newRun('m', 'middle-manager').meters, forms: 9, composure: 9 },
  }
  assert.equal(lockReason(atBoard, route!), null, `${ending.id}'s route opens`)
  let reached: RunState | null = null
  for (let rng = 1; rng < 400 && !reached; rng++) {
    const out = choose({ ...atBoard, rng: rng * 7919 }, route!.id)
    if (out.pending?.success) reached = out
  }
  assert.ok(reached, `${ending.id} resolves on some seed`)
  assert.equal(reached!.status, 'complete', `${ending.id} completes the run`)
  assert.equal(endingFor(reached!)?.id, ending.id, `${ending.id} is the ending`)
  const reloaded = upgradeRun(JSON.parse(JSON.stringify(reached)))
  assert.equal(
    reloaded && endingFor(reloaded)?.id,
    ending.id,
    `${ending.id} survives a save and reload`,
  )
}
const endingsSeen = new Set<string>()

const kindsSeen = new Set<string>()
const outcomes = new Set<string>()
const gradeRoutesTaken = new Set<string>()
const verdictsSeen = new Set<string>()
let eliminated = 0
let reorientations = 0
let descents = 0
let completed = 0
for (let i = 0; i < 3000; i++) {
  const job = JOB_TITLES[i % JOB_TITLES.length]!.id
  let run = newRun(`sim-${i}`, job)
  let rng = i + 1
  let guard = 0
  while (
    (run.status === 'playing' || run.status === 'department-complete') &&
    guard++ < 80
  ) {
    if (run.status === 'department-complete') {
      const before = run.department
      run = descend(run)
      assert.notEqual(run.department, before, 'descend moves down a level')
      assert.equal(run.mutationUsed, false, 'mutation resets per department')
      const memo = RECORDS.restructurings!.find(
        (m) => m.id === run.restructurings[run.department],
      )
      if (memo) {
        kindsSeen.add(memo.kind)
        if (memo.kind === 'eliminate') {
          assert.ok(
            !run.deck.some((id) => locOf(id) === memo.location_ids[0]),
            'restructured decks honor closures',
          )
        }
      }
      descents++
      continue
    }
    const view = currentCard(run)!
    const open = view.card.choices.filter((c) => !lockReason(run, c))
    if (view.kind !== 'boss') {
      assert.equal(
        open.some((c) => gradeRequirement(c)),
        false,
        'no grade gate before a review',
      )
    }
    assert.ok(
      open.length > 0,
      `a card always has an open choice (${view.card.id})`,
    )
    const [r, next] = nextRandom(rng)
    rng = next
    const pick = open[Math.floor(r * open.length)]!
    if (gradeRequirement(pick)) gradeRoutesTaken.add(pick.id)
    run = choose(run, pick.id, {
      spendForm: r < 0.3,
      useFavor: r > 0.6,
      useMutation: r > 0.4,
    })
    if (r > 0.9 && instantAvailable(run, 'mutation'))
      run = useInstant(run, 'mutation')
    if (run.pending?.events.some((e) => e.startsWith('Reorientation'))) {
      reorientations++
      const memo = RECORDS.restructurings!.find(
        (m) => m.id === run.restructurings[run.department],
      )
      if (memo?.kind === 'eliminate') {
        assert.ok(
          !run.deck.some((id) => locOf(id) === memo.location_ids[0]),
          'a re-deal never reopens a closed location',
        )
      }
    }
    for (const k of METERS) {
      assert.ok(
        run.meters[k] >= METER_LIMITS[k].min &&
          run.meters[k] <= METER_LIMITS[k].max,
        `${k} in range`,
      )
    }
    run = advance(run)
  }
  assert.ok(
    run.status === 'complete' || run.status === 'eliminated',
    'every run ends',
  )
  assert.ok(run.bossAttempts <= 3, 'a review is attempted at most three times')
  if (run.status === 'eliminated') eliminated++
  const naturalEnding = endingFor(run)
  if (naturalEnding) endingsSeen.add(naturalEnding.id)
  if (run.status === 'complete') {
    completed++
    verdictsSeen.add(finalVerdict(run.grades).axis)
    assert.deepEqual(
      Object.keys(run.departmentOutcomes),
      DEPARTMENTS.map((d) => d.department.id),
      'a complete run has an outcome for every department',
    )
  }
  for (const o of Object.values(run.departmentOutcomes)) outcomes.add(o)
}
for (const d of DEPARTMENTS) {
  for (const id of d.boss.department_outcomes.map((o) => o.id)) {
    if (id === fallbackOutcome(d)) continue
    assert.ok(outcomes.has(id), `department outcome ${id} is reachable`)
  }
}
for (const d of DEPARTMENTS) {
  for (const c of d.boss.choices.filter((x) => gradeRequirement(x))) {
    assert.ok(gradeRoutesTaken.has(c.id), `grade route ${c.id} gets earned`)
  }
}
assert.ok(
  verdictsSeen.size >= 4,
  `the Personnel File reaches varied verdicts (${[...verdictsSeen].join(', ')})`,
)
assert.ok(
  endingsSeen.size === ENDINGS.length,
  `seeded play reaches every ending (${[...endingsSeen].sort().join(', ')})`,
)
assert.ok(endingsSeen.has('position-eliminated'), 'elimination stays possible')
assert.deepEqual(
  [...kindsSeen].sort(),
  ['add', 'eliminate', 'merge', 'none'],
  'every kind of Restructuring happens in play',
)
assert.ok(descents > 1000, `most runs reach the next department (${descents})`)
assert.ok(completed > 1000, `most runs finish the demo (${completed})`)
assert.ok(
  reorientations > 0,
  'a failed review re-deals a file instead of ending the run',
)
assert.ok(
  eliminated < 3000 * 0.5,
  `elimination stays a risk, not the norm (${eliminated})`,
)

const SUFFIX = 'every surface bare and unmarked'
const stationPrompts: Array<[string, string]> = [
  ...DEPARTMENTS.flatMap((d): Array<[string, string]> => [
    [`department ${d.department.id}`, d.department.arrival_prompt],
    [`review ${d.boss.id}`, d.boss.art_prompt],
    ...d.locations.map((l): [string, string] => [
      `location ${l.location_id}`,
      l.art_prompt,
    ]),
    ...d.encounters.map((e): [string, string] => [
      `card ${e.id}`,
      e.art_prompt,
    ]),
    ...(d.window_shift
      ? [
          [`window ${d.window_shift.id}`, d.window_shift.art_prompt] as [
            string,
            string,
          ],
          ...d.window_shift.applicants.map((x): [string, string] => [
            `applicant ${x.id}`,
            x.art_prompt,
          ]),
        ]
      : []),
  ]),
  ...DECKS.jobTitles.map((j): [string, string] => [
    `job ${j.id}`,
    j.art_prompt,
  ]),
  ...SOCIETIES.map((x): [string, string] => [`society ${x.id}`, x.art_prompt]),
  ...MUTATIONS.map((x): [string, string] => [`mutation ${x.id}`, x.art_prompt]),
]
assert.ok(
  stationPrompts.length >= 109,
  `every station is covered (${stationPrompts.length})`,
)
for (const [station, prompt] of stationPrompts) {
  assert.ok(
    typeof prompt === 'string' &&
      prompt.length >= 50 &&
      prompt.trimEnd().endsWith(SUFFIX),
    `${station} has an image prompt (Silas: every station needs an image)`,
  )
}
assert.equal(
  stationArt('cards', 'gus-shop-steward', 'orientation'),
  '/images/shifting-desks/cards/orientation/gus-shop-steward.webp',
)
assert.equal(
  stationArt('societies', 'the-recyclers'),
  '/images/shifting-desks/societies/the-recyclers.webp',
)

const page = asset('../../pages/play/shifting-desks.vue')
assert.doesNotMatch(page, /<h1[\s>]/)
assert.match(page, /class="kr-surface"/)
// Single screen on every device (Silas, 2026-10-13, carried over from Shifting
// Lands): the page never scrolls as a whole; each screen is a kr-stage and the
// desk is two kr-panes that own any overflow themselves.
assert.doesNotMatch(
  page,
  /class="[^"]*\bkr-scroll\b/,
  'the page itself never scrolls',
)
assert.equal(
  (page.match(/<section[\s\S]*?class="kr-stage/g) ?? []).length,
  5,
  'front desk, hiring, elevator, Personnel File and desk are each one screen',
)
assert.match(page, /class="kr-panes desk-layout/, 'the desk is two panes')
// Themes paint art behind the page, so no container may be see-through.
assert.doesNotMatch(
  page,
  /bg-(?:success|error)\/5\b|opacity-55/,
  'result panels and locked routes keep a solid background',
)
assert.match(
  asset('../../components/shifting-desks/shifting-desks-personnel-file.vue'),
  /role="tablist"/,
  'the Personnel File pages through tabs instead of scrolling',
)
assert.doesNotMatch(page, /localStorage|\$fetch/)
assert.match(page, /prefers-reduced-motion: reduce/)
assert.match(
  page,
  /function focusNewFile[\s\S]*cardBack\.value\?\.focus/,
  'focus returns to the newly dealt file after Next and after the elevator',
)
assert.match(
  asset('../../nuxt.config.ts'),
  /htmlAttrs: \{ lang: 'en' \}/,
  'every page declares its language',
)
const tab = asset('../../content/channels/arcade/shifting-desks.md')
assert.match(tab, /route: \/play\/shifting-desks/)
assert.match(asset('../../public/shifting-desks/front-poster.svg'), /<title/)

const pageWithParts = [
  page,
  asset('../../components/shifting-desks/shifting-desks-envelope.vue'),
  asset('../../components/shifting-desks/shifting-desks-elevator.vue'),
].join('\n')
assert.match(
  page,
  /stepLabels\(run\.value\)\[run\.value\.position\]/,
  'a card names its restructured location, not the one it came from',
)
assert.match(
  page,
  /kind === 'boss' \? interimResults/,
  'interim results appear only at a review',
)
assert.match(
  asset('../../components/shifting-desks/shifting-desks-personnel-file.vue'),
  /<shifting-desks-test-results[\s\S]*final/,
  'the Personnel File reads every grade back',
)
assert.doesNotMatch(
  asset('../../components/shifting-desks/shifting-desks-journal.vue'),
  /grade/i,
  'the journal never shows a grade',
)
for (const kind of [
  'cards',
  'locations',
  'departments',
  'jobs',
  'societies',
  'mutations',
]) {
  assert.match(
    pageWithParts,
    new RegExp(`stationArt\\('${kind}'`),
    `${kind} stations render art`,
  )
}

console.log(
  `shifting desks contract ok (${completed}/3000 completed, ${eliminated} eliminated; endings reached: ${[...endingsSeen].sort().join(', ')})`,
)
