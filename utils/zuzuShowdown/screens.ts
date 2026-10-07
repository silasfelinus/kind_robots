// /utils/zuzuShowdown/screens.ts
//
// Zuzu Showdown taunt screens (conductor zuzu-showdown t-019, first slice): the VS screen before the
// fight and the win screen after it. The VS screen splits warm and cool, slams both fighters in from
// the sides with a white flash, pops VS, and plays the matchup's intro exchange line by line, each on
// its speaker's side. The win screen stands the winner in their victory pose (the Perfect pose for a
// flawless win) and gives their quote to the loser. Until t-008's portraits land, the fighters are
// their own sprites, enlarged. Reduced motion skips the slide and the flash and shows every line at
// once.

import { drawText, measureText } from '../arcade/font'
import { introFor, winQuote, type MatchupLine } from './matchups'
import { VIEW_HEIGHT, VIEW_WIDTH } from './render'
import { drawSprite, type LoadedSprites } from './sprites'
import type { FighterData, MatchState } from './types'

type G = CanvasRenderingContext2D
type Pair<T> = [T, T]

/** Frames before the first line, and between lines. */
export const VS_SLAM_FRAMES = 16
export const VS_FIRST_LINE = 40
export const VS_LINE_FRAMES = 70
/** The VS screen holds this long after its last line before the fight starts by itself. */
export const VS_HOLD_FRAMES = 60

const SIDE_COLOURS: Pair<string> = ['#fde68a', '#bae6fd']
const FIGHTER_TOP = 46
const FIGHTER_FLOOR = 196
const LINES_TOP = 222

/** How long the VS screen runs for a matchup: every line shown, then a short hold. */
export function vsDuration(lines: number): number {
  return (
    VS_FIRST_LINE + Math.max(0, lines - 1) * VS_LINE_FRAMES + VS_HOLD_FRAMES
  )
}

/** The intro lines shown `t` frames into the VS screen. */
export function vsLinesShown(
  t: number,
  lines: number,
  reduced: boolean,
): number {
  if (reduced) return lines
  if (t < VS_FIRST_LINE) return 0
  return Math.min(lines, 1 + Math.floor((t - VS_FIRST_LINE) / VS_LINE_FRAMES))
}

/** Words wrapped to lines no wider than `width` pixels in the pixel font. */
export function wrapText(text: string, width: number, scale = 1): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word
    if (line && measureText(next, scale) > width) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

/** A fighter's sprite enlarged to fit the screen's fighter band, its feet on `floor`. */
function drawFighterBig(
  g: G,
  sprites: LoadedSprites | undefined,
  data: FighterData,
  names: string[],
  last: boolean,
  x: number,
  floor: number,
  facing: 1 | -1,
  p2: boolean,
): void {
  const sheet = sprites?.sheet
  const name = names.find((n) => sheet?.animations[n]?.frames.length)
  if (!sprites || !sheet || !name) {
    // No art yet: a silhouette block of the fighter's height.
    const h = Math.min(FIGHTER_FLOOR - FIGHTER_TOP, data.hurtStand.h * 1.6)
    g.fillStyle = data.look?.body ?? '#57534e'
    g.fillRect(x - 20, floor - h, 40, h)
    return
  }
  const anim = sheet.animations[name]!
  const frame = anim.frames[last ? anim.frames.length - 1 : 0]!
  const zoom = Math.min(2, (FIGHTER_FLOOR - FIGHTER_TOP) / sheet.height)
  g.save()
  g.translate(x, floor)
  g.scale(zoom, zoom)
  drawSprite(
    g,
    p2 && sprites.p2 ? sprites.p2 : sprites.image,
    frame,
    sheet.scale,
    0,
    0,
    facing,
  )
  g.restore()
}

/**
 * The VS screen, `t` frames in. `sprites` are each side's loaded art; in a mirror match P2 wears the
 * alternate colours.
 */
export function drawVsScreen(
  g: G,
  roster: Pair<FighterData>,
  sprites: Pair<LoadedSprites | undefined>,
  t: number,
  reduced: boolean,
): void {
  const mirror = roster[0].slug === roster[1].slug
  // Two halves, warm and cool, split on a slant.
  g.fillStyle = '#431407'
  g.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)
  g.fillStyle = '#172554'
  g.beginPath()
  g.moveTo(VIEW_WIDTH / 2 + 30, 0)
  g.lineTo(VIEW_WIDTH, 0)
  g.lineTo(VIEW_WIDTH, VIEW_HEIGHT)
  g.lineTo(VIEW_WIDTH / 2 - 30, VIEW_HEIGHT)
  g.closePath()
  g.fill()

  const slide = reduced ? 1 : Math.min(1, t / VS_SLAM_FRAMES)
  const travel = (1 - slide) * 220
  // The plain stance: an intro animation can start somewhere else (the Coyote under his bedroll).
  const idle = ['idle']
  drawFighterBig(
    g,
    sprites[0],
    roster[0],
    idle,
    false,
    120 - travel,
    FIGHTER_FLOOR,
    1,
    false,
  )
  drawFighterBig(
    g,
    sprites[1],
    roster[1],
    idle,
    false,
    360 + travel,
    FIGHTER_FLOOR,
    -1,
    mirror,
  )
  roster.forEach((f, side) =>
    drawText(
      g,
      f.name.toUpperCase(),
      side === 0 ? 120 : 360,
      FIGHTER_FLOOR + 6,
      {
        align: 'center',
        scale: 2,
        color: SIDE_COLOURS[side],
        shadow: '#000000',
      },
    ),
  )

  if (reduced || t >= VS_SLAM_FRAMES) {
    drawText(g, 'VS', VIEW_WIDTH / 2, 92, {
      align: 'center',
      scale: 5,
      color: '#fb7185',
      shadow: '#000000',
    })
  }
  if (!reduced && t >= VS_SLAM_FRAMES && t < VS_SLAM_FRAMES + 3) {
    // The slam: a white flash as they land.
    g.fillStyle = 'rgba(255, 255, 255, 0.6)'
    g.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)
  }

  const lines = introFor(roster[0].slug, roster[1].slug)
  const shown = vsLinesShown(t, lines.length, reduced)
  g.fillStyle = 'rgba(0, 0, 0, 0.55)'
  g.fillRect(0, LINES_TOP - 4, VIEW_WIDTH, VIEW_HEIGHT - LINES_TOP + 4)
  lines.slice(0, shown).forEach((line: MatchupLine & { side: 0 | 1 }, i) =>
    drawText(
      g,
      line.line,
      line.side === 0 ? 8 : VIEW_WIDTH - 8,
      LINES_TOP + i * 11,
      {
        align: line.side === 0 ? 'left' : 'right',
        color: SIDE_COLOURS[line.side],
        shadow: '#000000',
      },
    ),
  )
}

/** The win screen over the last frame of the match, `t` frames in; nothing for a draw. */
export function drawWinScreen(
  g: G,
  s: MatchState,
  roster: Pair<FighterData>,
  sprites: Pair<LoadedSprites | undefined>,
  t: number,
  reduced: boolean,
): void {
  g.fillStyle = 'rgba(0, 0, 0, 0.7)'
  g.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)
  const winner = s.winner
  if (winner === null || winner === 'draw') {
    drawText(g, 'DRAW GAME', VIEW_WIDTH / 2, 100, {
      align: 'center',
      scale: 3,
      color: '#fde047',
      shadow: '#000000',
    })
    return
  }
  const loser = winner === 0 ? 1 : 0
  const w = roster[winner]
  const perfect = s.fighters[winner].health >= w.health
  const poses = perfect
    ? ['perfect', 'victory_button', 'victory', 'taunt']
    : ['victory_button', 'victory', 'taunt']
  const mirror = roster[0].slug === roster[1].slug
  const rise = reduced ? 0 : Math.max(0, 12 - t)
  drawFighterBig(
    g,
    sprites[winner],
    w,
    poses,
    true,
    120,
    FIGHTER_FLOOR + rise,
    1,
    mirror && winner === 1,
  )

  drawText(g, `P${winner + 1} WINS`, 330, 36, {
    align: 'center',
    scale: 3,
    color: '#fde047',
    shadow: '#000000',
  })
  drawText(
    g,
    (perfect ? `${w.name} - PERFECT` : w.name).toUpperCase(),
    330,
    70,
    {
      align: 'center',
      color: SIDE_COLOURS[winner],
      shadow: '#000000',
    },
  )
  const quote = winQuote(w.slug, roster[loser].slug)
  wrapText(quote, 250, 1).forEach((line, i) =>
    drawText(g, line, 330, 100 + i * 12, {
      align: 'center',
      color: '#ffffff',
      shadow: '#000000',
    }),
  )
  drawText(g, `ROUNDS ${s.wins[0]} - ${s.wins[1]}`, 330, 170, {
    align: 'center',
    color: '#d6d3d1',
  })
  drawText(g, 'PRESS START FOR A REMATCH', 330, 196, {
    align: 'center',
    color: '#fdba74',
  })
}
