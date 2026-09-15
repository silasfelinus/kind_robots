// /utils/scripts/verifyCuratedFacetArtPrompts.ts
//
// The authored prompts are content, and content rots quietly. These checks are
// the ones that would have caught each failure this work has already shipped.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { CURATED_FACET_ART_PROMPTS } from '../seeds/facetArtPrompts'
import { checkArtPromptContract } from '../../server/utils/artPromptContract'
import { readFacetCoverageTarget } from '../../server/utils/artJobQueueCoverage'
import {
  buildFacetArtPayload,
  curatedPromptNeedsRender,
  isLegacyGeneratedFacetPrompt,
  promptWasPainted,
} from '../../scripts/generate_facet_art_v4'

const entries = Object.entries(CURATED_FACET_ART_PROMPTS)
assert.ok(entries.length >= 259, `expected the full authored set, got ${entries.length}`)

for (const [slug, prompt] of entries) {
  assert.ok(prompt.trim().length > 40, `${slug}: too thin to carry a picture`)
  assert.deepEqual(
    checkArtPromptContract({ prompt, engine: 'krea2', steps: 8, cfg: 1 }),
    [],
    `${slug} must pass the prompt contract`,
  )
  // A curated prompt that looks generated would be silently rewritten by the
  // producer, and the authored text would never reach a render.
  assert.equal(
    isLegacyGeneratedFacetPrompt(prompt),
    false,
    `${slug} must not read as generator output`,
  )
}

// Variety is the entire reason these exist. A shared opening, or a phrase
// repeated across many prompts, is the template creeping back in -- that is how
// 146 genres became the same crowd in the same rain.
const openings = entries.map(([, p]) => p.split(/\s+/).slice(0, 3).join(' ').toLowerCase())
assert.equal(
  new Set(openings).size,
  openings.length,
  'every authored prompt must open differently',
)

const phraseCount = new Map<string, number>()
for (const [, prompt] of entries) {
  const words = prompt.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)
  const seen = new Set<string>()
  for (let i = 0; i + 3 <= words.length; i++) {
    const phrase = words.slice(i, i + 3).join(' ')
    if (seen.has(phrase)) continue
    seen.add(phrase)
    phraseCount.set(phrase, (phraseCount.get(phrase) ?? 0) + 1)
  }
}
const overused = [...phraseCount.entries()].filter(([, n]) => n > 8)
assert.deepEqual(
  overused,
  [],
  `phrases shared by more than 8 prompts are a template re-forming: ${JSON.stringify(overused)}`,
)

// ── Selection ───────────────────────────────────────────────────────────────
//
// Writing the prompts is only half of it; they have to reach a render. The
// first version of --requeue-curated wrote all 146 prompts and queued zero
// jobs, because the selection lived inside a function that needs a database and
// nothing could test it. "Queued nothing at all" printed identically to
// "nothing to do".
const curated = 'Office Satire. A cubicle farm built into a fortress of box files.'
const f = (artPrompt: string | null) => ({ artPrompt }) as never

assert.equal(
  curatedPromptNeedsRender(f(curated), true, 'Office Satire. A scene of this kind underway.'),
  true,
  'a curated prompt that has changed since the render must be re-queued',
)
assert.equal(
  curatedPromptNeedsRender(f(curated), true, curated),
  false,
  'a picture already made from this exact text is current',
)
assert.equal(
  curatedPromptNeedsRender(f(curated), true, undefined),
  true,
  'an attempted slot with no recorded prompt (v2/v3 predates basePromptString) cannot be assumed current',
)
assert.equal(
  curatedPromptNeedsRender(f(curated), false, undefined),
  false,
  'a Facet never rendered at all belongs to ordinary coverage, not this mode',
)
assert.equal(
  curatedPromptNeedsRender(
    f('X. Iconic scene, concrete focal subject, environment, action, strong atmosphere.'),
    true,
    'anything',
  ),
  false,
  'generated prompts belong to the repair modes',
)
assert.equal(curatedPromptNeedsRender(f(null), true, 'anything'), false)

// The selection above is useless if the run never loads job history to compare
// against -- which is precisely how it shipped broken: history was fetched only
// under --repair-tainted, so --requeue-curated saw an empty list and concluded
// that every Facet was untouched.
const producer = readFileSync('scripts/generate_facet_art_v4.ts', 'utf8')
assert.ok(
  producer.includes('REPAIR_TAINTED || REQUEUE_CURATED'),
  'job history must be loaded for --requeue-curated, or it silently queues nothing',
)

// ── The job has to survive claim ────────────────────────────────────────────
//
// Queueing is not rendering. artJobQueueCoverage cancels any facet-catalog job
// before claim when the Facet already has display art -- baseline coverage is
// satisfied -- and it exempts a job only when payload.retry is present
// (readFacetCoverageTarget returns null for those).
//
// A requeue is BY DEFINITION for a Facet that already has art, so without retry
// provenance every one is cancelled unrendered. That is exactly what happened
// to all 146 authored prompts: created, reported as queued, cancelled before a
// single pixel. The producer's own summary said 146 and meant nothing.
const sampleFacet = {
  id: 9, title: 'Office Satire', slug: 'office-satire',
  description: null, flavorText: null, examples: null,
  artPrompt: 'Office Satire. A cubicle farm where one desk has been slowly built into a fortress of box files, its occupant serenely typing inside it.',
  imagePath: '/existing.webp', icon: null, artImageId: 5, artCollectionId: null,
  userId: 1, isPublic: true, isMature: false,
} as never
const sampleProfile = {
  facetId: 9, taxonomy: 'GENRE', canonicalValue: 'office-satire',
  groupKey: null, groupLabel: null, isRandomizable: true, randomWeight: 1,
  artRequired: true, sourceRank: 1, metadata: null,
} as never
const sampleVariant = {
  field: 'imagePath', label: 'square illustration', width: 1024, height: 1024,
  composition: 'A square picture with the subject large and centred.',
} as never

const baseline = buildFacetArtPayload(sampleFacet, sampleProfile, 'Office Satire. A cubicle farm.', sampleVariant)
assert.notEqual(
  readFacetCoverageTarget(baseline),
  null,
  'sanity: a job with no retry provenance IS subject to coverage cleanup',
)
const replacement = buildFacetArtPayload(
  sampleFacet, sampleProfile, 'Office Satire. A cubicle farm.', sampleVariant,
  { sourceJobId: 1, sourceVersion: 'facet-coverage-krea2-v5', reason: 'facet-curated-prompt-refresh' },
)
assert.equal(
  readFacetCoverageTarget(replacement),
  null,
  'a replacement job must carry retry provenance or it is cancelled before claim',
)

// And the producer must actually attach it on both requeue paths.
const producerSource = readFileSync('scripts/generate_facet_art_v4.ts', 'utf8')
for (const reason of ['facet-curated-prompt-refresh', 'facet-swatch-subject-refresh']) {
  assert.ok(
    producerSource.includes(reason),
    `requeue path ${reason} must cite a source job so retry provenance is attached`,
  )
}
// Naming a reason on the queue entry is half of it; the call site has to pass
// it. It did not, so the first scoped run stamped three swatch refreshes as
// "facet-art-direction-jargon-repair-v5" -- harmless to the render, and a lie
// to whoever reads the provenance next.
assert.ok(
  producerSource.includes('reason: entry.repairReason'),
  'buildFacetArtPayload must receive the entry reason, or every requeue is stamped with the default',
)
// And the queued total has to mean what was written. Reporting the pre-filter
// count made a scoped run of 3 print "queued: 191".
assert.ok(
  producerSource.includes('queued: scopedQueue.length'),
  'the queued total must report what was written, not what was considered',
)

// The enhancement swatches are authored per technique now, because one shared
// scene failed twice in opposite directions: too bare to demonstrate anything,
// then so loaded that naming a technique changed nothing. Each of these has to
// be a scene that IS its technique, so a handful are spot-checked for the
// subject that carries them.
for (const [slug, needle] of [
  ['volumetric-light', 'shaft'],
  ['gilded-shimmer', 'gold leaf'],
  ['subsurface-scattering', 'through the flesh'],
  ['film-grain', 'grain'],
  ['bokeh-background', 'circles'],
  ['macro-fidelity', 'close view'],
] as [string, string][]) {
  const prompt = CURATED_FACET_ART_PROMPTS[slug]
  assert.ok(prompt, `${slug} must have an authored prompt`)
  assert.ok(
    prompt.toLowerCase().includes(needle),
    `${slug} must depict its technique, not merely be lit by it (looking for "${needle}")`,
  )
}
// The pear scene is retired as a per-facet prompt. If it comes back, the two
// failures above are being repeated.
for (const [slug, prompt] of entries) {
  assert.ok(
    !prompt.includes('brass oil lamp burning at the back of a dark polished table'),
    `${slug} still uses the shared swatch scene that demonstrated nothing`,
  )
}

// ── Importing the producer must not exit the process ────────────────────────
//
// The unknown-flag guard was a top-level statement, so it ran on IMPORT.
// applyCuratedFacetArtPrompts.ts imports this module for
// isLegacyGeneratedFacetPrompt, so its own `--apply` looked like an unknown
// producer flag and the apply died before writing a single prompt. Every
// verifier imports this module with NO arguments, which is why nothing in the
// suite could see it; this one passes arguments on purpose.
const probeDir = mkdtempSync(join(tmpdir(), 'facet-import-probe-'))
const probe = join(probeDir, 'probe.ts')
writeFileSync(
  probe,
  `import(${JSON.stringify(join(process.cwd(), 'scripts/generate_facet_art_v4'))})\n` +
    `  .then(() => console.log('ok'))\n` +
    `  .catch((error) => { console.error(error); process.exit(1) })\n`,
)
const imported = spawnSync('npx', ['tsx', probe, '--apply', '--some-other-tool-flag'], {
  encoding: 'utf8',
  cwd: process.cwd(),
})
assert.equal(
  imported.status,
  0,
  `importing the producer with a foreign flag must not exit: ${imported.stderr?.slice(0, 400)}`,
)
assert.match(imported.stdout ?? '', /ok/)

console.log(`Curated Facet art prompts verified (${entries.length}).`)


/*
 * The producer must judge "already rendered" by the picture, not by its own
 * request.
 *
 * 2026-09-15: 148 genre/theme cards held the authored prompt in the catalog AND
 * in the newest job payload, while the linked ArtImage had been painted from
 * the retired v5 template clause. Because the predicate compared against the
 * payload, --requeue-curated selected none of them: every counter read done and
 * every card was wrong. These fix that comparison in place.
 */
{
  const AUTHORED = 'A war-room table where the battle map is laid out in breakfast things.'
  const facet = { artPrompt: AUTHORED } as Parameters<typeof curatedPromptNeedsRender>[0]

  // The painted prompt is what the renderer stored: the prompt plus framing.
  const paintedFromAuthored = `${AUTHORED} A square picture with the subject large and centred.`
  const paintedFromTemplate =
    'Absurdist Strategy. A scene of this kind underway, everyone in it and the place around them painted together. A square picture with the subject large and centred.'

  assert.equal(
    curatedPromptNeedsRender(facet, true, AUTHORED, paintedFromAuthored),
    false,
    'a card painted from the authored prompt must not be re-queued',
  )
  // The regression itself: payload agrees, picture does not. The picture wins.
  assert.equal(
    curatedPromptNeedsRender(facet, true, AUTHORED, paintedFromTemplate),
    true,
    'a card painted from an older prompt must be re-queued even when the job payload looks current',
  )
  // Nothing linked: fall back to the payload rather than re-rendering blindly.
  assert.equal(
    curatedPromptNeedsRender(facet, true, AUTHORED, undefined),
    false,
    'with no linked image the payload remains the best available evidence',
  )
  // A linked image with no recorded prompt cannot vouch for itself.
  assert.equal(
    curatedPromptNeedsRender(facet, true, AUTHORED, ''),
    true,
    'a linked image with no recorded prompt must be re-rendered, not assumed current',
  )
}

// Containment, not equality -- the renderer always appends framing guidance.
assert.equal(promptWasPainted('A quiet room.', 'A quiet room. A square picture.'), true)
assert.equal(promptWasPainted('A quiet room.', 'A LOUD room. A square picture.'), false)
assert.equal(
  promptWasPainted('A quiet  room.', 'a quiet room. A square picture.'),
  true,
  'whitespace and case must not cause a needless re-render of the whole catalog',
)
assert.equal(promptWasPainted('', 'anything'), false)


/*
 * A hand-placed asset must not freeze a curated prompt out of ever rendering.
 *
 * 2026-09-16: 15 genres authored the day before (fantasy, steampunk, mystery,
 * romance ...) still showed their old static .webp. Coverage counts imagePath
 * as art-backed and skipped them; --requeue-curated saw no job in their history
 * and skipped them too. The right text, and no path to a picture.
 */
{
  const AUTHORED = 'A brass diving apparatus laid open on a workbench, its gears exposed.'
  const staticOnly = {
    artPrompt: AUTHORED,
    imagePath: '/images/art/punk/steampunk.webp',
    artImageId: null,
  } as Parameters<typeof curatedPromptNeedsRender>[0]

  assert.equal(
    curatedPromptNeedsRender(staticOnly, false, undefined, undefined),
    true,
    'a curated prompt behind a static asset must be queued -- coverage never will',
  )

  // A Facet with nothing at all is still coverage's job, not this mode's;
  // claiming it here would queue the same slot twice.
  const bare = {
    artPrompt: AUTHORED,
    imagePath: null,
    artImageId: null,
  } as Parameters<typeof curatedPromptNeedsRender>[0]
  assert.equal(
    curatedPromptNeedsRender(bare, false, undefined, undefined),
    false,
    'an uncovered Facet belongs to ordinary coverage, not the requeue mode',
  )

  // Once it has real generated art, the painted prompt decides as before.
  const painted = {
    artPrompt: AUTHORED,
    imagePath: '/api/art/images/999/file',
    artImageId: 999,
  } as Parameters<typeof curatedPromptNeedsRender>[0]
  assert.equal(
    curatedPromptNeedsRender(painted, true, undefined, `${AUTHORED} A square picture.`),
    false,
    'generated art matching the curated prompt stays put',
  )
}
