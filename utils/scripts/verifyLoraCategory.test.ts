// /utils/scripts/verifyLoraCategory.test.ts
import assert from 'node:assert/strict'
import {
  LORA_CATEGORIES,
  LORA_CATEGORY_META,
  canReclassify,
  inferLoraCategory,
  isLoraCategory,
  loraCategoryForPlaceholder,
  normalizeLoraCategory,
  normalizeLoraCategorySource,
} from '../loraCategory'

// Category normalization
assert.equal(normalizeLoraCategory('character'), 'CHARACTER')
assert.equal(normalizeLoraCategory('  Style '), 'STYLE')
assert.equal(normalizeLoraCategory('nonsense'), null)
assert.equal(normalizeLoraCategory(null), null)
assert.equal(isLoraCategory('CLOTHING'), true)
assert.equal(isLoraCategory('HAT'), false)

assert.equal(normalizeLoraCategorySource('human'), 'HUMAN')
assert.equal(normalizeLoraCategorySource('guessed'), null)

// Every category is reachable from at least one placeholder, or the randomizer
// has a pool nobody can ever roll from.
for (const category of LORA_CATEGORIES) {
  const reachable = LORA_CATEGORY_META[category].placeholders.filter(
    (placeholder) => loraCategoryForPlaceholder(placeholder) === category,
  )
  assert.ok(
    reachable.length > 0,
    `No placeholder resolves to ${category}; its pool could never be rolled.`,
  )
}

// Placeholder lookup, including the aliases a prompt is likely to use.
assert.equal(loraCategoryForPlaceholder('character'), 'CHARACTER')
assert.equal(loraCategoryForPlaceholder('Character'), 'CHARACTER')
assert.equal(loraCategoryForPlaceholder('art_style'), 'STYLE')
assert.equal(loraCategoryForPlaceholder('artstyle'), 'STYLE')
assert.equal(loraCategoryForPlaceholder('outfit'), 'CLOTHING')
assert.equal(loraCategoryForPlaceholder('location'), 'SETTING')
assert.equal(loraCategoryForPlaceholder('pose'), 'ACTION')
assert.equal(loraCategoryForPlaceholder('sandwich'), null)

// Civitai tags win, and are reported as such.
assert.deepEqual(
  inferLoraCategory({ name: 'whatever.safetensors', civitaiTags: ['style'] }),
  { category: 'STYLE', source: 'CIVITAI', signal: 'style' },
)
assert.deepEqual(
  inferLoraCategory({
    name: 'greg.safetensors',
    civitaiTags: ['CHARACTER', 'anime'],
  }),
  { category: 'CHARACTER', source: 'CIVITAI', signal: 'character' },
)

// A Civitai tag beats a contradicting filename.
assert.equal(
  inferLoraCategory({
    name: 'gothic_outfit_v2.safetensors',
    civitaiTags: ['poses'],
  }).category,
  'ACTION',
)

// Filename heuristics, reported as HEURISTIC.
const outfit = inferLoraCategory({ name: 'victorian_outfit_v3.safetensors' })
assert.equal(outfit.category, 'CLOTHING')
assert.equal(outfit.source, 'HEURISTIC')

assert.equal(
  inferLoraCategory({ customLabel: 'Ukiyo-e Woodblock Style' }).category,
  'STYLE',
)
assert.equal(
  inferLoraCategory({ name: 'add_detail.safetensors' }).category,
  'DETAIL',
)
assert.equal(
  inferLoraCategory({ name: 'dungeon_background_pack.safetensors' }).category,
  'SETTING',
)

// STYLE is checked before CHARACTER so an artist-style LoRA does not land in
// the character pool -- the miscategorisation that makes a random batch look
// broken rather than empty.
assert.equal(
  inferLoraCategory({ customLabel: 'Kim Jung Gi style' }).category,
  'STYLE',
)

// Word boundaries, not substrings: "freestyle" is not a style LoRA and
// "portrait" is not a trait.
assert.equal(inferLoraCategory({ name: 'freestyle_rap.safetensors' }).category, null)
assert.equal(inferLoraCategory({ name: 'trait_pack.safetensors' }).category, null)

// Nothing to go on stays nothing. An unclassified LoRA is skipped by the
// randomizer; a guessed one poisons a pool.
assert.deepEqual(inferLoraCategory({}), {
  category: null,
  source: null,
  signal: null,
})
assert.deepEqual(inferLoraCategory({ name: 'xyzzy_v4.safetensors' }), {
  category: null,
  source: null,
  signal: null,
})

// Underscores are word separators, so a filename reads like a sentence.
assert.equal(
  inferLoraCategory({ name: 'my_cool_pixel_art_thing.safetensors' }).category,
  'STYLE',
)

// A human decision is permanent; a guess is refreshable.
assert.equal(canReclassify('HUMAN'), false)
assert.equal(canReclassify('human'), false)
assert.equal(canReclassify('CIVITAI'), true)
assert.equal(canReclassify('HEURISTIC'), true)
assert.equal(canReclassify(null), true)

console.log('LoRA category classification verified.')
