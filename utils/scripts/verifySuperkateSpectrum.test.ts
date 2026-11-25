import assert from 'node:assert/strict'
import {
  COLS,
  ROWS,
  CHAPTER_RULES,
  STORY_LAYOUTS,
  pressureAfterShot,
  pressureLimit,
  specialForStage,
  detachUnanchored,
  activeHues,
  attachAndPop,
  fireSpecial,
  center,
  chooseHue,
  emptyBoard,
  makeBoard,
  nearestSnap,
  neighbors,
  pushCeiling,
} from '../arcade/superkateSpectrum/board'
import { emptyInput } from '../arcade/types'
import {
  rankForXp,
  recordClassicEnd,
  recordClear,
  recordPop,
  readSpectrumSave,
  mergeSpectrumSaves,
  validSpectrumCloudSave,
  styleForRank,
} from '../arcade/superkateSpectrum/progress'
import {
  CHAPTER_VOICES,
  STORY_DECISIONS,
  STORY_ENDINGS,
  endingForStory,
  pendingStoryDecision,
} from '../arcade/superkateSpectrum/story'
import {
  BOSS_PATTERNS,
  bossContact,
  bossTarget,
  create,
  storyMapPosition,
} from '../arcade/games/superkateSpectrum'
import {
  SPECTRUM_BOSS_MUSIC,
  SPECTRUM_CLASSIC_MUSIC,
  SPECTRUM_MENU_MUSIC,
  SPECTRUM_THEMES,
} from '../arcade/superkateSpectrum/music'

const board = emptyBoard()
assert.equal(board.length, ROWS)
assert.equal(board[0]?.length, COLS)
assert.equal(neighbors({ row: 0, col: 0 }).length, 2)
assert.equal(neighbors({ row: 1, col: 0 }).length, 5)
assert.equal(neighbors({ row: 0, col: 9 }).length, 3)
assert.deepEqual(center({ row: 0, col: 0 }), { x: 22, y: 40 })
assert.deepEqual(center({ row: 1, col: 0 }), { x: 36, y: 64 })
board[0]![0] = 'pink'
board[0]![1] = 'pink'
board[1]![0] = 'teal'
board[2]![0] = 'teal'
assert.deepEqual(
  attachAndPop(board, { row: 1, col: 1 }, 'pink'),
  { matched: 3, dropped: 2, cleared: true },
  'A matching cluster pops and the disconnected branch falls',
)
assert.equal(activeHues(board).length, 0)
const noPop = emptyBoard()
noPop[0]![0] = 'gold'
assert.equal(attachAndPop(noPop, { row: 1, col: 0 }, 'teal').matched, 0)
assert.equal(noPop[1]![0], 'teal')
assert.equal(attachAndPop(noPop, { row: 1, col: 0 }, 'gold').matched, 0)
const snap = nearestSnap(noPop, { x: 22, y: 70 })
assert.ok(snap)
assert.equal(noPop[snap!.row]![snap!.col], null)
const pushed = emptyBoard()
pushed[ROWS - 1]![0] = 'pink'
assert.equal(
  pushCeiling(pushed, () => 0),
  true,
)
assert.equal(
  pushed[0]!.every((hue) => hue === 'pink'),
  true,
)
const salonBubbleCounts = [19, 22, 26, 37, 38]
const salonSnapshots = new Set<string>()
for (let stage = 1; stage <= 5; stage++) {
  const authored = makeBoard(stage, () => {
    throw new Error('Authored Salon boards must not depend on the RNG')
  })
  const cells = authored.flat().filter((color) => color !== null)
  assert.equal(
    cells.length,
    salonBubbleCounts[stage - 1],
    `Salon stage ${stage} retains its intended puzzle density`,
  )
  assert.deepEqual(
    activeHues(authored),
    ['pink', 'teal', 'gold'],
    'The intro chapter teaches with only three distinguishable hues',
  )
  salonSnapshots.add(JSON.stringify(authored))
}
assert.equal(
  salonSnapshots.size,
  5,
  'All five Salon lessons have unique boards',
)
const classicOpening = makeBoard(1, () => 0, 'classic')
assert.notDeepEqual(
  classicOpening,
  makeBoard(1, () => 0, 'story'),
  'Classic must remain a procedural, replayable run instead of fixed story boards',
)
assert.notEqual(
  classicOpening.flat().filter(Boolean).length,
  salonBubbleCounts[0],
)
const firstLesson = makeBoard(1, () => 0.8)
assert.ok(
  attachAndPop(firstLesson, { row: 3, col: 0 }, 'pink').matched >= 3,
  'The first hand-authored tutorial permits an immediate matching shot',
)
const palette = makeBoard(30, () => 0.99, 'classic')
assert.ok(activeHues(palette).includes('lime'))
assert.equal(
  chooseHue(palette, () => 0),
  'lime',
)
assert.equal(STORY_LAYOUTS.length, 30)
const allStoryBoards = new Set<string>()
for (let stage = 1; stage <= 30; stage++) {
  const authored = makeBoard(stage, () => {
    throw new Error('Story layout must not consume random numbers')
  })
  assert.equal(authored.length, ROWS)
  assert.ok(authored.every((row) => row.length === COLS))
  assert.ok(STORY_LAYOUTS[stage - 1]!.every((row) => row.length === COLS))
  assert.ok(authored[0]!.some(Boolean))
  assert.ok(!authored[ROWS - 1]!.some(Boolean))
  allStoryBoards.add(JSON.stringify(authored))
  if (stage > 5)
    assert.equal(
      detachUnanchored(authored),
      0,
      'Every new puzzle starts anchored',
    )
}
assert.equal(allStoryBoards.size, 30)
assert.equal(activeHues(makeBoard(30, () => 0)).length, 6)
const miss = { matched: 0, dropped: 0, cleared: false }
const match = { matched: 3, dropped: 0, cleared: false }
const chain = { matched: 6, dropped: 3, cleared: false }
assert.equal(CHAPTER_RULES.length, 6)
assert.equal(pressureAfterShot(3, 1, 'story', match, false), 4)
assert.equal(pressureAfterShot(3, 6, 'story', match, false), 3)
assert.equal(pressureAfterShot(3, 6, 'story', miss, false), 4)
assert.equal(pressureAfterShot(3, 11, 'story', match, true), 3)
assert.equal(pressureAfterShot(3, 11, 'story', match, false), 4)
assert.equal(pressureAfterShot(3, 16, 'story', chain, false), 2)
assert.equal(pressureAfterShot(0, 16, 'story', chain, false), 0)
assert.equal(pressureAfterShot(3, 26, 'story', chain, false), 3)
assert.equal(pressureAfterShot(3, 26, 'story', match, false), 4)
assert.equal(pressureAfterShot(3, 26, 'classic', chain, true), 4)
assert.equal(pressureLimit(35, 'classic'), 4)
assert.equal(pressureLimit(26, 'story'), 5)
assert.equal(CHAPTER_RULES[4].charge, 12)
assert.deepEqual(
  [0, 1, 2, 3].map((count) => specialForStage(21, 1, count)),
  ['prism', 'burst', 'ribbon', 'prism'],
)
const rng = () => 0.25
const options = {
  rng,
  demo: false,
  hiScore: 0,
  sound: {
    play: () => {},
  },
}
const game = create(options as Parameters<typeof create>[0])
assert.equal(game.level, 1)
assert.equal(game.over, false)
const input = emptyInput()
input.pressed.a = true
game.update(input)
assert.equal(game.level, 1)
assert.equal(game.over, false)
for (let i = 0; i < 90; i++) game.update(emptyInput())
assert.ok(game.score >= 0)
const vintage = readSpectrumSave({
  version: 1,
  stage: 12,
  score: 3500,
  lives: 2,
})
assert.equal(vintage.career.highestStage, 12)
assert.equal(vintage.stage, 12)
const resumed = create({
  ...options,
  resume: {
    version: 2,
    career: {
      xp: 9000,
      highestStage: 12,
      stars: Array(30).fill(2),
      lifetimePops: 550,
      classicBest: 1200,
      classicRuns: 4,
    },
    mode: 'story',
    stage: 12,
  },
} as Parameters<typeof create>[0])
assert.equal(resumed.level, 12)
assert.equal(readSpectrumSave(resumed.save).career.highestStage, 12)
assert.equal(readSpectrumSave(resumed.save).career.xp, 9000)
const swapSkin = emptyInput()
swapSkin.pressed.b = true
resumed.update(swapSkin)
assert.equal(readSpectrumSave(resumed.save).style, 'candy')
const refreshed = create({
  ...options,
  resume: resumed.save,
} as Parameters<typeof create>[0])
assert.equal(readSpectrumSave(refreshed.save).style, 'candy')
assert.equal(rankForXp(0), 1)
assert.ok(rankForXp(9000) > rankForXp(100))
assert.equal(styleForRank(1), 'glass')
assert.equal(styleForRank(4), 'candy')
assert.equal(styleForRank(9), 'starlight')
assert.equal(styleForRank(15), 'prismatic')
const achieved = recordClear(vintage.career, 12, 8, 18)
assert.equal(achieved.highestStage, 13)
assert.equal(achieved.stars[11], 3)
assert.equal(vintage.career.stars[11], 0, 'Old save stays immutable')
assert.equal(recordClear(achieved, 12, 40, 1).stars[11], 3)
const replay = recordPop(achieved, 3, 7)
assert.equal(replay.lifetimePops, 10)
assert.ok(replay.xp > achieved.xp)
assert.equal(recordClassicEnd(replay, 4200).classicBest, 4200)
assert.equal(recordClassicEnd(replay, 4200).classicRuns, 1)
const invalid = readSpectrumSave({
  version: 2,
  career: {
    xp: -1,
    highestStage: 1000,
    stars: Array(2).fill(10),
    lifetimePops: Infinity,
    classicBest: -1,
    classicRuns: -1,
  },
  mode: 'story',
  stage: 9000,
})
assert.equal(invalid.career.highestStage, 1)
assert.equal(invalid.career.xp, 0)
assert.equal(invalid.career.stars.length, 30)
assert.equal(invalid.stage, 1)
assert.equal(invalid.style, 'glass')
const prism = emptyBoard()
prism[0]![0] = 'pink'
prism[0]![1] = 'pink'
assert.deepEqual(fireSpecial(prism, { row: 1, col: 0 }, 'blue', 'prism'), {
  matched: 3,
  dropped: 0,
  cleared: true,
})
const burst = emptyBoard()
burst[0]![1] = 'gold'
burst[0]![2] = 'teal'
burst[1]![0] = 'lime'
const blast = fireSpecial(burst, { row: 1, col: 1 }, 'pink', 'burst')
assert.ok(blast.matched >= 3)
assert.equal(blast.cleared, true)
const ribbon = emptyBoard()
ribbon[0]![0] = 'pink'
ribbon[1]![0] = 'lime'
const wave = fireSpecial(ribbon, { row: 1, col: 1 }, 'blue', 'ribbon')
assert.equal(wave.matched, 2)
assert.equal(wave.dropped, 0)
assert.equal(ribbon[0]![0], 'pink')
const classic = create({
  ...options,
  resume: {
    version: 2,
    career: replay,
    mode: 'classic',
    stage: 1,
  },
} as Parameters<typeof create>[0])
assert.equal(classic.level, 1)
assert.equal(readSpectrumSave(classic.save).career.xp, replay.xp)
const start = emptyInput()
start.pressed.a = true
classic.update(start)
assert.equal(classic.menuOpen, false)
assert.equal(readSpectrumSave(classic.save).mode, 'classic')
assert.equal(
  readSpectrumSave(classic.save).career.highestStage,
  replay.highestStage,
)
assert.equal(classic.over, false)
// Account merges never lower either device's best stars or highest stage.
const cloudA = readSpectrumSave({
  version: 2,
  career: {
    xp: 6000,
    highestStage: 8,
    stars: Array.from({ length: 30 }, (_, i) => (i < 6 ? 3 : 0)),
    lifetimePops: 190,
    classicBest: 9000,
    classicRuns: 7,
  },
  stage: 8,
  mode: 'story',
  style: 'candy',
  settings: { aimGuide: true, particles: false, highContrast: true },
})
const cloudB = readSpectrumSave({
  version: 2,
  career: {
    xp: 9000,
    highestStage: 12,
    stars: Array.from({ length: 30 }, (_, i) => (i < 3 ? 1 : i === 10 ? 2 : 0)),
    lifetimePops: 250,
    classicBest: 5000,
    classicRuns: 4,
  },
  stage: 11,
  mode: 'story',
  style: 'starlight',
  settings: { aimGuide: false, particles: true, highContrast: false },
})
assert.equal(validSpectrumCloudSave(cloudA), true)
assert.equal(validSpectrumCloudSave(cloudB), true)
const combined = mergeSpectrumSaves(cloudA, cloudB)
assert.equal(combined.career.highestStage, 12)
assert.equal(combined.career.stars[0], 3)
assert.equal(combined.career.stars[10], 2)
assert.equal(combined.career.xp, 9000)
assert.equal(combined.career.classicBest, 9000)
assert.equal(combined.career.classicRuns, 7)
assert.equal(combined.career.lifetimePops, 250)
assert.equal(combined.settings.highContrast, true)
assert.equal(combined.stage, 12)
assert.equal(validSpectrumCloudSave(combined), true)
assert.equal(
  validSpectrumCloudSave({
    ...combined,
    career: { ...combined.career, xp: -2 },
  }),
  false,
)
assert.equal(
  validSpectrumCloudSave({
    ...combined,
    career: { ...combined.career, stars: [4] },
  }),
  false,
)
assert.equal(validSpectrumCloudSave({ ...combined, stage: 300 }), false)
assert.equal(
  validSpectrumCloudSave({ ...combined, settings: { particles: 'oops' } }),
  false,
)
assert.equal(validSpectrumCloudSave({ ...combined, style: 'unknown' }), false)

const mapRun = create({
  ...options,
  resume: cloudB,
} as Parameters<typeof create>[0])
const mapLeft = emptyInput()
mapLeft.pressed.left = true
const mapRight = emptyInput()
mapRight.pressed.right = true
assert.equal(mapRun.menuStage, 12)
mapRun.update(mapRight)
assert.equal(mapRun.menuStage, 12, 'Locked map nodes cannot be selected')
for (let i = 0; i < 35; i++) mapRun.update(mapLeft)
assert.equal(mapRun.menuStage, 1)
mapRun.update(mapRight)
assert.equal(mapRun.menuStage, 2)
const mapStart = emptyInput()
mapStart.pressed.a = true
mapRun.update(mapStart)
assert.equal(mapRun.level, 2, 'Map selection starts the selected replay')
assert.equal(mapRun.save.career.highestStage, 12)
assert.deepEqual(mapRun.save.career.stars, cloudB.career.stars)

const fullMap = create({
  ...options,
  resume: readSpectrumSave({
    ...cloudB,
    career: { ...cloudB.career, highestStage: 30 },
  }),
} as Parameters<typeof create>[0])
assert.equal(fullMap.menuStage, 30)
for (let stage = 29; stage >= 1; stage--) {
  fullMap.update(mapLeft)
  assert.equal(fullMap.menuStage, stage)
}
for (let stage = 2; stage <= 30; stage++) {
  fullMap.update(mapRight)
  assert.equal(fullMap.menuStage, stage)
}
fullMap.update(mapRight)
assert.equal(fullMap.menuStage, 30)

function tapStage(
  run: ReturnType<typeof create>,
  point: { x: number; y: number },
) {
  run.stagePointer({ phase: 'down', ...point })
  run.stagePointer({ phase: 'up', ...point })
}

const touchRun = create({
  ...options,
  resume: cloudB,
} as Parameters<typeof create>[0])
tapStage(touchRun, storyMapPosition(13))
assert.equal(touchRun.menuOpen, true, 'Locked nodes cannot start a run')
assert.equal(touchRun.menuStage, 12)
tapStage(touchRun, { x: 268, y: 400 })
assert.notEqual(touchRun.selectedStyle, 'prismatic')
tapStage(touchRun, { x: 124, y: 400 })
assert.equal(touchRun.selectedStyle, 'candy')
assert.equal(touchRun.save.style, 'candy')
touchRun.stagePointer({ phase: 'down', ...storyMapPosition(2) })
touchRun.stagePointer({ phase: 'up', ...storyMapPosition(3) })
assert.equal(touchRun.menuOpen, true, 'Sliding between nodes cannot launch')
tapStage(touchRun, storyMapPosition(2))
assert.equal(touchRun.menuOpen, false)
assert.equal(touchRun.level, 2)
assert.equal(touchRun.save.career.highestStage, 12)
assert.deepEqual(touchRun.save.career.stars, cloudB.career.stars)
const currentTouchShot = () => touchRun.shot
touchRun.stagePointer({ phase: 'down', x: 160, y: 130 })
assert.equal(currentTouchShot(), null, 'Touch-down aims without shooting')
touchRun.stagePointer({ phase: 'move', x: 80, y: 180 })
assert.ok(touchRun.angle < -Math.PI / 2)
touchRun.stagePointer({ phase: 'cancel', x: 80, y: 180 })
touchRun.stagePointer({ phase: 'up', x: 80, y: 180 })
assert.equal(currentTouchShot(), null, 'Canceled touch cannot fire')
touchRun.stagePointer({ phase: 'down', x: 80, y: 180 })
touchRun.stagePointer({ phase: 'up', x: 80, y: 450 })
assert.equal(currentTouchShot(), null, 'Release outside the field cannot fire')
touchRun.loaded = 'pink'
touchRun.next = 'teal'
tapStage(touchRun, { x: 44, y: 441 })
assert.equal(touchRun.loaded, 'teal')
assert.equal(touchRun.next, 'pink')
touchRun.stagePointer({ phase: 'down', x: 160, y: 130 })
touchRun.stagePointer({ phase: 'move', x: 240, y: 180 })
assert.ok(touchRun.angle > -Math.PI / 2)
touchRun.stagePointer({ phase: 'up', x: 240, y: 180 })
const touchShot = currentTouchShot()
assert.ok(touchShot, 'Release launches the aimed shot')
assert.ok(touchShot.vx > 0 && touchShot.vy < 0)
assert.equal(touchShot.hue, 'teal')
tapStage(touchRun, { x: 80, y: 180 })
assert.equal(touchRun.shot, touchShot, 'Cannot fire while a shot is active')
for (let stage = 1; stage <= 30; stage++) {
  const nodeRun = create({
    ...options,
    resume: readSpectrumSave({
      ...cloudB,
      career: { ...cloudB.career, highestStage: 30 },
    }),
  } as Parameters<typeof create>[0])
  tapStage(nodeRun, storyMapPosition(stage))
  assert.equal(nodeRun.level, stage)
  assert.equal(nodeRun.menuOpen, false)
}

const hub = create({
  ...options,
  resume: cloudB,
  mastery: ['rainbow-rescue'],
} as Parameters<typeof create>[0])
assert.equal(hub.menuTab, 'play')
const nextTab = emptyInput()
nextTab.pressed.x = true
hub.update(nextTab)
assert.equal(hub.menuTab, 'scrapbook')
hub.update(nextTab)
assert.equal(hub.menuTab, 'achievements')
hub.update(nextTab)
assert.equal(hub.menuTab, 'settings')
const toggleEffect = emptyInput()
toggleEffect.pressed.a = true
hub.update(toggleEffect)
assert.equal(readSpectrumSave(hub.save).settings.aimGuide, true)
const increaseRow = emptyInput()
increaseRow.pressed.down = true
hub.update(increaseRow)
hub.update(toggleEffect)
assert.equal(readSpectrumSave(hub.save).settings.particles, false)
const reloadedHub = create({
  ...options,
  resume: hub.save,
} as Parameters<typeof create>[0])
assert.equal(reloadedHub.settings.particles, false)
assert.equal(reloadedHub.music, SPECTRUM_MENU_MUSIC)
// Audio controls live inside the game but drive the shared Arcade mixer.
const audioChanges: Array<{ muted: boolean; volume: number }> = []
const musicHub = create({
  ...options,
  audio: { muted: false, volume: 0.4 },
  onAudioChange: (settings: { muted: boolean; volume: number }) => {
    audioChanges.push({ ...settings })
  },
} as Parameters<typeof create>[0])
const audioTab = emptyInput()
audioTab.pressed.y = true
musicHub.update(audioTab)
assert.equal(musicHub.menuTab, 'settings')
const down = emptyInput()
down.pressed.down = true
for (let i = 0; i < 3; i++) musicHub.update(down)
assert.equal(musicHub.optionRow, 3)
const toggleSound = emptyInput()
toggleSound.pressed.a = true
musicHub.update(toggleSound)
assert.equal(musicHub.settings.music, false)
assert.equal(musicHub.music, null, 'Music switch stops the soundtrack')
assert.equal(audioChanges.length, 0, 'Music-only preference does not mute SFX')
musicHub.update(down)
assert.equal(musicHub.optionRow, 4)
musicHub.update(toggleSound)
assert.equal(musicHub.settings.effects, false)
musicHub.update(down)
assert.equal(musicHub.optionRow, 5)
musicHub.update(toggleSound)
assert.equal(musicHub.audio.muted, true)
assert.deepEqual(audioChanges.at(-1), { muted: true, volume: 0.4 })
musicHub.update(down)
assert.equal(musicHub.optionRow, 6)
const volumeUp = emptyInput()
volumeUp.pressed.right = true
musicHub.update(volumeUp)
assert.equal(musicHub.audio.volume, 0.5)
assert.deepEqual(audioChanges.at(-1), { muted: true, volume: 0.5 })
musicHub.setAudio({ muted: false, volume: 0.7 })
assert.deepEqual(musicHub.audio, { muted: false, volume: 0.7 })
assert.equal(audioChanges.length, 2, 'External mixer updates do not echo')
const savedAudio = readSpectrumSave(musicHub.save)
assert.equal(savedAudio.settings.music, false)
assert.equal(savedAudio.settings.effects, false)
const audioReload = create({
  ...options,
  resume: savedAudio,
} as Parameters<typeof create>[0])
assert.equal(audioReload.music, null)
assert.equal(audioReload.settings.effects, false)

const deepClassic = create({
  ...options,
  resume: readSpectrumSave({ ...cloudB, mode: 'classic' }),
} as Parameters<typeof create>[0])
deepClassic.level = 35
;(deepClassic as unknown as { resetBoard: () => void }).resetBoard()
assert.equal(deepClassic.level, 35)
assert.ok(
  deepClassic.message.includes('CLASSIC'),
  'Endless Classic has no chapter limit',
)

assert.equal(SPECTRUM_THEMES.length, 6)
assert.equal(SPECTRUM_BOSS_MUSIC.length, 6)
assert.equal(SPECTRUM_CLASSIC_MUSIC.tracks.length, 3)
for (let i = 0; i < 6; i++) {
  assert.ok(SPECTRUM_BOSS_MUSIC[i]!.bpm > SPECTRUM_THEMES[i]!.bpm)
  assert.ok(
    SPECTRUM_BOSS_MUSIC[i]!.tracks.length > SPECTRUM_THEMES[i]!.tracks.length,
  )
}
const stageFiveSave = readSpectrumSave({
  ...cloudB,
  career: { ...cloudB.career, highestStage: 5 },
  stage: 5,
})
const finale = create({
  ...options,
  resume: stageFiveSave,
} as Parameters<typeof create>[0])
finale.update(start)
assert.equal(finale.music, SPECTRUM_BOSS_MUSIC[0])
for (const theme of [
  ...SPECTRUM_THEMES,
  ...SPECTRUM_BOSS_MUSIC,
  SPECTRUM_CLASSIC_MUSIC,
]) {
  assert.ok(theme.bpm >= 80 && theme.bpm <= 170)
  assert.ok(theme.tracks.length >= 2)
}
assert.equal(CHAPTER_VOICES.length, 6)
assert.equal(STORY_DECISIONS.length, 3)
assert.deepEqual(
  STORY_DECISIONS.map((scene) => scene.stage),
  [5, 15, 25],
)
assert.equal(pendingStoryDecision(5, [null, null, null]), null)
assert.equal(pendingStoryDecision(6, [null, null, null]), 0)
assert.equal(pendingStoryDecision(16, [0, null, null]), 1)
assert.equal(pendingStoryDecision(26, [0, 1, null]), 2)
assert.equal(pendingStoryDecision(6, [0, null, null]), null)
assert.equal(endingForStory([1, 1, 1]), 'wild-colors')
assert.equal(endingForStory([0, 0, 1]), 'open-city')
assert.equal(endingForStory([0, 0, 0]), 'prism-partners')
assert.equal(Object.keys(STORY_ENDINGS).length, 3)
const chapterSix = readSpectrumSave({
  ...cloudB,
  career: { ...cloudB.career, highestStage: 6 },
  stage: 6,
  storyChoices: [null, null, null],
})
const decisionRun = create({
  ...options,
  resume: chapterSix,
} as Parameters<typeof create>[0])
const openStory = emptyInput()
openStory.pressed.a = true
decisionRun.update(openStory)
assert.equal(decisionRun.menuOpen, false)
assert.equal(decisionRun.pendingChoice, 0)
assert.equal(decisionRun.shot, null, 'The decision pauses shooter input')
const selectLantern = emptyInput()
selectLantern.pressed.right = true
decisionRun.update(selectLantern)
assert.equal(decisionRun.choiceCursor, 1)
decisionRun.update(openStory)
assert.equal(decisionRun.pendingChoice, null)
assert.deepEqual(decisionRun.save.storyChoices, [1, null, null])
assert.equal(decisionRun.power, 'prism', 'Inventive option starts a special')
const choiceReload = create({
  ...options,
  resume: decisionRun.save,
} as Parameters<typeof create>[0])
choiceReload.update(openStory)
assert.equal(
  choiceReload.pendingChoice,
  null,
  'A completed choice does not replay when returning on another device',
)
const chapterSixteen = create({
  ...options,
  resume: readSpectrumSave({
    ...decisionRun.save,
    career: { ...cloudB.career, highestStage: 16 },
    stage: 16,
  }),
} as Parameters<typeof create>[0])
chapterSixteen.update(openStory)
assert.equal(chapterSixteen.pendingChoice, 1)
chapterSixteen.update(openStory)
assert.deepEqual(chapterSixteen.save.storyChoices, [1, 0, null])
assert.equal(chapterSixteen.lives, 4, 'The community path gains a heart')
function finishBoss(run: ReturnType<typeof create>) {
  const chapter = Math.floor((run.level - 1) / 5)
  assert.ok(run.boss)
  for (let hit = 0; hit < BOSS_PATTERNS[chapter]!.targets.length; hit++) {
    const target = bossTarget(chapter, hit)
    let found = false
    for (let angle = -Math.PI + 0.18; angle <= -0.18; angle += 0.01) {
      let x = 160
      let y = 438
      let vx = Math.cos(angle) * 7
      const vy = Math.sin(angle) * 7
      let banked = false
      while (y > 40) {
        x += vx
        y += vy
        if (x < 14 || x > 306) {
          x = Math.max(14, Math.min(306, x))
          vx *= -1
          banked = true
        }
        const contact = bossContact(target, {
          x,
          y,
          hue: target.hue,
          banked,
        })
        if (contact === 'hit') {
          found = true
          run.angle = angle
          break
        }
        if (contact === 'blocked') break
      }
      if (found) break
    }
    assert.ok(found, 'Every boss core has a reachable legal shot')
    assert.equal(run.loaded, target.hue)
    run.update(openStory)
    for (let frame = 0; run.shot && frame < 400; frame++)
      run.update(emptyInput())
    assert.equal(run.shot, null)
    if (hit + 1 < BOSS_PATTERNS[chapter]!.targets.length)
      assert.equal(run.boss?.hits, hit + 1)
  }
  assert.equal(run.boss, null)
}

const replayChoiceSave = readSpectrumSave({
  ...cloudB,
  stage: 5,
  career: {
    ...cloudB.career,
    highestStage: 30,
    stars: Array.from({ length: 30 }, (_, i) => (i === 4 ? 3 : 0)),
  },
  storyChoices: [1, 1, 1],
})
const replayChoice = create({
  ...options,
  resume: replayChoiceSave,
} as Parameters<typeof create>[0])
replayChoice.menuStage = 5
replayChoice.update(openStory)
replayChoice.board = emptyBoard()
replayChoice.board[0]![0] = 'pink'
replayChoice.board[0]![1] = 'pink'
replayChoice.shot = {
  x: 36,
  y: 57,
  vx: 0,
  vy: 0,
  hue: 'pink',
  power: null,
}
replayChoice.update(emptyInput())
assert.equal(replayChoice.level, 5)
finishBoss(replayChoice)
assert.equal(replayChoice.level, 6)
assert.equal(
  replayChoice.pendingChoice,
  0,
  'Replaying a cleared decision chapter must permit a new branch',
)
assert.equal(replayChoice.choiceCursor, 1, 'Previous decision starts selected')
const revise = emptyInput()
revise.pressed.left = true
replayChoice.update(revise)
replayChoice.update(openStory)
assert.deepEqual(replayChoice.save.storyChoices, [0, 1, 1])
assert.equal(replayChoice.lives, 5, 'Replay awards the chosen chapter perk')

const finalChoiceSave = readSpectrumSave({
  ...cloudB,
  career: { ...cloudB.career, highestStage: 30 },
  stage: 30,
  storyChoices: [0, 0, 0],
  endings: [],
})
const finaleRun = create({
  ...options,
  resume: finalChoiceSave,
} as Parameters<typeof create>[0])
finaleRun.update(openStory)
finaleRun.board = emptyBoard()
finaleRun.board[0]![0] = 'pink'
finaleRun.board[0]![1] = 'pink'
finaleRun.shot = {
  x: 36,
  y: 57,
  vx: 0,
  vy: 0,
  hue: 'pink',
  power: null,
}
finaleRun.update(emptyInput())
assert.equal(finaleRun.over, false)
finishBoss(finaleRun)
assert.equal(finaleRun.over, true)
assert.equal(finaleRun.won, true)
assert.equal(finaleRun.ending, 'prism-partners')
assert.deepEqual(finaleRun.save.endings, ['prism-partners'])
assert.equal((finaleRun.save.career.stars[29] ?? 0) > 0, true)
assert.equal(validSpectrumCloudSave(finaleRun.save), true)
assert.ok(finaleRun.mastered.includes('true-spectrum'))

for (let chapter = 0; chapter < BOSS_PATTERNS.length; chapter++) {
  const stage = (chapter + 1) * 5
  const run = create({
    ...options,
    resume: readSpectrumSave({
      ...cloudB,
      career: {
        ...cloudB.career,
        highestStage: stage,
        stars: Array(30).fill(0),
      },
      stage,
      storyChoices: [0, 0, 0],
    }),
  } as Parameters<typeof create>[0])
  run.update(openStory)
  run.board = emptyBoard()
  run.board[0]![0] = 'pink'
  run.board[0]![1] = 'pink'
  run.shot = {
    x: 36,
    y: 57,
    vx: 0,
    vy: 0,
    hue: 'pink',
    power: null,
  }
  run.update(emptyInput())
  assert.equal(run.level, stage)
  assert.equal(run.save.career.stars[stage - 1], 0)
  const target = bossTarget(chapter, 0)
  assert.equal(
    bossContact(target, { ...target, x: target.x + target.radius + 14 }),
    'none',
  )
  assert.equal(
    bossContact(target, { ...target, banked: false }),
    target.bank ? 'blocked' : 'hit',
  )
  finishBoss(run)
  assert.ok((run.save.career.stars[stage - 1] ?? 0) > 0)
  assert.equal(run.won, stage === 30)
  if (stage < 30) assert.equal(run.level, stage + 1)
}

const choiceAccount = readSpectrumSave({
  ...cloudA,
  career: { ...cloudA.career, highestStage: 26 },
  stage: 26,
  storyChoices: [0, null, 1],
  endings: ['wild-colors'],
})
const choiceDevice = readSpectrumSave({
  ...cloudB,
  career: { ...cloudB.career, highestStage: 26 },
  stage: 26,
  storyChoices: [null, 1, null],
  endings: ['open-city'],
})
const choiceMerge = mergeSpectrumSaves(choiceDevice, choiceAccount)
assert.deepEqual(choiceMerge.storyChoices, [0, 1, 1])
assert.deepEqual(choiceMerge.endings, ['wild-colors', 'open-city'])
assert.equal(validSpectrumCloudSave(choiceMerge), true)
assert.equal(
  validSpectrumCloudSave({
    ...choiceMerge,
    storyChoices: [0, 7, 1],
  }),
  false,
  'A forged story decision is not accepted by account storage',
)
assert.equal(
  validSpectrumCloudSave({
    ...choiceMerge,
    endings: ['open-city', 'open-city'],
  }),
  false,
  'Duplicate ending awards are rejected',
)
assert.deepEqual(
  readSpectrumSave({ ...choiceMerge, storyChoices: [1, 'bad', 0] })
    .storyChoices,
  [1, null, 0],
)

console.log(
  'Superkate Spectrum: matching, cloud merges, music, hub and career checks passed',
)
