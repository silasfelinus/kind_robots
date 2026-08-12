import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

const retiredPaths = [
  'server/api/admin/wonderlab',
  'pages/admin/wonderlab-reviews.vue',
  'pages/admin/wonderlab-review-plan.vue',
  'pages/admin/wonderlab-review-rollout.vue',
  'server/utils/reviewDraftPublisher.ts',
  'server/utils/reviewDraftRepository.ts',
  'utils/wonderlab',
]

for (const path of retiredPaths) {
  assert.equal(await exists(path), false, `${path} is retired WonderLab runtime and must not return`)
}

assert.equal(await exists('utils/comments/voiceEvidence.ts'), true, 'object-first comment voice evidence must remain available')
const schema = await readFile('prisma/schema.prisma', 'utf8')
assert.match(schema, /model\s+Component\s*\{/, 'Component history must remain until comment migration finishes')

console.log('Retired ReviewDraft/WonderLab runtime remains absent; migration evidence is preserved.')
