// /utils/scripts/verifyStorybookQuestDoubleApplyGuard.ts
//
// Regression guard for server/utils/storybookQuest.ts's write-back contract
// (found auditing storybook/t-010 cycle 80).
//
// applyQuestProposal's own docstring promises "clicking twice must not create
// two to-dos" -- but that guard only keyed on the SAME proposal id being
// applied twice. A needs-info checkpoint stays activeCheckpoint() across
// turns, so it can pick up a second, independent proposal id before the
// reader applies either one, and storybook-reading.vue renders every
// unapplied proposal with its own Accept button. Applying two different
// proposals that both name the same checkpoint ran performWriteBack twice --
// two AGENT todos for one needs-human decision, or two appended notes on one
// HONEYDO todo -- exactly the outcome the contract rules out, just reached
// through two proposal ids instead of one applied twice.
//
// Pure-function guard: exercises priorAppliedProposalForCheckpoint() and
// recordProposal() directly, no database. applyQuestProposal() itself still
// needs prisma (a live lifeRun/todo), so the fix there is checked here only
// at the unit the bug actually lives in; the full write path is unverified in
// this sandbox, same caveat as any other Prisma-backed change here.
//
// storybookQuest.ts also owns the database-backed write-back path, so
// importing it initializes the Prisma adapter even though this contract only
// exercises its pure ledger functions. Give module initialization a
// syntactically valid, never-connected URL, same pattern as
// verifyChildMaturityRestriction.ts.
//
//   npx tsx utils/scripts/verifyStorybookQuestDoubleApplyGuard.ts

process.env.DATABASE_URL ??= 'mysql://contract:contract@127.0.0.1:3306/contract'
const { priorAppliedProposalForCheckpoint, recordProposal } =
  await import('../../server/utils/storybookQuest')
type QuestLedger = import('../../server/utils/storybookQuest').QuestLedger

let failures = 0

function check(name: string, condition: boolean, detail = '') {
  if (condition) {
    console.log(`  PASS  ${name}`)
  } else {
    failures += 1
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

function baseLedger(): QuestLedger {
  return {
    objective: 'test objective',
    projectSlug: 'conductor',
    projectTitle: 'Conductor',
    checkpoints: [
      {
        id: 'cp-1',
        title: 'Decide on t-999',
        detail: null,
        sourceKind: 'needs-human',
        projectSlug: 'conductor',
        todoId: null,
        conductorTaskId: 't-999',
        status: 'needs-info',
      },
    ],
    proposals: [],
  }
}

function run() {
  // A needs-info checkpoint can pick up a second proposal before either one
  // is applied -- confirm recordProposal() actually allows that (it must, for
  // the double-apply scenario below to be reachable at all).
  let ledger = baseLedger()
  ledger = recordProposal(
    ledger,
    { checkpointId: 'cp-1', outcome: 'needs-info', note: 'first pass' },
    0,
  )
  ledger = recordProposal(
    ledger,
    { checkpointId: 'cp-1', outcome: 'completed', note: 'second pass' },
    1,
  )
  check(
    'a needs-info checkpoint can accumulate two unapplied proposals',
    ledger.proposals.length === 2 &&
      ledger.proposals.every((p) => p.checkpointId === 'cp-1' && !p.appliedAt),
    `got ${ledger.proposals.length} proposal(s)`,
  )

  const [first, second] = ledger.proposals
  if (!first || !second) {
    console.error('  FAIL  expected two recorded proposals to compare')
    process.exit(1)
  }

  // Before either applies, neither sees a prior applied proposal.
  check(
    'no prior applied proposal exists yet for either proposal',
    priorAppliedProposalForCheckpoint(ledger, 'cp-1', first.id) === null &&
      priorAppliedProposalForCheckpoint(ledger, 'cp-1', second.id) === null,
  )

  // Simulate the first proposal's apply landing (what applyQuestProposal does
  // to the ledger after a successful performWriteBack).
  const afterFirstApply: QuestLedger = {
    ...ledger,
    proposals: ledger.proposals.map((entry) =>
      entry.id === first.id
        ? { ...entry, appliedAt: '2026-09-21T00:00:00.000Z', appliedTodoId: 42 }
        : entry,
    ),
  }

  // The reader now clicks Accept on the OLDER, still-unapplied second
  // proposal for the same checkpoint. The guard must find the first
  // proposal's write and say so -- this is the exact check applyQuestProposal
  // uses to skip a second performWriteBack.
  const found = priorAppliedProposalForCheckpoint(
    afterFirstApply,
    'cp-1',
    second.id,
  )
  check(
    'applying a second proposal for an already-applied checkpoint finds the prior write',
    found !== null && found.id === first.id && found.appliedTodoId === 42,
    `got ${JSON.stringify(found)}`,
  )

  // A proposal never excludes itself incorrectly -- re-checking the ALREADY
  // applied proposal against its own id must not find itself as "prior".
  check(
    'a proposal is never reported as its own prior applied proposal',
    priorAppliedProposalForCheckpoint(afterFirstApply, 'cp-1', first.id) ===
      null,
  )

  // A proposal for a DIFFERENT checkpoint is never treated as a prior write
  // for this one, even if it happens to be applied.
  const otherCheckpointLedger: QuestLedger = {
    ...afterFirstApply,
    checkpoints: [
      ...afterFirstApply.checkpoints,
      {
        id: 'cp-2',
        title: 'A different decision',
        detail: null,
        sourceKind: 'needs-human',
        projectSlug: 'conductor',
        todoId: null,
        conductorTaskId: 't-998',
        status: 'pending',
      },
    ],
  }
  check(
    'an applied proposal on a different checkpoint is never treated as this checkpoint’s prior write',
    priorAppliedProposalForCheckpoint(
      otherCheckpointLedger,
      'cp-2',
      'cp2-prop',
    ) === null,
  )

  if (failures) {
    console.error(`\n${failures} check(s) failed.`)
    process.exit(1)
  }
  console.log('\nAll storybook quest double-apply guard checks passed.')
}

run()
