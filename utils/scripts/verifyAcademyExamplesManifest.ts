// utils/scripts/verifyAcademyExamplesManifest.ts
//
// ai-art-academy/t-013: the curriculum "Example works" strip needs the same
// provenance discipline as the starter-image library (see
// verifyAcademyStarterManifest.ts and conductor's PUBLIC-DOMAIN-POLICY.md
// §3), plus one more invariant specific to example works: academyStyles.ts is
// the canonical metadata copy and the external examples manifest is its media
// mirror. Schema and path parity are source-code contracts; live asset
// availability is an opt-in operational smoke test.
//
// Set MEDIA_ROOT for a filesystem-backed availability check, or set
// MEDIA_VERIFY_ASSETS=1 to verify the public origin with HEAD requests.
//
// ai-art-academy/t-070: the denominator for coverage is the FULL canonical
// academyStyles.ts slug list, not just however many styles happen to carry an
// exampleWorks entry today. Historical t-013 correctly reached 21/21 for the
// movement cohort that existed when it closed, but the curriculum later grew
// to 47 styles and that denominator was never re-checked -- 26 styles sat
// with no example-art strip, undetected, for roughly a month. Every canonical
// style must now resolve to either (a) an exampleWorks entry (covered by the
// checks above) or (b) a named, reasoned entry in
// config/academy-example-work-exceptions.json (an explicit, tracked gap --
// never a silent one). A style with neither fails the contract below.
//
// Run: npm run test:academy-examples-manifest

import { readFile } from 'node:fs/promises'
import { academyStyles } from '../../stores/seeds/academyStyles'
import {
  findStaleExceptionSlugs,
  loadExceptionsFile,
} from './academyCoverageContract'
import { validateProvenanceRecord } from './academyProvenanceSchema'
import {
  imageSrcToMediaPath,
  mediaAssetExists,
  mediaSourceDescription,
  readMediaText,
  repositoryFileToMediaPath,
} from './mediaContractSource'

const manifestRelativePath = 'academy/examples/examples.manifest.json'
const pendingManifestUrl = new URL(
  '../../config/academy-example-manifest-pending.json',
  import.meta.url,
)
const exceptionsUrl = new URL(
  '../../config/academy-example-work-exceptions.json',
  import.meta.url,
)
const manifestSource = mediaSourceDescription(manifestRelativePath)
const verifyAssets =
  Boolean(process.env.MEDIA_ROOT?.trim()) ||
  process.env.MEDIA_VERIFY_ASSETS === '1'

const REQUIRED_OWN_STRING_FIELDS = ['movement', 'file'] as const

interface ExampleWorkException {
  slug: string
  reason: string
  followUpTask: string
}

function isExampleWorkException(value: unknown): value is ExampleWorkException {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.slug === 'string' &&
    record.slug.trim() !== '' &&
    typeof record.reason === 'string' &&
    record.reason.trim() !== '' &&
    typeof record.followUpTask === 'string' &&
    record.followUpTask.trim() !== ''
  )
}

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

  let pendingEntries: unknown
  try {
    pendingEntries = JSON.parse(await readFile(pendingManifestUrl, 'utf8'))
  } catch (error) {
    console.error(
      `Academy examples manifest contract failed: pending media supplement is not valid JSON — ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
    process.exitCode = 1
    return
  }

  if (!Array.isArray(pendingEntries)) {
    console.error(
      `Academy examples manifest contract failed: pending media supplement must be a JSON array, got ${typeof pendingEntries}`,
    )
    process.exitCode = 1
    return
  }

  const combinedEntries: unknown[] = [...entries, ...pendingEntries]

  const errors: string[] = []
  const manifestImageSrcByMovement = new Map<string, string>()

  for (const [index, entry] of combinedEntries.entries()) {
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
      if (verifyAssets && !(await mediaAssetExists(mediaPath))) {
        errors.push(
          `${label}: referenced media asset does not exist: ${mediaSourceDescription(mediaPath)}`,
        )
      }
      if (typeof record.movement === 'string') {
        if (manifestImageSrcByMovement.has(record.movement)) {
          errors.push(
            `${record.movement}: appears in both the media manifest and pending supplement; remove the pending entry after media sync`,
          )
        } else {
          manifestImageSrcByMovement.set(
            record.movement,
            `/images/${mediaPath}`,
          )
        }
      }
    } catch (error) {
      errors.push(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

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
        if (verifyAssets && !(await mediaAssetExists(mediaPath))) {
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

  // ai-art-academy/t-070: full-denominator coverage check. Every canonical
  // style must resolve to either an exampleWorks entry (already tracked in
  // seedImageSrcByMovement above) or a named, reasoned exception below --
  // never silently neither, which is exactly how the 21/21-vs-47-style drift
  // this task fixes went undetected.
  const { bySlug: exceptionsBySlug, errors: exceptionsErrors } =
    await loadExceptionsFile<ExampleWorkException>(
      exceptionsUrl,
      'academy-example-work-exceptions.json',
      isExampleWorkException,
    )
  errors.push(...exceptionsErrors)

  let coveredCount = 0
  let exceptedCount = 0
  for (const style of academyStyles) {
    const hasExampleWork = seedImageSrcByMovement.has(style.slug)
    const exception = exceptionsBySlug.get(style.slug)

    if (hasExampleWork && exception) {
      errors.push(
        `${style.slug}: has both an exampleWorks entry and an exceptions-file entry — remove the now-stale exception`,
      )
    } else if (hasExampleWork) {
      coveredCount += 1
    } else if (exception) {
      exceptedCount += 1
    } else {
      errors.push(
        `${style.slug}: has no exampleWorks entry and no explicit entry in ` +
          'config/academy-example-work-exceptions.json — every canonical ' +
          'style must have either real coverage or a named, reasoned, ' +
          'tracked exception (ai-art-academy/t-070 acceptance criterion 5)',
      )
    }
  }

  // Exceptions naming a style that no longer exists in academyStyles.ts are
  // stale bookkeeping, not a real gap -- flag so they get cleaned up rather
  // than silently accumulating.
  for (const slug of findStaleExceptionSlugs(exceptionsBySlug)) {
    errors.push(
      `academy-example-work-exceptions.json: "${slug}" is not a current academyStyles.ts slug — remove the stale exception`,
    )
  }

  if (errors.length) {
    console.error(
      `Academy examples manifest contract failed with ${errors.length} error(s):`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  const availabilityNote = verifyAssets
    ? ' with media availability verified'
    : ' (media availability check skipped; set MEDIA_VERIFY_ASSETS=1 to enable)'
  console.log(
    `Academy examples manifest contract passed: ${combinedEntries.length} entries validated from ${manifestSource} plus ${pendingEntries.length} pending media entr${pendingEntries.length === 1 ? 'y' : 'ies'} against PUBLIC-DOMAIN-POLICY.md §3 and cross-checked against academyStyles.ts${availabilityNote}.`,
  )
  console.log(
    `Full-denominator coverage: ${coveredCount}/${academyStyles.length} canonical styles have an exampleWorks entry, ${exceptedCount} have an explicit tracked exception, 0 undocumented gaps.`,
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
