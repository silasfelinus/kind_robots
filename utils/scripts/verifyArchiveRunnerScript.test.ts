// /utils/scripts/verifyArchiveRunnerScript.test.ts
//
// The archive runner embeds ~320 lines of JavaScript inside a shell heredoc,
// and NOTHING was checking it.
//
// `bash -n` validates the shell and stops at the heredoc, which is opaque to
// it. `node --check` would validate syntax, but the bug that actually shipped
// was not a syntax error:
//
//   ReferenceError: requestPath is not defined
//
// The backfill loop called `request(requestPath, ...)` while the variable has
// been called `path` since the file was written. That parses fine, passes
// `bash -n`, passes every contract in the repo, and fails the moment an
// operator runs it against production -- which is exactly where it failed
// (art-archive/t-041, 2026-09-23).
//
// A typo reaches production here more easily than anywhere else in the repo,
// because this code is never imported, never type-checked and never executed
// by CI. So the embedded program is extracted and linted for undefined
// references, the one class of error that separates "it runs" from "it parses".
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ESLint } from 'eslint'

const RUNNER = 'scripts/art-archive-ingest.sh'
const source = readFileSync(RUNNER, 'utf8')

// ---- pull the program out of the heredoc ---------------------------------
const open = source.indexOf("REQUEST_JS=$(cat <<'NODE'")
assert.ok(open > -1, `${RUNNER} must embed its program in a NODE heredoc`)
const bodyStart = source.indexOf('\n', open) + 1
const bodyEnd = source.indexOf('\nNODE\n', bodyStart)
assert.ok(bodyEnd > bodyStart, 'the NODE heredoc must be closed')

const program = source.slice(bodyStart, bodyEnd)
assert.ok(
  program.split('\n').length > 100,
  'the extracted program should be the whole runner, not a fragment',
)

// ---- it must parse, and every name it uses must exist --------------------
// The parse check rides on the linter rather than `new Function`, because the
// program is an ES module and `new Function` cannot parse `import`.
// This is the check that would have caught `requestPath`.
const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        process: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        TextDecoder: 'readonly',
        TextEncoder: 'readonly',
        fetch: 'readonly',
      },
    },
    rules: { 'no-undef': 'error' },
  },
})

const [result] = await eslint.lintText(program, {
  filePath: 'art-archive-ingest.embedded.mjs',
})
const messages = result?.messages ?? []

const fatal = messages.filter((message) => message.fatal)
assert.deepEqual(
  fatal.map((m) => `line ${m.line}: ${m.message}`),
  [],
  'the embedded program must parse',
)

const undefined_ = messages.filter((message) => message.ruleId === 'no-undef')

assert.deepEqual(
  undefined_.map((m) => `line ${m.line}: ${m.message}`),
  [],
  `${RUNNER}'s embedded program references a name that does not exist. This ` +
    'parses and passes `bash -n`, and fails only when an operator runs it.',
)

// ---- each mode the flags advertise is actually implemented ---------------
// A flag the shell accepts but the program never branches on would run the
// wrong request silently rather than erroring.
const flagModes: [string, string][] = [
  ['--import', 'KR_INGEST_BATCH'],
  ['--backfill-seeds', 'KR_INGEST_BACKFILL'],
]
for (const [flag, envVar] of flagModes) {
  assert.ok(source.includes(`${flag})`), `${RUNNER} must accept ${flag}`)
  assert.ok(
    source.includes(`-e ${envVar}=`),
    `${flag} must pass ${envVar} through to the container`,
  )
  assert.ok(
    program.includes(`process.env.${envVar}`),
    `the embedded program must branch on ${envVar}, or ${flag} silently does ` +
      'whatever the default mode does',
  )
}

console.log(
  'Archive runner script verified: the embedded program parses, every name it ' +
    'uses is defined (the check that catches a ReferenceError before an ' +
    'operator does), and every mode the flags advertise is passed through and ' +
    'branched on.',
)
