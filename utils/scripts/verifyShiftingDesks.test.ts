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
assert.equal(mergeRun.deck.length, RECORDS.locations.length)

const added = RECORDS.restructurings.find(
  (m) => m.kind === 'add' && (m.when?.outcomes ?? []).length > 0,
)!
const addRun = arriveAfter(added.when!.outcomes![0]!)
const fromAdded = addRun.deck.filter(
  (id) => locOf(id) === added.location_ids[0],
)
assert.equal(fromAdded.length, 2, 'an added location deals a second file')
assert.notEqual(fromAdded[0], fromAdded[1], 'never the same file twice')
assert.equal(addRun.deck.length, RECORDS.locations.length + 2)

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
assert.equal(plain.deck.length, RECORDS.locations.length + 1)

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
  ['orientation', 'records', 'toy-division', 'wellness'],
  'four departments ship, in order',
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
  ]),
  ...DECKS.jobTitles.map((j): [string, string] => [
    `job ${j.id}`,
    j.art_prompt,
  ]),
  ...SOCIETIES.map((x): [string, string] => [`society ${x.id}`, x.art_prompt]),
  ...MUTATIONS.map((x): [string, string] => [`mutation ${x.id}`, x.art_prompt]),
]
assert.ok(
  stationPrompts.length >= 87,
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
const tab = asset('../../content/channels/projects/shifting-desks.md')
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
  `shifting desks contract ok (${completed}/3000 completed, ${eliminated} eliminated)`,
)
