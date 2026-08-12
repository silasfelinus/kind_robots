// /server/utils/reactionVisibility.ts
//
// Who may read a Reaction.
//
// One rule, in one place, because there are two routes that need it and they
// had drifted apart before: comments are as public as the thing they were left
// on. Silas, 2026-08-12: "reviews are public and defaulted so ... as long as
// people can see the comments left by others, then we are good."
//
// So a reaction on a public object is readable by anyone, signed in or not --
// that is the whole point of showing commentary across the site. A reaction on
// a private object is readable by its author and by admins. The check is on the
// TARGET, never on the reaction itself, because a comment does not have its own
// audience; it inherits one.
import { createError } from 'h3'
import prisma from './prisma'
import {
  KARMA_REF_TARGET_COLUMNS,
  type KarmaRefType,
} from '~/utils/karmaRefTypes'

export type ReactionViewer = {
  userId: number | null
  isAdmin: boolean
}

/**
 * Targets whose visibility is a `userId` / `isPublic` pair on their own row --
 * every reaction target except one. `chat` has participant rules rather than a
 * public flag, so it is not readable by inheritance and stays author-or-admin.
 */
const OWNED_TARGETS = [
  'artImage',
  'artCollection',
  'bot',
  'character',
  'dream',
  'facet',
  'prompt',
  'resource',
  'reward',
  'scenario',
  'theme',
] as const

export type OwnedReactionTarget = (typeof OWNED_TARGETS)[number]

const OWNED = new Set<string>(OWNED_TARGETS)

export function isOwnedReactionTarget(
  value: KarmaRefType | string,
): value is OwnedReactionTarget {
  return OWNED.has(value)
}

// There used to be a PUBLIC_TARGETS set here, holding `component` alone: a
// source file has no userId and no isPublic, so its reactions were readable by
// everyone unconditionally. Component was retired in
// 20260812040500_retire_component_schema and is no longer a KarmaRefType, which
// made that branch unreachable -- dead code that still read as live policy.
// Nothing is world-readable without an owner check any more; if something ever
// is again, the branch comes back with it.

/** Readable only by the reaction's author or an admin. */
export const PRIVATE_TARGETS = new Set<string>(['chat'])

/**
 * Just enough of a Reaction to find its target. Deliberately loose: the real
 * row also carries dates, enums and text, and this only ever reads the
 * foreign-key columns by name.
 */
type ReactionTargetColumns = Record<string, unknown>

/**
 * Which object a Reaction row hangs on. Returns null for a row with no target
 * set -- which should no longer be possible, but was: an unmapped category used
 * to be written with every foreign key null (#1788's sibling bug).
 */
export function reactionTargetOf(
  reaction: ReactionTargetColumns,
): { target: KarmaRefType; id: number } | null {
  for (const [target, column] of Object.entries(KARMA_REF_TARGET_COLUMNS)) {
    const id = reaction[column]
    if (typeof id === 'number' && Number.isInteger(id) && id > 0) {
      return { target: target as KarmaRefType, id }
    }
  }
  return null
}

/**
 * Can this viewer see reactions left on this object?
 *
 * Throws 404 when the target does not exist. Returns false rather than throwing
 * when it exists but is private, so callers can choose their own answer -- the
 * per-target route says 403 (you asked about a specific object), while the
 * by-id route says 404 (a 403 there would confirm the row exists).
 */
export async function canViewReactionsOn(
  target: KarmaRefType,
  targetId: number,
  viewer: ReactionViewer,
): Promise<boolean> {
  if (viewer.isAdmin) return true
  if (PRIVATE_TARGETS.has(target)) return false
  if (!isOwnedReactionTarget(target)) return false

  const model = prisma[target] as unknown as {
    findUnique: (args: unknown) => Promise<unknown>
  }

  const row = (await model.findUnique({
    where: { id: targetId },
    select: { userId: true, isPublic: true },
  })) as { userId?: number | null; isPublic?: boolean | null } | null

  if (!row) {
    throw createError({
      statusCode: 404,
      message: `${target} #${targetId} not found.`,
    })
  }

  return row.isPublic === true || (viewer.userId !== null && row.userId === viewer.userId)
}

/** As above, for a Reaction row rather than a target reference. */
export async function canViewReaction(
  reaction: ReactionTargetColumns,
  viewer: ReactionViewer,
): Promise<boolean> {
  if (viewer.isAdmin) return true
  if (viewer.userId !== null && reaction.userId === viewer.userId) return true

  const target = reactionTargetOf(reaction)
  if (!target) return false

  try {
    return await canViewReactionsOn(target.target, target.id, viewer)
  } catch {
    // A reaction pointing at a deleted target is not readable, but it is also
    // not a 404 about the reaction itself.
    return false
  }
}
