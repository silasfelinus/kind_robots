import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createSavePlumberPreview } from '../arcade/games/savePlumberPreview'
import { emptyInput } from '../arcade/types'
import { findArcadeGame, HALL_GAMES, loadArcadeGame } from '../arcade/games'

const source = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8')
const tab = source('../../content/channels/admin/save-the-plumber.md')
const page = source('../../pages/admin/save-the-plumber.vue')
const placement = source('../projectPlacements.ts')
assert.match(tab, /channelKey: admin/)
assert.match(tab, /requiredRole: ADMIN/)
assert.match(tab, /tutorial:[\s\S]*?sections:/)
assert.match(page, /!user\.isAdmin/)
assert.match(page, /ArcadeCabinet slug="save-the-plumber"/)
assert.match(placement, /'save-the-plumber':\s*\{[\s\S]*?channelKey: 'admin'/)
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
input.held.right = true
for (let frame = 0; frame < 25; frame++) game.update(input)
assert.equal(game.level, 1)
assert.equal(game.over, false)
assert.equal(game.lives, 3)
input.held.right = false
input.pressed.up = true
game.update(input)
input.pressed.up = false
for (let frame = 0; frame < 30; frame++) game.update(input)
assert.equal(game.over, false)
console.log('Save the Plumber private Arcade route and movement slice verified')
