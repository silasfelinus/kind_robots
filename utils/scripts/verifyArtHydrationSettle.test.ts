import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

// Generated art that fades in on @load must also read the <img> element's own
// state. A server-rendered or cached image can settle before hydration
// attaches @load; it then sits at opacity 0 behind the code-drawn fallback
// forever. Found live on kindrobots.org in Ecotone, 2026-11-19 PT, with the
// same gate in five other games' art components.
function vueFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory()
      ? vueFiles(path)
      : name.endsWith('.vue')
        ? [path]
        : []
  })
}

const gated = vueFiles('components').filter((file) => {
  const source = readFileSync(file, 'utf8')
  return (
    /@load="loaded(?:Art)? = true"/.test(source) &&
    /loaded(?:Art)? \? 'opacity-100' : 'opacity-0'/.test(source)
  )
})

const missing = gated.filter((file) => {
  const source = readFileSync(file, 'utf8')
  return !/\.complete\b/.test(source) || !/naturalWidth > 0/.test(source)
})

for (const known of [
  'components/ecotone-scene.vue',
  'components/crystal-street/crystal-street-art.vue',
  'components/crystal-street/crystal-street-portrait.vue',
  'components/shifting-desks/shifting-desks-art.vue',
  'components/playbook-kit/playbook-kit-art.vue',
  'components/playbook/playbook-art.vue',
])
  assert.ok(gated.includes(known), `${known} is still covered by this check`)

assert.deepEqual(
  missing,
  [],
  `these components fade art in on @load without checking img.complete: ${missing.join(', ')}`,
)
console.log(
  `Art hydration settle: ${gated.length} fade-in art components read the image's own load state`,
)
