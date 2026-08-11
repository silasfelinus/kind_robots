// /utils/scripts/verifyReviewDraftPublication.ts
//
// WonderLab's Component review feed is retired. First-party Reaction authorship
// has its own dedicated contracts; this guard owns only the museum publication
// boundary so it cannot accidentally require dead Component UI/runtime again.
import assert from 'node:assert/strict'
import { access } from 'node:fs/promises'

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

console.log(
  'Review publication retirement boundary verified: the WonderLab feed is gone; first-party Reaction authorship is covered by its dedicated contracts.',
)
