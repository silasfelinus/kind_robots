import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse } from 'yaml'
import { resolveChannels } from '../../stores/helpers/channelContent'
import { createSavePlumberPreview } from '../arcade/games/savePlumberPreview'
import { emptyInput } from '../arcade/types'
import { findArcadeGame, HALL_GAMES, loadArcadeGame } from '../arcade/games'

const source = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8')
const tab = source('../../content/channels/arcade/save-the-plumber.md')
const page = source('../../pages/play/save-the-plumber.vue')
const placement = source('../projectPlacements.ts')
assert.match(tab, /channelKey: arcade/)
assert.doesNotMatch(tab, /requiredRole: ADMIN/)
const play = resolveChannels([
  { contentType: 'channel', channelKey: 'arcade', label: 'Play' },
  parse(tab.split('---')[1]!),
])[0]!
const tutorial = play.tabs.find(
  (item) => item.key === 'save-the-plumber',
)?.tutorial
assert.ok(tutorial?.explicit, 'the tab has authored tutorial help')
for (const section of ['Movement lab', 'Tools and enemies', 'Eight worlds'])
  assert.ok(
    tutorial.body.includes(section),
    `visible tutorial includes ${section}`,
  )
assert.doesNotMatch(page, /!user\.isAdmin/)
assert.match(tab, /Work in progress/)
assert.match(page, /ArcadeCabinet slug="save-the-plumber"/)
assert.match(placement, /'save-the-plumber':\s*\{[\s\S]*?channelKey: 'arcade'/)
assert.equal(findArcadeGame('save-the-plumber')?.maxPlausibleScore, 0)
assert.ok(!HALL_GAMES.some((game) => game.slug === 'save-the-plumber'))
assert.equal(
  typeof (await loadArcadeGame('save-the-plumber')).create,
  'function',
)

const options = {
  rng: () => 0.5,
  sound: { play() {} },
  demo: false,
  hiScore: 0,
}
const game = createSavePlumberPreview(options)
const input = emptyInput()
const press = (button: 'a' | 'b' | 'start' | 'right') => {
  input.pressed[button] = true
  game.update(input)
  input.pressed[button] = false
}
assert.equal(game.mode, 'title')
press('start')
assert.equal(game.mode, 'select', 'Start opens the heroine select')
press('a')
assert.equal(game.mode, 'story', 'a new game opens on the story')
press('start')
assert.equal(game.mode, 'intro', 'Start skips the story')
press('a')
assert.equal(game.mode, 'play')
input.held.right = true
for (let frame = 0; frame < 25; frame++) game.update(input)
assert.equal(game.level, 1)
assert.equal(game.over, false)
assert.equal(game.lives, 3)
input.held.right = false
for (let frame = 0; frame < 30; frame++) game.update(input)
assert.equal(game.over, false)
console.log('Save the Plumber public Play route and opening flow verified')
