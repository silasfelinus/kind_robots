// interface-vision/t-154: the daily responsive audit must finish inside its
// job budget without dropping routes, and a slow sweep must not skip the
// Slime City Clash, gallery-chrome or tablet-menu audits.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { parseShard, selectShard } from './responsiveAuditShard.mjs'

const audit = readFileSync(
  new URL('./auditResponsiveLayout.mjs', import.meta.url),
  'utf8',
)
const workflow = readFileSync(
  new URL(
    '../../.github/workflows/responsive-layout-audit.yml',
    import.meta.url,
  ),
  'utf8',
)

test('shards are disjoint and together cover every route', () => {
  const routes = Array.from({ length: 79 }, (_, i) => `/r${i}`)
  const parts = [1, 2, 3].map((index) =>
    selectShard(routes, { index, total: 3 }),
  )
  assert.deepEqual(parts.flat().sort(), [...routes].sort())
  assert.equal(new Set(parts.flat()).size, routes.length)
  for (const part of parts) assert.ok(Math.abs(part.length - 79 / 3) < 1)
  assert.deepEqual(selectShard(routes, null), routes)
})

test('shard flag parsing rejects malformed or out-of-range input', () => {
  assert.equal(parseShard(''), null)
  assert.deepEqual(parseShard('2/3'), { index: 2, total: 3 })
  for (const bad of ['0/3', '4/3', '1/0', 'two', '1-3'])
    assert.throws(() => parseShard(bad))
})

test('per-route waits are bounded instead of a 90s networkidle navigation', () => {
  assert.doesNotMatch(audit, /waitUntil: 'networkidle'/)
  assert.match(audit, /waitUntil: 'load', timeout: NAVIGATION_MS/)
  assert.match(
    audit,
    /waitForLoadState\('networkidle', \{ timeout: NETWORK_IDLE_MS \}\)/,
  )
  assert.match(audit, /const ROUTES = selectShard\(ALL_ROUTES, SHARD\)/)
  assert.match(audit, /Slowest:/)
})

test('Space Couch gets rendered 390/768/1440 responsive coverage', () => {
  assert.match(audit, /\/play\/game-of-captains,\/play\/zuzu-showdown/)
  assert.match(audit, /name: 'phone', width: 390/)
  assert.match(audit, /name: 'desktop', width: 1440/)
  assert.match(audit, /name: 'tablet-768'/)
  assert.match(audit, /const EXTRA_TABLET_ROUTES = new Set\(\[/)
  assert.match(audit, /'\/play\/game-of-captains'/)
  assert.match(
    audit,
    /ROUTES\.filter\(\(route\) => EXTRA_TABLET_ROUTES\.has\(route\)\)/,
  )
  assert.match(audit, /await page\.screenshot\(/)
})

test('workflow shards the sweep and isolates the follow-on audits', () => {
  assert.match(workflow, /shard: \[1, 2, 3, 4, 5, 6\]/)
  assert.match(workflow, /max-parallel: 3/)
  assert.match(workflow, /SHARD: \$\{\{ matrix\.shard \}\}\/6/)
  assert.match(workflow, /--shard "\$SHARD"/)
  assert.match(workflow, /fail-fast: false/)
  const controls = workflow.slice(workflow.indexOf('\n  controls:'))
  assert.ok(controls.length > 20, 'a separate controls job exists')
  assert.match(controls, /npm run audit:slime-city-clash-layout -- --base/)
  assert.match(controls, /npm run audit:gallery-chrome/)
  assert.match(controls, /npm run audit:tablet-nav/)
  assert.doesNotMatch(controls, /npm run audit:responsive/)
  for (const minutes of workflow.matchAll(/timeout-minutes: (\d+)/g))
    assert.ok(Number(minutes[1]) <= 45, 'no job leans on a longer timeout')
})
