// The Last Bell's DMD and sound polish (conductor zuzu-pinball/t-012): its
// own attract pages (its name, the River Croc's jaws, the high score
// counting up) instead of Kind Pinball's, a game over that says so when the
// score is a new high, and music that ducks under every callout so a
// jackpot or a Death Roll is heard over the bed.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import RAPIER from '@dimforge/rapier3d-compat'
import { mulberry32 } from '../arcade/curve'
import { PINBALL_CUES } from '../arcade/pinball/audio/catalog'
import { DUCK_DEPTH, PinballMixer } from '../arcade/pinball/audio/mixer'
import { Dmd, DMD_COLS } from '../arcade/pinball/dmd'
import { DMD_SCENES, type DmdShowing } from '../arcade/pinball/dmdQueue'
import {
  ATTRACT_PAGE_MS,
  attractPages,
  beatsHighScore,
  drawDmd,
  fitScale,
  formatScore,
  HIGH_SCORE_COUNT_MS,
  KIND_PINBALL_PAGES,
  type DmdIdle,
} from '../arcade/pinball/dmdScenes'
import type { RendererLike } from '../arcade/pinball/render/scene'
import { PinballRuntime } from '../arcade/pinball/runtime'
import { ZUZU_RULESET } from '../arcade/pinball/tables/zuzuLastBell/rules'
import { ZUZU_LAST_BELL_GREYBOX as table } from '../arcade/pinball/tables/zuzuLastBell/table'
import { emptyInput } from '../arcade/types'

await RAPIER.init()

const pages = table.attract!
assert.ok(pages, 'the Last Bell names itself on the DMD')
assert.equal(pages.picture, 'jaws')

/** Whether every dot `text` lights (as the scenes draw it) is lit in `dmd`. */
function shows(
  dmd: Dmd,
  text: string,
  y: number,
  options: { max?: number; small?: boolean } = {},
) {
  const ref = new Dmd()
  const scale = options.small
    ? 1
    : fitScale(text, DMD_COLS - 4, options.max ?? 2)
  ref.text(text, DMD_COLS / 2, y, {
    scale,
    bold: scale > 1,
    align: 'center',
  })
  let lit = 0
  for (let x = 0; x < DMD_COLS; x++)
    for (let row = 0; row < 32; row++) {
      if (!ref.get(x, row)) continue
      lit++
      if (!dmd.get(x, row)) return false
    }
  return lit > 0
}
const litDots = (dmd: Dmd) => {
  let n = 0
  for (let x = 0; x < DMD_COLS; x++)
    for (let row = 0; row < 32; row++) if (dmd.get(x, row)) n++
  return n
}
const attract = (idle: Partial<DmdIdle>, now: number) => {
  const dmd = new Dmd()
  drawDmd(
    dmd,
    null,
    { score: 0, ball: 1, multiplier: 1, attract: true, ...idle },
    now,
  )
  return dmd
}
const at = (page: number, t: number) => page * ATTRACT_PAGE_MS + t

// The page order: a picture page only for a table that has one.
assert.deepEqual(
  [...attractPages(pages)],
  ['title', 'name', 'picture', 'high-score', 'start'],
)
assert.deepEqual(
  [...attractPages()],
  ['title', 'name', 'high-score', 'start'],
  'Kind Pinball keeps its four pages',
)

// The Last Bell's name, not Kind Pinball's.
{
  const title = attract({ pages }, at(0, 2000))
  assert.ok(shows(title, 'ZUZU', 9), 'ZUZU on the title page')
  assert.ok(!shows(title, KIND_PINBALL_PAGES.title, 9))
  const name = attract({ pages }, at(1, 1000))
  assert.ok(shows(name, 'THE', 6, { small: true }))
  assert.ok(shows(name, 'LAST BELL', 15), 'THE LAST BELL')
  // A table with no pages still says Kind Pinball.
  assert.ok(shows(attract({}, at(0, 2000)), 'KIND PINBALL', 9))
  assert.ok(shows(attract({}, at(1, 1000)), 'RESCUE', 15))
  // The title types on.
  assert.ok(!shows(attract({ pages }, at(0, 0)), 'ZUZU', 9), 'typed on')
}

// The Croc's jaws page: they snap shut and open again.
{
  const frames = [0, 600, 1250, 1900].map((t) => attract({ pages }, at(2, t)))
  const counts = frames.map(litDots)
  assert.ok(
    counts.every((n) => n > 0),
    'the jaws are drawn',
  )
  assert.ok(new Set(counts).size >= 3, `the jaws move: ${counts.join(', ')}`)
  // Shut (mid-page) lights more of the display than open.
  assert.ok(counts[2]! > counts[0]!, 'they close')
}

// The high score counts up, then holds.
{
  const highScore = 12_345_670
  const page = attractPages(pages).indexOf('high-score')
  const early = attract({ pages, highScore }, at(page, 150))
  const done = attract(
    { pages, highScore },
    at(page, HIGH_SCORE_COUNT_MS + 200),
  )
  assert.ok(shows(done, formatScore(highScore), 13), 'the high score')
  assert.ok(!shows(early, formatScore(highScore), 13), 'counting up to it')
  assert.ok(shows(early, 'HIGH SCORE', 3, { small: true }))
}

// Game over: a new high score says so; otherwise GAME OVER.
{
  const showing = (elapsed: number): DmdShowing => ({
    request: { scene: 'game-over' },
    spec: DMD_SCENES['game-over'],
    elapsed,
    durationMs: DMD_SCENES['game-over'].durationMs,
    queuedAt: 0,
    seq: 0,
  })
  const over = (score: number, highScore: number) => {
    const dmd = new Dmd()
    drawDmd(dmd, showing(500), { score, ball: 3, multiplier: 1, highScore }, 0)
    return dmd
  }
  const beat = over(2_000_000, 1_000_000)
  assert.ok(shows(beat, 'NEW HIGH SCORE', 2, { small: true }))
  assert.ok(shows(beat, formatScore(2_000_000), 12))
  const short = over(500_000, 1_000_000)
  assert.ok(shows(short, 'GAME OVER', 3), 'short of it: GAME OVER')
  assert.ok(!shows(short, 'NEW HIGH SCORE', 2, { small: true }))
  assert.ok(!beatsHighScore({ score: 9, ball: 1, multiplier: 1 }))
  assert.ok(
    !beatsHighScore({
      score: 9,
      ball: 1,
      multiplier: 1,
      highScore: 1,
      attract: true,
    }),
    'never in attract',
  )
}

// The runtime's attract DMD is the Last Bell's.
{
  const headless = () =>
    ({
      render() {},
      setSize() {},
      setPixelRatio() {},
      dispose() {},
    }) as unknown as RendererLike
  const runtime = new PinballRuntime(
    { rng: mulberry32(2), sound: { play: () => {} }, demo: true, hiScore: 0 },
    RAPIER,
    table,
    headless,
    ZUZU_RULESET,
  )
  runtime.mount({} as HTMLCanvasElement)
  for (let t = 0; t < 60; t++) runtime.update(emptyInput())
  assert.ok(shows(runtime.dmd, 'ZUZU', 9), 'the demo shows ZUZU')
  runtime.dispose()
}

// Ducking: a callout drops the music bus under it and brings it back after;
// overlapping callouts keep it down until the last is said; anything else
// leaves the music alone.
{
  type Event = [string, number, number]
  class Param {
    value = 1
    events: Event[] = []
    setValueAtTime(v: number, t: number) {
      this.events.push(['set', v, t])
    }
    exponentialRampToValueAtTime(v: number, t: number) {
      this.events.push(['ramp', v, t])
    }
    setTargetAtTime(v: number, t: number) {
      this.events.push(['target', v, t])
    }
    cancelScheduledValues(t: number) {
      this.events.push(['cancel', 0, t])
    }
  }
  const node = () => ({
    gain: new Param(),
    pan: new Param(),
    frequency: new Param(),
    type: 'sine',
    buffer: null as unknown,
    connect() {},
    disconnect() {},
    start() {},
    stop() {},
  })
  class FakeContext {
    state = 'running'
    currentTime = 10
    sampleRate = 8000
    destination = {}
    createGain = node
    createOscillator = node
    createStereoPanner = node
    createBufferSource = node
    createBuffer(_c: number, frames: number) {
      return { getChannelData: () => new Float32Array(frames) }
    }
    resume() {
      return Promise.resolve()
    }
    close() {
      return Promise.resolve()
    }
  }
  const g = globalThis as unknown as { window?: unknown }
  const had = 'window' in g
  const before = g.window
  g.window = { AudioContext: FakeContext }
  try {
    const mixer = new PinballMixer({ play: () => {} })
    mixer.unlock()
    assert.ok(mixer.isUnlocked)
    const inner = mixer as unknown as {
      context: FakeContext
      buses: Map<string, { gain: Param }>
    }
    const music = inner.buses.get('music')!.gain
    const level = music.value
    const targets = () => music.events.filter((e) => e[0] === 'target')

    mixer.play('flipper')
    mixer.play('pop')
    assert.equal(targets().length, 0, 'mechanical sounds leave the music be')

    const callouts = (
      Object.keys(PINBALL_CUES) as Array<keyof typeof PINBALL_CUES>
    ).filter((name) => PINBALL_CUES[name].bus === 'callout')
    assert.ok(callouts.includes('jackpot'))
    mixer.play('jackpot')
    const [down, up] = targets()
    assert.ok(down && up, 'a jackpot ducks the music')
    assert.ok(Math.abs(down[1] - level * DUCK_DEPTH) < 1e-9, 'down')
    assert.equal(down[2], 10, 'at once')
    assert.ok(Math.abs(up[1] - level) < 1e-9, 'and back up')
    assert.ok(
      Math.abs(up[2] - (10 + PINBALL_CUES.jackpot.duration)) < 1e-9,
      'once it is said',
    )

    // A longer callout half way through keeps it down until it ends.
    inner.context.currentTime = 10 + PINBALL_CUES.jackpot.duration / 2
    music.events = []
    mixer.play('super-jackpot')
    const until = Math.max(
      10 + PINBALL_CUES.jackpot.duration,
      inner.context.currentTime + PINBALL_CUES['super-jackpot'].duration,
    )
    assert.ok(
      music.events.some((e) => e[0] === 'cancel'),
      'replanned',
    )
    const back = targets().at(-1)!
    assert.ok(Math.abs(back[2] - until) < 1e-9, 'back after the last')
    // A short one inside a long one does not cut it short.
    inner.context.currentTime += 0.01
    music.events = []
    mixer.play('combo')
    assert.ok(Math.abs(targets().at(-1)![2] - until) < 1e-9)

    // The duck follows the bus's level when it is set.
    mixer.setBusGain('music', 0.5)
    inner.context.currentTime = 100
    music.events = []
    mixer.play('lock')
    assert.ok(Math.abs(targets()[0]![1] - 0.5 * DUCK_DEPTH) < 1e-9)
    assert.ok(Math.abs(targets()[1]![1] - 0.5) < 1e-9)

    // Muted: no callout, so no duck.
    const muted = new PinballMixer({ play: () => {}, muted: true } as never)
    muted.unlock()
    const mutedMusic = (
      muted as unknown as { buses: Map<string, { gain: Param }> }
    ).buses.get('music')!.gain
    muted.play('jackpot')
    assert.equal(mutedMusic.events.length, 0)

    // The arcade mute switch must silence the dedicated pinball mixer, not
    // just the unrelated chiptune context. Unmuting restores the same music.
    const liveSound = { play: () => {}, muted: false }
    const live = new PinballMixer(liveSound)
    live.unlock()
    const liveMaster = (live as unknown as { master: { gain: Param } }).master
      .gain
    assert.ok(live.startMusic('mode'))
    liveSound.muted = true
    live.unlock()
    assert.equal(liveMaster.value, 0)
    liveSound.muted = false
    live.unlock()
    assert.ok(liveMaster.value > 0)

    // A tab suspended by the browser gets another resume attempt on the
    // next real keyboard/touch gesture, even after its first unlock.
    let resumes = 0
    inner.context.state = 'suspended'
    inner.context.resume = () => {
      resumes++
      inner.context.state = 'running'
      return Promise.resolve()
    }
    mixer.unlock()
    assert.equal(resumes, 1)
    mixer.dispose()
    muted.dispose()
    live.dispose()
  } finally {
    if (had) g.window = before
    else delete g.window
  }
}

const cabinetScript = readFileSync(
  new URL('../../components/arcade/arcade-cabinet.vue', import.meta.url),
  'utf8',
)
  .split('<script setup lang="ts">')[1]!
  .split('</script>')[0]!
const cabinetAst = ts.createSourceFile(
  'cabinet.ts',
  cabinetScript,
  ts.ScriptTarget.Latest,
  true,
)
const gestureHandlers = cabinetAst.statements
  .filter(
    (statement) =>
      ts.isFunctionDeclaration(statement) &&
      ['press', 'onKey'].includes(statement.name?.text ?? ''),
  )
  .map((statement) => statement.getText(cabinetAst))
  .join('\n')
assert.equal(
  cabinetAst.statements.filter(
    (statement) =>
      ts.isFunctionDeclaration(statement) &&
      ['press', 'onKey'].includes(statement.name?.text ?? ''),
  ).length,
  2,
)
const gestureCode = ts.transpile(gestureHandlers, {
  target: ts.ScriptTarget.ES2022,
})
for (const open of [false, true]) {
  for (const gesture of ['touch-a', 'touch-start', 'Enter', 'Space', 'KeyZ']) {
    let starts = 0
    const touch: Array<[string, boolean]> = []
    const scope = {
      HTMLInputElement: class {
        value = ''
      },
      meta: { value: { touchLayout: 'pinball' } },
      ATTRACT_PHASES: ['title', 'scores', 'demo'],
      machine: { phase: 'title' },
      guide: { value: open ? { pages: [{}, {}], page: 0 } : null },
      unlockArcadeAudio() {},
      startGame() {
        starts++
      },
      seatInput() {
        return {
          setTouch(button: string, down: boolean) {
            touch.push([button, down])
          },
        }
      },
    }
    const context = vm.createContext(scope)
    vm.runInContext(gestureCode, context)
    if (gesture.startsWith('touch-')) {
      vm.runInContext(`press('${gesture.slice(6)}', true)`, context)
      assert.deepEqual(touch, open ? [[gesture.slice(6), true]] : [])
    } else {
      vm.runInContext(`onKey({ target: {}, code: '${gesture}' })`, context)
    }
    assert.equal(
      starts,
      open ? 0 : 1,
      `${gesture}: open guide owns input; closed guide starts synchronously`,
    )
    vm.runInContext(
      "onKey({ target: new HTMLInputElement(), code: 'Enter' })",
      context,
    )
    assert.equal(
      starts,
      open ? 0 : 1,
      'typing in an input never starts pinball',
    )
  }
}

console.log(
  'Zuzu DMD and sound: Last Bell attract pages (name, jaws, high score counting up), Kind Pinball pages unchanged, new-high-score game over, runtime attract and music ducking under callouts verified',
)
