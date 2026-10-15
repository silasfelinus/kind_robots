import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// One player holding a tablet sideways gets the d-pad on the left and A/B on the right, in every Arcade
// cabinet. Only multi-seat layouts pull player 1's buttons left beside their own d-pad, so player 2 can
// have the right-hand side (Silas, 2026-10-14: "The buttons are on the wrong side in horizontal mode").

const cabinet = readFileSync(
  new URL('../../components/arcade/arcade-cabinet.vue', import.meta.url),
  'utf8',
)
const css = cabinet.slice(
  cabinet.indexOf('<style scoped>'),
  cabinet.lastIndexOf('</style>'),
)

function mediaBlocks(source: string, query: string): string[] {
  const blocks: string[] = []
  let from = 0
  for (;;) {
    const start = source.indexOf(`@media ${query}`, from)
    if (start < 0) return blocks
    let depth = 0
    let end = source.indexOf('{', start)
    for (let i = end; i < source.length; i++) {
      if (source[i] === '{') depth++
      if (source[i] === '}' && --depth === 0) {
        end = i
        break
      }
    }
    blocks.push(source.slice(start, end + 1))
    from = end + 1
  }
}

const landscape = mediaBlocks(css, '(orientation: landscape)')
assert.ok(landscape.length > 0, 'the cabinet has landscape rules')

const selectors = landscape.flatMap((block) =>
  [...block.matchAll(/([^{}]+)\{[^{}]*\}/g)].flatMap((rule) =>
    rule[1]!
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean),
  ),
)
const movesSoloButtons = selectors.filter((selector) =>
  /\.cabinet-cluster-1 \.cabinet-buttons$/.test(selector),
)
assert.ok(
  movesSoloButtons.length > 0,
  'player 1 still has a landscape button rule',
)
for (const selector of movesSoloButtons)
  assert.match(
    selector,
    /^\.cabinet-overlay--duo /,
    `"${selector}" must only apply when more than one player is seated`,
  )

assert.match(
  css,
  /\.cabinet-overlay \.cabinet-buttons \{\s*right: max\(1rem, env\(safe-area-inset-right\)\);/,
  'a single player keeps A and B on the right edge',
)
assert.match(
  cabinet,
  /'cabinet-overlay--duo': duo/,
  'the duo class is only set when more than one player is seated',
)

console.log('arcade touch layout: ok')
