// /utils/scripts/verifyPromptVariants.ts
import assert from 'node:assert/strict'
import {
  extractPlaceholderKeys,
  generatePromptVariants,
  normalizeVariantKey,
} from '../../server/utils/promptVariants'

// normalizeVariantKey
assert.equal(normalizeVariantKey('Sci-Fi Weapons'), 'scifiweapons')
assert.equal(normalizeVariantKey('  Adjective  '), 'adjective')
assert.equal(normalizeVariantKey('cow_core'), 'cowcore')

// extractPlaceholderKeys
assert.deepEqual(
  extractPlaceholderKeys('A {{adjective}} {{animal}} in a {{adjective}} hat'),
  ['adjective', 'animal'],
)
assert.deepEqual(extractPlaceholderKeys('{{ Sci-Fi_Weapons }}'), [
  'scifiweapons',
])
assert.deepEqual(extractPlaceholderKeys('no placeholders here'), [])

// generatePromptVariants — validation
assert.throws(
  () => generatePromptVariants('', 3, () => ['a']),
  /non-empty string/,
)
assert.throws(
  () => generatePromptVariants('a {{x}} prompt', 0, () => ['a']),
  /positive integer/,
)
assert.throws(
  () => generatePromptVariants('no placeholders', 3, () => ['a']),
  /at least one/,
)
assert.throws(
  () => generatePromptVariants('a {{missing}} prompt', 3, () => undefined),
  /No random pool found for placeholder "missing"/,
)

// generatePromptVariants — deterministic pickRandom, always first pool element
const pools: Record<string, string[]> = {
  adjective: ['fierce', 'gentle'],
  animal: ['fox', 'owl'],
}
const variants = generatePromptVariants(
  'A {{adjective}} {{animal}} guards a {{adjective}} tower.',
  3,
  (key) => pools[key],
  (values) => values[0]!,
)

assert.equal(variants.length, 3)
for (let i = 0; i < variants.length; i++) {
  assert.equal(variants[i]!.variantKey, `random-${i + 1}`)
  assert.equal(variants[i]!.promptUsed, 'A fierce fox guards a fierce tower.')
  assert.deepEqual(variants[i]!.randomSelections, {
    adjective: 'fierce',
    animal: 'fox',
  })
}

// Case-insensitive / whitespace-tolerant placeholder matching, and repeated keys
// all resolve to the same rolled value within one variant.
const singleVariant = generatePromptVariants(
  '{{ Animal }} meets {{animal}} meets {{ANIMAL}}',
  1,
  () => ['owl'],
)
assert.equal(singleVariant[0]!.promptUsed, 'owl meets owl meets owl')
assert.deepEqual(singleVariant[0]!.randomSelections, { animal: 'owl' })

console.log('Prompt variant generation verified.')
