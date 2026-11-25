import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { parse } from 'yaml'
import { resolveChannels } from '../../stores/helpers/channelContent'
import { createSavePlumberPreview } from '../arcade/games/savePlumberPreview'
import { emptyInput } from '../arcade/types'
import { parseLoop } from '../arcade/sound'
import {
  PLUMBER_BOSS_MUSIC,
  PLUMBER_JUMP_NOTES,
  PLUMBER_LAND_NOTES,
  PLUMBER_WORLD_MUSIC,
} from '../arcade/games/savePlumberMusic'
import { findArcadeGame, HALL_GAMES, loadArcadeGame } from '../arcade/games'
import { achievementsForGame } from '../achievements/gameAchievements'

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
assert.match(page, /ArcadeCabinet\s+slug="save-the-plumber"/)
assert.match(page, /ArcadeCabinet\s+slug="save-the-plumber"\s+contained/)
assert.match(page, /:plumber-launch="plumberLaunch"/)
assert.match(page, /@click="launchPlumber\('new'\)"/)
assert.match(page, /@click="launchPlumber\('continue'\)"/)
assert.match(page, /plumber-viewport/)
assert.match(page, /plumber-motion-video/)
for (const screen of [
  'title',
  'story',
  'worlds',
  'crew',
  'guide',
  'settings',
  'achievements',
  'maker',
  'play',
])
  assert.ok(page.includes(`screen === '${screen}'`) || screen === 'play')
assert.match(page, /@click="go\('settings'\)"/)
assert.match(page, /@click="go\('achievements'\)"/)
assert.match(page, /aria-labelledby="achievements-heading"/)
assert.match(
  page,
  /<GameAchievementStrip game="save-the-plumber" layout="row" \/>/,
)
assert.match(page, /plumber-achievements-view/)
assert.ok(achievementsForGame('save-the-plumber').length >= 12)
assert.match(
  page,
  /if \(plumber\.gears\.has\(code\)\) labels\.push\('GEAR FOUND'\)/,
)
assert.match(page, /return labels\.join\(' · '\) \|\| 'UNDISCOVERED'/)
assert.match(page, /aria-labelledby="settings-heading"/)
assert.match(page, /arcade\.loadPreferences\(reducedMotion\.value\)/)
assert.match(page, /arcade\.setVolume\(/)
assert.match(page, /arcade\.setMuted\(!arcade\.muted\)/)
assert.match(page, /arcade\.setStillCamera\(!arcade\.stillCamera\)/)
assert.match(page, /arcade\.setHighContrast\(!arcade\.highContrast\)/)
assert.match(page, /aria-label="Arcade volume"/)
assert.match(page, /:disabled="arcade.muted"/)
assert.doesNotMatch(page, /localStorage/)
assert.match(page, /prefers-reduced-motion: reduce/)
assert.doesNotMatch(page, /PlumberTitleScene|href="#plumber-/)
for (let world = 1; world <= 8; world++) {
  for (const extension of ['webp', 'webm', 'mp4'])
    assert.ok(
      existsSync(
        new URL(
          '../../public/save-the-plumber/maps/world-' + world + '.' + extension,
          import.meta.url,
        ),
      ),
      'shipped painted world ' + world + ' ' + extension + ' exists',
    )
}
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
assert.equal(game.mode, 'files', 'Start opens the three-slot file select')
press('a')
assert.equal(game.mode, 'select', 'an empty file opens the heroine select')
press('a')
assert.equal(game.mode, 'story', 'a new game opens on the story')
press('start')
assert.equal(game.mode, 'map', 'Start skips the story to the world map')
press('right')
for (let frame = 0; frame < 40; frame++) game.update(input)
press('a')
assert.equal(game.mode, 'intro', 'A on 1-1 enters the stage')
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

const calmRun = createSavePlumberPreview({
  ...options,
  stillCamera: true,
  highContrast: true,
})
calmRun.loadStage(0)
calmRun.mode = 'play'
calmRun.foes.length = 0
for (let frame = 0; frame < 20; frame++) {
  const keys = emptyInput()
  keys.held.right = true
  keys.held.b = true
  calmRun.update(keys)
}
assert.ok(calmRun.hero.vx > 0, 'calm motion does not stop movement')
assert.equal(calmRun.cameraLead, 0, 'still camera removes anticipatory lead')

const edgeColors = new Set<string>()
const edgeSegments: number[][] = []
const edgeProbe = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  save() {},
  restore() {},
  beginPath() {},
  moveTo(x: number, y: number) {
    edgeSegments.push([x, y])
  },
  lineTo(x: number, y: number) {
    edgeSegments.at(-1)!.push(x, y)
  },
  stroke() {
    edgeColors.add(this.strokeStyle)
  },
  fillRect() {
    edgeColors.add(this.fillStyle)
  },
}
const contrast = calmRun as unknown as {
  renderContrastEdges(g: CanvasRenderingContext2D): void
}
contrast.renderContrastEdges(edgeProbe as unknown as CanvasRenderingContext2D)
assert.ok(edgeColors.has('#ffffff'), 'contrast marks exposed terrain')
assert.ok(edgeColors.has('#101820'), 'contrast backs edges with a dark stroke')
assert.ok(
  edgeSegments.some(([x1, y1, x2, y2]) => x1 !== x2 && y1 !== y2),
  'contrast follows the diagonal ramp surface',
)

assert.equal(PLUMBER_WORLD_MUSIC.length, 8)
const melodies = new Set<string>()
for (const [index, loop] of PLUMBER_WORLD_MUSIC.entries()) {
  const parsed = parseLoop(loop)
  assert.equal(parsed.length, 32, `world ${index + 1} has a complete loop`)
  assert.ok(parsed.notes.length >= 32, 'the score is not silent')
  assert.ok(loop.tracks.every((track) => track.steps.split(' ').length === 32))
  melodies.add(loop.tracks[0]!.steps)
}
assert.equal(melodies.size, 8, 'each world has its own melody')
assert.equal(parseLoop(PLUMBER_BOSS_MUSIC).length, 32)
assert.equal(game.music, PLUMBER_WORLD_MUSIC[0])
assert.equal(game.musicScene, 'level')

const bossRun = createSavePlumberPreview(options)
assert.equal(bossRun.music, null, 'the title does not start a loop')
bossRun.loadStage(3)
bossRun.mode = 'play'
assert.ok(bossRun.boss, '1-4 contains a boss')
bossRun.locked = true
assert.equal(bossRun.musicScene, 'boss')
assert.equal(bossRun.music, PLUMBER_BOSS_MUSIC)
bossRun.boss!.state = 'defeat'
assert.equal(bossRun.musicScene, 'level', 'defeated bosses release tension')
assert.equal(bossRun.music, PLUMBER_WORLD_MUSIC[0])
bossRun.mode = 'dying'
assert.equal(bossRun.music, null, 'death stops the running score')

const actionSounds: unknown[] = []
const actionRun = createSavePlumberPreview({
  ...options,
  sound: {
    play() {},
    playNotes(notes) {
      actionSounds.push(notes)
    },
  },
})
actionRun.loadStage(0)
actionRun.mode = 'play'
for (let frame = 0; frame < 80; frame++) {
  const keys = emptyInput()
  keys.pressed.a = frame === 4
  keys.held.a = frame >= 4 && frame < 20
  actionRun.update(keys)
}
assert.deepEqual(
  actionSounds,
  [PLUMBER_JUMP_NOTES, PLUMBER_LAND_NOTES],
  'one original synth cue plays at takeoff and at a real landing',
)

// The title shortcuts must not erase or open an incompatible slot.
const shortcutSave = {
  v: 3,
  active: 0,
  slots: [
    { heroine: 7, stage: 1, score: 50, lives: 3, tokens: 2 },
    null,
    { heroine: 2, stage: 4, score: 200, lives: 2, tokens: 8 },
  ],
}
const newFile = createSavePlumberPreview({
  ...options,
  resume: shortcutSave,
  plumberLaunch: 'new',
})
const tap = (run: typeof newFile, key: 'a' | 'b' | 'y' | 'up' | 'down') => {
  const keys = emptyInput()
  keys.pressed[key] = true
  run.update(keys)
}
assert.equal(newFile.mode, 'files')
assert.equal(newFile.slotCursor, 1)
const original = JSON.stringify(newFile.save)
tap(newFile, 'up')
tap(newFile, 'y')
tap(newFile, 'y')
tap(newFile, 'a')
assert.equal(newFile.mode, 'files')
assert.equal(JSON.stringify(newFile.save), original)
tap(newFile, 'down')
tap(newFile, 'a')
assert.equal(newFile.mode, 'select')

const continueFile = createSavePlumberPreview({
  ...options,
  resume: { ...shortcutSave, active: 1 },
  plumberLaunch: 'continue',
})
assert.equal(continueFile.mode, 'files')
assert.equal(continueFile.slotCursor, 0)
tap(continueFile, 'down')
tap(continueFile, 'a')
assert.equal(continueFile.mode, 'files')
tap(continueFile, 'down')
tap(continueFile, 'a')
assert.equal(continueFile.mode, 'map')
assert.equal(continueFile.score, 200)

const noSave = createSavePlumberPreview({
  ...options,
  plumberLaunch: 'continue',
})
assert.equal(noSave.mode, 'title')

console.log('Save the Plumber public Play route and opening flow verified')
