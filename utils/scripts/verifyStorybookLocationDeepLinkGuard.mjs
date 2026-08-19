// /utils/scripts/verifyStorybookLocationDeepLinkGuard.mjs
//
// Regression guard (storybook/t-010 cycle 20). Cycle 19 left a kaizen lead:
// Facet, Reward, Character and Scenario detail surfaces each carry a "Start
// a story with this" CTA that navigates to /storybook with the object's slug
// in the matching query key (facet/reward/character/scenario), and
// storybook-page.vue's seedFromQuery() reads all five supported keys --
// including `?location=` -- into its setup draft. But Location has no
// first-class model or dedicated component of its own (unlike the other
// four): a LOCATION Dream's only detail surface is the generic
// dream-narration.vue workspace (opened from dream-gallery / dream-interact),
// and that workspace had no CTA at all. `?location=` was a dead query key --
// nothing in the app ever produced it -- so a reader browsing a LOCATION
// Dream had no way to jump into Storybook with that location pre-seeded,
// unlike readers browsing a Character, Reward, Scenario, or Facet.
//
// This closes the gap the same way character-manager.vue,
// reward-encounter.vue, facet-profile.vue and scenario-manager.vue do it:
// dream-narration.vue now renders a "Start a story with this" button (only
// when the selected Dream's dreamType is LOCATION and it has a slug) that
// navigates to /storybook with `query: { location: slug }`.
//
// This guard is deliberately narrow, matching verifyStorybookObjectEntryLinks
// and verifyStorybookCharacterDeepLinkGuard's convention: it checks the CTA's
// click handler exists, sends the real Dream slug under the `location` query
// key, is gated on dreamType === 'LOCATION', and that seedFromQuery() still
// consumes `?location=` into `draft.locationSlug`. It does not assert button
// classes, icon names, or layout -- a restyle of the CTA must not fail this.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { extractTsFunctionBody } from './lib/extractTsFunctionBody.mjs'

const NARRATION_PATH = 'components/dreams/dream-narration.vue'
const PAGE_PATH = 'components/conductor/storybook-page.vue'

function source(path) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

const narrationContent = source(NARRATION_PATH)

// The template must render the CTA gated on a computed that only resolves
// for LOCATION dreams, and wire its click to the handler.
assert.ok(
  narrationContent.includes('v-if="locationStorySlug"') &&
    narrationContent.includes('@click="startStoryWithLocation"'),
  `${NARRATION_PATH} must render a "Start a story with this" CTA gated on ` +
    '`locationStorySlug` and wired to `startStoryWithLocation` -- has the ' +
    'CTA been renamed, removed, or restructured?',
)

// locationStorySlug must only resolve for dreamType === 'LOCATION' -- if this
// gate is lost, every other Dream type (ART, BRAINSTORM, PITCH, WISH, ...)
// would grow a CTA that points Storybook at a query key seedFromQuery()
// cannot use for them.
const locationStorySlugMatch =
  /const locationStorySlug = computed\(\(\) => \{([\s\S]*?)\n\}\)/.exec(
    narrationContent,
  )
assert.ok(
  locationStorySlugMatch,
  `Could not find \`const locationStorySlug = computed\` in ${NARRATION_PATH} ` +
    '-- has it been renamed, removed, or restructured? If so, this guard ' +
    'needs to move with it.',
)
const locationStorySlugBody = locationStorySlugMatch[1]
assert.ok(
  /dream\.dreamType !== 'LOCATION'/.test(locationStorySlugBody),
  `\`locationStorySlug\` in ${NARRATION_PATH} must bail out for any Dream ` +
    "whose dreamType isn't LOCATION -- otherwise every Dream type gains a " +
    '"Start a story with this" CTA even though seedFromQuery() only has a ' +
    'query key for LOCATION dreams.',
)
assert.ok(
  /return dream\.slug \|\| ''/.test(locationStorySlugBody),
  `\`locationStorySlug\` in ${NARRATION_PATH} must resolve to the real ` +
    '`dream.slug` -- a synthetic or missing slug would not match what ' +
    "storybook-page.vue's `locationOptions` keys against.",
)

// The handler itself must send the real slug under the `location` query key,
// matching what seedFromQuery() reads.
const startStoryBody = extractTsFunctionBody(
  narrationContent,
  'startStoryWithLocation',
  {
    path: NARRATION_PATH,
    notFoundHint:
      'has it been renamed, removed, or inlined? If so, this guard needs ' +
      'to move with it.',
  },
)
assert.ok(
  /const slug = locationStorySlug\.value/.test(startStoryBody) &&
    /query:\s*\{\s*location:\s*slug\s*\}/.test(startStoryBody),
  `startStoryWithLocation() in ${NARRATION_PATH} must navigate to ` +
    "'/storybook' with `query: { location: slug }`, sourced from " +
    '`locationStorySlug.value` -- otherwise it no longer agrees with what ' +
    "storybook-page.vue's seedFromQuery() and locationOptions expect.",
)

// The receiving half of the contract: seedFromQuery() must still forward the
// raw ?location= query value into draft.locationSlug -- the CTA above is
// dead unless this still wires the query into the field Storybook actually
// reads for its setup draft.
const pageContent = source(PAGE_PATH)
const seedFromQueryBody = extractTsFunctionBody(pageContent, 'seedFromQuery', {
  path: PAGE_PATH,
  notFoundHint:
    'has it been renamed, removed, or inlined? If so, this guard needs to ' +
    'move with it.',
})
assert.ok(
  /draft\.locationSlug = location/.test(seedFromQueryBody) &&
    /const location = single\(route\.query\.location\)/.test(seedFromQueryBody),
  `seedFromQuery() in ${PAGE_PATH} must still read \`route.query.location\` ` +
    'into `draft.locationSlug` -- otherwise the new Location CTA in ' +
    `${NARRATION_PATH} has nothing to seed.`,
)

console.log(
  'Storybook location-deep-link guard contract passed: dream-narration.vue ' +
    'renders a "Start a story with this" CTA for LOCATION Dreams that sends ' +
    "the real Dream slug as ?location=, and storybook-page.vue's " +
    'seedFromQuery() still consumes it into the setup draft.',
)
