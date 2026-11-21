// Emperor of Dust quest art contract (conductor emperor-of-dust/t-063).
// Every QUEST_ART entry must ship as a file, every shipped quest file must be
// listed, and every entry must belong to an authored quest, so curated exports
// cannot silently drift from the manifest the game reads.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs'
import { join, relative, sep } from 'node:path'
import { authoredQuestDef } from '../emperorOfDust/fortress/content'
import { ENDINGS } from '../emperorOfDust/fortress/endings'
import { QUEST_ART, questArtUrl } from '../emperorOfDust/fortress/questArt'

const dir = join(process.cwd(), 'public/emperor-of-dust/quests')
const listed = new Set(QUEST_ART)
assert.equal(listed.size, QUEST_ART.length, 'QUEST_ART has duplicate entries')

for (const asset of QUEST_ART) {
  assert.ok(existsSync(join(dir, `${asset}.webp`)), `missing file for ${asset}`)
  const base = asset.replace(/-(success|failure)$/, '')
  assert.ok(authoredQuestDef(base), `${asset} names no authored quest`)
}

for (const file of readdirSync(dir).filter((name) => name.endsWith('.webp'))) {
  assert.ok(
    listed.has(file.slice(0, -5)),
    `${file} ships but is not in QUEST_ART`,
  )
}

// The 2026-11-16 PT curation shipped r-deserter without its failure plate (the
// dawn report fell back to the notice); the 2026-11-19 PT REDO-2 curation
// shipped it, so instanced quest ids now resolve to the painted outcome.
assert.equal(
  questArtUrl('r-deserter@12', 'failure'),
  '/emperor-of-dust/quests/r-deserter-failure.webp',
)
assert.equal(
  questArtUrl('r-runaway-runner', 'failure'),
  '/emperor-of-dust/quests/r-runaway-runner-failure.webp',
)
// Still rejected after REDO-2 (human faces): these outcomes fall back to the notice.
assert.equal(
  questArtUrl('r-verge-scouts', 'failure'),
  '/emperor-of-dust/quests/r-verge-scouts.webp',
)
assert.equal(
  questArtUrl('r-fever-ward', 'success'),
  '/emperor-of-dust/quests/r-fever-ward.webp',
)
assert.equal(
  questArtUrl('r-deserter', 'success'),
  '/emperor-of-dust/quests/r-deserter-success.webp',
)
// The 2026-11-17 PT redo curation shipped both burrow-gallery quests as tunnel
// interiors.
assert.equal(
  questArtUrl('r-low-galleries', 'failure'),
  '/emperor-of-dust/quests/r-low-galleries-failure.webp',
)
assert.equal(
  questArtUrl('q-d07-galleries'),
  '/emperor-of-dust/quests/q-d07-galleries.webp',
)

// 2026-11-20 PT (t-033): the q-d42 cave-forage -v3 notice and success shipped;
// the failure was rejected (a warm fire and full baskets), so it falls back to the notice.
assert.equal(
  questArtUrl('q-d42-cave-forage', 'success'),
  '/emperor-of-dust/quests/q-d42-cave-forage-success.webp',
)
assert.equal(
  questArtUrl('q-d42-cave-forage', 'failure'),
  '/emperor-of-dust/quests/q-d42-cave-forage.webp',
)

// t-052: audit *shipped image bytes*, never an ArtJob state or ArtImage row.
// This evidence describes the public asset tree at this exact checkout.
// A successful audit does NOT mean missing ending plates or remote art are delivered.
const mediaRoot = join(process.cwd(), 'public/emperor-of-dust')
type DeliveredMedia = {
  path: string
  bytes: number
  sha256: string
}
const delivered: DeliveredMedia[] = []
const walk = (folder: string): void => {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const location = join(folder, entry.name)
    if (entry.isDirectory()) {
      walk(location)
      continue
    }
    assert.ok(entry.isFile(), location + ': unexpected non-file art asset')
    if (!entry.name.endsWith('.webp')) continue
    const bytes = readFileSync(location)
    assert.ok(bytes.length >= 20, location + ': WebP bytes missing')
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', location)
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP', location)
    assert.ok(
      ['VP8 ', 'VP8L', 'VP8X'].includes(bytes.toString('ascii', 12, 16)),
      location + ': invalid WebP frame header',
    )
    delivered.push({
      path: relative(mediaRoot, location).split(sep).join('/'),
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    })
  }
}
walk(mediaRoot)
delivered.sort((a, b) => a.path.localeCompare(b.path))

const expectedEndings = Object.keys(ENDINGS).sort()
assert.equal(expectedEndings.length, 8, 'eight ending families')
const endingPlates = expectedEndings.map((id) => {
  const path = 'endings/' + id + '.webp'
  const asset = delivered.find((entry) => entry.path === path)
  return { ending_id: id, path, delivered_bytes: asset?.bytes ?? 0 }
})
const deliveredEndingCount = endingPlates.filter(
  (entry) => entry.delivered_bytes > 0,
).length
const questFiles = delivered.filter((asset) => asset.path.startsWith('quests/'))
assert.equal(
  questFiles.length,
  QUEST_ART.length,
  'quest manifest entries must match actual shipped WebP bytes',
)

const report = {
  method: 'Repository binary inspection (RIFF/WEBP header and SHA-256)',
  scope: 'public/emperor-of-dust at this exact checkout, not remote ArtImages',
  sha: process.env.KIND_ROBOTS_SHA ?? process.env.GITHUB_SHA ?? null,
  local_webp_count: delivered.length,
  quest_webp_count: questFiles.length,
  expected_ending_plate_count: expectedEndings.length,
  delivered_ending_plate_count: deliveredEndingCount,
  ending_plates: endingPlates,
  remote_artimage_bytes_verified: false,
  outstanding_external_approval_or_exports: true,
  files: delivered,
}
mkdirSync('artifacts/emperor', { recursive: true })
writeFileSync(
  'artifacts/emperor/editorial-media-delivery.json',
  JSON.stringify(report, null, 2) + '\n',
)
console.log(
  'emperor shipped-media bytes: ' +
    delivered.length +
    ' local WebP assets verified, ' +
    deliveredEndingCount +
    '/8 ending plates present; remote ArtImages NOT inspected',
)

console.log(`emperor quest art: ${QUEST_ART.length} entries verified`)
