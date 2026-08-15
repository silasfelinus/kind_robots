// /utils/scripts/verifyStorybookRestartInputCompletenessGuard.mjs
//
// Regression guard (storybook/t-021, kaizen from t-010's restart-scenario-frame
// fix, kind_robots PR #1892). `restartInput()` in storybookLibraryHelper.ts
// rebuilds a fresh `StorybookStartInput` from a story's `StorybookBible` when
// the reader restarts it, and `buildBible()` in storybookStore.ts is the only
// place that turns a `StorybookStartInput` back into the new session's
// `StorybookBible`. Every field `buildBible()` reads off `input` has to
// survive that round trip, or a restarted story silently loses it with no
// type error and no runtime error -- exactly what happened to `scenario`
// before #1892 fixed that one field by hand.
//
// Rather than re-litigating field-by-field forever, this asserts the general
// shape: every `input.<field>` that `buildBible()` actually reads must appear
// as a key in the object `restartInput()` returns. It does not check the
// reverse direction (an extra key in `restartInput()`'s return with no
// matching `buildBible()` read is harmless, just unused) and it does not
// check runtime values -- only that the next optional field added to
// `StorybookBible`/`StorybookStartInput` and read by `buildBible()` cannot be
// silently forgotten in `restartInput()` the way `scenario` was.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const STORE_PATH = 'stores/storybookStore.ts'
const HELPER_PATH = 'stores/helpers/storybookLibraryHelper.ts'

function extractFunctionBody(content, name, path) {
  const signaturePattern = new RegExp(`^\\s*function ${name}\\s*\\(`, 'm')
  const match = signaturePattern.exec(content)
  if (!match) {
    throw new Error(
      `Could not find \`function ${name}(\` in ${path} -- has it been ` +
        'renamed, removed, or inlined? If so, this guard (and the ' +
        'dropped-field bug it protects against) needs to move with it.',
    )
  }

  const parenOpen = match.index + match[0].length - 1
  let parenDepth = 0
  let i = parenOpen
  for (; i < content.length; i++) {
    if (content[i] === '(') parenDepth++
    else if (content[i] === ')') {
      parenDepth--
      if (parenDepth === 0) break
    }
  }
  const braceOpen = content.indexOf('{', i)
  let braceDepth = 0
  let j = braceOpen
  for (; j < content.length; j++) {
    if (content[j] === '{') braceDepth++
    else if (content[j] === '}') {
      braceDepth--
      if (braceDepth === 0) break
    }
  }
  return content.slice(braceOpen, j + 1)
}

// Fields buildBible() actually consumes off `input` -- every `input.<field>`
// reference in its body, deduplicated. Covers both direct reads
// (`input.narratorStyle`) and reads inside a chained/nested expression
// (`input.title?.trim()`, `derivedTitle(input.premise)`).
function extractInputFieldsRead(body) {
  const fields = new Set()
  for (const match of body.matchAll(/\binput\.([a-zA-Z_$][\w$]*)/g)) {
    fields.add(match[1])
  }
  return fields
}

// Top-level keys of the object literal `restartInput()` returns. The
// function body is just `return { key: value, ... }` with no nested object
// literals, so a line-based `key:` scan across the object's own brace span
// is enough -- no need for a full expression parser.
function extractReturnedObjectKeys(body) {
  const returnMatch = /return\s*\{/.exec(body)
  if (!returnMatch) {
    throw new Error(
      `restartInput()'s body in ${HELPER_PATH} no longer returns an object ` +
        'literal directly -- this guard cannot verify field coverage ' +
        'against a shape it cannot see.',
    )
  }
  const braceOpen = returnMatch.index + returnMatch[0].length - 1
  let braceDepth = 0
  let k = braceOpen
  for (; k < body.length; k++) {
    if (body[k] === '{') braceDepth++
    else if (body[k] === '}') {
      braceDepth--
      if (braceDepth === 0) break
    }
  }
  const objectLiteral = body.slice(braceOpen + 1, k)
  const keys = new Set()
  for (const match of objectLiteral.matchAll(/^\s*([a-zA-Z_$][\w$]*)\s*:/gm)) {
    keys.add(match[1])
  }
  return keys
}

const storeContent = readFileSync(resolve(process.cwd(), STORE_PATH), 'utf8')
const helperContent = readFileSync(resolve(process.cwd(), HELPER_PATH), 'utf8')

const buildBibleBody = extractFunctionBody(
  storeContent,
  'buildBible',
  STORE_PATH,
)
const restartInputBody = extractFunctionBody(
  helperContent,
  'restartInput',
  HELPER_PATH,
)

const consumedFields = extractInputFieldsRead(buildBibleBody)
const forwardedKeys = extractReturnedObjectKeys(restartInputBody)

assert.ok(
  consumedFields.size > 0,
  `Found zero \`input.<field>\` reads in buildBible()'s body in ${STORE_PATH} ` +
    "-- the extraction regex likely no longer matches this function's " +
    'shape, which would make this guard vacuously pass.',
)

const missing = [...consumedFields].filter((field) => !forwardedKeys.has(field))

assert.deepEqual(
  missing,
  [],
  `restartInput() in ${HELPER_PATH} does not forward field(s) ` +
    `[${missing.join(', ')}] that buildBible() reads from StorybookStartInput ` +
    `-- restarting a story will silently drop ${missing.length === 1 ? 'this field' : 'these fields'} ` +
    'with no type error and no runtime error (the same bug class #1892 fixed ' +
    'for `scenario`). Add the missing key(s) to the object restartInput() returns.',
)

console.log(
  'Storybook restart-input-completeness guard contract passed: ' +
    `restartInput() forwards all ${consumedFields.size} StorybookStartInput ` +
    "field(s) buildBible() reads, so a restarted story can't silently lose " +
    'one the way `scenario` did before #1892.',
)
