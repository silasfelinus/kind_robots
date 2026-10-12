import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse } from 'yaml'
import { resolveChannels } from '../../stores/helpers/channelContent'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { emptyInput } from '../arcade/types'
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
