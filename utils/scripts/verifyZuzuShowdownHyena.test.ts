// /utils/scripts/verifyZuzuShowdownHyena.test.ts
//
// Zuzu Showdown (conductor zuzu-showdown t-017): the Hyena Matriarch's kit.
// Every special fires from its fighters.yaml input; Hook Lash reaches far and,
// only on a hit and only with QCF+P again, Drags the victim to her feet;
// Cackle builds a third of a bar while she stands open; Scavenger's Rush goes
// under high strikes for two hits; Bone Crusher is the HCB command grab; the
// supers.
//
//   npx tsx utils/scripts/verifyZuzuShowdownHyena.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { parseNotation, type Dir } from '../zuzuShowdown/motion'
import {
  INTRO_FRAMES,
  METER_BAR,
  METER_MAX,
  createMatch,
  hashState,
  moveOf,
  step,
} from '../zuzuShowdown/sim'
import { PLACEHOLDER_B } from '../zuzuShowdown/fighters/placeholders'
import { HYENA_MATRIARCH } from '../zuzuShowdown/fighters/hyena-matriarch'
import { STORM_CROW } from '../zuzuShowdown/fighters/storm-crow'
import { SIBLINGS } from '../zuzuShowdown/fighters/siblings'
import { ZUZU } from '../zuzuShowdown/fighters/zuzu'
import { FIGHTERS } from '../zuzuShowdown/fighters'
import {
  SIM_BUTTONS,
  SUB,
  neutralInput,
  type FighterData,
  type MatchState,
  type SimEvent,
  type SimInput,
} from '../zuzuShowdown/types'

const ROSTER: [FighterData, FighterData] = [HYENA_MATRIARCH, PLACEHOLDER_B]
const N = neutralInput()

let passed = 0
function check(name: string, fn: () => void): void {
  try {
    fn()
    passed += 1
  } catch (error) {
    console.error(`FAIL ${name}`)
    throw error
  }
}

const press = (over: Partial<SimInput>): SimInput => ({ ...N, ...over })

function fightAt(gapPx: number, roster = ROSTER, seed?: number): MatchState {
  let s = createMatch(roster, seed)
  for (let i = 0; i < INTRO_FRAMES; i += 1) s = step(s, [N, N], roster)
  const half = Math.trunc((gapPx * SUB) / 2)
  s.fighters[0].x = -half
  s.fighters[1].x = gapPx * SUB - half
  return s
}

function stick(dir: Dir): Partial<SimInput> {
  const out: Partial<SimInput> = {}
  if ([7, 8, 9].includes(dir)) out.up = true
  if ([1, 2, 3].includes(dir)) out.down = true
  if ([3, 6, 9].includes(dir)) out.right = true
  if ([1, 4, 7].includes(dir)) out.left = true
  return out
}

function motion(dirs: Dir[], button: Partial<SimInput>, each = 2): SimInput[] {
  const frames: SimInput[] = []
  dirs.forEach((dir, index) => {
    for (let i = 0; i < each; i += 1) {
      const last = index === dirs.length - 1 && i === each - 1
      frames.push(press({ ...stick(dir), ...(last ? button : {}) }))
    }
  })
  return frames
}

function play(
  s: MatchState,
  frames: number,
  p1: SimInput[],
  p2: SimInput[] = [],
  log?: SimEvent[],
  roster = ROSTER,
): MatchState {
  let state = s
  for (let i = 0; i < frames; i += 1) {
    state = step(state, [p1[i] ?? N, p2[i] ?? N], roster)
    if (log) log.push(...state.events)
  }
  return state
}

const hits = (log: SimEvent[]) =>
  log.filter((e): e is Extract<SimEvent, { type: 'hit' }> => e.type === 'hit')

const LASH = motion([2, 3, 6], { lp: true })
/** Hook Lash, then once it has hit, QCF+P again. */
const LASH_DRAG = [...LASH, ...Array(14).fill(N), ...LASH]

// ---------------------------------------------------------------- data

check(
  'every special matches its fighters.yaml input; she joins the roster',
  () => {
    const yaml: Record<string, string> = {
      'hook-lash': 'QCF+P',
      cackle: 'dd+K',
      'scavengers-rush': 'QCB+K',
      'bone-crusher': 'HCB+P',
      'chain-gang': 'QCF QCF+P',
      'last-laugh': 'QCB QCB+HP',
    }
    const commands = HYENA_MATRIARCH.specials.filter((s) => !s.followUp)
    assert.deepEqual(commands.map((s) => s.id).sort(), Object.keys(yaml).sort())
    for (const special of commands) {
      const parsed = parseNotation(yaml[special.id]!)
      assert.ok(parsed, special.id)
      assert.equal(parsed.motion, special.motion, special.id)
      assert.equal(parsed.button, special.button, special.id)
    }
    // Drag is QCF+P during a Hook Lash hit, never from neutral.
    const drag = HYENA_MATRIARCH.specials.find((s) => s.id === 'drag')!
    assert.ok(drag.followUp && drag.motion === 'qcf' && drag.button === 'P')
    assert.ok(FIGHTERS.includes(HYENA_MATRIARCH))
    assert.equal(HYENA_MATRIARCH.health, 1000)
  },
)

// ---------------------------------------------------------------- the kit

check('Hook Lash reaches far; HP rises at an angle', () => {
  const log: SimEvent[] = []
  play(fightAt(130), 40, LASH, [], log)
  assert.ok(
    hits(log).some((h) => h.move === 'hook-lash'),
    'the hook hit',
  )
  const lp = moveOf(HYENA_MATRIARCH, { id: 'hook-lash', heavy: false })
  const hp = moveOf(HYENA_MATRIARCH, { id: 'hook-lash', heavy: true })
  assert.ok(lp.hitbox.x + lp.hitbox.w >= 110, 'long reach')
  assert.ok(hp.hitbox.y > lp.hitbox.y && hp.hitbox.h > lp.hitbox.h, 'rising')
})

check('Drag: QCF+P on a Hook Lash hit yanks them to her feet', () => {
  const log: SimEvent[] = []
  const s = play(fightAt(130), 60, LASH_DRAG, [], log)
  assert.ok(log.some((e) => e.type === 'special' && e.move === 'drag'))
  assert.ok(
    hits(log).some((h) => h.move === 'drag'),
    'the drag hit',
  )
  const gap = Math.abs(s.fighters[1].x - s.fighters[0].x) / SUB
  assert.ok(gap <= 50, `at her feet (${gap} px)`)
})

check('Drag needs the hit, and the motion', () => {
  // A whiffed lash can't be dragged.
  const whiff: SimEvent[] = []
  play(fightAt(240), 60, LASH_DRAG, [], whiff)
  assert.ok(!whiff.some((e) => e.type === 'special' && e.move === 'drag'))
  // A bare punch after the hit isn't QCF+P.
  const bare: SimEvent[] = []
  play(
    fightAt(130),
    60,
    [...LASH, ...Array(18).fill(N), press({ lp: true })],
    [],
    bare,
  )
  assert.ok(hits(bare).some((h) => h.move === 'hook-lash'))
  assert.ok(!bare.some((e) => e.type === 'special' && e.move === 'drag'))
})

check("Cackle builds a third of a bar, and she's open throughout", () => {
  const s = play(fightAt(200), 80, motion([2, 5, 2], { lk: true }))
  assert.ok(s.fighters[0].meter >= 333, `meter ${s.fighters[0].meter}`)
  // Hit mid-laugh.
  const log: SimEvent[] = []
  play(
    fightAt(56),
    50,
    motion([2, 5, 2], { lk: true }),
    [...Array(20).fill(N), press({ hp: true })],
    log,
  )
  assert.ok(
    hits(log).some((h) => h.attacker === 1),
    'she took the hit',
  )
})

check("Scavenger's Rush: two hits, under a high strike", () => {
  const log: SimEvent[] = []
  play(fightAt(110), 50, motion([2, 1, 4], { lk: true }), [], log)
  assert.equal(hits(log).filter((h) => h.move === 'scavengers-rush').length, 2)
  // The opponent's standing heavy sails over her.
  const under: SimEvent[] = []
  play(
    fightAt(110),
    50,
    motion([2, 1, 4], { lk: true }),
    [...Array(8).fill(N), press({ hp: true })],
    under,
  )
  assert.ok(!hits(under).some((h) => h.attacker === 1), 'under it')
})

check('Bone Crusher: the HCB command grab, 150', () => {
  const log: SimEvent[] = []
  // Up close: the half circle's back half walks her back a step.
  play(
    fightAt(40),
    40,
    motion([6, 3, 2, 1, 4], { lp: true }),
    Array(40).fill(press({ right: true })),
    log,
  )
  const grab = log.find((e) => e.type === 'throw')
  assert.ok(grab && grab.type === 'throw' && grab.damage === 150)
})

// ---------------------------------------------------------------- supers

check('Chain Gang: a bar, both sides, 270 in all', () => {
  const s0 = fightAt(60)
  s0.fighters[0].meter = METER_BAR
  const log: SimEvent[] = []
  play(s0, 100, motion([2, 3, 6, 2, 3, 6], { lp: true }), [], log)
  assert.ok(log.some((e) => e.type === 'super' && e.move === 'chain-gang'))
  assert.ok(hits(log).filter((h) => h.move === 'chain-gang').length >= 2)
  const gang = moveOf(HYENA_MATRIARCH, { id: 'chain-gang', heavy: false })
  assert.ok(gang.hitbox.x < 0 && gang.hitbox.x + gang.hitbox.w > 0, 'both')
  assert.equal(gang.hits! * gang.damage, 270)
})

check('Last Laugh: three bars, HP, the Showdown, 420', () => {
  const s0 = fightAt(160)
  s0.fighters[0].meter = METER_MAX
  const log: SimEvent[] = []
  play(s0, 200, motion([2, 1, 4, 2, 1, 4], { hp: true }), [], log)
  const sup = log.find((e) => e.type === 'super' && e.move === 'last-laugh')
  assert.ok(sup && sup.type === 'super' && sup.showdown)
  assert.ok(hits(log).filter((h) => h.move === 'last-laugh').length >= 3)
  const laugh = moveOf(HYENA_MATRIARCH, { id: 'last-laugh', heavy: false })
  assert.equal(laugh.hits! * laugh.damage, 420)
})

// ---------------------------------------------------------------- fuzz

check(
  'the Matriarch replays deterministically and keeps every invariant',
  () => {
    for (const [seed, roster] of [
      [101, ROSTER],
      [102, [ZUZU, HYENA_MATRIARCH] as [FighterData, FighterData]],
      [103, [HYENA_MATRIARCH, HYENA_MATRIARCH] as [FighterData, FighterData]],
      [104, [HYENA_MATRIARCH, STORM_CROW] as [FighterData, FighterData]],
      [105, [SIBLINGS, HYENA_MATRIARCH] as [FighterData, FighterData]],
    ] as const) {
      const once = () => {
        const rand = mulberry32(seed)
        let s = createMatch(roster, seed)
        for (let i = 0; i < 4000; i += 1) {
          const inputs = [0, 1].map(() => {
            const input = { ...N }
            for (const button of SIM_BUTTONS)
              if (rand() < 0.18) input[button] = true
            return input
          }) as [SimInput, SimInput]
          s = step(s, inputs, roster)
          for (const f of s.fighters) {
            assert.ok(Math.abs(f.x) <= 384 * SUB + SUB, 'in the arena')
            assert.ok(f.health >= 0 && f.meter >= 0 && f.meter <= METER_MAX)
          }
        }
        return hashState(s)
      }
      assert.equal(once(), once(), `seed ${seed}`)
    }
  },
)

console.log(`verifyZuzuShowdownHyena: ${passed} checks passed`)
