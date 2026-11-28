import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  RAINBOW_HUD,
  RAINBOW_HUD_LEGENDS,
  RAINBOW_SHIP_HULL,
  RAINBOW_SUPER_CAPTION_SIZE,
  RAINBOW_SEAT_TAG_RADIUS,
  rainbowHudBarLayout,
  rainbowRectsTouch,
  rainbowShipLabels,
  rainbowShownPopups,
  stepRainbowPopups,
  type RainbowPopup,
  type RainbowRect,
} from '../arcade/games/rainbowHudLayout'

// Presentation critic round 2 (rainbow-presentation-critic-r2.md): on-canvas words never collide.
// R2-01: the Act I legend ran into the pilot status ("Y EVADEPETAL"). R2-02: two segment banners drew at
// once ("ACT V · GOLD MEDAL" over "TURN ON THE EMPIRE"). R2-04: in 3-4p co-op each ship's "SUPER READY ·
// TAP B" caption and seat number piled over the play area.

const engine = readFileSync(
  new URL('../arcade/games/rainbowPrincessPreview.ts', import.meta.url),
  'utf8',
)

/** A monospace font's advance: 0.6 em a cell (wider than Chromium's 0.602 only for the symbols). */
function monospace(cell: number, symbol: number) {
  return (text: string, font: string) => {
    const px = Number(/(\d+)px/.exec(font)![1])
    let width = 0
    for (const char of text)
      width += (/[\x20-\x7e·]/.test(char) ? cell : symbol) * px
    return width
  }
}

const TITLES = [
  'ACT I / PINKWAKE',
  'ACT IV / EXPRESS',
  'ACT VII / GLASS CURRENT',
  'ACT VIII / ECLIPSE PALACE',
  'FINALE / ECLIPSE CROWN',
  'X3 / SUNKEN LIGHTHOUSE',
]
const NAMES = ['PETAL', 'PRISM', 'HALO', 'COMET']
/** The widest a status gets: five lives, four shields, full power, a charged super, both moves ready. */
const widest = (seat: number) => `${NAMES[seat]} 5♥ 4◇ P4 SUPER X Y`
const narrow = (seat: number) => `${NAMES[seat]} 1♥ 0◇ P1 0%`

for (const measure of [monospace(0.6, 0.6), monospace(0.62, 1)])
  for (let players = 1; players <= 4; players++)
    for (const title of TITLES)
      for (const status of [widest, narrow])
        for (const [shoals, novas] of [
          [0, 0],
          [999, 99],
        ] as const) {
          const label = `${players}p ${title} ${status(0)} ${shoals}`
          const bar = rainbowHudBarLayout({
            players,
            title,
            shoals,
            novas,
            statuses: Array.from({ length: players }, (_, seat) =>
              status(seat),
            ),
            legend: true,
            measure,
          })
          for (const [index, item] of bar.entries()) {
            assert.ok(
              item.rect.left >= RAINBOW_HUD.left - 0.01 &&
                item.rect.right <= RAINBOW_HUD.right + 0.01,
              `${label}: ${item.role} stays between the corner chips`,
            )
            for (const other of bar.slice(index + 1))
              if (other.y === item.y)
                assert.ok(
                  !rainbowRectsTouch(item.rect, other.rect, RAINBOW_HUD.gap),
                  `${label}: "${item.text}" and "${other.text}" never touch`,
                )
          }
          assert.equal(
            bar.filter((item) => item.role === 'status').length,
            players,
            `${label}: every pilot's status shows`,
          )
          assert.ok(
            bar.some((item) => item.role === 'title'),
            `${label}: the Act is named`,
          )
          if (players === 1)
            assert.ok(
              bar.some(
                (item) =>
                  item.role === 'legend' && item.text.endsWith('Y EVADE'),
              ),
              `${label}: a solo pilot is taught all four buttons`,
            )
          if (players <= 2)
            assert.ok(
              bar.some((item) => item.role === 'counters'),
              `${label}: shoals and novas show`,
            )
        }

// The legend that collided in the review, measured the same way, shortens rather than touching.
{
  const bar = rainbowHudBarLayout({
    players: 1,
    title: 'ACT I / PINKWAKE',
    shoals: 274,
    novas: 0,
    statuses: ['PETAL 3♥ 3◇ P3 100% X Y'],
    legend: true,
    measure: monospace(0.602, 0.602),
  })
  const legend = bar.find((item) => item.role === 'legend')!
  const status = bar.find((item) => item.role === 'status')!
  assert.notEqual(
    legend.text,
    RAINBOW_HUD_LEGENDS[0],
    'the long legend steps aside',
  )
  assert.ok(legend.rect.right + RAINBOW_HUD.gap <= status.rect.left)
}

// R2-02: banners queue. A medal and the allegiance pushed on one frame show one at a time, each for its full life.
{
  const LIFE = 50
  const popups: RainbowPopup[] = [
    { x: 240, y: 96, text: 'ACT V · GOLD MEDAL', age: 0, headline: true },
    { x: 240, y: 92, text: 'TURN ON THE EMPIRE', age: 0, headline: true },
    { x: 90, y: 140, text: 'POWER UP', age: 0 },
  ]
  const shownFor: Record<string, number> = {}
  for (let frame = 0; frame < 200; frame++) {
    const shown = rainbowShownPopups(popups)
    assert.ok(
      shown.filter((popup) => popup.headline).length <= 1,
      `frame ${frame}: at most one banner`,
    )
    for (const popup of shown)
      shownFor[popup.text] = (shownFor[popup.text] ?? 0) + 1
    if (frame === 20)
      popups.push({
        x: 240,
        y: 92,
        text: 'X4 · MIRROR SHOAL',
        age: 0,
        headline: true,
      })
    stepRainbowPopups(popups, LIFE)
  }
  assert.equal(popups.length, 0, 'every popup is spent')
  for (const text of [
    'ACT V · GOLD MEDAL',
    'TURN ON THE EMPIRE',
    'X4 · MIRROR SHOAL',
  ])
    assert.ok(shownFor[text]! >= LIFE, `${text} gets its full time`)
  assert.ok(
    shownFor['POWER UP']! >= LIFE && shownFor['POWER UP']! < LIFE + 2,
    'a local popup never waits behind a banner',
  )
}
// Every centred segment banner in the engine goes through the queue.
assert.match(engine, /function announce\(text: string, y = 92\)/)
assert.match(engine, /headline: true/)
assert.doesNotMatch(
  engine,
  /popups\.push\(\{\s*x: W \/ 2,\s*y: \d+/,
  'no centred banner skips the queue',
)
assert.match(engine, /stepRainbowPopups\(popups, POPUP_FRAMES\)/)
assert.match(engine, /rainbowShownPopups\(popups\)/)

// R2-04: seat tags and super captions never land on another ship, another tag or a caption.
const around = (x: number, y: number, box: RainbowRect): RainbowRect => ({
  left: x + box.left,
  top: y + box.top,
  right: x + box.right,
  bottom: y + box.bottom,
})
const formations: Array<[string, Array<[number, number]>]> = [
  [
    'the launch line',
    [
      [65, 80],
      [65, 112],
      [65, 144],
      [65, 176],
    ],
  ],
  [
    'the review pile (X2)',
    [
      [65, 102],
      [65, 155],
      [65, 190],
      [65, 174],
    ],
  ],
  [
    'a tight stack',
    [
      [80, 100],
      [80, 116],
      [80, 132],
      [80, 148],
    ],
  ],
  [
    'two hulls overlapping',
    [
      [100, 120],
      [102, 124],
      [60, 60],
      [140, 200],
    ],
  ],
  [
    'a diagonal',
    [
      [60, 60],
      [80, 80],
      [100, 100],
      [120, 120],
    ],
  ],
  [
    'against the top',
    [
      [40, 34],
      [80, 34],
      [120, 34],
      [160, 34],
    ],
  ],
]
for (const [name, spots] of formations)
  for (let players = 1; players <= 4; players++) {
    const ships = spots
      .slice(0, players)
      .map(([x, y]) => ({ x, y, alive: true, ready: true }))
    const labels = rainbowShipLabels(ships, players)
    const hulls = ships.map((ship) => around(ship.x, ship.y, RAINBOW_SHIP_HULL))
    const r = RAINBOW_SEAT_TAG_RADIUS
    const { width, height } = RAINBOW_SUPER_CAPTION_SIZE
    const boxes: Array<[string, number, RainbowRect]> = []
    for (const label of labels) {
      if (label.tag)
        boxes.push([
          `tag ${label.seat + 1}`,
          label.seat,
          around(label.tag.x, label.tag.y, {
            left: -r,
            top: -r,
            right: r,
            bottom: r,
          }),
        ])
      if (label.caption)
        boxes.push([
          `caption ${label.seat + 1}`,
          -1,
          around(label.caption.x, label.caption.y, {
            left: -width / 2,
            top: -height / 2,
            right: width / 2,
            bottom: height / 2,
          }),
        ])
    }
    const where = `${players}p ${name}`
    for (const [index, [what, seat, box]] of boxes.entries()) {
      for (const [hullSeat, hull] of hulls.entries())
        if (hullSeat !== seat)
          assert.ok(
            !rainbowRectsTouch(box, hull),
            `${where}: ${what} stays off ship ${hullSeat + 1}`,
          )
      for (const [other, , otherBox] of boxes.slice(index + 1))
        assert.ok(
          !rainbowRectsTouch(box, otherBox),
          `${where}: ${what} and ${other} never touch`,
        )
    }
    if (players > 2)
      assert.ok(
        labels.every((label) => label.caption === null),
        `${where}: a crew of three or four reads SUPER from its tags and HUD, not captions`,
      )
  }
// Spread out, a solo or duo crew still spells it out, and every pilot keeps a tag.
{
  const labels = rainbowShipLabels(
    [
      { x: 70, y: 80, alive: true, ready: true },
      { x: 70, y: 190, alive: true, ready: true },
    ],
    2,
  )
  assert.ok(labels.every((label) => label.caption && label.tag))
}
assert.ok(
  rainbowShipLabels([{ x: 70, y: 80, alive: false, ready: true }], 1)[0]!
    .tag === null,
  'a downed pilot has no tag',
)
assert.match(
  engine,
  /const charge = ship\.charge >= 100 \? 'SUPER' : `\$\{ship\.charge\}%`/,
  'a charged super reads SUPER in the seat HUD panel',
)

console.log('rainbow HUD, banner and ship-label layout: ok')
