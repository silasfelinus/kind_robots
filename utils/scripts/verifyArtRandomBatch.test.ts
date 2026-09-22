// /utils/scripts/verifyArtRandomBatch.test.ts
//
// The contract behind "{character} running in {style}, batch 10":
// ten jobs, ten different characters, ten different styles, each carrying the
// LoRA weights it rolled -- and a replayable seed so that claim is checkable.
import assert from 'node:assert/strict'
import {
  dealWithoutReplacement,
  extractPlaceholderKeys,
  generateStructuredPromptVariants,
  normalizeVariantKey,
  parseVariantKey,
  seededRandom,
  type VariantPick,
} from '../../server/utils/promptVariants'

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
assert.deepEqual(
  extractPlaceholderKeys('{character} running in {style}'),
  [],
)
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
  assert.match(variant.promptUsed, /^hero-trigger-\d+ running in brush-trigger-\d+$/)
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
  () =>
    generateStructuredPromptVariants('{{gizmo}}', 2, () => undefined, {}),
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

console.log('Randomized art batch contract verified.')
