// /utils/zuzuShowdown/screens.ts
//
// Zuzu Showdown taunt screens (conductor zuzu-showdown t-019): the character select grid, the VS
// screen before the fight and the win screen after it. The select screen stands each side's hovered
// fighter big at its edge and the roster's busts between them. The VS screen splits warm and cool, slams both fighters in from
// the sides with a white flash, pops VS, and plays the matchup's intro exchange line by line, each on
// its speaker's side. The win screen stands the winner in their victory pose (the Perfect pose for a
// flawless win) and gives their quote to the loser. The fighters are their t-008 portraits (portraits.ts):
// the select cards their busts, the VS screen their half-body slams, the win screen the winner's victory
// portrait and the loser's beaten one; any portrait not yet drawn falls back to the fighter's own
// sprite, enlarged. Reduced motion skips the slide and the flash and shows every line at once.

import { drawText, measureText } from '../arcade/font'
import { introFor, winQuote, type MatchupLine } from './matchups'
import { drawPortrait, type LoadedPortraits } from './portraits'
import { VIEW_HEIGHT, VIEW_WIDTH } from './render'
import { SELECT_COLUMNS, activeSide, type SelectState } from './select'
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
    // No art yet: the stand-in figure of the fighter's height, its head in the light colour.
    const h = Math.min(FIGHTER_FLOOR - FIGHTER_TOP, data.hurtStand.h * 1.6)
    const head = Math.round(h * 0.2)
    g.fillStyle = data.look?.body ?? '#57534e'
    g.fillRect(x - 20, floor - h + head, 40, h - head)
    g.fillStyle = data.look?.light ?? '#a8a29e'
    g.fillRect(x - head / 2, floor - h, head, head)
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
  portraits?: LoadedPortraits,
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
  // The half-body portraits slam in, P2's turned to face P1; without one, the plain stance (an intro
  // animation can start somewhere else: the Coyote under his bedroll).
  const idle = ['idle']
  if (
    !drawPortrait(
      g,
      portraits,
      roster[0].slug,
      'vs',
      120 - travel,
      FIGHTER_FLOOR,
    )
  )
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
  if (
    !drawPortrait(
      g,
      portraits,
      roster[1].slug,
      'vs',
      360 + travel,
      FIGHTER_FLOOR,
      true,
      1,
      mirror,
    )
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
  portraits?: LoadedPortraits,
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
  if (
    !drawPortrait(
      g,
      portraits,
      w.slug,
      'victory',
      120,
      FIGHTER_FLOOR + rise,
      false,
      1,
      mirror && winner === 1,
    )
  )
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
  // The loser, small at the edge: their beaten portrait (never hurt, for the Siblings).
  drawPortrait(
    g,
    portraits,
    roster[loser].slug,
    'beaten',
    VIEW_WIDTH - 30,
    VIEW_HEIGHT - 6,
    true,
    0.45,
    mirror && loser === 1,
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

// ---------------------------------------------------------------- character select

const CARD = 50
const CARD_GAP = 6
const GRID_TOP = 64
const CURSOR_COLOURS: Pair<string> = ['#fb923c', '#38bdf8']

/** Where the select prompt sits: under the last row, however many the roster fills (the Swamp Witch
 * started a third). */
export function selectPromptY(count: number): number {
  return GRID_TOP + Math.ceil(count / SELECT_COLUMNS) * (CARD + CARD_GAP) + 4
}

/** Where the roster's `index`-th card sits on the select grid. */
export function selectCard(
  index: number,
  count: number,
): { x: number; y: number; w: number; h: number } {
  const columns = Math.min(SELECT_COLUMNS, count)
  const width = columns * CARD + (columns - 1) * CARD_GAP
  const left = (VIEW_WIDTH - width) / 2
  const col = index % SELECT_COLUMNS
  const row = Math.floor(index / SELECT_COLUMNS)
  return {
    x: left + col * (CARD + CARD_GAP),
    y: GRID_TOP + row * (CARD + CARD_GAP),
    w: CARD,
    h: CARD,
  }
}

/** A fighter's bust on a card: the idle stance, close in on the head and shoulders. */
function drawBust(
  g: G,
  sprites: LoadedSprites | undefined,
  data: FighterData,
  card: { x: number; y: number; w: number; h: number },
  p2: boolean,
  portraits?: LoadedPortraits,
): void {
  g.save()
  g.beginPath()
  g.rect(card.x, card.y, card.w, card.h)
  g.clip()
  // The bust portrait fills the card when it has been drawn.
  if (
    drawPortrait(
      g,
      portraits,
      data.slug,
      'bust',
      card.x + card.w / 2,
      card.y + card.h,
    )
  ) {
    g.restore()
    return
  }
  const sheet = sprites?.sheet
  const frame = sheet?.animations.idle?.frames[0]
  const cx = card.x + card.w / 2
  if (!sprites || !sheet || !frame) {
    // No art yet: the stand-in figure's head and shoulders in its colours.
    g.fillStyle = data.look?.body ?? '#57534e'
    g.fillRect(cx - 16, card.y + 26, 32, card.h)
    g.fillStyle = data.look?.light ?? '#a8a29e'
    g.fillRect(cx - 10, card.y + 8, 20, 18)
    g.restore()
    return
  }
  // The figure 1.6 cards tall, its feet below the card: the top half shows.
  const zoom = (card.h * 1.6) / sheet.height
  g.translate(cx, card.y + card.h * 1.55)
  g.scale(zoom, zoom)
  drawSprite(
    g,
    p2 && sprites.p2 ? sprites.p2 : sprites.image,
    frame,
    sheet.scale,
    0,
    0,
    1,
  )
  g.restore()
}

/**
 * The character select screen, `t` frames in: each side's hovered fighter big at its edge, the
 * roster's busts on a grid between them, and the two cursors. `opponentLabel` names P2's cursor
 * (2P, or CPU / DUMMY for a lone player).
 */
export function drawSelectScreen(
  g: G,
  fighters: readonly FighterData[],
  sprites: Partial<Record<string, LoadedSprites>>,
  state: SelectState,
  reduced: boolean,
  twoPlayers: boolean,
  opponentLabel = '2P',
  portraits?: LoadedPortraits,
): void {
  g.fillStyle = '#1c1917'
  g.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)
  // Warm and cool washes behind each side's fighter.
  g.fillStyle = 'rgba(234, 88, 12, 0.22)'
  g.fillRect(0, 0, 120, VIEW_HEIGHT)
  g.fillStyle = 'rgba(37, 99, 235, 0.22)'
  g.fillRect(VIEW_WIDTH - 120, 0, 120, VIEW_HEIGHT)

  drawText(g, 'CHOOSE YOUR FIGHTER', VIEW_WIDTH / 2, 14, {
    align: 'center',
    scale: 2,
    color: '#fdba74',
    shadow: '#000000',
  })

  const sides: Pair<FighterData> = [
    fighters[state.cursor[0]]!,
    fighters[state.cursor[1]]!,
  ]
  const mirror = sides[0].slug === sides[1].slug
  const idle = ['idle']
  drawFighterBig(
    g,
    sprites[sides[0].slug],
    sides[0],
    idle,
    false,
    62,
    236,
    1,
    false,
  )
  drawFighterBig(
    g,
    sprites[sides[1].slug],
    sides[1],
    idle,
    false,
    VIEW_WIDTH - 62,
    236,
    -1,
    mirror,
  )
  sides.forEach((f, side) =>
    drawText(g, f.name.toUpperCase(), side === 0 ? 62 : VIEW_WIDTH - 62, 242, {
      align: 'center',
      color: SIDE_COLOURS[side],
      shadow: '#000000',
    }),
  )

  fighters.forEach((f, index) => {
    const card = selectCard(index, fighters.length)
    g.fillStyle = '#292524'
    g.fillRect(card.x, card.y, card.w, card.h)
    drawBust(g, sprites[f.slug], f, card, false, portraits)
    g.strokeStyle = '#57534e'
    g.lineWidth = 1
    g.strokeRect(card.x + 0.5, card.y + 0.5, card.w - 1, card.h - 1)
  })

  // The cursors: a frame round each side's card, blinking until it is picked.
  const blink = reduced || state.frame % 30 < 22
  const labels: Pair<string> = ['1P', opponentLabel]
  for (const side of [0, 1] as const) {
    const picked = state.picked[side]
    if (!picked && !blink) continue
    const card = selectCard(state.cursor[side], fighters.length)
    const shared = state.cursor[0] === state.cursor[1]
    const inset = shared && side === 1 ? 3 : 0
    g.strokeStyle = CURSOR_COLOURS[side]
    g.lineWidth = picked ? 3 : 2
    g.strokeRect(
      card.x + inset - 1,
      card.y + inset - 1,
      card.w - 2 * inset + 2,
      card.h - 2 * inset + 2,
    )
    drawText(
      g,
      picked ? `${labels[side]} OK` : labels[side],
      side === 0 ? card.x + 2 : card.x + card.w - 2,
      side === 0 ? card.y + 2 : card.y + card.h - 9,
      {
        align: side === 0 ? 'left' : 'right',
        color: CURSOR_COLOURS[side],
        shadow: '#000000',
      },
    )
  }

  const prompt = twoPlayers
    ? 'LP PICKS - HP TAKES IT BACK'
    : activeSide(state) === 0
      ? 'PICK YOUR FIGHTER - LP'
      : `PICK THE OPPONENT - LP (HP GOES BACK)`
  drawText(g, prompt, VIEW_WIDTH / 2, selectPromptY(fighters.length), {
    align: 'center',
    color: '#fde047',
    shadow: '#000000',
  })
}
