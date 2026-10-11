// /utils/zuzuShowdown/arcadeScreens.ts
//
// Zuzu Showdown Story mode's own screens (conductor zuzu-showdown t-021, the map t-029): the journey
// between fights, the continue countdown after a loss, the ending, the initials entry and the score in
// the corner of a fight. Between fights the wasteland map fills the screen and the next leg of the
// journey draws itself in red, the challenger's token riding it to the next opponent's ground, every
// beaten opponent crossed off (worldMap.ts). The ending shows its two stills with a line under each; a
// still not yet drawn falls back to the fighter's victory portrait. Reduced motion skips the fades and
// shows each route already drawn.

import type { RenderStyle } from '../arcade/display'
import { drawText } from '../arcade/font'
import shipped from './endings.json'
import {
  BOSS_SLUG,
  ENDINGS,
  initialsText,
  type ArcadeScore,
  type InitialsEntry,
} from './arcade'
import { drawPortrait, type LoadedPortraits } from './portraits'
import {
  PLACES,
  drawCrossedOff,
  drawRoute,
  drawToken,
  drawWorldMap,
  homeOf,
  mapToScreen,
  routePoint,
  type MapPoint,
} from './worldMap'
import { VIEW_HEIGHT, VIEW_WIDTH } from './render'
import { wrapText } from './screens'
import type { FighterData } from './types'

type G = CanvasRenderingContext2D

/** Frames each ending still holds before the next (LP skips ahead). */
export const ENDING_STILL_FRAMES = 360
/** Frames a still takes to fade in. */
const FADE_FRAMES = 30
/** Frames the ladder shows before the VS screen. */
export const LADDER_FRAMES = 150
/** Seconds the continue countdown runs. */
export const CONTINUE_SECONDS = 9

/** A number with thousands separators, in the pixel font's characters. */
export function formatScore(score: number): string {
  return Math.floor(score)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** Frames the route takes to draw itself to the next fight. */
export const ROUTE_FRAMES = 90

/** Where the climb stands before `rung`: the challenger's home, then each beaten opponent's ground. */
export function travelLeg(
  player: string,
  ladder: readonly string[],
  rung: number,
): { from: MapPoint; to: MapPoint } {
  const from = rung === 0 ? homeOf(player) : homeOf(ladder[rung - 1]!)
  const to = rung < ladder.length ? homeOf(ladder[rung]!) : homeOf(BOSS_SLUG)
  return { from, to }
}

/**
 * Story mode between fights: the wasteland, the road already travelled in faded red with each beaten
 * opponent crossed off, and the next leg drawing itself as the challenger's token rides it to the next
 * opponent's ground (the Thin Place at the end). `t` counts frames on the screen. At the door,
 * `doorLine` is what the challenger says to it (matchups.yaml boss lines; the Thing answers with
 * nothing).
 */
export function drawTravelScreen(
  g: G,
  player: FighterData,
  ladder: readonly FighterData[],
  rung: number,
  score: ArcadeScore,
  portraits: LoadedPortraits | undefined,
  mapArt: CanvasImageSource | undefined,
  t: number,
  reduced: boolean,
  doorLine?: string,
): void {
  const r = { x: 0, y: 0, w: VIEW_WIDTH, h: VIEW_HEIGHT }
  drawWorldMap(g, r, mapArt, true)
  const slugs = ladder.map((f) => f.slug)
  // The road so far, faded.
  let at = homeOf(player.slug)
  for (let i = 0; i < Math.min(rung, slugs.length); i += 1) {
    const next = homeOf(slugs[i]!)
    drawRoute(g, r, at, next, 1, false)
    at = next
  }
  // Opponents still ahead wait small and dim at home; the beaten are crossed off.
  slugs.forEach((slug, i) => {
    const p = mapToScreen(homeOf(slug), r)
    if (i < rung) drawCrossedOff(g, p.x, p.y, 10)
    else if (i > rung) {
      g.save()
      g.globalAlpha = 0.65
      drawToken(g, portraits, slug, p.x, p.y, 14, '#78716c')
      g.restore()
    }
  })
  const { from, to } = travelLeg(player.slug, slugs, rung)
  const progress = reduced
    ? 1
    : Math.min(1, Math.max(0, (t - 10) / ROUTE_FRAMES))
  // The next opponent (or the door) waits at the end of the leg, ringed.
  const dest = mapToScreen(to, r)
  const pulse = reduced ? 0 : Math.round(Math.sin(t / 6) * 2)
  if (rung < slugs.length)
    drawToken(g, portraits, slugs[rung]!, dest.x, dest.y, 24 + pulse, '#fb923c')
  else {
    g.strokeStyle = '#a855f7'
    g.lineWidth = 2
    g.beginPath()
    g.arc(dest.x, dest.y - 4, 13 + pulse, 0, Math.PI * 2)
    g.stroke()
  }
  drawRoute(g, r, from, to, progress, true)
  // The rider pulls up just short, so the opponent waiting there stays in sight.
  const rider = mapToScreen(routePoint(from, to, progress * 0.86), r)
  drawToken(g, portraits, player.slug, rider.x, rider.y, 22, '#fde68a')

  // The header and footer bands.
  g.fillStyle = 'rgba(28, 25, 23, 0.82)'
  g.fillRect(0, 0, VIEW_WIDTH, 20)
  g.fillRect(0, VIEW_HEIGHT - 34, VIEW_WIDTH, 34)
  const count = slugs.length + 1
  drawText(g, `STORY - ${player.name.toUpperCase()}`, 6, 6, {
    color: '#fdba74',
    shadow: '#000000',
  })
  drawText(
    g,
    `FIGHT ${Math.min(rung + 1, count)} OF ${count}   ${formatScore(score.total)}`,
    VIEW_WIDTH - 6,
    6,
    { align: 'right', color: '#fde047', shadow: '#000000' },
  )
  const next =
    rung < slugs.length
      ? `NEXT: ${ladder[rung]!.name.toUpperCase()}`
      : 'NEXT: THE THING BEHIND THE DOOR'
  drawText(g, next, VIEW_WIDTH / 2, VIEW_HEIGHT - 30, {
    align: 'center',
    color: '#ffffff',
    shadow: '#000000',
  })
  const line = doorLine ?? placeNameAt(to)
  if (line)
    wrapText(line, VIEW_WIDTH - 40, 1)
      .slice(0, 1)
      .forEach((text) =>
        drawText(g, text, VIEW_WIDTH / 2, VIEW_HEIGHT - 16, {
          align: 'center',
          color: doorLine ? '#e9d5ff' : '#d6d3d1',
          shadow: '#000000',
        }),
      )
}

/** The named place at (or nearest) a point, for the travel screen's footer. */
function placeNameAt(p: MapPoint): string {
  let best = ''
  let bestD = Infinity
  for (const place of Object.values(PLACES)) {
    const d = (place.x - p.x) ** 2 + (place.y - p.y) ** 2
    if (d < bestD) {
      bestD = d
      best = place.name
    }
  }
  return bestD < 1e-4 ? best : `NEAR ${best}`
}

/** After a loss: the countdown, with `t` frames gone. */
export function drawContinueScreen(g: G, score: ArcadeScore, t: number): void {
  g.fillStyle = 'rgba(0, 0, 0, 0.75)'
  g.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)
  const left = Math.max(0, CONTINUE_SECONDS - Math.floor(t / 60))
  drawText(g, 'CONTINUE?', VIEW_WIDTH / 2, 70, {
    align: 'center',
    scale: 3,
    color: '#fdba74',
    shadow: '#000000',
  })
  drawText(g, String(left), VIEW_WIDTH / 2, 112, {
    align: 'center',
    scale: 4,
    color: '#ffffff',
    shadow: '#000000',
  })
  drawText(g, 'PRESS START OR LP', VIEW_WIDTH / 2, 176, {
    align: 'center',
    color: '#fde047',
  })
  drawText(
    g,
    `THE SCORE STARTS OVER (${formatScore(score.total)})`,
    VIEW_WIDTH / 2,
    196,
    { align: 'center', color: '#d6d3d1' },
  )
}

/** Loaded ending stills, by file stem (arcade.ts ENDINGS). */
export type LoadedEndings = Partial<Record<string, CanvasImageSource>>

/** Where the ending stills are served from (conductor tools/endings.py ships them). */
export const ENDING_ROOT = '/zuzu-showdown-endings'

/** The ending stills that have shipped (endings.json); the rest fall back to the portrait. */
export function shippedEndings(): readonly string[] {
  return shipped as string[]
}

export function endingUrl(file: string, style: RenderStyle): string {
  return `${ENDING_ROOT}/${file}-${style === 'hd' ? 'hd.webp' : 'pixel.png'}`
}

/** Which still the ending is on after `t` frames (2 once both have played). */
export function endingStill(t: number): number {
  return Math.min(2, Math.floor(t / ENDING_STILL_FRAMES))
}

/** The ending of `fighter`, `t` frames in. */
export function drawEndingScreen(
  g: G,
  fighter: FighterData,
  endings: LoadedEndings | undefined,
  portraits: LoadedPortraits | undefined,
  t: number,
  reduced: boolean,
): void {
  g.fillStyle = '#000000'
  g.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)
  const stills = ENDINGS[fighter.slug]
  if (!stills) return
  const index = endingStill(t) >= 1 ? 1 : 0
  const still = stills[index]
  const into = t - index * ENDING_STILL_FRAMES
  const alpha = reduced ? 1 : Math.min(1, into / FADE_FRAMES)
  g.save()
  g.globalAlpha = alpha
  const image = endings?.[still.file]
  if (image) g.drawImage(image, 0, 0, VIEW_WIDTH, VIEW_HEIGHT)
  else
    drawPortrait(
      g,
      portraits,
      fighter.slug,
      'victory',
      VIEW_WIDTH / 2,
      VIEW_HEIGHT - 50,
    )
  g.fillStyle = 'rgba(0, 0, 0, 0.7)'
  g.fillRect(0, VIEW_HEIGHT - 44, VIEW_WIDTH, 44)
  wrapText(still.line, VIEW_WIDTH - 40, 1).forEach((line, i) =>
    drawText(g, line, VIEW_WIDTH / 2, VIEW_HEIGHT - 32 + i * 12, {
      align: 'center',
      color: '#ffffff',
      shadow: '#000000',
    }),
  )
  g.restore()
}

/** The run's end: the score, the tallies and the initials being entered. */
export function drawInitialsScreen(
  g: G,
  score: ArcadeScore,
  entry: InitialsEntry,
  cleared: boolean,
  t: number,
  reduced: boolean,
): void {
  g.fillStyle = '#120c18'
  g.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)
  drawText(g, cleared ? 'THE DOOR IS SHUT' : 'GAME OVER', VIEW_WIDTH / 2, 28, {
    align: 'center',
    scale: 3,
    color: cleared ? '#86efac' : '#fca5a5',
    shadow: '#000000',
  })
  drawText(g, `SCORE ${formatScore(score.total)}`, VIEW_WIDTH / 2, 70, {
    align: 'center',
    scale: 2,
    color: '#fde047',
    shadow: '#000000',
  })
  drawText(
    g,
    `FIGHTS ${score.fights}  PERFECTS ${score.perfects}  READS ${score.reads}  BEST COMBO ${score.bestCombo}`,
    VIEW_WIDTH / 2,
    98,
    { align: 'center', color: '#d6d3d1' },
  )
  drawText(g, 'ENTER YOUR INITIALS', VIEW_WIDTH / 2, 132, {
    align: 'center',
    color: '#ffffff',
  })
  const text = initialsText(entry)
  for (let i = 0; i < 3; i += 1) {
    const x = VIEW_WIDTH / 2 - 36 + i * 36
    const active = i === entry.pos
    drawText(g, text[i]!, x, 152, {
      align: 'center',
      scale: 3,
      color: active ? '#fb923c' : '#ffffff',
      shadow: '#000000',
    })
    if (active && (reduced || t % 30 < 20)) {
      g.fillStyle = '#fb923c'
      g.fillRect(x - 10, 180, 20, 3)
    }
  }
  drawText(g, 'UP/DOWN LETTER - LP NEXT - HP BACK', VIEW_WIDTH / 2, 206, {
    align: 'center',
    color: '#a8a29e',
  })
}

/** The score and the fight's place on the ladder, along the bottom edge of a fight. */
export function drawArcadeHud(
  g: G,
  score: ArcadeScore,
  rung: number,
  fights: number,
): void {
  drawText(
    g,
    `${formatScore(score.total)}  ${Math.min(rung + 1, fights)}/${fights}`,
    VIEW_WIDTH / 2,
    VIEW_HEIGHT - 12,
    { align: 'center', color: '#fde047', shadow: '#000000' },
  )
}
