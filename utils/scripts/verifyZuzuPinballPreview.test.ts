import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  ARCADE_GAMES,
  PREVIEW_GAMES,
  findArcadeGame,
  isPlausibleScore,
  loadArcadeGame,
} from '../arcade/games'
import { emptyInput, isWebGLInstance } from '../arcade/types'
import { livePhysicsWorlds } from '../arcade/pinball/physics/world'
import { ZUZU_LAST_BELL_GREYBOX } from '../arcade/pinball/tables/zuzuLastBell/table'

const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')

assert.equal(
  ARCADE_GAMES.some((game) => game.slug === 'zuzu-pinball'),
  false,
)
assert.equal(
  PREVIEW_GAMES.filter((game) => game.slug === 'zuzu-pinball').length,
  1,
)
assert.equal(findArcadeGame('zuzu-pinball')?.renderMode, 'webgl')
assert.equal(isPlausibleScore('zuzu-pinball', 5000), false)
assert.equal(isPlausibleScore('kind-pinball', 5000), true)

const tab = read('../../content/channels/admin/zuzu-pinball.md')
assert.match(tab, /requiredRole: ADMIN/)
assert.match(tab, /route: \/admin\/zuzu-pinball/)
assert.match(read('../../pages/admin/zuzu-pinball.vue'), /user\.isAdmin/)
const arcade = read('../../pages/play/arcade/index.vue')
assert.match(arcade, /ARCADE_GAMES\.some/)
assert.match(arcade, /findArcadeGame\(slug\.value\)/)

const table = ZUZU_LAST_BELL_GREYBOX
assert.equal(table.id, 'zuzu-last-bell-greybox')
assert.notEqual(table.id, 'ami-village-greybox')
assert.equal(table.physical.widthM, 0.56)
assert.equal(table.flippers.length, 2)
assert.deepEqual(
  table.flippers.map((flipper) => flipper.side),
  ['left', 'right'],
)
assert.ok(table.sensors.some((sensor) => sensor.id === 'bell-lane'))
assert.deepEqual(
  table.shots.find((shot) => shot.id === 'croc-mouth')?.sensors,
  ['croc-mouth'],
)
assert.ok(table.scoops.find((scoop) => scoop.id === 'croc-mouth')?.holdMs)
assert.deepEqual(
  table.scoops.find((scoop) => scoop.id === 'croc-mouth')?.eject.at,
  [0.18, table.physical.ballRadiusM + 0.005, -0.07],
)
assert.ok(table.colliders.some((collider) => collider.id === 'zuzu-playfield'))
assert.ok(!table.colliders.some((collider) => collider.id.includes('ami')))
assert.equal(
  table.art?.room?.backglass,
  '/images/arcade/games/zuzu-ghost-trail-title.webp',
)

const module = await loadArcadeGame('zuzu-pinball')
for (let i = 0; i < 3; i++) {
  const game = module.create({
    rng: () => 0.5,
    demo: true,
    hiScore: 0,
    sound: { play: () => {} },
  })
  assert.equal(isWebGLInstance(game), true)
  for (let tick = 0; tick < 90; tick++) game.update(emptyInput())
  if (isWebGLInstance(game)) {
    game.dispose()
    game.dispose()
  }
}
assert.equal(
  livePhysicsWorlds(),
  0,
  'repeated private previews free Rapier physics worlds',
)
console.log('Zuzu Pinball private 3D prototype and access contracts passed')
