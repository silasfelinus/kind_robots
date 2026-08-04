import assert from 'node:assert/strict'
import { containsCode, stripComments } from './lib/sourceText'

const forbidden = 'updateFacet('

const commented = [
  `<!-- ${forbidden} is intentionally unavailable here -->`,
  `/* ${forbidden} is intentionally unavailable here */`,
  `// ${forbidden} is intentionally unavailable here`,
].join('\n')

assert.equal(containsCode(commented, forbidden), false)
assert.equal(containsCode(`const result = ${forbidden}input)`, forbidden), true)
assert.equal(stripComments(`const url = 'https://example.com/${forbidden}'`).includes(forbidden), true)

process.stdout.write('Comment-aware source scanning verified.\n')
