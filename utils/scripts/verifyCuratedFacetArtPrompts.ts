// /utils/scripts/verifyCuratedFacetArtPrompts.ts
//
// The authored prompts are content, and content rots quietly. These checks are
// the ones that would have caught each failure this work has already shipped.
import assert from 'node:assert/strict'
import { CURATED_FACET_ART_PROMPTS } from '../seeds/facetArtPrompts'
import { checkArtPromptContract } from '../../server/utils/artPromptContract'
import {
  curatedPromptNeedsRender,
  isLegacyGeneratedFacetPrompt,
} from '../../scripts/generate_facet_art_v4'
import { readFileSync } from 'node:fs'

const entries = Object.entries(CURATED_FACET_ART_PROMPTS)
assert.ok(entries.length >= 146, `expected the full authored set, got ${entries.length}`)

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

console.log(`Curated Facet art prompts verified (${entries.length}).`)
