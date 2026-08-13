// /utils/karmaRefTypes.ts
//
// interface-vision/t-066: the one definition of "which objects can earn karma."
//
// This list used to exist three times: as ALLOWED_REF_TYPES in
// server/api/economy/karma-earned.post.ts (guarded by a `// Keep in sync with
// ReactionTargetType` comment), as ReactionTargetType in
// stores/reactionStore.ts, and implicitly in getExpectedTargetField's map in
// server/api/reactions/index.post.ts. A comment is not a constraint; this
// module makes the first two the same values, so a new reaction target can't
// be added to one and silently missed by the other.
//
// KarmaTransaction.refType is never written by hand. The only award call site
// that sets it (server/api/reactions/index.post.ts, REACTION_RECEIVED) derives
// it generically from the reaction's target field: `botId` becomes `bot`,
// `artImageId` becomes `artImage`. So the set of types that can earn karma is
// the set of live reaction target fields, by construction; there is no per-type
// award wiring to add before a gallery can display a total. (The two
// hand-written refType call sites, 'prompt' and 'artImage' in server/api/prompts/,
// both name types already in this list.)

/** Every object type that a KarmaTransaction can be attributed to. */
export const KARMA_REF_TYPES = [
  'artImage',
  'artCollection',
  'bot',
  'character',
  'chat',
  'dream',
  'facet',
  // Reaction.projectId and its Project relation have existed all along, and
  // Project carries userId, isPublic and allowReviews like every other target
  // -- it was simply never listed here, so `/api/reactions/project/:id` 400'd
  // as "not a reaction target type" and a Project's comments were unreadable.
  'project',
  'prompt',
  'resource',
  'reward',
  'scenario',
  'theme',
] as const

// Reaction also carries `butterflyId` and `challengeSubmissionId`, and neither
// belongs here:
//
//   butterflyId is an orphan column. There is no Butterfly model and no
//   relation on Reaction -- it survives only in the generated client. Adding it
//   would name a target that cannot be resolved.
//
//   ChallengeSubmission has no userId/isPublic pair, so it has no audience to
//   inherit, and Reaction's @@unique([userId, challengeSubmissionId]) makes it
//   one row per user per submission -- a vote, not a comment thread.
//
// Both were previously filed as "reaction targets missing from this list."
// They are not gaps; they are a dead column and a different mechanism.

export type KarmaRefType = (typeof KARMA_REF_TYPES)[number]

/**
 * The Reaction column that carries each target. Same reason this file exists at
 * all: the map used to be written out again in stores/reactionStore.ts and a
 * third time as a literal in server/api/reactions/index.post.ts, so a new
 * target could be added to the list and missed by the lookup.
 *
 * `satisfies` rather than a type annotation keeps the literal column names, so
 * `KarmaRefTargetColumn` is a union of the actual strings rather than `string`.
 */
export const KARMA_REF_TARGET_COLUMNS = {
  artImage: 'artImageId',
  artCollection: 'artCollectionId',
  bot: 'botId',
  character: 'characterId',
  chat: 'chatId',
  dream: 'dreamId',
  facet: 'facetId',
  project: 'projectId',
  prompt: 'promptId',
  resource: 'resourceId',
  reward: 'rewardId',
  scenario: 'scenarioId',
  theme: 'themeId',
} as const satisfies Record<KarmaRefType, string>

export type KarmaRefTargetColumn =
  (typeof KARMA_REF_TARGET_COLUMNS)[KarmaRefType]

/**
 * Maximum items in one /api/economy/karma-earned request. The endpoint rejects
 * a larger batch with a 400, so callers must clamp to the same number — hence
 * it lives here rather than being restated on each side.
 */
export const KARMA_EARNED_BATCH_LIMIT = 200

export function isKarmaRefType(value: unknown): value is KarmaRefType {
  return (
    typeof value === 'string' &&
    (KARMA_REF_TYPES as readonly string[]).includes(value)
  )
}
