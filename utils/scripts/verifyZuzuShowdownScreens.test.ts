// /utils/scripts/verifyZuzuShowdownScreens.test.ts
//
// Zuzu Showdown taunt screens (conductor zuzu-showdown t-019): the matchup lines ported from
// conductor's matchups.yaml are complete (36 intros, 64 win quotes, the boss lines), each intro is
// oriented to the side that speaks it (mirrors alternate), the VS screen plays its lines on schedule
// and shows them all at once under reduced motion, quotes wrap inside their column, and both the VS
// screen and the win screen draw every frame at finite, on-screen coordinates for every outcome. The
// t-008 portraits are indexed for real fighters, ship in both render styles at their indexed size, and
// the screens draw them where they have loaded and the sprites where they haven't.
//
//   npx tsx utils/scripts/verifyZuzuShowdownScreens.test.ts

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { measureText } from '../arcade/font'
import { FIGHTERS, findFighter } from '../zuzuShowdown/fighters'
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
  drawSelectScreen,
  drawVsScreen,
  drawWinScreen,
  vsDuration,
  vsLinesShown,
  selectCard,
  selectPromptY,
  wrapText,
} from '../zuzuShowdown/screens'
import {
  SELECT_COLUMNS,
  activeSide,
  advanceSelect,
  newSelect,
  selectDone,
  type SelectPress,
} from '../zuzuShowdown/select'
import { VIEW_HEIGHT, VIEW_WIDTH } from '../zuzuShowdown/render'
import { createMatch } from '../zuzuShowdown/sim'
import {
  SPRITE_FIGHTERS,
  spriteFile,
  type LoadedSprites,
  type SpriteSheet,
} from '../zuzuShowdown/sprites'
import type { FighterData, MatchState } from '../zuzuShowdown/types'
import {
  PORTRAIT_KINDS,
  PORTRAIT_ROOT,
  P2_PORTRAIT_FILTER,
  portraitFighters,
  portraitInfo,
  portraitUrl,
  type LoadedPortraits,
} from '../zuzuShowdown/portraits'

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
    rect: record('rect'),
    clip: record('clip'),
    strokeRect: record('strokeRect'),
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

check(
  'character select: cursors wrap, picks lock, one player picks both',
  () => {
    const slugs = FIGHTERS.map((f) => f.slug)
    const n = slugs.length
    const press = (p: SelectPress): [SelectPress, SelectPress] => [p, {}]
    let s = newSelect(slugs, ['zuzu', 'coyote-vagrant'])
    assert.deepEqual(s.cursor, [0, 1], 'on the current fighters')
    // Left from the first card wraps to the last; up from the top row to the bottom.
    s = advanceSelect(s, press({ left: true }), n, false)
    assert.equal(s.cursor[0], n - 1)
    s = advanceSelect(s, press({ down: true }), n, false)
    assert.equal(s.cursor[0], (n - 1 + SELECT_COLUMNS) % n)
    // One player: LP picks their fighter, then the same stick moves the opponent's cursor.
    s = advanceSelect(s, press({ lp: true }), n, false)
    assert.ok(s.picked[0] && activeSide(s) === 1)
    const mine = s.cursor[0]
    s = advanceSelect(s, press({ right: true }), n, false)
    assert.equal(s.cursor[0], mine, 'their pick stays put')
    assert.equal(s.cursor[1], 2)
    // HP goes back to their own pick; picking twice finishes.
    s = advanceSelect(s, press({ hp: true }), n, false)
    assert.ok(!s.picked[0] && !selectDone(s))
    s = advanceSelect(s, press({ start: true }), n, false)
    s = advanceSelect(s, press({ lp: true }), n, false)
    assert.ok(selectDone(s))
    // Two players: each drives their own cursor at once.
    let v = newSelect(slugs, ['zuzu', 'zuzu'])
    v = advanceSelect(v, [{ right: true }, { left: true }], n, true)
    assert.deepEqual(v.cursor, [1, n - 1])
    v = advanceSelect(v, [{ lp: true }, {}], n, true)
    v = advanceSelect(v, [{ right: true }, { lp: true }], n, true)
    assert.equal(v.cursor[0], 1, 'a picked cursor stays')
    assert.ok(selectDone(v))
  },
)

check(
  'the select screen draws every fighter on screen, with art and without',
  () => {
    for (let i = 0; i < FIGHTERS.length; i += 1) {
      const card = selectCard(i, FIGHTERS.length)
      assert.ok(
        card.x >= 120 && card.x + card.w <= VIEW_WIDTH - 120,
        'between the fighters',
      )
      assert.ok(
        card.y + card.h < selectPromptY(FIGHTERS.length),
        'prompt below',
      )
    }
    // The prompt (one 8px line) stays on screen.
    assert.ok(selectPromptY(FIGHTERS.length) + 8 <= VIEW_HEIGHT)
    for (const art of [sheets, {}]) {
      for (const twoPlayers of [false, true]) {
        let s = newSelect(
          FIGHTERS.map((f) => f.slug),
          ['zuzu', 'the-siblings'],
        )
        for (let t = 0; t < 60; t += 1) {
          const { g, calls } = stubContext()
          drawSelectScreen(g, FIGHTERS, art, s, false, twoPlayers, 'CPU')
          assertOnScreen(calls, `select t${t}`)
          s = advanceSelect(
            s,
            [{ right: t % 7 === 0 }, { left: t % 5 === 0 }],
            FIGHTERS.length,
            twoPlayers,
          )
        }
      }
    }
  },
)

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

// ---------------------------------------------------------------- portraits

const publicFile = (url: string) => join(process.cwd(), 'public', url)

check(
  'every portrait is a fighter’s and ships in both styles at its size',
  () => {
    const slugs = FIGHTERS.map((f) => f.slug)
    let count = 0
    for (const slug of portraitFighters()) {
      assert.ok(slugs.includes(slug), `${slug} is a fighter`)
      for (const kind of PORTRAIT_KINDS) {
        const info = portraitInfo(slug, kind)
        if (!info) continue
        count += 1
        const png = readFileSync(publicFile(portraitUrl(info, 'pixel')))
        // The PNG header's IHDR carries the size at bytes 16-23.
        assert.equal(png.readUInt32BE(16), info.w, `${info.file} width`)
        assert.equal(png.readUInt32BE(20), info.h, `${info.file} height`)
        const webp = readFileSync(publicFile(portraitUrl(info, 'hd')))
        assert.equal(webp.toString('ascii', 8, 12), 'WEBP', info.file)
        assert.ok(portraitUrl(info, 'hd').startsWith(PORTRAIT_ROOT))
      }
    }
    // Every fighter on the select screen has a bust card; most of the 36 are drawn.
    for (const slug of slugs)
      assert.ok(portraitInfo(slug, 'bust'), `${slug} bust`)
    assert.ok(count >= 30, `${count} portraits`)
  },
)

check('the screens draw portraits where loaded, sprites where not', () => {
  const image = {} as CanvasImageSource
  const portraits: LoadedPortraits = Object.fromEntries(
    portraitFighters().map((slug) => [
      slug,
      Object.fromEntries(
        PORTRAIT_KINDS.filter((k) => portraitInfo(slug, k)).map((k) => [
          k,
          image,
        ]),
      ),
    ]),
  )
  const roster: [FighterData, FighterData] = [ZUZU, COYOTE]
  const sized = (calls: Call[], w: number, h: number) =>
    calls.filter(
      (c) =>
        c.op === 'drawImage' &&
        c.args.length === 4 &&
        Math.abs(c.args[2]! - w) < 0.01 &&
        Math.abs(c.args[3]! - h) < 0.01,
    ).length
  const vs = portraitInfo('zuzu', 'vs')!
  const both = stubContext()
  drawVsScreen(both.g, roster, [undefined, undefined], 30, false, portraits)
  assertOnScreen(both.calls, 'vs portraits')
  assert.equal(sized(both.calls, vs.w, vs.h), 2, 'both VS portraits')
  // A fighter with no portrait loaded falls back to the sprite.
  const half = stubContext()
  drawVsScreen(
    half.g,
    roster,
    [sheets.zuzu, sheets['coyote-vagrant']],
    30,
    false,
    {
      zuzu: portraits.zuzu,
    },
  )
  assert.equal(sized(half.calls, vs.w, vs.h), 1, 'one VS portrait')
  assert.ok(half.calls.filter((c) => c.op === 'drawImage').length > 1)

  // A mirror match: P2's portrait (only P2's) turns to P2's colours.
  const mirror = stubContext()
  const filters: string[] = []
  const g = mirror.g as unknown as {
    filter: string
    drawImage: (...args: unknown[]) => void
  }
  g.filter = 'none'
  g.drawImage = (...args: unknown[]) => {
    if (args.length === 5) filters.push(g.filter)
  }
  const twins: [FighterData, FighterData] = [ZUZU, ZUZU]
  drawVsScreen(mirror.g, twins, [undefined, undefined], 30, false, portraits)
  assert.deepEqual(filters, ['none', P2_PORTRAIT_FILTER], 'P2 recoloured')

  const s = createMatch(roster)
  s.phase = 'over'
  s.winner = 0
  s.fighters[0].health = 10
  const win = stubContext()
  drawWinScreen(win.g, s, roster, [undefined, undefined], 30, false, portraits)
  assertOnScreen(win.calls, 'win portraits')
  const victory = portraitInfo('zuzu', 'victory')!
  const beaten = portraitInfo('coyote-vagrant', 'beaten')!
  assert.equal(sized(win.calls, victory.w, victory.h), 1, 'victory portrait')
  assert.equal(
    sized(win.calls, beaten.w * 0.45, beaten.h * 0.45),
    1,
    'beaten portrait',
  )

  const select = stubContext()
  drawSelectScreen(
    select.g,
    FIGHTERS,
    {},
    newSelect(
      FIGHTERS.map((f) => f.slug),
      ['zuzu', 'coyote-vagrant'],
    ),
    false,
    false,
    'CPU',
    portraits,
  )
  assertOnScreen(select.calls, 'select portraits')
  const bust = portraitInfo('zuzu', 'bust')!
  assert.equal(sized(select.calls, bust.w, bust.h), FIGHTERS.length, 'busts')
})

console.log(`verifyZuzuShowdownScreens: ${passed} checks passed`)
