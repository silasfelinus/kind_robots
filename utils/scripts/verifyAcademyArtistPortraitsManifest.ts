// utils/scripts/verifyAcademyArtistPortraitsManifest.ts
//
// ai-art-academy/t-072: "Meet the masters" showed only a neutral
// initial-letter placeholder for every named artist (kind_robots PR #1930's
// deliberate choice — never fabricate a likeness). This script validates the
// new AcademyArtist.portrait media-provenance contract (same discipline as
// AcademyExampleWork, see PUBLIC-DOMAIN-POLICY.md §3 and
// academyProvenanceSchema.ts) and reports coverage. Unlike
// verifyAcademyExamplesManifest.ts, this is NOT a 100%-or-exception hard
// gate: a named artist legitimately may have no verifiable, rights-clear
// likeness (t-072 acceptance criterion 2 is explicit — "where a reliable
// reusable image exists", never a generated likeness as a substitute), so
// partial coverage is the expected steady state, not a gap to force-close.
// What IS hard-gated: schema violations, seed/pending-manifest path
// mismatches, and a `depicts` value that doesn't match the artist it's
// attached to.
//
// Set MEDIA_ROOT for a filesystem-backed availability check, or set
// MEDIA_VERIFY_ASSETS=1 to verify the public origin with HEAD requests.
// The live synced manifest (academy/artists/portraits.manifest.json) may not
// exist yet at the media origin — a brand-new category with nothing synced
// starts as 404, which this script treats as "zero synced entries" rather
// than a failure.
//
// Run: npm run test:academy-artist-portraits-manifest

import { readFile } from 'node:fs/promises'
import { academyStyles } from '../../stores/seeds/academyStyles'
import { validateProvenanceRecord } from './academyProvenanceSchema'
import {
  imageSrcToMediaPath,
  mediaAssetExists,
  mediaSourceDescription,
  readMediaText,
  repositoryFileToMediaPath,
} from './mediaContractSource'

const manifestRelativePath = 'academy/artists/portraits.manifest.json'
const pendingManifestUrl = new URL(
  '../../config/academy-artist-portraits-pending.json',
  import.meta.url,
)
const manifestSource = mediaSourceDescription(manifestRelativePath)
const verifyAssets =
  Boolean(process.env.MEDIA_ROOT?.trim()) ||
  process.env.MEDIA_VERIFY_ASSETS === '1'

const REQUIRED_OWN_STRING_FIELDS = ['depicts', 'kind', 'file'] as const
const VALID_KINDS = ['self-portrait', 'portrait', 'photograph', 'sculpture']

async function readSyncedManifest(): Promise<unknown[]> {
  let raw: string
  try {
    raw = await readMediaText(manifestRelativePath)
  } catch {
    // Brand-new media category: nothing synced yet is expected, not an error.
    return []
  }
  const parsed: unknown = JSON.parse(raw)
  if (!Array.isArray(parsed)) {
    throw new Error(
      `${manifestSource} must be a JSON array, got ${typeof parsed}`,
    )
  }
  return parsed
}

async function main(): Promise<void> {
  const errors: string[] = []

  let syncedEntries: unknown[]
  try {
    syncedEntries = await readSyncedManifest()
  } catch (error) {
    errors.push(
      `${manifestSource}: ${error instanceof Error ? error.message : String(error)}`,
    )
    syncedEntries = []
  }

  let pendingEntries: unknown
  try {
    pendingEntries = JSON.parse(await readFile(pendingManifestUrl, 'utf8'))
  } catch (error) {
    errors.push(
      `academy-artist-portraits-pending.json is not valid JSON — ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
    pendingEntries = []
  }
  if (!Array.isArray(pendingEntries)) {
    errors.push(
      `academy-artist-portraits-pending.json must be a JSON array, got ${typeof pendingEntries}`,
    )
    pendingEntries = []
  }

  const combinedEntries: unknown[] = [
    ...syncedEntries,
    ...(pendingEntries as unknown[]),
  ]
  const manifestImageSrcByKey = new Map<string, string>()

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
    if (typeof record.kind === 'string' && !VALID_KINDS.includes(record.kind)) {
      errors.push(
        `${label}: invalid kind "${record.kind}" — must be one of ${VALID_KINDS.join(', ')}`,
      )
    }
    validateProvenanceRecord(record, label, errors)

    const file = typeof record.file === 'string' ? record.file : null
    const depicts = typeof record.depicts === 'string' ? record.depicts : null
    if (!file || !depicts) continue

    const key = `${depicts}::${file}`
    try {
      const mediaPath = repositoryFileToMediaPath(file)
      if (verifyAssets && !(await mediaAssetExists(mediaPath))) {
        errors.push(
          `${label}: referenced media asset does not exist: ${mediaSourceDescription(mediaPath)}`,
        )
      }
      if (manifestImageSrcByKey.has(key)) {
        errors.push(
          `${key}: appears in both the media manifest and pending supplement; remove the pending entry after media sync`,
        )
      } else {
        manifestImageSrcByKey.set(key, `/images/${mediaPath}`)
      }
    } catch (error) {
      errors.push(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  // Cross-check against academyStyles.ts seed data, per (style slug, artist
  // name) — the same artist can legitimately appear in more than one style
  // (e.g. Georges Seurat in both post-impressionism and pointillism), so the
  // seed side is keyed per occurrence while the manifest side is keyed by
  // depicts+file (one real-world image can be reused across occurrences).
  const seedImageSrcByOccurrence = new Map<string, string>()
  let namedArtistCount = 0
  let portraitCount = 0
  const styleCoverage: { slug: string; withPortrait: number; total: number }[] =
    []

  for (const style of academyStyles) {
    let withPortrait = 0
    for (const artist of style.artists) {
      namedArtistCount += 1
      if (!artist.portrait) continue
      portraitCount += 1
      withPortrait += 1

      if (artist.portrait.depicts !== artist.name) {
        errors.push(
          `${style.slug}/${artist.name}: portrait.depicts ("${artist.portrait.depicts}") ` +
            'does not match the artist it is attached to',
        )
      }

      const occurrenceKey = `${style.slug}::${artist.name}`
      seedImageSrcByOccurrence.set(occurrenceKey, artist.portrait.imageSrc)

      try {
        const mediaPath = imageSrcToMediaPath(artist.portrait.imageSrc)
        if (verifyAssets && !(await mediaAssetExists(mediaPath))) {
          errors.push(
            `${occurrenceKey}: portrait imageSrc does not exist at ${mediaSourceDescription(mediaPath)}`,
          )
        }
        const manifestKey = `${artist.portrait.depicts}::public/images/${mediaPath}`
        if (!manifestImageSrcByKey.has(manifestKey)) {
          errors.push(
            `${occurrenceKey}: has a portrait in academyStyles.ts but no matching entry in ` +
              'the synced manifest or config/academy-artist-portraits-pending.json',
          )
        }
      } catch (error) {
        errors.push(
          `${occurrenceKey}: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }
    styleCoverage.push({
      slug: style.slug,
      withPortrait,
      total: style.artists.length,
    })
  }

  // Anything in the manifest/pending supplement that doesn't match any seed
  // occurrence at all (not even by depicts name) is orphaned bookkeeping.
  const depictedNames = new Set(
    academyStyles.flatMap((style) => style.artists.map((a) => a.name)),
  )
  for (const [key] of manifestImageSrcByKey) {
    const depicts = key.split('::')[0]
    if (depicts && !depictedNames.has(depicts)) {
      errors.push(
        `${key}: "${depicts}" does not match any named artist in academyStyles.ts — remove the stale entry`,
      )
    }
  }

  if (errors.length) {
    console.error(
      `Academy artist-portraits manifest contract failed with ${errors.length} error(s):`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  const pct =
    namedArtistCount === 0
      ? 100
      : Math.round((portraitCount / namedArtistCount) * 100)
  const zeroCoverageStyles = styleCoverage.filter(
    (s) => s.withPortrait === 0,
  ).length
  const fullCoverageStyles = styleCoverage.filter(
    (s) => s.total > 0 && s.withPortrait === s.total,
  ).length

  const availabilityNote = verifyAssets
    ? ' with media availability verified'
    : ' (media availability check skipped; set MEDIA_VERIFY_ASSETS=1 to enable)'
  console.log(
    `Academy artist-portraits manifest contract passed: ${combinedEntries.length} entries validated ` +
      `from ${manifestSource} plus ${(pendingEntries as unknown[]).length} pending media entr` +
      `${(pendingEntries as unknown[]).length === 1 ? 'y' : 'ies'} against PUBLIC-DOMAIN-POLICY.md §3${availabilityNote}.`,
  )
  console.log(
    `Coverage: ${portraitCount}/${namedArtistCount} named artists (${pct}%) have a verified portrait/photograph/sculpture; ` +
      `${fullCoverageStyles}/${styleCoverage.length} styles fully covered, ${zeroCoverageStyles}/${styleCoverage.length} styles with zero coverage. ` +
      'Partial coverage is expected — see ai-art-academy roadmap for the tracked follow-up.',
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
