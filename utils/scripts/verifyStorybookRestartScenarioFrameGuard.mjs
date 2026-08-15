// /utils/scripts/verifyStorybookRestartScenarioFrameGuard.mjs
//
// Regression guard (storybook/t-010, front-end polish). A story can be
// framed on a Scenario -- "the plot thread ... the cast, setting and Facets
// below reshape how it plays out rather than being decoration on it"
// (storybookStore.ts biblePrompt()). `restartStory()` in
// storybookLibraryHelper.ts rebuilds a fresh `StorybookStartInput` from the
// old bible via `restartInput(bible)` and passes it straight to
// `bridge.beginStory()`, which builds the new session's bible from exactly
// that object (buildBible() sets `scenario: input.scenario`).
//
// `scenario` is optional on both `StorybookBible` and `StorybookStartInput`,
// so a `restartInput()` that simply forgot to carry it over type-checked
// cleanly while silently downgrading every restarted Scenario story into a
// freeform one: the new bible's `scenario` is `undefined`, `biblePrompt()`
// then never emits the "Plot thread" section, and the reader gets a
// differently-framed story with no error, warning, or indication that their
// chosen frame was dropped.
//
// This asserts the fix's shape stays in place: `restartInput()` still
// forwards the source bible's `scenario` into the object it returns.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const HELPER_PATH = 'stores/helpers/storybookLibraryHelper.ts'
const FN_NAME = 'restartInput'

function extractFunctionBody(content, name) {
  const signaturePattern = new RegExp(`^function ${name}\\s*\\(`, 'm')
  const match = signaturePattern.exec(content)
  if (!match) {
    throw new Error(
      `Could not find \`function ${name}(\` in ${HELPER_PATH} -- has it ` +
        'been renamed, removed, or inlined? If so, this guard (and the ' +
        'dropped-Scenario-on-restart bug it protects against) needs to move ' +
        'with it.',
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

const content = readFileSync(resolve(process.cwd(), HELPER_PATH), 'utf8')
const body = extractFunctionBody(content, FN_NAME)

assert.ok(
  /scenario:\s*bible\.scenario/.test(body),
  `${FN_NAME}() no longer contains \`scenario: bible.scenario\` -- it must ` +
    "forward the source story's Scenario frame into the restarted story's " +
    'input, or restarting a Scenario-framed story silently downgrades it ' +
    'into a freeform one with no error surfaced to the reader.',
)

// restartStory() must still route this object straight into beginStory()
// unmodified -- otherwise the fix above is dead code that never reaches the
// call that actually builds the new session's bible.
assert.ok(
  /await bridge\.beginStory\(restartInput\(source\.bible\)\)/.test(content),
  `${HELPER_PATH} must still pass \`restartInput(source.bible)\` directly ` +
    "into bridge.beginStory() -- otherwise this guard's fix is not " +
    'actually reachable from restartStory().',
)

console.log(
  'Storybook restart-scenario-frame guard contract passed: restartInput() ' +
    "still forwards the source story's Scenario into the restarted story, " +
    'so restarting a Scenario-framed story keeps its plot-thread frame ' +
    'instead of silently becoming a freeform story.',
)
