// /server/api/tzaddik/import.post.ts
//
// Admin-only bulk seed import (tzaddik-gallery/t-009): creates
// already-APPROVED candidates directly from an explicitly-accepted seed set
// (e.g. projects/tzaddik-gallery/seed-sets.yaml), preserving suggestedBy/
// acceptedByUserId attribution a community submission can't carry --
// index.post.ts's suggestedBy is always derived from the authenticated
// submitter, which can't represent a non-user attribution like
// "llm-daily-discovery". Every entry's living/memorial status and
// Wikipedia/Wikimedia provenance is refreshed live at import time via
// fetchTzaddikSource, never trusted from caller-supplied metadata. Partial
// batches are expected: one bad fetch or a duplicate wikipediaUrl reports a
// per-item result rather than failing the whole call.
import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdminApiUser } from '../../utils/authGuard'
import { errorHandler } from '../../utils/error'
import { logAdminAction } from '../../utils/audit'
import prisma from '../../utils/prisma'
import { slugify } from '../../../utils/slugify'
import {
  fetchTzaddikSource,
  TzaddikSourceFetchError,
} from '../../utils/tzaddikSourceRefresh'
import { TzaddikEditorialTag } from '~/prisma/generated/prisma/client'
import { findTzaddikBlacklistEntry } from '../../../utils/tzaddikBlacklist'

type ImportCandidate = {
  displayName?: unknown
  wikipediaUrl?: unknown
  rationale?: unknown
  objections?: unknown
  objectionsSourceUrl?: unknown
  suggestedBy?: unknown
  acceptedByUserId?: unknown
  countryCode?: unknown
  region?: unknown
  tags?: unknown
}

type ImportBody = { candidates?: unknown }

type ImportResult =
  | { displayName: string; status: 'created'; id: number; lifeState: string }
  | { displayName: string; status: 'skipped'; reason: string; id: number }
  | { displayName: string; status: 'failed'; reason: string }

function toTrimmedString(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function toOptionalTrimmedString(
  value: unknown,
  maxLength: number,
): string | null {
  const trimmed = toTrimmedString(value, maxLength)
  return trimmed || null
}

function toPositiveId(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function isWikipediaUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      /(^|\.)wikipedia\.org$/i.test(url.hostname)
    )
  } catch {
    return false
  }
}

function toTagList(value: unknown): TzaddikEditorialTag[] {
  if (!Array.isArray(value)) return []
  const valid = new Set(Object.values(TzaddikEditorialTag))
  const tags = new Set<TzaddikEditorialTag>()
  for (const item of value) {
    if (typeof item === 'string' && valid.has(item as TzaddikEditorialTag)) {
      tags.add(item as TzaddikEditorialTag)
    }
  }
  return [...tags]
}

async function reserveUniqueCandidateSlug(base: string): Promise<string> {
  const seed = slugify(base) || 'candidate'
  let slug = seed.slice(0, 255)
  let suffix = 2

  while (
    await prisma.tzaddikCandidate.findUnique({
      where: { slug },
      select: { id: true },
    })
  ) {
    const suffixText = `-${suffix}`
    slug = `${seed.slice(0, 255 - suffixText.length)}${suffixText}`
    suffix += 1
  }

  return slug
}

export default defineEventHandler(async (event) => {
  try {
    const { user: admin } = await requireAdminApiUser(event)

    const body = await readBody<ImportBody>(event)
    if (!Array.isArray(body?.candidates) || body.candidates.length === 0) {
      throw createError({
        statusCode: 400,
        message: '"candidates" must be a non-empty array.',
      })
    }

    const results: ImportResult[] = []

    for (const raw of body.candidates as ImportCandidate[]) {
      const displayName = toTrimmedString(raw?.displayName, 255)
      const wikipediaUrl = toTrimmedString(raw?.wikipediaUrl, 2048)
      const rationale = toTrimmedString(raw?.rationale, 65535)

      if (
        !displayName ||
        !rationale ||
        !wikipediaUrl ||
        !isWikipediaUrl(wikipediaUrl)
      ) {
        results.push({
          displayName: displayName || '(missing displayName)',
          status: 'failed',
          reason:
            'displayName, rationale, and a valid wikipediaUrl are all required.',
        })
        continue
      }

      const blacklisted = findTzaddikBlacklistEntry(displayName)
      if (blacklisted) {
        results.push({
          displayName,
          status: 'failed',
          reason: `${blacklisted.name} is on the Tzaddikim blacklist.`,
        })
        continue
      }

      const existing = await prisma.tzaddikCandidate.findFirst({
        where: { wikipediaUrl },
        select: { id: true, curationState: true },
      })
      // An accepted seed that the discovery pool already suggested (PENDING)
      // is promoted rather than skipped; skipping it left the seed missing
      // from the gallery and failed the bootstrap's verification step.
      if (existing?.curationState === 'PENDING') {
        await prisma.tzaddikCandidate.update({
          where: { id: existing.id },
          data: {
            curationState: 'APPROVED',
            acceptedByUserId: toPositiveId(raw?.acceptedByUserId) ?? admin.id,
          },
        })
        results.push({
          displayName,
          status: 'skipped',
          reason: 'Promoted the existing pending candidate to APPROVED.',
          id: existing.id,
        })
        continue
      }
      if (existing) {
        results.push({
          displayName,
          status: 'skipped',
          reason: 'A candidate with this wikipediaUrl already exists.',
          id: existing.id,
        })
        continue
      }

      let source
      try {
        source = await fetchTzaddikSource(wikipediaUrl)
      } catch (error) {
        results.push({
          displayName,
          status: 'failed',
          reason:
            error instanceof TzaddikSourceFetchError
              ? error.message
              : 'Live source refresh failed.',
        })
        continue
      }

      const slug = await reserveUniqueCandidateSlug(displayName)
      const acceptedByUserId = toPositiveId(raw?.acceptedByUserId) ?? admin.id
      const tags = toTagList(raw?.tags)

      const candidate = await prisma.tzaddikCandidate.create({
        data: {
          displayName,
          slug,
          lifeState: source.lifeState,
          deathDate: source.deathDate,
          rationale,
          biography: source.biography,
          objections: toOptionalTrimmedString(raw?.objections, 65535),
          objectionsSourceUrl: toOptionalTrimmedString(
            raw?.objectionsSourceUrl,
            2048,
          ),
          wikipediaUrl,
          wikipediaPageId: source.wikipediaPageId,
          wikipediaRevisionId: source.wikipediaRevisionId,
          sourceSnapshotJson: source.sourceSnapshotJson,
          sourceCheckedAt: source.sourceCheckedAt,
          imageSourceUrl: source.imageSourceUrl,
          imageFileUrl: source.imageFileUrl,
          imageLicense: source.imageLicense,
          imageAttribution: source.imageAttribution,
          imageRevisionId: source.imageRevisionId,
          countryCode: toOptionalTrimmedString(raw?.countryCode, 2),
          region: toOptionalTrimmedString(raw?.region, 128),
          curationState: 'APPROVED',
          suggestedBy: toOptionalTrimmedString(raw?.suggestedBy, 255),
          acceptedByUserId,
          Tags: tags.length
            ? { create: tags.map((tag) => ({ tag })) }
            : undefined,
        },
      })

      results.push({
        displayName,
        status: 'created',
        id: candidate.id,
        lifeState: candidate.lifeState,
      })
    }

    const createdCount = results.filter((r) => r.status === 'created').length
    await logAdminAction(
      admin,
      `Imported ${createdCount}/${results.length} Tzaddik candidates via bulk seed import.`,
    )

    return {
      success: true,
      message: `Imported ${createdCount}/${results.length} candidates.`,
      data: results,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to import Tzaddik candidates.',
      statusCode: event.node.res.statusCode,
    }
  }
})
