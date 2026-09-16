// Guards the prompt shape each render lane actually receives.
//
// kind-robots/t-105, 2026-09-16. ArtJob 25398 rendered the "Very Small Women"
// Pony LoRA as a single man. The LoRA is a size-DIFFERENCE concept whose own
// triggers are "large male, t1nyg1rlz, very small female", and the probe
// scaffold had put "single subject, upper body" six tokens away from them. The
// scaffold won. On top of that, buildEntityArtPrompt appended ~80 tokens of
// natural-language instructions to a CLIP prompt that cannot follow
// instructions and simply embedded them as content -- 74% of that job's prompt
// was boilerplate, spilling a 75-token CLIP chunk into a second chunk of noise.
import assert from 'node:assert/strict'
import { buildEntityArtPrompt } from '../../server/utils/entityArt'
import { LORA_PROBE_RECIPES } from '../loraProbe'

const record = {
  id: 1,
  name: 'Very Small Women',
  customLabel: null,
  resourceType: 'LORA',
  generation: 'Pony',
  defaultTrigger: 'large male, t1nyg1rlz, very small female',
  triggerWords: null,
} as unknown as Parameters<typeof buildEntityArtPrompt>[1]['record']

const target = { entityType: 'resource' as const, field: 'imagePath', record }

// 1. A tag lane gets the user prompt and nothing else.
const tags = buildEntityArtPrompt('score_9, t1nyg1rlz, centered composition', target, {
  style: 'tags',
})
assert.equal(tags, 'score_9, t1nyg1rlz, centered composition')

// 2. None of the prose scaffolding may reach a tag lane. Each of these was
//    measurably harmful, not merely wasteful.
for (const banned of [
  'Compose this as', // carried "one clear subject"
  'not as text to render', // puts `text` in the POSITIVE prompt
  'Every surface in frame is blank and unmarked', // conditions toward blankness
  'Model type', // catalog metadata, not a visual concept
  'Base model',
]) {
  assert.ok(!tags.includes(banned), `tag lane must not contain ${banned}`)
}

// 3. The prose lane keeps its framing -- T5/Qwen genuinely follow it.
const prose = buildEntityArtPrompt('A candid photograph.', target, {
  style: 'prose',
})
assert.ok(prose.includes('Compose this as'))
assert.ok(prose.includes('Trigger words: large male, t1nyg1rlz, very small female'))

// 4. Catalog metadata is dead weight on EVERY lane, prose included.
assert.ok(!prose.includes('Model type'), 'prose lane must not carry Model type')
assert.ok(!prose.includes('Base model'), 'prose lane must not carry Base model')

// 5. Default stays prose, so existing callers are unchanged.
assert.equal(buildEntityArtPrompt('A candid photograph.', target), prose)

// 6. No recipe may reimpose a single-subject or cropped framing.
for (const [family, recipe] of Object.entries(LORA_PROBE_RECIPES)) {
  const positive = recipe.positive('t1nyg1rlz')
  for (const banned of ['single subject', 'upper body', 'single figure']) {
    assert.ok(
      !positive.toLowerCase().includes(banned),
      `${family} recipe must not force "${banned}" -- it breaks multi-subject and full-body LoRAs`,
    )
  }
  assert.ok(positive.includes('t1nyg1rlz'), `${family} recipe must keep the trigger`)
}

// 7. The whole point: a Pony probe now fits one 75-token CLIP chunk.
const pony = LORA_PROBE_RECIPES.pony.positive(
  'large male, t1nyg1rlz, very small female',
)
const full = buildEntityArtPrompt(pony, target, { style: 'tags' })
assert.ok(
  full.length / 4 < 75,
  `Pony probe must fit one CLIP chunk, got ~${Math.round(full.length / 4)} tokens`,
)

console.log('verifyEntityArtPromptStyle: all assertions passed')
