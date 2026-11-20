import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { checkArtPromptContract } from '../../server/utils/artPromptContract'
import { memoryArtRequests } from './exportMemoryArtRequests'

// t-075/t-076/t-078 (2026-11-20 PT): every image the game can show has one art
// request with a stable media path and a prompt the server will accept.
const requests = memoryArtRequests()
assert.ok(
  requests.length > 3000,
  'covers scenes, choices, rooms, opening and endings',
)
assert.equal(new Set(requests.map((r) => r.id)).size, requests.length)
assert.equal(new Set(requests.map((r) => r.path)).size, requests.length)
for (const request of requests) {
  assert.match(request.path, /^\/images\/memory-dungeon\/[a-z0-9/._-]+\.webp$/)
  assert.ok(request.prompt.length >= 60, request.id + ' prompt too short')
  const result = checkArtPromptContract({
    prompt: request.prompt,
    engine: 'krea2',
  }) as unknown as { violations?: { rule: string }[] } | { rule: string }[]
  const violations = Array.isArray(result) ? result : (result.violations ?? [])
  assert.deepEqual(
    violations.map((v) => v.rule),
    [],
    request.id + ' breaks the art prompt contract',
  )
}
for (const prefix of [
  'intro-',
  'ending-core-',
  'scene-e12-',
  'choice-e11-',
  'dungeon-bt-',
  'dungeon-ov-',
])
  assert.ok(
    requests.some((r) => r.id.startsWith(prefix)),
    prefix,
  )

const dungeonView = readFileSync(
  'components/pages/memory-dungeon-sublevel.vue',
  'utf8',
)
assert.ok(dungeonView.includes('data-testid="memory-dungeon-room-art"'))
assert.ok(
  readFileSync(
    'components/pages/memory-dungeon-finale-collision.vue',
    'utf8',
  ).includes('data-testid="memory-finale-ending-art"'),
)
assert.ok(
  readFileSync(
    'components/pages/memory-dungeon-hoshimori.vue',
    'utf8',
  ).includes('data-testid="memory-hoshimori-scene-art"'),
)
assert.ok(
  readFileSync(
    'components/pages/memory-dungeon-hoshimori-night.vue',
    'utf8',
  ).includes('data-testid="memory-hoshimori-night-scene-art"'),
)
console.log(
  `Memory art requests: ${requests.length} images with unique media paths and contract-safe prompts; dungeon, Hoshimori and ending art wired`,
)
