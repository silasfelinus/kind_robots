import assert from 'node:assert/strict'
import { formatAnimationEffect, registerAnimationEffect, validateAnimationEffect } from './registerAnimationEffect.mjs'

const entry = {
  id: 'paper-moon-test',
  label: 'Paper Moon',
  reveal: 'Moonrise',
  icon: 'kind-icon:moon',
  tooltip: "A paper moon's quiet orbit",
  color: '#abcdef',
  releasedAt: '2026-09-23T12:00:00Z',
  generationSafe: true,
  blocksInput: false,
  preferredSurface: 'fullscreen',
}

const catalog = `export const ANIMATION_EFFECTS = [
  {
    id: 'existing-effect',
  },
] as const satisfies readonly AnimationEffectDefinition[]

export const tail = true
`

const updated = registerAnimationEffect(catalog, entry)
assert.match(updated, /id: 'paper-moon-test'/)
assert.match(updated, /tooltip: 'A paper moon\\'s quiet orbit'/)
assert.match(updated, /releasedAt: '2026-09-23T12:00:00Z'/)
assert.ok(updated.indexOf("id: 'existing-effect'") < updated.indexOf("id: 'paper-moon-test'"))
assert.ok(updated.indexOf("id: 'paper-moon-test'") < updated.indexOf('] as const satisfies'))
assert.match(updated, /export const tail = true/)
assert.equal((updated.match(/paper-moon-test/g) ?? []).length, 1)

assert.throws(() => registerAnimationEffect(updated, entry), /already registered/)
assert.throws(() => registerAnimationEffect('export const nope = []\n', entry), /closing marker/)
assert.throws(
  () => registerAnimationEffect(`${catalog}\n${catalog}`, entry),
  /ambiguous/,
)
assert.throws(() => validateAnimationEffect({ ...entry, id: 'Bad Id' }), /kebab-case/)
assert.throws(() => validateAnimationEffect({ ...entry, preferredSurface: 'sidebar' }), /preferredSurface/)
assert.throws(() => validateAnimationEffect({ ...entry, generationSafe: 'yes' }), /generationSafe/)
assert.throws(() => validateAnimationEffect({ ...entry, releasedAt: '2026-09-23' }), /releasedAt/)

const formatted = formatAnimationEffect(entry)
assert.match(formatted, /^ {2}\{/)
assert.match(formatted, /preferredSurface: 'fullscreen'/)

console.log('registerAnimationEffect self-test passed')
