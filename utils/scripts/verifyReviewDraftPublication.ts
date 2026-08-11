// /utils/scripts/verifyReviewDraftPublication.ts
//
// WonderLab's Component review feed is retired. First-party Reaction authorship
// remains because the replacement comment project uses it, but no contract may
// require the deleted museum feed in order for the app to build.
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

assert.equal(
  await pathExists('components/wonderlab/component-review-feed.vue'),
  false,
  'retired Component review feed must not return',
)

const schema = await readFile('prisma/schema.prisma', 'utf8')
assert.match(schema, /authorBotId/)
assert.match(schema, /authorCharacterId/)

console.log(
  'Review publication boundary verified: WonderLab feed is gone while first-party Reaction authorship remains available to the replacement comment project.',
)
