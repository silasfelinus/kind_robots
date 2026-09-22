// /utils/scripts/verifyFacetCardCopyRebuild.ts
//
// A stored Facet.artPrompt is rebuilt when it carries the Facet's own
// description, not only when it ends in a clause this codebase already knows
// about.
//
// Silas, 2026-09-22, on Facet 810 "Martian Colonization": "Yet again I'm seeing
// krea prompts that are metaphors rather than literal ... Wtf? Why does this
// keep happening". Its live artPrompt was the title plus the description
// verbatim -- "The particular engineering and politics of settling Mars. Dust,
// radiation, supply lag, and the question of whose law applies at that
// distance" -- and both producers returned it untouched, because
// isLegacyGeneratedFacetPrompt is a whitelist of clauses and a repair pass had
// already trimmed this row's clause off the end. The missing final period is
// the cut.
//
// That is the sixth time this cohort has been diagnosed from the pictures
// rather than from the prompts, and the fifth fix that added another string to
// the whitelist. storedPromptIsCardCopy is the first test here that asks a
// property of the text instead, so a batch nobody has seen yet is still caught.
import assert from 'node:assert/strict'
import {
  buildFacetIdentityPromptFrom,
  isLegacyGeneratedFacetPrompt,
  storedPromptIsCardCopy,
} from '../../utils/facetVisualLanguage'
import { buildFacetIdentityPrompt } from '../../scripts/generate_facet_art_v4'

const MARTIAN_DESCRIPTION =
  'The particular engineering and politics of settling Mars. Dust, radiation, ' +
  'supply lag, and the question of whose law applies at that distance.'
// Exactly as stored on Facet 810 on 2026-09-22, trailing period and all (there
// isn't one -- that is the point).
const MARTIAN_STORED =
  'Martian Colonization. The particular engineering and politics of settling ' +
  'Mars. Dust, radiation, supply lag, and the question of whose law applies at ' +
  'that distance'

// The whitelist genuinely cannot see this row. If it ever can, the test below
// stops proving anything and this assertion is the one that says so.
assert.equal(
  isLegacyGeneratedFacetPrompt(MARTIAN_STORED),
  false,
  'the live row carries no registered clause -- that is why a whitelist misses it',
)
assert.equal(
  storedPromptIsCardCopy(MARTIAN_STORED, MARTIAN_DESCRIPTION),
  true,
  'a prompt containing its own description was assembled, not authored',
)

// End to end through the producer: the stored string must not come back.
const rebuilt = buildFacetIdentityPrompt(
  {
    title: 'Martian Colonization',
    description: MARTIAN_DESCRIPTION,
    artPrompt: MARTIAN_STORED,
    flavorText: null,
    examples: null,
  } as never,
  { taxonomy: 'GENRE', metadata: null } as never,
)
assert.notEqual(
  rebuilt,
  MARTIAN_STORED,
  'the producer must rebuild a card-copy prompt rather than return it verbatim',
)
assert.ok(
  rebuilt.startsWith('Martian Colonization.'),
  `the rebuild must still name the Facet: ${rebuilt}`,
)
assert.ok(
  !rebuilt.includes('whose law applies'),
  `the card copy must not survive the rebuild: ${rebuilt}`,
)
assert.ok(
  rebuilt.includes('A scene of this kind underway'),
  `a GENRE row with no depictable prose falls back to its taxonomy clause: ${rebuilt}`,
)

/*
 * The rebuild is non-lossy, which is what makes it safe to apply to all 595
 * live prompts that embed their description without reading them one by one: a
 * description that really does describe a picture goes back through
 * depictableProse and survives.
 */
const CONCRETE = 'A row of identical blank-eyed figures on a conveyor line.'
assert.ok(
  buildFacetIdentityPromptFrom({
    title: 'Batch-Made',
    taxonomy: 'THEME',
    description: CONCRETE,
  }).includes('conveyor line'),
  'depictable prose must survive a rebuild',
)

// Prose a person wrote is still returned verbatim. Rebuilding one of those
// would be the worse bug, and is the reason the bypass exists at all.
const AUTHORED =
  'A row of identical blank-eyed figures on a conveyor line under flat white light.'
assert.equal(
  storedPromptIsCardCopy(AUTHORED, 'Made in bulk, and it shows.'),
  false,
  'an authored prompt that shares no description text is never rebuilt',
)
assert.equal(
  buildFacetIdentityPrompt(
    {
      title: 'Batch-Made',
      description: 'Made in bulk, and it shows.',
      artPrompt: AUTHORED,
      flavorText: null,
      examples: null,
    } as never,
    { taxonomy: 'THEME', metadata: null } as never,
  ),
  AUTHORED,
  'a curated prompt must still bypass the producer untouched',
)

// A short description is usually a restatement of the title, so it must not
// drag an unrelated prompt into a rebuild on a shared phrase.
assert.equal(
  storedPromptIsCardCopy(
    'Bright red. A single large form filling the picture.',
    'Bright red.',
  ),
  false,
  'a description under the length floor never triggers a rebuild',
)
assert.equal(
  storedPromptIsCardCopy('', 'anything at all, at some length here'),
  false,
)
assert.equal(storedPromptIsCardCopy(null, null), false)

// Curly quotes and collapsed whitespace differ between the stored description
// and the pasted copy; the match is on normalized text or it misses the rows it
// exists for.
assert.equal(
  storedPromptIsCardCopy(
    'Clone #47.  Forty-six of them  didn’t ask, and the forty-seventh one finally did.',
    "Forty-six of them didn't ask, and the forty-seventh one finally did.",
  ),
  true,
  'quote style and whitespace must not cost the match',
)

console.log('Facet card-copy rebuild contract verified.')
