// /utils/scripts/verifyReviewDraftPublication.ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const publisherPath = 'server/utils/reviewDraftPublisher.ts'
const endpointPath =
  'server/api/admin/wonderlab/review-drafts/[id]/publish.post.ts'
const componentReviewsPath = 'server/api/reactions/component/[id].get.ts'
const componentFeedPath = 'components/wonderlab/component-review-feed.vue'

const publisher = await readFile(publisherPath, 'utf8')
const endpoint = await readFile(endpointPath, 'utf8')
const componentReviews = await readFile(componentReviewsPath, 'utf8')
const componentFeed = await readFile(componentFeedPath, 'utf8')
const ordinaryPost = await readFile('server/api/reactions/index.post.ts', 'utf8')

assert.match(endpoint, /requireAdminApiUser\(event\)/)
assert.match(endpoint, /publishReviewDraft\(id, auth\.user\.id\)/)

assert.match(publisher, /prisma\.\$transaction/)
assert.match(publisher, /FROM ReviewDraft[\s\S]*FOR UPDATE/)
assert.match(publisher, /FROM Component[\s\S]*FOR UPDATE/)
assert.match(publisher, /authorBotId = \$\{draft\.authorBotId\}/)
assert.match(publisher, /authorCharacterId = \$\{draft\.authorCharacterId\}/)
assert.match(publisher, /INSERT INTO Reaction/)
assert.match(publisher, /UPDATE Reaction/)
assert.match(publisher, /status = 'PUBLISHED'/)
assert.match(publisher, /publishedReactionId = \$\{reactionId\}/)
assert.match(publisher, /status IN \('PROPOSED', 'APPROVED', 'FAILED'\)/)
assert.doesNotMatch(publisher, /DELETE\s+FROM\s+Reaction/i)
assert.doesNotMatch(publisher, /authorBotId\s+IS\s+NULL\s+AND\s+authorCharacterId\s+IS\s+NULL[\s\S]*UPDATE Reaction/i)

assert.match(componentReviews, /LEFT JOIN Bot b ON b\.id = r\.authorBotId/)
assert.match(componentReviews, /LEFT JOIN Character ch ON ch\.id = r\.authorCharacterId/)
assert.match(componentReviews, /Author: projectFirstPartyAuthor\(row\)/)
assert.doesNotMatch(componentReviews, /include:\s*\{/)

assert.match(componentFeed, /review\.Author\?\.name/)
assert.match(componentFeed, /First-party \{\{ review\.Author\.kind\.toLowerCase\(\) \}\}/)

assert.doesNotMatch(ordinaryPost, /authorBotId/)
assert.doesNotMatch(ordinaryPost, /authorCharacterId/)

console.log('Review draft publication contract passed.')
