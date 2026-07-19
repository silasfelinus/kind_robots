// /utils/scripts/verifyAnimationComponentAttempts.ts
// Regression guard for conductor's animation-manager t-004: naming/parsing/tag
// conventions used to log animation build attempts as Component "museum" rows
// (stores/helpers/animationComponentHelper.ts). Pure logic only -- no database.
import assert from 'node:assert/strict'
import { animationEffects } from '@/stores/animationCatalog'
import {
  ANIMATION_ATTEMPT_FOLDER,
  buildAnimationAttemptPayload,
  buildAnimationComponentName,
  buildSupersededTags,
  getLatestAnimationAttempt,
  isAnimationAttemptComponent,
  listAnimationAttempts,
  nextAnimationBuildNumber,
  parseAnimationAttemptTags,
  parseAnimationComponentName,
} from '@/stores/helpers/animationComponentHelper'

// Keep in sync with server/api/components/[id].patch.ts's componentNameValue --
// a naming convention that the server would reject on the very first PATCH
// (e.g. a status update) is useless in practice.
const SERVER_COMPONENT_NAME_PATTERN = /^[a-zA-Z0-9\s@-]+$/

assert.equal(
  buildAnimationComponentName('bioluminescent-tide', 1),
  'bioluminescent-tide@v1',
)
assert.deepEqual(parseAnimationComponentName('bioluminescent-tide@v1'), {
  slug: 'bioluminescent-tide',
  buildNumber: 1,
})
assert.deepEqual(parseAnimationComponentName('gravity-garden@v12'), {
  slug: 'gravity-garden',
  buildNumber: 12,
})
assert.equal(
  parseAnimationComponentName('bioluminescent-tide'),
  null,
  'a bare catalog slug (no @v suffix) must not parse as an attempt component -- ' +
    'that name belongs to the WonderLab reconciliation system\'s live-file row',
)
assert.equal(parseAnimationComponentName('not-versioned@vX'), null)

assert.throws(() => buildAnimationComponentName('', 1))
assert.throws(() => buildAnimationComponentName('slug', 0))
assert.throws(() => buildAnimationComponentName('slug', 1.5))

for (const effect of animationEffects) {
  const componentName = buildAnimationComponentName(effect.id, 1)
  assert.ok(
    SERVER_COMPONENT_NAME_PATTERN.test(componentName),
    `componentName "${componentName}" (from catalog id "${effect.id}") would be ` +
      'rejected by the server PATCH route\'s componentName validation',
  )
  assert.deepEqual(parseAnimationComponentName(componentName), {
    slug: effect.id,
    buildNumber: 1,
  })
}

const attemptRow = (folderName: string, componentName: string) => ({
  folderName,
  componentName,
})

assert.equal(
  isAnimationAttemptComponent(attemptRow('screenfx', 'bioluminescent-tide@v1')),
  true,
)
assert.equal(
  isAnimationAttemptComponent(attemptRow('screenfx', 'bioluminescent-tide')),
  false,
  'the live-file WonderLab row (no @v suffix) must not be treated as an attempt',
)
assert.equal(
  isAnimationAttemptComponent(attemptRow('academy', 'bioluminescent-tide@v1')),
  false,
  'only folderName "screenfx" rows count as animation attempts',
)

const mixedComponents = [
  attemptRow('screenfx', 'bioluminescent-tide@v2'),
  attemptRow('screenfx', 'bioluminescent-tide@v1'),
  attemptRow('screenfx', 'gravity-garden@v1'),
  attemptRow('screenfx', 'bioluminescent-tide'), // live-file row, must be excluded
  attemptRow('academy', 'unrelated@v1'), // wrong folder, must be excluded
]

const tideAttempts = listAnimationAttempts(mixedComponents, 'bioluminescent-tide')
assert.deepEqual(
  tideAttempts.map((c) => c.componentName),
  ['bioluminescent-tide@v1', 'bioluminescent-tide@v2'],
  'listAnimationAttempts must filter to the requested slug and sort ascending by build number',
)

const allAttempts = listAnimationAttempts(mixedComponents)
assert.equal(allAttempts.length, 3, 'listAnimationAttempts with no slug returns every attempt row')

assert.equal(
  getLatestAnimationAttempt(mixedComponents, 'bioluminescent-tide')?.componentName,
  'bioluminescent-tide@v2',
)
assert.equal(getLatestAnimationAttempt(mixedComponents, 'no-such-slug'), null)

assert.equal(nextAnimationBuildNumber(mixedComponents, 'bioluminescent-tide'), 3)
assert.equal(nextAnimationBuildNumber(mixedComponents, 'gravity-garden'), 2)
assert.equal(nextAnimationBuildNumber(mixedComponents, 'brand-new-slug'), 1)

const payload = buildAnimationAttemptPayload({
  slug: 'bioluminescent-tide',
  buildNumber: 1,
  title: 'Bioluminescent Tide v1',
  status: 'WORKING',
  summary: 'First shipped build.',
  catalogId: 'bioluminescent-tide',
  componentPath: 'components/screenfx/bioluminescent-tide.vue',
  commit: 'afb88af80c2ae3816c6698830e13169e1b805ebf',
  pr: 'kind_robots#237',
  technique: 'canvas 2D, cursor wake, click ripples',
  qualityChecklist: [
    { item: 'reduced-motion behavior', passed: true },
    { item: 'cleanup on unmount', passed: true },
  ],
})

assert.equal(payload.folderName, ANIMATION_ATTEMPT_FOLDER)
assert.equal(payload.componentName, 'bioluminescent-tide@v1')
assert.equal(payload.status, 'WORKING')
assert.equal(payload.notes, 'First shipped build.')
assert.ok(
  SERVER_COMPONENT_NAME_PATTERN.test(String(payload.componentName)),
  'buildAnimationAttemptPayload must produce a server-acceptable componentName',
)

const payloadTags = parseAnimationAttemptTags(payload.tags)
assert.ok(payloadTags, 'payload tags must parse back as valid animation attempt tags')
assert.equal(payloadTags?.slug, 'bioluminescent-tide')
assert.equal(payloadTags?.buildNumber, 1)
assert.equal(payloadTags?.commit, 'afb88af80c2ae3816c6698830e13169e1b805ebf')
assert.equal(payloadTags?.pr, 'kind_robots#237')
assert.equal(payloadTags?.supersededBy, null, 'a freshly built attempt starts with no supersession')

const noSummaryPayload = buildAnimationAttemptPayload({
  slug: 'gravity-garden',
  buildNumber: 1,
  title: 'Gravity Garden v1',
  status: 'UNDER_CONSTRUCTION',
})
assert.equal(noSummaryPayload.notes, null, 'an omitted summary must serialize to null, not undefined or ""')

assert.equal(parseAnimationAttemptTags(null), null)
assert.equal(parseAnimationAttemptTags(undefined), null)
assert.equal(parseAnimationAttemptTags('not-an-object' as never), null)
assert.equal(parseAnimationAttemptTags({ slug: 'x' } as never), null, 'missing buildNumber must fail validation')

const previousRow = { tags: payload.tags }
const supersededTags = parseAnimationAttemptTags(
  buildSupersededTags(previousRow, 'bioluminescent-tide@v2'),
)
assert.equal(supersededTags?.supersededBy, 'bioluminescent-tide@v2')
assert.equal(supersededTags?.slug, 'bioluminescent-tide', 'linking supersession must preserve every other tag field')
assert.equal(supersededTags?.commit, 'afb88af80c2ae3816c6698830e13169e1b805ebf')

assert.throws(
  () => buildSupersededTags({ tags: null }, 'x@v2'),
  /no valid animation attempt tags/,
  'linking supersession against a row with no attempt tags must fail loudly, not silently corrupt data',
)

console.log(
  'Animation attempt Component conventions verified: naming/parsing round-trips, ' +
    `all ${animationEffects.length} catalog slugs produce a server-acceptable componentName, ` +
    'listing/latest/next-build-number, payload composition, and supersession linking.',
)
