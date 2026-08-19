// /utils/scripts/verifyStorybookComposerImeCompositionGuard.mjs
//
// Regression guard (storybook/t-010, front-end polish). The response
// textarea in narrative-response-composer.vue used to bind
// `@keydown.enter.exact.prevent="submit()"` directly. Vue's `.enter` key
// modifier matches on `event.key === 'Enter'` alone -- it does not consult
// `event.isComposing` -- and browsers deliver an Enter `keydown` for the
// keystroke a reader uses to CONFIRM an in-progress IME composition
// (Japanese/Chinese/Korean input, among others), not only for a keystroke
// that ends composition and submits. With the old binding, that confirming
// Enter both called `preventDefault()` (stopping the browser from finalizing
// the composed text) and immediately submitted the story response --
// hijacking the keystroke and sending a premature, unfinished response the
// reader was still in the middle of composing.
//
// This asserts the fix's shape stays in place: the textarea's `keydown.enter`
// binding routes through a named handler that checks `event.isComposing` and
// returns early -- without calling `preventDefault()` or `submit()` -- before
// doing either.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { extractTsFunctionBody } from './lib/extractTsFunctionBody.mjs'

const COMPOSER_PATH = 'components/narrative/narrative-response-composer.vue'
const HANDLER_NAME = 'handleEnterKeydown'

function source(path) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

const composer = source(COMPOSER_PATH)

// --- template: the textarea must route Enter through the named handler,
// not call submit()/preventDefault() directly off the bare key modifier ---

assert.ok(
  !/@keydown\.enter\.exact\.prevent\s*=\s*"submit\(\)"/.test(composer),
  `${COMPOSER_PATH} still binds \`@keydown.enter.exact.prevent="submit()"\` ` +
    "directly on the textarea -- Vue's `.enter` modifier does not check " +
    '`event.isComposing`, so the Enter press a reader uses to confirm an ' +
    'in-progress IME composition (Japanese/Chinese/Korean input, among ' +
    'others) gets hijacked into submitting an unfinished response. Route ' +
    `it through a handler that checks \`event.isComposing\` first.`,
)

assert.ok(
  new RegExp(`@keydown\\.enter\\.exact\\s*=\\s*"${HANDLER_NAME}"`).test(
    composer,
  ),
  `${COMPOSER_PATH}'s textarea must bind \`@keydown.enter.exact="${HANDLER_NAME}"\` ` +
    `so Enter routes through the IME-aware handler instead of calling ` +
    '`submit()` directly.',
)

// --- script: the handler must check event.isComposing and bail before
// preventDefault()/submit() ---

const handlerBody = extractTsFunctionBody(composer, HANDLER_NAME, {
  path: COMPOSER_PATH,
  notFoundHint:
    'has the IME-composition guard been renamed, removed, or inlined? If ' +
    'so, this guard (and the premature-submit bug it protects against) ' +
    'needs to move with it',
})

const isComposingCheckIndex = handlerBody.search(
  /if\s*\(\s*event\.isComposing\s*\)\s*return/,
)
assert.ok(
  isComposingCheckIndex >= 0,
  `${HANDLER_NAME}() in ${COMPOSER_PATH} no longer checks ` +
    '`event.isComposing` and returns early -- without it, the Enter press ' +
    'a reader uses to confirm an in-progress IME composition submits the ' +
    'response prematurely instead of finalizing the composed text.',
)

const preventDefaultIndex = handlerBody.indexOf('event.preventDefault()')
const submitCallIndex = handlerBody.indexOf('submit()')

assert.ok(
  preventDefaultIndex > isComposingCheckIndex &&
    submitCallIndex > isComposingCheckIndex,
  `${HANDLER_NAME}() in ${COMPOSER_PATH} must check \`event.isComposing\` ` +
    'and return BEFORE calling `event.preventDefault()` or `submit()` -- ' +
    'checking it after either call is too late to stop the composition ' +
    'from being hijacked.',
)

console.log(
  'Storybook composer IME-composition guard contract passed: the response ' +
    'textarea routes Enter through a handler that checks `event.isComposing` ' +
    'before preventing default or submitting, so confirming an in-progress ' +
    "IME composition can't hijack a premature story response submission.",
)
