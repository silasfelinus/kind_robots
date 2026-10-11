// Zuzu: The Last Bell's own rules (conductor zuzu-pinball/t-008), replayed
// as plain switch events through the pure reducer: the five story chapters
// and their seals, chapter progress kept across balls, the Mortuary and the
// bell, the Abbey seals' multiplier, the skill shot, combos, the River Croc's
// extra ball, ball save, bonus, tilt, match and game over, the lamp matrix,
// and the full runtime playing a bot game on these rules.
import assert from 'node:assert/strict'
import RAPIER from '@dimforge/rapier3d-compat'
import { mulberry32 } from '../arcade/curve'
import { measureText } from '../arcade/font'
import zuzuPinball from '../arcade/games/zuzuPinball3d'
import { PHYSICS_HZ } from '../arcade/pinball/clock'
import type { RulesEvent } from '../arcade/pinball/rules/engine'
import { TILT_BOB_STEPS, TILT_WARNINGS } from '../arcade/pinball/rules/engine'
import { PinballRuntime } from '../arcade/pinball/runtime'
import {
  livePhysicsWorlds,
  PinballPhysics,
} from '../arcade/pinball/physics/world'
import type { RendererLike } from '../arcade/pinball/render/scene'
import {
  CHAPTERS,
  hitValue,
  litShots,
  RELICS_FOR_CRYPT,
  ROVE_STEPS,
  sealValue,
} from '../arcade/pinball/tables/zuzuLastBell/chapters'
import {
  MULTIPLIER_LAMPS,
  SEAL_LAMPS,
} from '../arcade/pinball/tables/zuzuLastBell/lamps'
import {
  BALL_SAVE_STEPS,
  CROC_EXTRA_BALL_AT,
  RELIC,
  RELIC_MIN_SPEED,
  SEAL_BANK,
  SKILL_STEPS,
  ZUZU_RULESET,
  type ZuzuRulesState,
} from '../arcade/pinball/tables/zuzuLastBell/rules'
import { ZUZU_LAST_BELL_GREYBOX as table } from '../arcade/pinball/tables/zuzuLastBell/table'
import { BOT_SKILLS, PinballBot } from '../arcade/pinball/tuning/bot'
import type { RuleEffect, SwitchEvent } from '../arcade/pinball/types'

await RAPIER.init()

const rules = ZUZU_RULESET
const context = { shots: table.shots }

/** A switch event with the ball id optional (ball 1). */
type Loose<E> = E extends unknown
  ? Omit<E, 'ballId'> & { ballId?: number }
  : never

/** A game driven by hand: switches, time and nudges, with every effect kept. */
class Game {
  state: ZuzuRulesState
  effects: RuleEffect[] = []
  at = 0
  constructor(balls = 3, seed = 7) {
    this.state = rules.initial(balls, seed)
    this.send({ type: 'start' })
  }
  send(event: RulesEvent) {
    const r = rules.step(this.state, event, context)
    this.state = r.state
    this.effects.push(...r.effects)
    return r.effects
  }
  sw(event: Loose<SwitchEvent>) {
    this.at += 1
    return this.send({
      type: 'switch',
      event: { ballId: 1, ...event } as SwitchEvent,
      tick: this.at,
    })
  }
  /** Let `steps` physics steps pass, ticking as the runtime does. */
  wait(steps: number) {
    const end = this.at + steps
    while (this.at < end) {
      this.at = Math.min(end, this.at + PHYSICS_HZ / 60)
      this.send({ type: 'tick', tick: this.at })
    }
  }
  /** Make a shot: trip its switches in order, as a real ball does. */
  shot(id: string) {
    const def = table.shots.find((s) => s.id === id)!
    const out: RuleEffect[] = []
    for (const sensor of def.sensors) {
      const type =
        def.kind === 'scoop'
          ? 'capture'
          : def.kind === 'spinner'
            ? 'spin'
            : 'sensor-enter'
      out.push(
        ...this.sw(
          type === 'spin'
            ? { type, id: sensor, speed: 1 }
            : ({ type, id: sensor } as Loose<SwitchEvent>),
        ),
      )
    }
    return out
  }
  plunge() {
    return this.sw({ type: 'sensor-enter', id: 'shooter-exit' })
  }
  drain() {
    return this.sw({ type: 'drain' })
  }
  dmd(effects = this.effects) {
    return effects.flatMap((e) => (e.type === 'dmd' ? [e] : []))
  }
}

const lamps = (g: Game) => rules.lamps(g.state, table).lamps

// The table has every lamp the rules light.
const insertIds = new Set((table.inserts ?? []).map((i) => i.id))
for (const id of [
  ...SEAL_LAMPS,
  ...MULTIPLIER_LAMPS,
  'kickback-lamp',
  'shoot-again',
  'mortuary-arrow',
  'croc-reward',
  'abbey-seals',
  'relic-lamp',
  'crypt-seal',
])
  assert.ok(insertIds.has(id), `the table has the ${id} lamp`)
assert.ok(table.sensors.some((s) => s.id === 'shooter-exit'))
assert.equal(CHAPTERS.length, 5, 'five story chapters')
assert.deepEqual(
  CHAPTERS.map((c) => c.name),
  [
    'HOMESTEAD IN ASH',
    'STORM CROW CANYON',
    'ABBEY OF HOLLOW BELLS',
    "THE CHILDREN'S NAMES",
    'THE LAST BELL',
  ],
)
const shotIds = new Set(table.shots.map((s) => s.id))
for (const def of CHAPTERS) {
  for (const s of def.shots) assert.ok(shotIds.has(s), `${def.id}: ${s}`)
  assert.ok(def.need >= 1 && def.seconds >= 30)
}

// Game start: ball 1 served, the Mortuary lit and blinking.
{
  const g = new Game()
  assert.equal(g.state.ball, 1)
  assert.ok(g.effects.some((e) => e.type === 'serve-ball'))
  assert.equal(lamps(g)['mortuary-arrow'], 'blink')
  assert.equal(rules.skillTarget(g.state), 'mortuary', 'skill shot armed')
  assert.ok(SEAL_LAMPS.every((id) => lamps(g)[id] === 'off'))
}

// Skill shot: a soft plunge into the Mortuary pays and tells chapter 1.
{
  const g = new Game()
  g.plunge()
  const before = g.state.score
  const fx = g.shot('mortuary')
  assert.ok(g.dmd(fx).some((e) => e.scene === 'skill-shot'))
  assert.ok(g.state.score > before)
  assert.ok(g.state.story.run, 'the skill shot still starts the chapter')
  assert.equal(rules.skillTarget(g.state), null)
}
// ...but not once its window has passed.
{
  const g = new Game()
  g.plunge()
  g.wait(SKILL_STEPS + PHYSICS_HZ)
  assert.equal(rules.skillTarget(g.state), null)
  const fx = g.shot('mortuary')
  assert.ok(!g.dmd(fx).some((e) => e.scene === 'skill-shot'))
}

// Chapter 1, Homestead in Ash: each of its shots once seals it.
{
  const g = new Game()
  g.plunge()
  g.shot('left-orbit') // spends the skill shot
  const fx = g.shot('mortuary')
  assert.ok(g.dmd(fx).some((e) => e.scene === 'mode-intro'))
  assert.ok(g.dmd(fx).some((e) => e.scene === 'mode-timer'))
  assert.equal(rules.music(g.state), 'mode')
  const def = CHAPTERS[0]!
  assert.deepEqual(lamps(g)['seal-1'], 'blink')
  for (const s of def.shots) {
    const arrow = table.inserts!.find((i) => i.shot === s)
    if (arrow) assert.equal(lamps(g)[arrow.id], 'blink', `${s} is lit`)
  }
  // An unlit shot does not count.
  g.shot('abbey-crossover')
  assert.equal(g.state.story.progress.hits, 0)
  // Each lit shot pays more than the last.
  let last = 0
  for (const [i, s] of def.shots.entries()) {
    const before = g.state.score
    g.shot(s)
    const paid = g.state.score - before
    if (i < def.shots.length - 1) {
      assert.ok(paid >= hitValue(0, i, 1), `${s} pays the chapter value`)
      assert.ok(paid > last)
      last = paid
    }
  }
  assert.equal(g.state.story.chapter, 1, 'chapter 1 sealed')
  assert.equal(g.state.story.run, null)
  assert.equal(lamps(g)['seal-1'], 'on')
  assert.ok(g.dmd().some((e) => e.text === 'SEAL BROKEN'))
  assert.ok(g.effects.some((e) => e.type === 'dmd-clear'))
  // The Mortuary waits for the bell before the next chapter.
  assert.equal(lamps(g)['mortuary-arrow'], 'off')
  const unlit = g.shot('mortuary')
  assert.equal(g.state.story.run, null)
  assert.ok(g.dmd(unlit).some((e) => e.sub === 'RING THE BELL TO OPEN'))
  g.shot('bell-lane')
  assert.equal(lamps(g)['mortuary-arrow'], 'blink')
  g.shot('mortuary')
  assert.equal(g.state.story.run !== null, true)
  assert.equal(g.state.story.chapter, 1, 'Storm Crow Canyon is told next')
}

// Storm Crow alternates orbits; a timeout keeps its progress for next time.
{
  const g = new Game()
  g.state = {
    ...g.state,
    story: { ...g.state.story, chapter: 1 },
    skill: { armed: false, until: 0 },
  }
  g.shot('mortuary')
  g.shot('left-orbit')
  const def = CHAPTERS[1]!
  assert.deepEqual(litShots(def, g.state.story.progress, 0), ['right-orbit'])
  g.shot('left-orbit')
  assert.equal(g.state.story.progress.hits, 1, 'the same orbit twice is not')
  g.shot('right-orbit')
  assert.equal(g.state.story.progress.hits, 2)
  g.wait(def.seconds * PHYSICS_HZ + PHYSICS_HZ)
  assert.equal(g.state.story.run, null, 'the timer ran out')
  assert.ok(g.dmd().some((e) => e.scene === 'mode-total'))
  assert.equal(g.state.story.progress.hits, 2, 'progress kept')
  g.shot('bell-lane')
  g.shot('mortuary')
  assert.equal(g.state.story.progress.hits, 2, 'and resumed')
}

// A drain mid-chapter ends it but keeps its place in the story.
{
  const g = new Game()
  g.state = { ...g.state, skill: { armed: false, until: 0 } }
  g.shot('mortuary')
  g.shot('left-orbit')
  g.at += BALL_SAVE_STEPS * 2
  g.drain()
  assert.equal(g.state.ball, 2)
  assert.equal(g.state.story.run, null)
  assert.equal(g.state.story.progress.hits, 1)
  assert.equal(g.state.story.mortuaryLit, true, 'a new ball may tell it')
  assert.ok(g.effects.some((e) => e.type === 'dmd-clear'))
}

// Roving: The Children's Names moves its lit shot along.
{
  const g = new Game()
  g.state = {
    ...g.state,
    story: { ...g.state.story, chapter: 3 },
    skill: { armed: false, until: 0 },
  }
  g.shot('mortuary')
  const def = CHAPTERS[3]!
  const first = litShots(def, g.state.story.progress, g.state.story.run!.rove)
  g.wait(ROVE_STEPS + 4)
  const moved = litShots(def, g.state.story.progress, g.state.story.run!.rove)
  assert.notDeepEqual(first, moved, 'the lit shot roves')
  g.shot(moved[0]!)
  assert.equal(g.state.story.progress.hits, 1)
}

// All five chapters: the Last Bell rings and the story begins again.
{
  const g = new Game()
  g.state = { ...g.state, skill: { armed: false, until: 0 } }
  for (const [i, def] of CHAPTERS.entries()) {
    if (i > 0) g.shot('bell-lane')
    g.shot('mortuary')
    assert.equal(g.state.story.chapter, i)
    let guard = 0
    while (g.state.story.chapter === i && guard++ < 20) {
      const run = g.state.story.run!
      g.shot(litShots(def, g.state.story.progress, run.rove)[0]!)
    }
  }
  assert.equal(g.state.story.sealed, 5)
  assert.equal(g.state.story.round, 2, 'round two')
  assert.equal(g.state.story.chapter, 0)
  assert.ok(g.dmd().some((e) => e.text === 'THE LAST BELL RINGS'))
  assert.ok(sealValue(4, 1) > sealValue(0, 1))
  assert.ok(
    hitValue(0, 0, 2) === 2 * hitValue(0, 0, 1),
    'round two pays double',
  )
}

// The Abbey seals: four down raise the multiplier, relight the kickback and
// open the Mortuary. They stay down for the rest of the ball, baring the
// relic (raising a target under a ball in the channel would trap it); each
// relic strike then raises the multiplier again, to its cap. The bank rises
// for the next ball.
{
  const g = new Game()
  g.state = {
    ...g.state,
    kickbackLit: false,
    story: { ...g.state.story, mortuaryLit: false },
  }
  for (let i = 1; i <= 4; i++)
    g.sw({ type: 'drop', id: `abbey-seal-${i}`, bank: SEAL_BANK })
  assert.equal(g.state.bonusMultiplier, 2)
  assert.equal(lamps(g)['bonus-2x'], 'on')
  assert.equal(lamps(g)['bonus-3x'], 'off')
  assert.equal(g.state.kickbackLit, true)
  assert.equal(g.state.story.mortuaryLit, true)
  assert.ok(
    !g.effects.some(
      (e) =>
        e.type === 'mechanism' && e.id === SEAL_BANK && e.action === 'reset',
    ),
    'the bank stays down mid-ball',
  )
  assert.equal(g.state.sealsDown.length, 4)
  assert.equal(lamps(g)['relic-lamp'], 'blink', 'the relic is bared')
  // A soft touch on the relic is not a strike.
  g.sw({ type: 'contact', id: RELIC, impulse: RELIC_MIN_SPEED / 2 })
  assert.equal(g.state.relics, 0)
  for (let k = 0; k < 8; k++) g.sw({ type: 'contact', id: RELIC, impulse: 1 })
  assert.equal(g.state.bonusMultiplier, 6, 'relic strikes raise it to the cap')
  assert.equal(g.state.relics, 8)
  assert.equal(lamps(g)['crypt-seal'], 'blink', 'the crypt stirs')
  g.at += BALL_SAVE_STEPS * 2
  const fx = g.drain()
  assert.ok(
    fx.some(
      (e) =>
        e.type === 'mechanism' && e.id === SEAL_BANK && e.action === 'reset',
    ),
    'the seals rise for the next ball',
  )
  assert.deepEqual(g.state.sealsDown, [])
  assert.equal(g.state.bonusMultiplier, 1)
  assert.equal(g.state.relics, 8, 'relics are kept for the crypt')
}
// Relic strikes with the seals still up just count toward the crypt.
{
  const g = new Game()
  for (let k = 0; k < RELICS_FOR_CRYPT; k++)
    g.sw({ type: 'contact', id: RELIC, impulse: 1 })
  assert.equal(g.state.bonusMultiplier, 1)
  assert.ok(g.dmd().some((e) => e.sub === 'THE CRYPT STIRS'))
}

// Kickback: fires once, unlit after.
{
  const g = new Game()
  const fx = g.sw({ type: 'sensor-enter', id: 'kickback' })
  assert.ok(fx.some((e) => e.type === 'mechanism' && e.action === 'fire'))
  assert.equal(lamps(g)['kickback-lamp'], 'off')
  const again = g.sw({ type: 'sensor-enter', id: 'kickback' })
  assert.ok(!again.some((e) => e.type === 'mechanism' && e.action === 'fire'))
}

// The River Croc always pays; his fifth swallow lights an extra ball in his
// mouth, the next collects it, and the drain after is SHOOT AGAIN.
{
  const g = new Game()
  for (let i = 1; i <= CROC_EXTRA_BALL_AT; i++) {
    const before = g.state.score
    g.shot('croc-mouth')
    assert.ok(g.state.score > before, 'a swallow always pays')
  }
  assert.equal(g.state.croc.extraBallLit, true)
  assert.equal(lamps(g)['croc-reward'], 'blink')
  g.shot('croc-mouth')
  assert.equal(g.state.extraBalls, 1)
  assert.equal(lamps(g)['shoot-again'], 'on')
  assert.ok(g.dmd().some((e) => e.scene === 'extra-ball'))
  g.at += BALL_SAVE_STEPS * 2
  const fx = g.drain()
  assert.equal(g.state.ball, 1, 'same ball')
  assert.ok(g.dmd(fx).some((e) => e.text === 'SHOOT AGAIN'))
  // Only one extra ball from the Croc per game.
  for (let i = 0; i < CROC_EXTRA_BALL_AT + 2; i++) g.shot('croc-mouth')
  assert.equal(g.state.croc.extraBallLit, false)
}

// Combos: ramps and orbits in quick succession.
{
  const g = new Game()
  g.state = { ...g.state, skill: { armed: false, until: 0 } }
  g.shot('left-orbit')
  const fx = g.shot('village-switchback')
  assert.ok(g.dmd(fx).some((e) => e.text === '2-WAY COMBO'))
  g.wait(PHYSICS_HZ * 4)
  const late = g.shot('right-orbit')
  assert.ok(!g.dmd(late).some((e) => e.text.includes('COMBO')))
}

// Ball save: a quick drain after the plunge gives the ball back, once.
{
  const g = new Game()
  g.plunge()
  const fx = g.drain()
  assert.ok(fx.some((e) => e.type === 'add-ball'))
  assert.equal(g.state.ball, 1)
  const again = g.drain()
  assert.ok(!again.some((e) => e.type === 'add-ball'))
  assert.equal(g.state.ball, 2)
}

// Bonus at the end of a ball, times the multiplier.
{
  const g = new Game()
  g.state = { ...g.state, skill: { armed: false, until: 0 } }
  g.shot('left-orbit')
  g.shot('croc-mouth')
  for (let i = 1; i <= 4; i++)
    g.sw({ type: 'drop', id: `abbey-seal-${i}`, bank: SEAL_BANK })
  g.at += BALL_SAVE_STEPS * 2
  const fx = g.drain()
  const bonus = g.dmd(fx).find((e) => e.scene === 'bonus')
  assert.ok(bonus, 'the bonus counts')
  assert.equal(bonus.value, 2)
  assert.ok((bonus.items ?? []).some((i) => i.label === 'RIVER CROC'))
  assert.equal(g.state.bonusMultiplier, 1, 'the multiplier resets')
}

// Tilt: warnings, then TILT kills flippers and the bonus, everything dark.
{
  const g = new Game()
  for (let i = 0; i <= TILT_WARNINGS + 1; i++)
    g.send({ type: 'nudge', tick: (g.at += TILT_BOB_STEPS / 4) })
  assert.equal(g.state.tilted, true)
  const frame = rules.lamps(g.state, table)
  assert.equal(frame.gi, 0)
  assert.ok(Object.values(frame.lamps).every((l) => l === 'off'))
  assert.equal(rules.music(g.state), null)
  const fx = g.drain()
  assert.ok(!g.dmd(fx).some((e) => e.scene === 'bonus'), 'no bonus on tilt')
  assert.equal(g.state.tilted, false, 'the next ball is live')
}

// Game over, or a match for one more ball.
{
  let games = 0
  let matched = 0
  for (let seed = 1; seed <= 40; seed++) {
    const g = new Game(1, seed)
    g.state = { ...g.state, score: 1230 + seed * 10 }
    const fx = g.drain()
    games++
    if (g.state.over) {
      assert.ok(fx.some((e) => e.type === 'game-over'))
      assert.equal(g.state.lives, 0)
    } else {
      matched++
      assert.ok(g.dmd(fx).some((e) => e.scene === 'match'))
      assert.equal(g.state.lives, 1)
    }
  }
  assert.ok(matched > 0 && matched < games, 'matches happen, sometimes')
}

// The skill shot is physically there: a half plunge drops into the Mortuary.
{
  const physics = new PinballPhysics(RAPIER, table)
  try {
    let state = rules.step(
      rules.initial(3, 1),
      { type: 'start' },
      context,
    ).state
    physics.serveBall()
    for (let i = 0; i < PHYSICS_HZ / 2; i++) physics.step()
    physics.launch(0.5)
    let skill = false
    for (let i = 0; i < PHYSICS_HZ * 6 && !skill; i++)
      for (const event of physics.step()) {
        const r = rules.step(state, { type: 'switch', event, tick: i }, context)
        state = r.state
        skill ||= r.effects.some(
          (e) => e.type === 'dmd' && e.scene === 'skill-shot',
        )
      }
    assert.ok(skill, 'a half plunge makes the skill shot')
  } finally {
    physics.dispose()
  }
}

// The guide fits the cabinet.
for (const page of zuzuPinball.guide!(new Set())) {
  assert.ok(measureText(page.title, 3) <= 360 - 24, page.title)
  for (const line of page.lines)
    assert.ok(measureText(line, page.scale ?? 2) <= 360 - 16, line)
}

// The full runtime plays bot games on these rules: chapters start, the
// score moves, the game ends, and nothing is left behind.
{
  const headless = () =>
    ({
      render() {},
      setSize() {},
      setPixelRatio() {},
      dispose() {},
    }) as unknown as RendererLike
  let chapters = 0
  let scored = 0
  for (let seed = 1; seed <= 4; seed++) {
    const runtime = new PinballRuntime(
      {
        rng: mulberry32(seed),
        sound: { play: () => {} },
        demo: false,
        hiScore: 0,
      },
      RAPIER,
      table,
      headless,
      ZUZU_RULESET,
    )
    const inner = runtime as unknown as {
      physics: PinballPhysics
      rules: ZuzuRulesState
    }
    const bot = new PinballBot(BOT_SKILLS.average, mulberry32(seed * 31), null)
    let started = false
    for (let t = 0; t < 60 * 60 * 4 && !runtime.over; t++) {
      runtime.update(
        bot.frame({
          balls: inner.physics.ballViews(),
          rules: inner.rules as never,
          ballOnPlunger: inner.physics.ballOnPlunger(),
          flippers: table.flippers,
        }),
      )
      started ||= !!inner.rules.story.run
    }
    assert.ok(runtime.over, `seed ${seed}: the game ends`)
    if (started) chapters++
    if (runtime.score > 0) scored++
    runtime.dispose()
  }
  assert.equal(scored, 4, 'every game scores')
  assert.ok(chapters >= 1, 'bots reach a chapter')
}
assert.equal(livePhysicsWorlds(), 0)
console.log(
  'Zuzu rules: five chapters and seals, Mortuary and bell, Abbey seals, skill shot, combos, Croc extra ball, ball save, bonus, tilt, match and runtime play verified',
)
