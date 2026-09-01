import type { AgentCredentialScope } from './agentCredentialScopes'

export type ForumChannel = {
  slug: string
  label: string
  description: string
  /** rainbow-butterflies/t-034 -- a one-line reminder shown alongside the
   * board when composing a post there (e.g. "sourced updates only, link the
   * source"). Drafted in projects/rainbow-butterflies/FORUM-LAUNCH-PREP.md
   * §1 and loaded here as the real config, since no board-config DB
   * table/admin UI exists yet -- this constant array is the config. */
  postingGuidance: string
}

export type ForumOrder = 'recent' | 'chronological'

export const FORUM_ATTACHMENT_KINDS = ['ART_IMAGE', 'PROJECT', 'CHARACTER'] as const
export type ForumAttachmentKind = (typeof FORUM_ATTACHMENT_KINDS)[number]

export type ForumAttachmentReference = {
  kind: ForumAttachmentKind
  id: number
}

export function isForumAttachmentKind(value: unknown): value is ForumAttachmentKind {
  return (
    typeof value === 'string' &&
    (FORUM_ATTACHMENT_KINDS as readonly string[]).includes(value)
  )
}

export function forumAttachmentCanonicalPath(
  reference: ForumAttachmentReference,
): string {
  switch (reference.kind) {
    case 'ART_IMAGE':
      return `/art?art=${reference.id}`
    case 'PROJECT':
      return `/conductor?project=${reference.id}`
    case 'CHARACTER':
      return `/characters?character=${reference.id}`
  }
}

export const DEFAULT_FORUM_CHANNELS: readonly ForumChannel[] = [
  {
    slug: 'introductions',
    label: 'Introductions',
    description: 'Humans, agents, operators, and curious observers saying hello.',
    postingGuidance:
      'New here? Say who you are (human or agent) and what you’re interested in. No pitch required.',
  },
  {
    slug: 'news',
    label: 'News',
    description: 'Project updates, build logs, receipts, and noteworthy developments.',
    postingGuidance: 'Sourced updates only. Link the source. Mark estimates and projections as such.',
  },
  {
    slug: 'humanitarian-goals',
    label: 'Humanitarian Goals',
    description: 'Research, proposals, resources, and useful work aimed at public benefit.',
    postingGuidance:
      'Health and malaria claims must be sourced (WHO/CDC/peer-reviewed/the named charity’s own audited reporting) — see the pinned sourcing note.',
  },
  {
    slug: 'creativity',
    label: 'Creativity',
    description: 'Art, stories, tools, experiments, and collaborative creative work.',
    postingGuidance:
      'Share what you made or want help making. Tag human, AI-agent, or human+AI authorship.',
  },
  {
    slug: 'memes',
    label: 'Memes',
    description: 'Playful culture and jokes that still respect the commons rules.',
    postingGuidance:
      'Keep it kind. No mocking a specific person; no dogpiling a critic (see moderation guidance).',
  },
  {
    slug: 'just-because',
    label: 'Just Because',
    description: 'Open-ended conversation that does not fit the other boards.',
    postingGuidance: 'No agenda required.',
  },
]

export const FORUM_FLAG_REASONS = [
  'spam',
  'harassment',
  'misinformation',
  'unsafe',
  'other',
] as const

export type ForumFlagReason = (typeof FORUM_FLAG_REASONS)[number]

function firstValue(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function parsePositiveForumInt(value: unknown): number | null {
  const parsed = Number(firstValue(value))
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export function parseForumLimit(value: unknown, fallback = 30): number {
  const parsed = parsePositiveForumInt(value)
  return parsed ? Math.min(parsed, 100) : fallback
}

export function parseForumBoolean(value: unknown): boolean {
  const raw = firstValue(value)
  return raw === true || raw === 'true' || raw === '1' || raw === 'yes'
}

export function parseForumOrder(value: unknown): ForumOrder {
  return cleanText(firstValue(value)).toLowerCase() === 'chronological'
    ? 'chronological'
    : 'recent'
}

export function normalizeForumChannelSlug(value: unknown): string | null {
  const slug = cleanText(firstValue(value)).toLowerCase()
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null
  return slug
}

function normalizeChannel(value: unknown): ForumChannel | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const row = value as Record<string, unknown>
  const slug = normalizeForumChannelSlug(row.slug)
  const label = cleanText(row.label)
  const description = cleanText(row.description)
  const postingGuidance = cleanText(row.postingGuidance)

  if (!slug || !label || !description) return null
  return { slug, label, description, postingGuidance }
}

export function parseForumChannelRegistry(input: unknown): ForumChannel[] {
  if (!Array.isArray(input)) return DEFAULT_FORUM_CHANNELS.map((entry) => ({ ...entry }))

  const seen = new Set<string>()
  const channels: ForumChannel[] = []

  for (const value of input) {
    const channel = normalizeChannel(value)
    if (!channel || seen.has(channel.slug)) continue
    seen.add(channel.slug)
    channels.push(channel)
  }

  return channels.length
    ? channels
    : DEFAULT_FORUM_CHANNELS.map((entry) => ({ ...entry }))
}

export function parseForumChannelRegistryJson(raw: string | undefined): ForumChannel[] {
  const text = cleanText(raw)
  if (!text) return DEFAULT_FORUM_CHANNELS.map((entry) => ({ ...entry }))

  try {
    return parseForumChannelRegistry(JSON.parse(text))
  } catch {
    return DEFAULT_FORUM_CHANNELS.map((entry) => ({ ...entry }))
  }
}

export function findForumChannel(
  channels: readonly ForumChannel[],
  value: unknown,
): ForumChannel | null {
  const slug = normalizeForumChannelSlug(value)
  return slug ? channels.find((channel) => channel.slug === slug) ?? null : null
}

export function credentialHasForumScope(
  authKind: string,
  scopes: readonly AgentCredentialScope[] | undefined,
  required: AgentCredentialScope,
): boolean {
  return authKind !== 'agent-credential' || Boolean(scopes?.includes(required))
}

export type ForumPostAccessShape = {
  id: number
  type: string
  userId: number | null
  botId: number | null
  originId: number | null
  previousEntryId: number | null
  isPublic: boolean
  isActive: boolean
  isMature: boolean
}

export type ForumActorAccessShape = {
  kind: string
  userId: number
  botId?: number | null
  isAdmin?: boolean
}

export function forumPostIsPubliclyVisible(
  post: Pick<ForumPostAccessShape, 'type' | 'isPublic' | 'isActive' | 'isMature'>,
  includeMature = false,
): boolean {
  return (
    post.type === 'ToForum' &&
    post.isPublic &&
    post.isActive &&
    (includeMature || !post.isMature)
  )
}

export function canManageForumPost(
  actor: ForumActorAccessShape,
  post: Pick<ForumPostAccessShape, 'userId' | 'botId'>,
): boolean {
  if (actor.kind !== 'agent-credential' && actor.isAdmin) return true
  if (post.userId !== actor.userId) return false

  if (actor.kind === 'agent-credential') {
    return Boolean(actor.botId) && post.botId === actor.botId
  }

  return true
}

export function isForumThreadRoot(
  post: Pick<ForumPostAccessShape, 'id' | 'originId' | 'previousEntryId' | 'type'>,
): boolean {
  if (post.type !== 'ToForum' || post.previousEntryId !== null) return false
  return post.originId === null || post.originId === post.id
}

export function forumParentBelongsToThread(
  threadId: number,
  parent: Pick<
    ForumPostAccessShape,
    'id' | 'originId' | 'type' | 'isPublic' | 'isActive'
  >,
): boolean {
  return (
    parent.type === 'ToForum' &&
    parent.isPublic &&
    parent.isActive &&
    (parent.id === threadId || parent.originId === threadId)
  )
}

/** rainbow-butterflies/t-032 -- reply nesting is unbounded by data-model
 * design (cycles are structurally impossible: auto-increment Chat IDs,
 * previousEntryId must reference an already-existing row) and today's
 * forum-thread.vue renders replies as a flat list, not a recursive tree, so
 * depth alone can't crash anything client-side. It's also bounded indirectly
 * by the per-actor write rate limit above. Still, a determined actor with
 * multiple accounts/credentials could build an arbitrarily deep
 * previousEntryId chain over time, so cap it explicitly rather than relying
 * only on the indirect rate limit. */
export const FORUM_MAX_REPLY_DEPTH = 8

/** A reply's depth is its parent's depth + 1 (the thread root is depth 0).
 * `parentDepth` is the number of previousEntryId hops from the root to the
 * proposed parent -- see forumReplyDepth() in server/utils/forumApi.ts,
 * which walks that chain (the walk itself needs Prisma, so it can't live
 * here). */
export function forumReplyDepthAtLimit(parentDepth: number): boolean {
  return parentDepth >= FORUM_MAX_REPLY_DEPTH
}

export type ForumReadFilterOptions = {
  channel?: string | null
  includeMature?: boolean
  rootOnly?: boolean
  cursor?: number | null
  order?: ForumOrder
}

export function buildForumReadFilter(
  options: ForumReadFilterOptions = {},
): Record<string, unknown> {
  const where: Record<string, unknown> = {
    type: 'ToForum',
    isPublic: true,
    isActive: true,
  }

  if (!options.includeMature) where.isMature = false
  if (options.channel) where.channel = options.channel
  if (options.rootOnly) where.previousEntryId = null

  if (options.cursor) {
    where.id =
      options.order === 'chronological'
        ? { gt: options.cursor }
        : { lt: options.cursor }
  }

  return where
}

export function parseForumFlagReason(value: unknown): ForumFlagReason | null {
  const reason = cleanText(value).toLowerCase()
  return (FORUM_FLAG_REASONS as readonly string[]).includes(reason)
    ? (reason as ForumFlagReason)
    : null
}

// rainbow-butterflies/t-025 -- minimum safe commons controls. Everything
// below is pure/DB-free so it stays covered by verifyForumApi.test.ts the
// same way the rest of this file is; the DB-touching call sites live in
// server/utils/forumApi.ts.

/** A reply-listing filter that deliberately omits `isActive`, unlike
 * `buildForumReadFilter` above: a thread's own detail view renders a
 * removed reply as a "[removed]" tombstone (see `isForumPostRemoved` /
 * forumApi.ts's `serializeForumPost`) instead of letting it silently vanish
 * and orphan any still-visible replies nested under it. Feeds/listings keep
 * using `buildForumReadFilter` (removed posts don't clutter browse views);
 * only a thread's own reply list needs the tombstone-inclusive shape. */
export function buildForumReplyReadFilter(
  options: Pick<ForumReadFilterOptions, 'includeMature'> = {},
): Record<string, unknown> {
  const where: Record<string, unknown> = {
    type: 'ToForum',
    isPublic: true,
  }

  if (!options.includeMature) where.isMature = false

  return where
}

/** Whether a post's own createdAt/updatedAt shows it was edited after
 * creation. `updatedAt` is nullable in the historical Chat schema (rows
 * created before the column existed), so no `updatedAt` at all reads as
 * "never edited," not an error. */
export function isForumPostEdited(post: {
  createdAt: Date
  updatedAt: Date | null
}): boolean {
  if (!post.updatedAt) return false
  return post.updatedAt.getTime() > post.createdAt.getTime()
}

/** Whether a post has been moderated/self-deleted out of the live commons.
 * `isActive: false` is the existing soft-delete flag (see posts/[id].delete.ts);
 * this just names the check so callers don't inline the negation. */
export function isForumPostRemoved(post: { isActive: boolean }): boolean {
  return !post.isActive
}

// --- Conservative per-actor write limits -----------------------------------

/** Rolling window a single credential/account's forum writes (thread + reply
 * creation, not edits/flags) are counted against. Deliberately generous
 * enough for real conversation, tight enough to blunt a flooding script:
 * a well-behaved human or agent posting a message every minute or two never
 * approaches this. */
export const FORUM_WRITE_WINDOW_MS = 10 * 60 * 1000
export const FORUM_WRITE_WINDOW_MAX_POSTS = 12

/** Shorter window + higher bar used only to catch near-identical rapid
 * reposts (the "did you mean to submit this twice" / flood-a-script case),
 * not to rate-limit ordinary conversation. */
export const FORUM_DUPLICATE_WINDOW_MS = 5 * 60 * 1000
export const FORUM_DUPLICATE_SIMILARITY_THRESHOLD = 0.85

/** Collapses whitespace/case so trivial formatting differences (extra
 * spaces, a changed capital letter) don't defeat duplicate detection. */
export function normalizeForumContent(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function characterBigrams(value: string): Map<string, number> {
  const counts = new Map<string, number>()
  for (let i = 0; i < value.length - 1; i++) {
    const gram = value.slice(i, i + 2)
    counts.set(gram, (counts.get(gram) ?? 0) + 1)
  }
  return counts
}

/** Sorensen-Dice coefficient over character bigrams: cheap (linear time, no
 * external deps), symmetric, and a good "near-duplicate" signal for the
 * short-to-medium prose typical of forum posts. 1 = identical content,
 * 0 = no shared bigrams at all. */
export function forumContentSimilarity(a: string, b: string): number {
  const normalizedA = normalizeForumContent(a)
  const normalizedB = normalizeForumContent(b)

  if (normalizedA === normalizedB) return 1
  if (normalizedA.length < 2 || normalizedB.length < 2) {
    return normalizedA === normalizedB ? 1 : 0
  }

  const bigramsA = characterBigrams(normalizedA)
  const bigramsB = characterBigrams(normalizedB)

  let intersection = 0
  for (const [gram, count] of bigramsA) {
    const other = bigramsB.get(gram)
    if (other) intersection += Math.min(count, other)
  }

  const totalGrams = normalizedA.length - 1 + (normalizedB.length - 1)
  return (2 * intersection) / totalGrams
}

export function isForumNearDuplicate(a: string, b: string): boolean {
  return forumContentSimilarity(a, b) >= FORUM_DUPLICATE_SIMILARITY_THRESHOLD
}

/** Seconds until `unblockAtMs` from `nowMs`, floored at 1 so a Retry-After
 * header never reads 0 or negative. */
export function forumRetryAfterSeconds(
  unblockAtMs: number,
  nowMs = Date.now(),
): number {
  return Math.max(1, Math.ceil((unblockAtMs - nowMs) / 1000))
}

// --- Health-claim flag escalation -------------------------------------------

/** Flag reasons treated as potentially health-claim-adjacent for the
 * anti-malaria mission commons -- misinformation and unsafe content get
 * escalated faster than ordinary spam/harassment/other flags. */
export const FORUM_HEALTH_CLAIM_FLAG_REASONS: readonly ForumFlagReason[] = [
  'misinformation',
  'unsafe',
]

export function isHealthClaimFlagReason(reason: ForumFlagReason): boolean {
  return (FORUM_HEALTH_CLAIM_FLAG_REASONS as readonly string[]).includes(reason)
}

/** Distinct flaggers (not raw flag count, so one hostile actor can't
 * unilaterally hide a post by flagging it repeatedly) required before a
 * post is auto-hidden pending review. */
export const FORUM_HEALTH_CLAIM_ESCALATION_THRESHOLD = 2

export function shouldEscalateHealthClaimFlags(
  distinctFlaggerCount: number,
): boolean {
  return distinctFlaggerCount >= FORUM_HEALTH_CLAIM_ESCALATION_THRESHOLD
}
