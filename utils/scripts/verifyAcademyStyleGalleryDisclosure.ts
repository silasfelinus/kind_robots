// /utils/scripts/verifyAcademyStyleGalleryDisclosure.ts
//
// Regression guard for ai-art-academy/t-010 lane-1 accessibility passes.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const COMPONENT_PATH = path.resolve(
  'components/academy/academy-styles-browser.vue',
)

const contents = fs.readFileSync(COMPONENT_PATH, 'utf8')

const UNCONDITIONAL_PATTERN =
  /:aria-controls="`academy-style-detail-\$\{[^}]+\}`"/

assert.ok(
  !UNCONDITIONAL_PATTERN.test(contents),
  'academy-styles-browser.vue binds aria-controls unconditionally to every lesson tile again ' +
    '-- the controlled detail element only exists for the expanded tile, so this must be ' +
    "conditional (undefined when collapsed). See t-010's 2026-08-06 lane-1 accessibility audit.",
)

const CONDITIONAL_PATTERN =
  /:aria-controls="\s*[\s\S]*?===\s*style\.slug\s*[\s\S]*?\?\s*`academy-style-detail-\$\{[^}]+\}`\s*:\s*undefined\s*"/

assert.ok(
  CONDITIONAL_PATTERN.test(contents),
  'academy-styles-browser.vue is missing the conditional aria-controls binding that only ' +
    "points at the expanded lesson's detail element (and undefined for every collapsed " +
    "tile). See t-010's 2026-08-06 lane-1 accessibility audit for the exact expected shape.",
)

assert.ok(
  /<img\s+[\s\S]*?:src="style\.previewImageSrc"[\s\S]*?alt=""[\s\S]*?\/>/.test(
    contents,
  ),
  'Academy lesson thumbnails must remain decorative. The visible style name already labels ' +
    'the enclosing button, so a repeated image alt makes assistive technology announce the ' +
    'lesson name twice.',
)

assert.ok(
  !/:alt="style\.name"/.test(contents),
  'Academy lesson thumbnails must not duplicate the visible style name in the button accessible name.',
)

console.log(
  'academy-styles-browser.vue accessibility contract verified: disclosure references are valid ' +
    'and preview thumbnails do not duplicate lesson names.',
)
