// /utils/scripts/verifyFacetLegacyPromptSignature.ts
//
// The v2/v3 Facet art producers persisted a generated wrapper into
// Facet.artPrompt. The v4 repair must recognize every shape of that wrapper
// (so it regenerates a semantic prompt) while never touching a curated prompt.
//
// 2026-09-05: the first production `--repair-tainted --write` run aborted on
// ten Facets whose titles contain straight quotes inside the curly-quoted
// wrapper ("Carries a candle everywhere "just in case.""). The old signature
// used one character class excluding both quote styles, so those prompts read
// as curated, went to Krea verbatim, and the prompt contract rejected them.
import assert from 'node:assert/strict'
import { isLegacyGeneratedFacetPrompt } from '../../scripts/generate_facet_art_v4'

const wrapperPrompts = [
  'Illustrate the Facet concept “Surreal Horror”. A dream logic nightmare. Build one iconic scene.',
  'Illustrate the Facet concept "Surreal Horror". A dream logic nightmare.',
  'Illustrate the Facet concept “Carries a candle everywhere "just in case."”. The case has arrived twice. Use a character-centered visual metaphor with a clear emotional read and no written explanation.',
  'Illustrate the Facet concept “Clone #47 — the one who finally asked "why?"”. Forty-six of them did not ask.',
  'Illustrate the Facet concept “Keeps an invisible "force field" around themselves.”. Maintains a precise personal radius.',
  '  Illustrate the Facet concept “Aardvark”.  ',
]
for (const prompt of wrapperPrompts) {
  assert.ok(
    isLegacyGeneratedFacetPrompt(prompt),
    `generated wrapper must be recognized as legacy provenance: ${prompt}`,
  )
}

const curatedPrompts = [
  'A surreal dreamscape where physics gently misbehaves, floating impossible objects, warm and uncanny.',
  'A hand-painted rescue buoy, its paint chipped down to bare metal along one whole side.',
  'A poster that says "Illustrate the Facet concept" in peeling letters on a brick wall.',
  'Facet of a cut gemstone, illustrate the refraction with prismatic light.',
  '',
  null,
  undefined,
]
for (const prompt of curatedPrompts) {
  assert.equal(
    isLegacyGeneratedFacetPrompt(prompt),
    false,
    `curated or empty prompt must never be treated as the generated wrapper: ${String(prompt)}`,
  )
}

console.log('Facet legacy prompt signature contract verified.')
