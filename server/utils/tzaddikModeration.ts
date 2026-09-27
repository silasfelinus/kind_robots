// /server/utils/tzaddikModeration.ts
//
// tzaddik-gallery/t-008: admin approve/archive + explicit content overrides
// for a TzaddikCandidate. Mirrors the shared-util/thin-route split used by
// server/utils/socialPostDraft.ts (approveSocialPostDraft/rejectSocialPostDraft).
//
// Overrides never touch the sourced columns (displayName/biography/rationale/
// objections/imageFileUrl) -- only the *Override sibling columns t-003 already
// added to the schema. Setting an override field to `null` clears it and
// reverts display to the sourced value; a non-null string replaces it. Every
// override write stamps overrideUpdatedByUserId/overrideUpdatedAt so the
// edited state stays inspectable (who changed it, when, and why via
// overrideNote) without a separate audit table -- the source columns
// themselves are the "original" half of that inspection.
import prisma from './prisma'
import type { TzaddikCandidate } from '~/prisma/generated/prisma/client'

export class TzaddikCandidateNotFoundError extends Error {
  constructor(id: number) {
    super(`Tzaddik candidate #${id} not found.`)
    this.name = 'TzaddikCandidateNotFoundError'
  }
}

export class TzaddikCandidateStateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TzaddikCandidateStateError'
  }
}

const APPROVABLE_FROM = new Set(['PENDING', 'ARCHIVED'])
const ARCHIVABLE_FROM = new Set(['PENDING', 'APPROVED'])

/**
 * Approves a candidate: PENDING (the normal path) or ARCHIVED (restoring a
 * previously archived entry) -> APPROVED. Stamps the schema's existing
 * `acceptedByUserId` column, which t-006 reserved but never wrote.
 */
export async function approveTzaddikCandidate(
  id: number,
  adminUserId: number,
): Promise<TzaddikCandidate> {
  const candidate = await prisma.tzaddikCandidate.findUnique({ where: { id } })
  if (!candidate) throw new TzaddikCandidateNotFoundError(id)

  if (!APPROVABLE_FROM.has(candidate.curationState)) {
    throw new TzaddikCandidateStateError(
      `Tzaddik candidate #${id} is already APPROVED.`,
    )
  }

  return prisma.tzaddikCandidate.update({
    where: { id },
    data: { curationState: 'APPROVED', acceptedByUserId: adminUserId },
    include: { Tags: true },
  })
}

/**
 * Archives a candidate: PENDING (rejecting a submission) or APPROVED (retiring
 * a live entry) -> ARCHIVED. Unlike the social-post-draft pipeline's one-shot
 * terminal states, archiving here is not final -- approveTzaddikCandidate can
 * restore an ARCHIVED row. Takes no adminUserId: unlike approve's
 * acceptedByUserId, the schema has no dedicated "archivedBy" column, and the
 * admin's identity is captured in the audit log entry the route writes instead.
 */
export async function archiveTzaddikCandidate(
  id: number,
): Promise<TzaddikCandidate> {
  const candidate = await prisma.tzaddikCandidate.findUnique({ where: { id } })
  if (!candidate) throw new TzaddikCandidateNotFoundError(id)

  if (!ARCHIVABLE_FROM.has(candidate.curationState)) {
    throw new TzaddikCandidateStateError(
      `Tzaddik candidate #${id} is already ARCHIVED.`,
    )
  }

  return prisma.tzaddikCandidate.update({
    where: { id },
    data: { curationState: 'ARCHIVED' },
    include: { Tags: true },
  })
}

export type TzaddikOverrideInput = {
  displayNameOverride?: string | null
  biographyOverride?: string | null
  rationaleOverride?: string | null
  objectionsOverride?: string | null
  imageUrlOverride?: string | null
  overrideNote?: string | null
}

const OVERRIDE_FIELDS: Array<keyof TzaddikOverrideInput> = [
  'displayNameOverride',
  'biographyOverride',
  'rationaleOverride',
  'objectionsOverride',
  'imageUrlOverride',
  'overrideNote',
]

/** True only when the input actually names at least one override field --
 * an empty `{}` body would otherwise silently "succeed" while changing
 * nothing and stamping a fresh overrideUpdatedAt for no reason. */
export function hasAnyOverrideField(input: TzaddikOverrideInput): boolean {
  return OVERRIDE_FIELDS.some((field) => field in input)
}

/**
 * Writes explicit content overrides. Only fields present as keys on `input`
 * are touched -- omit a field to leave it exactly as it was, pass `null` to
 * clear it back to the sourced value, pass a string to override it. Never
 * writes to the sourced columns (displayName/biography/rationale/objections/
 * imageFileUrl), so the original + provenance stay intact and inspectable
 * alongside whatever is overridden.
 */
export async function overrideTzaddikCandidate(
  id: number,
  adminUserId: number,
  input: TzaddikOverrideInput,
): Promise<TzaddikCandidate> {
  const candidate = await prisma.tzaddikCandidate.findUnique({ where: { id } })
  if (!candidate) throw new TzaddikCandidateNotFoundError(id)

  const data: Record<string, string | number | Date | null> = {}
  for (const field of OVERRIDE_FIELDS) {
    if (field in input) {
      data[field] = input[field] ?? null
    }
  }

  data.overrideUpdatedByUserId = adminUserId
  data.overrideUpdatedAt = new Date()

  return prisma.tzaddikCandidate.update({
    where: { id },
    data,
    include: { Tags: true },
  })
}
