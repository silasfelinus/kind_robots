import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse } from 'yaml'
import { resolveChannels } from '../../stores/helpers/channelContent'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { emptyInput } from '../arcade/types'
import { directionsAtDpadPoint } from '../arcade/dpad'
import { findArcadeGame, HALL_GAMES, loadArcadeGame } from '../arcade/games'

const file = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8')
const tab = file(
  '../../content/channels/admin/rainbow-bullet-hell-space-princess.md',
)
const page = file('../../pages/admin/rainbow-bullet-hell-space-princess.vue')
const registry = file('../arcade/games.ts')
const placement = file('../projectPlacements.ts')
assert.match(tab, /channelKey: admin/)
assert.match(tab, /requiredRole: ADMIN/)
const admin = resolveChannels([
  { contentType: 'channel', channelKey: 'admin', label: 'Admin' },
  parse(tab.split('---')[1]!),
])[0]!
const tutorial = admin.tabs.find(
  (item) => item.key === 'rainbow-bullet-hell-space-princess',
)?.tutorial
assert.ok(tutorial?.explicit, 'the tab has authored tutorial help')
for (const section of [
  'Flight controls',
  'Read the battlefield',
  'Future campaign',
])
  assert.ok(
    tutorial.body.includes(section),
    `visible tutorial includes ${section}`,
  )
assert.match(tab, /route: \/admin\/rainbow-bullet-hell-space-princess/)
assert.match(page, /!user\.isAdmin/)
const cabinet = file('../../components/arcade/arcade-cabinet.vue')
assert.match(cabinet, /'cabinet-dpad--compact': compactDpad/)
assert.match(cabinet, /compactDpad\.value \? 0\.1 : 0\.22/)
assert.match(cabinet, /releaseDpad\(seat, \$event\.pointerId\)/)

const rect = { left: 20, top: 30, width: 180, height: 180 }
const pad = (x: number, y: number, deadZone = 0.1) =>
  directionsAtDpadPoint(x, y, rect, deadZone)
const neutral = { up: false, down: false, left: false, right: false }
assert.deepEqual(pad(110, 120), neutral, 'center still lets go')
assert.deepEqual(
  pad(123, 120, 0.22),
  neutral,
  'other Arcade games retain the original center dead zone',
)
assert.deepEqual(
  pad(123, 120),
  { ...neutral, right: true },
  'Space Princess responds near the center of the pad',
)
assert.deepEqual(pad(110, 40), { ...neutral, up: true })
assert.deepEqual(pad(110, 200), { ...neutral, down: true })
assert.deepEqual(pad(30, 120), { ...neutral, left: true })
assert.deepEqual(pad(190, 120), { ...neutral, right: true })
assert.deepEqual(
  pad(180, 50),
  { ...neutral, up: true, right: true },
  'sliding diagonally holds both directions',
)
assert.deepEqual(pad(40, 190), { ...neutral, down: true, left: true })
assert.deepEqual(
  directionsAtDpadPoint(123, 120, { ...rect, width: 0 }),
  neutral,
  'unmeasured touch pad cannot produce accidental movement',
)

assert.match(page, /ArcadeCabinet slug="rainbow-bullet-hell-space-princess"/)
assert.match(
  registry,
  /PREVIEW_GAMES:[\s\S]*?rainbow-bullet-hell-space-princess/,
)
assert.match(
  placement,
  /'rainbow-bullet-hell-space-princess':\s*\{[\s\S]*?channelKey: 'admin'/,
)
assert.ok(
  !HALL_GAMES.some((g) => g.slug === 'rainbow-bullet-hell-space-princess'),
)
assert.equal(
  findArcadeGame('rainbow-bullet-hell-space-princess')?.maxPlayers,
  4,
)
const module = await loadArcadeGame('rainbow-bullet-hell-space-princess')
assert.equal(typeof module.create, 'function')

const sound = { play() {} }
const options = { rng: () => 0.5, sound, demo: false, hiScore: 0, players: 4 }
const game = createRainbowPrincessPreview(options)
const input = emptyInput()
input.held.a = true
input.held.right = true
for (let i = 0; i < 95; i++) game.update(input, [input, input, input, input])
assert.equal(game.level, 1)
assert.equal(game.over, false)
assert.equal(game.lives, 12)
assert.ok(game.score >= 0)
console.log('Rainbow Princess private Arcade preview integration passed')
