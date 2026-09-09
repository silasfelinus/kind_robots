import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const compose = readFileSync(resolve('docker-compose.yml'), 'utf8')

assert.match(
  compose,
  /^\s*ANIMATE_PATH:\s*\/app\/animate\s*$/m,
  'kind-robots service must set ANIMATE_PATH=/app/animate',
)

assert.match(
  compose,
  /^\s*- \$\{KIND_ROBOTS_ANIMATE_PATH:-\/mnt\/user\/pc\/kindrobots\/animate\}:\/app\/animate:ro\s*$/m,
  'kind-robots service must bind the dedicated host animate tree to /app/animate read-only',
)

assert.doesNotMatch(
  compose,
  /kindrobots\/animate[^\n]*:\/app\/animate:rw/,
  'Scene Animator source media must not be mounted read-write',
)

console.log('Scene Animator deployment contract verified: /app/animate is a dedicated read-only mount.')
