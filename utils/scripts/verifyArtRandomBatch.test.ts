// /utils/scripts/verifyArtRandomBatch.test.ts
//
// The contract behind "{character} running in {style}, batch 10":
// ten jobs, ten different characters, ten different styles, each carrying the
// LoRA weights it rolled -- and a replayable seed so that claim is checkable.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { format } from 'prettier'
import {
  dealWithoutReplacement,
  extractPlaceholderKeys,
  generateStructuredPromptVariants,
  normalizeVariantKey,
  parseVariantKey,
  seededRandom,
  type VariantPick,
} from '../../server/utils/promptVariants'
import {
  ART_RANDOM_OBJECT_OPTIONS,
  compactRandomArtPrompt,
} from '../artRandomOptions'
import {
  randomBatchBasePrompt,
  withRandomBatchFacetBasePrompt,
} from '../artRandomBatch'

function loraPool(prefix: string, size: number): VariantPick[] {
  return Array.from({ length: size }, (_, index) => ({
    value: `${prefix}-trigger-${index + 1}`,
    kind: 'lora',
    sourceId: 1000 + index,
    label: `${prefix} ${index + 1}`,
    loraResourceId: 1000 + index,
    loraStrength: 0.8,
  }))
}

// Single-brace placeholders are opt-in, because A1111 prompts use braces too.
assert.deepEqual(extractPlaceholderKeys('{character} running in {style}'), [])
assert.deepEqual(
  extractPlaceholderKeys('{character} running in {style}', {
    allowSingleBrace: true,
  }),
  ['character', 'style'],
)
assert.deepEqual(
  extractPlaceholderKeys('{{style}} and {style}', { allowSingleBrace: true }),
  ['style'],
)

// A kind prefix survives normalization and splits cleanly.
assert.equal(normalizeVariantKey('LoRA:Character'), 'lora:character')
assert.deepEqual(parseVariantKey('lora:character'), {
  kind: 'lora',
  key: 'character',
})
assert.deepEqual(parseVariantKey('character'), { kind: null, key: 'character' })
assert.deepEqual(parseVariantKey(':leading'), { kind: null, key: ':leading' })

// Dealing without replacement: distinct until the pool runs out, then it
// cycles rather than clumping.
const deck = ['a', 'b', 'c']
const dealtExact = dealWithoutReplacement(deck, 3, seededRandom(7))
assert.deepEqual([...dealtExact].sort(), ['a', 'b', 'c'])

const dealtOver = dealWithoutReplacement(deck, 6, seededRandom(7))
assert.equal(dealtOver.length, 6)
assert.deepEqual([...dealtOver.slice(0, 3)].sort(), ['a', 'b', 'c'])
assert.deepEqual([...dealtOver.slice(3, 6)].sort(), ['a', 'b', 'c'])

// The headline case.
const characters = loraPool('hero', 12)
const styles = loraPool('brush', 12)
const pools: Record<string, VariantPick[]> = {
  character: characters,
  style: styles,
}

const batch = generateStructuredPromptVariants(
  '{character} running in {style}',
  10,
  (key) => pools[key],
  { allowSingleBrace: true, seed: 12345 },
)

assert.equal(batch.length, 10)

const rolledCharacters = batch.map((variant) => variant.picks.character!.value)
const rolledStyles = batch.map((variant) => variant.picks.style!.value)
assert.equal(
  new Set(rolledCharacters).size,
  10,
  'ten variants must roll ten different characters',
)
assert.equal(new Set(rolledStyles).size, 10, 'and ten different styles')

// The character slot is never filled from the style pool, and vice versa.
for (const value of rolledCharacters) assert.match(value, /^hero-trigger-/)
for (const value of rolledStyles) assert.match(value, /^brush-trigger-/)

// Each variant carries the weights it rolled, not just the words.
for (const variant of batch) {
  assert.equal(variant.loraPicks.length, 2)
  assert.deepEqual(
    variant.loraPicks.map((pick) => pick.resourceId).sort((a, b) => a - b),
    [variant.picks.character!.sourceId!, variant.picks.style!.sourceId!].sort(
      (a, b) => a - b,
    ),
  )
  for (const pick of variant.loraPicks) assert.equal(pick.strength, 0.8)
  assert.match(
    variant.promptUsed,
    /^hero-trigger-\d+ running in brush-trigger-\d+$/,
  )
  assert.deepEqual(variant.unresolvedKeys, [])
}

// Same seed, same batch. This is what makes "ten different characters" a
// checkable claim rather than an assertion about Math.random.
const replay = generateStructuredPromptVariants(
  '{character} running in {style}',
  10,
  (key) => pools[key],
  { allowSingleBrace: true, seed: 12345 },
)
assert.deepEqual(
  replay.map((variant) => variant.promptUsed),
  batch.map((variant) => variant.promptUsed),
)

const different = generateStructuredPromptVariants(
  '{character} running in {style}',
  10,
  (key) => pools[key],
  { allowSingleBrace: true, seed: 999 },
)
assert.notDeepEqual(
  different.map((variant) => variant.promptUsed),
  batch.map((variant) => variant.promptUsed),
)

// A pool smaller than the batch still fills the batch, evenly.
const scarce = generateStructuredPromptVariants(
  '{character} in {style}',
  6,
  (key) => (key === 'character' ? loraPool('hero', 2) : styles),
  { allowSingleBrace: true, seed: 4 },
)
assert.equal(scarce.length, 6)
const scarceCounts = new Map<string, number>()
for (const variant of scarce) {
  const value = variant.picks.character!.value
  scarceCounts.set(value, (scarceCounts.get(value) ?? 0) + 1)
}
assert.deepEqual([...scarceCounts.values()].sort(), [3, 3])

// Lenient mode leaves an unbacked placeholder alone instead of failing the
// whole batch -- a prompt may legitimately contain braces we do not own.
const lenient = generateStructuredPromptVariants(
  '{character} holding a {gizmo}',
  2,
  (key) => pools[key],
  { allowSingleBrace: true, lenient: true, seed: 3 },
)
assert.equal(lenient.length, 2)
for (const variant of lenient) {
  assert.match(variant.promptUsed, /holding a \{gizmo\}$/)
  assert.deepEqual(variant.unresolvedKeys, ['gizmo'])
  assert.equal(variant.loraPicks.length, 1)
}

// Strict mode still refuses, so the challenge center keeps its loud failure.
assert.throws(
  () => generateStructuredPromptVariants('{{gizmo}}', 2, () => undefined, {}),
  /No random pool found for placeholder "gizmo"/,
)

// A placeholder whose normalized key differs from its written form is still
// substituted. Rebuilding a regex from the normalized key silently emitted the
// literal placeholder to the renderer.
const awkward = generateStructuredPromptVariants(
  'a {{ Sci-Fi_Weapons }} scene',
  1,
  () => [{ value: 'railgun' }],
  {},
)
assert.equal(awkward[0]!.promptUsed, 'a railgun scene')

// A batch with no placeholders at all is a plain repeat, not an error.
const plain = generateStructuredPromptVariants(
  'a quiet lighthouse',
  3,
  () => undefined,
  { allowSingleBrace: true, lenient: true },
)
assert.equal(plain.length, 3)
for (const variant of plain) {
  assert.equal(variant.promptUsed, 'a quiet lighthouse')
  assert.deepEqual(variant.loraPicks, [])
}

// Repeated placeholders resolve to one value per variant.
const repeated = generateStructuredPromptVariants(
  '{character} meets {character}',
  1,
  (key) => pools[key],
  { allowSingleBrace: true, seed: 2 },
)
const [left, right] = repeated[0]!.promptUsed.split(' meets ')
assert.equal(left, right)
assert.equal(repeated[0]!.loraPicks.length, 1)

// Random object buttons are source-explicit, so an object roll can never
// silently become a LoRA or Facet when those pools happen to share a name.
assert.deepEqual(
  ART_RANDOM_OBJECT_OPTIONS.map((option) => option.placeholder),
  [
    'object:character',
    'object:scenario',
    'object:reward',
    'object:dream',
    'object:bot',
    'object:project',
  ],
)

// The art generator's Facet draft carries the author's undecorated prompt in
// workflow metadata. Randomization must start there, then rewrite that carrier
// per variant. Otherwise /api/art/enqueue prefers the stale literal template
// and jobs render/store "{lora:character} {lora:action}" even though the LoRA
// weights themselves changed.
const facetWorkflow = {
  __kindRobotsFacetSelection: {
    facetIds: [17, 23],
    basePromptString: '{lora:character} {lora:action}',
  },
}
assert.equal(
  randomBatchBasePrompt(
    '{lora:character} {lora:action}, Facet direction: ink wash',
    facetWorkflow,
  ),
  '{lora:character} {lora:action}',
)
const rewrittenFacetWorkflow = withRandomBatchFacetBasePrompt(
  facetWorkflow,
  'heroTrigger runningTrigger',
)!
assert.deepEqual(rewrittenFacetWorkflow.__kindRobotsFacetSelection, {
  facetIds: [17, 23],
  basePromptString: 'heroTrigger runningTrigger',
})
assert.equal(
  facetWorkflow.__kindRobotsFacetSelection.basePromptString,
  '{lora:character} {lora:action}',
  'rewriting a randomized variant must not mutate the generator draft',
)
assert.equal(
  randomBatchBasePrompt('plain prompt', { untouched: true }),
  'plain prompt',
)
assert.deepEqual(
  withRandomBatchFacetBasePrompt({ untouched: true }, 'variant'),
  { untouched: true },
)

// Existing object/Facet art prompts can be verbose. Random batches reuse them
// without adding parallel schema fields, but cap each inserted visual clause.
const verboseArtPrompt =
  'A luminous brass automaton on a rain-dark stage. '.repeat(20)
const compact = compactRandomArtPrompt('Clockwork Friend', verboseArtPrompt)
assert.ok(compact.startsWith('Clockwork Friend: '))
assert.ok(compact.length <= 280)
assert.ok(compact.endsWith('…'))

const randomizerUi = readFileSync(
  'components/art/art-batch-randomizer.vue',
  'utf8',
)
assert.ok(randomizerUi.includes('placeholder: `lora:${placeholder}`'))
assert.ok(
  randomizerUi.includes('placeholder: `facet:${taxonomy.toLowerCase()}`'),
)
assert.ok(randomizerUi.includes('ART_RANDOM_OBJECT_OPTIONS'))
assert.ok(!randomizerUi.includes('Write {character} running in {style}'))

assert.ok(randomizerUi.includes('artStore.generationBatchSize'))
assert.ok(randomizerUi.includes('artStore.setGenerationBatchSize(value)'))
assert.ok(!randomizerUi.includes('rollAndQueue'))
assert.ok(!randomizerUi.includes('Roll &amp; queue'))

const generatorUi = readFileSync('components/art/art-generator.vue', 'utf8')
assert.ok(generatorUi.includes('promptHasRandomPlaceholders'))
assert.ok(generatorUi.includes('usesBatchQueue'))
assert.ok(generatorUi.includes('artStore.enqueueRandomizedArtBatch'))
assert.ok(generatorUi.includes('batch: artStore.generationBatchSize'))

const artStoreSource = readFileSync('stores/artStore.ts', 'utf8')
assert.ok(artStoreSource.includes('generationBatchSize: 1'))
assert.ok(artStoreSource.includes('function setGenerationBatchSize'))
assert.ok(artStoreSource.includes('randomBatchBasePrompt('))
assert.ok(artStoreSource.includes('withRandomBatchFacetBasePrompt('))

const poolSource = readFileSync('server/utils/artRandomPools.ts', 'utf8')
assert.ok(poolSource.includes("source: 'object'"))
assert.ok(
  poolSource.includes('compactRandomArtPrompt(facet.title, facet.artPrompt)'),
)
assert.ok(
  poolSource.includes(
    "facetTaxonomiesForKey(entry.key, entry.kind === 'facet')",
  ),
)

const formattedRandomOptions = await format(
  readFileSync('utils/artRandomOptions.ts', 'utf8'),
  {
    parser: 'typescript',
    semi: false,
    singleQuote: true,
    tabWidth: 2,
    useTabs: false,
    printWidth: 80,
  },
)
console.log('PRETTIER_ART_RANDOM_OPTIONS_START')
console.log(formattedRandomOptions)
console.log('PRETTIER_ART_RANDOM_OPTIONS_END')

console.log('Randomized art batch contract verified.')
