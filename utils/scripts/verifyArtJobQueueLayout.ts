// /utils/scripts/verifyArtJobQueueLayout.ts
import { readFileSync } from 'node:fs'

const componentPath = 'components/art/artjob-queue-browser.vue'
const cssPath = 'assets/css/tailwind.css'
const component = readFileSync(componentPath, 'utf8')
const css = readFileSync(cssPath, 'utf8')

const queueOwner = component.match(
  /<div\s+v-else\s+class="([^"]*\bkr-scroll\b[^"]*)">/,
)

if (!queueOwner) {
  throw new Error(
    `${componentPath} is missing the admin queue's kr-scroll owner.`,
  )
}

const classes = new Set(queueOwner[1]!.split(/\s+/).filter(Boolean))

for (const required of ['grid', 'kr-scroll', 'min-w-0', 'grid-cols-1', 'grid-flow-row', 'gap-2', 'p-2']) {
  if (!classes.has(required)) {
    throw new Error(
      `${componentPath} queue scroll owner is missing required class: ${required}`,
    )
  }
}

for (const token of classes) {
  if (
    token === 'flex' ||
    token === 'flex-row' ||
    token === 'flex-col' ||
    token.endsWith(':flex') ||
    token.endsWith(':flex-row') ||
    token.endsWith(':flex-col') ||
    token === 'grid-flow-col' ||
    token.endsWith(':grid-flow-col')
  ) {
    throw new Error(
      `${componentPath} queue scroll owner can fall back to horizontal layout via ${token}. Keep it grid/block based so toolbar, cards, and pager stack even when a direction utility is unavailable.`,
    )
  }
}

const inlineLayout = component.match(
  /<div\\s+v-else\\s+data-artjob-queue-stack\\s+class="[^"]*"\\s+style="([^"]+)"\\s*>/,
)?.[1]

if (!inlineLayout) {
  throw new Error('The ArtJob queue is missing its browser-enforced one-column layout guard.')
}

for (const [property, value] of [
  ['display', 'grid'],
  ['grid-template-columns', 'minmax(0, 1fr)'],
  ['grid-auto-flow', 'row'],
] as const) {
  const declarations = Object.fromEntries(
    inlineLayout.split(';').map((part) => {
      const colon = part.indexOf(':')
      return [part.slice(0, colon).trim(), part.slice(colon + 1).trim()]
    }),
  )
  if (declarations[property] !== value) {
    throw new Error(
      `The queue's inline ${property} must equal ${value}, got ${declarations[property] ?? 'absent'}`,
    )
  }
}

const scrollRule = css.match(/\.kr-scroll\s*\{([\s\S]*?)\}/)
if (!scrollRule) {
  throw new Error(`${cssPath} is missing the .kr-scroll primitive.`)
}

const scrollBody = scrollRule[1]!
if (/\bdisplay\s*:|\bflex-direction\s*:/.test(scrollBody)) {
  throw new Error(
    '.kr-scroll must remain a sizing/overflow primitive; display or flex-direction would override the ArtJob queue fail-safe layout.',
  )
}

const apply = scrollBody.match(/@apply\s+([^;]+);/)?.[1] ?? ''
const applyTokens = new Set(apply.split(/\s+/).filter(Boolean))
for (const forbidden of ['flex', 'flex-row', 'flex-col', 'grid-flow-col']) {
  if (applyTokens.has(forbidden)) {
    throw new Error(
      `.kr-scroll must not apply ${forbidden}; the ArtJob queue relies on its own grid/block stacking behavior.`,
    )
  }
}

console.log(
  'ArtJob queue layout verified: scroll owner stacks in grid/block flow with no flex-row fallback.',
)
