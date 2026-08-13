// /utils/comments/connectionAssignments.ts
//
// The shape of a fitness-pass assignment, shared by the verifier and the
// publisher so they cannot drift about what a valid link is.
//
// An assignment is ADDITIVE and reversible: it connects two rows that already
// exist. Nothing here can disconnect, delete, or overwrite. That is a deliberate
// limit rather than an oversight -- a pass that can both add and remove links is
// one bad batch away from emptying a relation, and the Character/Scenario table
// being empty is exactly the state this pass exists to fix.

export const ASSIGNMENT_KINDS = [
  'SCENARIO_CHARACTER',
  'SCENARIO_DREAM',
  'CHARACTER_DREAM',
] as const

export type AssignmentKind = (typeof ASSIGNMENT_KINDS)[number]

export type Assignment = {
  kind: AssignmentKind
  scenarioId?: number
  scenarioTitle?: string
  characterId?: number
  characterName?: string
  dreamId?: number
  dreamTitle?: string
  /** Why this link is right, in the author's words. Required. */
  why: string
}

export type AssignmentBatch = {
  version: number
  batch: string
  releaseGate: string
  draftingModel?: string
  assignments: Assignment[]
}

/** Which id fields a kind requires. Order is (left, right) for messages. */
export const KIND_FIELDS: Record<AssignmentKind, [string, string]> = {
  SCENARIO_CHARACTER: ['scenarioId', 'characterId'],
  SCENARIO_DREAM: ['scenarioId', 'dreamId'],
  CHARACTER_DREAM: ['characterId', 'dreamId'],
}

/**
 * Stable identity for one link, used to reject duplicates within a batch, across
 * batches, and against what production already has.
 */
export function assignmentKey(assignment: Assignment): string {
  const [left, right] = KIND_FIELDS[assignment.kind]
  const leftId = (assignment as Record<string, unknown>)[left!]
  const rightId = (assignment as Record<string, unknown>)[right!]
  return `${assignment.kind}:${leftId}:${rightId}`
}

/** The shortest `why` that can actually justify a link to a later reader. */
export const MIN_WHY_WORDS = 4
export const MAX_WHY_WORDS = 60
