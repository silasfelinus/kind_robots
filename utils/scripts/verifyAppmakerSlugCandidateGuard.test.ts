// /utils/scripts/verifyAppmakerSlugCandidateGuard.test.ts
//
// Regression test for checkSlugCandidateGuard() in
// verifyAppmakerSlugCandidateGuard.ts (appmaker/t-004). Exercises the real
// check against synthetic component-shaped fixtures covering: the fixed
// shape (empty-candidate branch conditioned on form.title.trim()), the
// pre-fix shape (bare `if (!candidate || SLUG_RE.test(candidate)) return
// ''` with no title check at all), and a partial regression (the
// !candidate branch still exists but no longer references form.title).
import assert from 'node:assert/strict'

import { checkSlugCandidateGuard } from './verifyAppmakerSlugCandidateGuard.js'

function fixture(slugErrorBody: string): string {
  return `
<script setup lang="ts">
const slugPreview = computed(() =>
  form.title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40),
)

const slugError = computed(() => {
${slugErrorBody}
})

const fleet = computed(() => [])
</script>
`
}

const FIXED = fixture(`
  const candidate = form.slug.trim().toLowerCase() || slugPreview.value
  if (!candidate) {
    return form.title.trim()
      ? 'Enter a slug — the title has no letters or digits to build one from.'
      : ''
  }
  if (SLUG_RE.test(candidate)) return ''
  return 'Slug must be kebab-case: start with a letter, then letters/digits/hyphens.'
`)

// Pre-fix shape: a single combined check, empty candidate always passes
// regardless of the title.
const BUGGY = fixture(`
  const candidate = form.slug.trim().toLowerCase() || slugPreview.value
  if (!candidate || SLUG_RE.test(candidate)) return ''
  return 'Slug must be kebab-case: start with a letter, then letters/digits/hyphens.'
`)

// Partial regression: the !candidate branch survived as its own `if`, but
// it no longer consults form.title, so it still always returns ''.
const PARTIALLY_REGRESSED = fixture(`
  const candidate = form.slug.trim().toLowerCase() || slugPreview.value
  if (!candidate) {
    return ''
  }
  if (SLUG_RE.test(candidate)) return ''
  return 'Slug must be kebab-case: start with a letter, then letters/digits/hyphens.'
`)

function run(): void {
  const fixedErrors = checkSlugCandidateGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const buggyErrors = checkSlugCandidateGuard(BUGGY)
  assert.equal(
    buggyErrors.length,
    2,
    `expected the pre-fix fixture (no separate !candidate branch, no title ` +
      `check) to fail both checks, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(buggyErrors.some((e) => /no longer branches separately/.test(e)))
  assert.ok(
    buggyErrors.some((e) => /no longer checks form\.title\.trim/.test(e)),
  )

  const regressedErrors = checkSlugCandidateGuard(PARTIALLY_REGRESSED)
  assert.equal(
    regressedErrors.length,
    1,
    'expected a fixture with a bare !candidate branch that never checks ' +
      `form.title to fail only the title-check assertion, got: ${JSON.stringify(regressedErrors)}`,
  )
  assert.ok(
    regressedErrors.some((e) => /no longer checks form\.title\.trim/.test(e)),
  )

  const missingFunction = checkSlugCandidateGuard(
    '<script setup lang="ts">\nconst somethingElse = 1\n</script>\n',
  )
  assert.equal(missingFunction.length, 1)
  assert.ok(missingFunction.some((e) => /Could not find/.test(e)))

  console.log(
    'AppMaker slug-candidate guard self-test passed: buggy fixture fails, ' +
      'fixed fixture passes, a partially-regressed fixture fails, and a ' +
      'missing slugError() is detected.',
  )
}

run()
