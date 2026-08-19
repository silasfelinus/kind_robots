// /server/utils/socialPostDraft.ts
//
// kind-economy/t-025: the labelled-AI social content pipeline, v1
// (draft-only, human-approved). Silas's own framing (roadmap, verbatim):
// "I originally had so many ideas about generating social media
// personalities for Amibot to create posts/tweets, etc to raise money. I
// was dissuaded because of the significant amount of pushback against ai.
// This should be done responsibly... wiring up a route for our daily agent
// work to create content, clearly marked as ai, to the various popular
// sites, working towards fund raising."
//
// FIVE HARD RULES THIS FILE EXISTS TO ENFORCE (not just follow):
//
//  1. AMI posts AS AMI -- a clearly-labelled AI character with a stated
//     fundraising purpose, never a synthetic persona presenting as human.
//     disclosureLabelFor() below has no override parameter and always
//     returns a non-empty string; buildSocialPostDraftInput() is the only
//     function that builds a SocialPostDraft-shaped object and it always
//     calls disclosureLabelFor() internally. There is no code path to
//     construct a draft input with a blank or missing disclosure --
//     assertValidSocialPostDraftInput() is the runtime backstop if some
//     future caller ever tries to build one by hand.
//  2. Draft-only. This file writes DRAFT rows and can move a row to
//     APPROVED or REJECTED (an admin decision). It contains no function that
//     calls any external platform API and no function that sets any status
//     other than DRAFT, APPROVED, or REJECTED -- the schema's
//     SocialPostDraftStatus enum literally has no fourth value.
//  3. Disclosure on every item. Every generated bodyText already has the
//     disclosure sentence composed into it (composeAmiPostText), in
//     addition to the dedicated disclosureLabel column the UI shows
//     prominently -- belt and suspenders.
//  4. A volume ceiling. isWithinDailyApprovalCeiling() is a hard cap the
//     approve route (server/api/social/drafts/[id]/approve.post.ts) checks
//     server-side before flipping a draft to APPROVED -- not a UI hint.
//  5. No live account, no stored credentials, no outbound call to a real
//     social platform API anywhere in this file or its callers. That is
//     kind-economy/t-026, a separate, later, explicitly-gated task.
//
// Split follows this repo's established pure/DB convention (see
// server/utils/creatorEarnings.ts and server/utils/revenueSplit.ts): pure,
// dependency-free logic first (unit-tested in
// utils/scripts/verifySocialPostDraft.test.ts, no prisma, no database), a
// database-touching half below it.
import prisma from './prisma'
import type {
  ManaAttributionSource,
  SocialPlatform,
  SocialPostDraftStatus,
} from '~/prisma/generated/prisma/client'

// ---------------------------------------------------------------------------
// Pure types + logic -- no prisma, no database, unit-testable in isolation.
// ---------------------------------------------------------------------------

/** v1 only ever populates BLUESKY and INSTAGRAM -- see SocialPlatform's doc
 * in prisma/schema.prisma for why Mastodon/X/TikTok are not modeled yet. */
export const SOCIAL_PLATFORMS_V1: SocialPlatform[] = ['BLUESKY', 'INSTAGRAM']

/** v1 only ever generates drafts from daily-dream content. */
export const SOCIAL_DRAFT_SOURCE_TYPE: ManaAttributionSource = 'DREAM'

/**
 * The platform's native AI-content disclosure label, where research
 * (projects/kind-economy/research/social-platform-policy.md) found a
 * first-class one. Instagram has Meta's "AI info" label. Bluesky has no
 * native PER-POST content label (only an account-level "Automated"
 * self-label, which is a profile setting, not something this pipeline can
 * stamp onto a single post) -- so Bluesky always uses the fallback string.
 */
const NATIVE_DISCLOSURE_LABELS: Partial<Record<SocialPlatform, string>> = {
  INSTAGRAM: 'AI info',
}

/** Used whenever a platform has no native per-post AI-content label. Also
 * the hard fallback if NATIVE_DISCLOSURE_LABELS ever somehow held an empty
 * string -- this function must NEVER return '' or whitespace. */
export const FALLBACK_DISCLOSURE_LABEL =
  'AI-generated content, posted by AMI for the Against Malaria fundraiser.'

/**
 * Rule #1's enforcement point. No parameters beyond `platform`, no override
 * -- there is no way to call this and get back an empty label. Every
 * SocialPostDraft's disclosureLabel column is populated exclusively from
 * this function's return value.
 */
export function disclosureLabelFor(platform: SocialPlatform): string {
  const native = NATIVE_DISCLOSURE_LABELS[platform]
  const label = native && native.trim() ? native : FALLBACK_DISCLOSURE_LABEL
  return label.trim() ? label : FALLBACK_DISCLOSURE_LABEL
}

/** Conservative per-platform character budgets for the composed post body.
 * Bluesky's post limit is 300 graphemes; Instagram captions can run much
 * longer, capped here well under Instagram's actual ~2200-char limit to
 * leave room for hashtags a human reviewer may add before it ever posts
 * (which, in this task's scope, is never -- v1 is draft-only). */
const PLATFORM_BODY_CHAR_LIMITS: Record<SocialPlatform, number> = {
  BLUESKY: 300,
  INSTAGRAM: 2000,
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  if (maxLength <= 1) return text.slice(0, Math.max(0, maxLength))
  return `${text.slice(0, maxLength - 1).trimEnd()}…`
}

/**
 * Composes the full post body for a piece of daily-dream content, ALWAYS
 * ending with the disclosure sentence -- so even a caller that only reads
 * `bodyText` (and never separately surfaces `disclosureLabel`) still ships
 * a disclosed post. This is the only function in this file that produces a
 * SocialPostDraft's `bodyText`.
 */
export function composeAmiPostText(
  content: { title: string; text: string },
  platform: SocialPlatform,
): string {
  const disclosure = disclosureLabelFor(platform)
  const suffix = `\n\n[${disclosure}] Posted by AMI for the Against Malaria fundraiser: againstmalaria.com/amibot`
  const limit = PLATFORM_BODY_CHAR_LIMITS[platform]
  const availableForCore = Math.max(0, limit - suffix.length)

  const core = `${content.title.trim()}: ${content.text.trim()}`.trim()
  const truncatedCore =
    availableForCore <= 0 ? '' : truncate(core, availableForCore)

  // If the disclosure suffix alone doesn't fit the platform's limit (should
  // never happen at today's limits, but this must degrade safely rather
  // than silently drop the disclosure), the disclosure wins and the core
  // text is dropped rather than the other way around.
  if (truncatedCore.length === 0) return truncate(suffix.trim(), limit)

  return `${truncatedCore}${suffix}`
}

/** One piece of candidate daily-dream content this pipeline can consider. */
export type DailyDreamDraftCandidate = {
  sourceId: number
  title: string
  /** The written content (pitch/hook/subtitle) -- eligibility requires this
   * to be present and non-blank. */
  text: string | null
  /** The linked art image URL -- eligibility requires this to be present. */
  artImageUrl: string | null
  /** Platforms this sourceId already has a SocialPostDraft row for, any
   * status -- used to prevent re-queuing the same content twice. */
  alreadyQueuedPlatforms: SocialPlatform[]
}

/**
 * Pure eligibility check: a piece of daily-dream content is eligible to
 * become a draft for `platform` only if it has both real written text and
 * linked art, and isn't already queued for that platform.
 */
export function isEligibleForSocialDraft(
  content: DailyDreamDraftCandidate,
  platform: SocialPlatform,
): boolean {
  if (!content.text || !content.text.trim()) return false
  if (!content.artImageUrl || !content.artImageUrl.trim()) return false
  if (content.alreadyQueuedPlatforms.includes(platform)) return false
  return true
}

export type SocialPostDraftInput = {
  platform: SocialPlatform
  sourceType: ManaAttributionSource
  sourceId: number
  bodyText: string
  disclosureLabel: string
  mediaUrl: string | null
  status: SocialPostDraftStatus
}

/**
 * The one function that builds a SocialPostDraft-shaped object. Always
 * populates disclosureLabel via disclosureLabelFor() (rule #1) and always
 * sets status to 'DRAFT' (rule #2) -- there is no parameter to override
 * either. Caller must have already confirmed eligibility via
 * isEligibleForSocialDraft().
 */
export function buildSocialPostDraftInput(
  content: DailyDreamDraftCandidate,
  platform: SocialPlatform,
): SocialPostDraftInput {
  if (!content.text || !content.text.trim()) {
    throw new Error(
      'buildSocialPostDraftInput: content.text is required -- check isEligibleForSocialDraft() first.',
    )
  }

  const disclosureLabel = disclosureLabelFor(platform)
  const bodyText = composeAmiPostText(
    { title: content.title, text: content.text },
    platform,
  )

  return {
    platform,
    sourceType: SOCIAL_DRAFT_SOURCE_TYPE,
    sourceId: content.sourceId,
    bodyText,
    disclosureLabel,
    mediaUrl: content.artImageUrl,
    status: 'DRAFT',
  }
}

/**
 * Runtime backstop for rule #1, in case a draft input is ever assembled by
 * hand instead of through buildSocialPostDraftInput(). Throws rather than
 * silently coercing, since a silent coercion here is exactly the "flip a
 * config value" failure mode rule #1 exists to prevent.
 */
export function assertValidSocialPostDraftInput(
  draft: SocialPostDraftInput,
): void {
  if (!draft.disclosureLabel || !draft.disclosureLabel.trim()) {
    throw new Error(
      'SocialPostDraft.disclosureLabel must never be empty -- AI disclosure is structurally required (kind-economy/t-025).',
    )
  }
  if (!SOCIAL_PLATFORMS_V1.includes(draft.platform)) {
    throw new Error(
      `SocialPostDraft.platform "${draft.platform}" is not a v1-wired platform (${SOCIAL_PLATFORMS_V1.join(', ')}).`,
    )
  }
  if (draft.status !== 'DRAFT') {
    throw new Error(
      `SocialPostDraft rows may only be created with status DRAFT, got "${draft.status}".`,
    )
  }
}

/**
 * Conservative default volume ceiling: approved posts per platform per UTC
 * calendar day. Judgment call (no prior convention to mirror) -- picked at
 * the low end of the task brief's suggested 3-5 range because the failure
 * mode this guards against (an AI-labelled charity account reading as spam)
 * is worse than under-posting. Raising it is a deliberate future change,
 * not a config flip -- it is a literal source constant, not read from any
 * env var or admin-settable field, so nothing in this pipeline (including
 * the admin UI) can raise it at runtime.
 */
export const DAILY_APPROVAL_CEILING_PER_PLATFORM = 3

/** True if approving one more draft for this platform today would stay at
 * or under the ceiling. `alreadyApprovedToday` must be the count of
 * SocialPostDraft rows for this platform whose reviewedAt falls within
 * today's UTC calendar day and whose status is APPROVED. */
export function isWithinDailyApprovalCeiling(
  alreadyApprovedToday: number,
): boolean {
  return alreadyApprovedToday < DAILY_APPROVAL_CEILING_PER_PLATFORM
}

/** Start of the UTC calendar day containing `date`, used as the lower bound
 * for "today's approvals" queries. Injectable `date` keeps this
 * deterministic under test. */
export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  )
}

/** Start of the next UTC calendar day after `date` -- the exclusive upper
 * bound paired with startOfUtcDay() for a "today" range query. */
export function startOfNextUtcDay(date: Date): Date {
  const start = startOfUtcDay(date)
  return new Date(start.getTime() + 24 * 60 * 60 * 1000)
}

/**
 * Given a batch of candidate daily-dream content, returns the
 * SocialPostDraft inputs that should be created -- one per (content,
 * platform) pair that passes isEligibleForSocialDraft(), across every v1
 * platform. Pure: takes the candidates as plain data, returns plain data,
 * makes no database calls itself.
 */
export function planSocialDraftsForCandidates(
  candidates: DailyDreamDraftCandidate[],
  platforms: SocialPlatform[] = SOCIAL_PLATFORMS_V1,
): SocialPostDraftInput[] {
  const planned: SocialPostDraftInput[] = []

  for (const candidate of candidates) {
    for (const platform of platforms) {
      if (!isEligibleForSocialDraft(candidate, platform)) continue
      const input = buildSocialPostDraftInput(candidate, platform)
      assertValidSocialPostDraftInput(input)
      planned.push(input)
    }
  }

  return planned
}

// ---------------------------------------------------------------------------
// Database-touching half. Not covered by the pure unit test (no live
// database in the verification sandbox) -- same documented split as
// getCreatorEarnings() in creatorEarnings.ts.
// ---------------------------------------------------------------------------

const dailyDreamCandidateWhere = {
  dreamType: 'PITCH' as const,
  isActive: true,
  isPublic: true,
  isMature: false,
  OR: [
    { designer: 'dream-cycle', PitchSheet: { isNot: null } },
    { designer: 'Daily Dream Facet Engine' },
    { slug: { startsWith: 'daily-dream-' } },
  ],
}

/**
 * Pulls the most recent daily-dream Dream rows (same eligibility criteria
 * as server/api/dreams/daily-archive.get.ts's public archive query), turns
 * each into a DailyDreamDraftCandidate, and creates any missing DRAFT rows
 * for the v1 platform set. Never touches an existing row and never calls
 * any external API -- this only ever writes new DRAFT rows to this app's
 * own database. Relies on the @@unique([platform, sourceType, sourceId])
 * constraint (createMany + skipDuplicates) as the DB-level backstop against
 * double-queuing, in addition to the pure eligibility check.
 */
export async function populateSocialDraftsFromDailyDreams(options?: {
  take?: number
}): Promise<{ scanned: number; created: number; skipped: number }> {
  const take = options?.take ?? 25

  const dreams = await prisma.dream.findMany({
    where: dailyDreamCandidateWhere,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take,
    select: {
      id: true,
      title: true,
      pitch: true,
      imagePath: true,
      PitchSheet: { select: { pitch: true, hook: true, subtitle: true } },
      ArtImage: { select: { imagePath: true, path: true } },
      ArtImages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        select: { imagePath: true, path: true },
      },
    },
  })

  if (dreams.length === 0) return { scanned: 0, created: 0, skipped: 0 }

  const existing = await prisma.socialPostDraft.findMany({
    where: {
      sourceType: SOCIAL_DRAFT_SOURCE_TYPE,
      sourceId: { in: dreams.map((dream) => dream.id) },
    },
    select: { platform: true, sourceId: true },
  })
  const queuedByDream = new Map<number, SocialPlatform[]>()
  for (const row of existing) {
    const list = queuedByDream.get(row.sourceId) ?? []
    list.push(row.platform)
    queuedByDream.set(row.sourceId, list)
  }

  const candidates: DailyDreamDraftCandidate[] = dreams.map((dream) => {
    const text =
      dream.PitchSheet?.pitch ||
      dream.pitch ||
      dream.PitchSheet?.hook ||
      dream.PitchSheet?.subtitle ||
      null
    const artImageUrl =
      dream.ArtImage?.imagePath ||
      dream.ArtImage?.path ||
      dream.ArtImages[0]?.imagePath ||
      dream.ArtImages[0]?.path ||
      dream.imagePath ||
      null

    return {
      sourceId: dream.id,
      title: dream.title,
      text,
      artImageUrl,
      alreadyQueuedPlatforms: queuedByDream.get(dream.id) ?? [],
    }
  })

  const planned = planSocialDraftsForCandidates(candidates)

  if (planned.length === 0) {
    return { scanned: dreams.length, created: 0, skipped: 0 }
  }

  const result = await prisma.socialPostDraft.createMany({
    data: planned,
    skipDuplicates: true,
  })

  return {
    scanned: dreams.length,
    created: result.count,
    skipped: planned.length - result.count,
  }
}

export type SocialPostDraftListFilter = {
  status?: SocialPostDraftStatus
  platform?: SocialPlatform
}

export async function listSocialPostDrafts(filter: SocialPostDraftListFilter) {
  return prisma.socialPostDraft.findMany({
    where: {
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.platform ? { platform: filter.platform } : {}),
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 200,
  })
}

/** Count of APPROVED rows for `platform` whose reviewedAt falls within
 * today's UTC calendar day -- the live number isWithinDailyApprovalCeiling
 * is checked against. */
export async function countApprovedToday(
  platform: SocialPlatform,
  now: Date = new Date(),
): Promise<number> {
  return prisma.socialPostDraft.count({
    where: {
      platform,
      status: 'APPROVED',
      reviewedAt: { gte: startOfUtcDay(now), lt: startOfNextUtcDay(now) },
    },
  })
}

export class SocialDraftCeilingError extends Error {
  constructor(platform: SocialPlatform) {
    super(
      `Daily approval ceiling reached for ${platform} (${DAILY_APPROVAL_CEILING_PER_PLATFORM}/day). Try again tomorrow.`,
    )
    this.name = 'SocialDraftCeilingError'
  }
}

export class SocialDraftNotFoundError extends Error {
  constructor(id: number) {
    super(`SocialPostDraft #${id} not found.`)
    this.name = 'SocialDraftNotFoundError'
  }
}

export class SocialDraftNotPendingError extends Error {
  constructor(id: number, status: SocialPostDraftStatus) {
    super(`SocialPostDraft #${id} is already ${status}, not DRAFT.`)
    this.name = 'SocialDraftNotPendingError'
  }
}

/**
 * Approves a draft: sets status APPROVED and stamps reviewedBy/reviewedAt.
 * Enforces the volume ceiling server-side (rule #4) -- throws
 * SocialDraftCeilingError rather than writing when the platform's daily cap
 * is already reached. There is nothing downstream of APPROVED in this
 * task's scope: no queue, no scheduler, no outbound call is triggered here
 * or anywhere else.
 */
export async function approveSocialPostDraft(
  id: number,
  adminUserId: number,
  now: Date = new Date(),
) {
  const draft = await prisma.socialPostDraft.findUnique({ where: { id } })
  if (!draft) throw new SocialDraftNotFoundError(id)
  if (draft.status !== 'DRAFT') {
    throw new SocialDraftNotPendingError(id, draft.status)
  }

  const approvedToday = await countApprovedToday(draft.platform, now)
  if (!isWithinDailyApprovalCeiling(approvedToday)) {
    throw new SocialDraftCeilingError(draft.platform)
  }

  return prisma.socialPostDraft.update({
    where: { id },
    data: { status: 'APPROVED', reviewedBy: adminUserId, reviewedAt: now },
  })
}

/** Rejects a draft: sets status REJECTED and stamps reviewedBy/reviewedAt.
 * Never subject to the volume ceiling -- rejecting can't cause spam. */
export async function rejectSocialPostDraft(
  id: number,
  adminUserId: number,
  now: Date = new Date(),
) {
  const draft = await prisma.socialPostDraft.findUnique({ where: { id } })
  if (!draft) throw new SocialDraftNotFoundError(id)
  if (draft.status !== 'DRAFT') {
    throw new SocialDraftNotPendingError(id, draft.status)
  }

  return prisma.socialPostDraft.update({
    where: { id },
    data: { status: 'REJECTED', reviewedBy: adminUserId, reviewedAt: now },
  })
}

/** Today's approved-count-vs-ceiling for every v1 platform -- the shape the
 * admin UI's "3/3 approved today" indicator reads. */
export async function getDailyApprovalCeilingStatus(
  now: Date = new Date(),
): Promise<
  Array<{ platform: SocialPlatform; approvedToday: number; ceiling: number }>
> {
  const rows = await Promise.all(
    SOCIAL_PLATFORMS_V1.map(async (platform) => ({
      platform,
      approvedToday: await countApprovedToday(platform, now),
      ceiling: DAILY_APPROVAL_CEILING_PER_PLATFORM,
    })),
  )
  return rows
}
