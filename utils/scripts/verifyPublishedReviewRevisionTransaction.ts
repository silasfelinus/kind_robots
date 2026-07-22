// /utils/scripts/verifyPublishedReviewRevisionTransaction.ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const revisionServicePath = resolve(
  scriptDirectory,
  '../../server/utils/publishedReviewRevision.ts',
)
const source = readFileSync(revisionServicePath, 'utf8')

assert.match(
  source,
  /prisma\.\$transaction\(\s*async\s*\(tx\)\s*=>\s*\{[\s\S]*?\},\s*\{\s*maxWait:\s*10_000,\s*timeout:\s*20_000,?\s*\},\s*\)/,
  'Published review revision must declare an explicit transaction acquisition wait and a timeout above Prisma\'s 5-second default.',
)
assert.match(
  source,
  /FROM ReviewDraft[\s\S]*?FOR UPDATE/,
  'Published ReviewDraft identity must remain row-locked during revision.',
)
assert.match(
  source,
  /FROM Reaction[\s\S]*?FOR UPDATE/,
  'Published Reaction identity must remain row-locked during revision.',
)
assert.match(
  source,
  /expectedCurrentCommentHash/,
  'The exact current-comment hash guard must remain part of the revision service.',
)
assert.match(
  source,
  /UPDATE ReviewDraft[\s\S]*?UPDATE Reaction/,
  'ReviewDraft and Reaction commentary must still be revised in the same transaction.',
)

console.log('Published review revision transaction budget contract passed.')
