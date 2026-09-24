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
  randomizerLoraCategory,
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
  { category: 'STYLE', source: 'CIVITAI', signal: 'tag: style' },
)
assert.deepEqual(
  inferLoraCategory({
    name: 'greg.safetensors',
    civitaiTags: ['CHARACTER', 'anime'],
  }),
  { category: 'CHARACTER', source: 'CIVITAI', signal: 'tag: character' },
)

// Generic character is an umbrella tag on many purpose LoRAs. The specific
// purpose must win or pose/style rows silently disappear into {character}.
assert.equal(
  inferLoraCategory({
    name: 'dynamic_pose_pack.safetensors',
    civitaiTags: ['character', 'poses'],
  }).category,
  'ACTION',
)
assert.equal(
  inferLoraCategory({
    name: 'ink_artist.safetensors',
    civitaiTags: ['character', 'style'],
  }).category,
  'STYLE',
)

// A Civitai tag beats a contradicting filename.
assert.equal(
  inferLoraCategory({
    name: 'gothic_outfit_v2.safetensors',
    civitaiTags: ['poses'],
  }).category,
  'ACTION',
)

// Title heuristics, reported as HEURISTIC with the matched TEXT.
const outfit = inferLoraCategory({ name: 'victorian_outfit_v3.safetensors' })
assert.equal(outfit.category, 'CLOTHING')
assert.equal(outfit.source, 'HEURISTIC')
assert.equal(outfit.signal, 'title: outfit')

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
// the character pool.
assert.equal(
  inferLoraCategory({ customLabel: 'Kim Jung Gi style' }).category,
  'STYLE',
)

// Word boundaries, not substrings.
assert.equal(
  inferLoraCategory({ name: 'freestyle_rap.safetensors' }).category,
  null,
)
assert.equal(
  inferLoraCategory({ name: 'trait_pack.safetensors' }).category,
  null,
)

// Underscores are word separators, so a filename reads like a sentence.
assert.equal(
  inferLoraCategory({ name: 'my_cool_pixel_art_thing.safetensors' }).category,
  'STYLE',
)

// ---------------------------------------------------------------------------
// THE DESCRIPTION IS NOT EVIDENCE.
//
// The first live backfill (2026-09-22) classified 1,004 rows by reading the
// description alongside the title, and a description is prose: it files
// character LoRAs under CLOTHING because a `dress` appears in the blurb. Each
// case below is a real row from that run, with a description carrying every
// category word at once. All of them must come back null -- the titles say
// nothing about what the LoRA is for, and that IS the answer.
// ---------------------------------------------------------------------------
const NOISY = [
  'she wears a long dress, sitting by the window',
  'painted in a loose style with exquisite detail',
  'base: Flux.1 D | module: networks.lora | detected via civitai',
].join(' | ')

for (const title of [
  'Elvira - Mistress of the Dark (Flux)',
  'Daphne Blake - Scooby-Doo franchise - Flux1.D - SDXL Realistic / Anime',
  'POV Blowjob - FLUX - [Non-Face Altering]',
  'Poison Ivy XL + SD1.5 + F1D',
  'Rogue - Flux1.D & SDXL',
  'Alice In Wonderland! Disney - FLUX | SD 1.5 | XL PONY',
  'Yor Briar: Thorn Princess (Spy x Family)',
  'Tinker bell (Peter Pan) Disney',
]) {
  const result = inferLoraCategory({ customLabel: title, description: NOISY })
  assert.equal(
    result.category,
    null,
    `"${title}" must stay unclassified, got ${result.category} (${result.signal})`,
  )
}

// The same title WITH a Civitai character tag does classify -- which is the
// whole argument for --fetch-tags.
assert.equal(
  inferLoraCategory({
    customLabel: 'Elvira - Mistress of the Dark (Flux)',
    description: NOISY,
    civitaiTags: ['character'],
  }).category,
  'CHARACTER',
)

// A publisher is not a drawing style: "DC Comics" attached to a character name
// used to match a bare `comic`.
assert.equal(
  inferLoraCategory({ customLabel: 'Death of the Endless - DC Comics,Sandman' })
    .category,
  null,
)
assert.equal(
  inferLoraCategory({ customLabel: "Wizard's Vintage Comic Book Cover" })
    .category,
  'STYLE',
)

// `detailed` is an adjective on a subject, not an enhancer; the noun forms are.
assert.equal(
  inferLoraCategory({
    customLabel: 'Perfect naked nipples, detailed erect nipples',
  }).category,
  null,
)
assert.equal(
  inferLoraCategory({ customLabel: 'FLUX FaeTastic Details' }).category,
  'DETAIL',
)
assert.equal(
  inferLoraCategory({ customLabel: 'Flux Detailer' }).category,
  'DETAIL',
)

// Subjects the title does name are still caught.
assert.equal(
  inferLoraCategory({ customLabel: 'Cute Animals' }).category,
  'CREATURE',
)
assert.equal(
  inferLoraCategory({ customLabel: '3D Cartoon Vision FLUX' }).category,
  'STYLE',
)

// Nothing to go on stays nothing.
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

// The randomizer repairs the narrow legacy case without rewriting storage:
// a clearly named pose LoRA imported under a non-human category joins ACTION,
// but a human classification remains authoritative.
assert.equal(
  randomizerLoraCategory({
    name: 'dynamic_pose_pack.safetensors',
    loraCategory: 'CHARACTER',
    loraCategorySource: 'CIVITAI',
  }),
  'ACTION',
)
assert.equal(
  randomizerLoraCategory({
    name: 'dynamic_pose_pack.safetensors',
    loraCategory: null,
    loraCategorySource: null,
  }),
  'ACTION',
)
assert.equal(
  randomizerLoraCategory({
    name: 'dynamic_pose_pack.safetensors',
    loraCategory: 'CHARACTER',
    loraCategorySource: 'HUMAN',
  }),
  'CHARACTER',
)
assert.equal(
  randomizerLoraCategory({
    name: 'Rogue.safetensors',
    loraCategory: 'CHARACTER',
    loraCategorySource: 'CIVITAI',
  }),
  'CHARACTER',
)

// A human decision is permanent; a guess is refreshable.
assert.equal(canReclassify('HUMAN'), false)
assert.equal(canReclassify('human'), false)
assert.equal(canReclassify('CIVITAI'), true)
assert.equal(canReclassify('HEURISTIC'), true)
assert.equal(canReclassify(null), true)

console.log('LoRA category classification verified.')
