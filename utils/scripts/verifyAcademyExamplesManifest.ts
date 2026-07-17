// utils/scripts/verifyAcademyExamplesManifest.ts
//
// ai-art-academy/t-013: the curriculum "Example works" strip needs the same
// provenance discipline as the starter-image library (see
// verifyAcademyStarterManifest.ts and conductor's PUBLIC-DOMAIN-POLICY.md
// §3), plus one more invariant specific to example works: per §3's field
// rules, "these records live in... for curriculum example works, in the
// academy-styles registry entries" — so stores/seeds/academyStyles.ts is the
// canonical copy and public/images/academy/examples/examples.manifest.json
// is a generated mirror. This contract fails CI if either goes stale
// relative to the other, or if a referenced image file is missing.
//
// Dependency-free on purpose: pure JSON + string assertions, no schema
// library, so it runs under bare `tsx` without the Nuxt/Prisma runtime.
// Shared field-list/license-enum check lives in academyProvenanceSchema.ts
// (ai-art-academy/t-028) so this and verifyAcademyStarterManifest.ts
// validate the same schema instead of duplicating it by hand.
//
// Run: npm run test:academy-examples-manifest

import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { academyStyles } from '../../stores/seeds/academyStyles'
import { validateProvenanceRecord } from './academyProvenanceSchema'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')
const manifestPath = resolve(
  repositoryRoot,
  'public/images/academy/examples/examples.manifest.json',
)

// This manifest carries two fields beyond the shared provenance schema:
// `movement` (join key to academyStyles.ts) and `file` (repo-relative path).
const REQUIRED_OWN_STRING_FIELDS = ['movement', 'file'] as const

async function main(): Promise<void> {
  const raw = await readFile(manifestPath, 'utf8')

  let entries: unknown
  try {
    entries = JSON.parse(raw)
  } catch (error) {
    console.error(
      `Academy examples manifest contract failed: ${manifestPath} is not valid JSON — ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
    process.exitCode = 1
    return
  }

  if (!Array.isArray(entries)) {
    console.error(
      `Academy examples manifest contract failed: ${manifestPath} must be a JSON array, got ${typeof entries}`,
    )
    process.exitCode = 1
    return
  }

  const errors: string[] = []
  const manifestImageSrcByMovement = new Map<string, string>()

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

    for (const field of REQUIRED_OWN_STRING_FIELDS) {
      const value = record[field]
      if (typeof value !== 'string' || value.trim() === '') {
        errors.push(`${label}: missing or empty required field "${field}"`)
      }
    }
    validateProvenanceRecord(record, label, errors)

    const file = typeof record.file === 'string' ? record.file : null
    if (file) {
      const absolutePath = resolve(repositoryRoot, file)
      if (!existsSync(absolutePath)) {
        errors.push(`${label}: referenced file does not exist: ${file}`)
      }
      if (typeof record.movement === 'string') {
        manifestImageSrcByMovement.set(
          record.movement,
          `/${file.replace(/^public\//, '')}`,
        )
      }
    }
  })

  // Cross-check against the canonical copy in academyStyles.ts — the
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
      if (!existsSync(resolve(repositoryRoot, 'public' + work.imageSrc))) {
        errors.push(
          `${style.slug}: exampleWorks imageSrc does not exist on disk: ${work.imageSrc}`,
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
    `Academy examples manifest contract passed: ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} validated against PUBLIC-DOMAIN-POLICY.md §3 and cross-checked against academyStyles.ts.`,
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
