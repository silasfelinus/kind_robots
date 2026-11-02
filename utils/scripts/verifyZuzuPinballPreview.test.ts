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
import { Room } from '../arcade/pinball/render/room'
import { AMI_VILLAGE_GREYBOX } from '../arcade/pinball/tables/amiVillage/table'
import { ZUZU_LAST_BELL_GREYBOX } from '../arcade/pinball/tables/zuzuLastBell/table'

const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')

assert.equal(
  ARCADE_GAMES.filter((game) => game.slug === 'zuzu-pinball').length,
  1,
)
assert.equal(
  PREVIEW_GAMES.some((game) => game.slug === 'zuzu-pinball'),
  false,
)
assert.equal(findArcadeGame('zuzu-pinball')?.renderMode, 'webgl')
assert.equal(isPlausibleScore('zuzu-pinball', 5000), false)
assert.equal(isPlausibleScore('kind-pinball', 5000), true)

const tab = read('../../content/channels/arcade/zuzu-pinball.md')
assert.doesNotMatch(tab, /requiredRole: ADMIN/)
assert.match(tab, /route: \/play\/zuzu-pinball/)
const publicPlay = read('../../pages/play/zuzu-pinball.vue')
assert.doesNotMatch(publicPlay, /user\.isAdmin/)
assert.doesNotMatch(
  publicPlay,
  /openWorkspaceSheet|kind-icon:question/,
  'the header "?" is the one tutorial button; the page draws no second one',
)
assert.match(
  tab,
  /tutorial:/,
  'the header "?" opens the tab-authored Zuzu Pinball tutorial',
)
assert.match(publicPlay, /ArcadeCabinet slug="zuzu-pinball"/)
assert.match(publicPlay, /zuzu-game-stage/)
assert.match(publicPlay, /cabinet-marquee/)
assert.match(publicPlay, /cabinet-title-plate/)
assert.doesNotMatch(publicPlay, /The water has teeth/)
assert.doesNotMatch(publicPlay, /Under construction/)
assert.doesNotMatch(publicPlay, /Zuzu Pinball art direction/)
assert.doesNotMatch(publicPlay, /xl:grid-cols/)
assert.match(tab, /The water has teeth/)
assert.match(tab, /TABLE RULES:/)
assert.match(read('../../pages/admin/zuzu-pinball.vue'), /redirectCode: 301/)
const privateWorkshop = read('../../pages/admin/zuzu-pinball-workshop.vue')
assert.match(privateWorkshop, /user\.isAdmin/)
assert.match(privateWorkshop, /ArcadePinballLightMap/)
assert.match(privateWorkshop, /ZUZU_LAST_BELL_GREYBOX/)
const workshopTab = read(
  '../../content/channels/admin/zuzu-pinball-workshop.md',
)
assert.match(workshopTab, /requiredRole: ADMIN/)
assert.match(workshopTab, /route: \/admin\/zuzu-pinball-workshop/)
assert.doesNotMatch(publicPlay, /ArcadePinballLightMap/)
const arcade = read('../../pages/play/arcade/index.vue')
assert.match(arcade, /ARCADE_GAMES\.some/)
assert.match(arcade, /findArcadeGame\(slug\.value\)/)

const table = ZUZU_LAST_BELL_GREYBOX
assert.equal(table.id, 'zuzu-last-bell-greybox')
assert.notEqual(table.id, 'ami-village-greybox')
assert.equal(table.physical.widthM, 0.56)
// Four flippers across two elevations (the lower pair and the Abbey deck's),
// and the hidden undercrypt's own pair (t-010).
assert.equal(table.flippers.length, 6)
assert.deepEqual(
  table.flippers.map((flipper) => [
    flipper.side,
    !!flipper.upper,
    flipper.zone ?? null,
  ]),
  [
    ['left', false, null],
    ['right', false, null],
    ['left', true, null],
    ['right', true, null],
    ['left', false, 'sub-table'],
    ['right', false, 'sub-table'],
  ],
)
assert.ok(
  table.flippers.filter((f) => f.upper).every((f) => f.pivot[1] > 0.15),
  'the upper pair stands on the raised deck',
)
assert.ok(table.sensors.some((sensor) => sensor.id === 'bell-lane'))
assert.deepEqual(
  table.shots.find((shot) => shot.id === 'croc-mouth')?.sensors,
  ['croc-mouth'],
)
assert.ok(table.scoops.find((scoop) => scoop.id === 'croc-mouth')?.holdMs)
const crocEject = table.scoops.find((scoop) => scoop.id === 'croc-mouth')?.eject
assert.ok(
  crocEject && crocEject.at[0] > 0.16 && crocEject.at[0] < 0.2,
  'River Croc spits into the right inlane',
)
assert.ok(crocEject.velocity[2] >= 0, 'the spit rolls down toward the flipper')
assert.ok(table.colliders.some((collider) => collider.id === 'zuzu-playfield'))
assert.ok(!table.colliders.some((collider) => collider.id.includes('ami')))
assert.equal(
  table.art?.room?.backglass,
  '/images/pinball/zuzu-last-bell-backglass.webp',
)
assert.equal(
  table.art?.room?.backglassFallback,
  '/images/arcade/games/zuzu-ghost-trail-title.webp',
  'the Zuzu title art stands in until the backglass loads',
)
assert.equal(
  table.art?.playfield?.src,
  '/images/pinball/zuzu-last-bell-playfield-painted.webp',
)
// The cabinet's sides carry the Last Bell's own panorama (t-017); a table
// without side art still echoes its backglass on them.
assert.equal(
  table.art?.room?.cabinetSide,
  '/images/pinball/zuzu-last-bell-cabinet-side.webp',
)
{
  const keep = <T>(resource: T) => resource
  const zuzuRoom = new Room(table, keep, 0, table.art?.room)
  assert.equal(zuzuRoom.sideArtSrc, table.art?.room?.cabinetSide)
  const kp = AMI_VILLAGE_GREYBOX.art?.room
  const kpRoom = new Room(AMI_VILLAGE_GREYBOX, keep, 0, kp)
  assert.equal(kp?.cabinetSide, undefined)
  assert.equal(
    kpRoom.sideArtSrc,
    kp?.backglass,
    'Kind Pinball echoes its glass',
  )
}

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
console.log('Zuzu Pinball public 3D prototype and access contracts passed')
