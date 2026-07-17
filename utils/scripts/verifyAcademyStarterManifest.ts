// utils/scripts/verifyAcademyStarterManifest.ts
//
// Kaizen from ai-art-academy/t-008's merge (kind_robots PR #358, 2026-07-17).
// The starter-image provenance manifest schema (workTitle, artist, artistDied,
// year, collection, accessionId, sourceUrl, license, licenseTermsUrl,
// retrievedDate) is defined in conductor's projects/ai-art-academy/
// PUBLIC-DOMAIN-POLICY.md §3 but was previously enforced only by hand at
// write time. This contract test validates every entry in
// public/images/academy/starters/starters.manifest.json against that
// required-field schema and the license enum, so a future edit can't
// silently drop a provenance field.
//
// Dependency-free on purpose: pure JSON + string assertions, no schema
// library, so it runs under bare `tsx` without the Nuxt/Prisma runtime.
//
// Run: npm run test:academy-starter-manifest

import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')
const manifestPath = resolve(
  repositoryRoot,
  'public/images/academy/starters/starters.manifest.json',
)

const REQUIRED_STRING_FIELDS = [
  'workTitle',
  'artist',
  'year',
  'collection',
  'accessionId',
  'sourceUrl',
  'license',
  'retrievedDate',
] as const

const VALID_LICENSES = ['CC0', 'PD-Mark', 'Open-Access-Terms'] as const
type ValidLicense = (typeof VALID_LICENSES)[number]

function isValidLicense(value: unknown): value is ValidLicense {
  return (
    typeof value === 'string' &&
    (VALID_LICENSES as readonly string[]).includes(value)
  )
}

async function main(): Promise<void> {
  const raw = await readFile(manifestPath, 'utf8')

  let entries: unknown
  try {
    entries = JSON.parse(raw)
  } catch (error) {
    console.error(
      `Academy starter manifest contract failed: ${manifestPath} is not valid JSON — ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
    process.exitCode = 1
    return
  }

  if (!Array.isArray(entries)) {
    console.error(
      `Academy starter manifest contract failed: ${manifestPath} must be a JSON array, got ${typeof entries}`,
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

    for (const field of REQUIRED_STRING_FIELDS) {
      const value = record[field]
      if (typeof value !== 'string' || value.trim() === '') {
        errors.push(`${label}: missing or empty required field "${field}"`)
      }
    }

    // artistDied is a required field per PUBLIC-DOMAIN-POLICY.md §3, but is
    // numeric (a year), not a string.
    if (
      typeof record.artistDied !== 'number' ||
      !Number.isFinite(record.artistDied)
    ) {
      errors.push(
        `${label}: missing or non-numeric required field "artistDied"`,
      )
    }

    const license = record.license
    if (typeof license === 'string' && !isValidLicense(license)) {
      errors.push(
        `${label}: invalid license "${license}" — must be one of ${VALID_LICENSES.join(', ')}`,
      )
    }

    if (license === 'Open-Access-Terms') {
      const termsUrl = record.licenseTermsUrl
      if (typeof termsUrl !== 'string' || termsUrl.trim() === '') {
        errors.push(
          `${label}: license "Open-Access-Terms" requires a non-empty "licenseTermsUrl"`,
        )
      }
    }
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
    `Academy starter manifest contract passed: ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} validated against PUBLIC-DOMAIN-POLICY.md §3.`,
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
