// utils/scripts/academyCoverageContract.ts
//
// ai-art-academy/t-075: three Academy verifier scripts
// (verifyAcademyExamplesManifest.ts, verifyAcademyFailureModeCoverage.ts,
// verifyAcademyArtistPortraitsManifest.ts) each independently re-derived the
// same pattern — iterate every academyStyles.ts entry, check a per-style
// optional field, cross-reference an exceptions/coverage list, report
// bespoke-vs-fallback counts. Extracted per the same precedent as
// academyProvenanceSchema.ts (t-028): a small shared helper both existing
// verifiers (and the third one added after this task was filed) can adopt
// without changing their pass/fail behavior.
//
// Covers the two reusable pieces:
//   - loadExceptionsFile: read + parse + validate a JSON array of per-slug
//     exception entries into a Map<string, T>, with the same per-entry and
//     duplicate-key error reporting every verifier already hand-wrote.
//   - summarizeCoverage / findStaleExceptionSlugs: the covered/excepted/pct
//     arithmetic and the "exception names a style that no longer exists"
//     check every verifier already hand-wrote.
//
// Not covered (deliberately): each verifier's own per-field validation and
// cross-referencing against academyStyles.ts stays bespoke — that's the part
// that actually differs between "has exampleWorks", "has failureMode", and
// "artist has a portrait", and folding it into one generic shape would cost
// more clarity than the dedup is worth.

import { readFile } from 'node:fs/promises'
import { academyStyles } from '../../stores/seeds/academyStyles'

/** Every canonical style slug currently in academyStyles.ts. */
export const canonicalSlugs = new Set(academyStyles.map((style) => style.slug))

export interface ExceptionsFileResult<T> {
  bySlug: Map<string, T>
  errors: string[]
}

/**
 * Load a JSON array file of per-slug exception entries, validating each with
 * `isValid` (which must at least confirm a non-empty `slug` string) and
 * rejecting duplicate slugs. Mirrors the loader every verifier with an
 * exceptions file already hand-wrote for itself.
 */
export async function loadExceptionsFile<T extends { slug: string }>(
  url: URL,
  fileLabel: string,
  isValid: (value: unknown) => value is T,
): Promise<ExceptionsFileResult<T>> {
  const errors: string[] = []
  let raw: unknown
  try {
    raw = JSON.parse(await readFile(url, 'utf8'))
  } catch (error) {
    errors.push(
      `${fileLabel} is not valid JSON — ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
    raw = []
  }

  if (!Array.isArray(raw)) {
    errors.push(`${fileLabel} must be a JSON array, got ${typeof raw}`)
    raw = []
  }

  const bySlug = new Map<string, T>()
  for (const [index, candidate] of (raw as unknown[]).entries()) {
    if (!isValid(candidate)) {
      errors.push(`${fileLabel} entry #${index}: failed validation`)
      continue
    }
    if (bySlug.has(candidate.slug)) {
      errors.push(
        `${fileLabel}: duplicate exception entry for "${candidate.slug}"`,
      )
      continue
    }
    bySlug.set(candidate.slug, candidate)
  }

  return { bySlug, errors }
}

/**
 * Exception entries naming a slug that is no longer in academyStyles.ts are
 * stale bookkeeping, not a real gap — every verifier with an exceptions file
 * already flagged this so stale entries get cleaned up instead of silently
 * accumulating.
 */
export function findStaleExceptionSlugs(
  bySlug: Map<string, unknown>,
): string[] {
  return [...bySlug.keys()].filter((slug) => !canonicalSlugs.has(slug))
}

export interface CoverageSummary {
  total: number
  covered: number
  excepted: number
  pct: number
}

/**
 * Compute the covered/excepted/percentage summary every verifier logs on
 * success. `total` is the denominator (usually `canonicalSlugs.size`, but a
 * verifier counting a nested field — e.g. named artists rather than styles —
 * passes its own denominator).
 */
export function summarizeCoverage(
  total: number,
  covered: number,
  excepted = 0,
): CoverageSummary {
  const pct = total === 0 ? 100 : Math.round((covered / total) * 100)
  return { total, covered, excepted, pct }
}
