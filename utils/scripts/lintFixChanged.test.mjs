import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  applyFixes,
  baselineCounts,
  grownMessages,
  importRanges,
  importRemovals,
  offsetOf,
} from './lintFixChanged.mjs'

const source = [
  "import { ref, watch } from 'vue'",
  'import type {',
  '  Alpha,',
  '  Beta,',
  "} from './types'",
  'const unused = 1',
  'export function use(a: Alpha) {',
  '  return ref(a)',
  '}',
  '',
].join('\n')

const unused = (line, column, range, text = '') => ({
  ruleId: '@typescript-eslint/no-unused-vars',
  line,
  column,
  suggestions: [{ fix: { range, text } }],
})

test('importRanges spans single-line and multi-line declarations', () => {
  const ranges = importRanges(source)
  assert.equal(ranges.length, 2)
  assert.equal(source.slice(...ranges[0]), "import { ref, watch } from 'vue'")
  assert.match(source.slice(...ranges[1]), /^import type \{[\s\S]*'\.\/types'$/)
})

test('offsetOf maps 1-based line/column to a string offset', () => {
  assert.equal(source.slice(offsetOf(source, 1, 15)).startsWith('watch'), true)
  assert.equal(source.slice(offsetOf(source, 4, 3)).startsWith('Beta'), true)
})

test('importRemovals accepts only fixes inside an import declaration', () => {
  const watchAt = offsetOf(source, 1, 15)
  const betaAt = offsetOf(source, 4, 3)
  const localAt = offsetOf(source, 6, 7)
  const fixes = importRemovals(source, [
    unused(1, 15, [watchAt - 2, watchAt + 5]),
    unused(4, 3, [betaAt - 1, betaAt + 5]),
    // An unused local: must never be removed automatically.
    unused(6, 7, [localAt - 6, localAt + 10]),
    // A fix that escapes the import even though the message is inside it.
    unused(1, 15, [watchAt, source.length]),
    // Other rules and suggestion-less messages are ignored.
    { ruleId: 'no-empty', line: 1, column: 1, suggestions: [] },
    { ruleId: '@typescript-eslint/no-unused-vars', line: 1, column: 10 },
  ])
  assert.equal(fixes.length, 2)
  const { output, applied } = applyFixes(source, fixes)
  assert.equal(applied, 2)
  assert.match(output, /^import \{ ref \} from 'vue'/)
  assert.doesNotMatch(output, /Beta/)
  assert.match(output, /const unused = 1/)
})

test('importRemovals accepts a whole-declaration removal with its newlines', () => {
  const text = "const a = 1\nimport { EVENTS } from './story'\n\nuse(a)\n"
  const start = text.indexOf('import')
  const end = text.indexOf("'\n") + 2
  const fixes = importRemovals(text, [unused(2, 10, [start - 1, end])])
  assert.equal(fixes.length, 1)
  assert.equal(applyFixes(text, fixes).output, 'const a = 1\nuse(a)\n')
  // Whitespace padding never lets a fix reach past the import into code.
  assert.equal(
    importRemovals(text, [unused(2, 10, [start, text.length])]).length,
    0,
  )
})

test('applyFixes defers overlapping fixes to a later pass', () => {
  const { output, applied } = applyFixes('abcdef', [
    { range: [1, 3], text: '' },
    { range: [2, 4], text: 'X' },
  ])
  assert.equal(applied, 1)
  assert.equal(output, 'abXef')
})

test('grownMessages reports only rule buckets that grew per file', () => {
  const counts = baselineCounts({
    'no-empty': ['a.ts:1:1', 'a.ts:9:1', 'b.ts:2:2'],
    'vue/attributes-order': ['c.vue:3:4'],
  })
  assert.equal(counts.get('a.ts').get('no-empty'), 2)
  const messages = [
    { ruleId: 'no-empty', line: 4 },
    { ruleId: 'no-empty', line: 30 },
    { ruleId: 'prefer-const', line: 7 },
  ]
  assert.deepEqual(
    grownMessages('a.ts', messages, counts).map((m) => m.ruleId),
    ['prefer-const'],
  )
  assert.equal(grownMessages('new.ts', messages.slice(0, 1), counts).length, 1)
})
