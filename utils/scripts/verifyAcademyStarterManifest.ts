// utils/scripts/verifyAcademyStarterManifest.ts
//
// Kaizen from ai-art-academy/t-008's merge (kind_robots PR #358, 2026-07-17).
// The starter-image provenance manifest schema (workTitle, artist, artistDied,
// year, collection, accessionId, sourceUrl, license, licenseTermsUrl,
// retrievedDate) is defined in conductor's projects/ai-art-academy/
// PUBLIC-DOMAIN-POLICY.md §3. The manifest now lives on the external media
// origin rather than in Git, so this verifier reads the canonical media copy.
// Set MEDIA_ROOT for an offline filesystem-backed run, or MEDIA_ORIGIN to
// override the default public origin.
//
// Dependency-free on purpose: pure JSON + string assertions, no schema
// library, so it runs under bare `tsx` without the Nuxt/Prisma runtime.
// Shared field-list/license-enum check lives in academyProvenanceSchema.ts
// (ai-art-academy/t-028) so this and verifyAcademyExamplesManifest.ts
// validate the same schema instead of duplicating it by hand.
//
// Run: npm run test:academy-starter-manifest

import { validateProvenanceRecord } from './academyProvenanceSchema'
import {
  mediaSourceDescription,
  readMediaText,
} from './mediaContractSource'

const manifestRelativePath = 'academy/starters/starters.manifest.json'
const manifestSource = mediaSourceDescription(manifestRelativePath)

async function main(): Promise<void> {
  const raw = await readMediaText(manifestRelativePath)

  let entries: unknown
  try {
    entries = JSON.parse(raw)
  } catch (error) {
    console.error(
      `Academy starter manifest contract failed: ${manifestSource} is not valid JSON — ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
    process.exitCode = 1
    return
  }

  if (!Array.isArray(entries)) {
    console.error(
      `Academy starter manifest contract failed: ${manifestSource} must be a JSON array, got ${typeof entries}`,
    )
    process.exitCode = 1
    return
  }

  const errors: string[] = []

  entries.forEach((entry, index) => {
    const label =
      entry && typeof entry === 'object' && 'workTitle' in entry
        ? String((entry as Record<string, unknown>).workTitle)
        : `entry #${index}`

    if (!entry || typeof entry !== 'object') {
      errors.push(`${label}: entry is not an object`)
      return
    }
    const record = entry as Record<string, unknown>
    validateProvenanceRecord(record, label, errors)
  })

  if (errors.length) {
    console.error(
      `Academy starter manifest contract failed with ${errors.length} error(s):`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    `Academy starter manifest contract passed: ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} validated from ${manifestSource} against PUBLIC-DOMAIN-POLICY.md §3.`,
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
