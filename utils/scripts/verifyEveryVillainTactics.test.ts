import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { IDENTITY_ARCS } from '../cometAcademy/identityArcs'
import { EVERY_VILLAIN_TACTICS } from '../playbookKit/games/everyVillainTactics'
import { auditPlaybookKit } from '../playbookKit/budget'
import {
  availableMove,
  endTurn,
  fireSelected,
  lineClear,
  moveSelected,
  previewShot,
  terrainAt,
  trainingState,
  walkDistance,
} from '../everyVillainTactics/training'

const specReport = auditPlaybookKit(EVERY_VILLAIN_TACTICS)
assert.ok(specReport.ok, JSON.stringify(specReport.issues))
assert.equal(EVERY_VILLAIN_TACTICS.tier, 'vignette')
assert.equal(
  IDENTITY_ARCS.length,
  48,
  'playable roster must use the canonical 48',
)
assert.equal(new Set(IDENTITY_ARCS.map((c) => c.hero.alias)).size, 48)
assert.ok(
  EVERY_VILLAIN_TACTICS.keyArt.src?.includes(
    '/comet-city-academy/front/splash.webp',
  ),
)

const initial = trainingState(41)
assert.equal(initial.units.length, 6)
assert.ok(
  initial.units.every((u) =>
    IDENTITY_ARCS.some((arc) => arc.signature === u.identity),
  ),
)
assert.equal(terrainAt({ x: 3, y: 1 }), 'wall')
assert.equal(terrainAt({ x: 2, y: 4 }), 'cover')
assert.equal(
  lineClear({ x: 1, y: 1 }, { x: 5, y: 1 }),
  false,
  'solid wall must break LOS',
)
assert.equal(lineClear({ x: 3, y: 4 }, { x: 7, y: 4 }), true)
assert.equal(walkDistance(initial, { x: 0, y: 4 }, { x: 3, y: 1 }), Infinity)
assert.equal(availableMove(initial, { x: 2, y: 4 }), true)
assert.equal(availableMove(initial, { x: 8, y: 2 }), false)
assert.equal(
  availableMove(initial, { x: 0, y: 2 }),
  false,
  'occupied tile cannot be entered',
)

const before = initial.units[0]!
assert.ok(moveSelected(initial, { x: 2, y: 4 }))
assert.equal(before.x, 2)
assert.ok(before.moved)
assert.equal(
  moveSelected(initial, { x: 3, y: 4 }),
  false,
  'one movement per turn',
)
const pip = initial.units.find((u) => u.id === 'pip')!
assert.equal(
  previewShot(before, pip).hit,
  0,
  'out of LOS or range must be zero',
)
const remy = initial.units.find((u) => u.id === 'remy')!
const preview = previewShot(before, remy)
assert.ok(preview.clear)
assert.ok(preview.hit > 0 && preview.hit < 100)
assert.equal(preview.hit, 64, '85 base, minus 21 over two tiles')
assert.ok(fireSelected(initial, remy))
assert.ok(before.fired)
assert.equal(fireSelected(initial, remy), false, 'one attack per turn')

const same = trainingState(41)
moveSelected(same, { x: 2, y: 4 })
fireSelected(
  same,
  same.units.find((u) => u.id === 'remy')!,
)
assert.deepEqual(
  same.units,
  initial.units,
  'same seed and inputs resolve to same hit',
)
assert.equal(same.seed, initial.seed)
// Percentage previews must actually resolve as probabilities, not near-zero chances.
let realized = 0
for (let seed = 1; seed <= 500; seed++) {
  const sample = trainingState(seed)
  moveSelected(sample, { x: 2, y: 4 })
  const target = sample.units.find((unit) => unit.id === 'remy')!
  const healthBefore = target.hp
  fireSelected(sample, target)
  if (target.hp < healthBefore) realized++
}
assert.ok(
  realized >= 250 && realized <= 380,
  `64% displayed hit odds should produce roughly 320 hits across 500 seeds, got ${realized}`,
)

const oldTurn = initial.turn
endTurn(initial)
assert.equal(initial.turn, oldTurn + 1)
assert.equal(before.fired, false)
assert.equal(before.moved, false)
assert.ok(initial.events.length <= 6)

const page = readFileSync(
  new URL('../../pages/admin/every-villain-tactics.vue', import.meta.url),
  'utf8',
)
const tab = readFileSync(
  new URL(
    '../../content/channels/admin/every-villain-tactics.md',
    import.meta.url,
  ),
  'utf8',
)
assert.match(page, /PlaybookKitShell/)
assert.match(page, /data-testid="tactics-odds"/)
assert.match(page, /store\.hover\(cell\)/)
assert.match(page, /store\.rosterOpen/)
const pageBar = page.match(/<template #bar-actions>[\s\S]*?<\/template>/)?.[0]
assert.ok(
  pageBar,
  "tactics header fills the kit shell's slot in the shared console system bar",
)
assert.match(pageBar, /data-testid="tactics-header"/)
assert.doesNotMatch(
  page,
  /<header-page-bar/,
  'one system bar: the kit shell owns it, the page only fills its slot',
)
const kitShell = readFileSync(
  new URL(
    '../../components/playbook-kit/playbook-kit-shell.vue',
    import.meta.url,
  ),
  'utf8',
)
assert.match(
  kitShell,
  /<header-page-bar :console-theme="spec\.theme \?\? 'forge'">[\s\S]*?<slot name="bar-actions" \/>[\s\S]*?<\/header-page-bar>/,
  'the shell renders its bar-actions slot inside the shared console system bar',
)
for (const testId of [
  'tactics-open-menu',
  'tactics-exit-playtest',
  'tactics-open-studio',
]) {
  assert.match(pageBar, new RegExp(`data-testid="${testId}"`))
}
assert.match(pageBar, /store\.rosterOpen = !store\.rosterOpen/)
assert.doesNotMatch(page, /class="evt-hud"/)
assert.match(page, /@media \(prefers-reduced-motion: reduce\)/)
assert.match(tab, /^requiredRole: ADMIN$/m)
assert.match(tab, /^route: \/admin\/every-villain-tactics$/m)
console.log(
  'Every Villain Tactics: 48 roster identities, First Bell combat and console contracts verified.',
)
