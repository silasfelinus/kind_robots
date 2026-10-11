<template>
  <Teleport to="body" :disabled="!locked">
    <div
      ref="stageRef"
      class="showdown-stage"
      :class="{
        'showdown-stage--locked': locked,
        'showdown-stage--fullscreen': fullscreen,
      }"
      @contextmenu="onContextMenu"
    >
      <div ref="screenRef" class="showdown-screen">
        <canvas
          ref="canvasRef"
          :width="fit.canvasWidth"
          :height="fit.canvasHeight"
          :style="{ width: canvasWidth, imageRendering: fit.rendering }"
          class="showdown-canvas"
          tabindex="0"
          aria-label="Zuzu Showdown fight"
          role="img"
        />
        <div
          v-if="store.crt && !store.reducedMotion"
          class="showdown-crt"
          :style="{ width: canvasWidth }"
        />
      </div>

      <div v-if="canFullscreen" class="showdown-bar">
        <button
          type="button"
          class="kr-btn-xs"
          :aria-pressed="fullscreen"
          title="Fullscreen (F)"
          @click="toggleFullscreen"
        >
          {{ fullscreen ? 'Exit fullscreen' : 'Fullscreen' }}
        </button>
      </div>

      <div
        v-if="touchControls"
        class="showdown-touch"
        aria-label="Touch controls"
      >
        <div
          ref="dpadRef"
          class="showdown-dpad"
          role="group"
          aria-label="Move"
          @pointerdown.prevent="onDpad"
          @pointermove.prevent="onDpad"
          @pointerup.prevent="releaseDpad"
          @pointercancel="releaseDpad"
          @lostpointercapture="releaseDpad"
        >
          <span class="showdown-dpad-knob" :style="knobStyle" />
        </div>
        <div class="showdown-buttons">
          <button
            v-for="button in touchButtons"
            :key="button.key"
            type="button"
            class="showdown-button"
            :class="button.tone"
            :aria-label="button.label"
            @pointerdown.prevent="holdButton($event, button.key)"
            @pointerup.prevent="press(button.key, false)"
            @pointercancel="press(button.key, false)"
            @lostpointercapture="press(button.key, false)"
          >
            {{ button.short }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  createArcadeSound,
  type ArcadeSound,
  type MusicLoop,
} from '~/utils/arcade/sound'
import {
  SOUNDS,
  loopFor,
  newSoundState,
  soundsFor,
  type SoundState,
} from '~/utils/zuzuShowdown/audio'
import { setGamePageLock } from '~/utils/arcade/pageLock'
import {
  fitDisplay,
  type DisplayFit,
  type RenderStyle,
} from '~/utils/arcade/display'
import { startFixedLoop, type FixedLoop } from '~/utils/arcade/loop'
import type { ButtonInput } from '~/utils/arcade/input'
import {
  P1_KEYS,
  P2_KEYS,
  SOLO_KEYS,
  createPlayerInput,
  toSimInput,
  type FightButton,
} from '~/utils/zuzuShowdown/input'
import { createMatch, step } from '~/utils/zuzuShowdown/sim'
import {
  VIEW_HEIGHT,
  VIEW_WIDTH,
  advanceCallouts,
  advanceZoom,
  applyRenderStyle,
  drawCard,
  drawMatch,
  zoomTarget,
  type Callout,
} from '~/utils/zuzuShowdown/render'
import { FIGHTERS, findFighter } from '~/utils/zuzuShowdown/fighters'
import {
  advanceSlowdown,
  advanceSparks,
  koFlash,
  koSlowdownFor,
  slowdownSteps,
  type KoSlowdown,
  type Spark,
} from '~/utils/zuzuShowdown/effects'
import {
  STAGE_ROOT,
  advanceStageFx,
  newStageFx,
  stageFile,
  stageFor,
  type LoadedStage,
  type StageFx,
  type StageManifest,
  type StageSlug,
} from '~/utils/zuzuShowdown/stages'
import {
  cpuInput,
  newCpu,
  type CpuLevel,
  type CpuState,
} from '~/utils/zuzuShowdown/cpu'
import {
  applyTrainingRules,
  drawTraining,
  dummyInput,
  logInput,
  newTraining,
  trackAdvantage,
  trainingMatch,
  type TrainingState,
} from '~/utils/zuzuShowdown/training'
import { BOSS_INTROS, introFor } from '~/utils/zuzuShowdown/matchups'
import {
  VS_SLAM_FRAMES,
  drawSelectScreen,
  drawVsScreen,
  drawWinScreen,
  vsDuration,
} from '~/utils/zuzuShowdown/screens'
import {
  advanceSelect,
  newSelect,
  selectDone,
  type SelectPress,
  type SelectState,
} from '~/utils/zuzuShowdown/select'
import {
  SPRITE_FIGHTERS,
  SPRITE_ROOT,
  SPRITE_PUPPETS,
  puppetKey,
  spriteSheetFile,
  type LoadedSprites,
  type SpriteSheet,
} from '~/utils/zuzuShowdown/sprites'
import { recolourPixels, type P2Rule } from '~/utils/zuzuShowdown/recolour'
import {
  PORTRAIT_KINDS,
  portraitFighters,
  portraitInfo,
  portraitUrl,
  type LoadedPortraits,
} from '~/utils/zuzuShowdown/portraits'
import {
  neutralInput,
  type FighterData,
  type MatchState,
} from '~/utils/zuzuShowdown/types'
import { useZuzuShowdownStore } from '~/stores/zuzuShowdownStore'
import { useArcadeStore } from '~/stores/arcadeStore'
import {
  BOSS,
  bossInput,
  newBoss,
  type BossState,
} from '~/utils/zuzuShowdown/boss'
import {
  BOSS_LAYERS,
  bossLayerUrl,
  bossPainter,
  type LoadedBossArt,
} from '~/utils/zuzuShowdown/bossArt'
import {
  ARCADE_GAME_SLUG,
  BOSS_SLUG,
  DIFFICULTY_MULTIPLIER,
  ENDINGS,
  SCORE,
  advanceInitials,
  arcadeLadder,
  fightBonus,
  initialsDone,
  initialsText,
  newArcadeScore,
  newInitials,
  rungLevel,
  scoreStep,
  type ArcadeScore,
  type InitialsEntry,
} from '~/utils/zuzuShowdown/arcade'
import {
  CONTINUE_SECONDS,
  ENDING_STILL_FRAMES,
  LADDER_FRAMES,
  drawArcadeHud,
  drawContinueScreen,
  drawEndingScreen,
  drawInitialsScreen,
  drawLadderScreen,
  endingStill,
  endingUrl,
  shippedEndings,
  type LoadedEndings,
} from '~/utils/zuzuShowdown/arcadeScreens'

type StagePhase =
  | 'title'
  | 'select'
  | 'vs'
  | 'fight'
  | 'paused'
  | 'result'
  | 'ladder'
  | 'continue'
  | 'ending'
  | 'initials'
type Direction = 'up' | 'down' | 'left' | 'right'

const RESULT_DELAY = 150

// Fighter art (t-010) per render style (t-027). Pixel art loads for every rigged fighter up front; HD
// art loads for the fighters on screen once HD is picked, and until it arrives the pixel art stands in
// (and until that arrives, a placeholder fighter).
const spriteSets: Record<
  RenderStyle,
  Partial<Record<string, LoadedSprites>>
> = { pixel: {}, hd: {} }
const spriteLoads = new Set<string>()

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
  })
}

/** Load one sheet (a fighter's, or its puppet's) into the style's set under `key`. */
async function loadSheet(style: RenderStyle, key: string, file: string) {
  const load = `${style}:${key}`
  if (spriteLoads.has(load)) return
  spriteLoads.add(load)
  try {
    const response = await fetch(`${SPRITE_ROOT}/${file}`)
    if (!response.ok) return
    const sheet = (await response.json()) as SpriteSheet
    const [image, p2] = await Promise.all([
      loadImage(`${SPRITE_ROOT}/${sheet.atlas}`),
      sheet.atlas_p2
        ? loadImage(`${SPRITE_ROOT}/${sheet.atlas_p2}`)
        : Promise.resolve(null),
    ])
    if (image) spriteSets[style][key] = { sheet, image, p2 }
    recolourP2()
  } catch {
    // Missing art is not an error: the placeholder fighter still plays, and the next ask retries.
    spriteLoads.delete(load)
  }
}

async function loadSprites(style: RenderStyle, slugs: readonly string[]) {
  const rigged: readonly string[] = SPRITE_FIGHTERS
  await Promise.all(
    slugs
      .filter((slug) => rigged.includes(slug))
      .flatMap((slug) => {
        const puppet = SPRITE_PUPPETS[slug]
        return [
          loadSheet(style, slug, spriteSheetFile(slug, style)),
          // The Siblings' toddler (t-011) comes with his sister.
          ...(puppet
            ? [
                loadSheet(
                  style,
                  puppetKey(slug),
                  spriteSheetFile(puppet, style),
                ),
              ]
            : []),
        ]
      }),
  )
}

// Portraits (t-008) per render style: small enough to load every fighter's up front, pixel first; the
// screens draw the sprite for any not yet arrived.
const portraitSets: Record<RenderStyle, LoadedPortraits> = { pixel: {}, hd: {} }
const portraitLoads = new Set<RenderStyle>()

async function loadPortraits(style: RenderStyle) {
  if (portraitLoads.has(style)) return
  portraitLoads.add(style)
  await Promise.all(
    portraitFighters().flatMap((slug) =>
      PORTRAIT_KINDS.map(async (kind) => {
        const info = portraitInfo(slug, kind)
        if (!info) return
        const image = await loadImage(portraitUrl(info, style))
        if (image) (portraitSets[style][slug] ??= {})[kind] = image
      }),
    ),
  )
}

/** The portraits to draw: the style's where they have loaded, pixel ones where they haven't. */
function activePortraits(): LoadedPortraits {
  if (store.renderStyle === 'pixel') return portraitSets.pixel
  const out: LoadedPortraits = {}
  for (const slug of portraitFighters())
    out[slug] = {
      ...portraitSets.pixel[slug],
      ...portraitSets[store.renderStyle][slug],
    }
  return out
}

/** P2's colours made from the atlas by the sheet's rules (HD ships no P2 atlas). */
function recolouredAtlas(
  image: HTMLImageElement,
  rules: P2Rule[],
): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const g = canvas.getContext('2d', { willReadFrequently: true })
  if (!g) return null
  g.drawImage(image, 0, 0)
  const pixels = g.getImageData(0, 0, canvas.width, canvas.height)
  recolourPixels(pixels.data, rules)
  g.putImageData(pixels, 0, 0)
  return canvas
}

/** In a mirror match, give the loaded HD art its P2 colours (once, off the frame that asked). */
function recolourP2() {
  if (roster[0].slug !== roster[1].slug) return
  for (const key of [roster[1].slug, puppetKey(roster[1].slug)]) {
    const set = spriteSets.hd[key]
    const rules = set?.sheet.p2_rules
    if (!set || set.p2 || !rules?.length) continue
    if (!(set.image instanceof HTMLImageElement)) continue
    const image = set.image
    window.setTimeout(() => {
      if (!set.p2) set.p2 = recolouredAtlas(image, rules)
    }, 0)
  }
}

/** The art to draw: the style's where it has loaded, pixel art where it hasn't. */
function activeSprites(): Partial<Record<string, LoadedSprites>> {
  if (store.renderStyle === 'pixel') return spriteSets.pixel
  const mirror = roster[0].slug === roster[1].slug
  const out = { ...spriteSets.pixel }
  for (const [slug, set] of Object.entries(spriteSets.hd)) {
    // A mirror match waits for P2's colours rather than show two fighters dressed alike.
    if (set && (!mirror || set.p2)) out[slug] = set
  }
  return out
}

// The stage's art (t-009), loaded for the current roster's home stage; the placeholder stage draws until
// it arrives, and if it never does.
// One slot per render style: HD's draws once it has loaded, the pixel stage until then.
const stageSlots: Record<
  RenderStyle,
  { slug: StageSlug | null; stage: LoadedStage | null }
> = {
  pixel: { slug: null, stage: null },
  hd: { slug: null, stage: null },
}
let stageFx: StageFx = newStageFx()

function currentStage(): LoadedStage | null {
  const slug = stageFor(roster)
  for (const style of [store.renderStyle, 'pixel'] as const) {
    const loaded = stageSlots[style].stage
    if (loaded && loaded.manifest.stage === slug) return loaded
  }
  return null
}

async function loadStage(slug: StageSlug, style: RenderStyle) {
  const slot = stageSlots[style]
  if (slot.slug === slug) return
  slot.slug = slug
  slot.stage = null
  try {
    const response = await fetch(`${STAGE_ROOT}/${stageFile(slug, style)}`)
    if (!response.ok) throw new Error(`stage ${slug}: ${response.status}`)
    const manifest = (await response.json()) as StageManifest
    const [layers, cutouts] = await Promise.all([
      Promise.all(
        manifest.layers.map(
          async (l) =>
            [l.name, await loadImage(`${STAGE_ROOT}/${l.file}`)] as const,
        ),
      ),
      Promise.all(
        manifest.cutouts.map(
          async (c) =>
            [c.name, await loadImage(`${STAGE_ROOT}/${c.file}`)] as const,
        ),
      ),
    ])
    // A roster change while this loaded wins.
    if (slot.slug !== slug) return
    const pick = (
      pairs: ReadonlyArray<readonly [string, HTMLImageElement | null]>,
    ) =>
      Object.fromEntries(pairs.filter((pair) => pair[1] !== null)) as Record<
        string,
        HTMLImageElement
      >
    slot.stage = { manifest, layers: pick(layers), cutouts: pick(cutouts) }
  } catch {
    // Missing art is not an error: the placeholder stage still plays, and the next roster change
    // tries again.
    if (slot.slug === slug) slot.slug = null
  }
}

/** Load what the current roster and render style draw with. */
function loadArt() {
  const slug = stageFor(roster)
  void loadStage(slug, 'pixel')
  void loadPortraits('pixel')
  if (store.renderStyle !== 'pixel') {
    void loadPortraits(store.renderStyle)
    void loadStage(slug, store.renderStyle)
    void loadSprites(store.renderStyle, [roster[0].slug, roster[1].slug])
    recolourP2()
  }
}

const store = useZuzuShowdownStore()

function currentRoster(): [FighterData, FighterData] {
  return [findFighter(store.fighters[0]), findFighter(store.fighters[1])]
}

let roster = currentRoster()

const stageRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const fullscreen = ref(false)
const canFullscreen = ref(false)
const screenRef = ref<HTMLElement | null>(null)
const dpadRef = ref<HTMLElement | null>(null)
const canvasWidth = ref('100%')
const fit = ref<DisplayFit>(
  fitDisplay({
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
    available: VIEW_WIDTH,
    dpr: 1,
    style: 'pixel',
  }),
)
const phase = ref<StagePhase>('title')
const touchControls = ref(false)
const dpadHeld = ref<Record<Direction, boolean>>({
  up: false,
  down: false,
  left: false,
  right: false,
})

const touchButtons: Array<{
  key: FightButton
  short: string
  label: string
  tone: string
}> = [
  { key: 'lp', short: 'LP', label: 'Light punch', tone: 'is-punch' },
  { key: 'hp', short: 'HP', label: 'Heavy punch', tone: 'is-punch' },
  { key: 'special', short: 'SP', label: 'Special', tone: 'is-special' },
  { key: 'lk', short: 'LK', label: 'Light kick', tone: 'is-kick' },
  { key: 'hk', short: 'HK', label: 'Heavy kick', tone: 'is-kick' },
  { key: 'dodge', short: 'D', label: 'Dodge', tone: 'is-dodge' },
  { key: 'start', short: '❚❚', label: 'Pause', tone: 'is-start' },
]

let match: MatchState = createMatch(roster)
let callouts: Callout[] = []
// The camera's zoom (render.ts zoomTarget): close in on the fight, back out as the fighters part or leap.
let zoom = 1
let sparks: Spark[] = []
// The finishing blow's slow-down and flash (t-019).
let slowdown: KoSlowdown = null
// The CPU opponent (t-020) plays P2 in CPU mode, seeded fresh for each match.
let cpu: CpuState = newCpu('normal', 1)
// Training (t-022): the dummy's state and the readouts, in Training dummy mode.
let training: TrainingState = newTraining()
let resultCountdown = 0
// Frames into the VS screen, or into the win screen.
let screenFrame = 0
// The character select grid (t-019), and whether the roster change it makes goes straight to the VS screen.
let select: SelectState = newSelect([], ['', ''])
let selectedToVs = false
// Arcade (t-021): the climb under way, its score, and the initials being entered at its end.
type ArcadeRun = {
  player: string
  ladder: string[]
  rung: number
  start: CpuLevel
  score: ArcadeScore
  cleared: boolean
}
let arcade: ArcadeRun | null = null
let initials: InitialsEntry = newInitials()
const endingSets: Record<RenderStyle, LoadedEndings> = { pixel: {}, hd: {} }
// The Thing Behind the Door (t-021): its AI, and its layers per render style.
let boss: BossState = newBoss(1)
const bossSets: Record<RenderStyle, LoadedBossArt> = { pixel: {}, hd: {} }
const bossLoads = new Set<RenderStyle>()
const painters = {
  [BOSS_SLUG]: bossPainter(BOSS, () => ({
    ...bossSets.pixel,
    ...bossSets[store.renderStyle],
  })),
}

function loadBossArt(style: RenderStyle) {
  if (bossLoads.has(style)) return
  bossLoads.add(style)
  for (const name of BOSS_LAYERS)
    void loadImage(bossLayerUrl(name, style)).then((image) => {
      if (image) bossSets[style][name] = image
    })
}

function bossFight(): boolean {
  return roster[1].slug === BOSS_SLUG
}
const arcadeStore = useArcadeStore()
let loop: FixedLoop | null = null
let sound: ArcadeSound | null = null
let soundState: SoundState = newSoundState()
let musicLoop: MusicLoop | null = null
let resizer: ResizeObserver | null = null
let dpadPointer: number | null = null

const p1: ButtonInput<FightButton> = createPlayerInput(SOLO_KEYS, 0)
const p2: ButtonInput<FightButton> = createPlayerInput(P2_KEYS, 1)

const locked = computed(
  () =>
    touchControls.value &&
    (phase.value === 'fight' || phase.value === 'paused'),
)

const knobStyle = computed(() => {
  const held = dpadHeld.value
  const x = (held.right ? 1 : 0) - (held.left ? 1 : 0)
  const y = (held.down ? 1 : 0) - (held.up ? 1 : 0)
  return { transform: `translate(${x * 28}%, ${y * 28}%)` }
})

function applyKeyMaps() {
  p1.setKeyMap(store.mode === 'versus' ? P1_KEYS : SOLO_KEYS)
}

/** The character select grid, its cursors on the current fighters. */
function openSelect() {
  select = newSelect(
    FIGHTERS.map((f) => f.slug),
    [roster[0].slug, roster[1].slug],
  )
  phase.value = 'select'
}

/** Both picked: the roster takes them (its watcher reloads the art) and the VS screen opens. */
function confirmSelect() {
  const picks: [string, string] = [
    FIGHTERS[select.cursor[0]]!.slug,
    FIGHTERS[select.cursor[1]]!.slug,
  ]
  if (picks[0] === roster[0].slug && picks[1] === roster[1].slug) {
    startVs()
    return
  }
  selectedToVs = true
  store.setFighter(0, picks[0])
  store.setFighter(1, picks[1])
}

function selectPress(
  pressed: Partial<Record<FightButton, boolean>>,
): SelectPress {
  return {
    up: pressed.up,
    down: pressed.down,
    left: pressed.left,
    right: pressed.right,
    lp: pressed.lp,
    hp: pressed.hp,
    start: pressed.start,
  }
}

/** Arcade: a new climb for `player`, from the CPU level picked on the page. */
function startArcade(player: string) {
  arcade = {
    player,
    ladder: arcadeLadder(
      player,
      FIGHTERS.map((f) => f.slug),
      Math.floor(Math.random() * 0xffffffff),
    ),
    rung: 0,
    start: store.cpuLevel,
    score: newArcadeScore(),
    cleared: false,
  }
  openLadder()
}

/** The climb so far, before the next fight (or, at the top, the ending). */
function openLadder() {
  if (!arcade) return
  if (arcade.rung > arcade.ladder.length) {
    arcade.cleared = true
    startEnding()
    return
  }
  const atDoor = arcade.rung === arcade.ladder.length
  roster = [
    findFighter(arcade.player),
    atDoor ? BOSS : findFighter(arcade.ladder[arcade.rung]!),
  ]
  if (atDoor) {
    loadBossArt('pixel')
    loadBossArt(store.renderStyle)
  }
  match = createMatch(roster)
  zoom = zoomTarget(match, roster)
  loadArt()
  screenFrame = 0
  phase.value = 'ladder'
}

/** After a fight's win screen: up the ladder on a win, the continue countdown on anything else. */
function finishArcadeFight() {
  if (!arcade) return
  if (match.winner === 0) {
    arcade.score = fightBonus(
      arcade.score,
      arcade.rung,
      DIFFICULTY_MULTIPLIER[arcade.start],
    )
    if (bossFight())
      arcade.score.total += SCORE.boss * DIFFICULTY_MULTIPLIER[arcade.start]
    arcade.rung += 1
    openLadder()
    return
  }
  screenFrame = 0
  phase.value = 'continue'
}

/** The ending: the fighter's stills, loading in the background while the first fades in. */
function startEnding() {
  if (!arcade) return
  const shipped = shippedEndings()
  for (const style of ['pixel', store.renderStyle] as const) {
    for (const { file: still } of ENDINGS[arcade.player] ?? []) {
      if (!shipped.includes(still) || endingSets[style][still]) continue
      void loadImage(endingUrl(still, style)).then((image) => {
        if (image) endingSets[style][still] = image
      })
    }
  }
  screenFrame = 0
  phase.value = 'ending'
}

function activeEndings(): LoadedEndings {
  return { ...endingSets.pixel, ...endingSets[store.renderStyle] }
}

/** The run is over: initials for a score worth keeping, the title otherwise. */
function endArcadeRun() {
  if (arcade && arcade.score.total > 0) {
    initials = newInitials(arcadeStore.savedInitials)
    screenFrame = 0
    phase.value = 'initials'
    return
  }
  arcade = null
  phase.value = 'title'
}

function submitArcadeScore() {
  if (!arcade) return
  const name = initialsText(initials)
  arcadeStore.rememberInitials(name)
  void arcadeStore.submitScore({
    game: ARCADE_GAME_SLUG,
    initials: name,
    score: Math.floor(arcade.score.total),
    level: Math.max(1, arcade.score.fights),
  })
  arcade = null
  phase.value = 'title'
}

/** The VS screen: the fighters slam in and trade their matchup lines, then the fight starts. */
function startVs() {
  // Training goes straight to the fight, and so does the door (it has no portrait to slam in).
  if (store.mode === 'dummy' || bossFight()) {
    startMatch()
    return
  }
  screenFrame = 0
  phase.value = 'vs'
}

function startMatch() {
  match =
    store.mode === 'dummy'
      ? trainingMatch(roster, store.reset.place)
      : createMatch(roster)
  training = newTraining(Math.floor(Math.random() * 0xffffffff))
  callouts = advanceCallouts([], match.events)
  sparks = []
  slowdown = null
  zoom = zoomTarget(match, roster)
  stageFx = advanceStageFx(newStageFx(), match.events)
  const level = arcade
    ? rungLevel(arcade.start, arcade.rung, arcade.ladder.length)
    : store.cpuLevel
  cpu = newCpu(level, Math.floor(Math.random() * 0xffffffff))
  boss = newBoss(Math.floor(Math.random() * 0xffffffff))
  resultCountdown = RESULT_DELAY
  phase.value = 'fight'
  // The round's opening sounds (the Hollow Bell toll) come from the new match's own events.
  soundState = newSoundState()
  playSounds()
}

/** This frame's sounds (t-023): hits by strength, blocks, whiffs, the KO sting, the bell ... */
function playSounds() {
  const out = soundsFor(soundState, match, roster, stageFor(roster))
  soundState = out.state
  if (!sound) return
  for (const name of out.sounds) sound.playNotes(SOUNDS[name])
}

/** The music follows the fight: the stage's loop while it's on, silence everywhere else. */
function syncMusic() {
  if (!sound) return
  if (phase.value === 'fight') {
    const loop = loopFor(stageFor(roster))
    if (musicLoop !== loop) {
      musicLoop = loop
      sound.startMusic(loop)
    }
  } else if (musicLoop) {
    musicLoop = null
    sound.stopMusic()
  }
}

/** Browsers start audio only after a gesture: the first key or press anywhere unlocks it. */
function unlockSound() {
  sound?.unlock()
}

function tick() {
  const one = p1.poll()
  const two = p2.poll()
  const start = one.pressed.start || two.pressed.start
  if (phase.value === 'title') {
    screenFrame += 1
    if (start || one.pressed.lp) openSelect()
    return
  }
  if (phase.value === 'result') {
    // A rematch: the same fighters, straight to the VS screen. In Arcade, the climb goes on.
    screenFrame += 1
    if (arcade) {
      if ((start || one.pressed.lp) && screenFrame > 30) finishArcadeFight()
      else if (screenFrame >= 300) finishArcadeFight()
      return
    }
    if (start || one.pressed.lp) startVs()
    return
  }
  if (phase.value === 'ladder') {
    screenFrame += 1
    const skip = (start || one.pressed.lp) && screenFrame > 20
    if (skip || screenFrame >= LADDER_FRAMES) startVs()
    return
  }
  if (phase.value === 'continue') {
    screenFrame += 1
    if (arcade && (start || one.pressed.lp)) {
      arcade.score = newArcadeScore()
      startVs()
    } else if (screenFrame >= (CONTINUE_SECONDS + 1) * 60) endArcadeRun()
    return
  }
  if (phase.value === 'ending') {
    screenFrame += 1
    if ((start || one.pressed.lp) && screenFrame > 20)
      screenFrame = (endingStill(screenFrame) + 1) * ENDING_STILL_FRAMES
    if (endingStill(screenFrame) >= 2) endArcadeRun()
    return
  }
  if (phase.value === 'initials') {
    screenFrame += 1
    initials = advanceInitials(initials, selectPress(one.pressed))
    if (initialsDone(initials)) submitArcadeScore()
    return
  }
  if (phase.value === 'select') {
    const nothingPicked = !select.picked[0] && !select.picked[1]
    if (one.pressed.hp && nothingPicked) {
      phase.value = 'title'
      return
    }
    select = advanceSelect(
      select,
      [selectPress(one.pressed), selectPress(two.pressed)],
      FIGHTERS.length,
      store.mode === 'versus',
    )
    if (store.mode === 'arcade' && select.picked[0]) {
      startArcade(FIGHTERS[select.cursor[0]]!.slug)
      return
    }
    if (selectDone(select)) confirmSelect()
    return
  }
  if (phase.value === 'vs') {
    screenFrame += 1
    const lines = introFor(roster[0].slug, roster[1].slug).length
    const skip = (start || one.pressed.lp) && screenFrame > VS_SLAM_FRAMES
    if (skip || screenFrame >= vsDuration(lines)) startMatch()
    return
  }
  if (phase.value === 'paused') {
    if (start) phase.value = 'fight'
    return
  }
  if (start) {
    phase.value = 'paused'
    return
  }
  // After a KO the match plays slowed: the sim steps only every few screen frames.
  const stepping = slowdownSteps(slowdown)
  slowdown = advanceSlowdown(slowdown)
  if (!stepping) return
  const first = toSimInput(one.held)
  let second = neutralInput()
  if (store.mode === 'versus') second = toSimInput(two.held)
  else if (bossFight()) {
    const turn = bossInput(boss, match, 1)
    boss = turn.boss
    second = turn.input
  } else if (store.mode === 'cpu' || arcade) {
    const turn = cpuInput(cpu, match, 1, roster)
    cpu = turn.cpu
    second = turn.input
  } else {
    const turn = dummyInput(training, store.dummy, match, 1, roster)
    training = turn.training
    second = turn.input
  }
  if (!store.easySpecials) {
    first.special = false
    // The door fights only with its Easy Specials.
    if (!bossFight()) second.special = false
  }
  match = step(match, [first, second], roster)
  if (arcade)
    arcade.score = scoreStep(
      arcade.score,
      match.events,
      match,
      0,
      roster[0].health,
      DIFFICULTY_MULTIPLIER[arcade.start],
    )
  if (store.mode === 'dummy') {
    applyTrainingRules(match, roster, {
      infiniteMeter: store.infiniteMeter,
      infiniteHealth: store.infiniteHealth,
    })
    training = trackAdvantage(training, match)
    training.inputs = logInput(
      training.inputs,
      first,
      match.fighters[0].facing,
      match.events,
    )
  }
  callouts = advanceCallouts(callouts, match.events)
  sparks = advanceSparks(sparks, match, roster)
  stageFx = advanceStageFx(stageFx, match.events)
  zoom = advanceZoom(zoom, zoomTarget(match, roster), store.reducedMotion)
  playSounds()
  slowdown = slowdown ?? koSlowdownFor(match.events)
  if (match.phase === 'over') {
    resultCountdown -= 1
    if (resultCountdown <= 0) {
      screenFrame = 0
      phase.value = 'result'
    }
  }
}

function render() {
  const g = canvasRef.value?.getContext('2d')
  if (!g) return
  // The game draws in its 480x270 units; the fit's scale maps them onto the canvas (t-027).
  const scale = fit.value.scale
  g.setTransform(scale, 0, 0, scale, 0, 0)
  applyRenderStyle(g, store.renderStyle)
  const sprites = activeSprites()
  const sides = [sprites[roster[0].slug], sprites[roster[1].slug]] as const
  const portraits = activePortraits()
  if (phase.value === 'select') {
    drawSelectScreen(
      g,
      FIGHTERS,
      sprites,
      select,
      store.reducedMotion,
      store.mode === 'versus',
      store.mode === 'versus' ? '2P' : store.mode === 'dummy' ? 'DUMMY' : 'CPU',
      portraits,
    )
    return
  }
  if (phase.value === 'ladder' && arcade) {
    drawLadderScreen(
      g,
      roster[0],
      arcade.ladder.map(findFighter),
      arcade.rung,
      arcade.score,
      portraits,
      screenFrame,
      store.reducedMotion,
      arcade.rung === arcade.ladder.length
        ? BOSS_INTROS[arcade.player]
        : undefined,
    )
    return
  }
  if (phase.value === 'ending' && arcade) {
    drawEndingScreen(
      g,
      findFighter(arcade.player),
      activeEndings(),
      portraits,
      screenFrame,
      store.reducedMotion,
    )
    return
  }
  if (phase.value === 'initials' && arcade) {
    drawInitialsScreen(
      g,
      arcade.score,
      initials,
      arcade.cleared,
      screenFrame,
      store.reducedMotion,
    )
    return
  }
  if (phase.value === 'vs') {
    drawVsScreen(
      g,
      roster,
      [...sides],
      screenFrame,
      store.reducedMotion,
      portraits,
    )
    return
  }
  drawMatch(g, match, roster, callouts, {
    showBoxes: store.showBoxes,
    reducedMotion: store.reducedMotion,
    sprites,
    sparks,
    stage: currentStage() ?? undefined,
    stageFx,
    style: store.renderStyle,
    zoom,
    painters,
  })
  if (
    store.mode === 'dummy' &&
    (phase.value === 'fight' || phase.value === 'paused')
  )
    drawTraining(g, training, VIEW_WIDTH)
  if (arcade && phase.value !== 'title')
    drawArcadeHud(g, arcade.score, arcade.rung, arcade.ladder.length + 1)
  const flash = koFlash(slowdown, store.reducedMotion)
  if (flash > 0) {
    g.fillStyle = `rgba(255, 255, 255, ${(0.7 * flash).toFixed(2)})`
    g.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)
  }
  if (phase.value === 'title') {
    drawCard(g, [
      { text: 'ZUZU SHOWDOWN', scale: 3, color: '#fdba74' },
      {
        text: `${roster[0].name} VS ${roster[1].name}`.toUpperCase(),
        color: '#fde68a',
      },
      {
        text:
          store.mode === 'versus'
            ? '2 PLAYERS'
            : store.mode === 'cpu'
              ? `P1 VS CPU (${store.cpuLevel.toUpperCase()})`
              : store.mode === 'arcade'
                ? `ARCADE (${store.cpuLevel.toUpperCase()})`
                : 'P1 VS TRAINING DUMMY',
      },
      { text: 'PRESS START OR LP', scale: 2, color: '#fde047' },
    ])
  } else if (phase.value === 'continue' && arcade) {
    drawContinueScreen(g, arcade.score, screenFrame)
  } else if (phase.value === 'paused') {
    drawCard(g, [
      { text: 'PAUSED', scale: 3 },
      { text: 'PRESS START', color: '#fde047' },
    ])
  } else if (phase.value === 'result' && bossFight()) {
    drawCard(
      g,
      match.winner === 0
        ? [
            { text: 'THE DOOR IS SHUT', scale: 3, color: '#86efac' },
            { text: 'THE THIN PLACE GOES QUIET', color: '#e9d5ff' },
          ]
        : [
            { text: 'THE DOOR STAYS OPEN', scale: 3, color: '#c084fc' },
            { text: 'SOMETHING WATCHES FROM IT', color: '#e9d5ff' },
          ],
    )
  } else if (phase.value === 'result') {
    drawWinScreen(
      g,
      match,
      roster,
      [...sides],
      screenFrame,
      store.reducedMotion,
      portraits,
    )
  }
}

function press(button: FightButton, down: boolean) {
  if (down) sound?.unlock()
  p1.setTouch(button, down)
}

function capture(target: HTMLElement | null, pointerId: number) {
  try {
    target?.setPointerCapture?.(pointerId)
  } catch {
    return
  }
}

function holdButton(event: PointerEvent, button: FightButton) {
  capture(event.currentTarget as HTMLElement | null, event.pointerId)
  press(button, true)
}

const DPAD_DEAD_ZONE = 0.22

function onDpad(event: PointerEvent) {
  const pad = dpadRef.value
  if (!pad) return
  if (event.type === 'pointerdown') {
    dpadPointer = event.pointerId
    capture(pad, event.pointerId)
  } else if (event.pointerId !== dpadPointer) {
    return
  }
  const rect = pad.getBoundingClientRect()
  const dx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
  const dy = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
  const next = { up: false, down: false, left: false, right: false }
  if (Math.hypot(dx, dy) > DPAD_DEAD_ZONE) {
    const sector = Math.round(Math.atan2(dy, dx) / (Math.PI / 4))
    next.right = sector >= -1 && sector <= 1
    next.left = sector >= 3 || sector <= -3
    next.down = sector >= 1 && sector <= 3
    next.up = sector >= -3 && sector <= -1
  }
  setDpad(next)
}

function releaseDpad() {
  dpadPointer = null
  setDpad({ up: false, down: false, left: false, right: false })
}

function setDpad(next: Record<Direction, boolean>) {
  for (const button of ['up', 'down', 'left', 'right'] as const) {
    if (next[button] !== dpadHeld.value[button]) press(button, next[button])
  }
  dpadHeld.value = next
}

function onContextMenu(event: Event) {
  if (touchControls.value) event.preventDefault()
}

let pageLocked = false

/** No page scroll or zoom while a touch game runs (see utils/arcade/pageLock). */
function setPageLock(on: boolean) {
  if (on === pageLocked) return
  pageLocked = on
  setGamePageLock(on)
}

/** Size the canvas for its box, the screen's pixel ratio and the render style (utils/arcade/display). */
function fitCanvas() {
  const box = screenRef.value
  let available = box?.clientWidth ?? VIEW_WIDTH
  // Fullscreen, the screen has the height left over too: the widest 16:9 that fits both.
  if (fullscreen.value && box && box.clientHeight > 0)
    available = Math.min(
      available,
      Math.floor((box.clientHeight * VIEW_WIDTH) / VIEW_HEIGHT),
    )
  fit.value = fitDisplay({
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
    available,
    dpr: window.devicePixelRatio || 1,
    style: store.renderStyle,
  })
  canvasWidth.value = `${fit.value.cssWidth}px`
}

function onBlur() {
  if (phase.value === 'fight') phase.value = 'paused'
}

/** Training: R puts the fighters back where the last reset did. F toggles fullscreen. */
function onTrainingKey(event: KeyboardEvent) {
  if (event.repeat) return
  const target = event.target as HTMLElement | null
  if (target?.closest?.('input, select, textarea')) return
  if (event.code === 'KeyF' && canFullscreen.value) {
    void toggleFullscreen()
    return
  }
  if (event.code !== 'KeyR' || store.mode !== 'dummy') return
  store.resetPositions(store.reset.place)
}

/** Fullscreen, as the arcade cabinets have it: the fight fills the screen, Esc or F to leave. */
async function toggleFullscreen() {
  const el = stageRef.value
  if (!el) return
  try {
    if (document.fullscreenElement === el) await document.exitFullscreen()
    else if (!document.fullscreenElement) await el.requestFullscreen()
  } catch {
    syncFullscreen()
  }
}

function syncFullscreen() {
  fullscreen.value =
    !!stageRef.value && document.fullscreenElement === stageRef.value
  void nextTick(fitCanvas)
}

watch(locked, (on) => {
  setPageLock(on)
  if (!on) releaseDpad()
})

watch(
  () => store.mode,
  () => {
    applyKeyMaps()
    if (arcade) {
      arcade = null
      phase.value = 'title'
    }
  },
)
// Training's position reset: the fighters go back to the centre or a corner, the readouts clear.
watch(
  () => store.reset.count,
  () => {
    if (store.mode !== 'dummy') return
    if (phase.value !== 'fight' && phase.value !== 'paused') return
    match = trainingMatch(roster, store.reset.place)
    training = { ...newTraining(training.seed), inputs: training.inputs }
    callouts = []
    sparks = []
    slowdown = null
  },
)
watch(
  () => [...store.fighters],
  () => {
    roster = currentRoster()
    match = createMatch(roster)
    zoom = zoomTarget(match, roster)
    callouts = []
    sparks = []
    slowdown = null
    stageFx = newStageFx()
    loadArt()
    if (selectedToVs) {
      selectedToVs = false
      startVs()
    } else phase.value = 'title'
  },
)
watch(
  () => store.renderStyle,
  () => {
    fitCanvas()
    loadArt()
  },
)
watch(
  () => store.muted,
  (muted) => sound?.setMuted(muted),
)
watch(phase, syncMusic)

onMounted(() => {
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false
  const reduced =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  touchControls.value = coarse
  canFullscreen.value = !!document.fullscreenEnabled
  document.addEventListener('fullscreenchange', syncFullscreen)
  zoom = zoomTarget(match, roster)
  store.loadPreferences({ reducedMotion: reduced, coarsePointer: coarse })
  applyKeyMaps()
  sound = createArcadeSound(store.muted)
  p1.attach(window)
  p2.attach(window)
  window.addEventListener('blur', onBlur)
  window.addEventListener('keydown', onTrainingKey)
  window.addEventListener('keydown', unlockSound)
  window.addEventListener('pointerdown', unlockSound)
  fitCanvas()
  if (screenRef.value && typeof ResizeObserver !== 'undefined') {
    resizer = new ResizeObserver(fitCanvas)
    resizer.observe(screenRef.value)
  }
  loop = startFixedLoop(tick, render)
  void loadSprites('pixel', SPRITE_FIGHTERS)
  loadArt()
})

onBeforeUnmount(() => {
  loop?.stop()
  resizer?.disconnect()
  p1.detach()
  p2.detach()
  window.removeEventListener('blur', onBlur)
  window.removeEventListener('keydown', onTrainingKey)
  window.removeEventListener('keydown', unlockSound)
  window.removeEventListener('pointerdown', unlockSound)
  sound?.dispose()
  setPageLock(false)
  document.removeEventListener('fullscreenchange', syncFullscreen)
  if (stageRef.value && document.fullscreenElement === stageRef.value)
    void document.exitFullscreen()
})
</script>

<style scoped>
.showdown-stage {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

.showdown-stage--locked {
  position: fixed;
  inset: 0;
  z-index: 100;
  justify-content: center;
  padding: 0.5rem;
  background: #0b0507;
  touch-action: none;
  overscroll-behavior: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.showdown-screen {
  position: relative;
  display: flex;
  justify-content: center;
  width: 100%;
}

.showdown-bar {
  display: flex;
  justify-content: flex-end;
}

/* Fullscreen: the fight takes the whole screen, centred on black, the bar and any touch controls
   below it. */
.showdown-stage--fullscreen {
  width: 100%;
  height: 100%;
  justify-content: center;
  padding: 0.5rem;
  background: #000;
}

.showdown-stage--fullscreen .showdown-screen {
  flex: 1;
  min-height: 0;
  align-items: center;
}

.showdown-stage--fullscreen .showdown-canvas,
.showdown-stage--fullscreen .showdown-crt {
  border-radius: 0;
}

/* The canvas is centred in the tall screen, so its scanlines centre with it. */
.showdown-stage--fullscreen .showdown-crt {
  top: 50%;
  transform: translateY(-50%);
}

.showdown-canvas {
  display: block;
  max-width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  border-radius: 0.75rem;
  background: #000;
  outline: none;
}

.showdown-crt {
  position: absolute;
  top: 0;
  max-width: 100%;
  aspect-ratio: 16 / 9;
  pointer-events: none;
  border-radius: 0.75rem;
  background: repeating-linear-gradient(
    to bottom,
    rgb(0 0 0 / 0.18) 0,
    rgb(0 0 0 / 0.18) 1px,
    transparent 1px,
    transparent 3px
  );
}

.showdown-touch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0 0.25rem;
}

.showdown-dpad {
  position: relative;
  width: 8.5rem;
  height: 8.5rem;
  flex-shrink: 0;
  border-radius: 9999px;
  background: rgb(255 255 255 / 0.08);
  border: 2px solid rgb(255 255 255 / 0.2);
  touch-action: none;
}

.showdown-dpad-knob {
  position: absolute;
  inset: 30%;
  border-radius: 9999px;
  background: rgb(253 186 116 / 0.85);
  transition: transform 60ms linear;
}

.showdown-buttons {
  display: grid;
  grid-template-columns: repeat(3, 3.4rem);
  gap: 0.5rem;
}

.showdown-button {
  width: 3.4rem;
  height: 3.4rem;
  border-radius: 9999px;
  font-weight: 800;
  font-size: 0.85rem;
  color: #fff;
  touch-action: none;
  border: 2px solid rgb(255 255 255 / 0.35);
}

.showdown-button.is-punch {
  background: #c2410c;
}

.showdown-button.is-kick {
  background: #0f766e;
}

.showdown-button.is-special {
  background: #7e22ce;
}

.showdown-button.is-dodge {
  background: #334155;
}

.showdown-button.is-start {
  background: #1f2937;
}
</style>
