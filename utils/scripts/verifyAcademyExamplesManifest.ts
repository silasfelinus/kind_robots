// utils/scripts/verifyAcademyExamplesManifest.ts
//
// ai-art-academy/t-013: the curriculum "Example works" strip needs the same
// provenance discipline as the starter-image library (see
// verifyAcademyStarterManifest.ts and conductor's PUBLIC-DOMAIN-POLICY.md
// §3), plus one more invariant specific to example works: academyStyles.ts is
// the canonical metadata copy and the external examples manifest is its media
// mirror. This contract fails CI if either goes stale relative to the other or
// if a referenced media asset is missing.
//
// Set MEDIA_ROOT for an offline filesystem-backed run, or MEDIA_ORIGIN to
// override the default public origin.
//
// Run: npm run test:academy-examples-manifest

import { academyStyles } from '../../stores/seeds/academyStyles'
import { validateProvenanceRecord } from './academyProvenanceSchema'
import {
  imageSrcToMediaPath,
  mediaAssetExists,
  mediaSourceDescription,
  readMediaText,
  repositoryFileToMediaPath,
} from './mediaContractSource'

const manifestRelativePath = 'academy/examples/examples.manifest.json'
const manifestSource = mediaSourceDescription(manifestRelativePath)

// This manifest carries two fields beyond the shared provenance schema:
// `movement` (join key to academyStyles.ts) and `file` (legacy repo-style path).
const REQUIRED_OWN_STRING_FIELDS = ['movement', 'file'] as const

async function main(): Promise<void> {
  const raw = await readMediaText(manifestRelativePath)

  let entries: unknown
  try {
    entries = JSON.parse(raw)
  } catch (error) {
    console.error(
      `Academy examples manifest contract failed: ${manifestSource} is not valid JSON — ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
    process.exitCode = 1
    return
  }

  if (!Array.isArray(entries)) {
    console.error(
      `Academy examples manifest contract failed: ${manifestSource} must be a JSON array, got ${typeof entries}`,
    )
    process.exitCode = 1
    return
  }

  const errors: string[] = []
  const manifestImageSrcByMovement = new Map<string, string>()

  for (const [index, entry] of entries.entries()) {
    const label =
      entry && typeof entry === 'object' && 'workTitle' in entry
        ? String((entry as Record<string, unknown>).workTitle)
        : `entry #${index}`

    if (!entry || typeof entry !== 'object') {
      errors.push(`${label}: entry is not an object`)
      continue
    }
    const record = entry as Record<string, unknown>

    for (const field of REQUIRED_OWN_STRING_FIELDS) {
      const value = record[field]
      if (typeof value !== 'string' || value.trim() === '') {
        errors.push(`${label}: missing or empty required field "${field}"`)
      }
    }
    validateProvenanceRecord(record, label, errors)

    const file = typeof record.file === 'string' ? record.file : null
    if (!file) continue

    try {
      const mediaPath = repositoryFileToMediaPath(file)
      if (!(await mediaAssetExists(mediaPath))) {
        errors.push(
          `${label}: referenced media asset does not exist: ${mediaSourceDescription(mediaPath)}`,
        )
      }
      if (typeof record.movement === 'string') {
        manifestImageSrcByMovement.set(record.movement, `/images/${mediaPath}`)
      }
    } catch (error) {
      errors.push(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  // Cross-check against the canonical copy in academyStyles.ts — the external
  // manifest is a generated mirror and must not drift from it (t-013).
  const seedImageSrcByMovement = new Map<string, string>()
  for (const style of academyStyles) {
    for (const work of style.exampleWorks ?? []) {
      if (seedImageSrcByMovement.has(style.slug)) {
        errors.push(
          `${style.slug}: has more than one exampleWorks entry — the ` +
            'examples manifest only supports one example per movement today',
        )
        continue
      }
      seedImageSrcByMovement.set(style.slug, work.imageSrc)

      try {
        const mediaPath = imageSrcToMediaPath(work.imageSrc)
        if (!(await mediaAssetExists(mediaPath))) {
          errors.push(
            `${style.slug}: exampleWorks imageSrc does not exist at ${mediaSourceDescription(mediaPath)}`,
          )
        }
      } catch (error) {
        errors.push(
          `${style.slug}: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }
  }

  for (const [movement, imageSrc] of manifestImageSrcByMovement) {
    const seedImageSrc = seedImageSrcByMovement.get(movement)
    if (seedImageSrc === undefined) {
      errors.push(
        `${movement}: present in examples.manifest.json but has no ` +
          'matching exampleWorks entry in academyStyles.ts',
      )
    } else if (seedImageSrc !== imageSrc) {
      errors.push(
        `${movement}: examples.manifest.json imageSrc (${imageSrc}) does ` +
          `not match academyStyles.ts exampleWorks imageSrc (${seedImageSrc})`,
      )
    }
  }

  for (const movement of seedImageSrcByMovement.keys()) {
    if (!manifestImageSrcByMovement.has(movement)) {
      errors.push(
        `${movement}: has an exampleWorks entry in academyStyles.ts but no ` +
          'matching entry in examples.manifest.json',
      )
    }
  }

  if (errors.length) {
    console.error(
      `Academy examples manifest contract failed with ${errors.length} error(s):`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    `Academy examples manifest contract passed: ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} validated from ${manifestSource} against PUBLIC-DOMAIN-POLICY.md §3 and cross-checked against academyStyles.ts.`,
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
