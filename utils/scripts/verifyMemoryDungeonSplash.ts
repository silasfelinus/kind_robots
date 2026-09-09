import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const css = readFileSync('assets/css/memory-dungeon.css', 'utf8')
const config = readFileSync('nuxt.config.ts', 'utf8')

assert.match(
  config,
  /~\/assets\/css\/memory-dungeon\.css/,
  'Memory Dungeon splash CSS must stay registered globally.',
)

assert.match(
  css,
  /\.splash-screen\s*>\s*\.splash-hero\s*\{[\s\S]*?min-height:\s*100%[\s\S]*?flex:\s*0 0 100%/,
  'The first Memory Dungeon viewport should belong to the hero artwork.',
)

assert.match(
  css,
  /\.splash-screen\s*>\s*\.splash-hero\s*\+\s*\.grid\s*\{[\s\S]*?display:\s*none/,
  'The old pre-game text strip must not consume the bottom of the first screen.',
)

assert.match(
  css,
  /grid-template-columns:\s*minmax\(0, 1fr\) auto/,
  'Desktop launch controls should share one aligned dock.',
)

assert.match(
  css,
  /Scroll to browse deck art/,
  'The full-screen hero should still advertise that deck art is available below.',
)

console.log('Memory Dungeon splash contract verified.')
