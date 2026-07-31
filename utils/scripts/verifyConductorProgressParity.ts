// /utils/scripts/verifyConductorProgressParity.ts
//
// Guards the one invariant that keeps the workspace's Projects surface honest:
// the progress percentage this repo computes must equal the one conductor
// computes for the same roadmap.
//
// Conductor's scripts/build_status.py::compute_progress falls back to the
// task-completion ratio when milestones carry no signal. server/api/conductor/
// projects.get.ts did not, so every project whose milestones were all left at
// `not-started` — davinci, newsfeed, challenge-center, ecosystem-map,
// engagement and global-ui, all 100% complete by task count — rendered as 0%
// on the site while conductor's STATUS.md reported them finished. 16 of 43
// tracked projects were wrong at the time this check was written.
//
// referenceProgress() below is a direct transcription of build_status.py. If
// conductor's formula ever changes, change it here too and this check will
// tell you which fixtures moved.

import {
  computeProgress,
  parseRoadmapYaml,
  type ConductorMilestone,
  type ConductorTask,
} from '../../server/utils/conductorRoadmap'

let failures = 0

function check(name: string, condition: boolean, detail = '') {
  if (condition) {
    console.log(`  PASS  ${name}`)
  } else {
    failures += 1
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

// Transcription of conductor scripts/build_status.py::compute_progress.
// Python rounds to 1 decimal; this endpoint rounds to a whole percent, so
// parity is asserted to within half a point rather than exact equality.
function referenceProgress(
  milestones: ConductorMilestone[],
  tasks: ConductorTask[],
): number {
  // Weights are used as parsed. The `weight: 10` default belongs to the parse
  // step (build_status.py spells it `m.get("weight", 10)`, which fires only on
  // an ABSENT key) — re-defaulting here with `|| 10` would resurrect the exact
  // explicit-zero bug the fixture below exists to catch.
  const totalM = milestones.reduce((sum, m) => sum + m.weight, 0)
  const doneM = milestones.reduce(
    (sum, m) =>
      sum +
      m.weight *
        (m.status === 'done' ? 1 : m.status === 'in-progress' ? 0.5 : 0),
    0,
  )
  if (totalM && doneM > 0) return (doneM / totalM) * 100
  if (tasks.length) {
    const doneT = tasks.filter((t) => t.status === 'done').length
    return (doneT / tasks.length) * 100
  }
  return 0
}

// Each fixture is a real shape observed in conductor's projects/ tree.
const fixtures: Array<{ name: string; yaml: string; expected: number }> = [
  {
    // The regression this check exists for: davinci's exact shape — every
    // milestone still `not-started`, every task `done`.
    name: 'all milestones not-started, all tasks done → 100%',
    expected: 100,
    yaml: `project: davinci
kind: software

milestones:
  - id: m1
    title: "SHAPE"
    weight: 25
    status: not-started
  - id: m2
    title: "BUILD"
    weight: 35
    status: not-started

tasks:
  - id: t-001
    milestone: m1
    title: "Design brief"
    status: done
    owner: worker
    passes: 0
  - id: t-002
    milestone: m2
    title: "Play loop"
    status: done
    owner: reviewer
    passes: 0
`,
  },
  {
    name: 'no milestone signal, mixed task states → task ratio',
    expected: 50,
    yaml: `project: half-done
kind: software

milestones:
  - id: m1
    title: "One"
    weight: 10
    status: not-started

tasks:
  - id: t-001
    milestone: m1
    title: "Shipped"
    status: done
    passes: 0
  - id: t-002
    milestone: m1
    title: "Open"
    status: ready
    passes: 0
`,
  },
  {
    // Milestones carry signal, so the milestone formula wins and the task
    // ratio must NOT override it — the fallback is a fallback, not a
    // replacement.
    name: 'informative milestones win over task ratio',
    expected: 75,
    yaml: `project: milestone-driven
kind: software

milestones:
  - id: m1
    title: "Done"
    weight: 50
    status: done
  - id: m2
    title: "Half"
    weight: 50
    status: in-progress

tasks:
  - id: t-001
    milestone: m1
    title: "Only task, still open"
    status: ready
    passes: 0
`,
  },
  {
    name: 'no milestones and no tasks → 0%',
    expected: 0,
    yaml: `project: empty
kind: content
`,
  },
  {
    name: 'no milestones but tasks present → task ratio',
    expected: 100,
    yaml: `project: tasks-only
kind: software

tasks:
  - id: t-001
    milestone: ""
    title: "Done"
    status: done
    passes: 0
`,
  },
  {
    name: 'nothing done anywhere → 0%',
    expected: 0,
    yaml: `project: fresh
kind: software

milestones:
  - id: m1
    title: "One"
    weight: 10
    status: not-started

tasks:
  - id: t-001
    milestone: m1
    title: "Not started"
    status: ready
    passes: 0
`,
  },
  {
    // Real shape from conductor's brainstorm roadmap. build_status.py's
    // `m.get("weight", 10)` defaults only on an ABSENT key, so an explicit
    // `weight: 0` contributes nothing and the task ratio takes over. A
    // `Number(w) || 10` default silently turns that 0 into 10 and reports 50%.
    name: 'explicit weight: 0 is honoured, not defaulted to 10',
    expected: 0,
    yaml: `project: brainstorm
kind: proposal

milestones:
  - id: m1
    title: Idea engine running
    weight: 0
    status: in-progress
tasks:
  - id: t-001
    milestone: m1
    title: Generate this cycle's pitches
    status: ready
`,
  },
]

// Shapes that the previous hand-rolled line-regex parser silently truncated.
// Each of these is drawn from a real conductor roadmap; every one of them
// produced a wrong, smaller-looking project on the live board.
const parserFixtures: Array<{
  name: string
  yaml: string
  milestones: number
  tasks: number
}> = [
  {
    // davinci: blank lines between sequence items ended the scan early —
    // 1 of 4 milestones and 1 of 16 tasks survived.
    name: 'blank lines between sequence items',
    milestones: 2,
    tasks: 2,
    yaml: `project: spaced
kind: software

milestones:
  - id: m1
    title: "One"
    weight: 10
    status: done

  - id: m2
    title: "Two"
    weight: 10
    status: done

tasks:
  - id: t-001
    milestone: m1
    title: "First"
    status: done

  - id: t-002
    milestone: m2
    title: "Second"
    status: done
`,
  },
  {
    // lora-ingestion: yq/PyYAML emit block sequences at column 0.
    // `/^ {2}- /` never matched, so the whole project read as empty.
    name: 'sequences at column 0',
    milestones: 1,
    tasks: 2,
    yaml: `project: flush-left
kind: infrastructure
milestones:
- id: m1
  title: Path resolution
  weight: 20
  status: done
tasks:
- id: t-001
  milestone: m1
  title: First
  status: done
- id: t-002
  milestone: m1
  title: Second
  status: ready
`,
  },
  {
    // challenge-center: PyYAML emits a double-quoted multi-line scalar when the
    // text contains escapes. The old reader only recognised `>` and `|` blocks,
    // fell through into the quoted body, and never recovered — 0 of 20 tasks.
    name: 'double-quoted multi-line scalar instead of a block',
    milestones: 1,
    tasks: 1,
    yaml: `project: quoted
kind: software
notes_from_silas: "A comparison arena. Core mechanic: issue a prompt \\u2192\\
  \\nCONTENDERS produce an artifact \\u2192 users vote\\n\\nmilestones: not a real key\\n\\
  \\ntasks: also not a real key\\n"
milestones:
  - id: m1
    title: "Real milestone"
    weight: 10
    status: done
tasks:
  - id: t-001
    milestone: m1
    title: "Real task"
    status: done
`,
  },
  {
    name: 'snake_case task fields normalize to camelCase',
    milestones: 0,
    tasks: 1,
    yaml: `project: snake
kind: software
tasks:
  - id: t-001
    milestone: m1
    title: "Gated"
    status: needs-human
    gate_human: true
    approved_by_human: true
    depends_on:
      - t-000
`,
  },
]

console.log('Conductor roadmap progress parity')

for (const fixture of fixtures) {
  const parsed = parseRoadmapYaml(fixture.yaml)
  const actual = computeProgress(parsed.milestones, parsed.tasks)
  const reference = referenceProgress(parsed.milestones, parsed.tasks)

  check(
    fixture.name,
    actual === fixture.expected,
    `expected ${fixture.expected}%, got ${actual}%`,
  )
  check(
    `  ↳ matches conductor build_status.py (${fixture.name})`,
    Math.abs(actual - reference) <= 0.5,
    `endpoint ${actual}% vs conductor ${reference.toFixed(1)}%`,
  )
}

console.log('Roadmap parsing — shapes that used to truncate silently')

for (const fixture of parserFixtures) {
  const parsed = parseRoadmapYaml(fixture.yaml)
  check(
    fixture.name,
    parsed.milestones.length === fixture.milestones &&
      parsed.tasks.length === fixture.tasks,
    `expected ${fixture.milestones} milestones / ${fixture.tasks} tasks, got ` +
      `${parsed.milestones.length} / ${parsed.tasks.length}`,
  )
}

const snake = parseRoadmapYaml(parserFixtures[3]!.yaml).tasks[0]!
check(
  '  ↳ gate_human / approved_by_human / depends_on map through',
  snake.gateHuman === true &&
    snake.approvedByHuman === true &&
    Array.isArray(snake.dependsOn) &&
    snake.dependsOn[0] === 't-000',
  JSON.stringify(snake),
)
check(
  'a malformed roadmap yields an empty parse rather than throwing',
  parseRoadmapYaml('project: broken\n  : : :\n- - -\n').tasks.length === 0,
)

console.log('Roadmap parsing sanity')

const parsedDavinci = parseRoadmapYaml(fixtures[0]!.yaml)
check(
  'parses milestone weights and statuses',
  parsedDavinci.milestones.length === 2 &&
    parsedDavinci.milestones[0]!.weight === 25 &&
    parsedDavinci.milestones[0]!.status === 'not-started',
  JSON.stringify(parsedDavinci.milestones),
)
check(
  'parses task ids and statuses',
  parsedDavinci.tasks.length === 2 &&
    parsedDavinci.tasks.every((task) => task.status === 'done'),
  JSON.stringify(parsedDavinci.tasks.map((task) => [task.id, task.status])),
)
check(
  'a task count of zero never divides by zero',
  computeProgress([], []) === 0,
)

if (failures) {
  console.error(`\n${failures} check(s) failed.`)
  process.exit(1)
}
console.log('\nAll conductor progress parity checks passed.')
