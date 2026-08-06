// /utils/scripts/verifyAcademyStyleGalleryDisclosure.ts
//
// Regression guard for ai-art-academy/t-010 (lane-1 accessibility audit,
// 2026-08-06: see projects/ai-art-academy/docs/frontend-audits/2026-08-06-style-gallery-accessibility.md
// in the conductor repo). Every lesson tile in academy-styles-browser.vue used to bind
// `aria-controls` unconditionally to `academy-style-detail-${style.slug}`, but the detail
// element with that id only exists in the DOM while that lesson is expanded
// (`v-if="expandedStyle"`). That made every collapsed tile's `aria-controls` point at a
// nonexistent element -- an inaccurate disclosure relationship for assistive technology,
// and dozens of broken id references on initial render. Fixed by binding `aria-controls`
// only for the currently expanded tile (`undefined` otherwise). This script fails CI if
// the unconditional-binding regression reappears.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const COMPONENT_PATH = path.resolve(
  'components/academy/academy-styles-browser.vue',
)

const contents = fs.readFileSync(COMPONENT_PATH, 'utf8')

// The regression pattern: aria-controls bound directly to a template-literal id with no
// surrounding conditional. Matches e.g. `:aria-controls="`academy-style-detail-${style.slug}`"`.
const UNCONDITIONAL_PATTERN =
  /:aria-controls="`academy-style-detail-\$\{[^}]+\}`"/

assert.ok(
  !UNCONDITIONAL_PATTERN.test(contents),
  'academy-styles-browser.vue binds aria-controls unconditionally to every lesson tile again ' +
    '-- the controlled detail element only exists for the expanded tile, so this must be ' +
    "conditional (undefined when collapsed). See t-010's 2026-08-06 lane-1 accessibility audit.",
)

// The expected repair: a ternary that resolves to undefined for every tile except the one
// matching expandedSlug (component-agnostic about the exact variable name on the "collapsed"
// branch, but it must resolve to undefined/null there).
const CONDITIONAL_PATTERN =
  /:aria-controls="\s*[\s\S]*?===\s*style\.slug\s*[\s\S]*?\?\s*`academy-style-detail-\$\{[^}]+\}`\s*:\s*undefined\s*"/

assert.ok(
  CONDITIONAL_PATTERN.test(contents),
  'academy-styles-browser.vue is missing the conditional aria-controls binding that only ' +
    "points at the expanded lesson's detail element (and undefined for every collapsed " +
    "tile). See t-010's 2026-08-06 lane-1 accessibility audit for the exact expected shape.",
)

console.log(
  'academy-styles-browser.vue disclosure contract verified: aria-controls is bound only for ' +
    'the expanded lesson tile.',
)
