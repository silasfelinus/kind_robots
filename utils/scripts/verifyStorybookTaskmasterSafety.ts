// /utils/scripts/verifyStorybookTaskmasterSafety.ts
//
// The Storybook/Taskmaster safety rules, pinned (storybook/t-045).
//
// docs/products/storybook-taskmaster-boundary.md used to open "This boundary is
// intentional and permanent" and then list invariants. The boundary is gone --
// Taskmaster is a MODE of Storybook now -- but four of those invariants were
// never about product separation, and they are the half that can regress
// silently while every other test stays green:
//
//   1. A story answer is a PROPOSAL until the reader explicitly applies it.
//   2. The objective stays structurally distinct from the prose.
//   3. Conductor roadmap YAML is NEVER written by a story answer.
//   4. Applying is the only write path, and it is its own authenticated route.
//
// A regression here is a correctness bug, not a UX nit: it means a story told
// someone their real to-do was handled when nothing happened, or handled one
// they never agreed to. This suite is deliberately static -- it reads source
// rather than running a database -- so it fails on the PR that introduces the
// write, not on the deploy that ships it.
//
//   npx tsx utils/scripts/verifyStorybookTaskmasterSafety.ts

import { readFileSync } from 'node:fs'

const TURN_ROUTE = 'server/api/storybook/runs/[id]/turn.post.ts'
const APPLY_ROUTE =
  'server/api/storybook/runs/[id]/proposals/[proposalId]/apply.post.ts'
const QUEST = 'server/utils/storybookQuest.ts'
const RUNS = 'server/utils/storybookRuns.ts'
const NARRATION = 'server/utils/storybookNarration.ts'
const BOUNDARY_DOC = 'docs/products/storybook-taskmaster-boundary.md'

let failures = 0

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

function check(label: string, condition: boolean): void {
  if (condition) {
    console.log(`  PASS  ${label}`)
    return
  }
  console.error(`  FAIL  ${label}`)
  failures += 1
}

/**
 * Prisma writes to the two models a quest can touch for real.
 *
 * Matching on the model plus the operation rather than on the word "prisma"
 * keeps this readable when the file legitimately READS a todo -- dealing
 * checkpoints has to.
 */
const REAL_WRITES =
  /\b(?:prisma|tx)\.(todo|project)\.(create|createMany|update|updateMany|upsert|delete|deleteMany)\b/gi

function realWrites(source: string): string[] {
  return [...source.matchAll(REAL_WRITES)].map((match) => match[0])
}

console.log('Taskmaster safety — only one path writes anything real')

const turnRoute = read(TURN_ROUTE)
check(
  'the turn route contains no write to a real Todo or Project',
  realWrites(turnRoute).length === 0,
)

const runs = read(RUNS)
check(
  'the run engine contains no write to a real Todo or Project',
  realWrites(runs).length === 0,
)

const narration = read(NARRATION)
check(
  'the narration layer never touches the database at all',
  !/from '\.\/prisma'|require\('\.\/prisma'\)/.test(narration),
)

const quest = read(QUEST)
// Not just "the file writes somewhere": every write must sit inside
// performWriteBack, the one function the apply route reaches. A write added
// anywhere above it -- in dealQuestCheckpoints, say, where reading todos is
// legitimate -- lands outside that window and fails here.
const writeBackStart = quest.indexOf('async function performWriteBack')
const questWriteOffsets = [...quest.matchAll(REAL_WRITES)].map(
  (match) => match.index ?? -1,
)
check(
  'the quest module has real writes at all (this suite would be vacuous otherwise)',
  questWriteOffsets.length > 0 && writeBackStart > 0,
)
check(
  'every real write in the quest module lives inside performWriteBack',
  questWriteOffsets.every((offset) => offset > writeBackStart),
)

console.log('\nTaskmaster safety — applying is explicit and authenticated')

const applyRoute = read(APPLY_ROUTE)
check(
  'the apply route requires an authenticated user',
  applyRoute.includes('requireApiUser'),
)
check(
  'the apply route is the caller of applyQuestProposal',
  applyRoute.includes('applyQuestProposal'),
)
check(
  'nothing else calls applyQuestProposal',
  !turnRoute.includes('applyQuestProposal') &&
    !runs.includes('applyQuestProposal'),
)
check(
  'applying checks the run belongs to the reader',
  /run\.userId !== userId/.test(quest),
)
check(
  'applying a HONEYDO checks the to-do belongs to the reader too',
  /todo\.userId !== userId/.test(quest),
)
check(
  'applying twice writes nothing a second time',
  /if \(proposal\.appliedAt\) \{[\s\S]{0,120}alreadyApplied: true/.test(quest),
)
check(
  'only a completed proposal closes a to-do',
  /proposal\.outcome === 'completed'[\s\S]{0,80}status: 'DONE'/.test(quest),
)

console.log('\nTaskmaster safety — a proposal is not a fact')

check(
  'a recorded proposal starts unapplied',
  /appliedAt: null/.test(quest) && /appliedTodoId: null/.test(quest),
)
check(
  'recordProposal is what the turn loop calls, not an apply',
  runs.includes('recordProposal(quest, result.proposal'),
)
check(
  'the narrator is told which proposals have NOT been applied',
  /unapplied/.test(quest) &&
    /NOT YET APPLIED/.test(narration) &&
    /Do not narrate any of them as done/.test(narration),
)
check(
  'the narrator is told answering never completes or approves anything',
  /NEVER imply that answering you completes a real task, approves a decision, or writes anything anywhere/.test(
    narration,
  ),
)
check(
  'the client is told, per proposal, whether it has been applied',
  /applied: Boolean\(proposal\.appliedAt\)/.test(quest),
)

console.log('\nTaskmaster safety — the roadmap is never written by a story')

check(
  'no Storybook server file writes a roadmap file',
  ![quest, runs, turnRoute, applyRoute, narration].some((source) =>
    /roadmap\.ya?ml|writeFile|appendFile/i.test(source),
  ),
)
check(
  'a needs-human decision becomes a todo, and says the roadmap is untouched',
  /The conductor task stays needs-human until the roadmap is deliberately edited/.test(
    quest,
  ),
)

console.log('\nTaskmaster safety — the objective is a field, not a paragraph')

check(
  'the narration request carries the objective structurally',
  /interface QuestBrief \{[\s\S]{0,400}objective: string/.test(narration),
)
check(
  'the run read path returns the quest beside the prose',
  read('server/api/storybook/runs/[id]/index.get.ts').includes('publicQuest('),
)
check(
  'the turn response returns the quest beside the prose',
  turnRoute.includes('quest: result.quest'),
)

console.log('\nTaskmaster safety — the doc still says all of this')

const doc = read(BOUNDARY_DOC)
check(
  'the boundary doc still states the proposal rule',
  /proposal until the reader explicitly applies it/i.test(doc),
)
check(
  'the boundary doc still states the objective rule',
  /objective stays visible beside the fiction/i.test(doc),
)
check(
  'the boundary doc still states the roadmap rule',
  /Conductor roadmap YAML is never modified by a story answer/i.test(doc),
)

if (failures > 0) {
  console.error(`\n${failures} Taskmaster safety check(s) FAILED`)
  process.exit(1)
}
console.log('\nAll Taskmaster safety checks passed.')
