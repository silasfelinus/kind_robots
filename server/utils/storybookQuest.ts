// /server/utils/storybookQuest.ts
//
// Taskmaster mode's quest ledger: the real work a story is about
// (storybook/t-044) and the rules that keep it safe (storybook/t-045).
//
// Silas, 2026-09-12: "we should work taskmaster into this project as well,
// removing the taskmaster route when done." stores/taskmasterStore.ts held all
// of this in the reader's browser -- a `taskmaster-session` localStorage blob
// with its own checkpoint plan, its own beat loop, and its own write-backs --
// which is the same architecture Storybook moved to the server three days ago.
// This is that move, for the last of the four modes.
//
// THE SAFETY RULES, which survive the merge intact and are the whole reason
// docs/products/storybook-taskmaster-boundary.md still exists:
//
//   1. A story answer is a PROPOSAL until the reader explicitly applies it.
//      Narration writes proposals into the ledger and nothing else.
//   2. The real objective stays structurally distinct from the prose, so a
//      screen can always show what is actually being worked on.
//   3. Conductor roadmap YAML is NEVER written by a story answer. A decision
//      about a needs-human task becomes an AGENT todo recording it; the roadmap
//      is edited by a person, deliberately, somewhere else.
//   4. Applying is the only write path, and it lives in applyQuestProposal
//      below -- not in the turn route, not in narration, not here-by-accident.
//
// Rule 4 is enforced by utils/scripts/verifyStorybookTaskmasterSafety.ts, which
// fails the build if the turn route grows a write to a Todo or Project.

import prisma from './prisma'
import { withStatusCode } from './davinci'
import { readConductorProjection } from './conductorProjectionDb'
import { buildConductorData } from './conductorProjection'
import type {
  QuestBrief,
  QuestCheckpointBrief,
  QuestOutcome,
  QuestProposalDraft,
} from './storybookNarration'

/** The deck a taskmaster quest resolves into. */
export const TASKMASTER_DECK_KEY = 'taskmaster'

/** Checkpoints a quest opens with. Ported from buildCheckpointPlan(). */
export const MAX_QUEST_CHECKPOINTS = 5
const MAX_OBJECTIVE_CHARS = 500

export type QuestCheckpointSource = 'direct-task' | 'honeydo' | 'needs-human'

export type QuestCheckpointStatus =
  'pending' | 'proposed' | 'completed' | 'blocked' | 'deferred' | 'needs-info'

export interface QuestCheckpoint {
  id: string
  title: string
  detail: string | null
  sourceKind: QuestCheckpointSource
  projectSlug: string | null
  todoId: number | null
  conductorTaskId: string | null
  status: QuestCheckpointStatus
}

export interface QuestProposal {
  id: string
  checkpointId: string
  turnIndex: number
  outcome: QuestOutcome
  note: string
  /** What applying this would actually do, in plain words, before it is done. */
  effect: string
  appliedAt: string | null
  /** The Todo this landed on or created. Null until applied. */
  appliedTodoId: number | null
}

export interface QuestLedger {
  objective: string
  projectSlug: string | null
  projectTitle: string | null
  checkpoints: QuestCheckpoint[]
  proposals: QuestProposal[]
}

function questId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function readQuestLedger(run: {
  questLedger: string | null
}): QuestLedger | null {
  if (!run.questLedger) return null
  try {
    const parsed = JSON.parse(run.questLedger) as Partial<QuestLedger>
    if (!parsed || typeof parsed !== 'object') return null
    return {
      objective: String(parsed.objective || ''),
      projectSlug: parsed.projectSlug ?? null,
      projectTitle: parsed.projectTitle ?? null,
      checkpoints: Array.isArray(parsed.checkpoints) ? parsed.checkpoints : [],
      proposals: Array.isArray(parsed.proposals) ? parsed.proposals : [],
    }
  } catch {
    return null
  }
}

export function serializeQuestLedger(ledger: QuestLedger): string {
  return JSON.stringify(ledger)
}

/** The checkpoint this turn presents: the first one nobody has resolved. */
export function activeCheckpoint(ledger: QuestLedger): QuestCheckpoint | null {
  return (
    ledger.checkpoints.find(
      (checkpoint) =>
        checkpoint.status === 'pending' || checkpoint.status === 'needs-info',
    ) ?? null
  )
}

function openCheckpointCount(ledger: QuestLedger): number {
  return ledger.checkpoints.filter(
    (checkpoint) =>
      checkpoint.status === 'pending' ||
      checkpoint.status === 'proposed' ||
      checkpoint.status === 'needs-info',
  ).length
}

/**
 * What the narrator is allowed to see of the quest.
 *
 * Unapplied proposals are listed BY DESIGN: a scene that narrates an unapplied
 * proposal as done is the failure these rules exist to prevent, and the only
 * way the narrator can avoid it is by being told which ones have not happened.
 */
export function questBrief(ledger: QuestLedger): QuestBrief {
  const checkpoint = activeCheckpoint(ledger)
  const byId = new Map(ledger.checkpoints.map((entry) => [entry.id, entry]))
  return {
    objective: ledger.objective,
    projectTitle: ledger.projectTitle,
    checkpoint: checkpoint ? toBrief(checkpoint) : null,
    remaining: openCheckpointCount(ledger),
    unapplied: ledger.proposals
      .filter((proposal) => !proposal.appliedAt)
      .map((proposal) => {
        const title = byId.get(proposal.checkpointId)?.title ?? 'a real item'
        return `${title} — proposed ${proposal.outcome}: ${proposal.note}`
      }),
  }
}

function toBrief(checkpoint: QuestCheckpoint): QuestCheckpointBrief {
  return {
    id: checkpoint.id,
    title: checkpoint.title,
    detail: checkpoint.detail,
    sourceKind: checkpoint.sourceKind,
    status: checkpoint.status,
  }
}

/**
 * What the CLIENT is allowed to see: everything, deliberately.
 *
 * The reader is the person whose real work this is, and B4 requires the
 * objective and its items on screen beside the fiction at all times. Unlike a
 * genre deck's axes, none of this is a secret being kept from them.
 */
export function publicQuest(ledger: QuestLedger | null) {
  if (!ledger) return null
  return {
    objective: ledger.objective,
    projectSlug: ledger.projectSlug,
    projectTitle: ledger.projectTitle,
    checkpoints: ledger.checkpoints,
    activeCheckpointId: activeCheckpoint(ledger)?.id ?? null,
    proposals: ledger.proposals.map((proposal) => ({
      ...proposal,
      // Said plainly and up front, every time it is rendered: this has not
      // happened yet.
      applied: Boolean(proposal.appliedAt),
    })),
  }
}

/**
 * Deal a quest's checkpoints from the reader's own project.
 *
 * Ports availableHooks() + buildCheckpointPlan() off the client. The ordering
 * is the store's: the objective itself first, then the project's open HONEYDO
 * todos, then its conductor tasks sitting at needs-human, capped at five --
 * and when a project has no open work at all, one synthesized checkpoint so a
 * quest is never a story about nothing.
 *
 * Silas chose this scope on 2026-09-13: one project's work, as today. A quest
 * that sweeps up every loose to-do stops having an objective.
 */
export async function dealQuestCheckpoints(args: {
  objective: string
  projectId: number | null
  projectSlug: string | null
  projectTitle: string | null
}): Promise<QuestCheckpoint[]> {
  const checkpoints: QuestCheckpoint[] = [
    {
      id: questId('cp'),
      title: args.objective,
      detail: 'The objective you entered for this quest.',
      sourceKind: 'direct-task',
      projectSlug: args.projectSlug,
      todoId: null,
      conductorTaskId: null,
      status: 'pending',
    },
  ]

  if (args.projectId) {
    const todos = await prisma.todo.findMany({
      where: {
        projectId: args.projectId,
        status: 'OPEN',
        category: 'HONEYDO',
      },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
      take: MAX_QUEST_CHECKPOINTS,
      select: { id: true, title: true, description: true },
    })
    for (const todo of todos) {
      checkpoints.push({
        id: questId('cp'),
        title: todo.title,
        detail: todo.description,
        sourceKind: 'honeydo',
        projectSlug: args.projectSlug,
        todoId: todo.id,
        conductorTaskId: null,
        status: 'pending',
      })
    }
  }

  if (args.projectSlug) {
    for (const task of await conductorNeedsHuman(args.projectSlug)) {
      checkpoints.push({
        id: questId('cp'),
        title: task.title,
        detail: task.note,
        sourceKind: 'needs-human',
        projectSlug: args.projectSlug,
        todoId: null,
        conductorTaskId: task.id,
        status: 'pending',
      })
    }
  }

  return checkpoints.slice(0, MAX_QUEST_CHECKPOINTS)
}

/**
 * The project's conductor tasks waiting on a human decision.
 *
 * Read from the stored one-way projection the Projects page already serves, so
 * this needs no client store and no network call to Conductor. A missing or
 * stale projection is not an error: a quest with fewer checkpoints is still a
 * quest.
 */
async function conductorNeedsHuman(
  projectSlug: string,
): Promise<{ id: string; title: string; note: string | null }[]> {
  try {
    const stored = await readConductorProjection()
    if (!stored) return []
    const data = buildConductorData(stored.snapshot, new Map(), stored.syncedAt)
    const project = data.projects.find((entry) => entry.slug === projectSlug)
    if (!project) return []
    return project.tasks
      .filter((task) => task.status === 'needs-human')
      .slice(0, MAX_QUEST_CHECKPOINTS)
      .map((task) => ({
        id: task.id,
        title: task.title,
        note: task.note ?? null,
      }))
  } catch {
    return []
  }
}

export function normalizeObjective(value: unknown): string {
  const text = String(value ?? '').trim()
  if (!text) {
    throw withStatusCode(
      'A taskmaster quest needs an objective: say what you are actually trying to get done.',
      400,
    )
  }
  return text.slice(0, MAX_OBJECTIVE_CHARS)
}

/**
 * Record a proposal the narrator made. WRITES NOTHING REAL.
 *
 * The checkpoint moves to `proposed` so the next turn presents the next item,
 * but the Todo, the Project and the roadmap are all untouched until the reader
 * calls the apply endpoint.
 */
export function recordProposal(
  ledger: QuestLedger,
  draft: QuestProposalDraft,
  turnIndex: number,
): QuestLedger {
  const checkpoint = ledger.checkpoints.find(
    (entry) => entry.id === draft.checkpointId,
  )
  if (!checkpoint) return ledger

  const proposal: QuestProposal = {
    id: questId('pr'),
    checkpointId: checkpoint.id,
    turnIndex,
    outcome: draft.outcome,
    note: draft.note,
    effect: describeEffect(checkpoint, draft.outcome),
    appliedAt: null,
    appliedTodoId: null,
  }

  return {
    ...ledger,
    checkpoints: ledger.checkpoints.map((entry) =>
      entry.id === checkpoint.id
        ? {
            ...entry,
            status: draft.outcome === 'needs-info' ? 'needs-info' : 'proposed',
          }
        : entry,
    ),
    proposals: [...ledger.proposals, proposal],
  }
}

/**
 * What applying would do, written before it is done.
 *
 * Shown to the reader on the accept step. A proposal whose effect cannot be
 * stated in one sentence is a proposal nobody should be asked to accept.
 */
export function describeEffect(
  checkpoint: QuestCheckpoint,
  outcome: QuestOutcome,
): string {
  if (checkpoint.sourceKind === 'honeydo' && checkpoint.todoId) {
    return outcome === 'completed'
      ? `Marks the to-do "${checkpoint.title}" done and appends this note to it.`
      : `Appends this note to the to-do "${checkpoint.title}". It stays open.`
  }
  if (checkpoint.sourceKind === 'needs-human' && checkpoint.conductorTaskId) {
    return `Creates one AGENT to-do recording this decision about ${checkpoint.projectSlug}/${checkpoint.conductorTaskId}. The roadmap is not touched.`
  }
  return 'Records this note against the quest. Nothing outside the quest changes.'
}

/**
 * A proposal, other than `excludeProposalId`, that already wrote back for
 * `checkpointId` -- from an earlier turn, not the one being applied now.
 *
 * A needs-info checkpoint stays `activeCheckpoint()` across turns, so it can
 * pick up more than one proposal before the reader ever applies any of them
 * (storybook-reading.vue renders every unapplied proposal with its own Accept
 * button). Without this check, applying two different proposals that both
 * name the same checkpoint ran performWriteBack twice -- the exact "two
 * to-dos from one checkpoint" outcome applyQuestProposal's own contract rules
 * out, just reached through two proposal ids instead of one applied twice.
 */
export function priorAppliedProposalForCheckpoint(
  ledger: QuestLedger,
  checkpointId: string,
  excludeProposalId: string,
): QuestProposal | null {
  return (
    ledger.proposals.find(
      (entry) =>
        entry.checkpointId === checkpointId &&
        entry.id !== excludeProposalId &&
        Boolean(entry.appliedAt),
    ) ?? null
  )
}

/**
 * THE ONLY PATH THAT WRITES ANYTHING REAL (storybook/t-045).
 *
 * Ports applyWriteBack() from stores/taskmasterStore.ts and deliberately no
 * wider. A HONEYDO todo can be closed and annotated; a needs-human decision
 * becomes one AGENT todo recording it. Conductor roadmap YAML is not written
 * here, is not written anywhere else in Storybook, and a proposal cannot ask
 * for it -- there is no branch that could.
 *
 * Idempotent: applying a proposal that already landed returns it unchanged and
 * writes nothing a second time. The reader clicking twice must not create two
 * to-dos -- and neither does clicking Accept on a second, older proposal that
 * turns out to name a checkpoint another proposal already applied.
 */
export async function applyQuestProposal(
  lifeRunId: number,
  userId: number,
  proposalId: string,
): Promise<{
  ledger: QuestLedger
  proposal: QuestProposal
  alreadyApplied: boolean
}> {
  const run = await prisma.lifeRun.findUnique({
    where: { id: lifeRunId },
    select: { id: true, userId: true, questLedger: true },
  })
  if (!run) throw withStatusCode(`Story run ${lifeRunId} does not exist.`, 404)
  if (run.userId !== userId) {
    throw withStatusCode('That story run is not yours.', 403)
  }

  const ledger = readQuestLedger(run)
  if (!ledger) {
    throw withStatusCode('This story is not a taskmaster quest.', 409)
  }

  const proposal = ledger.proposals.find((entry) => entry.id === proposalId)
  if (!proposal) {
    throw withStatusCode(`This quest has no proposal "${proposalId}".`, 404)
  }
  if (proposal.appliedAt) {
    return { ledger, proposal, alreadyApplied: true }
  }

  const checkpoint = ledger.checkpoints.find(
    (entry) => entry.id === proposal.checkpointId,
  )
  if (!checkpoint) {
    throw withStatusCode(
      `This quest no longer holds the item proposal "${proposalId}" was about.`,
      409,
    )
  }

  // Another proposal for this SAME checkpoint already wrote back (a
  // needs-info loop can leave more than one unapplied proposal on one
  // checkpoint). Carry that write's result over instead of running
  // performWriteBack a second time.
  const priorApplied = priorAppliedProposalForCheckpoint(
    ledger,
    checkpoint.id,
    proposal.id,
  )
  if (priorApplied) {
    const carried: QuestLedger = {
      ...ledger,
      proposals: ledger.proposals.map((entry) =>
        entry.id === proposal.id
          ? {
              ...entry,
              appliedAt: priorApplied.appliedAt,
              appliedTodoId: priorApplied.appliedTodoId,
            }
          : entry,
      ),
    }
    await prisma.lifeRun.update({
      where: { id: run.id },
      data: { questLedger: serializeQuestLedger(carried) },
    })
    return {
      ledger: carried,
      proposal: carried.proposals.find((entry) => entry.id === proposal.id)!,
      alreadyApplied: true,
    }
  }

  const appliedTodoId = await performWriteBack(checkpoint, proposal, userId)

  const appliedAt = new Date().toISOString()
  const next: QuestLedger = {
    ...ledger,
    checkpoints: ledger.checkpoints.map((entry) =>
      entry.id === checkpoint.id
        ? { ...entry, status: proposal.outcome as QuestCheckpointStatus }
        : entry,
    ),
    proposals: ledger.proposals.map((entry) =>
      entry.id === proposal.id ? { ...entry, appliedAt, appliedTodoId } : entry,
    ),
  }

  await prisma.lifeRun.update({
    where: { id: run.id },
    data: { questLedger: serializeQuestLedger(next) },
  })

  return {
    ledger: next,
    proposal: { ...proposal, appliedAt, appliedTodoId },
    alreadyApplied: false,
  }
}

/**
 * The two real writes, and nothing else.
 *
 * A `direct-task` checkpoint has no real record behind it -- it is the reader's
 * own objective -- so applying records it in the quest and touches nothing.
 * That is not an oversight: inventing a Todo for it would be Storybook
 * deciding, on its own, to put something on someone's list.
 */
async function performWriteBack(
  checkpoint: QuestCheckpoint,
  proposal: QuestProposal,
  userId: number,
): Promise<number | null> {
  if (checkpoint.sourceKind === 'honeydo' && checkpoint.todoId) {
    const todo = await prisma.todo.findUnique({
      where: { id: checkpoint.todoId },
      select: { id: true, userId: true, description: true },
    })
    if (!todo) {
      throw withStatusCode(
        `The to-do behind "${checkpoint.title}" no longer exists.`,
        409,
      )
    }
    if (todo.userId !== userId) {
      throw withStatusCode('That to-do is not yours.', 403)
    }
    const note = `Taskmaster: ${proposal.note}`
    await prisma.todo.update({
      where: { id: todo.id },
      data: {
        // Only a completed proposal closes a to-do. Blocked, deferred and
        // needs-info annotate it and leave it open, which is what those words
        // mean.
        ...(proposal.outcome === 'completed'
          ? { status: 'DONE' as const }
          : {}),
        description: todo.description ? `${todo.description}\n\n${note}` : note,
      },
    })
    return todo.id
  }

  if (checkpoint.sourceKind === 'needs-human' && checkpoint.conductorTaskId) {
    const project = checkpoint.projectSlug
      ? await prisma.project.findFirst({
          where: { conductorSlug: checkpoint.projectSlug },
          select: { id: true },
        })
      : null
    const created = await prisma.todo.create({
      data: {
        title: `Taskmaster decision on ${checkpoint.projectSlug}/${checkpoint.conductorTaskId}: ${proposal.note.slice(0, 80)}`,
        description: [
          `Captured by Storybook's taskmaster mode for conductor task ${checkpoint.projectSlug}/${checkpoint.conductorTaskId} ("${checkpoint.title}").`,
          `Proposed outcome: ${proposal.outcome}`,
          `The reader's decision: ${proposal.note}`,
          'The conductor task stays needs-human until the roadmap is deliberately edited by a person.',
        ].join('\n\n'),
        category: 'AGENT',
        userId,
        projectId: project?.id ?? null,
        icon: 'kind-icon:gearhammer',
      },
      select: { id: true },
    })
    return created.id
  }

  return null
}
