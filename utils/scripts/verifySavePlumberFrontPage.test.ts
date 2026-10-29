import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  DEFAULT_HEROINE_SEED,
  HEROINE_FIRST_NAMES,
  HEROINE_HAIR_STYLES,
  HEROINE_HITBOX,
  HEROINE_LAST_NAMES,
  HEROINE_OUTFITS,
  HEROINE_SKIN_TONES,
  createHeroine,
  heroineRunCode,
  rollHeroineSeed,
} from '../arcade/games/savePlumberHeroine'
import {
  PLUMBER_CAST,
  PLUMBER_ENEMIES,
  PLUMBER_POWERS,
  PLUMBER_STAGE_COUNT,
  PLUMBER_WORLDS,
} from '../arcade/games/savePlumberWorlds'

const source = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8')

assert.equal(PLUMBER_WORLDS.length, 8)
assert.equal(PLUMBER_STAGE_COUNT, 32)
assert.deepEqual(
  PLUMBER_WORLDS.map((world) => world.id),
  [1, 2, 3, 4, 5, 6, 7, 8],
)
for (const world of PLUMBER_WORLDS) {
  assert.deepEqual(
    world.stages.map((stage) => stage.beat),
    ['Introduce', 'Combine', 'Subvert', 'Boss'],
    `${world.name} follows the four-beat world structure`,
  )
  assert.deepEqual(
    world.stages.map((stage) => stage.code),
    [1, 2, 3, 4].map((n) => `${world.id}-${n}`),
  )
  assert.ok(world.boss.name && world.boss.tell, `${world.name} has a boss tell`)
  assert.ok(world.enemies.length > 0)
  assert.match(
    world.art,
    /^\/images\/arcade\/save-the-plumber\/world-\d-[a-z-]+\.webp$/,
  )
}
assert.equal(new Set(PLUMBER_WORLDS.map((world) => world.boss.name)).size, 8)
assert.equal(PLUMBER_WORLDS[7]!.boss.name, 'Lady Spigot')

const playable = PLUMBER_WORLDS.flatMap((world) => world.stages).filter(
  (stage) => stage.playable,
)
assert.deepEqual(
  playable.map((stage) => stage.code),
  [
    '1-1',
    '1-2',
    '1-3',
    '1-4',
    '2-1',
    '2-2',
    '2-3',
    '2-4',
    '3-1',
    '3-2',
    '3-3',
    '3-4',
    '4-1',
    '4-2',
    '4-3',
    '4-4',
    '5-1',
    '5-2',
    '5-3',
    '5-4',
    '6-1',
    '6-2',
    '6-3',
    '6-4',
    '7-1',
    '7-2',
    '7-3',
    '7-4',
    '8-1',
    '8-2',
    '8-3',
    '8-4',
  ],
)

assert.deepEqual(
  PLUMBER_CAST.map((member) => member.key),
  ['teo', 'spigot'],
)
assert.equal(PLUMBER_ENEMIES.length, 14)
assert.deepEqual(
  PLUMBER_POWERS.map((power) => power.name),
  ['Springstep', 'Bottled Storm', 'Pocket Lift'],
)

for (const seed of [0, 1, DEFAULT_HEROINE_SEED, 0xffffffff, 123456789])
  assert.deepEqual(createHeroine(seed), createHeroine(seed))
assert.notDeepEqual(createHeroine(1), createHeroine(2))

const names = new Set<string>()
const styles = new Set<string>()
const skins = new Set<string>()
const outfits = new Set<string>()
for (let seed = 0; seed < 4000; seed++) {
  const heroine = createHeroine(seed * 7919 + 13)
  const [first, ...rest] = heroine.name.split(' ')
  assert.ok((HEROINE_FIRST_NAMES as readonly string[]).includes(first!))
  assert.ok((HEROINE_LAST_NAMES as readonly string[]).includes(rest.join(' ')))
  assert.ok(!('hitbox' in heroine), 'appearance never carries collision data')
  names.add(heroine.name)
  styles.add(heroine.hairStyle)
  skins.add(heroine.skin)
  outfits.add(heroine.outfit)
}
assert.equal(
  styles.size,
  HEROINE_HAIR_STYLES.length,
  'every hair style is reachable',
)
assert.equal(
  skins.size,
  HEROINE_SKIN_TONES.length,
  'every skin tone is reachable',
)
assert.equal(outfits.size, HEROINE_OUTFITS.length, 'every outfit is reachable')
assert.ok(names.size > 200, 'names vary widely across runs')
assert.deepEqual(HEROINE_HITBOX, { width: 22, height: 27 })
assert.ok(Object.isFrozen(HEROINE_HITBOX))

assert.equal(heroineRunCode(0x5a7e0001), '5A7E-0001')
assert.equal(heroineRunCode(11), '0000-000B')
const rolled = rollHeroineSeed(() => 0.999999999)
assert.ok(Number.isInteger(rolled) && rolled >= 0 && rolled <= 0xffffffff)
assert.equal(
  rollHeroineSeed(() => 0),
  0,
)

const page = source('../../pages/play/save-the-plumber.vue')
for (const part of [
  'plumber-console',
  'plumber-viewport',
  'plumber-motion-video',
  'plumber-main-menu',
  'plumber-stage-grid',
  'plumber-crew-portrait',
  '<PlumberHeroineFace',
  'plumber-guide-grid',
  'plumber-footer-back',
  'ArcadeCabinet slug="save-the-plumber" contained',
])
  assert.ok(page.includes(part), `console experience includes ${part}`)
assert.match(
  page,
  /type Screen = 'title' \\| 'story' \\| 'worlds' \\| 'crew' \\| 'guide' \\| 'maker' \\| 'play'/,
)
assert.doesNotMatch(
  page,
  /PlumberTitleScene|<ConsoleTabs|href="#plumber-|!user\\.isAdmin/,
  'the Play route is a role-neutral console without retired title or scroll tabs',
)
assert.match(page, /prefers-reduced-motion: reduce/)
assert.match(page, /v-if="!reducedMotion"/, 'reduced motion keeps the still')
assert.match(page, /@keydown="onScreenKey"/, 'menu has keyboard navigation')
for (let world = 1; world <= 8; world++) {
  for (const extension of ['webp', 'webm', 'mp4']) {
    assert.ok(
      existsSync(
        new URL(
          `../../public/save-the-plumber/maps/world-${world}.${extension}`,
          import.meta.url,
        ),
      ),
      `painted world ${world} ${extension} is committed`,
    )
  }
}
assert.ok(
  !/localStorage|\\$fetch/.test(page),
  'the page leaves storage and APIs to stores',
)
assert.match(
  source('../../stores/savePlumberStore.ts'),
  /readPlumberSave\\(arcade\\.saveFor\\(PLUMBER_SLUG\\)\\)/,
  'the page stars the heroine chosen in the cabinet',
)

console.log(
  'Save the Plumber front page: campaign data, heroine generator and page contract verified',
)
