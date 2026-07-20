import assert from 'node:assert/strict'
import type { WonderLabComponentSourceEvidence } from '@/utils/wonderlab/componentManifest'
import {
  assertWonderLabReviewGrounding,
  validateWonderLabReviewGrounding,
} from '@/utils/wonderlab/reviewDraftGrounding'

const evidence: WonderLabComponentSourceEvidence = {
  version: 1,
  lineCount: 240,
  blocks: ['template', 'script'],
  props: ['showImages', 'variant'],
  emits: ['saved'],
  customComponents: ['character-card'],
  nativeElements: ['button', 'section', 'select'],
  staticText: ['Add Character', 'Choose a character'],
  functionNames: ['closeCharacterForm'],
  localImports: ['characterStore'],
  facts: [
    'Declared props: showImages, variant.',
    'Declared emitted events: saved.',
    'Template composes custom components: character-card.',
    'Template uses native elements: button, section, select.',
    'Static interface text includes: Add Character, Choose a character.',
    'Source-defined functions include: closeCharacterForm.',
    'Local source imports include: characterStore.',
  ],
}

const grounded = assertWonderLabReviewGrounding(
  'The character-card composition gives this gallery a concrete cast-facing center, while the showImages prop makes the display choice explicit.',
  [
    'The source declares a showImages prop.',
    'The template composes character-card.',
    'The interface includes the Add Character label.',
  ],
  evidence,
)
assert.equal(grounded.comment.grounded, true)
assert.ok(grounded.comment.highSignalMatches.includes('character card'))
assert.ok(grounded.observations.every((observation) => observation.grounded))

const structural = validateWonderLabReviewGrounding(
  'A section, button, and select establish a straightforward structural shell.',
  ['The template includes a section and button.'],
  evidence,
)
assert.equal(structural.comment.grounded, true)
assert.deepEqual(structural.observations[0]?.nativeElementMatches, [
  'button',
  'section',
])

assert.throws(
  () =>
    assertWonderLabReviewGrounding(
      'The glowing gradients and silky animation make this feel wonderfully responsive.',
      ['The animation runs smoothly on mobile devices.'],
      evidence,
    ),
  /does not overlap the supplied Component source evidence/,
)

assert.throws(
  () =>
    assertWonderLabReviewGrounding(
      'The character-card composition creates a clear focal point.',
      [
        'The template composes character-card.',
        'The color palette has excellent contrast.',
      ],
      evidence,
    ),
  /unsupported source observations at position\(s\): 2/,
)

assert.throws(
  () =>
    assertWonderLabReviewGrounding(
      'A single button provides the interaction.',
      ['The source includes one button.'],
      evidence,
    ),
  /does not overlap the supplied Component source evidence/,
  'generic native elements require at least two matches',
)

console.log('WonderLab generated review grounding boundary passed.')
