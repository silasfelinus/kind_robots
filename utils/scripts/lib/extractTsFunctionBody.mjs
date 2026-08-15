// /utils/scripts/lib/extractTsFunctionBody.mjs
//
// Shared brace-matching helper for the verifyStorybook* regression guards
// (and anything else that needs to pull a named function's body out of a
// TypeScript/Vue `<script setup>` source file by plain text, without pulling
// in a full parser). Originally hand-rolled, byte-for-byte identical except
// for the exact signature regex, in verifyStorybookAnswerInputPreservationGuard,
// verifyStorybookRestartScenarioFrameGuard, and
// verifyStorybookRestartInputCompletenessGuard (storybook/t-022, kaizen from
// t-021's kind_robots PR #1893).
//
// Handles both signature shapes seen across those guards: a plain
// `function name(` and an `async function name(`, with or without leading
// indentation (e.g. a function nested inside a `defineStore()` setup body).
// It intentionally does NOT match `export function name(` or arrow/const
// function forms -- none of the guarded functions use those shapes, and
// broadening the match risks silently matching the wrong declaration.
export function extractTsFunctionBody(
  content,
  name,
  { path, notFoundHint } = {},
) {
  const signaturePattern = new RegExp(
    `^\\s*(?:async\\s+)?function\\s+${name}\\s*\\(`,
    'm',
  )
  const match = signaturePattern.exec(content)
  if (!match) {
    const location = path ? ` in ${path}` : ''
    const hint = notFoundHint ? ` -- ${notFoundHint}` : ''
    throw new Error(`Could not find \`function ${name}(\`${location}${hint}`)
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
