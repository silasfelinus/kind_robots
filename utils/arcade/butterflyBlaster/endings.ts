// /utils/arcade/butterflyBlaster/endings.ts
//
// The season's endings (conductor kr-arcade/t-057, CABINETS.md section 6 "Finale" and "Secret
// region"):
//
//   Dawn       the sun comes up on the dry season, every village along the river waves its
//              lanterns, and the credits roll.
//   Zero Night the true ending, after the Moonlit Lagoon: a festival for a whole season in which
//              nobody was bitten.

import { drawText } from '../font'
import { INK, RAMPS, bandedGradient, glow, mix, rgba } from '../snes'
import { renderButterfly, renderFairy } from './art'
import type { EndingKind } from './season'
import { GROUND, H, W } from './sky'

/** The credits run this long before the river moves on (A skips them after two seconds). */
export const CREDITS_TICKS = 60 * 32
export const SKIP_AFTER = 120

export function creditLines(kind: EndingKind, threads: number): string[] {
  const head =
    kind === 'zero'
      ? ['ZERO NIGHT', 'A WHOLE SEASON', 'AND NOBODY BITTEN', '']
      : ['THE RAINS ARE OVER', 'EVERY VILLAGE WAVES', 'ITS LANTERNS', '']
  const tail =
    kind === 'zero'
      ? ['THE TRUE ENDING', 'THANK YOU FOR', 'KEEPING WATCH']
      : threads >= 6
        ? ['SIX GOLDEN THREADS', 'THE MOONLIT LAGOON', 'IS OPEN']
        : [
            `GOLDEN THREADS ${threads}/6`,
            'FIND ALL SIX FOR',
            'THE MOONLIT LAGOON',
          ]
  return [
    ...head,
    'BUTTERFLY BLASTER',
    'THE RAINY SEASON',
    '',
    'A KIND ROBOTS ARCADE',
    'CABINET FOR THE',
    'AGAINST MALARIA PROJECT',
    '',
    'STARRING',
    'THE RAINBOW BUTTERFLY',
    'AMI, THE ANTI-MALARIA',
    'INTELLIGENCE',
    'THE BATS, DRAGONFLIES',
    'AND SWALLOWS',
    'THE VILLAGES OF THE RIVER',
    '',
    'AT HOME, AS ON THE RIVER:',
    'SLEEP UNDER A BED NET',
    'TIP OUT STANDING WATER',
    '',
    ...tail,
    '',
    'THE DRY SEASON IS OPEN',
  ]
}

export function renderEnding(
  g: CanvasRenderingContext2D,
  kind: EndingKind,
  t: number,
  threads: number,
  tick: number,
) {
  // Sunrise (or, for Zero Night, a festival night of lanterns).
  const bands =
    kind === 'zero'
      ? [
          RAMPS.night[0],
          RAMPS.night[1],
          RAMPS.purple[0],
          mix(RAMPS.purple[1], RAMPS.pink[1], 0.5),
        ]
      : [
          RAMPS.sky[1],
          RAMPS.sky[2],
          mix(RAMPS.sky[3], RAMPS.pink[2], 0.5),
          RAMPS.gold[3],
          RAMPS.gold[4],
        ]
  bandedGradient(g, 0, 0, W, GROUND, bands, 8)
  if (kind === 'dawn') {
    const sun = Math.min(1, t / 240)
    glow(g, W / 2, GROUND - 10 - sun * 40, 120, RAMPS.gold[4], 0.7)
    g.fillStyle = RAMPS.gold[4]
    g.beginPath()
    g.arc(W / 2, GROUND - 10 - sun * 40, 26, Math.PI, 0)
    g.fill()
  }
  // Lanterns strung across the sky for the festival.
  for (let i = 0; i < 18; i++) {
    const x = 14 + i * 26
    const y = 40 + Math.sin(i * 0.7) * 10 + Math.sin(tick / 30 + i) * 2
    glow(g, x, y, 12, RAMPS.gold[3], kind === 'zero' ? 0.6 : 0.3)
    g.fillStyle = INK
    g.fillRect(x - 3, y - 4, 7, 8)
    g.fillStyle = [RAMPS.ember[2], RAMPS.gold[3], RAMPS.pink[2], RAMPS.teal[2]][
      i % 4
    ]!
    g.fillRect(x - 2, y - 3, 5, 6)
  }
  // The ground, and the village waving its lanterns.
  g.fillStyle = mix(RAMPS.earth[1], RAMPS.night[1], kind === 'zero' ? 0.5 : 0.1)
  g.fillRect(0, GROUND, W, H - GROUND)
  for (let i = 0; i < 12; i++) {
    const x = 20 + i * 40
    const wave = Math.sin(tick / 10 + i) * 4
    g.fillStyle = INK
    g.fillRect(x - 3, GROUND - 14, 6, 14)
    g.fillStyle = RAMPS.earth[3]
    g.fillRect(x - 2, GROUND - 13, 4, 4)
    g.fillStyle = RAMPS.sky[2]
    g.fillRect(x - 2, GROUND - 9, 4, 8)
    g.fillStyle = INK
    g.fillRect(x + 2, GROUND - 22 + wave, 1, 10)
    glow(g, x + 3, GROUND - 24 + wave, 10, RAMPS.gold[3], 0.6)
    g.fillStyle = RAMPS.gold[3]
    g.fillRect(x + 1, GROUND - 26 + wave, 4, 4)
  }
  // The butterfly and AMI fly a lap of honour.
  const bx = ((t * 1.4) % (W + 80)) - 40
  renderButterfly(g, bx, 120 + Math.sin(t / 20) * 16, Math.PI / 2, t / 3)
  renderFairy(g, bx - 40, 132 + Math.sin(t / 18) * 10, 1, false, tick)
  // The credits roll up the middle.
  const lines = creditLines(kind, threads)
  const top = H - t * 0.45
  g.save()
  g.fillStyle = rgba(INK, 0.35)
  g.fillRect(W / 2 - 150, 0, 300, H)
  g.restore()
  lines.forEach((line, i) => {
    const y = top + i * 22
    if (y < 64 || y > H - 20) return
    drawText(g, line, W / 2, y, {
      scale: i < 3 ? 2 : 1,
      align: 'center',
      color: i < 3 ? '#ffffff' : RAMPS.cream[3],
      outline: INK,
    })
  })
  if (t > SKIP_AFTER && Math.floor(tick / 20) % 2 === 0)
    drawText(g, 'A: ON DOWN THE RIVER', W - 10, H - 14, {
      align: 'right',
      color: RAMPS.gold[4],
      outline: INK,
    })
}
