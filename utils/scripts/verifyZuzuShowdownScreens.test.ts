// /utils/scripts/verifyZuzuShowdownScreens.test.ts
//
// Zuzu Showdown taunt screens (conductor zuzu-showdown t-019): the matchup lines ported from
// conductor's matchups.yaml are complete (36 intros, 64 win quotes, the boss lines), each intro is
// oriented to the side that speaks it (mirrors alternate), the VS screen plays its lines on schedule
// and shows them all at once under reduced motion, quotes wrap inside their column, and both the VS
// screen and the win screen draw every frame at finite, on-screen coordinates for every outcome.
//
//   npx tsx utils/scripts/verifyZuzuShowdownScreens.test.ts

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { measureText } from '../arcade/font'
import { findFighter } from '../zuzuShowdown/fighters'
import {
  BOSS_INTROS,
  MATCHUPS,
  introFor,
  winQuote,
} from '../zuzuShowdown/matchups'
import {
  VS_FIRST_LINE,
  VS_HOLD_FRAMES,
  VS_LINE_FRAMES,
  drawVsScreen,
  drawWinScreen,
  vsDuration,
  vsLinesShown,
  wrapText,
} from '../zuzuShowdown/screens'
import { VIEW_HEIGHT, VIEW_WIDTH } from '../zuzuShowdown/render'
import { createMatch } from '../zuzuShowdown/sim'
import {
  SPRITE_FIGHTERS,
  spriteFile,
  type LoadedSprites,
  type SpriteSheet,
} from '../zuzuShowdown/sprites'
import type { FighterData, MatchState } from '../zuzuShowdown/types'

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

const ZUZU = findFighter('zuzu')
const COYOTE = findFighter('coyote-vagrant')
const ROSTER_SLUGS = [
  'zuzu',
  'coyote-vagrant',
  'the-abbess',
  'the-siblings',
  'storm-crow',
  'river-croc',
  'hyena-matriarch',
  'old-komodo',
]

check(
  'the ported lines are complete: 36 intros, 64 win quotes, the boss',
  () => {
    assert.equal(MATCHUPS.length, 36)
    let quotes = 0
    for (let i = 0; i < ROSTER_SLUGS.length; i += 1) {
      for (let j = i; j < ROSTER_SLUGS.length; j += 1) {
        const a = ROSTER_SLUGS[i]!
        const b = ROSTER_SLUGS[j]!
        const intro = introFor(a, b)
        assert.ok(intro.length >= 2 && intro.length <= 3, `${a} vs ${b} intro`)
        for (const line of intro) assert.ok(line.line.length < 60, line.line)
        const winners = a === b ? [a] : [a, b]
        for (const w of winners) {
          const q = winQuote(w, w === a ? b : a)
          assert.ok(
            q.length > 0 && q.length < 60,
            `${w} beats ${a === w ? b : a}`,
          )
          quotes += 1
        }
      }
    }
    assert.equal(quotes, 64)
    for (const slug of ROSTER_SLUGS)
      assert.ok(BOSS_INTROS[slug], `boss ${slug}`)
    const json = JSON.parse(
      readFileSync(
        join(process.cwd(), 'utils/zuzuShowdown/matchups.json'),
        'utf8',
      ),
    )
    assert.match(json.source, /matchups\.yaml/, 'the port names its source')
  },
)

check('each intro line is on its speaker’s side; mirrors alternate', () => {
  const zc = introFor('zuzu', 'coyote-vagrant')
  const cz = introFor('coyote-vagrant', 'zuzu')
  assert.deepEqual(
    zc.map((l) => l.line),
    cz.map((l) => l.line),
  )
  for (const l of zc) assert.equal(l.side, l.speaker === 'zuzu' ? 0 : 1)
  for (const l of cz)
    assert.equal(l.side, l.speaker === 'coyote-vagrant' ? 0 : 1)
  const mirror = introFor('zuzu', 'zuzu')
  assert.deepEqual(
    mirror.map((l) => l.side),
    mirror.map((_, i) => i % 2),
  )
  assert.deepEqual(introFor('placeholder-a', 'zuzu'), [])
  assert.equal(winQuote('placeholder-a', 'zuzu'), '...')
  assert.equal(winQuote('zuzu', 'coyote-vagrant'), 'Eat something.')
})

check(
  'the VS screen plays its lines on schedule; reduced motion shows them all',
  () => {
    assert.equal(vsLinesShown(0, 3, false), 0)
    assert.equal(vsLinesShown(VS_FIRST_LINE, 3, false), 1)
    assert.equal(vsLinesShown(VS_FIRST_LINE + VS_LINE_FRAMES, 3, false), 2)
    assert.equal(vsLinesShown(VS_FIRST_LINE + 10 * VS_LINE_FRAMES, 3, false), 3)
    assert.equal(vsLinesShown(0, 3, true), 3)
    assert.equal(
      vsDuration(3),
      VS_FIRST_LINE + 2 * VS_LINE_FRAMES + VS_HOLD_FRAMES,
    )
    // Every line is on screen before the hold ends.
    assert.equal(vsLinesShown(vsDuration(3) - 1, 3, false), 3)
  },
)

check('quotes wrap inside their column', () => {
  for (const m of MATCHUPS) {
    for (const quote of Object.values(m.win)) {
      for (const line of wrapText(quote ?? '', 250)) {
        assert.ok(measureText(line) <= 250 || !line.includes(' '), line)
      }
    }
  }
  assert.deepEqual(wrapText('one two three', 1000), ['one two three'])
})

// ---------------------------------------------------------------- drawing

type Call = { op: string; args: number[] }

function stubContext() {
  const calls: Call[] = []
  const record =
    (op: string) =>
    (...args: unknown[]) => {
      calls.push({
        op,
        args: args.filter((a): a is number => typeof a === 'number'),
      })
    }
  const g = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    imageSmoothingEnabled: true,
    fillRect: record('fillRect'),
    drawImage: record('drawImage'),
    save: record('save'),
    restore: record('restore'),
    translate: record('translate'),
    scale: record('scale'),
    beginPath: record('beginPath'),
    moveTo: record('moveTo'),
    lineTo: record('lineTo'),
    closePath: record('closePath'),
    fill: record('fill'),
  }
  return { g: g as unknown as CanvasRenderingContext2D, calls }
}

const sheets = Object.fromEntries(
  SPRITE_FIGHTERS.map((slug) => {
    const sheet = JSON.parse(
      readFileSync(
        join(
          process.cwd(),
          'public',
          'zuzu-showdown-sprites',
          `${spriteFile(slug)}-pixel.json`,
        ),
        'utf8',
      ),
    ) as SpriteSheet
    const image = {} as CanvasImageSource
    return [slug, { sheet, image, p2: image } satisfies LoadedSprites]
  }),
) as Record<string, LoadedSprites>

function assertOnScreen(calls: Call[], label: string) {
  for (const call of calls) {
    for (const n of call.args)
      assert.ok(Number.isFinite(n), `${label} ${call.op} got ${n}`)
    if (call.op !== 'fillRect') continue
    const [x, y, w, h] = call.args as [number, number, number, number]
    // Pixels and panels (text is drawn pixel by pixel) stay on the 480x270 screen.
    assert.ok(
      x >= 0 && y >= 0 && x + w <= VIEW_WIDTH && y + h <= VIEW_HEIGHT,
      `${label} fillRect ${call.args}`,
    )
  }
}

check('the VS screen draws every frame on screen, with art and without', () => {
  const rosters: Array<[FighterData, FighterData]> = [
    [ZUZU, COYOTE],
    [COYOTE, ZUZU],
    [ZUZU, ZUZU],
  ]
  for (const roster of rosters) {
    const art: [LoadedSprites | undefined, LoadedSprites | undefined] = [
      sheets[roster[0].slug],
      sheets[roster[1].slug],
    ]
    const lines = introFor(roster[0].slug, roster[1].slug).length
    for (let t = 0; t <= vsDuration(lines); t += 3) {
      for (const reduced of [false, true]) {
        const { g, calls } = stubContext()
        drawVsScreen(g, roster, art, t, reduced)
        assertOnScreen(calls, `${roster[0].slug} vs ${roster[1].slug} t${t}`)
        assert.ok(
          calls.some((c) => c.op === 'drawImage'),
          'the fighters are drawn',
        )
      }
    }
    const { g, calls } = stubContext()
    drawVsScreen(g, roster, [undefined, undefined], 30, false)
    assertOnScreen(calls, 'no art')
  }
})

check('the win screen draws for P1, P2, a Perfect and a draw', () => {
  const roster: [FighterData, FighterData] = [ZUZU, COYOTE]
  const art: [LoadedSprites, LoadedSprites] = [
    sheets.zuzu!,
    sheets['coyote-vagrant']!,
  ]
  const outcomes: Array<(s: MatchState) => void> = [
    (s) => {
      s.winner = 0
      s.fighters[0].health = 10
    },
    (s) => {
      s.winner = 1
      s.fighters[1].health = 10
    },
    (s) => {
      s.winner = 0
      s.fighters[0].health = ZUZU.health
    },
    (s) => {
      s.winner = 'draw'
    },
  ]
  for (const outcome of outcomes) {
    const s = createMatch(roster)
    s.phase = 'over'
    outcome(s)
    for (const t of [0, 5, 30]) {
      const { g, calls } = stubContext()
      drawWinScreen(g, s, roster, art, t, false)
      assertOnScreen(calls, `win ${String(s.winner)} t${t}`)
    }
  }
})

console.log(`verifyZuzuShowdownScreens: ${passed} checks passed`)
