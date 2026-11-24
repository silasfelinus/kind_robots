// Blind story-critic flight driver (read-only review harness, not game code).
// Usage from the repo root: OUT=<dir> npx tsx projects-review/rainbow-story-critic/fly.ts '<policy JSON>'
import { writeFileSync } from 'node:fs'
import { createRainbowPrincessPreview } from '../../utils/arcade/games/rainbowPrincessPreview'
import { TRENCH_FORK } from '../../utils/arcade/games/rainbowTrench'
import { WRECK_FORK } from '../../utils/arcade/games/rainbowWreckyard'
import { CROWN_REEF_FORK } from '../../utils/arcade/games/rainbowCrownReef'
import { FINALE_LANES } from '../../utils/arcade/games/rainbowEclipseFinale'
import { ROSEFIN } from '../../utils/arcade/games/rainbowRosefin'
import { emptyInput } from '../../utils/arcade/types'

type HL = 'high' | 'low'
export type Policy = {
  roster: number[]
  seed: number
  trench: HL
  wreck: HL
  reef: HL
  memorial: HL | 'split'
  navigator: 'meet' | 'skip'
  plea: HL
  final: 'restore' | 'evacuate' | 'sever' | 'split'
  dockEarly: boolean
  captives: boolean
  giveUp?: boolean
  reloadAt?: number
  detours?: boolean
  cap?: number
  name: string
}

function seeded(seed: number) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

export function fly(p: Policy) {
  const players = p.roster.length
  let game = createRainbowPrincessPreview({
    players,
    demo: false,
    selectScreen: true,
    rng: seeded(p.seed),
    sound: { play() {} },
    hiScore: 0,
  } as never)
  const texts: string[] = []
  let frameTexts: string[] = []
  const state: Record<string | symbol, unknown> = {
    canvas: { width: 480, height: 270 },
  }
  const g = new Proxy(state, {
    get(target, key) {
      if (key in target) return target[key]
      if (key === 'measureText') return (t: string) => ({ width: t.length * 6 })
      if (
        key === 'createLinearGradient' ||
        key === 'createRadialGradient' ||
        key === 'createPattern'
      )
        return () => ({ addColorStop() {} })
      if (key === 'getLineDash') return () => []
      if (key === 'fillText') return (t: string) => frameTexts.push(String(t))
      return () => {}
    },
    set(target, key, value) {
      target[key] = value
      return true
    },
  }) as unknown as CanvasRenderingContext2D
  const seen = new Set<string>()
  const log: string[] = []
  const acts: string[] = []
  let frame = 0
  const cap = p.cap ?? 900000
  let continues = 0
  // select screen: set each seat
  let sel = 0
  const selInputs: Array<Partial<Record<string, boolean>>> = []
  for (let seat = 0; seat < players; seat++) {
    // we cannot see internal select ship easily; use snapshot.selectMenu
  }
  void selInputs
  let plan: string[] | null = null
  let reloaded = false
  let lastAct = ''
  let lastScene = ''
  for (; frame < cap && !game.over; frame++) {
    if (
      p.reloadAt &&
      !reloaded &&
      (game.snapshot as any).act === `S0${p.reloadAt}` &&
      (game.save as any)?.checkpoint?.act === p.reloadAt
    ) {
      const save = JSON.parse(JSON.stringify(game.save))
      log.push(
        `\n### RELOAD from save at act ${save.checkpoint.act} allegiance=${save.checkpoint.allegiance}`,
      )
      game = createRainbowPrincessPreview({
        players,
        demo: false,
        selectScreen: true,
        resume: save,
        rng: seeded(p.seed + 1),
        sound: { play() {} },
        hiScore: 0,
      } as never)
      reloaded = true
      for (let i = 0; i < 40; i++) {
        const k = emptyInput()
        if (i > 30 && i % 2 === 0) k.pressed.a = true
        game.update(
          k,
          Array.from({ length: players }, () => k),
        )
      }
      log.push(
        `### after reload: act=${(game.snapshot as any).act} allegiance=${(game.snapshot as any).allegiance} pilots=${(game.snapshot as any).pilots}`,
      )
    }
    const s = game.snapshot as any
    const inputs = Array.from({ length: players }, () => emptyInput())
    if (s.selectMenu) {
      const m = s.selectMenu
      if (frame % 4 === 0) {
        if (!plan) plan = menuPlan(players, p.roster)
        const step = plan.shift()
        if (step === 'down') inputs[0].pressed.down = true
        else if (step === 'right') inputs[0].pressed.right = true
        else if (step === 'left') inputs[0].pressed.left = true
        else if (m.row === players && m.difficulty !== 'easy')
          inputs[0].pressed.left = true
        else if (sel++ > 10) inputs[0].pressed.a = true
      }
      game.update(inputs[0], inputs)
      continue
    }
    if (s.continueLeft > 0) {
      if (!p.giveUp && frame % 2 === 0) inputs[0].pressed.a = true
      if (s.continueLeft === 1) continues++
    }
    if (p.dockEarly && s.docked === ROSEFIN.dockMinFrames - 1)
      inputs[0].pressed.a = true
    if (s.stage === 'end' && frame % 2 === 0) inputs[0].pressed.a = true
    const tick = s.tick
    for (let seat = 0; seat < players; seat++) {
      const ship = s.ships[seat]
      if (!ship || ship.lives <= 0) continue
      const k = inputs[seat]
      k.held.a = true
      let y = 135 + Math.sin(tick / 33 + seat) * 56
      if (s.guardian && s.guardian.frame > 60)
        y += (s.guardian.y + (seat - 1.5) * 8 - y) * 0.7
      const hl = (h: HL) =>
        (h === 'high' ? 88 : 182) + Math.sin(tick / 33 + seat) * 14
      const fork =
        s.trenchRoute === null && s.act === 'S03' ? s.actThreeFrame : -1
      if (s.act === 'S03') {
        const lead = Math.min(
          s.actThreeFrame - TRENCH_FORK.markFrom,
          TRENCH_FORK.decideAt + 60 - s.actThreeFrame,
        )
        if (lead >= 0) y = hl(p.trench)
      }
      void fork
      if (s.act === 'S05') {
        const lead = Math.min(
          s.actFiveFrame - WRECK_FORK.markFrom,
          WRECK_FORK.decideAt + 60 - s.actFiveFrame,
        )
        if (lead >= 0) y = hl(p.wreck)
        const pod =
          s.wreckRoute === 'depot'
            ? s.survivors.find(
                (q: any) => q.x > ship.x - 8 && q.x < ship.x + 140,
              )
            : undefined
        if (pod) y = pod.y
      }
      if (s.act === 'S06' || s.resting !== null) {
        const lead = Math.min(
          s.actSixFrame - CROWN_REEF_FORK.markFrom,
          CROWN_REEF_FORK.decideAt + 60 - s.actSixFrame,
        )
        if (s.act === 'S06' && lead >= 0) y = hl(p.reef)
      }
      if (s.resting !== null) {
        const want: HL =
          p.memorial === 'split'
            ? seat % 2 === 0
              ? 'high'
              : 'low'
            : p.memorial
        y = hl(want)
      }
      if (p.detours && s.sceneId && /^A0[467]\.AFTER$/.test(s.sceneId))
        y = 80 + seat * 6
      if (s.navigator)
        y = p.navigator === 'meet' ? s.navigator.y + seat * 6 : 243 - seat * 4
      if (s.crown && s.crown.plea > 0)
        y = p.plea === 'high' ? 64 + seat * 8 : 182 + seat * 6
      if (s.choiceFrame !== null && s.stage === 'choice') {
        const order = ['restore', 'evacuate', 'sever'] as const
        const c = p.final === 'split' ? order[seat % 3] : p.final
        y = FINALE_LANES[c] + (seat - 1.5) * 6
      }
      if (p.captives) {
        const collar = s.enemies.find(
          (r: any) => r.kind === 'captive' && !r.freed && r.x < 440,
        )
        if (collar) y = collar.y - 14 + seat * 4
      }
      if (ship.y < y - 3) k.held.down = true
      else if (ship.y > y + 3) k.held.up = true
      const bossy =
        s.boss ||
        s.moonBoss ||
        s.clawBoss ||
        s.delphion ||
        s.sawtooth ||
        s.lanternRay ||
        s.glassEel ||
        s.leviathan ||
        (s.crown && !(s.crown.plea > 0))
      if (bossy && tick % 90 === seat * 7) k.pressed.b = true
    }
    game.update(inputs[0], inputs)
    if (s.act !== lastAct) {
      acts.push(s.act)
      log.push(`\n=== ${s.act} (frame ${frame}) ===`)
      lastAct = s.act
    }
    if (s.sceneId && s.sceneId !== lastScene) {
      log.push(`-- scene ${s.sceneId}`)
      lastScene = s.sceneId
    }
    if (frame % 8 === 0) {
      frameTexts = []
      game.render(g)
      for (const t of frameTexts) {
        if (
          t.length < 6 ||
          /^(COMET|SHOALS|SCORE RETURNS|BLOOM|TIDE|NOVA|EMBER|GALE)\b/.test(
            t,
          ) ||
          /♥|◇/.test(t) ||
          /^[\d ,.:x×%+-]+$/.test(t)
        )
          continue
        if (!seen.has(t)) {
          seen.add(t)
          log.push(t)
        }
      }
    }
  }
  const s = game.snapshot as any
  const summary = {
    name: p.name,
    roster: p.roster,
    seed: p.seed,
    over: game.over,
    stage: s.stage,
    act: s.act,
    frames: frame,
    minutes: Math.round(frame / 360) / 10,
    continues: s.continues,
    acts,
    trenchRoute: s.trenchRoute,
    wreckRoute: s.wreckRoute,
    reefRoute: s.reefRoute,
    allegiance: s.allegiance,
    stoodDown: s.stoodDown,
    finalChoice: s.finalChoice,
    rescues: [
      'rescuedStation',
      'rescuedNemi',
      'securedSalvage',
      'rescuedCourier',
      'freedDepot',
      'stoppedRelay',
      'rescuedNavigator',
    ].filter((f) => s[f]),
    captivesFreed: s.captivesFreed,
    allies: s.allies,
    pilots: s.pilots,
  }
  writeFileSync(
    `${process.env.OUT ?? '.'}/${p.name}.txt`,
    JSON.stringify(summary) + '\n' + log.join('\n'),
  )
  return summary
}

if (process.argv[2]) {
  const p = JSON.parse(process.argv[2]) as Policy
  console.log(JSON.stringify(fly(p)))
}

function menuPlan(n: number, want: number[]): string[] {
  const pilots = Array.from({ length: n }, (_, i) => i)
  let customized = false
  let row = 0
  const steps: string[] = []
  const press = (step: number) => {
    const seat = row
    if (seat === 0 && !customized) {
      const first = (pilots[0]! + step + 4) % 4
      for (let i = 0; i < n; i++) pilots[i] = (i + first) % 4
      return
    }
    const previous = pilots[seat]!
    let candidate = (previous + step + 4) % 4
    for (let t = 0; t < 4; t++) {
      if (!pilots.some((q, i) => i !== seat && q === candidate)) break
      candidate = (candidate + step + 4) % 4
    }
    if (candidate === previous) {
      candidate = (previous + step + 4) % 4
      const other = pilots.indexOf(candidate)
      if (other >= 0) pilots[other] = previous
    }
    pilots[seat] = candidate
    customized = true
  }
  // customize seat 0 first after a dummy customization on seat 1 if needed
  for (
    let guard = 0;
    guard < 200 && pilots.some((q, i) => q !== want[i]);
    guard++
  ) {
    const seat = pilots.findIndex((q, i) => q !== want[i])
    while (row !== seat) {
      steps.push('down')
      row = (row + 1) % (n + 1)
    }
    steps.push('right')
    press(1)
  }
  if (pilots.some((q, i) => q !== want[i])) throw new Error('menu plan failed')
  while (row !== n) {
    steps.push('down')
    row = (row + 1) % (n + 1)
  }
  return steps
}
